import Phaser from 'phaser';
import { PIPE_CONFIG } from '../config/pipeConfig.ts';
import { getBodyBounds } from './common.ts';

export type StaticCollider = Phaser.GameObjects.Rectangle;

export function createStaticCollider(
  scene: Phaser.Scene,
  group: Phaser.Physics.Arcade.StaticGroup,
  x: number,
  y: number,
  width: number,
  height: number
): StaticCollider {
  const collider = scene.add.rectangle(x, y, width, height, PIPE_CONFIG.debugColor, 0);
  scene.physics.add.existing(collider, true);
  group.add(collider);
  syncStaticCollider(collider);
  return collider;
}

export function syncStaticCollider(collider: StaticCollider): void {
  const body = collider.body as Phaser.Physics.Arcade.StaticBody;
  body.updateFromGameObject();
}

export function getStaticColliderBounds(
  collider: StaticCollider,
  target?: Phaser.Geom.Rectangle
): Phaser.Geom.Rectangle {
  const body = collider.body as Phaser.Physics.Arcade.StaticBody;
  return getBodyBounds(body, target);
}

export function destroyStaticCollider(
  group: Phaser.Physics.Arcade.StaticGroup,
  collider: StaticCollider
): void {
  group.remove(collider);
  collider.destroy();
}
