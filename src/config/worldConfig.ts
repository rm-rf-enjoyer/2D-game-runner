export const WORLD_CONFIG = {
  initialSpeed: 143.9,
  dashSpeed: 533.9,
  speedDecayStep: 130,
  speedDecayInterval: 150,
  dashCooldown: 2000,
  maxDelta: 50,
} as const;

export const WORLD_INITIAL_SPEED = WORLD_CONFIG.initialSpeed;
