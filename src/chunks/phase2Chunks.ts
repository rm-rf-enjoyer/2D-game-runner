import { ChunkDefinition, ChunkTemplate } from './ChunkTemplate';

export function createPhase2Pipe20Chunk(yTiles: number): ChunkDefinition {
  return ChunkTemplate.create({
    id: `phase2-pipe-20-gap-4-y-${yTiles}`,
    widthTiles: 24,
    platforms: [
      { xTiles: 0, yTiles, widthTiles: 20 },
    ],
  });
}

export function createPhase2Tile12Chunk(yTiles: number): ChunkDefinition {
  return ChunkTemplate.create({
    id: `phase2-tile-12-y-${yTiles}`,
    widthTiles: 17,
    platforms: [
      { xTiles: 0, yTiles, widthTiles: 12, platformType: 'tile' },
    ],
  });
}

export function createPhase2Tile14FanMiddleChunk(yTiles: number): ChunkDefinition {
  return ChunkTemplate.create({
    id: `phase2-tile-14-fan-middle-y-${yTiles}`,
    widthTiles: 19,
    platforms: [
      { xTiles: 0, yTiles, widthTiles: 14, platformType: 'tile' },
    ],
    objects: [
      { type: 'fan', xTiles: 7, yTiles: yTiles + 1 },
    ],
  });
}

export function createPhase2Tile10FanAtEndChunk(yTiles: number): ChunkDefinition {
  return ChunkTemplate.create({
    id: `phase2-tile-10-fan-at-end-y-${yTiles}`,
    widthTiles: 16,
    platforms: [
      { xTiles: 0, yTiles, widthTiles: 10, platformType: 'tile' },
    ],
    objects: [
      { type: 'fan', xTiles: 9, yTiles: yTiles + 1 },
    ],
  });
}

export function createPhase2Tile10Chunk(yTiles: number): ChunkDefinition {
  return ChunkTemplate.create({
    id: `phase2-tile-10-fan-at-start-y-${yTiles}`,
    widthTiles: 10,
    platforms: [
      { xTiles: 0, yTiles, widthTiles: 10, platformType: 'tile' },
    ],
    objects: [
      { type: 'fan', xTiles: 1, yTiles: yTiles + 1 },
    ],
  });
}

export function createPhase2Tile10Raised6Chunk(yTiles: number): ChunkDefinition {
  return ChunkTemplate.create({
    id: `phase2-tile-10-raised-${yTiles}-gap-4-before-gap-8-after`,
    widthTiles: 22,
    platforms: [
      { xTiles: 4, yTiles, widthTiles: 10, platformType: 'tile' },
    ],
  });
}

export function createPhase2Tile12DoubleFanChunk(yTiles: number): ChunkDefinition {
  return ChunkTemplate.create({
    id: `phase2-tile-12-double-fan-gap-5-y-${yTiles}`,
    widthTiles: 17,
    platforms: [
      { xTiles: 0, yTiles, widthTiles: 12, platformType: 'tile' },
      { xTiles: 8, yTiles: yTiles + 3, widthTiles: 8, platformType: 'tile' },
      { xTiles: 12, yTiles: yTiles + 6, widthTiles: 4, platformType: 'tile' },
    ],
    objects: [
      { type: 'fan', xTiles: 9, yTiles: yTiles + 1 },
      { type: 'fan', xTiles: 11, yTiles: yTiles + 1 },
      { type: 'fan', xTiles: 13, yTiles: yTiles + 4 },
      { type: 'fan', xTiles: 15, yTiles: yTiles + 4 },
    ],
  });
}

export function createPhase2Tile5Chunk(yTiles: number): ChunkDefinition {
  return ChunkTemplate.create({
    id: `phase2-tile-5-y-${yTiles}`,
    widthTiles: 10,
    platforms: [
      { xTiles: 0, yTiles, widthTiles: 5, platformType: 'tile' },
    ],
  });
}

export function createPhase2FinalPipeChunk(yTiles: number): ChunkDefinition {
  return ChunkTemplate.create({
    id: `phase2-final-pipe-y-${yTiles}`,
    widthTiles: 105,
    platforms: [
      { xTiles: 0, yTiles, widthTiles: 20 },
      { xTiles: 20, yTiles: 3, widthTiles: 20 },
      { xTiles: 40, yTiles: 6, widthTiles: 20 },
      { xTiles: 60, yTiles: 3, widthTiles: 20 },
      { xTiles: 80, yTiles: 0, widthTiles: 20 },
    ],
  });
}
