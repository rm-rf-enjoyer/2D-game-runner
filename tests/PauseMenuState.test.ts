import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PauseMenuState } from '../src/systems/PauseMenuState.ts';

test('pause menu opens once and closes once', () => {
  const state = new PauseMenuState();

  assert.equal(state.isOpen, false);
  assert.equal(state.tryOpen(), true);
  assert.equal(state.isOpen, true);
  assert.equal(state.tryOpen(), false);
  assert.equal(state.close(), true);
  assert.equal(state.isOpen, false);
  assert.equal(state.close(), false);
});

test('reset clears state left by a stopped scene', () => {
  const state = new PauseMenuState();

  state.tryOpen();
  state.reset();

  assert.equal(state.isOpen, false);
  assert.equal(state.tryOpen(), true);
});
