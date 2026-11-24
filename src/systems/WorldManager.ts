import Phaser from 'phaser';
import { GAMEPLAY_CONFIG, GROUND_Y } from '../config/gameConfig';
import { DeathCause } from '../config/playerConfig';
import { PIPE_CONFIG } from '../config/pipeConfig';
import { Phase, PhaseOptions } from '../phases/Phase';
import { Phase1 } from '../phases/Phase1';
import { Phase2 } from '../phases/Phase2';
import { getBodyBounds } from '../utils/common';

const WORLD_CONFIG = {
  initialSpeed: 143.9,
  dashSpeed: 533.9,
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
  private readonly phases: Phase[];
  private isBoosting: boolean = false;
  private decayTimer: number = 0;
  private lastDashTime: number = -Infinity;

  constructor(scene: Phaser.Scene, options: WorldManagerOptions = {}) {
    this.scene = scene;
    this.groundY = GROUND_Y;
    this.physicsGroup = scene.physics.add.staticGroup();
    this.phases = this._createPhases(options.onLevelComplete);
  }

  private _createPhases(onLevelComplete?: () => void): Phase[] {
    const phase1 = new Phase1(this.scene, this.groundY, this.physicsGroup);
    phase1.init();

    const phase2Options: PhaseOptions = {
      startX: phase1.nextX,
      onComplete: onLevelComplete,
    };
    const phase2 = new Phase2(
      this.scene,
      this.groundY,
      this.physicsGroup,
      phase2Options
    );
    phase2.init();

    return [phase1, phase2];
  }

  public get isDashActive(): boolean {
    return this.isBoosting;
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

  public getWallCollisionCause(
    playerBody: Phaser.Physics.Arcade.Body
  ): DeathCause | null {
    const playerBounds = getBodyBounds(playerBody);

    const hits = (candidate: { getBounds(): Phaser.Geom.Rectangle }): boolean => {
      const bounds = candidate.getBounds();
      const intersects = Phaser.Geom.Intersects.RectangleToRectangle(
        playerBounds,
        bounds
      );

      return intersects
        && playerBody.bottom
          > bounds.top + PIPE_CONFIG.collision.wallTolerance
        && playerBody.right > bounds.left;
    };

    if (this.phases.some(phase => phase.platforms.some(hits))) return 'wall';
    if (this.phases.some(phase => phase.objects.some(hits))) return 'object';
    return null;
  }

  public update(delta: number): void {
    this._updateSpeedDecay(delta);
    const shift = this._calculateShift(delta);
    this.phases.forEach(phase => phase.update(shift));
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
