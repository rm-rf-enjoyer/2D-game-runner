import Phaser from 'phaser';
import { Phase1 } from './Phase1.js';
import { Platform } from '../objects/Platform.js';

const BLOCK_SIZE = 16;

export class Phase2 extends Phase1 {
  constructor(scene, startY, physicsGroup, trashGroup, previousPlatforms, previousSpawnX) {
    super(scene, startY, physicsGroup, trashGroup);
    this.platforms = previousPlatforms;
    this.nextSpawnX = previousSpawnX;
    this.lastPlatformHadObstacle = false; 
  }

  _spawnNext(currentDistance) {
    let gap = this.lastPlatformHadObstacle ? 3 * BLOCK_SIZE : Phaser.Math.Between(2, 3) * BLOCK_SIZE;
    const x = this.nextSpawnX + gap;
    const blocks = Phaser.Math.Between(8, 18); 
    const hasObstacle = Math.random() < 0.5;

    const p = new Platform(this.scene, x, this.startY, blocks, 'ground', this.physicsGroup, this.trashGroup);
    
    p.hasObstacle = hasObstacle;

    if (hasObstacle) {
      // p.width - 12 — это ставит центр 24-пиксельного ящика так, чтобы его правый край совпал с краем платформы
      p.addObstacle('obstacle-tile', p.width - 12); 
    }

    this.platforms.push(p);
    this.nextSpawnX = x + (blocks * BLOCK_SIZE);
    this.lastPlatformHadObstacle = hasObstacle;
  }
}
