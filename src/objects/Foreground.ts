import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';

interface TrafficBounds {
  minY: number;
  maxY: number;
}

interface TrafficObject {
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

const FOREGROUND_CONFIG = {
  baseSpeedMultiplier: 1.5,
  maxObjects: 50,
  spawnDelay: 70,
  spawnChance: 0.45,
  screenBounds: { top: -20, bottom: 50 },
  speedRanges: {
    slow: { min: 2, max: 3 },
    fast: { min: 2.5, max: 4 },
  },
  laneChange: {
    chance: 0.5,
    initialCooldownMin: 200,
    initialCooldownMax: 800,
    nextCooldownMin: 200,
    nextCooldownMax: 600,
    turnChance: 0.6,
    maxShift: 3,
    moveSpeedMs: 25,
  },
};

const FOREGROUND_EFFECT_CONFIG = {
  msPerSecond: 1000,
  backgroundDepth: 20,
  trafficDepth: 21,
  trafficIndex: { min: 1, max: 5 },
  lane: { directionChance: 0.5, right: 1, left: -1, step: 1, minShift: 1 },
  offscreen: { widthDivisor: 2 },
};

export class Foreground {
  private readonly scene: Phaser.Scene;
  private readonly sprite: Phaser.GameObjects.TileSprite;
  private trafficObjects: TrafficObject[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.sprite = scene.add.tileSprite(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      'foreground'
    );
    this.sprite.setDepth(FOREGROUND_EFFECT_CONFIG.backgroundDepth);

    scene.time.addEvent({
      delay: FOREGROUND_CONFIG.spawnDelay,
      loop: true,
      callback: () => this._trySpawnObject()
    });
  }

  public update(delta: number, baseSpeed: number): void {
    const seconds = delta / FOREGROUND_EFFECT_CONFIG.msPerSecond;
    this._updateBackground(baseSpeed, seconds);
    this._updateTrafficObjects(delta, baseSpeed, seconds);
  }

  public destroy(): void {
    this.sprite.destroy();
    this.trafficObjects.forEach(obj => obj.sprite.destroy());
    this.trafficObjects = [];
  }

  private _updateBackground(baseSpeed: number, seconds: number): void {
    const multiplier = FOREGROUND_CONFIG.baseSpeedMultiplier;
    this.sprite.tilePositionX += baseSpeed * multiplier * seconds;
  }

  private _updateTrafficObjects(
    delta: number,
    baseSpeed: number,
    seconds: number
  ): void {
    for (let i = this.trafficObjects.length - 1; i >= 0; i--) {
      const obj = this.trafficObjects[i];

      this._moveLeft(obj, baseSpeed, seconds);
      this._handleLaneChange(obj, delta);
      this._handleYMovement(obj, delta);

      if (this._isOffscreen(obj)) {
        this._removeObject(i);
      }
    }
  }

  private _moveLeft(obj: TrafficObject, baseSpeed: number, seconds: number): void {
    obj.sprite.x -= baseSpeed * obj.speedMultiplier * seconds;
  }

  private _handleLaneChange(obj: TrafficObject, delta: number): void {
    if (!obj.isLaneChanger) return;

    obj.laneChangeTimer += delta;
    if (obj.laneChangeTimer < obj.laneChangeCooldown) return;

    obj.laneChangeTimer = 0;
    const lc = FOREGROUND_CONFIG.laneChange;
    obj.laneChangeCooldown = Phaser.Math.Between(lc.nextCooldownMin, lc.nextCooldownMax);

    if (Math.random() < lc.turnChance) {
      this._decideNewLane(obj);
    }
  }

