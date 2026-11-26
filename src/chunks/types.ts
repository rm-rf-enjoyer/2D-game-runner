import type { PlatformType } from '../config/platforms/types.ts';

export type ChunkObjectType = 'fan';

export interface ChunkPlatformDef {
  xTiles: number;
  yTiles: number;
  widthTiles: number;
  platformType?: PlatformType;
}

export interface ChunkObjectDef {
  type: ChunkObjectType;
  xTiles: number;
  yTiles: number;
}

export interface ChunkDefinition {
  id: string;
  widthTiles: number;
  platforms: ChunkPlatformDef[];
  objects: ChunkObjectDef[];
}
