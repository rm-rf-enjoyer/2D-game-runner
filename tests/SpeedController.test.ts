import assert from 'node:assert/strict';
import { test } from 'node:test';
import { WORLD_CONFIG } from '../src/config/worldConfig.ts';
import { SpeedController } from '../src/systems/SpeedController.ts';

test('dash respects cooldown and decays back to base speed', () => {
  const controller = new SpeedController();

  assert.equal(controller.tryDash(0), true);
  assert.equal(controller.speed, WORLD_CONFIG.dashSpeed);
  assert.equal(controller.tryDash(WORLD_CONFIG.dashCooldown - 1), false);

  controller.update(WORLD_CONFIG.speedDecayInterval);
  assert.equal(controller.speed, WORLD_CONFIG.dashSpeed - WORLD_CONFIG.speedDecayStep);

  controller.update(WORLD_CONFIG.speedDecayInterval * 10);
  assert.equal(controller.speed, WORLD_CONFIG.initialSpeed);
  assert.equal(controller.isBoosting, false);
});

test('shift calculation clamps large deltas', () => {
  const controller = new SpeedController();

  const expected = WORLD_CONFIG.initialSpeed * (WORLD_CONFIG.maxDelta / 1000);

  assert.equal(controller.calculateShift(WORLD_CONFIG.maxDelta * 2), expected);
});
