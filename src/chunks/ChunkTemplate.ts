import Phaser from 'phaser';
import { PIPE_TILE_SIZE } from '../config/pipeConfig';
import { PipePlatform } from '../objects/platforms/PipePlatform';

export type ChunkAttachSide = 'right';

export interface ChunkPlatformDef {
  xTiles: number;
  yTiles: number;
  widthTiles: number;
}

export interface ChunkObstacleDef {
  xTiles: number;
  yTiles: number;
  widthTiles: number;
  heightTiles: number;
}

export interface ChunkDefinition {
  id: string;
  widthTiles: number;
  heightTiles: number;
  entryYTiles: number;
  exitYTiles: number;
  attachSide: ChunkAttachSide;
  platforms: ChunkPlatformDef[];
  obstacles: ChunkObstacleDef[];
}

export interface ChunkSpawnContext {
  scene: Phaser.Scene;
  physicsGroup: Phaser.Physics.Arcade.StaticGroup;
  startX: number;
  baseY: number;
}

export interface ChunkInstance {
  definition: ChunkDefinition;
  platforms: PipePlatform[];
  nextX: number;
  width: number;
  update(shift: number): void;
  destroy(): void;
  isOffscreen(despawnMargin: number): boolean;
}

export class ChunkTemplate {
  public static readonly DEFAULT_HEIGHT_TILES = 16;

  public static create(definition: ChunkDefinition): ChunkDefinition {
    return {
      heightTiles: this.DEFAULT_HEIGHT_TILES,
      attachSide: 'right',
      obstacles: [],
      ...definition,
    };
  }

  public static spawn(
    definition: ChunkDefinition,
    context: ChunkSpawnContext
  ): ChunkInstance {
    const platforms = definition.platforms.map(platformDef =>
      this._spawnPlatform(platformDef, context)
    );

    const width = definition.widthTiles * PIPE_TILE_SIZE;

    return {
      definition,
      platforms,
      nextX: context.startX + width,
      width,
      update(shift: number): void {
        platforms.forEach(platform => platform.update(shift));
      },
      destroy(): void {
        platforms.forEach(platform => platform.destroy());
        platforms.length = 0;
      },
      isOffscreen(despawnMargin: number): boolean {
        return platforms.every(platform => platform.rightEdge < -despawnMargin);
      },
    };
  }

  private static _spawnPlatform(
    platformDef: ChunkPlatformDef,
    context: ChunkSpawnContext
  ): PipePlatform {
    const x = context.startX + platformDef.xTiles * PIPE_TILE_SIZE;
    const y = context.baseY - platformDef.yTiles * PIPE_TILE_SIZE;

    return new PipePlatform(context.scene, x, y, {
      tileCount: platformDef.widthTiles,
      physicsGroup: context.physicsGroup,
    });
  }
}
