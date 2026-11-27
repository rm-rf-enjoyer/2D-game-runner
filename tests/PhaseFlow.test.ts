import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getChunkRightEdge } from '../src/chunks/ChunkMetrics.ts';
import type { ChunkDefinition } from '../src/chunks/types.ts';
import { PIPE_CONFIG } from '../src/config/pipeConfig.ts';
import { PLATFORM_TILE_SIZE } from '../src/config/platforms/types.ts';
import { PhaseFlow } from '../src/phases/PhaseFlow.ts';

function createChunk(id: string, widthTiles: number): ChunkDefinition {
  return {
    id,
    widthTiles,
    platforms: [{ xTiles: 0, yTiles: 0, widthTiles }],
    objects: [],
  };
}

test('phase flow spawns, shifts, despawns and completes', () => {
  const flow = new PhaseFlow([createChunk('a', 10), createChunk('b', 10)], 208);
  const initial = flow.init();

  assert.equal(initial.length, 2);
  assert.equal(initial[0].startX, 0);
  assert.equal(initial[1].startX, 10 * PLATFORM_TILE_SIZE);
  assert.equal(flow.nextX, 20 * PLATFORM_TILE_SIZE);

  const shift = 20 * PLATFORM_TILE_SIZE + PIPE_CONFIG.spawn.despawnMargin + 1;
  const step = flow.update(shift);

  assert.deepEqual(new Set(step.despawns), new Set([0, 1]));
  assert.equal(step.justCompleted, true);
  assert.equal(flow.update(1).justCompleted, false);
});

test('runtime spawns are placed relative to the shifted world', () => {
  const sequence = [createChunk('a', 10), createChunk('b', 10)];
  const flow = new PhaseFlow(sequence, 208, { maxChunks: 5, initialChunks: 2 });
  const initial = flow.init();

  assert.equal(initial.length, 2);

  const shift = 41 * PLATFORM_TILE_SIZE;
  const step = flow.update(shift);

  assert.deepEqual(new Set(step.despawns), new Set([0, 1]));
  assert.equal(step.spawns.length, 2);
  assert.equal(step.spawns[0].startX, 20 * PLATFORM_TILE_SIZE - shift);
  assert.equal(step.spawns[0].rightEdge, getChunkRightEdge(sequence[0], step.spawns[0].startX));
  assert.equal(step.spawns[1].startX, 30 * PLATFORM_TILE_SIZE - shift);
  assert.equal(step.spawns[1].rightEdge, getChunkRightEdge(sequence[1], step.spawns[1].startX));
});

test('chunk right edge includes fan objects', () => {
  const definition: ChunkDefinition = {
    id: 'fan',
    widthTiles: 10,
    platforms: [],
    objects: [{ type: 'fan', xTiles: 2, yTiles: 0 }],
  };

  assert.equal(getChunkRightEdge(definition, 100), 100 + 2 * PLATFORM_TILE_SIZE + 12);
});
