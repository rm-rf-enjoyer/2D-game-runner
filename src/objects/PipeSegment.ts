import Phaser from 'phaser';
import { PIPE_TILES_KEY, PIPE_TILE_SIZE } from '../config/pipeConfig';

export interface PipeSegmentOptions {
  tileCount: number;
  frame: number;
  depth: number;
  edgeFrames?: { left: number; right: number };
}

export abstract class PipeSegment {
  protected readonly tiles: Phaser.GameObjects.Image[] = [];
  protected x: number;
  protected readonly y: number;
  protected readonly width: number;

  private readonly frame: number;
  private readonly depth: number;
  private readonly edgeFrames?: { left: number; right: number };

  constructor(
    protected readonly scene: Phaser.Scene,
    x: number,
    y: number,
    options: PipeSegmentOptions
  ) {
    this.x = x;
    this.y = y;
    this.width = options.tileCount * PIPE_TILE_SIZE;
    this.frame = options.frame;
    this.depth = options.depth;
    this.edgeFrames = options.edgeFrames;
    this._createTiles();
  }

  public get rightEdge(): number {
    return this.x + this.width;
  }

  public update(shift: number): void {
    this.x -= shift;
    this.tiles.forEach(tile => {
      tile.x -= shift;
    });
  }

  public destroy(): void {
    this.tiles.forEach(tile => tile.destroy());
    this.tiles.length = 0;
  }

  private _createTiles(): void {
    const tileCount = this.width / PIPE_TILE_SIZE;

    for (let index = 0; index < tileCount; index++) {
      const tile = this.scene.add.image(
        this.x + index * PIPE_TILE_SIZE,
        this.y,
        PIPE_TILES_KEY,
        this._getFrame(index, tileCount)
      )
        .setOrigin(0, 0)
        .setDepth(this.depth);

      this.tiles.push(tile);
    }
  }

  private _getFrame(index: number, tileCount: number): number {
    if (!this.edgeFrames) return this.frame;
    if (index === 0) return this.edgeFrames.left;
    if (index === tileCount - 1) return this.edgeFrames.right;
    return this.frame;
  }
}
