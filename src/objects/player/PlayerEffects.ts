import Phaser from 'phaser';

interface ParticleConfig {
  lifespan: number;
  speedX: { min: number; max: number };
  speedY: { min: number; max: number };
  frequency?: number;
  quantity?: number;
  tint: number | number[];
  followOffset?: { x: number; y: number };
}

const EXHAUST_CONFIG = { depth: 4, scale: 1 };
const DUST_CONFIG = { depth: 4, yOffset: 12, cleanupDelay: 500 };
const SOUND_CONFIG = {
  jump: { volume: 1, rate: 1 },
  dash: { volume: 1, rate: 1 },
};

const EXHAUST_PARTICLE_CONFIG: ParticleConfig = {
  followOffset: { x: 0, y: 12 },
  lifespan: 300,
  speedX: { min: -20, max: -50 },
  speedY: { min: -10, max: 10 },
  frequency: 100,
  tint: 0x4FE8F4,
};

const DASH_PARTICLE_CONFIG: ParticleConfig = {
  followOffset: { x: 0, y: 12 },
  lifespan: 300,
  speedX: { min: -100, max: -200 },
  speedY: { min: -10, max: 10 },
  frequency: 30,
  tint: 0x4FE8F4,
};

const DUST_PARTICLE_CONFIG: ParticleConfig = {
  lifespan: 250,
  speedX: { min: -150, max: 150 },
  speedY: { min: -10, max: 10 },
  quantity: 12,
  tint: 0x67778D,
};

export class PlayerEffects {
  private readonly scene: Phaser.Scene;
  private readonly sprite: Phaser.Physics.Arcade.Sprite;
  private readonly exhaust: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(scene: Phaser.Scene, sprite: Phaser.Physics.Arcade.Sprite) {
    this.scene = scene;
    this.sprite = sprite;
    this.exhaust = scene.add.particles(0, 0, 'pixel-particle', {
      ...EXHAUST_PARTICLE_CONFIG,
      follow: sprite,
      scale: EXHAUST_CONFIG.scale,
      roundPixels: true
    }).setDepth(EXHAUST_CONFIG.depth);
  }

  public playJumpSound(): void {
    this.scene.sound.play('sfx-dash', SOUND_CONFIG.jump);
  }

  public playDashSound(): void {
    this.scene.sound.play('sfx-dash', SOUND_CONFIG.dash);
  }

  public startDash(): void {
    this.exhaust.setConfig(DASH_PARTICLE_CONFIG);
  }

  public endDash(): void {
    this.exhaust.setConfig(EXHAUST_PARTICLE_CONFIG);
  }

  public stopExhaust(): void {
    this.exhaust.stop();
  }

  public emitDust(): void {
    const dust = this.scene.add.particles(
      this.sprite.x,
      this.sprite.y + DUST_CONFIG.yOffset,
      'pixel-particle',
      { ...DUST_PARTICLE_CONFIG, emitting: false, roundPixels: true }
    ).setDepth(DUST_CONFIG.depth);

    dust.explode(DUST_PARTICLE_CONFIG.quantity);
    this.scene.time.delayedCall(DUST_CONFIG.cleanupDelay, () => dust.destroy());
  }
}
