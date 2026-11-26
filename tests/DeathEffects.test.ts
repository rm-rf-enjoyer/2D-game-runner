import assert from 'node:assert/strict';
import { test } from 'node:test';
import type Phaser from 'phaser';
import { BLOOD_EFFECT_CONFIG } from '../src/scenes/game/config.ts';
import { DeathEffects } from '../src/scenes/game/DeathEffects.ts';

class EmitterFake {
  public readonly explodeCalls: { count: number; x?: number; y?: number }[] = [];
  public destroyed = 0;

  public setDepth(): this {
    return this;
  }

  public explode(count: number, x?: number, y?: number): void {
    this.explodeCalls.push({ count, x, y });
  }

  public destroy(): void {
    this.destroyed += 1;
  }
}

function createScene() {
  const emitters: EmitterFake[] = [];
  const timers: { delay: number; callback: () => void }[] = [];
  const scene = {
    add: {
      particles: () => {
        const emitter = new EmitterFake();
        emitters.push(emitter);
        return emitter;
      },
    },
    time: {
      delayedCall: (delay: number, callback: () => void) => {
        timers.push({ delay, callback });
        return delay;
      },
    },
  };

  return { scene: scene as unknown as Phaser.Scene, emitters, timers };
}

test('death effects spawn blood once and destroy the emitter after its lifetime', () => {
  const { scene, emitters, timers } = createScene();

  new DeathEffects(scene, [0xff0000, 0x000000]).play('pit', 100, 200);

  assert.equal(emitters.length, 1);
  assert.equal(emitters[0].explodeCalls.length, 1);
  assert.equal(emitters[0].explodeCalls[0].count, BLOOD_EFFECT_CONFIG.particleCount);
  assert.equal(timers.length, 1);

  timers[0].callback();
  assert.equal(emitters[0].destroyed, 1);
});

test('object death spawns the delayed puddle and cleans it up', () => {
  const { scene, emitters, timers } = createScene();

  new DeathEffects(scene, [0xff0000, 0x000000]).play('object', 100, 200);

  assert.equal(timers.length, 2);
  assert.equal(timers[1].delay, BLOOD_EFFECT_CONFIG.puddleDelay);

  timers[1].callback();

  assert.equal(emitters.length, 2);
  assert.equal(
    emitters[1].explodeCalls.length,
    BLOOD_EFFECT_CONFIG.puddle.red.length + BLOOD_EFFECT_CONFIG.puddle.dark.length
  );

  timers[2].callback();
  assert.equal(emitters[1].destroyed, 1);
});
