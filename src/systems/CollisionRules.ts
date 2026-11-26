import type { DeathCause } from '../config/playerConfig.ts';
import { PIPE_CONFIG } from '../config/pipeConfig.ts';

export interface AABB {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface RectangleBounds {
  x: number;
  y: number;
  right: number;
  bottom: number;
}

export function rectToAabb(
  rect: RectangleBounds,
  target: AABB = { left: 0, top: 0, right: 0, bottom: 0 }
): AABB {
  target.left = rect.x;
  target.top = rect.y;
  target.right = rect.right;
  target.bottom = rect.bottom;
  return target;
}

function intersects(a: AABB, b: AABB): boolean {
  if (a.right - a.left <= 0 || a.bottom - a.top <= 0) return false;
  if (b.right - b.left <= 0 || b.bottom - b.top <= 0) return false;

  return !(a.right < b.left || a.bottom < b.top || a.left > b.right || a.top > b.bottom);
}

export function findWallCollisionCause(
  player: AABB,
  walls: readonly AABB[],
  objects: readonly AABB[]
): DeathCause | null {
  const hits = (bounds: AABB): boolean =>
    intersects(player, bounds) &&
    player.bottom > bounds.top + PIPE_CONFIG.collision.wallTolerance &&
    player.right > bounds.left;

  if (walls.some(hits)) return 'wall';
  if (objects.some(hits)) return 'object';
  return null;
}
