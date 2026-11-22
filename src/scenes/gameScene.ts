import Phaser from 'phaser';
import paletteSource from '../assets/bg/palette.gpl?raw';
import { WorldManager } from '../systems/WorldManager';
import { ParallaxBackground } from '../objects/ParallaxBackground';
import { GAME_WIDTH, GAME_HEIGHT, MUSIC_VOLUME, GAMEPLAY_CONFIG } from '../config/gameConfig';
import { Player } from '../objects/player';
import { Foreground } from '../objects/Foreground';
import { DeathCause, PLAYER_CONFIG } from '../config/playerConfig';

interface PuddleShape {
  dx: number;
  dy: number;
  width: number;
  height: number;
}

const PALETTE_COLOR_PATTERN = /^\s*(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})\s/;
const BLOOD_RED_INDEX = 8;
const BLOOD_DARK_INDEX = 7;

const paletteColors: number[] = paletteSource
  .split('\n')
  .map(line => line.match(PALETTE_COLOR_PATTERN))
  .filter((match): match is RegExpMatchArray => match !== null)
  .map(match => (Number(match[1]) << 16) | (Number(match[2]) << 8) | Number(match[3]));

const BLOOD_RED_COLOR = paletteColors[BLOOD_RED_INDEX];
const BLOOD_DARK_COLOR = paletteColors[BLOOD_DARK_INDEX];

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

  private world!: WorldManager;
  private player!: Player;
  private bg!: ParallaxBackground;
  private fg!: Foreground;
  private music!: Phaser.Sound.BaseSound;
  private scoreText!: Phaser.GameObjects.BitmapText;

  constructor() {
    super('GameScene');
  }

  public create(): void {
    this.isDead = false;
    this.distance = 0;

    this.world = new WorldManager(this, {
      onLevelComplete: () => this._handleLevelComplete(),
    });

    this._setupPlayer();
    this._setupCollisions();
    this._setupInput();
    this._setupBackgrounds();
    this._setupAudio();
    this._setupUI();
    this._setupEvents();
  }

  public update(_time: number, delta: number): void {
    if (this.isDead) return;

    const currentSpeed = this._getCurrentSpeed();

    this._updateEntities(delta);
    this._handleCollisions();
    this._handlePitFall();

    if (this.isDead) return;

    this._updateScore(currentSpeed, delta);
  }

  private _setupPlayer(): void {
    const groundTopY = GAME_HEIGHT - GAMEPLAY_CONFIG.groundOffset;
    this.player = new Player(
      this,
      GAMEPLAY_CONFIG.playerStartX,
      groundTopY - GAMEPLAY_CONFIG.playerYOffset,
      GAMEPLAY_CONFIG.worldSpeed
    );
  }

  private _setupCollisions(): void {
    this.physics.add.collider(this.player.sprite, this.world.physicsGroup);
  }

  private _setupInput(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.x < GAME_WIDTH * GAMEPLAY_CONFIG.input.splitRatio) {
        this.player.jump();
        return;
      }

      if (this.world.triggerDash()) {
        this.player.dash();
      }
    });

    this.input.keyboard?.on('keydown-SPACE', () => this.player.jump());
    this.input.keyboard?.on('keydown-SHIFT', () => {
      if (this.world.triggerDash()) {
        this.player.dash();
      }
    });
  }

  private _setupBackgrounds(): void {
    this.bg = new ParallaxBackground(this);
    this.fg = new Foreground(this);
  }

  private _setupAudio(): void {
    this.sound.stopByKey('music-menu');
    this.music = this.sound.add('music-game', { loop: true, volume: MUSIC_VOLUME });
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
    this.bg.update(delta, this.world.speed);
    this.fg.update(delta, this.world.speed);
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
    const groundTopY = GAME_HEIGHT - GAMEPLAY_CONFIG.groundOffset;
    const playerHalfHeight = PLAYER_CONFIG.bodySize.height / 2;
    const playerBottomY = this.player.sprite.y + playerHalfHeight;

    if (playerBottomY > groundTopY + GAMEPLAY_CONFIG.pitFallTolerance) {
      this.finalDistance = this.distance;
      this._onHit('pit');
    }
  }

  private _updateScore(currentSpeed: number, delta: number): void {
    const seconds = delta / GAMEPLAY_CONFIG.msPerSecond;
    this.distance += (currentSpeed * seconds) / GAMEPLAY_CONFIG.pixelsPerMeter;
    this.scoreText.setText(Math.floor(this.distance) + ' m');
  }

  private _handleLevelComplete(): void {
    if (this.isDead) return;
    this.scene.start('MenuScene');
  }

  private _onHit(cause: DeathCause): void {
    if (this.isDead) return;
    this.isDead = true;

    this._stopGameplay();
    this.player.die(cause);
    this.scoreText.setText(Math.floor(this.finalDistance) + ' m');

    this._spawnBloodEffect();
    if (cause === 'obstacle') {
      this._scheduleBloodPuddle();
    }

    this.time.delayedCall(DEATH_CONFIG.restartDelay, () => this._restartGame());
  }

  private _stopGameplay(): void {
    this.sound.play('sfx-death', { volume: DEATH_CONFIG.soundVolume });
    this.input.removeAllListeners('pointerdown');
    this.input.keyboard?.removeAllListeners('keydown-SPACE');
    this.input.keyboard?.removeAllListeners('keydown-SHIFT');
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

  private _scheduleBloodPuddle(): void {
    this.time.delayedCall(BLOOD_EFFECT_CONFIG.puddleDelay, () => {
      if (!this.isDead) return;
      this._drawBloodPuddle();
    });
  }

  private _drawBloodPuddle(): void {
    const puddle = BLOOD_EFFECT_CONFIG.puddle;
    const origin = {
      x: Math.round(this.player.sprite.x),
      y: Math.round(this.player.sprite.y + puddle.yOffset),
    };
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

  private _restartGame(): void {
    this.scene.stop('UIScene');
    this.scene.start('MenuScene');
  }

  private _onAppPaused(): void {
    if (this.isDead) return;

    if (this.scene.isActive('GameScene')) {
      this.scene.pause('GameScene');
      const uiScene = this.scene.get('UIScene');
      if (uiScene && (uiScene as any).openPause) {
        (uiScene as any).openPause();
      }
    }
  }
}
