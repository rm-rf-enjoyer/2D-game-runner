import Phaser from 'phaser';
import { getPaletteColor } from '../config/palette';
import { WorldManager } from '../systems/WorldManager';
import { SceneMusic } from '../systems/SceneMusic';
import { Rain } from '../objects/Rain';
import { Scenery, SceneryState } from '../objects/Scenery';
import { GAME_WIDTH, GROUND_Y, MUSIC_VOLUME, GAMEPLAY_CONFIG } from '../config/gameConfig';
import { Player } from '../objects/Player';
import { DeathCause, PLAYER_CONFIG } from '../config/playerConfig';
import { getBodyBounds } from '../utils/common';
import { rectToAabb } from '../systems/CollisionRules';
import { Phase1 } from '../phases/Phase1';
import { Phase2 } from '../phases/Phase2';
import type { UIScene } from './UIScene';

const SCENES = { GAME: 'GameScene', UI: 'UIScene', MENU: 'MenuScene' };

interface PuddleShape {
  dx: number;
  dy: number;
  width: number;
  height: number;
}

const BLOOD_RED_INDEX = 6;
const BLOOD_DARK_INDEX = 5;
const SCORE_TINT_INDEX = 14;

const BLOOD_RED_COLOR = getPaletteColor(BLOOD_RED_INDEX);
const BLOOD_DARK_COLOR = getPaletteColor(BLOOD_DARK_INDEX);

const DEATH_CONFIG = {
  restartDelay: 1500,
  soundVolume: 0.6,
};

const BLOOD_EFFECT_CONFIG = {
  particleCount: 25,
  puddleDelay: 400,
  particle: {
    lifespan: 600,
    speedX: { min: -120, max: 120 },
    speedY: { min: -200, max: -50 },
    gravityY: 800,
    scale: 1,
    depth: 10,
  },
  puddleParticles: {
    lifespan: 700,
    speedX: { min: -25, max: 25 },
    speedY: { min: -10, max: 20 },
    gravityY: 300,
    scale: 3,
    countPerShape: 8,
    cleanupDelay: 100,
  },
  puddle: {
    depth: 3,
    yOffset: 12,
    red: [
      { dx: -8, dy: -2, width: 16, height: 2 },
      { dx: -5, dy: -3, width: 10, height: 1 },
      { dx: -10, dy: -1, width: 4, height: 1 },
      { dx: 7, dy: -1, width: 3, height: 1 },
    ] as PuddleShape[],
    dark: [
      { dx: -9, dy: 0, width: 3, height: 1 },
      { dx: 7, dy: 0, width: 2, height: 1 },
      { dx: -2, dy: 1, width: 4, height: 1 },
    ] as PuddleShape[],
  },
};

export class GameScene extends Phaser.Scene {
  private isDead: boolean = false;
  private distance: number = 0;
  private finalDistance: number = 0;
  private jumpPointerId: number | null = null;

  private world!: WorldManager;
  private player!: Player;
  private scenery!: Scenery;
  private rain!: Rain;
  private scoreText!: Phaser.GameObjects.BitmapText;

  private readonly music = new SceneMusic({
    key: 'music-game',
    volume: MUSIC_VOLUME,
    stopKeys: ['music-menu'],
  });

  private readonly onPointerDown = (pointer: Phaser.Input.Pointer): void => {
    const split = GAME_WIDTH * GAMEPLAY_CONFIG.input.splitRatio;
    if (pointer.x < split) {
      this.jumpPointerId = pointer.id;
      this.player.pressJump();
      return;
    }

    if (this.world.triggerDash(this.time.now)) {
      this.player.dash();
    }
  };

  private readonly onPointerRelease = (pointer: Phaser.Input.Pointer): void => {
    if (pointer.id === this.jumpPointerId) {
      this.jumpPointerId = null;
      this.player.releaseJump();
    }
  };

  private readonly onKeyDownSpace = (): void => this.player.pressJump();
  private readonly onKeyUpSpace = (): void => this.player.releaseJump();
  private readonly onKeyDownShift = (): void => {
    if (this.world.triggerDash(this.time.now)) {
      this.player.dash();
    }
  };

