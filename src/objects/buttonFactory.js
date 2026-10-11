import Phaser from 'phaser';
import { Button } from './button.js';

const FONT_KEY = 'pixel-font';
const FONT_SIZE = 14;
const FONT_SCALE = 3;

export function createMenuButton(scene, x, y, text, onClick) {
  const width = 400;
  const height = 100;

  const button = new Button(scene, x, y, width, height, onClick);
  button.setDepth(10);

  const label = scene.add.bitmapText(x, y, FONT_KEY, text, FONT_SIZE)
    .setOrigin(0.5)
    .setScale(FONT_SCALE)
    .setTint(0xffcc00)
    .setDepth(11);

  return { button, label };
}
