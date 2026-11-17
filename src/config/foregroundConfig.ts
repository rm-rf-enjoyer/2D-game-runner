export interface TrafficBounds {
  minY: number;
  maxY: number;
}

export interface TrafficObject {
  sprite: Phaser.GameObjects.Image;
  speedMultiplier: number;
  currentY: number;
  targetY: number;
  isLaneChanger: boolean;
  bounds: TrafficBounds;
  laneChangeTimer: number;
  laneChangeCooldown: number;
  moveTimer: number;
}

export const FOREGROUND_CONFIG = {
  baseSpeedMultiplier: 1.5,
  maxObjects: 50,
  spawnDelay: 70,
  spawnChance: 0.9,
  screenBounds: { top: 10, bottom: 90 },
  
  speedRanges: {
    slow: { min: 2, max: 3 },
    fast: { min: 2.5, max: 4 }
  },
  
  laneChange: {
    chance: 0.5,
    initialCooldownMin: 200,
    initialCooldownMax: 800,
    nextCooldownMin: 200,
    nextCooldownMax: 600,
    turnChance: 0.6,
    maxShift: 3,
    moveSpeedMs: 25
  }
};
