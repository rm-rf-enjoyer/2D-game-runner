import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PIPE_CONFIG } from '../src/config/pipeConfig.ts';
import { findWallCollisionCause } from '../src/systems/CollisionRules.ts';
import type { AABB } from '../src/systems/CollisionRules.ts';

const platform: AABB = { left: 100, top: 50, right: 200, bottom: 100 };

test('landing on top of a platform is not a wall hit', () => {
  const player: AABB = { left: 120, top: 48, right: 130, bottom: 52 };

  assert.equal(findWallCollisionCause(player, [platform], []), null);
});

test('side hits return wall or object cause with wall taking priority', () => {
  const player: AABB = { left: 90, top: 60, right: 105, bottom: 70 };

  assert.equal(findWallCollisionCause(player, [platform], []), 'wall');
  assert.equal(findWallCollisionCause(player, [], [platform]), 'object');
  assert.equal(findWallCollisionCause(player, [platform], [platform]), 'wall');
});

test('wall tolerance boundary and degenerate bounds do not count as hits', () => {
  const player = (bottom: number): AABB => ({
    left: 90,
    top: bottom - 10,
    right: 105,
    bottom,
  });
  const tolerance = PIPE_CONFIG.collision.wallTolerance;

  assert.equal(findWallCollisionCause(player(platform.top + tolerance), [platform], []), null);
  assert.equal(
    findWallCollisionCause(player(platform.top + tolerance + 1), [platform], []),
    'wall'
  );
  assert.equal(
    findWallCollisionCause(player(70), [{ left: 100, top: 50, right: 100, bottom: 100 }], []),
    null
  );
});
