import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AppLifecycle } from '../src/systems/AppLifecycle.ts';
import type { LifecycleScheduler, PausableEngine } from '../src/systems/AppLifecycle.ts';

function createEngine() {
  const calls = { emit: [] as string[], sleep: 0, wake: 0, pauseAll: 0, resumeAll: 0 };
  const engine: PausableEngine = {
    events: { emit: (event: string) => void calls.emit.push(event) },
    loop: {
      sleep: () => void calls.sleep++,
      wake: () => void calls.wake++,
    },
    sound: {
      pauseAll: () => void calls.pauseAll++,
      resumeAll: () => void calls.resumeAll++,
    },
  };

  return { engine, calls };
}

function createScheduler() {
  let callback: (() => void) | null = null;
  const cleared: unknown[] = [];
  const scheduler: LifecycleScheduler = {
    setTimeout: (cb: () => void) => {
      callback = cb;
      return 'timer';
    },
    clearTimeout: (handle: unknown) => void cleared.push(handle),
  };

  return {
    scheduler,
    cleared,
    fire: () => {
      const pending = callback;
      callback = null;
      pending?.();
    },
  };
}

test('pause emits event immediately and suspends only after the delay', () => {
  const { engine, calls } = createEngine();
  const { scheduler, fire } = createScheduler();
  const lifecycle = new AppLifecycle(engine, scheduler);

  lifecycle.pause('visibility');
  assert.deepEqual(calls.emit, ['app-paused']);
  assert.equal(calls.sleep, 0);

  fire();
  assert.equal(calls.sleep, 1);
  assert.equal(calls.pauseAll, 1);
});

test('resume before the delay cancels suspend', () => {
  const { engine, calls } = createEngine();
  const { scheduler, cleared, fire } = createScheduler();
  const lifecycle = new AppLifecycle(engine, scheduler);

  lifecycle.pause('focus');
  lifecycle.resume('focus');

  assert.deepEqual(cleared, ['timer']);
  assert.equal(calls.wake, 1);
  assert.equal(calls.resumeAll, 1);

  fire();
  assert.equal(calls.sleep, 0);
  assert.equal(calls.pauseAll, 0);
});

test('resume after suspend wakes the engine', () => {
  const { engine, calls } = createEngine();
  const { scheduler, fire } = createScheduler();
  const lifecycle = new AppLifecycle(engine, scheduler);

  lifecycle.pause('native');
  fire();
  lifecycle.resume('native');

  assert.equal(calls.sleep, 1);
  assert.equal(calls.wake, 1);
  assert.equal(calls.resumeAll, 1);
});

test('multiple pause reasons require all of them to resume', () => {
  const { engine, calls } = createEngine();
  const { scheduler, fire } = createScheduler();
  const lifecycle = new AppLifecycle(engine, scheduler);

  lifecycle.pause('visibility');
  lifecycle.pause('focus');
  fire();

  assert.deepEqual(calls.emit, ['app-paused']);
  assert.equal(calls.sleep, 1);

  lifecycle.resume('visibility');
  assert.equal(calls.wake, 0);

  lifecycle.resume('focus');
  assert.equal(calls.wake, 1);
});

test('repeated resume and pause after resume are handled', () => {
  const { engine, calls } = createEngine();
  const { scheduler, fire } = createScheduler();
  const lifecycle = new AppLifecycle(engine, scheduler);

  lifecycle.resume('visibility');
  assert.equal(calls.wake, 0);

  lifecycle.pause('visibility');
  lifecycle.resume('visibility');
  lifecycle.pause('focus');
  fire();

  assert.deepEqual(calls.emit, ['app-paused', 'app-paused']);
  assert.equal(calls.sleep, 1);
});
