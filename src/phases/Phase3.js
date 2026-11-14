import Phaser from 'phaser';
import { Phase2 } from './Phase2.js';
import { Platform } from '../objects/Platform.js';

const BLOCK_SIZE = 16;
const FLOOR_HEIGHT = 32;

export class Phase3 extends Phase2 {
  constructor(scene, startY, physicsGroup, trashGroup, previousPlatforms, previousSpawnX) {
    super(scene, startY, physicsGroup, trashGroup, previousPlatforms, previousSpawnX);
    this.currentFloor = 0;
    this.firstStepDone = false;
  }

  _spawnNext(currentDistance) {
    let gap, blocks, hasObstacle, spawnY;
    blocks = Phaser.Math.Between(8, 18);
    
    // 1. ВВОД ПЕРВОЙ СТУПЕНЬКИ
    if (!this.firstStepDone) {
      const lastPlat = this.platforms[this.platforms.length - 1];
      const prevHadBox = lastPlat ? lastPlat.hasObstacle === true : false;
      
      if (prevHadBox) {
        // Если сзади ящик — сначала безопасная ровная платформа (БЕЗ ЗАЗОРА)
        gap = 0; 
        hasObstacle = false;
        spawnY = this.startY - (this.currentFloor * FLOOR_HEIGHT);
      } else {
        // Если сзади чисто — спавним первую ступеньку (БЕЗ ЗАЗОРА)
        gap = 0; 
        hasObstacle = false;
        this.currentFloor = 1;
        spawnY = this.startY - FLOOR_HEIGHT;
        this.firstStepDone = true;
      }
    }
    // 2. БЕЗОПАСНАЯ ПЛАТФОРМА ПОСЛЕ ЯЩИКА (3 тайла)
    else if (this.lastPlatformHadObstacle) {
      gap = 3 * BLOCK_SIZE;
      hasObstacle = false;
      spawnY = this.startY - (this.currentFloor * FLOOR_HEIGHT);
    }
    // 3. ОБЫЧНЫЙ РИТМ (Ступеньки без пропастей ИЛИ Пропасть + Ящик)
    else {
      if (Math.random() < 0.5) {
        // Ступенька (без зазора, вверх/вниз на 32px)
        gap = 0;
        hasObstacle = false;
        let dir = Math.random() < 0.5 ? 1 : -1;
        let nf = this.currentFloor + dir;
        if (nf < 0 || nf > 2) nf = this.currentFloor - dir;
        this.currentFloor = nf;
        spawnY = this.startY - (this.currentFloor * FLOOR_HEIGHT);
      } else {
        // Пропасть + Ящик
        gap = Phaser.Math.Between(2, 3) * BLOCK_SIZE;
        hasObstacle = true;
        spawnY = this.startY - (this.currentFloor * FLOOR_HEIGHT);
      }
    }
    
    const x = this.nextSpawnX + gap;
    const p = new Platform(this.scene, x, spawnY, blocks, 'ground', this.physicsGroup, this.trashGroup);
    
    // Флаг для проверки в следующем спавне
    p.hasObstacle = hasObstacle;
    if (hasObstacle) {
      p.addObstacle('obstacle-tile', p.width - 12);
    }
    
    this.platforms.push(p);
    this.nextSpawnX = x + (blocks * BLOCK_SIZE);
    this.lastPlatformHadObstacle = hasObstacle;
  }
}
