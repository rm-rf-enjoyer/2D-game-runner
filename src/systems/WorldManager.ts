import Phaser from 'phaser';
import { GAME_HEIGHT, GAMEPLAY_CONFIG } from '../config/gameConfig';
import { DeathCause } from '../config/playerConfig';
import { PIPE_CONFIG } from '../config/pipeConfig';
import { Phase1 } from '../phases/Phase1';

const WORLD_CONFIG = {
  initialSpeed: 130,
  dashSpeed: 520,
  speedDecayStep: 130,
  speedDecayInterval: 150,
  dashCooldown: 2000,
  maxDelta: 50,
};

export interface WorldManagerOptions {
  onLevelComplete?: () => void;
}

export class WorldManager {
  public speed: number = WORLD_CONFIG.initialSpeed;
  public physicsGroup: Phaser.Physics.Arcade.StaticGroup;

  private readonly scene: Phaser.Scene;
  private readonly groundY: number;
  private readonly pipe: Phase1;
  private isBoosting: boolean = false;
  private decayTimer: number = 0;
  private lastDashTime: number = -Infinity;

  constructor(scene: Phaser.Scene, options: WorldManagerOptions = {}) {
    this.scene = scene;
    this.groundY = GAME_HEIGHT - GAMEPLAY_CONFIG.groundOffset;
    this.physicsGroup = scene.physics.add.staticGroup();
    this.pipe = new Phase1(scene, this.groundY, this.physicsGroup, {
      maxChunks: 6,
      onComplete: options.onLevelComplete,
    });

    this.pipe.init();
  }

  public triggerDash(): boolean {
    const currentTime = this.scene.time.now;
    if (currentTime - this.lastDashTime < WORLD_CONFIG.dashCooldown) {
      return false;
    }

    this.lastDashTime = currentTime;
    this.speed = WORLD_CONFIG.dashSpeed;
    this.isBoosting = true;
    this.decayTimer = 0;
    return true;
  }

  public getWallCollisionCause(playerBody: Phaser.Physics.Arcade.Body): DeathCause | null {
    const playerBounds = new Phaser.Geom.Rectangle(
      playerBody.x,
      playerBody.y,
      playerBody.width,
      playerBody.height
    );

    const platform = this.pipe.platforms.find(candidate => {
      if (!('getBounds' in candidate) || typeof candidate.getBounds !== 'function') {
        return false;
      }

      const platformBounds = (candidate as any).getBounds() as Phaser.Geom.Rectangle;
      const intersects = Phaser.Geom.Intersects.RectangleToRectangle(
        playerBounds,
        platformBounds
      );

      return intersects
        && playerBody.bottom > platformBounds.top + PIPE_CONFIG.collision.wallTolerance
        && playerBody.right > platformBounds.left;
    });

    if (!platform) return null;
    return 'wall';
  }

  public update(delta: number): void {
    this._updateSpeedDecay(delta);
    this.pipe.update(this._calculateShift(delta));
  }

  private _updateSpeedDecay(delta: number): void {
    if (!this.isBoosting) return;

    this.decayTimer += delta;

    while (this.decayTimer >= WORLD_CONFIG.speedDecayInterval) {
      this.decayTimer -= WORLD_CONFIG.speedDecayInterval;
      this.speed -= WORLD_CONFIG.speedDecayStep;

      if (this.speed <= WORLD_CONFIG.initialSpeed) {
        this.speed = WORLD_CONFIG.initialSpeed;
        this.isBoosting = false;
        this.decayTimer = 0;
        break;
      }
    }
  }

  private _calculateShift(delta: number): number {
    const safeDelta = Math.min(delta, WORLD_CONFIG.maxDelta);
    return this.speed * (safeDelta / GAMEPLAY_CONFIG.msPerSecond);
  }
}
