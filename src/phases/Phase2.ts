import Phaser from 'phaser';
import type { ChunkDefinition } from '../chunks/types';
import { PHASE1_PIPE_40_WITH_GAP_5_CHUNK } from '../chunks/phase1PipeChunks';
import {
  createPhase2FinalPipeChunk,
  createPhase2Pipe20Chunk,
  createPhase2Tile10FanAtEndChunk,
  createPhase2Tile10Chunk,
  createPhase2Tile10Raised6Chunk,
  createPhase2Tile12DoubleFanChunk,
  createPhase2Tile12Chunk,
  createPhase2Tile14FanMiddleChunk,
  createPhase2Tile5Chunk,
} from '../chunks/phase2Chunks';
import { Phase, PhaseOptions } from './Phase';

export type Phase2Options = PhaseOptions;

const PHASE2_TILE_12_Y_TILES = 3;
const PHASE2_PIPE_20_Y_TILES = 0;
const PHASE2_SURFACE_Y_TILES = 0;
const PHASE2_RAISED_Y_TILES = 6;

export class Phase2 extends Phase {
  constructor(
    scene: Phaser.Scene,
    startY: number,
    physicsGroup: Phaser.Physics.Arcade.StaticGroup,
    options: Phase2Options = {}
  ) {
    super(scene, startY, physicsGroup, Phase2._createSequence(), options);
  }

  private static _createSequence(): ChunkDefinition[] {
    return [
      PHASE1_PIPE_40_WITH_GAP_5_CHUNK,
      createPhase2Pipe20Chunk(PHASE2_PIPE_20_Y_TILES),
      createPhase2Tile12Chunk(PHASE2_TILE_12_Y_TILES),
      createPhase2FinalPipeChunk(PHASE2_PIPE_20_Y_TILES),
      createPhase2Tile14FanMiddleChunk(PHASE2_SURFACE_Y_TILES),
      createPhase2Tile10FanAtEndChunk(PHASE2_SURFACE_Y_TILES),
      createPhase2Tile5Chunk(PHASE2_SURFACE_Y_TILES),
      createPhase2Tile12DoubleFanChunk(PHASE2_SURFACE_Y_TILES),
      createPhase2Tile10Raised6Chunk(PHASE2_RAISED_Y_TILES),
      createPhase2Tile10Chunk(PHASE2_RAISED_Y_TILES),
    ];
  }
}
