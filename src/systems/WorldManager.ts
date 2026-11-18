import Phaser from 'phaser';
import { Phase1 } from '../phases/Phase1';
import { Phase2 } from '../phases/Phase2';
import { Phase3 } from '../phases/Phase3';
import { GAME_HEIGHT } from '../config/gameConfig';

const WORLD_CONFIG = {
  initialSpeed: 130,
  dashSpeed: 520,
  speedDecayStep: 130,      // Плавный шаг затухания (при интервале 100мс)
  speedDecayInterval: 150, // Каждые 0.1 сек
  dashCooldown: 2000,      // Кулдаун 2 секунды (в миллисекундах)
  maxDelta: 50,
  groundOffset: 64,
};

export type PhaseType = 1 | 2 | 3;

export class WorldManager {
  public speed: number = WORLD_CONFIG.initialSpeed;
  public physicsGroup: Phaser.Physics.Arcade.StaticGroup;
  public trashGroup: Phaser.Physics.Arcade.StaticGroup;
  public currentPhase!: Phase1 | Phase2 | Phase3;

  private scene: Phaser.Scene;
  private groundTopY: number;
  private isBoosting: boolean = false;
  private decayTimer: number = 0;
  
  // Переменные для кулдауна дэша
  private lastDashTime: number = -Infinity;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.groundTopY = GAME_HEIGHT - WORLD_CONFIG.groundOffset;
    this.physicsGroup = scene.physics.add.staticGroup();
    this.trashGroup = scene.physics.add.staticGroup();

    this.setPhase(1);
  }

  public setPhase(phaseType: PhaseType): void {
    if (phaseType === 1) {
      this.currentPhase = new Phase1(
        this.scene,
        this.groundTopY,
        this.physicsGroup,
        this.trashGroup
      );
      this.currentPhase.init();
      return;
    }

    const prevPlatforms = this.currentPhase.platforms;
    const prevSpawnX = this.currentPhase.nextSpawnX;

    if (phaseType === 2) {
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
      return;
    }

    this.currentPhase = new Phase3(
      this.scene,
      this.groundTopY,
      this.physicsGroup,
      this.trashGroup,
      prevPlatforms,
      prevSpawnX
    );
  }

  public triggerDash(): boolean {
    const currentTime = this.scene.time.now;

    // Проверяем кулдаун (2 секунды)
    if (currentTime - this.lastDashTime < WORLD_CONFIG.dashCooldown) {
      return false; // Кулдаун еще идет, буст отклонен
    }

    this.lastDashTime = currentTime;
    this.speed = WORLD_CONFIG.dashSpeed;
    this.isBoosting = true;
    this.decayTimer = 0;
    return true; // Успешно ускорили мир
  }

  public burst(): void {
    this.triggerDash();
  }

  public update(delta: number): void {
    this._updateSpeedDecay(delta);
    const shift = this._calculateShift(delta);
    this.currentPhase.update(shift);
  }

  private _updateSpeedDecay(delta: number): void {
    if (!this.isBoosting) return;

    this.decayTimer += delta;

    while (this.decayTimer >= WORLD_CONFIG.speedDecayInterval) {
      this.decayTimer -= WORLD_CONFIG.speedDecayInterval;
      this.speed -= WORLD_CONFIG.speedDecayStep;

      if (this.speed <= WORLD_CONFIG.initialSpeed) {
        this.speed = WORLD_CONFIG.initialSpeed;
        this.isBoosting = false;
        this.decayTimer = 0;
        break;
      }
    }
  }

  private _calculateShift(delta: number): number {
    const safeDelta = Math.min(delta, WORLD_CONFIG.maxDelta);
    const dt = safeDelta / 1000;
    return this.speed * dt;
  }
}