  constructor() {
    super(SCENES.GAME);
  }

  public create(data: { scenery?: SceneryState } = {}): void {
    this.isDead = false;
    this.distance = 0;

    this._setupPlayer();
    this._createWorld();
    this._setupInput();
    this._setupScenery(data.scenery);
    this._setupRain();
    this._setupAudio();
    this._setupUI();
    this._setupEvents();
  }

  public update(_time: number, delta: number): void {
    const currentSpeed = this._getCurrentSpeed();
    this.rain.update(delta, currentSpeed, this.world.isDashActive);

    if (this.isDead) return;

    this._updateEntities(delta);
    this._handleCollisions();
    this._handlePitFall();

    if (this.isDead) return;

    this._updateScore(currentSpeed, delta);
  }

  private _setupPlayer(): void {
    this.player = new Player({
      scene: this,
      x: GAMEPLAY_CONFIG.playerStartX,
      y: GROUND_Y - GAMEPLAY_CONFIG.playerYOffset,
      getWorldSpeed: () => this.world.speed,
    });
  }

  private _createWorld(): void {
    const physicsGroup = this.physics.add.staticGroup();
    const phase1 = new Phase1(this, GROUND_Y, physicsGroup);
    phase1.init();

    const phase2 = new Phase2(this, GROUND_Y, physicsGroup, {
      startX: phase1.nextX,
      onComplete: () => this._handleLevelComplete(),
    });
    phase2.init();

    this.world = new WorldManager([phase1, phase2]);
    this.physics.add.collider(this.player.sprite, physicsGroup);
  }

  private _setupInput(): void {
    this.jumpPointerId = null;

    this.input.on('pointerdown', this.onPointerDown);
    this.input.on('pointerup', this.onPointerRelease);
    this.input.on('pointerupoutside', this.onPointerRelease);

    this.input.keyboard?.on('keydown-SPACE', this.onKeyDownSpace);
    this.input.keyboard?.on('keyup-SPACE', this.onKeyUpSpace);
    this.input.keyboard?.on('keydown-SHIFT', this.onKeyDownShift);
  }

  private _removeInputListeners(): void {
    this.input.off('pointerdown', this.onPointerDown);
    this.input.off('pointerup', this.onPointerRelease);
    this.input.off('pointerupoutside', this.onPointerRelease);

    this.input.keyboard?.off('keydown-SPACE', this.onKeyDownSpace);
    this.input.keyboard?.off('keyup-SPACE', this.onKeyUpSpace);
    this.input.keyboard?.off('keydown-SHIFT', this.onKeyDownShift);

    this.jumpPointerId = null;
  }

  private _setupScenery(state?: SceneryState): void {
    this.scenery = new Scenery(this, 'game', state);
  }

  private _setupRain(): void {
    this.rain = new Rain(this, 'game');
  }

  private _setupAudio(): void {
    this.music.start(this.sound);
  }

  private _setupUI(): void {
    const score = GAMEPLAY_CONFIG.score;
    this.scoreText = this.add
      .bitmapText(score.x, score.y, 'pixel-font', score.initialText, score.fontSize)
      .setScale(score.scale)
      .setTint(getPaletteColor(SCORE_TINT_INDEX))
      .setDepth(score.depth);

    this.scene.launch(SCENES.UI);
  }

