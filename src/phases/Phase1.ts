import Phaser from 'phaser';
import { ChunkDefinition } from '../chunks/ChunkTemplate';
import { Phase, PhaseOptions } from './Phase';
import {
  PHASE1_PIPE_40_NO_GAP_CHUNK,
  PHASE1_PIPE_11_WITH_GAP_4_CHUNK,
  PHASE1_PIPE_40_WITH_GAP_5_CHUNK
} from '../chunks/phase1PipeChunks';
import {
  PHASE1_TILE_10_RAISED_3_CHUNK,
  PHASE1_TILE_1_RAISED_3_WITH_GAP_6_CHUNK,
  PHASE1_TILE_1_OFFSET_3_WITH_GAP_6_CHUNK,
  PHASE1_TILE_6_RAISED_3_CHUNK,
  PHASE1_TILE_12_WITH_FAN_AT_END_CHUNK,
  PHASE1_TILE_12_WITH_FAN_CHUNK,
  PHASE1_TILE_1_WITH_GAP_6_CHUNK,
  PHASE1_TILE_12_WITH_GAP_5_CHUNK
} from '../chunks/phase1TileChunks';
import { repeat } from '../utils/common';

export type Phase1Options = PhaseOptions;

export class Phase1 extends Phase {
  constructor(
    scene: Phaser.Scene,
    startY: number,
    physicsGroup: Phaser.Physics.Arcade.StaticGroup,
    options: Phase1Options = {}
  ) {
    super(scene, startY, physicsGroup, Phase1._createSequence(), options);
  }

  private static _createSequence(): ChunkDefinition[] {
    return [
      PHASE1_PIPE_40_WITH_GAP_5_CHUNK,
      ...repeat(PHASE1_PIPE_11_WITH_GAP_4_CHUNK, 2),
      PHASE1_TILE_12_WITH_GAP_5_CHUNK,
      ...repeat(PHASE1_TILE_1_WITH_GAP_6_CHUNK, 4),
      PHASE1_PIPE_40_NO_GAP_CHUNK,
      PHASE1_TILE_10_RAISED_3_CHUNK,
      ...repeat(PHASE1_TILE_12_WITH_FAN_CHUNK, 2),
      PHASE1_TILE_12_WITH_FAN_AT_END_CHUNK,
      PHASE1_TILE_6_RAISED_3_CHUNK,
      ...repeat(PHASE1_TILE_1_RAISED_3_WITH_GAP_6_CHUNK, 2),
      PHASE1_TILE_1_OFFSET_3_WITH_GAP_6_CHUNK,
      PHASE1_PIPE_40_WITH_GAP_5_CHUNK,
    ];
  }
}
