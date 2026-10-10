import Phaser from 'phaser';
import { Ground } from '../objects/ground.js';
import { ParallaxBackground } from '../objects/parallaxBackground.js';
import { GAME_WIDTH, GAME_HEIGHT, MUSIC_VOLUME } from '../config/gameConfig.js';
import { Player } from '../objects/player.js';
import { EnemySpawner } from '../systems/enemySpawner.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    const TOP_HEIGHT = 32;
    const BOTTOM_HEIGHT = 96;
    const TOTAL_GROUND_HEIGHT = TOP_HEIGHT + BOTTOM_HEIGHT;

    this.isDead = false;
    this.score = 0;
    this.startTime = this.time.now;

    this.ground = new Ground(this, TOP_HEIGHT, BOTTOM_HEIGHT);

    const PLATFORM_THICKNESS = 128;
    this.groundBody = this.physics.add.staticImage(
      GAME_WIDTH / 2,
      GAME_HEIGHT - TOTAL_GROUND_HEIGHT + PLATFORM_THICKNESS / 2,
      'ground-top'
    );
    this.groundBody.setDisplaySize(GAME_WIDTH, PLATFORM_THICKNESS);
    this.groundBody.refreshBody();
    this.groundBody.setVisible(false);

    const playerSpriteHeight = 192;
    this.player = new Player(
      this,
      300,
      GAME_HEIGHT - TOTAL_GROUND_HEIGHT - playerSpriteHeight / 2
    );

    const groundTopY = GAME_HEIGHT - TOTAL_GROUND_HEIGHT;
    this.spawner = new EnemySpawner(this, groundTopY);

    this.physics.add.collider(this.player.sprite, this.groundBody);

    this.input.on('pointerdown', () => this.player.jump());
    this.input.keyboard.on('keydown-SPACE', () => this.player.jump());

    this.bg = new ParallaxBackground(this);
    this.bg.layers.forEach(l =>
      l.sprites.forEach(s => s.setDepth(-10))
    );

    const menuMusic = this.sound.get('music-menu');
    if (menuMusic && menuMusic.isPlaying) menuMusic.stop();

    this.music = this.sound.add('music-game', {
      loop: true,
      volume: MUSIC_VOLUME,
    });
    this.music.play();

    // счёт
    this.scoreText = this.add.text(20, 20, '0', {
      fontFamily: 'Arial',
      fontSize: '48px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6,
    })
    .setScrollFactor(0)
    .setDepth(100);

    // пауза
    this.scene.launch('UIScene');
  }

  update(time, delta) {
    this.ground.update(delta);
    this.bg.update(delta);
    this.player.update();
    this.spawner.update(time);

    const elapsed = (time - this.startTime) / 1000;
    this.spawner.speed = Math.min(500 + elapsed * 45, 12000);

    this.score += delta / 1000;
    this.scoreText.setText(Math.floor(this.score));

    if (!this.isDead) {
      for (const e of this.spawner.enemies) {
        if (this.physics.overlap(this.player.sprite, e.sprite)) {
          this._onHit();
          break;
        }
      }
    }
  }

  _onHit() {
    if (this.isDead) return;
    this.isDead = true;

    this.music.stop();
    this.physics.pause();
    this.player.sprite.setTint(0xff0000);

    this.time.delayedCall(1500, () => {
      this.physics.resume();
      this.scene.stop('UIScene');
      this.scene.start('MenuScene');
    });
  }
}
