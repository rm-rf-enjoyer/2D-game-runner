import Phaser from 'phaser';
import { PIPE_CONFIG } from '../../config/pipeConfig';
import { PipeSegment } from '../PipeSegment';

export interface PipePlatformOptions {
  tileCount: number;
  physicsGroup: Phaser.Physics.Arcade.StaticGroup;
  frame?: number;
  edgeFrames?: { left: number; right: number };
}

export class PipePlatform extends PipeSegment {
  private readonly collisionBody: Phaser.GameObjects.Rectangle;
  private readonly physicsGroup: Phaser.Physics.Arcade.StaticGroup;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    options: PipePlatformOptions
  ) {
    super(scene, x, y, {
      tileCount: options.tileCount,
      frame: options.frame ?? PIPE_CONFIG.frames.platformMiddle,
      depth: PIPE_CONFIG.depth.platform,
      edgeFrames: options.edgeFrames ?? {
        left: PIPE_CONFIG.frames.platformLeft,
        right: PIPE_CONFIG.frames.platformRight,
      },
    });

    this.physicsGroup = options.physicsGroup;
    this.collisionBody = this._createCollisionBody();
  }

  public getBounds(): Phaser.Geom.Rectangle {
    const body = this.collisionBody.body as Phaser.Physics.Arcade.StaticBody;
    return new Phaser.Geom.Rectangle(body.x, body.y, body.width, body.height);
  }

  public update(shift: number): void {
    super.update(shift);
    this.collisionBody.x -= shift;
    this._syncCollisionBody();
  }

  public destroy(): void {
    this.physicsGroup.remove(this.collisionBody);
    this.collisionBody.destroy();
    super.destroy();
  }

  private _createCollisionBody(): Phaser.GameObjects.Rectangle {
    const rectangle = this.scene.add.rectangle(
      this.x + this.width / 2,
      this.y + PIPE_CONFIG.collision.height / 2,
      this.width,
      PIPE_CONFIG.collision.height,
      PIPE_CONFIG.debugColor,
      0
    );

    this.scene.physics.add.existing(rectangle, true);
    this.physicsGroup.add(rectangle);
    this._syncCollisionBodyOf(rectangle);

    return rectangle;
  }

  private _syncCollisionBody(): void {
    this._syncCollisionBodyOf(this.collisionBody);
  }

  private _syncCollisionBodyOf(rectangle: Phaser.GameObjects.Rectangle): void {
    const body = rectangle.body as Phaser.Physics.Arcade.StaticBody;
    body.updateFromGameObject();
  }
}
