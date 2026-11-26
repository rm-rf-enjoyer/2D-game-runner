import { PIPE_CONFIG } from '../config/pipeConfig.ts';
import { PLATFORM_TILE_SIZE } from '../config/platforms/types.ts';
import { getChunkRightEdge } from '../chunks/ChunkMetrics.ts';
import type { ChunkDefinition } from '../chunks/types.ts';

export interface SpawnTask {
  id: number;
  definition: ChunkDefinition;
  startX: number;
  baseY: number;
  rightEdge: number;
}

export interface PhaseStep {
  spawns: SpawnTask[];
  despawns: number[];
  justCompleted: boolean;
}

export interface PhaseFlowOptions {
  startX?: number;
  maxChunks?: number;
}

interface LogicalChunk {
  id: number;
  rightEdge: number;
}

export class PhaseFlow {
  public nextX: number;

  private readonly sequence: readonly ChunkDefinition[];
  private readonly baseY: number;
  private readonly maxChunks: number;
  private readonly chunks: LogicalChunk[] = [];
  private spawnedChunks = 0;
  private totalShift = 0;
  private completed = false;
  private nextId = 0;

  constructor(sequence: readonly ChunkDefinition[], baseY: number, options: PhaseFlowOptions = {}) {
    this.sequence = sequence;
    this.baseY = baseY;
    this.nextX = options.startX ?? PIPE_CONFIG.spawn.startX;
    this.maxChunks = options.maxChunks ?? sequence.length;
  }

  public init(): SpawnTask[] {
    return this.fillAhead();
  }

  public update(shift: number): PhaseStep {
    this.chunks.forEach((chunk) => {
      chunk.rightEdge -= shift;
    });

    this.totalShift += shift;

    const despawns = this.removeOffscreen();
    const spawns = this.fillAhead();

    return {
      spawns,
      despawns,
      justCompleted: this.checkCompletion(),
    };
  }

  private fillAhead(): SpawnTask[] {
    const spawns: SpawnTask[] = [];

    while (!this.completed && this.spawnedChunks < this.maxChunks) {
      const definition = this.sequence[this.spawnedChunks % this.sequence.length];
      spawns.push(this.spawn(definition));
    }

    return spawns;
  }

  private spawn(definition: ChunkDefinition): SpawnTask {
    const startX = this.nextX;
    const id = this.nextId++;
    const rightEdge = getChunkRightEdge(definition, startX) - this.totalShift;

    this.chunks.push({ id, rightEdge });

    this.nextX = startX + definition.widthTiles * PLATFORM_TILE_SIZE;
    this.spawnedChunks += 1;

    return {
      id,
      definition,
      startX,
      baseY: this.baseY,
      rightEdge,
    };
  }

  private removeOffscreen(): number[] {
    const despawns: number[] = [];

    for (let index = this.chunks.length - 1; index >= 0; index--) {
      const chunk = this.chunks[index];
      if (chunk.rightEdge >= -PIPE_CONFIG.spawn.despawnMargin) continue;

      despawns.push(chunk.id);
      this.chunks.splice(index, 1);
    }

    return despawns;
  }

  private checkCompletion(): boolean {
    if (this.completed) return false;
    if (this.spawnedChunks < this.maxChunks) return false;
    if (this.chunks.length > 0) return false;

    this.completed = true;
    return true;
  }
}
