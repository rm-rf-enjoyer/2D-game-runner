import Phaser from 'phaser';
import { WorldManager } from '../systems/WorldManager';
import { ParallaxBackground } from '../objects/ParallaxBackground';
import { GAME_WIDTH, GAME_HEIGHT, MUSIC_VOLUME } from '../config/gameConfig';
import { Player } from '../objects/player';
import { Foreground } from '../objects/Foreground';
import { DeathCause } from '../config/playerConfig';

// Все магические числа в одном месте (Правило 2)
const GAME_CONFIG = {
  pixelsPerMeter: 10,
  playerStartX: 100,
  playerYOffset: 14,
  worldSpeed: 130,
  wallCollisionTolerance: 8,
  pitFallTolerance: 50,
  phase2Distance: 200,
  phase3Distance: 400,
  deathRestartDelay: 1500,
  bloodParticleCount: 25,
};

export class GameScene extends Phaser.Scene {
  private isDead: boolean = false;
  private distance: number = 0;
  private finalDistance: number = 0;
  private phase: number = 1;

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
    this.phase = 1;

    this.world = new WorldManager(this);
    
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

    this._updateEntities(delta, currentSpeed);
    this._handleCollisions();
    this._handlePitFall();
    
    if (this.isDead) return;

    this._updateScore(currentSpeed, delta);
    this._checkPhaseTransition();
  }

  // --- SETUP METHODS ---

  private _setupPlayer(): void {
    const groundTopY = GAME_HEIGHT - 64;
    this.player = new Player(
      this, 
      GAME_CONFIG.playerStartX, 
      groundTopY - GAME_CONFIG.playerYOffset, 
      GAME_CONFIG.worldSpeed
    );
  }

  private _setupCollisions(): void {
    this.physics.add.collider(this.player.sprite, this.world.physicsGroup);
    
    this.physics.add.overlap(this.player.sprite, this.world.trashGroup, () => {
      if (!this.isDead) {
        this.finalDistance = this.distance;
        this._onHit('ground'); 
      }
    });
  }

  private _setupInput(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.x < GAME_WIDTH / 2) this.player.jump();
      else this.player.dash();
    });
    this.input.keyboard?.on('keydown-SPACE', () => this.player.jump());
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
    this.scoreText = this.add.bitmapText(10, 10, 'pixel-font', '0 m', 14)
      .setScale(1)
      .setTint(0xe0bd51)
      .setDepth(100);

    this.scene.launch('UIScene');
  }

  private _setupEvents(): void {
    this.events.on('dash', (duration: number, speed: number) => {
      const distance = (speed * duration) / 1000;
      this.world.burst(distance, duration);
      this.bg.burst(distance, duration);
    });

    this.game.events.on('app-paused', this._onAppPaused, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off('app-paused', this._onAppPaused, this);
    });
  }

  // --- UPDATE LOGIC ---

  private _getCurrentSpeed(): number {
    return this.world.speed + (this.world.burstRemaining > 0 ? this.world.burstPerSecond : 0);
  }

  private _updateEntities(delta: number, currentSpeed: number): void {
    this.world.update(delta);
    this.bg.update(delta, this.world.speed);
    this.fg.update(delta, currentSpeed);
    this.player.update();
  }

  private _handleCollisions(): void {
    const pBody = this.player.sprite.body;
    
    for (const p of this.world.currentPhase.platforms) {
      const platBody = p.body.body;

      if (Phaser.Geom.Intersects.RectangleToRectangle(
          new Phaser.Geom.Rectangle(pBody.x, pBody.y, pBody.width, pBody.height),
          new Phaser.Geom.Rectangle(platBody.x, platBody.y, platBody.width, platBody.height)
      )) {
        if (pBody.bottom > platBody.top + GAME_CONFIG.wallCollisionTolerance && pBody.right > platBody.left) {
          this.finalDistance = this.distance;
          this._onHit('wall'); 
          return;
        }
      }
    }
  }

  private _handlePitFall(): void {
    const groundTopY = GAME_HEIGHT - 64;
    const playerBottomY = this.player.sprite.y + 12;

    if (playerBottomY > groundTopY + GAME_CONFIG.pitFallTolerance) {
      this.finalDistance = this.distance;
      this._onHit('pit');
    }
  }

  private _updateScore(currentSpeed: number, delta: number): void {
    this.distance += (currentSpeed * (delta / 1000)) / GAME_CONFIG.pixelsPerMeter;
    this.scoreText.setText(Math.floor(this.distance) + ' m');
  }

  private _checkPhaseTransition(): void {
    if (this.distance >= GAME_CONFIG.phase2Distance && this.phase === 1) {
      this.phase = 2;
      this.world.setPhase(2);
      this.cameras.main.flash(300, 69, 235, 243, false);
    } else if (this.distance >= GAME_CONFIG.phase3Distance && this.phase === 2) {
      this.phase = 3;
      this.world.setPhase(3);
      this.cameras.main.flash(300, 69, 235, 243, false);
    }
  }

  // --- DEATH LOGIC ---

  private _onHit(cause: DeathCause): void {
    if (this.isDead) return;
    this.isDead = true;

    this._stopGameplay();
    this.player.die(cause); 
    this.scoreText.setText(Math.floor(this.finalDistance) + ' m');

    this._spawnBloodEffect();
    if (cause === 'ground') {
      this._drawBloodPuddle();
    }

    this.time.delayedCall(GAME_CONFIG.deathRestartDelay, () => this._restartGame());
  }

  private _stopGameplay(): void {
    this.sound.play('sfx-death', { volume: 0.6 });
    this.input.removeAllListeners('pointerdown');
    this.input.keyboard?.removeAllListeners('keydown-SPACE');
    this.music.stop();
  }

  private _spawnBloodEffect(): void {
    const blood = this.add.particles(
      this.player.sprite.x, this.player.sprite.y, 'pixel-particle',
      {
        lifespan: 600, 
        speedX: { min: -120, max: 120 },
        speedY: { min: -200, max: -50 }, 
        gravityY: 800, 
        scale: 1, 
        quantity: GAME_CONFIG.bloodParticleCount, 
        emitting: false,
        tint: [0xB3202A, 0x702359], 
        roundPixels: true,
      }
    ).setDepth(10);
    blood.explode(GAME_CONFIG.bloodParticleCount);
  }

  private _drawBloodPuddle(): void {
    const px = Math.round(this.player.sprite.x);
    const py = Math.round(this.player.sprite.y + 12);

    const puddle = this.add.graphics().setDepth(3);
    puddle.fillStyle(0xB3202A, 1);
    puddle.fillRect(px - 16, py - 2, 32, 2);
    puddle.fillRect(px - 10, py - 3, 20, 1);
    puddle.fillRect(px - 20, py - 1, 6, 1);
    puddle.fillRect(px + 14, py - 1, 8, 1);

    puddle.fillStyle(0x702359, 1);
    puddle.fillRect(px - 18, py, 4, 1);
    puddle.fillRect(px + 14, py, 6, 1);
    puddle.fillRect(px - 4, py + 1, 8, 1);
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
