import { BootScene } from '../scenes/bootScene.js';
import { PreloadScene } from '../scenes/preloadScene.js';
import { MenuScene } from '../scenes/menuScene.js';
import Phaser from 'phaser';

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const gameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game',
    pixelArt: true,
    antialias: false,
    roundPixels: true,

  },
  scene: [BootScene, PreloadScene, MenuScene],
};



