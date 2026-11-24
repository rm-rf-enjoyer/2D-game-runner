import Phaser from 'phaser';
import { Button } from './Button';
import { getTextureSize } from '../utils/common';

const FONT_KEY = 'pixel-font';
const FONT_SIZE = 14;
const BUTTON_WIDTH = 120;
const LABEL_TINT = 0xe6e564;
const DEPTH_BUTTON = 10;
const DEPTH_LABEL = 11;

export interface MenuButtonReturn {
  button: Button;
  label: Phaser.GameObjects.BitmapText;
}

export interface MenuButtonConfig {
  text: string;
  yOffset: number;
  onClick: () => void;
}

export interface MenuButtonOptions {
  scene: Phaser.Scene;
  x: number;
  y: number;
  text: string;
  onClick: () => void;
}

export interface MenuButtonsOptions {
  scene: Phaser.Scene;
  centerX: number;
  startY: number;
  container?: Phaser.GameObjects.Container;
}

export function createMenuButton(
  config: MenuButtonOptions
): MenuButtonReturn {
  const { scene, x, y, text, onClick } = config;
  const texture = getTextureSize(scene, 'btn-normal-left');

  const button = new Button({
    scene,
    x,
    y,
    width: BUTTON_WIDTH,
    height: texture.height,
    onClick
  }).setDepth(DEPTH_BUTTON);

  const label = scene.add.bitmapText(x, y, FONT_KEY, text, FONT_SIZE)
    .setOrigin(0.5)
    .setScale(1)
    .setTint(LABEL_TINT)
    .setDepth(DEPTH_LABEL);

  return { button, label };
}

export function createMenuButtons(
  options: MenuButtonsOptions,
  configs: MenuButtonConfig[]
): MenuButtonReturn[] {
  return configs.map(config => {
    const button = createMenuButton({
      scene: options.scene,
      x: options.centerX,
      y: options.startY + config.yOffset,
      text: config.text,
      onClick: config.onClick
    });

    options.container?.add([
      button.button.container,
      button.label
    ]);

    return button;
  });
}
