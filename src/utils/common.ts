import Phaser from 'phaser';

export interface Size {
  width: number;
  height: number;
}

type ArcadeBody = Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody;

export function getTextureSize(scene: Phaser.Scene, key: string): Size {
  const source = scene.textures.get(key).getSourceImage();
  return { width: source.width, height: source.height };
}

export function getBodyBounds(
  body: ArcadeBody,
  target: Phaser.Geom.Rectangle = new Phaser.Geom.Rectangle()
): Phaser.Geom.Rectangle {
  return target.setTo(body.x, body.y, body.width, body.height);
}

export function repeat<T>(value: T, count: number): T[] {
  return Array.from({ length: count }, () => value);
}
