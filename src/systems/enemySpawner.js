import Phaser from 'phaser';
import { Enemy } from '../objects/Enemy.js';
import { GAME_WIDTH } from '../config/gameConfig.js';

export class EnemySpawner {
  constructor(scene, groundTopY, {
    minGap = 900,       // минимум «метров» между врагами
    maxGap = 1800,       // максимум
    speed = 500,     // фиксированная скорость (или диапазон)
  } = {}) {
    this.scene = scene;
    this.groundTopY = groundTopY;
    this.minGap = minGap;
    this.maxGap = maxGap;
    this.speed = speed;

    this.enemies = [];
    this.nextSpawnAt = 0;
  }

  _scheduleNext(now) {
    // случайное расстояние в «метрах»
    const gap = Phaser.Math.Between(this.minGap, this.maxGap);

    // время в ms = расстояние / скорость * 1000
    let delayMs = (gap / this.speed) * 1000;
    delayMs = Math.max(delayMs, 1000);

    this.nextSpawnAt = now + delayMs;
  }

  _spawn() {
    const x = GAME_WIDTH + 100;

    const isTall = Math.random() < 0.5;
    const type = isTall ? 'tall' : 'normal';

    const NORMAL_Y = this.groundTopY - 400;
    const TALL_Y   = this.groundTopY - 100;

    const y = isTall ? TALL_Y : NORMAL_Y;

    const enemy = new Enemy(this.scene, x, y, this.speed, type);
    this.enemies.push(enemy);
  } 
  
  update(time) {
    if (time >= this.nextSpawnAt) {
      this._spawn();
      this._scheduleNext(time);
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.sprite.x < -200) {
        e.destroy();
        this.enemies.splice(i, 1);
      }
    }

    for (const e of this.enemies) {
      e.sprite.setVelocityX(-this.speed);
    }
  }
  burst(distance, duration) {
    for (const enemy of this.enemies) {
      this.scene.tweens.add({
        targets: enemy.sprite,
        x: enemy.sprite.x - distance,
        duration: duration,
        ease: 'Linear',
      });
    }
  }
}
