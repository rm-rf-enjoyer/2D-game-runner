import { PIPE_PLATFORM_CONFIG } from './pipePlatform.ts';
import { TILE_PLATFORM_CONFIG } from './tilePlatform.ts';
import { PlatformConfig, PlatformType } from './types.ts';

export * from './types.ts';
export * from './pipePlatform.ts';
export * from './tilePlatform.ts';

export const PLATFORM_CONFIGS: Record<PlatformType, PlatformConfig> = {
  pipe: PIPE_PLATFORM_CONFIG,
  tile: TILE_PLATFORM_CONFIG,
};
