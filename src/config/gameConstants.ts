export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 270;
export const MUSIC_VOLUME = 0.5;

export const GAMEPLAY_CONFIG = {
  msPerSecond: 1000,
  pixelsPerMeter: 10,
  groundOffset: 62,
  playerStartX: 100,
  playerYOffset: 14,
  pitFallTolerance: 50,
  input: { splitRatio: 0.5 },
  score: {
    x: 10,
    y: 10,
    fontSize: 14,
    depth: 100,
    scale: 1,
    initialText: '0 m',
  },
};

export const GROUND_Y = GAME_HEIGHT - GAMEPLAY_CONFIG.groundOffset;
