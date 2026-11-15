import Phaser from 'phaser';
import { WorldManager } from '../systems/WorldManager.js';
import { ParallaxBackground } from '../objects/parallaxBackground.js';
import { GAME_WIDTH, GAME_HEIGHT, MUSIC_VOLUME } from '../config/gameConfig.js';
import { Player } from '../objects/player.js';
import { Foreground } from '../objects/Foreground.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    this.isDead = false;
    this.distance = 0;
    this.PIXELS_PER_METER = 10;

    this.world = new WorldManager(this);
    this.phase = 1;

    const groundTopY = GAME_HEIGHT - 64;
    this.player = new Player(this, 100, groundTopY - 12, 130);

    // Коллизия нужна ТОЛЬКО для того, чтобы игрок стоял на платформах.
    // Никаких проверок на смерть здесь больше нет!
    this.physics.add.collider(this.player.sprite, this.world.physicsGroup);

    // ОДИН обработчик столкновения с ящиком (смерть на платформе)
    this.physics.add.overlap(this.player.sprite, this.world.trashGroup, () => {
      if (!this.isDead) {
        this.finalDistance = this.distance;
        this._onHit('ground'); 
      }
    });

    this.input.on('pointerdown', (pointer) => {
      if (pointer.x < GAME_WIDTH / 2) this.player.jump();
      else this.player.dash();
    });
    this.input.keyboard.on('keydown-SPACE', () => this.player.jump());

    this.bg = new ParallaxBackground(this);
    this.fg = new Foreground(this);

    const menuMusic = this.sound.get('music-menu');
    if (menuMusic && menuMusic.isPlaying) menuMusic.stop();

    this.music = this.sound.add('music-game', { loop: true, volume: MUSIC_VOLUME });
    this.music.play();

    this.scoreText = this.add.bitmapText(10, 10, 'pixel-font', '0 m', 14)
      .setScale(1).setTint(0xe0bd51).setDepth(100);

    this.scene.launch('UIScene');

    this.events.on('dash', (duration, speed) => {
      const distance = (speed * duration) / 1000;
      this.world.burst(distance, duration);
      this.bg.burst(distance, duration);
    });

        // Слушаем событие сворачивания приложения
    this.game.events.on('app-paused', this._onAppPaused, this);

    // Отписываемся при выходе из сцены
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    this.game.events.off('app-paused', this._onAppPaused, this);
    });
  }

  update(time, delta) {
    if (this.isDead) return;

    const currentSpeed = this.world.speed + (this.world.burstRemaining > 0 ? this.world.burstPerSecond : 0);

    this.world.update(delta);
    this.bg.update(delta, this.world.speed);
    this.fg.update(delta, currentSpeed);
    this.player.update();

    // --- ПРОВЕРКА УДАРА ОБ ТОРЕЦ ПЛАТФОРМЫ (Точная проверка) ---
    const pBody = this.player.sprite.body;
    
    for (let i = 0; i < this.world.currentPhase.platforms.length; i++) {
      const p = this.world.currentPhase.platforms[i];
      const platBody = p.body.body;

      if (Phaser.Geom.Intersects.RectangleToRectangle(
          new Phaser.Geom.Rectangle(pBody.x, pBody.y, pBody.width, pBody.height),
          new Phaser.Geom.Rectangle(platBody.x, platBody.y, platBody.width, platBody.height)
      )) {
        if (pBody.bottom > platBody.top + 2 && pBody.right > platBody.left) {
          this.finalDistance = this.distance;
          this._onHit('wall'); 
          return;
        }
      }
    }

    // --- ПРОВЕРКА ПАДЕНИЯ В ПРОПАСТЬ ---
    const groundTopY = GAME_HEIGHT - 32;
    const playerBottomY = this.player.sprite.y + 12;

    if (playerBottomY > groundTopY + 50) {
      this.finalDistance = this.distance;
      this._onHit('pit');
      return;
    }

    // Счёт
    this.distance += (currentSpeed * (delta / 1000)) / this.PIXELS_PER_METER;
    this.scoreText.setText(Math.floor(this.distance) + ' m');

    if (this.distance >= 200 && this.phase === 1) {
      this.phase = 2;
      this.world.setPhase(2);
      this.cameras.main.flash(300, 69, 235, 243, false);
    }

    if (this.distance >= 400 && this.phase === 2) {
      this.phase = 3;
      this.world.setPhase(3);
      this.cameras.main.flash(300, 69, 235, 243, false);
    }
  }

  _onHit(cause = 'pit') {
    if (this.isDead) return;
    this.isDead = true;

    this.sound.play('sfx-death', { volume: 0.6 });
    this.input.removeAllListeners('pointerdown');
    this.input.keyboard.removeAllListeners('keydown-SPACE');
    this.music.stop();
    
    this.player.die(cause); 

    this.scoreText.setText(Math.floor(this.finalDistance) + ' m');

    // --- БРЫЗГИ КРОВИ ---
    const bloodParticles = this.add.particles(
      this.player.sprite.x,
      this.player.sprite.y,
      'pixel-particle',
      {
        lifespan: 600, 
        speedX: { min: -120, max: 120 },
        speedY: { min: -200, max: -50 }, 
        gravityY: 800, 
        scale: 1, 
        quantity: 25, 
        emitting: false,
        tint: [0xB3202A, 0x702359], 
        roundPixels: true,
      }
    ).setDepth(10);
    bloodParticles.explode(25);

    // --- ЛУЖА (ТОЛЬКО ЕСЛИ УМЕР НА ЗЕМЛЕ) ---
    if (cause === 'ground') {
      const px = Math.round(this.player.sprite.x);
      const py = Math.round(this.player.sprite.y + 12);

      const puddle = this.add.graphics();
      puddle.fillStyle(0xB3202A, 1);
      puddle.fillRect(px - 16, py - 2, 32, 2);
      puddle.fillRect(px - 10, py - 3, 20, 1);
      puddle.fillRect(px - 20, py - 1, 6, 1);
      puddle.fillRect(px + 14, py - 1, 8, 1);

      puddle.fillStyle(0x702359, 1);
      puddle.fillRect(px - 18, py, 4, 1);
      puddle.fillRect(px + 14, py, 6, 1);
      puddle.fillRect(px - 4, py + 1, 8, 1);

      puddle.setDepth(3);
    }

    this.time.delayedCall(1500, () => {
      this.scene.stop('UIScene');
      this.scene.start('MenuScene');
    });
  }

  _onAppPaused() {
    if (this.isDead) return;

    // Если игра активна и мы еще не на паузе
    if (this.scene.isActive('GameScene')) {
      this.scene.pause('GameScene');
      
      const uiScene = this.scene.get('UIScene');
      if (uiScene && uiScene.openPause) {
        uiScene.openPause();
      }
    }
  }
}
