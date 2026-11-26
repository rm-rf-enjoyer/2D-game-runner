import Phaser from 'phaser';
import { PLATFORM_TILE_SIZE, PlatformConfig } from '../config/platforms';

export interface PipeSegmentOptions {
  tileCount: number;
  config: PlatformConfig;
}

export abstract class PipeSegment {
  protected readonly tiles: Phaser.GameObjects.Image[] = [];
  protected x: number;
  protected readonly y: number;
  protected readonly width: number;

  private readonly config: PlatformConfig;

  constructor(
    protected readonly scene: Phaser.Scene,
    x: number,
    y: number,
    options: PipeSegmentOptions
  ) {
    this.x = x;
    this.y = y;
    this.width = options.tileCount * PLATFORM_TILE_SIZE;
    this.config = options.config;
    this._createTiles();
  }

  public get rightEdge(): number {
    return this.x + this.width;
  }

  public update(shift: number): void {
    this.x -= shift;
    this.tiles.forEach((tile) => {
      tile.x -= shift;
    });
  }

  public destroy(): void {
    this.tiles.forEach((tile) => tile.destroy());
    this.tiles.length = 0;
  }

  private _createTiles(): void {
    const tileCount = this.width / PLATFORM_TILE_SIZE;

    for (let index = 0; index < tileCount; index++) {
      const tile = this.scene.add
        .image(
          this.x + index * PLATFORM_TILE_SIZE,
          this.y,
          this.config.textureKey,
          this._getFrame(index, tileCount)
        )
        .setOrigin(0, 0)
        .setDepth(this.config.depth);

      this.tiles.push(tile);
    }
  }

  private _getFrame(index: number, tileCount: number): number {
    if (!this.config.edgeFrames) return this.config.frame;
    if (index === 0) return this.config.edgeFrames.left;
    if (index === tileCount - 1) return this.config.edgeFrames.right;
    return this.config.frame;
  }
}
