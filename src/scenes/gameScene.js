import Phaser from 'phaser';
import { Ground } from '../objects/ground.js';
import { ParallaxBackground } from '../objects/parallaxBackground.js';
import { GAME_WIDTH, GAME_HEIGHT, MUSIC_VOLUME } from '../config/gameConfig.js';
import { Player } from '../objects/player.js';
// import { EnemySpawner } from '../systems/enemySpawner.js';   // временно выключено

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    const TOTAL_GROUND_HEIGHT = 96;

    this.isDead = false;
    this.distance = 0;
    this.PIXELS_PER_METER = 96;
    this.elapsed = 0;

    // ЗЕМЛЯ
    this.ground = new Ground(this);

    // ИГРОК
    const playerSpriteHeight = 192;
    this.player = new Player(
      this,
      300,
      GAME_HEIGHT - TOTAL_GROUND_HEIGHT - playerSpriteHeight / 2,
      this.ground.speed
    );

    // КОЛЛИЗИЯ — после player
    this.physics.add.collider(this.player.sprite, this.ground.platforms);

    // УПРАВЛЕНИЕ
    this.input.on('pointerdown', (pointer) => {
      if (pointer.x < GAME_WIDTH / 2) {
        this.player.jump();
      } else {
        this.player.dash();
      }
    });
    this.input.keyboard.on('keydown-SPACE', () => this.player.jump());

    // ФОН
    this.bg = new ParallaxBackground(this);
    this.bg.layers.forEach(l =>
      l.sprites.forEach(s => s.setDepth(-10))
    );

    // МУЗЫКА
    const menuMusic = this.sound.get('music-menu');
    if (menuMusic && menuMusic.isPlaying) menuMusic.stop();

    this.music = this.sound.add('music-game', {
      loop: true,
      volume: MUSIC_VOLUME,
    });
    this.music.play();

    // СЧЁТ
    this.scoreText = this.add.bitmapText(20, 20, 'pixel-font', '0 M', 42)
      .setTint(0xffcc00)
      .setDepth(100);
    // ПАУЗА
    this.scene.launch('UIScene');

    // РЫВОК
    this.events.on('dash', (duration, speed) => {
      const distance = (speed * duration) / 1000;
      this.ground.burst(distance, duration);
      this.bg.burst(distance, duration);
      // this.spawner.burst(distance);
    });
  }

  update(time, delta) {
    this.ground.update(delta);
    this.bg.update(delta);
    this.player.update();
    if (this.isDead) return;

    // падение в дыру
    const groundTopY = GAME_HEIGHT - 96;
    const playerBottomY = this.player.sprite.y + 96;

    if (playerBottomY > groundTopY + 1) {
      this.isDead = true;
      this.finalDistance = this.distance;
      this._onHit();
      return;
    }

    this.distance += (this.ground.currentSpeed * delta / 1000) / this.PIXELS_PER_METER;
    this.scoreText.setText(Math.floor(this.distance) + ' m');
  }

  _onHit() {
    if (this.isDead) {}

    this.input.removeAllListeners('pointerdown');
    this.input.keyboard.removeAllListeners('keydown-SPACE');

    this.music.stop();
    this.player.sprite.setTint(0xff0000);

    this.scoreText.setText(Math.floor(this.finalDistance) + ' m');

    this.time.delayedCall(1500, () => {
      this.physics.resume();
      this.scene.stop('UIScene');
      this.scene.start('MenuScene');
    });
  }
}
