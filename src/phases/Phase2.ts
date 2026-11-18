import Phaser from 'phaser';
import { Phase1 } from './Phase1.js';
import { Platform } from '../objects/Platform.js';

const PHASE2_CONFIG = {
  blockSize: 16,
  gapMinBlocks: 2,
  gapMaxBlocks: 3,
  obstacleGapBlocks: 3,
  minBlocks: 8,
  maxBlocks: 18,
  obstacleChance: 0.5,
  frameRegularEnd: 2,
  frameObstacleEnd: 3,
  platformType: 'ground',
};

export class Phase2 extends Phase1 {
  constructor(scene, startY, physicsGroup, trashGroup, state) {
    super(scene, startY, physicsGroup, trashGroup);
    this.platforms = state.platforms;
    this.nextSpawnX = state.nextSpawnX;
    this.lastPlatformHadObstacle = false;
    this.isFirstPlatform = true;
  }

  _spawnNext() {
    const gap = this._calculateGap();
    const x = this.nextSpawnX + gap;
    const blocks = Phaser.Math.Between(PHASE2_CONFIG.minBlocks, PHASE2_CONFIG.maxBlocks);
    const hasObstacle = this._shouldHaveObstacle();

    const platform = this._createPlatform(x, blocks, hasObstacle);

    this.platforms.push(platform);
    this.nextSpawnX = x + (blocks * PHASE2_CONFIG.blockSize);
    this.lastPlatformHadObstacle = hasObstacle;
    this.isFirstPlatform = false;
  }

  _calculateGap() {
    const { gapMinBlocks, gapMaxBlocks, obstacleGapBlocks, blockSize } = PHASE2_CONFIG;
    const gapInBlocks = this.lastPlatformHadObstacle
      ? obstacleGapBlocks
      : Phaser.Math.Between(gapMinBlocks, gapMaxBlocks);

    return gapInBlocks * blockSize;
  }

  _shouldHaveObstacle() {
    if (this.isFirstPlatform) return true;
    return Math.random() < PHASE2_CONFIG.obstacleChance;
  }

  _createPlatform(x, blocks, hasObstacle) {
    const endFrame = hasObstacle ? PHASE2_CONFIG.frameObstacleEnd : PHASE2_CONFIG.frameRegularEnd;

    const platform = new Platform(
      this.scene,
      x,
      this.startY,
      blocks,
      PHASE2_CONFIG.platformType,
      this.physicsGroup,
      this.trashGroup,
      endFrame
    );

    platform.hasObstacle = hasObstacle;
    if (hasObstacle) {
      platform.addObstacle();
    }

    return platform;
  }
}
