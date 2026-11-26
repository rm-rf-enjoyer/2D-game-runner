import { FAN_FRAME_SIZE } from '../config/objectsConfig.ts';
import { PLATFORM_TILE_SIZE } from '../config/platforms/types.ts';
import type { ChunkDefinition } from './types.ts';

export function getChunkRightEdge(definition: ChunkDefinition, startX: number): number {
  let rightEdge = -Infinity;

  for (const platform of definition.platforms) {
    const edge = startX + (platform.xTiles + platform.widthTiles) * PLATFORM_TILE_SIZE;
    rightEdge = Math.max(rightEdge, edge);
  }

  for (const object of definition.objects) {
    const edge = startX + object.xTiles * PLATFORM_TILE_SIZE + FAN_FRAME_SIZE / 2;
    rightEdge = Math.max(rightEdge, edge);
  }

  return rightEdge;
}
