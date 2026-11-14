import { BootScene } from '../scenes/bootScene.js';
import { PreloadScene } from '../scenes/preloadScene.js';
import { MenuScene } from '../scenes/menuScene.js';
import { GameScene } from '../scenes/gameScene.js';
import { UIScene } from '../scenes/UIScene.js';
import Phaser from 'phaser';

// ТЕПЕРЬ ЭТО СОВПАДАЕТ С НАСТРОЙКАМИ КАМЕРЫ
export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 270;
export const MUSIC_VOLUME = 0.5;

export const gameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#000000',
  pixelArt: true,
  antialias: false,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.HEIGHT_CONTROLS_WIDTH,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1000 },
      debug: false,
    },
  },
  scene: [BootScene, PreloadScene, MenuScene, GameScene, UIScene],
};
