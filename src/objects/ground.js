import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig.js';

const TILE = 16;
const SCALE = 6;
const TILE_SIZE = TILE * SCALE;

const MIN_SEGMENT = 400;
const MAX_SEGMENT = 900;
const MIN_GAP = 200;
const MAX_GAP = 400;

export class Ground {
  constructor(scene) {
    this.scene = scene;
    this.speed = 500;
    this.segments = [];
    this.nextSpawnX = 0;

    this.burstRemaining = 0;
    this.burstPerSecond = 0;

    this.platforms = scene.physics.add.staticGroup();

    this._spawnSegment(-GAME_WIDTH, GAME_WIDTH * 2);

    while (this.nextSpawnX < GAME_WIDTH * 2) {
      this._spawnGapAndSegment();
    }
  }

  _spawnSegment(xStart, width) {
    const y = GAME_HEIGHT - TILE_SIZE / 2;

    const tile = this.scene.add.tileSprite(
      xStart + width / 2,
      y,
      width,
      TILE_SIZE,
      'ground'
    );
    tile.setTileScale(SCALE, SCALE);
    tile.setDepth(0);

    const body = this.scene.add.rectangle(
      xStart + width / 2,
      y,
      width,
      TILE_SIZE,
      0xff0000,
      0
    );
    this.scene.physics.add.existing(body, true);
    body.body.setSize(width, TILE_SIZE);
    body.body.updateFromGameObject();
    this.platforms.add(body);

    this.segments.push({ tile, body, x: xStart, width });
  }

  _spawnGapAndSegment() {
    const gap   = Phaser.Math.Between(MIN_GAP, MAX_GAP);
    const width = Phaser.Math.Between(MIN_SEGMENT, MAX_SEGMENT);

    const xStart = this.nextSpawnX + gap;
    this._spawnSegment(xStart, width);

    this.nextSpawnX = xStart + width;
  }

  burst(distance, duration) {
    this.burstRemaining = distance;
    this.burstPerSecond = distance / (duration / 1000);
  }

  update(delta) {
    const dt = delta / 1000;
    let shift = this.speed * dt;

    if (this.burstRemaining > 0) {
      const burstShift = Math.min(this.burstPerSecond * dt, this.burstRemaining);
      shift += burstShift;
      this.burstRemaining -= burstShift;
    }

    for (let i = this.segments.length - 1; i >= 0; i--) {
      const s = this.segments[i];

      s.x -= shift;
      s.tile.x -= shift;
      s.body.x -= shift;
      s.body.body.updateFromGameObject();

      if (s.x + s.width < -200) {
        s.tile.destroy();
        s.body.destroy();
        this.segments.splice(i, 1);
      }
    }

    this.nextSpawnX -= shift;

    while (this.nextSpawnX < GAME_WIDTH + 400) {
      this._spawnGapAndSegment();
    }
  }

  get currentSpeed() {
    return this.speed + (this.burstRemaining > 0 ? this.burstPerSecond : 0);
  }
}
