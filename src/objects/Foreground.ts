import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { FOREGROUND_CONFIG, TrafficObject, TrafficBounds } from '../config/foregroundConfig';

export class Foreground {
  private scene: Phaser.Scene;
  private sprite: Phaser.GameObjects.TileSprite;
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
    this.sprite.setDepth(20);

    scene.time.addEvent({
      delay: FOREGROUND_CONFIG.spawnDelay,
      loop: true,
      callback: () => this._trySpawnObject()
    });
  }

  public update(delta: number, baseSpeed: number): void {
    const dt = delta / 1000;
    this._updateBackground(baseSpeed, dt);
    this._updateTrafficObjects(delta, baseSpeed, dt);
  }

  private _updateBackground(baseSpeed: number, dt: number): void {
    this.sprite.tilePositionX += baseSpeed * FOREGROUND_CONFIG.baseSpeedMultiplier * dt;
  }

  private _updateTrafficObjects(delta: number, baseSpeed: number, dt: number): void {
    for (let i = this.trafficObjects.length - 1; i >= 0; i--) {
      const obj = this.trafficObjects[i];
      
      this._moveLeft(obj, baseSpeed, dt);
      this._handleLaneChange(obj, delta);
      this._handleYMovement(obj, delta);

      if (this._isOffscreen(obj)) {
        this._removeObject(i);
      }
    }
  }

  private _moveLeft(obj: TrafficObject, baseSpeed: number, dt: number): void {
    obj.sprite.x -= baseSpeed * obj.speedMultiplier * dt;
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
    const direction = Math.random() < 0.5 ? 1 : -1;
    const shift = Phaser.Math.Between(1, lc.maxShift) * direction;
    
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
    if (obj.moveTimer < FOREGROUND_CONFIG.laneChange.moveSpeedMs) return;

    obj.moveTimer = 0;
    obj.currentY += (obj.currentY < obj.targetY) ? 1 : -1;
    obj.sprite.y = obj.currentY;
  }

  private _isOffscreen(obj: TrafficObject): boolean {
    return obj.sprite.x + obj.sprite.displayWidth / 2 < 0;
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
    const index = Phaser.Math.Between(1, 5);
    const textureKey = `traffic-${index}`;
    const { width, height } = this.scene.textures.get(textureKey).getSourceImage();
    
    const bounds = this._calculateBounds(height);
    const startY = Phaser.Math.Between(bounds.minY, bounds.maxY);

    const sprite = this.scene.add.image(GAME_WIDTH + width / 2, startY, textureKey)
      .setDepth(21);

    const lc = FOREGROUND_CONFIG.laneChange;

    return {
      sprite,
      speedMultiplier: this._getSpeedMultiplier(index),
      currentY: startY,
      targetY: startY,
      isLaneChanger: Math.random() < lc.chance,
      bounds,
      laneChangeTimer: 0,
      laneChangeCooldown: Phaser.Math.Between(lc.initialCooldownMin, lc.initialCooldownMax),
      moveTimer: 0
    };
  }

  private _calculateBounds(height: number): TrafficBounds {
    const halfHeight = height / 2;
    const { top, bottom } = FOREGROUND_CONFIG.screenBounds;
    
    const minY = -halfHeight;
    const maxY = Math.max(minY, bottom - halfHeight);
    
    return { minY, maxY };
  }

  private _getSpeedMultiplier(index: number): number {
    const ranges = FOREGROUND_CONFIG.speedRanges;
    if (index === 1 || index === 5) {
      return Phaser.Math.FloatBetween(ranges.slow.min, ranges.slow.max);
    }
    return Phaser.Math.FloatBetween(ranges.fast.min, ranges.fast.max);
  }

  public destroy(): void {
    this.sprite.destroy();
    this.trafficObjects.forEach(obj => obj.sprite.destroy());
    this.trafficObjects = [];
  }
}
