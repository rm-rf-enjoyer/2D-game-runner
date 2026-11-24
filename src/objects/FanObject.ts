import Phaser from 'phaser';
import {
  FAN_ANIM_KEY,
  FAN_DEPTH,
  FAN_FRAME_SIZE,
  FAN_TEXTURE_KEY
} from '../config/objectsConfig';
import {
  createStaticCollider,
  destroyStaticCollider,
  getStaticColliderBounds,
  StaticCollider,
  syncStaticCollider
} from '../utils/staticCollider';

export class FanObject {
  private x: number;
  private readonly sprite: Phaser.GameObjects.Sprite;
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

    this.sprite = scene.add.sprite(x, y, FAN_TEXTURE_KEY, 0)
      .setDepth(FAN_DEPTH);
    this.sprite.play(FAN_ANIM_KEY);

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
    this.collisionBody.x -= shift;
    syncStaticCollider(this.collisionBody);
  }

  public destroy(): void {
    destroyStaticCollider(this.physicsGroup, this.collisionBody);
    this.sprite.destroy();
  }
}
