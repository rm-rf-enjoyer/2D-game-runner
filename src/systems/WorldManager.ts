import type { DeathCause } from '../config/playerConfig.ts';
import { SpeedController } from './SpeedController.ts';
import { findWallCollisionCause, rectToAabb } from './CollisionRules.ts';
import type { AABB, RectangleBounds } from './CollisionRules.ts';

export interface BoundedEntity {
  getBounds(): RectangleBounds;
}

export interface WorldPhase {
  readonly platforms: readonly BoundedEntity[];
  readonly objects: readonly BoundedEntity[];
  update(shift: number): void;
}

export class WorldManager {
  private readonly speedController = new SpeedController();
  private readonly phases: readonly WorldPhase[];

  constructor(phases: readonly WorldPhase[]) {
    this.phases = phases;
  }

  public get speed(): number {
    return this.speedController.speed;
  }

  public get isDashActive(): boolean {
    return this.speedController.isBoosting;
  }

  public triggerDash(now: number): boolean {
    return this.speedController.tryDash(now);
  }

  public getWallCollisionCause(player: AABB): DeathCause | null {
    const walls = this.phases.flatMap((phase) =>
      phase.platforms.map((platform) => rectToAabb(platform.getBounds()))
    );
    const objects = this.phases.flatMap((phase) =>
      phase.objects.map((object) => rectToAabb(object.getBounds()))
    );

    return findWallCollisionCause(player, walls, objects);
  }

  public update(delta: number): void {
    this.speedController.update(delta);
    const shift = this.speedController.calculateShift(delta);
    this.phases.forEach((phase) => phase.update(shift));
  }
}
