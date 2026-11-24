import Phaser from 'phaser';
import { PLATFORM_CONFIGS, PlatformType } from '../../config/platforms';
import { PipeSegment } from '../PipeSegment';
import {
  createStaticCollider,
  destroyStaticCollider,
  getStaticColliderBounds,
  StaticCollider,
  syncStaticCollider
} from '../../utils/staticCollider';

export interface PipePlatformOptions {
  tileCount: number;
  physicsGroup: Phaser.Physics.Arcade.StaticGroup;
  platformType?: PlatformType;
}

export class PipePlatform extends PipeSegment {
  private readonly collisionBody: StaticCollider;
  private readonly physicsGroup: Phaser.Physics.Arcade.StaticGroup;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    options: PipePlatformOptions
  ) {
    const config = PLATFORM_CONFIGS[options.platformType ?? 'pipe'];

    super(scene, x, y, {
      tileCount: options.tileCount,
      config,
    });

    this.physicsGroup = options.physicsGroup;
    this.collisionBody = createStaticCollider(
      scene,
      options.physicsGroup,
      this.x + this.width / 2,
      this.y + config.collisionHeight / 2,
      this.width,
      config.collisionHeight
    );
  }

  public getBounds(): Phaser.Geom.Rectangle {
    return getStaticColliderBounds(this.collisionBody);
  }

  public update(shift: number): void {
    super.update(shift);
    this.collisionBody.x -= shift;
    syncStaticCollider(this.collisionBody);
  }

  public destroy(): void {
    destroyStaticCollider(this.physicsGroup, this.collisionBody);
    super.destroy();
  }
}
