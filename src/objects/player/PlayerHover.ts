import Phaser from 'phaser';
import { PLAYER_CONFIG } from '../../config/playerConfig';

interface HoverStep {
  x?: number;
  y?: number;
  bodyY?: number;
}

const HOVER_STEPS: HoverStep[] = [
  { y: -1, bodyY: 1 },
  { y: 1, bodyY: 0 },
  { x: 1 },
  { x: -1 },
  { x: -1 },
  { x: 1 },
];

export class PlayerHover {
  private readonly sprite: Phaser.Physics.Arcade.Sprite;
  private readonly timer: Phaser.Time.TimerEvent;
  private readonly canStep: () => boolean;
  private state: number = 0;

  constructor(
    scene: Phaser.Scene,
    sprite: Phaser.Physics.Arcade.Sprite,
    canStep: () => boolean
  ) {
    this.sprite = sprite;
    this.canStep = canStep;
    this.timer = scene.time.addEvent({
      delay: PLAYER_CONFIG.hoverDelay,
      loop: true,
      callback: () => {
        if (!this.canStep()) return;
        this._step();
      }
    });
  }

  public reset(): void {
    this.state = 0;
  }

  public stop(): void {
    this.timer.remove();
  }

  private _step(): void {
    const step = HOVER_STEPS[this.state];

    if (step.x !== undefined) this.sprite.x += step.x;
    if (step.y !== undefined) this.sprite.y += step.y;
    if (step.bodyY !== undefined) {
      this.sprite.body.setOffset(PLAYER_CONFIG.bodyOffset.x, step.bodyY);
    }

    this.state = (this.state + 1) % HOVER_STEPS.length;
  }
}
