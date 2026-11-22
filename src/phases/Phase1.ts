import Phaser from 'phaser';
import { PIPE_CONFIG } from '../config/pipeConfig';
import { ChunkDefinition, ChunkInstance, ChunkTemplate } from '../chunks/ChunkTemplate';
import { PHASE1_JUMP_CHUNK } from '../chunks/phase1Chunks';
import { PHASE1_JUMP_DASH_CHUNK } from '../chunks/phase1DashChunks';

export interface Phase1Options {
  maxChunks?: number;
  onComplete?: () => void;
}

export class Phase1 {
  public readonly platforms: Phaser.GameObjects.GameObject[] = [];
  public nextX: number = PIPE_CONFIG.spawn.startX;

  private readonly chunks: ChunkInstance[] = [];
  private readonly sequence: ChunkDefinition[];
  private readonly maxChunks: number;
  private readonly onComplete?: () => void;
  private spawnedChunks: number = 0;
  private completed: boolean = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly startY: number,
    private readonly physicsGroup: Phaser.Physics.Arcade.StaticGroup,
    options: Phase1Options = {}
  ) {
    this.maxChunks = options.maxChunks ?? 3;
    this.onComplete = options.onComplete;
    this.sequence = [
      PHASE1_JUMP_CHUNK,
      PHASE1_JUMP_CHUNK,
      PHASE1_JUMP_CHUNK,
      PHASE1_JUMP_DASH_CHUNK,
      PHASE1_JUMP_DASH_CHUNK,
      PHASE1_JUMP_DASH_CHUNK,
    ];
  }

  public init(): void {
    this._fillAhead();
  }

  public update(shift: number): void {
    this._moveChunks(shift);
    this._removeOffscreenChunks();
    this.nextX -= shift;
    this._fillAhead();
    this._checkCompletion();
  }

  protected _fillAhead(): void {
    while (!this.completed && this.spawnedChunks < this.maxChunks) {
      const definition = this.sequence[this.spawnedChunks % this.sequence.length];
      this._spawnChunk(definition);
    }
  }

  private _spawnChunk(definition: ChunkDefinition): void {
    const chunk = ChunkTemplate.spawn(definition, {
      scene: this.scene,
      physicsGroup: this.physicsGroup,
      startX: this.nextX,
      baseY: this.startY,
    });

    this.chunks.push(chunk);
    this.platforms.push(...chunk.platforms);
    this.nextX = chunk.nextX;
    this.spawnedChunks += 1;
  }

  private _moveChunks(shift: number): void {
    this.chunks.forEach(chunk => chunk.update(shift));
  }

  private _removeOffscreenChunks(): void {
    for (let index = this.chunks.length - 1; index >= 0; index--) {
      const chunk = this.chunks[index];
      if (!chunk.isOffscreen(PIPE_CONFIG.spawn.despawnMargin)) continue;

      chunk.platforms.forEach(platform => {
        const platformIndex = this.platforms.indexOf(platform);
        if (platformIndex !== -1) this.platforms.splice(platformIndex, 1);
      });
      chunk.destroy();
      this.chunks.splice(index, 1);
    }
  }

  private _checkCompletion(): void {
    if (this.completed) return;
    if (this.spawnedChunks < this.maxChunks) return;
    if (this.chunks.length > 0) return;

    this.completed = true;
    this.onComplete?.();
  }
}
