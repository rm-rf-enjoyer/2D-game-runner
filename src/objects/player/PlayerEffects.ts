import Phaser from 'phaser';
import { PLAYER_PALETTE } from '../../config/playerConfig';

interface SpeedRange {
  min: number;
  max: number;
}

interface ScaleRange {
  min: number;
  max: number;
}

interface ParticleConfig {
  lifespan: number;
  speedX: SpeedRange;
  speedY: SpeedRange;
  frequency: number;
  quantity: number;
  tint: number[];
  scale: ScaleRange;
  alpha: { start: number; end: number };
  gravityY: number;
}

const EXHAUST_CONFIG = { depth: 4 };
const DUST_CONFIG = { depth: 4, yOffset: 12, cleanupDelay: 500 };

const SOUND_SETTINGS = { volume: 1, rate: 1 };

const DIRT_TINTS = [
  PLAYER_PALETTE.darkDirt,
  PLAYER_PALETTE.dirt,
  PLAYER_PALETTE.midDirt,
  PLAYER_PALETTE.midDirt,
  PLAYER_PALETTE.dust,
  PLAYER_PALETTE.dust,
  PLAYER_PALETTE.lightDirt,
];

const WHEEL_OFFSETS = [
  { x: -5, y: 10 },
  { x: 4, y: 10 },
];

function createDirtConfig(
  speedX: SpeedRange,
  speedY: SpeedRange,
  frequency: number,
  scale: ScaleRange,
  lifespan: number,
  quantity: number
): ParticleConfig {
  return {
    lifespan,
    speedX,
    speedY,
    frequency,
    quantity,
    tint: DIRT_TINTS,
    scale,
    alpha: { start: 1, end: 1 },
    gravityY: 220,
  };
}

const HOVER_DIRT_CONFIG = createDirtConfig(
  { min: -110, max: -50 },
  { min: -35, max: -10 },
  60,
  { min: 1, max: 1.5 },
  340,
  1
);

const DASH_DIRT_CONFIG = createDirtConfig(
  { min: -240, max: -140 },
  { min: -60, max: -20 },
  18,
  { min: 1, max: 2 },
  380,
  2
);

const LANDING_DUST_CONFIG = {
  lifespan: 280,
  speedX: { min: -150, max: 150 },
  speedY: { min: -35, max: 5 },
  tint: DIRT_TINTS,
  scale: { min: 1, max: 2 },
  alpha: { start: 1, end: 1 },
  gravityY: 260,
  quantity: 12,
};

export class PlayerEffects {
  private readonly scene: Phaser.Scene;
  private readonly sprite: Phaser.Physics.Arcade.Sprite;
  private readonly wheels: Phaser.GameObjects.Particles.ParticleEmitter[];

  constructor(scene: Phaser.Scene, sprite: Phaser.Physics.Arcade.Sprite) {
    this.scene = scene;
    this.sprite = sprite;
    this.wheels = WHEEL_OFFSETS.map((offset) =>
      scene.add
        .particles(0, 0, 'pixel-particle', {
          ...HOVER_DIRT_CONFIG,
          follow: sprite,
          followOffset: offset,
        })
        .setDepth(EXHAUST_CONFIG.depth)
    );
  }

  public playJumpSound(): void {
    this._playSound();
  }

  public playDashSound(): void {
    this._playSound();
  }

  public startDash(): void {
    this.wheels.forEach((wheel) => wheel.setConfig(DASH_DIRT_CONFIG));
  }

  public endDash(): void {
    this.wheels.forEach((wheel) => wheel.setConfig(HOVER_DIRT_CONFIG));
  }

  private _playSound(): void {
    this.scene.sound.play('sfx-dash', SOUND_SETTINGS);
  }

  public stopExhaust(): void {
    this.wheels.forEach((wheel) => wheel.stop());
  }

  public emitDust(): void {
    const dust = this.scene.add
      .particles(this.sprite.x, this.sprite.y + DUST_CONFIG.yOffset, 'pixel-particle', {
        ...LANDING_DUST_CONFIG,
        emitting: false,
      })
      .setDepth(DUST_CONFIG.depth);

    dust.explode(LANDING_DUST_CONFIG.quantity);
    this.scene.time.delayedCall(DUST_CONFIG.cleanupDelay, () => dust.destroy());
  }
}
