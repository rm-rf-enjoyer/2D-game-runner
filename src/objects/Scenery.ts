import Phaser from 'phaser';
import { GAMEPLAY_CONFIG, GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig.ts';
import { ASSET_KEYS } from '../config/assetKeys.ts';
import { WORLD_INITIAL_SPEED } from '../config/worldConfig.ts';
import { getTextureSize } from '../utils/common.ts';

const SCENERY_CONFIG = {
  defaultSpeed: WORLD_INITIAL_SPEED,
  trainDepth: -20,
  train: {
    initialDelay: 2000,
    spawnInterval: 30000,
    duration: 15000,
  },
  tileLayers: [
    { key: ASSET_KEYS.texture.background1, speed: 0.05, depth: -40 },
    { key: ASSET_KEYS.texture.background2, speed: 0.1, depth: -30 },
    { key: ASSET_KEYS.texture.background4, speed: 0.2, depth: -10 },
  ],
  imageLayers: [
    { keys: [ASSET_KEYS.texture.background5], speed: 1, depth: -6 },
    {
      keys: [ASSET_KEYS.texture.background6a, ASSET_KEYS.texture.background6b],
      speed: 1,
      depth: -2,
    },
  ],
  foreground: {
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
    lane: {
      directionChance: 0.5,
      right: 1,
      left: -1,
      minShift: 1,
      step: 1,
    },
    trafficIndex: { min: 1, max: 5 },
    offscreenWidthDivisor: 2,
  },
} as const;

export type SceneryPreset = 'game' | 'menu';

const PRESET_DEPTH: Record<SceneryPreset, { foreground: number; traffic: number }> = {
  game: { foreground: 20, traffic: 21 },
  menu: { foreground: -1, traffic: -1 },
};

interface TileLayer {
  sprite: Phaser.GameObjects.TileSprite;
  speed: number;
}

interface ImageLayer {
  images: Phaser.GameObjects.Image[];
  width: number;
  speed: number;
}

export interface TrafficBounds {
  minY: number;
  maxY: number;
}

interface TrafficData {
  speedMultiplier: number;
  currentY: number;
  targetY: number;
  isLaneChanger: boolean;
  bounds: TrafficBounds;
  laneChangeTimer: number;
  laneChangeCooldown: number;
  moveTimer: number;
}

interface TrafficObject extends TrafficData {
  sprite: Phaser.GameObjects.Image;
}

export interface TrafficState extends TrafficData {
  textureKey: string;
  x: number;
  y: number;
}

export interface SceneryState {
  foregroundX: number;
  traffic: TrafficState[];
}

export class Scenery {
  private readonly scene: Phaser.Scene;
  private readonly tileLayers: TileLayer[] = [];
  private readonly imageLayers: ImageLayer[] = [];
  private readonly trafficObjects: TrafficObject[] = [];
  private readonly timers: Phaser.Time.TimerEvent[] = [];
  private readonly foreground: Phaser.GameObjects.TileSprite;
  private readonly train: Phaser.GameObjects.Image;
  private readonly trafficDepth: number;
  private trainTween?: Phaser.Tweens.Tween;

  private burstRemaining: number = 0;
  private burstPerSecond: number = 0;

  constructor(scene: Phaser.Scene, preset: SceneryPreset = 'game', state?: SceneryState) {
    this.scene = scene;
    const depth = PRESET_DEPTH[preset];
    this.trafficDepth = depth.traffic;

    this.tileLayers.push(
      ...SCENERY_CONFIG.tileLayers.map((config) => ({
        sprite: this._createTileSprite(config.key, config.depth),
        speed: config.speed,
      }))
    );

    this.imageLayers.push(
      ...SCENERY_CONFIG.imageLayers.map((config) => this._createImageLayer(config))
    );

    this.train = this._createTrain();
    this._scheduleTrain();

    this.foreground = this._createTileSprite(ASSET_KEYS.texture.foreground, depth.foreground);
    if (state) {
      this.foreground.tilePositionX = state.foregroundX;
      this.restoreTraffic(state.traffic);
    }
    this.timers.push(
      this.scene.time.addEvent({
        delay: SCENERY_CONFIG.foreground.spawnDelay,
        loop: true,
        callback: () => this._trySpawnObject(),
      })
    );
  }

  public getState(): SceneryState {
    return {
      foregroundX: this.foreground.tilePositionX,
      traffic: this.getTrafficState(),
    };
  }

  public getTrafficState(): TrafficState[] {
    return this.trafficObjects.map(({ sprite, ...data }) => ({
      ...data,
      bounds: { ...data.bounds },
      textureKey: sprite.texture.key,
      x: sprite.x,
      y: sprite.y,
    }));
  }

  public restoreTraffic(states: TrafficState[]): void {
    states.forEach(({ textureKey, x, y, ...data }) => {
      const sprite = this.scene.add.image(x, y, textureKey).setDepth(this.trafficDepth);
      this.trafficObjects.push({
        ...data,
        bounds: { ...data.bounds },
        sprite,
      });
    });
  }

  public burst(distance: number, duration: number): void {
    this.burstRemaining = distance;
    this.burstPerSecond = distance / (duration / GAMEPLAY_CONFIG.msPerSecond);
  }

  public spawnTrain(): void {
    if (this.train.visible) return;

    this.train.x = GAME_WIDTH + this.train.displayWidth / 2;
    this.train.setVisible(true);

    this.trainTween = this.scene.tweens.add({
      targets: this.train,
      x: -this.train.displayWidth / 2,
      duration: SCENERY_CONFIG.train.duration,
      ease: 'Linear',
      onComplete: () => this.train.setVisible(false),
    });
  }

  public update(delta: number, baseSpeed: number = SCENERY_CONFIG.defaultSpeed): void {
    const seconds = delta / GAMEPLAY_CONFIG.msPerSecond;
    const shift = baseSpeed * seconds + this._consumeBurst(seconds);

    this._moveTileLayers(shift);
    this._moveImageLayers(shift);
    this._moveForeground(baseSpeed, seconds);
    this._updateTraffic(delta, baseSpeed, seconds);
  }

  public destroy(): void {
    this.timers.forEach((timer) => timer.remove());
    this.trainTween?.stop();

    this.tileLayers.forEach((layer) => layer.sprite.destroy());
    this.imageLayers.forEach((layer) => {
      layer.images.forEach((image) => image.destroy());
    });
    this.train.destroy();
    this.foreground.destroy();
    this.trafficObjects.forEach((object) => object.sprite.destroy());

    this.tileLayers.length = 0;
    this.imageLayers.length = 0;
    this.trafficObjects.length = 0;
    this.timers.length = 0;
  }

  private _createTileSprite(key: string, depth: number): Phaser.GameObjects.TileSprite {
    return this.scene.add
      .tileSprite(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, key)
      .setDepth(depth);
  }

  private _createImageLayer(config: {
    keys: readonly string[];
    speed: number;
    depth: number;
  }): ImageLayer {
    const width = getTextureSize(this.scene, config.keys[0]).width;
    const images = Array.from({ length: config.keys.length * 2 }, (_, index) =>
      this.scene.add
        .image(index * width, GAME_HEIGHT / 2, config.keys[index % config.keys.length])
        .setOrigin(0, 0.5)
        .setDepth(config.depth)
    );

    return { images, width, speed: config.speed };
  }

  private _createTrain(): Phaser.GameObjects.Image {
    const train = this.scene.add
      .image(0, GAME_HEIGHT / 2, ASSET_KEYS.texture.background3)
      .setDepth(SCENERY_CONFIG.trainDepth)
      .setVisible(false);
    train.x = GAME_WIDTH + train.displayWidth / 2;
    return train;
  }

  private _scheduleTrain(): void {
    this.timers.push(
      this.scene.time.delayedCall(SCENERY_CONFIG.train.initialDelay, () => this.spawnTrain())
    );
    this.timers.push(
      this.scene.time.addEvent({
        delay: SCENERY_CONFIG.train.spawnInterval,
        loop: true,
        callback: () => this.spawnTrain(),
      })
    );
  }

  private _consumeBurst(seconds: number): number {
    if (this.burstRemaining <= 0) return 0;

    const shift = Math.min(this.burstPerSecond * seconds, this.burstRemaining);
    this.burstRemaining -= shift;
    return shift;
  }

  private _moveTileLayers(shift: number): void {
    this.tileLayers.forEach((layer) => {
      layer.sprite.tilePositionX += shift * layer.speed;
    });
  }

  private _moveImageLayers(shift: number): void {
    this.imageLayers.forEach((layer) => {
      const layerShift = shift * layer.speed;
      layer.images.forEach((image) => {
        image.x -= layerShift;
        if (image.x + layer.width <= 0) {
          image.x += layer.width * layer.images.length;
        }
      });
    });
  }

  private _moveForeground(baseSpeed: number, seconds: number): void {
    this.foreground.tilePositionX +=
      baseSpeed * SCENERY_CONFIG.foreground.baseSpeedMultiplier * seconds;
  }

  private _updateTraffic(delta: number, baseSpeed: number, seconds: number): void {
    for (let i = this.trafficObjects.length - 1; i >= 0; i--) {
      const object = this.trafficObjects[i];
      object.sprite.x -= baseSpeed * object.speedMultiplier * seconds;
      this._handleLaneChange(object, delta);
      this._handleYMovement(object, delta);

      if (this._isOffscreen(object)) {
        this._removeObject(i);
      }
    }
  }

  private _handleLaneChange(object: TrafficObject, delta: number): void {
    if (!object.isLaneChanger) return;

    object.laneChangeTimer += delta;
    if (object.laneChangeTimer < object.laneChangeCooldown) return;

    object.laneChangeTimer = 0;
    const config = SCENERY_CONFIG.foreground.laneChange;
    object.laneChangeCooldown = Phaser.Math.Between(config.nextCooldownMin, config.nextCooldownMax);

    if (Math.random() < config.turnChance) {
      this._decideNewLane(object);
    }
  }

  private _decideNewLane(object: TrafficObject): void {
    const config = SCENERY_CONFIG.foreground;
    const direction =
      Math.random() < config.lane.directionChance ? config.lane.right : config.lane.left;
    const shift = Phaser.Math.Between(config.lane.minShift, config.laneChange.maxShift) * direction;

    const newTarget = Phaser.Math.Clamp(
      object.currentY + shift,
      object.bounds.minY,
      object.bounds.maxY
    );

    if (newTarget !== object.currentY) {
      object.targetY = newTarget;
    }
  }

  private _handleYMovement(object: TrafficObject, delta: number): void {
    if (object.currentY === object.targetY) return;

    object.moveTimer += delta;
    if (object.moveTimer < SCENERY_CONFIG.foreground.laneChange.moveSpeedMs) {
      return;
    }

    object.moveTimer = 0;
    const step = SCENERY_CONFIG.foreground.lane.step;
    object.currentY += object.currentY < object.targetY ? step : -step;
    object.sprite.y = object.currentY;
  }

  private _isOffscreen(object: TrafficObject): boolean {
    const divisor = SCENERY_CONFIG.foreground.offscreenWidthDivisor;
    return object.sprite.x + object.sprite.displayWidth / divisor < 0;
  }

  private _removeObject(index: number): void {
    this.trafficObjects[index].sprite.destroy();
    this.trafficObjects.splice(index, 1);
  }

  private _trySpawnObject(): void {
    const config = SCENERY_CONFIG.foreground;
    if (this.trafficObjects.length >= config.maxObjects) return;
    if (Math.random() > config.spawnChance) return;

    this.trafficObjects.push(this._createTrafficObject());
  }

  private _createTrafficObject(): TrafficObject {
    const config = SCENERY_CONFIG.foreground;
    const index = Phaser.Math.Between(config.trafficIndex.min, config.trafficIndex.max);
    const textureKey = ASSET_KEYS.texture.traffic(index);
    const { width, height } = getTextureSize(this.scene, textureKey);
    const bounds = this._calculateBounds(height);
    const startY = Phaser.Math.Between(bounds.minY, bounds.maxY);
    const halfWidth = width / config.offscreenWidthDivisor;
    const sprite = this.scene.add
      .image(GAME_WIDTH + halfWidth, startY, textureKey)
      .setDepth(this.trafficDepth);

    return {
      sprite,
      speedMultiplier: this._getSpeedMultiplier(index),
      currentY: startY,
      targetY: startY,
      isLaneChanger: Math.random() < config.laneChange.chance,
      bounds,
      laneChangeTimer: 0,
      laneChangeCooldown: Phaser.Math.Between(
        config.laneChange.initialCooldownMin,
        config.laneChange.initialCooldownMax
      ),
      moveTimer: 0,
    };
  }

  private _calculateBounds(height: number): TrafficBounds {
    const config = SCENERY_CONFIG.foreground;
    const halfHeight = height / config.offscreenWidthDivisor;
    const minY = config.screenBounds.top + halfHeight;

    return {
      minY,
      maxY: Math.max(minY, config.screenBounds.bottom - halfHeight),
    };
  }

  private _getSpeedMultiplier(index: number): number {
    const config = SCENERY_CONFIG.foreground;
    const isEdge = index === config.trafficIndex.min || index === config.trafficIndex.max;
    const range = isEdge ? config.speedRanges.slow : config.speedRanges.fast;

    return Phaser.Math.FloatBetween(range.min, range.max);
  }
}
