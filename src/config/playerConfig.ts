import { getPaletteColor } from './palette';

export const PLAYER_CONFIG = {
  jumpVelocity: -270,
  gravityY: -75,
  dashDuration: 450,
  maxVelocityX: 300,
  maxVelocityY: 400,
  bodySize: { width: 14, height: 24 },
  bodyOffset: { x: 5, y: 0 },
  hoverDelay: 200,
  deathTween: { yDistance: 300, duration: 1200 },
};

export const PLAYER_PALETTE = {
  darkDirt: getPaletteColor(1),
  dirt: getPaletteColor(4),
  midDirt: getPaletteColor(8),
  dust: getPaletteColor(9),
  lightDirt: getPaletteColor(11),
} as const;

export const DASH_TEXTURE_KEY = 'player-dash';
export const DASH_ANIM_KEY = 'dash-anim';

export type DeathCause = 'pit' | 'wall' | 'object';
