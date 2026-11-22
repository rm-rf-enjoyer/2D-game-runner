export const PIPE_TILE_SIZE = 12;
export const PIPE_TILES_KEY = 'pipe-tiles';

export const PIPE_CONFIG = {
  frames: {
    platformLeft: 0,
    platformMiddle: 1,
    platformRight: 2,
  },
  depth: {
    platform: 1,
  },
  platform: {
    minTiles: 8,
    maxTiles: 16,
    initialPlatforms: 2,
  },
  gap: {
    minTiles: 4,
    maxTiles: 6,
  },
  spawn: {
    startX: -240,
    aheadPadding: 240,
    despawnMargin: 240,
  },
  collision: {
    height: PIPE_TILE_SIZE * 2,
    wallTolerance: 8,
  },
  debugColor: 0xff0000,
};
