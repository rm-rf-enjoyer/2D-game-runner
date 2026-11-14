import Phaser from 'phaser';
import { Button } from './button.js';

const FONT_KEY = 'pixel-font';
const FONT_SIZE = 14;

export function createMenuButton(scene, x, y, text, onClick) {
  // Берем реальную высоту из твоей PNG
  const tex = scene.textures.get('btn-normal-left').getSourceImage();
  const buttonHeight = tex.height; 
  
  // ЖЕСТКАЯ ФИКСИРОВАННАЯ ШИРИНА ДЛЯ ВСЕХ КНОПОК
  const buttonWidth = 120; 

  const button = new Button(scene, x, y, buttonWidth, buttonHeight, onClick);
  button.setDepth(10);

  // Шрифт 14px. Origin(0.5) центрирует его ровно по центру кнопки.
  const label = scene.add.bitmapText(x, y, FONT_KEY, text, FONT_SIZE)
    .setOrigin(0.5)
    .setScale(1)
    .setTint(0xffcc00)
    .setDepth(11);

  return { button, label };
}
