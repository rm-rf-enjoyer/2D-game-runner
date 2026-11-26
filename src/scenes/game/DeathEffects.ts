import type Phaser from 'phaser';
import { ASSET_KEYS } from '../../config/assetKeys.ts';
import type { DeathCause } from '../../config/playerConfig.ts';
import { BLOOD_EFFECT_CONFIG, type ParticleSettings, type PuddleShape } from './config.ts';

type EmitterSettings = ParticleSettings & { depth: number };

export class DeathEffects {
  private readonly scene: Phaser.Scene;
  private readonly colors: number[];

  constructor(scene: Phaser.Scene, colors: number[]) {
    this.scene = scene;
    this.colors = colors;
  }

  public play(cause: DeathCause, x: number, y: number): void {
    const config = BLOOD_EFFECT_CONFIG;
    const blood = this.createParticles(x, y, config.particle);

    blood.explode(config.particleCount);
    this.scene.time.delayedCall(config.particle.lifespan + config.cleanupDelay, () => {
      blood.destroy();
    });

    if (cause === 'object') {
      this.scene.time.delayedCall(config.puddleDelay, () => this.spawnBloodPuddle(x, y));
    }
  }

  private spawnBloodPuddle(x: number, y: number): void {
    const { puddle, puddleParticles, cleanupDelay } = BLOOD_EFFECT_CONFIG;
    const origin = { x: Math.round(x), y: Math.round(y + puddle.yOffset) };
    const blood = this.createParticles(origin.x, origin.y, {
      ...puddleParticles,
      depth: puddle.depth,
    });

    [...puddle.red, ...puddle.dark].forEach((shape: PuddleShape) => {
      blood.explode(
        puddleParticles.countPerShape,
        origin.x + shape.dx + shape.width / 2,
        origin.y + shape.dy + shape.height / 2
      );
    });

    this.scene.time.delayedCall(puddleParticles.lifespan + cleanupDelay, () => {
      blood.destroy();
    });
  }

  private createParticles(x: number, y: number, settings: EmitterSettings) {
    return this.scene.add
      .particles(x, y, ASSET_KEYS.texture.pixel, {
        lifespan: settings.lifespan,
        speedX: settings.speedX,
        speedY: settings.speedY,
        gravityY: settings.gravityY,
        scale: settings.scale,
        tint: this.colors,
        emitting: false,
      })
      .setDepth(settings.depth);
  }
}
