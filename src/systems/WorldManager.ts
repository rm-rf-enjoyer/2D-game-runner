import Phaser from 'phaser';
import { Phase1 } from '../phases/Phase1';
import { Phase2 } from '../phases/Phase2';
import { Phase3 } from '../phases/Phase3';
import { GAME_HEIGHT } from '../config/gameConfig';
import { Platform } from '../objects/Platform';

const WORLD_CONFIG = {
  initialSpeed: 130,
  maxDelta: 50,
  groundOffset: 64,
};

export type PhaseType = 1 | 2 | 3;

export class WorldManager {
  public speed: number = WORLD_CONFIG.initialSpeed;
  public burstRemaining: number = 0;
  public burstPerSecond: number = 0;
  public physicsGroup: Phaser.Physics.Arcade.StaticGroup;
  public trashGroup: Phaser.Physics.Arcade.StaticGroup;
  
  public currentPhase!: Phase1 | Phase2 | Phase3;

  private scene: Phaser.Scene;
  private groundTopY: number;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.groundTopY = GAME_HEIGHT - WORLD_CONFIG.groundOffset;
    this.physicsGroup = scene.physics.add.staticGroup();
    this.trashGroup = scene.physics.add.staticGroup();

    this.setPhase(1);
  }

  public setPhase(phaseType: PhaseType): void {
    if (phaseType === 1) {
      this.currentPhase = new Phase1(this.scene, this.groundTopY, this.physicsGroup, this.trashGroup);
      this.currentPhase.init();
      return;
    }

    const prevPlatforms = this.currentPhase.platforms;
    const prevSpawnX = this.currentPhase.nextSpawnX;

    if (phaseType === 2) {
      // Передаем state в виде объекта, как ожидает обновленный конструктор Phase2
      this.currentPhase = new Phase2(
        this.scene, 
        this.groundTopY, 
        this.physicsGroup, 
        this.trashGroup, 
        {
          platforms: prevPlatforms,
          nextSpawnX: prevSpawnX,
        }
      );
    } else {
      this.currentPhase = new Phase3(
        this.scene, 
        this.groundTopY, 
        this.physicsGroup, 
        this.trashGroup, 
        prevPlatforms, 
        prevSpawnX
      );
    }
  }

  public burst(distance: number, duration: number): void {
    this.burstRemaining = distance;
    this.burstPerSecond = distance / (duration / 1000);
  }

  public update(delta: number): void {
    const shift = this._calculateShift(delta);
    this.currentPhase.update(shift);
  }

  private _calculateShift(delta: number): number {
    const safeDelta = Math.min(delta, WORLD_CONFIG.maxDelta);
    const dt = safeDelta / 1000;
    let shift = this.speed * dt;

    if (this.burstRemaining > 0) {
      const burstShift = Math.min(this.burstPerSecond * dt, this.burstRemaining);
      shift += burstShift;
      this.burstRemaining -= burstShift;
    }

    return shift;
  }
}
