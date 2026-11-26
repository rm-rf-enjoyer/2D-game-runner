import Phaser from 'phaser';
import {
  FAN_ANIM_KEY,
  FAN_DEPTH,
  FAN_FOG_TEXTURE_KEY,
  FAN_FRAME_SIZE,
  FAN_TEXTURE_KEY,
} from '../config/objectsConfig';
import {
  createStaticCollider,
  destroyStaticCollider,
  getStaticColliderBounds,
  StaticCollider,
  syncStaticCollider,
} from '../utils/staticCollider';

const FOG_CONFIG = {
  depth: FAN_DEPTH - 1,
  frequency: 140,
  lifespan: { min: 600, max: 1000 },
  speed: { min: 6, max: 18 },
  angle: { min: 205, max: 335 },
  scale: { min: 2, max: 3, int: true },
  alpha: { start: 1, end: 1 },
  offset: Math.floor(FAN_FRAME_SIZE / 6),
};

export class FanObject {
  private x: number;
  private readonly sprite: Phaser.GameObjects.Sprite;
  private readonly fog: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly collisionBody: StaticCollider;
  private readonly physicsGroup: Phaser.Physics.Arcade.StaticGroup;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    physicsGroup: Phaser.Physics.Arcade.StaticGroup
  ) {
    this.x = x;
    this.physicsGroup = physicsGroup;

    this.sprite = scene.add.sprite(x, y, FAN_TEXTURE_KEY, 0).setDepth(FAN_DEPTH);
    this.sprite.play(FAN_ANIM_KEY);

    this.fog = scene.add
      .particles(x, y, FAN_FOG_TEXTURE_KEY, {
        x: { min: -FOG_CONFIG.offset, max: FOG_CONFIG.offset, int: true },
        y: { min: -FOG_CONFIG.offset, max: FOG_CONFIG.offset, int: true },
        speed: FOG_CONFIG.speed,
        angle: FOG_CONFIG.angle,
        lifespan: FOG_CONFIG.lifespan,
        scale: FOG_CONFIG.scale,
        alpha: FOG_CONFIG.alpha,
        frequency: FOG_CONFIG.frequency,
        quantity: 1,
      })
      .setDepth(FOG_CONFIG.depth);

    this.collisionBody = createStaticCollider(
      scene,
      physicsGroup,
      x,
      y,
      FAN_FRAME_SIZE,
      FAN_FRAME_SIZE
    );
  }

  public get rightEdge(): number {
    return this.x + FAN_FRAME_SIZE / 2;
  }

  public getBounds(): Phaser.Geom.Rectangle {
    return getStaticColliderBounds(this.collisionBody);
  }

  public update(shift: number): void {
    this.x -= shift;
    this.sprite.x -= shift;
    this.fog.x -= shift;
    this.collisionBody.x -= shift;
    syncStaticCollider(this.collisionBody);
  }

  public destroy(): void {
    destroyStaticCollider(this.physicsGroup, this.collisionBody);
    this.fog.destroy();
    this.sprite.destroy();
  }
}
