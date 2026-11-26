import { ChunkTemplate } from './ChunkTemplate';
import type { ChunkDefinition } from './types';

export const PHASE1_TILE_1_WITH_GAP_6_CHUNK: ChunkDefinition = ChunkTemplate.create({
  id: 'phase1-tile-1-gap-6',
  widthTiles: 7,
  platforms: [{ xTiles: 0, yTiles: 0, widthTiles: 1, platformType: 'tile' }],
});

export const PHASE1_TILE_10_RAISED_3_CHUNK: ChunkDefinition = ChunkTemplate.create({
  id: 'phase1-tile-10-raised-3',
  widthTiles: 16,
  platforms: [{ xTiles: 0, yTiles: 3, widthTiles: 10, platformType: 'tile' }],
});

export const PHASE1_TILE_12_WITH_GAP_5_CHUNK: ChunkDefinition = ChunkTemplate.create({
  id: 'phase1-tile-12-gap-5',
  widthTiles: 17,
  platforms: [{ xTiles: 0, yTiles: 0, widthTiles: 12, platformType: 'tile' }],
});

export const PHASE1_TILE_12_WITH_FAN_CHUNK: ChunkDefinition = ChunkTemplate.create({
  id: 'phase1-tile-12-with-fan',
  widthTiles: 18,
  platforms: [{ xTiles: 0, yTiles: 3, widthTiles: 12, platformType: 'tile' }],
  objects: [{ type: 'fan', xTiles: 6, yTiles: 4 }],
});

export const PHASE1_TILE_12_WITH_FAN_AT_END_CHUNK: ChunkDefinition = ChunkTemplate.create({
  id: 'phase1-tile-12-with-fan-at-end',
  widthTiles: 18,
  platforms: [{ xTiles: 0, yTiles: 3, widthTiles: 12, platformType: 'tile' }],
  objects: [{ type: 'fan', xTiles: 11, yTiles: 4 }],
});

export const PHASE1_TILE_6_RAISED_3_CHUNK: ChunkDefinition = ChunkTemplate.create({
  id: 'phase1-tile-6-raised-3',
  widthTiles: 12,
  platforms: [{ xTiles: 0, yTiles: 3, widthTiles: 6, platformType: 'tile' }],
});

export const PHASE1_TILE_1_RAISED_3_WITH_GAP_6_CHUNK: ChunkDefinition = ChunkTemplate.create({
  id: 'phase1-tile-1-raised-3-gap-6',
  widthTiles: 7,
  platforms: [{ xTiles: 0, yTiles: 3, widthTiles: 1, platformType: 'tile' }],
});

export const PHASE1_TILE_1_OFFSET_3_WITH_GAP_6_CHUNK: ChunkDefinition = ChunkTemplate.create({
  id: 'phase1-tile-1-offset-3-gap-6',
  widthTiles: 10,
  platforms: [{ xTiles: 2, yTiles: 0, widthTiles: 2, platformType: 'tile' }],
});
