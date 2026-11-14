import Phaser from 'phaser';
import { Platform } from '../objects/Platform.js';
import { GAME_WIDTH } from '../config/gameConfig.js';

const BLOCK_SIZE = 16;

export class Phase1 {
  constructor(scene, startY, physicsGroup, trashGroup) {
    this.scene = scene;
    this.startY = startY;
    this.physicsGroup = physicsGroup;
    this.trashGroup = trashGroup;
    
    this.platforms = [];
    this.nextSpawnX = 0;
  }

  init() {
    const startBlocks = 25;
    this._spawnPlatform(-200, startBlocks, 'ground');
    this.nextSpawnX = -200 + (startBlocks * BLOCK_SIZE); 
  }

  update(shift, currentDistance) {
    for (let i = this.platforms.length - 1; i >= 0; i--) {
      const p = this.platforms[i];
      p.update(shift);
      if (p.x + p.width < -300) {
        p.destroy();
        this.platforms.splice(i, 1);
      }
    }
    
    this.nextSpawnX -= shift;

    while (this.nextSpawnX < GAME_WIDTH + 200) {
      this._spawnNext(currentDistance);
    }
  }

  _spawnNext(currentDistance) {
    const gap = Phaser.Math.Between(2, 3) * BLOCK_SIZE; 
    const x = this.nextSpawnX + gap;
    
    // УВЕЛИЧИЛИ ширину платформ
    const blocks = Phaser.Math.Between(8, 18); 
    
    this._spawnPlatform(x, blocks, 'ground');
    this.nextSpawnX = x + (blocks * BLOCK_SIZE);
  }

  _spawnPlatform(x, blocks, type) {
    const p = new Platform(this.scene, x, this.startY, blocks, type, this.physicsGroup, this.trashGroup);
    this.platforms.push(p);
    return p;
  }
}
