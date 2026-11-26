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
  private readonly walls: AABB[] = [];
  private readonly objects: AABB[] = [];
  private readonly boundsCache = new WeakMap<BoundedEntity, AABB>();

  constructor(phases: readonly WorldPhase[]) {
    this.phases = phases;
    this.rebuildCollisionBounds();
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
    return findWallCollisionCause(player, this.walls, this.objects);
  }

  public update(delta: number): void {
    this.speedController.update(delta);
    const shift = this.speedController.calculateShift(delta);
    this.phases.forEach((phase) => phase.update(shift));
    this.rebuildCollisionBounds();
  }

  private rebuildCollisionBounds(): void {
    this.walls.length = 0;
    this.objects.length = 0;

    this.phases.forEach((phase) => {
      phase.platforms.forEach((platform) => this.walls.push(this.toAabb(platform)));
      phase.objects.forEach((object) => this.objects.push(this.toAabb(object)));
    });
  }

  private toAabb(entity: BoundedEntity): AABB {
    const bounds = entity.getBounds();
    const cached = this.boundsCache.get(entity);

    if (cached) {
      return rectToAabb(bounds, cached);
    }

    const aabb = rectToAabb(bounds);
    this.boundsCache.set(entity, aabb);
    return aabb;
  }
}
