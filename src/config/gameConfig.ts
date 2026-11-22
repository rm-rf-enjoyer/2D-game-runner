import Phaser from 'phaser';

export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 270;
export const MUSIC_VOLUME = 0.5;
const GAME_GRAVITY_Y = 1000;

export const GAMEPLAY_CONFIG = {
  msPerSecond: 1000,
  pixelsPerMeter: 10,
  groundOffset: 62,
  playerStartX: 100,
  playerYOffset: 14,
  worldSpeed: 130,
  pitFallTolerance: 50,
  phase: { first: 1, second: 2 },
  input: { splitRatio: 0.5 },
  score: {
    x: 10,
    y: 10,
    fontSize: 14,
    tint: 0xe0bd51,
    depth: 100,
    scale: 1,
    initialText: '0 m',
  },
};

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
      gravity: { y: GAME_GRAVITY_Y },
      debug: false,
    },
  },
};
