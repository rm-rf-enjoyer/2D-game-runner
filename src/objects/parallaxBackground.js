import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig.js';

export class ParallaxBackground {
  constructor(scene) {
    this.scene = scene;
    
    // Задаем глубину (depth) для каждого слоя вручную
    this.layers = [
      { key: 'bg1', speed: 0.05, depth: -40 },
      { key: 'bg2', speed: 0.1, depth: -30 },
      // bg3 (поезд) будет на -20
      { key: 'bg4', speed: 0.2, depth: -10 },
    ].map(({ key, speed, depth }) => {
      // Используем tileSprite для идеально плавного движения
      const ts = scene.add.tileSprite(
        GAME_WIDTH / 2, 
        GAME_HEIGHT / 2, 
        GAME_WIDTH, 
        GAME_HEIGHT, 
        key
      );
      ts.setDepth(depth);
      return { ts, speed };
    });

    // --- ЛОГИКА ПОЕЗДА ---
    this.train = scene.add.image(0, GAME_HEIGHT / 2, 'bg3');
    this.train.setScale(1);
    
    // ВАЖНО: Ставим глубину -20 (между bg2 и bg4)
    this.train.setDepth(-20); 
    
    this.train.x = GAME_WIDTH + this.train.displayWidth / 2;
    this.train.setVisible(false);

    this.burstRemaining = 0;
    this.burstPerSecond = 0;

    this.scene.time.delayedCall(2000, () => this.spawnTrain());
    this.scene.time.addEvent({
      delay: 30000, 
      loop: true,
      callback: () => this.spawnTrain(),
    });
  }

  spawnTrain() {
    if (this.train.visible) return;
    this.train.x = GAME_WIDTH + this.train.displayWidth / 2;
    this.train.setVisible(true);

    this.scene.tweens.add({
      targets: this.train,
      x: -this.train.displayWidth / 2,
      duration: 15000,
      ease: 'Linear',
      onComplete: () => this.train.setVisible(false)
    });
  }

  burst(distance, duration) {
    this.burstRemaining = distance;
    this.burstPerSecond = distance / (duration / 1000);
  }

  update(delta, baseSpeed = 130) {
    const dt = delta / 1000;
    let shift = baseSpeed * dt;
    let burstShift = 0;

    if (this.burstRemaining > 0) {
      burstShift = Math.min(this.burstPerSecond * dt, this.burstRemaining);
      this.burstRemaining -= burstShift;
    }

    // Двигаем текстуры внутри tileSprite (это работает плавно)
    for (const layer of this.layers) {
      let layerShift = shift * layer.speed;
      // Если нужно, чтобы фон ускорялся при дэше:
      // layerShift += burstShift * layer.speed; 
      
      layer.ts.tilePositionX += layerShift;
    }
  }

  destroy() {
    for (const layer of this.layers) {
      layer.ts.destroy();
    }
    if (this.train) this.train.destroy();
    this.layers = [];
  }
}
