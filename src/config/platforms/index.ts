import { PIPE_PLATFORM_CONFIG } from './pipePlatform';
import { TILE_PLATFORM_CONFIG } from './tilePlatform';
import { PlatformConfig, PlatformType } from './types';

export * from './types';
export * from './pipePlatform';
export * from './tilePlatform';

export const PLATFORM_CONFIGS: Record<PlatformType, PlatformConfig> = {
  pipe: PIPE_PLATFORM_CONFIG,
  tile: TILE_PLATFORM_CONFIG,
};
