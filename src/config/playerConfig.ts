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
  darkDirt: 0x202333,
  dirt: 0x392D42,
  midDirt: 0x4B6479,
  dust: 0x67778D,
  lightDirt: 0xB4938B,
} as const;

export const DASH_TEXTURE_KEY = 'player-dash';
export const DASH_ANIM_KEY = 'dash-anim';

export type DeathCause = 'pit' | 'wall' | 'ground' | 'obstacle' | 'object';
