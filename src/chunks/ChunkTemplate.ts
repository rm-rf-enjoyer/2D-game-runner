import Phaser from 'phaser';
import { PLATFORM_TILE_SIZE, PlatformType } from '../config/platforms';
import { FanObject } from '../objects/FanObject';
import { PipePlatform } from '../objects/platforms/PipePlatform';

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

export interface ChunkSpawnContext {
  scene: Phaser.Scene;
  physicsGroup: Phaser.Physics.Arcade.StaticGroup;
  startX: number;
  baseY: number;
}

interface ChunkEntity {
  rightEdge: number;
  update(shift: number): void;
  destroy(): void;
}

export interface ChunkInstance {
  platforms: PipePlatform[];
  objects: FanObject[];
  nextX: number;
  update(shift: number): void;
  destroy(): void;
  isOffscreen(despawnMargin: number): boolean;
}

export class ChunkTemplate {
  public static create(
    definition: Omit<ChunkDefinition, 'objects'>
      & Partial<Pick<ChunkDefinition, 'objects'>>
  ): ChunkDefinition {
    return { objects: [], ...definition };
  }

  public static spawn(
    definition: ChunkDefinition,
    context: ChunkSpawnContext
  ): ChunkInstance {
    const platforms = definition.platforms.map(platformDef =>
      this._spawnPlatform(platformDef, context)
    );
    const objects = definition.objects.map(objectDef =>
      this._spawnObject(objectDef, context)
    );

    const nextX = context.startX + definition.widthTiles * PLATFORM_TILE_SIZE;

    return {
      platforms,
      objects,
      nextX,
      update(shift: number): void {
        platforms.forEach(platform => platform.update(shift));
        objects.forEach(object => object.update(shift));
      },
      destroy(): void {
        platforms.forEach(platform => platform.destroy());
        objects.forEach(object => object.destroy());
        platforms.length = 0;
        objects.length = 0;
      },
      isOffscreen(despawnMargin: number): boolean {
        const entities: ChunkEntity[] = [...platforms, ...objects];
        return entities.every(entity => entity.rightEdge < -despawnMargin);
      },
    };
  }

  private static _spawnPlatform(
    platformDef: ChunkPlatformDef,
    context: ChunkSpawnContext
  ): PipePlatform {
    const x = context.startX + platformDef.xTiles * PLATFORM_TILE_SIZE;
    const y = context.baseY - platformDef.yTiles * PLATFORM_TILE_SIZE;

    return new PipePlatform(context.scene, x, y, {
      tileCount: platformDef.widthTiles,
      physicsGroup: context.physicsGroup,
      platformType: platformDef.platformType,
    });
  }

  private static _spawnObject(
    objectDef: ChunkObjectDef,
    context: ChunkSpawnContext
  ): FanObject {
    const x = context.startX + objectDef.xTiles * PLATFORM_TILE_SIZE;
    const y = context.baseY - objectDef.yTiles * PLATFORM_TILE_SIZE;

    switch (objectDef.type) {
      case 'fan':
        return new FanObject(context.scene, x, y, context.physicsGroup);
      default:
        throw new Error(`Unknown chunk object type: ${objectDef.type}`);
    }
  }
}
