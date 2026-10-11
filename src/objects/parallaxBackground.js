import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig.js';

export class ParallaxBackground {
  constructor(scene) {
    this.scene = scene;
    this.layers = [
      { key: 'bg1', speed: 0.05, burstable: true },
      { key: 'bg2', speed: 0.10, burstable: true },
      { key: 'bg3', speed: 0.20, burstable: true },
      { key: 'bg4', speed: 1.20, burstable: false },
      { key: 'bg5', speed: 0.35, burstable: true },
      { key: 'bg6', speed: 0.35, burstable: true },
      { key: 'bg7', speed: 0.60, burstable: true },
    ].map(({ key, speed, burstable }) => {
      const a = this._makeSprite(scene, key);
      const b = this._makeSprite(scene, key);
      b.x = a.x + GAME_WIDTH;
      return { key, speed, burstable, sprites: [a, b] };
    });

    this.burstRemaining = 0;
    this.burstPerSecond = 0;
  }

  _makeSprite(scene, key) {
    const sprite = scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, key);
    sprite.setScale(GAME_WIDTH / sprite.width, GAME_HEIGHT / sprite.height);
    return sprite;
  }

  burst(distance, duration) {
    this.burstRemaining = distance;
    this.burstPerSecond = distance / (duration / 1000);
  }

  update(delta, baseSpeed = 200) {
    const dt = delta / 1000;
    let shift = baseSpeed * dt;

    let burstShift = 0;
    if (this.burstRemaining > 0) {
      burstShift = Math.min(this.burstPerSecond * dt, this.burstRemaining);
      this.burstRemaining -= burstShift;
    }

    for (const layer of this.layers) {
      let layerShift = shift * layer.speed;
      if (layer.burstable) {
        layerShift += burstShift * layer.speed;
      }

      for (const sprite of layer.sprites) {
        sprite.x -= layerShift;
        if (sprite.x <= -GAME_WIDTH / 2) {
          sprite.x += GAME_WIDTH * 2;
        }
      }
    }
  }

  destroy() {
    for (const layer of this.layers) {
      for (const s of layer.sprites) s.destroy();
    }
    this.layers = [];
  }
}
