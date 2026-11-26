import { ASSET_KEYS } from '../../config/assetKeys.ts';
import { MUSIC_VOLUME } from '../../config/gameConstants.ts';

export interface PuddleShape {
  dx: number;
  dy: number;
  width: number;
  height: number;
}

export interface ParticleSettings {
  lifespan: number;
  speedX: { min: number; max: number };
  speedY: { min: number; max: number };
  gravityY: number;
  scale: number;
}

export const GAME_MUSIC = {
  key: ASSET_KEYS.audio.gameMusic,
  volume: MUSIC_VOLUME,
  stopKeys: [ASSET_KEYS.audio.menuMusic],
};

export const DEATH_CONFIG = {
  restartDelay: 1500,
  soundVolume: 0.6,
};

export const BLOOD_EFFECT_CONFIG = {
  particleCount: 25,
  puddleDelay: 400,
  cleanupDelay: 100,
  particle: {
    lifespan: 600,
    speedX: { min: -120, max: 120 },
    speedY: { min: -200, max: -50 },
    gravityY: 800,
    scale: 1,
    depth: 10,
  },
  puddleParticles: {
    lifespan: 700,
    speedX: { min: -25, max: 25 },
    speedY: { min: -10, max: 20 },
    gravityY: 300,
    scale: 3,
    countPerShape: 8,
  },
  puddle: {
    depth: 3,
    yOffset: 12,
    red: [
      { dx: -8, dy: -2, width: 16, height: 2 },
      { dx: -5, dy: -3, width: 10, height: 1 },
      { dx: -10, dy: -1, width: 4, height: 1 },
      { dx: 7, dy: -1, width: 3, height: 1 },
    ] as PuddleShape[],
    dark: [
      { dx: -9, dy: 0, width: 3, height: 1 },
      { dx: 7, dy: 0, width: 2, height: 1 },
      { dx: -2, dy: 1, width: 4, height: 1 },
    ] as PuddleShape[],
  },
};
