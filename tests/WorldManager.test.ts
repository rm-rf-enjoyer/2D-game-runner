import assert from 'node:assert/strict';
import { test } from 'node:test';
import { WORLD_CONFIG } from '../src/config/worldConfig.ts';
import type { RectangleBounds } from '../src/systems/CollisionRules.ts';
import { WorldManager } from '../src/systems/WorldManager.ts';
import type { BoundedEntity, WorldPhase } from '../src/systems/WorldManager.ts';

function toEntities(bounds: readonly RectangleBounds[]): BoundedEntity[] {
  return bounds.map((rect) => ({ getBounds: () => rect }));
}

function createPhase(
  platformBounds: readonly RectangleBounds[] = [],
  objectBounds: readonly RectangleBounds[] = []
): WorldPhase & { shifts: number[] } {
  return {
    platforms: toEntities(platformBounds),
    objects: toEntities(objectBounds),
    shifts: [] as number[],
    update(shift: number): void {
      this.shifts.push(shift);
    },
  };
}

const platform: RectangleBounds = { x: 100, y: 50, right: 200, bottom: 100 };

test('world reports wall and object hits using phase bounds', () => {
  const player = { left: 90, top: 60, right: 105, bottom: 70 };
  const world = new WorldManager([
    createPhase([platform]),
    createPhase([], [{ x: 300, y: 50, right: 350, bottom: 100 }]),
  ]);

  assert.equal(world.getWallCollisionCause(player), 'wall');

  const objectWorld = new WorldManager([createPhase([], [platform])]);
  assert.equal(objectWorld.getWallCollisionCause(player), 'object');

  const landingPlayer = { left: 120, top: 48, right: 130, bottom: 52 };
  assert.equal(world.getWallCollisionCause(landingPlayer), null);
});

test('update propagates clamped shift to every phase', () => {
  const first = createPhase();
  const second = createPhase();
  const world = new WorldManager([first, second]);
  const expectedShift = WORLD_CONFIG.initialSpeed * (WORLD_CONFIG.maxDelta / 1000);

  world.update(WORLD_CONFIG.maxDelta * 2);

  assert.equal(first.shifts.length, 1);
  assert.ok(Math.abs(first.shifts[0] - expectedShift) < 1e-9);
  assert.equal(second.shifts[0], first.shifts[0]);
  assert.equal(world.speed, WORLD_CONFIG.initialSpeed);
});

test('dash increases speed and respects cooldown', () => {
  const phase = createPhase();
  const world = new WorldManager([phase]);

  assert.equal(world.triggerDash(0), true);
  assert.equal(world.isDashActive, true);
  assert.equal(world.triggerDash(WORLD_CONFIG.dashCooldown - 1), false);
  assert.equal(world.speed, WORLD_CONFIG.dashSpeed);

  world.update(WORLD_CONFIG.maxDelta);
  assert.ok(Math.abs(phase.shifts[0] - WORLD_CONFIG.dashSpeed * 0.05) < 1e-9);
});

test('collision bounds follow phase movement', () => {
  const moved = { x: 100, y: 50, right: 200, bottom: 100 };
  const phase: WorldPhase = {
    platforms: [{ getBounds: () => moved }],
    objects: [],
    update(shift: number): void {
      moved.x -= shift;
      moved.right -= shift;
    },
  };
  const world = new WorldManager([phase]);

  world.update(WORLD_CONFIG.maxDelta);

  const player = { left: moved.x + 5, top: 60, right: moved.x + 15, bottom: 70 };
  assert.equal(world.getWallCollisionCause(player), 'wall');
});
