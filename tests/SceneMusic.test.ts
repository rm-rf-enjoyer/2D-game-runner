import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SceneMusic } from '../src/systems/SceneMusic.ts';
import type { LoopSound, SceneSoundManager } from '../src/systems/SceneMusic.ts';
import { ASSET_KEYS } from '../src/config/assetKeys.ts';

function createSound() {
  const calls = { stop: 0, play: 0 };
  const sound: LoopSound = {
    stop: () => void calls.stop++,
    play: () => void calls.play++,
  };
  return { sound, calls };
}

function createManager(sounds: Map<string, LoopSound> = new Map()) {
  const calls = { add: [] as string[], stopByKey: [] as string[] };
  const manager: SceneSoundManager = {
    stopByKey: (key: string) => void calls.stopByKey.push(key),
    get: (key: string) => sounds.get(key) ?? null,
    add: (key: string) => {
      calls.add.push(key);
      const { sound } = createSound();
      sounds.set(key, sound);
      return sound;
    },
  };
  return { manager, calls, sounds };
}

const config = {
  key: ASSET_KEYS.audio.gameMusic,
  volume: 0.5,
  stopKeys: [ASSET_KEYS.audio.menuMusic],
};

test('start reuses an existing sound and stops the previous theme', () => {
  const { sound, calls: soundCalls } = createSound();
  const sounds = new Map([[ASSET_KEYS.audio.gameMusic, sound]]);
  const { manager, calls } = createManager(sounds);
  const music = new SceneMusic(config);

  music.start(manager);

  assert.deepEqual(calls.add, []);
  assert.deepEqual(calls.stopByKey, [ASSET_KEYS.audio.menuMusic]);
  assert.equal(soundCalls.stop, 1);
  assert.equal(soundCalls.play, 1);
});

test('recreating a scene does not duplicate the music object', () => {
  const { manager, calls, sounds } = createManager();
  const music = new SceneMusic(config);

  music.start(manager);
  const first = sounds.get(ASSET_KEYS.audio.gameMusic);
  music.start(manager);

  assert.deepEqual(calls.add, [ASSET_KEYS.audio.gameMusic]);
  assert.equal(sounds.get(ASSET_KEYS.audio.gameMusic), first);
  assert.equal([...sounds.keys()].length, 1);
});

test('stop is idempotent and start can be called again', () => {
  const { sound, calls: soundCalls } = createSound();
  const { manager } = createManager(new Map([[ASSET_KEYS.audio.gameMusic, sound]]));
  const music = new SceneMusic(config);

  music.start(manager);
  music.stop();
  music.stop();
  music.start(manager);

  assert.equal(soundCalls.stop, 3);
  assert.equal(soundCalls.play, 2);
});
