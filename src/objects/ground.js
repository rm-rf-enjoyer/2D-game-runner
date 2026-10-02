import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig.js';

export class Ground {
  constructor(scene, tileSize = 32) {
    this.speed = 200;
    this.tileSize = tileSize;

    const topHeight = tileSize;           // трава — 1 тайл
    const bottomHeight = tileSize * 3;    // земля — 3 тайла

    // верхний слой — трава
    this.topSprite = scene.add.tileSprite(
      GAME_WIDTH / 2,
      GAME_HEIGHT - bottomHeight - topHeight / 2,
      GAME_WIDTH,
      topHeight,
      'ground-top'
    );
    this.topSprite.setDepth(0);

    // нижний слой — земля (3 повтора по вертикали)
    this.bottomSprite = scene.add.tileSprite(
      GAME_WIDTH / 2,
      GAME_HEIGHT - bottomHeight / 2,
      GAME_WIDTH,
      bottomHeight,
      'ground-bottom'
    );
    this.bottomSprite.setDepth(0);

    // масштаб текстуры — одинаковый у обоих, чтобы скорость совпала
    const texHeight = this.topSprite.texture.getSourceImage().height;
    const scale = tileSize / texHeight;

    this.topSprite.setTileScale(scale, scale);
    this.bottomSprite.setTileScale(scale, scale);
  }

  update(delta) {
    const shift = this.speed * (delta / 1000);
    this.topSprite.tilePositionX    += shift;
    this.bottomSprite.tilePositionX += shift;
  }
}
