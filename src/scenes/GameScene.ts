import Phaser from 'phaser';
import { getPaletteColor } from '../config/palette';
import { WorldManager } from '../systems/WorldManager';
import { Rain } from '../objects/Rain';
import { Scenery, SceneryState } from '../objects/Scenery';
import {
  GAME_WIDTH,
  GROUND_Y,
  MUSIC_VOLUME,
  GAMEPLAY_CONFIG
} from '../config/gameConfig';
import { Player } from '../objects/Player';
import { DeathCause, PLAYER_CONFIG } from '../config/playerConfig';
import { UIScene } from './UIScene';

interface PuddleShape {
  dx: number;
  dy: number;
  width: number;
  height: number;
}

const BLOOD_RED_INDEX = 8;
const BLOOD_DARK_INDEX = 7;

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
  private music!: Phaser.Sound.BaseSound;
  private scoreText!: Phaser.GameObjects.BitmapText;

  constructor() {
    super('GameScene');
  }

  public create(data: { scenery?: SceneryState } = {}): void {
    this.isDead = false;
    this.distance = 0;

    this.world = new WorldManager(this, {
      onLevelComplete: () => this._handleLevelComplete(),
    });

    this._setupPlayer();
    this._setupCollisions();
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
      getWorldSpeed: () => this.world.speed
    });
  }

  private _setupCollisions(): void {
    this.physics.add.collider(this.player.sprite, this.world.physicsGroup);
  }

  private _setupInput(): void {
    this.jumpPointerId = null;

    const tryDash = () => {
      if (this.world.triggerDash()) {
        this.player.dash();
      }
    };

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const split = GAME_WIDTH * GAMEPLAY_CONFIG.input.splitRatio;
      if (pointer.x < split) {
        this.jumpPointerId = pointer.id;
        this.player.pressJump();
        return;
      }

      tryDash();
    });

    const releaseJumpPointer = (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === this.jumpPointerId) {
        this.jumpPointerId = null;
        this.player.releaseJump();
      }
    };

    this.input.on('pointerup', releaseJumpPointer);
    this.input.on('pointerupoutside', releaseJumpPointer);

    this.input.keyboard?.on('keydown-SPACE', () => this.player.pressJump());
    this.input.keyboard?.on('keyup-SPACE', () => this.player.releaseJump());
    this.input.keyboard?.on('keydown-SHIFT', tryDash);
  }

  private _setupScenery(state?: SceneryState): void {
    this.scenery = new Scenery(this, 'game', state);
  }

  private _setupRain(): void {
    this.rain = new Rain(this, 'game');
  }

  private _setupAudio(): void {
    this.sound.stopByKey('music-menu');
    this.music = this.sound.add('music-game', {
      loop: true,
      volume: MUSIC_VOLUME
    });
    this.music.play();
  }

  private _setupUI(): void {
    const score = GAMEPLAY_CONFIG.score;
    this.scoreText = this.add.bitmapText(
      score.x,
      score.y,
      'pixel-font',
      score.initialText,
      score.fontSize
    )
      .setScale(score.scale)
      .setTint(score.tint)
      .setDepth(score.depth);

    this.scene.launch('UIScene');
  }

  private _setupEvents(): void {
    this.game.events.on('app-paused', this._onAppPaused, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off('app-paused', this._onAppPaused, this);
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
    const cause = this.world.getWallCollisionCause(playerBody);
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
    if (cause === 'obstacle') {
      this._scheduleWhileDead(() => this._drawBloodPuddle());
    }
    if (cause === 'object') {
      this._scheduleWhileDead(() => this._spawnBloodPuddleEffect());
    }

    this.time.delayedCall(DEATH_CONFIG.restartDelay, () => this._restartGame());
  }

  private _stopGameplay(): void {
    this.sound.play('sfx-death', { volume: DEATH_CONFIG.soundVolume });
    this.input.removeAllListeners('pointerdown');
    const keys = ['keydown-SPACE', 'keydown-SHIFT'];
    keys.forEach(key => this.input.keyboard?.removeAllListeners(key));
    this.music.stop();
  }

  private _spawnBloodEffect(): void {
    const effect = BLOOD_EFFECT_CONFIG.particle;
    const blood = this.add.particles(
      this.player.sprite.x,
      this.player.sprite.y,
      'pixel-particle',
      {
        lifespan: effect.lifespan,
        speedX: effect.speedX,
        speedY: effect.speedY,
        gravityY: effect.gravityY,
        scale: effect.scale,
        quantity: BLOOD_EFFECT_CONFIG.particleCount,
        emitting: false,
        tint: [BLOOD_RED_COLOR, BLOOD_DARK_COLOR],
        roundPixels: true,
      }
    ).setDepth(effect.depth);

    blood.explode(BLOOD_EFFECT_CONFIG.particleCount);
  }

  private _scheduleWhileDead(callback: () => void): void {
    this.time.delayedCall(BLOOD_EFFECT_CONFIG.puddleDelay, () => {
      if (!this.isDead) return;
      callback();
    });
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
    const blood = this.add.particles(origin.x, origin.y, 'pixel-particle', {
      lifespan: settings.lifespan,
      speedX: settings.speedX,
      speedY: settings.speedY,
      gravityY: settings.gravityY,
      scale: settings.scale,
      tint: [BLOOD_RED_COLOR, BLOOD_DARK_COLOR],
      emitting: false,
      roundPixels: true,
    }).setDepth(puddle.depth);

    [...puddle.red, ...puddle.dark].forEach(shape => {
      blood.explode(
        settings.countPerShape,
        origin.x + shape.dx + shape.width / 2,
        origin.y + shape.dy + shape.height / 2
      );
    });

    this.time.delayedCall(
      settings.lifespan + settings.cleanupDelay,
      () => blood.destroy()
    );
  }

  private _drawBloodPuddle(): void {
    const puddle = BLOOD_EFFECT_CONFIG.puddle;
    const origin = this._getBloodOrigin();
    const graphics = this.add.graphics().setDepth(puddle.depth);

    this._fillPuddleShapes(graphics, origin, puddle.red, BLOOD_RED_COLOR);
    this._fillPuddleShapes(graphics, origin, puddle.dark, BLOOD_DARK_COLOR);
  }

  private _fillPuddleShapes(
    graphics: Phaser.GameObjects.Graphics,
    origin: { x: number; y: number },
    shapes: PuddleShape[],
    color: number
  ): void {
    graphics.fillStyle(color, 1);
    shapes.forEach(shape => {
      graphics.fillRect(
        origin.x + shape.dx,
        origin.y + shape.dy,
        shape.width,
        shape.height
      );
    });
  }

  private _goToMenu(): void {
    this.scene.start('MenuScene', { scenery: this.scenery.getState() });
  }

  private _restartGame(): void {
    this.scene.stop('UIScene');
    this._goToMenu();
  }

  private _onAppPaused(): void {
    if (this.isDead) return;

    if (this.scene.isActive('GameScene')) {
      this.scene.pause('GameScene');
      const uiScene = this.scene.get('UIScene');
      if (uiScene instanceof UIScene) {
        uiScene.openPause();
      }
    }
  }
}