  private _decideNewLane(obj: TrafficObject): void {
    const lc = FOREGROUND_CONFIG.laneChange;
    const lane = FOREGROUND_EFFECT_CONFIG.lane;
    const direction = Math.random() < lane.directionChance ? lane.right : lane.left;
    const shift = Phaser.Math.Between(lane.minShift, lc.maxShift) * direction;

    const newTarget = Phaser.Math.Clamp(
      obj.currentY + shift,
      obj.bounds.minY,
      obj.bounds.maxY
    );

    if (newTarget !== obj.currentY) {
      obj.targetY = newTarget;
    }
  }

  private _handleYMovement(obj: TrafficObject, delta: number): void {
    if (obj.currentY === obj.targetY) return;

    obj.moveTimer += delta;
    const moveSpeedMs = FOREGROUND_CONFIG.laneChange.moveSpeedMs;
    if (obj.moveTimer < moveSpeedMs) return;

    obj.moveTimer = 0;
    const step = FOREGROUND_EFFECT_CONFIG.lane.step;
    obj.currentY += (obj.currentY < obj.targetY) ? step : -step;
    obj.sprite.y = obj.currentY;
  }

  private _isOffscreen(obj: TrafficObject): boolean {
    const divisor = FOREGROUND_EFFECT_CONFIG.offscreen.widthDivisor;
    return obj.sprite.x + obj.sprite.displayWidth / divisor < 0;
  }

  private _removeObject(index: number): void {
    this.trafficObjects[index].sprite.destroy();
    this.trafficObjects.splice(index, 1);
  }

  private _trySpawnObject(): void {
    if (this.trafficObjects.length >= FOREGROUND_CONFIG.maxObjects) return;
    if (Math.random() > FOREGROUND_CONFIG.spawnChance) return;

    this.trafficObjects.push(this._createTrafficObject());
  }

  private _createTrafficObject(): TrafficObject {
    const range = FOREGROUND_EFFECT_CONFIG.trafficIndex;
    const index = Phaser.Math.Between(range.min, range.max);
    const textureKey = `traffic-${index}`;
    const { width, height } = this.scene.textures.get(textureKey).getSourceImage();

    const bounds = this._calculateBounds(height);
    const startY = Phaser.Math.Between(bounds.minY, bounds.maxY);
    const sprite = this._createSprite(textureKey, width, startY);

    return {
      sprite,
      speedMultiplier: this._getSpeedMultiplier(index),
      currentY: startY,
      targetY: startY,
      isLaneChanger: Math.random() < FOREGROUND_CONFIG.laneChange.chance,
      bounds,
      laneChangeTimer: 0,
      laneChangeCooldown: this._getInitialCooldown(),
      moveTimer: 0
    };
  }

  private _createSprite(
    textureKey: string,
    width: number,
    y: number
  ): Phaser.GameObjects.Image {
    const halfWidth = width / FOREGROUND_EFFECT_CONFIG.offscreen.widthDivisor;
    return this.scene.add.image(GAME_WIDTH + halfWidth, y, textureKey)
      .setDepth(FOREGROUND_EFFECT_CONFIG.trafficDepth);
  }

  private _getInitialCooldown(): number {
    const lc = FOREGROUND_CONFIG.laneChange;
    return Phaser.Math.Between(lc.initialCooldownMin, lc.initialCooldownMax);
  }

  private _calculateBounds(height: number): TrafficBounds {
    const halfHeight = height / FOREGROUND_EFFECT_CONFIG.offscreen.widthDivisor;
    const { top, bottom } = FOREGROUND_CONFIG.screenBounds;

    const minY = top + halfHeight;
    const maxY = Math.max(minY, bottom - halfHeight);

    return { minY, maxY };
  }

  private _getSpeedMultiplier(index: number): number {
    const ranges = FOREGROUND_CONFIG.speedRanges;
    const range = (index === FOREGROUND_EFFECT_CONFIG.trafficIndex.min
      || index === FOREGROUND_EFFECT_CONFIG.trafficIndex.max)
      ? ranges.slow
      : ranges.fast;

    return Phaser.Math.FloatBetween(range.min, range.max);
  }
}
