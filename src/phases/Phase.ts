import Phaser from 'phaser';
import { ChunkInstance, ChunkTemplate } from '../chunks/ChunkTemplate.ts';
import type { ChunkDefinition } from '../chunks/types.ts';
import { FanObject } from '../objects/FanObject.ts';
import { PipePlatform } from '../objects/platforms/PipePlatform.ts';
import { PhaseFlow } from './PhaseFlow.ts';
import type { SpawnTask } from './PhaseFlow.ts';

export interface PhaseOptions {
  startX?: number;
  maxChunks?: number;
  initialChunks?: number;
  onComplete?: () => void;
}

export abstract class Phase {
  public readonly platforms: PipePlatform[] = [];
  public readonly objects: FanObject[] = [];

  private readonly flow: PhaseFlow;
  private readonly onComplete?: () => void;
  private readonly chunks = new Map<number, ChunkInstance>();

  constructor(
    private readonly scene: Phaser.Scene,
    startY: number,
    private readonly physicsGroup: Phaser.Physics.Arcade.StaticGroup,
    sequence: ChunkDefinition[],
    options: PhaseOptions = {}
  ) {
    this.flow = new PhaseFlow(sequence, startY, options);
    this.onComplete = options.onComplete;
  }

  public get nextX(): number {
    return this.flow.nextX;
  }

  public init(): void {
    this.flow.init().forEach((task) => this._spawnChunk(task));
  }

  public update(shift: number): void {
    this.chunks.forEach((chunk) => chunk.update(shift));

    const step = this.flow.update(shift);
    step.despawns.forEach((id) => this._despawnChunk(id));
    step.spawns.forEach((task) => this._spawnChunk(task));

    if (step.justCompleted) {
      this.onComplete?.();
    }
  }

  private _spawnChunk(task: SpawnTask): void {
    const chunk = ChunkTemplate.spawn(task.definition, {
      scene: this.scene,
      physicsGroup: this.physicsGroup,
      startX: task.startX,
      baseY: task.baseY,
    });

    this.chunks.set(task.id, chunk);
    this.platforms.push(...chunk.platforms);
    this.objects.push(...chunk.objects);
  }

  private _despawnChunk(id: number): void {
    const chunk = this.chunks.get(id);
    if (!chunk) return;

    chunk.platforms.forEach((platform) => {
      const index = this.platforms.indexOf(platform);
      if (index !== -1) this.platforms.splice(index, 1);
    });
    chunk.objects.forEach((object) => {
      const index = this.objects.indexOf(object);
      if (index !== -1) this.objects.splice(index, 1);
    });

    chunk.destroy();
    this.chunks.delete(id);
  }
}
