import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { test } from 'node:test';
import type Phaser from 'phaser';
import { InputRouter } from '../src/scenes/game/InputRouter.ts';

function createScene() {
  const input = new EventEmitter();
  const keyboard = new EventEmitter();
  Object.assign(input, { keyboard });

  return { input, keyboard, scene: { input } as unknown as Phaser.Scene };
}

function pointer(x: number, id = 1): Phaser.Input.Pointer {
  return { x, id } as unknown as Phaser.Input.Pointer;
}

test('pointer halves route to jump and dash and only the jump pointer releases', () => {
  const { input, scene } = createScene();
  const calls: string[] = [];
  const router = new InputRouter(scene, {
    onJumpPress: () => calls.push('press'),
    onJumpRelease: () => calls.push('release'),
    onDash: () => calls.push('dash'),
  });

  router.enable();
  input.emit('pointerdown', pointer(100));
  input.emit('pointerdown', pointer(300, 2));
  input.emit('pointerup', pointer(100, 2));
  input.emit('pointerup', pointer(100));

  assert.deepEqual(calls, ['press', 'dash', 'release']);

  router.disable();
  input.emit('pointerdown', pointer(100));
  assert.deepEqual(calls, ['press', 'dash', 'release']);
});

test('keyboard routes space to jump and shift to dash', () => {
  const { keyboard, scene } = createScene();
  const calls: string[] = [];
  const router = new InputRouter(scene, {
    onJumpPress: () => calls.push('press'),
    onJumpRelease: () => calls.push('release'),
    onDash: () => calls.push('dash'),
  });

  router.enable();
  keyboard.emit('keydown-SPACE');
  keyboard.emit('keyup-SPACE');
  keyboard.emit('keydown-SHIFT');

  assert.deepEqual(calls, ['press', 'release', 'dash']);
});
