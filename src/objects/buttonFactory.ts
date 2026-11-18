import Phaser from 'phaser';
import { Button } from './Button';

const FONT_KEY = 'pixel-font';
const FONT_SIZE = 14;
const BUTTON_WIDTH = 120;
const LABEL_TINT = 0xffcc00;
const DEPTH_BUTTON = 10;
const DEPTH_LABEL = 11;

export interface MenuButtonReturn {
  button: Button;
  label: Phaser.GameObjects.BitmapText;
}

export function createMenuButton(
  scene: Phaser.Scene, 
  x: number, 
  y: number, 
  text: string, 
  onClick: () => void
): MenuButtonReturn {
  const tex = scene.textures.get('btn-normal-left').getSourceImage();
  
  const button = new Button({
    scene,
    x,
    y,
    width: BUTTON_WIDTH,
    height: tex.height,
    onClick
  }).setDepth(DEPTH_BUTTON);

  const label = scene.add.bitmapText(x, y, FONT_KEY, text, FONT_SIZE)
    .setOrigin(0.5)
    .setScale(1)
    .setTint(LABEL_TINT)
    .setDepth(DEPTH_LABEL);

  return { button, label };
}