  private _setupEvents(): void {
    this.game.events.on('app-paused', this._onAppPaused, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off('app-paused', this._onAppPaused, this);
      this._removeInputListeners();
      this.music.stop();
    });
  }

  private _getCurrentSpeed(): number {
    return this.world.speed;
  }

  private _updateEntities(delta: number): void {
    this.world.update(delta);
    this.scenery.update(delta, this.world.speed);
    this.player.update(delta);
  }

  private _handleCollisions(): void {
    const playerBody = this.player.sprite.body as Phaser.Physics.Arcade.Body;
    const cause = this.world.getWallCollisionCause(rectToAabb(getBodyBounds(playerBody)));
    if (!cause) return;

    this.finalDistance = this.distance;
    this._onHit(cause);
  }

  private _handlePitFall(): void {
    const playerHalfHeight = PLAYER_CONFIG.bodySize.height / 2;
    const playerBottomY = this.player.sprite.y + playerHalfHeight;

    if (playerBottomY > GROUND_Y + GAMEPLAY_CONFIG.pitFallTolerance) {
      this.finalDistance = this.distance;
      this._onHit('pit');
    }
  }

  private _updateScore(currentSpeed: number, delta: number): void {
    const seconds = delta / GAMEPLAY_CONFIG.msPerSecond;
    this.distance += (currentSpeed * seconds) / GAMEPLAY_CONFIG.pixelsPerMeter;
    this._renderScore(this.distance);
  }

  private _renderScore(distance: number): void {
    this.scoreText.setText(Math.floor(distance) + ' m');
  }

  private _handleLevelComplete(): void {
    if (this.isDead) return;
    this._goToMenu();
  }

  private _onHit(cause: DeathCause): void {
    if (this.isDead) return;
    this.isDead = true;

    this._stopGameplay();
    this.player.die(cause);
    this._renderScore(this.finalDistance);

    this._spawnBloodEffect();
    if (cause === 'object') {
      this.time.delayedCall(BLOOD_EFFECT_CONFIG.puddleDelay, () => {
        if (this.isDead) this._spawnBloodPuddleEffect();
      });
    }

    this.time.delayedCall(DEATH_CONFIG.restartDelay, () => this._goToMenu());
  }

  private _stopGameplay(): void {
    this.sound.play('sfx-death', { volume: DEATH_CONFIG.soundVolume });
    this._removeInputListeners();
    this.music.stop();
  }

  private _spawnBloodEffect(): void {
    const effect = BLOOD_EFFECT_CONFIG.particle;
    const blood = this._createBloodParticles(
      this.player.sprite.x,
      this.player.sprite.y,
      effect,
      effect.depth
    );
    blood.explode(BLOOD_EFFECT_CONFIG.particleCount);
  }

  private _getBloodOrigin(): { x: number; y: number } {
    const puddle = BLOOD_EFFECT_CONFIG.puddle;
    return {
      x: Math.round(this.player.sprite.x),
      y: Math.round(this.player.sprite.y + puddle.yOffset),
    };
  }

  private _spawnBloodPuddleEffect(): void {
    const puddle = BLOOD_EFFECT_CONFIG.puddle;
    const settings = BLOOD_EFFECT_CONFIG.puddleParticles;
    const origin = this._getBloodOrigin();
    const blood = this._createBloodParticles(origin.x, origin.y, settings, puddle.depth);

    [...puddle.red, ...puddle.dark].forEach((shape) => {
      blood.explode(
        settings.countPerShape,
        origin.x + shape.dx + shape.width / 2,
        origin.y + shape.dy + shape.height / 2
      );
    });

    this.time.delayedCall(settings.lifespan + settings.cleanupDelay, () => blood.destroy());
  }

  private _createBloodParticles(
    x: number,
    y: number,
    config: {
      lifespan: number;
      speedX: { min: number; max: number };
      speedY: { min: number; max: number };
      gravityY: number;
      scale: number;
    },
    depth: number
  ): Phaser.GameObjects.Particles.ParticleEmitter {
    return this.add
      .particles(x, y, 'pixel-particle', {
        lifespan: config.lifespan,
        speedX: config.speedX,
        speedY: config.speedY,
        gravityY: config.gravityY,
        scale: config.scale,
        tint: [BLOOD_RED_COLOR, BLOOD_DARK_COLOR],
        emitting: false,
      })
      .setDepth(depth);
  }

  private _goToMenu(): void {
    this.scene.stop(SCENES.UI);
    this.scene.start(SCENES.MENU, { scenery: this.scenery.getState() });
  }

  private _onAppPaused(): void {
    if (this.isDead) return;
    if (!this.scene.isActive(SCENES.GAME)) return;

    this.scene.pause(SCENES.GAME);
    const uiScene = this.scene.get(SCENES.UI) as UIScene | null;
    uiScene?.openPause();
  }
}
