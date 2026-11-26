import { ASSET_KEYS } from '../assetKeys.ts';
import { PLATFORM_TILE_SIZE, PlatformConfig } from './types.ts';

export const TILE_TEXTURE_KEY = ASSET_KEYS.texture.tile;

export const TILE_PLATFORM_CONFIG: PlatformConfig = {
  textureKey: TILE_TEXTURE_KEY,
  frame: 0,
  depth: 1,
  collisionHeight: PLATFORM_TILE_SIZE * 2,
};
