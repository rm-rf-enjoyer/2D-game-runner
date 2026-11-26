import { ASSET_KEYS } from '../assetKeys.ts';
import { PLATFORM_TILE_SIZE, PlatformConfig } from './types.ts';

export const PIPE_TILES_KEY = ASSET_KEYS.texture.pipeTiles;

export const PIPE_FRAMES = {
  platformLeft: 0,
  platformMiddle: 1,
  platformRight: 2,
};

export const PIPE_PLATFORM_CONFIG: PlatformConfig = {
  textureKey: PIPE_TILES_KEY,
  frame: PIPE_FRAMES.platformMiddle,
  edgeFrames: {
    left: PIPE_FRAMES.platformLeft,
    right: PIPE_FRAMES.platformRight,
  },
  depth: 1,
  collisionHeight: PLATFORM_TILE_SIZE * 2,
};
