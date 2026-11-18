import Phaser from 'phaser';

export interface ParticleConfig {
  lifespan: number;
  speedX: { min: number; max: number };
  speedY: { min: number; max: number };
  frequency?: number;
  quantity?: number;
  tint: number | number[];
  followOffset?: { x: number; y: number };
}

export const PLAYER_CONFIG = {
  jumpVelocity: -270,
  dashDuration: 450,     // Длительность дэша теперь ровно 1 секунда (под затухание мира)
  maxVelocityX: 300,
  maxVelocityY: 400,
  bodySize: { width: 14, height: 24 },
  bodyOffset: { x: 5, y: 0 },
  hoverDelay: 200,
  hoverOffset: { x: 5, y: 1 },
  deathTween: { yDistance: 300, duration: 1200 },
};

export const EXHAUST_PARTICLE_CONFIG: ParticleConfig = {
  followOffset: { x: 0, y: 12 },
  lifespan: 300,
  speedX: { min: -20, max: -50 },
  speedY: { min: -10, max: 10 },
  frequency: 100,
  tint: 0x4FE8F4,
};

export const DASH_PARTICLE_CONFIG: ParticleConfig = {
  followOffset: { x: 0, y: 12 },
  lifespan: 300,
  speedX: { min: -100, max: -200 },
  speedY: { min: -10, max: 10 },
  frequency: 30,
  tint: 0x4FE8F4,
};

export const DUST_PARTICLE_CONFIG: ParticleConfig = {
  lifespan: 250,
  speedX: { min: -150, max: 150 },
  speedY: { min: -10, max: 10 },
  quantity: 12,
  tint: 0x67778D,
};

export const AFTERIMAGE_CONFIG = {
  delay: 10,              // Спавним полосу каждые 50мс
  lifespan: 150,          // Живет 300мс
  shiftX: -40,
  tint: 0x4FE8F4,
};

export type DeathCause = 'pit' | 'wall' | 'ground';
