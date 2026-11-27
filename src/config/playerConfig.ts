import { ASSET_KEYS } from './assetKeys.ts';
import { PALETTE } from './palette.ts';

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
  darkDirt: PALETTE.shadow,
  dirt: PALETTE.plum,
  midDirt: PALETTE.teal,
  dust: PALETTE.dustyRose,
  lightDirt: PALETTE.sand,
} as const;

export const DASH_TEXTURE_KEY = ASSET_KEYS.texture.playerDash;
export const DASH_ANIM_KEY = ASSET_KEYS.animation.dash;

export type DeathCause = 'pit' | 'wall' | 'object';
