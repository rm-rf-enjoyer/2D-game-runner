import Phaser from 'phaser';
import { Phase1 } from '../phases/Phase1.js';
import { Phase2 } from '../phases/Phase2.js';
import { Phase3 } from '../phases/Phase3.js'; // <--- ДОБАВЛЕН ИМПОРТ
import { GAME_HEIGHT } from '../config/gameConfig.js';

export class WorldManager {
  constructor(scene) {
    this.scene = scene;
    this.groundTopY = GAME_HEIGHT - 64;
    this.speed = 130;

    this.burstRemaining = 0;
    this.burstPerSecond = 0;

    this.currentPhase = null;
    this.physicsGroup = scene.physics.add.staticGroup();
    this.trashGroup = scene.physics.add.staticGroup();

    this.setPhase(1);
  }

  setPhase(phaseNumber) {
    if (phaseNumber === 1) {
      this.currentPhase = new Phase1(this.scene, this.groundTopY, this.physicsGroup, this.trashGroup);
      this.currentPhase.init();
    } 
    else if (phaseNumber === 2) { 
      this.currentPhase = new Phase2(
        this.scene, 
        this.groundTopY, 
        this.physicsGroup, 
        this.trashGroup,
        this.currentPhase.platforms,
        this.currentPhase.nextSpawnX
      );
    }
    else if (phaseNumber === 3) { 
      this.currentPhase = new Phase3(
        this.scene, 
        this.groundTopY, 
        this.physicsGroup, 
        this.trashGroup,
        this.currentPhase.platforms, 
        this.currentPhase.nextSpawnX
      );
    }
  }

  burst(distance, duration) {
    this.burstRemaining = distance;
    this.burstPerSecond = distance / (duration / 1000);
  }

  update(delta) {
    const safeDelta = Math.min(delta, 50);
    const dt = safeDelta / 1000;
    let shift = this.speed * dt;

    if (this.burstRemaining > 0) {
      const burstShift = Math.min(this.burstPerSecond * dt, this.burstRemaining);
      shift += burstShift;
      this.burstRemaining -= burstShift;
    }

    if (this.currentPhase) {
      this.currentPhase.update(shift);
    }
  }
}
