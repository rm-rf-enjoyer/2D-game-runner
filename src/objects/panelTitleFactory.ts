import Phaser from 'phaser';
import { PANEL_TITLE_CONFIG } from '../config/panelTitleConfig.ts';

export interface PanelTitleOptions {
  scene: Phaser.Scene;
  centerX: number;
  panelTop: number;
  text: string;
  depth?: number;
}

export function createPanelTitle(options: PanelTitleOptions): Phaser.GameObjects.BitmapText {
  const { scene, centerX, panelTop, text, depth } = options;
  const config = PANEL_TITLE_CONFIG;

  return scene.add
    .bitmapText(centerX, panelTop + config.topOffset, config.font, text, config.fontSize)
    .setOrigin(config.originX, config.originY)
    .setTint(config.color)
    .setDepth(depth ?? 0);
}
