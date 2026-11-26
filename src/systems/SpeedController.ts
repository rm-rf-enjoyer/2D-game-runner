import { GAMEPLAY_CONFIG } from '../config/gameConstants.ts';
import { WORLD_CONFIG } from '../config/worldConfig.ts';

export class SpeedController {
  public speed: number = WORLD_CONFIG.initialSpeed;
  public isBoosting = false;

  private decayTimer = 0;
  private lastDashTime = -Infinity;

  public tryDash(now: number): boolean {
    if (now - this.lastDashTime < WORLD_CONFIG.dashCooldown) {
      return false;
    }

    this.lastDashTime = now;
    this.speed = WORLD_CONFIG.dashSpeed;
    this.isBoosting = true;
    this.decayTimer = 0;
    return true;
  }

  public update(delta: number): void {
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

  public calculateShift(delta: number): number {
    const safeDelta = Math.min(delta, WORLD_CONFIG.maxDelta);
    return this.speed * (safeDelta / GAMEPLAY_CONFIG.msPerSecond);
  }
}
