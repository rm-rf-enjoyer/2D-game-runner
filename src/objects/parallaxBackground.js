import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig.js';

export class ParallaxBackground {
  constructor(scene) {
    this.layers = [
      { key: 'bg1', speed: 0.05 },
      { key: 'bg2', speed: 0.10 },
      { key: 'bg3', speed: 0.20 },
      { key: 'bg4', speed: 0.35 },
      { key: 'bg5', speed: 0.60 },
    ].map(({ key, speed }) => {
      const a = this._makeSprite(scene, key);
      const b = this._makeSprite(scene, key);
      b.x = a.x + GAME_WIDTH;
      return { key, speed, sprites: [a, b] };
    });
  }

  _makeSprite(scene, key) {
    const sprite = scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, key);
    sprite.setScale(GAME_WIDTH / sprite.width, GAME_HEIGHT / sprite.height);
    return sprite;
  }

  update(delta, baseSpeed = 200) {
    const dt = delta / 1000;
    for (const layer of this.layers) {
      const shift = baseSpeed * layer.speed * dt;
      for (const sprite of layer.sprites) {
        sprite.x -= shift;
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
