export type PlatformType = 'pipe' | 'tile';

export const PLATFORM_TILE_SIZE = 12;

export interface PlatformConfig {
  textureKey: string;
  frame: number;
  depth: number;
  collisionHeight: number;
  edgeFrames?: { left: number; right: number };
}
