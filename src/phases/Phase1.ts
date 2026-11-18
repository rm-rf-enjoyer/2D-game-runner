import Phaser from 'phaser';
import { Platform } from '../objects/Platform';
import { GAME_WIDTH } from '../config/gameConfig';

const BLOCK_SIZE = 16;
const START_BLOCKS = 25;
const MIN_BLOCKS = 8;
const MAX_BLOCKS = 18;
const GAP_MIN = 2;
const GAP_MAX = 3;

export class Phase1 {
  public platforms: Platform[] = [];
  public nextSpawnX: number = 0;
  
  private scene: Phaser.Scene;
  private startY: number;
  private physicsGroup: Phaser.Physics.Arcade.StaticGroup;
  private trashGroup: Phaser.Physics.Arcade.StaticGroup;

  constructor(
    scene: Phaser.Scene, 
    startY: number, 
    physicsGroup: Phaser.Physics.Arcade.StaticGroup, 
    trashGroup: Phaser.Physics.Arcade.StaticGroup
  ) {
    this.scene = scene;
    this.startY = startY;
    this.physicsGroup = physicsGroup;
    this.trashGroup = trashGroup;
  }

  public init(): void {
    this._spawnPlatform(-200, START_BLOCKS);
    this.nextSpawnX = -200 + (START_BLOCKS * BLOCK_SIZE); 
  }

  public update(shift: number): void {
    for (let i = this.platforms.length - 1; i >= 0; i--) {
      const p = this.platforms[i];
      p.update(shift);
      if (p.x + p.width < -300) {
        p.destroy();
        this.platforms.splice(i, 1);
      }
    }
    
    this.nextSpawnX -= shift;

    while (this.nextSpawnX < GAME_WIDTH + 200) {
      this._spawnNext();
    }
  }

  private _spawnNext(): void {
    const gap = Phaser.Math.Between(GAP_MIN, GAP_MAX) * BLOCK_SIZE; 
    const x = this.nextSpawnX + gap;
    const blocks = Phaser.Math.Between(MIN_BLOCKS, MAX_BLOCKS); 
    
    this._spawnPlatform(x, blocks);
    this.nextSpawnX = x + (blocks * BLOCK_SIZE);
  }

  private _spawnPlatform(x: number, blocks: number): void {
    const p = new Platform(
      this.scene,
      x,
      this.startY,
      blocks,
      'ground',
      this.physicsGroup,
      this.trashGroup,
      2
    );
    this.platforms.push(p);
  }
}
