import { ChunkTemplate } from './ChunkTemplate.ts';
import type { ChunkDefinition } from './types.ts';

export const PHASE1_PIPE_40_WITH_GAP_5_CHUNK: ChunkDefinition = ChunkTemplate.create({
  id: 'phase1-pipe-40-gap-5',
  widthTiles: 45,
  platforms: [{ xTiles: 0, yTiles: 0, widthTiles: 40 }],
});

export const PHASE1_PIPE_40_NO_GAP_CHUNK: ChunkDefinition = ChunkTemplate.create({
  id: 'phase1-pipe-40-no-gap',
  widthTiles: 40,
  platforms: [{ xTiles: 0, yTiles: 0, widthTiles: 40 }],
});

export const PHASE1_PIPE_11_WITH_GAP_4_CHUNK: ChunkDefinition = ChunkTemplate.create({
  id: 'phase1-pipe-11-gap-4',
  widthTiles: 15,
  platforms: [{ xTiles: 0, yTiles: 0, widthTiles: 11 }],
});
