import Phaser from 'phaser';
import { PALETTE } from '../../config/palette.ts';

interface TrailPoint {
  x: number;
  y: number;
}

const TRAIL_CONFIG = {
  color: PALETTE.orange,
  depth: 7,
  minPoints: 2,
  minThickness: 1,
  baseThickness: 5,
  alpha: 1,
  motorOffset: { x: -8, y: 8 },
  maxPoints: 40,
  minX: -150,
  delay: 15,
};

export class PlayerTrail {
  private readonly scene: Phaser.Scene;
  private readonly sprite: Phaser.Physics.Arcade.Sprite;
  private readonly graphics: Phaser.GameObjects.Graphics;
  private points: TrailPoint[] = [];
  private timer: Phaser.Time.TimerEvent | null = null;

  constructor(scene: Phaser.Scene, sprite: Phaser.Physics.Arcade.Sprite) {
    this.scene = scene;
    this.sprite = sprite;
    this.graphics = scene.add.graphics().setDepth(TRAIL_CONFIG.depth);
  }

  public start(): void {
    if (this.timer) return;

    this.timer = this.scene.time.addEvent({
      delay: TRAIL_CONFIG.delay,
      loop: true,
      callback: () => this._spawnPoint(),
    });
  }

  public stop(): void {
    this.timer?.remove();
    this.timer = null;
    this.clear();
  }

  public clear(): void {
    this.points = [];
    this.graphics.clear();
  }

  public update(deltaMove: number): void {
    for (let i = this.points.length - 1; i >= 0; i--) {
      this.points[i].x -= deltaMove;
      if (this.points[i].x < TRAIL_CONFIG.minX) {
        this.points.splice(i, 1);
      }
    }

    this._render();
  }

  private _spawnPoint(): void {
    const { x: offsetX, y: offsetY } = TRAIL_CONFIG.motorOffset;
    this.points.unshift({
      x: this.sprite.x + offsetX,
      y: this.sprite.y + offsetY,
    });
    if (this.points.length > TRAIL_CONFIG.maxPoints) {
      this.points.pop();
    }
  }

  private _render(): void {
    this.graphics.clear();
    if (this.points.length < TRAIL_CONFIG.minPoints) return;

    for (let i = 0; i < this.points.length - 1; i++) {
      const p1 = this.points[i];
      const p2 = this.points[i + 1];
      const thickness = Math.max(
        TRAIL_CONFIG.minThickness,
        TRAIL_CONFIG.baseThickness * (1 - i / this.points.length)
      );

      this.graphics.lineStyle(thickness, TRAIL_CONFIG.color, TRAIL_CONFIG.alpha);
      this.graphics.beginPath();
      this.graphics.moveTo(p1.x, p1.y);
      this.graphics.lineTo(p2.x, p2.y);
      this.graphics.strokePath();
    }
  }
}
