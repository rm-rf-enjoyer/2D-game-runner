import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, GAMEPLAY_CONFIG } from '../config/gameConfig.ts';
import { getPaletteColor } from '../config/palette.ts';

interface Range {
  min: number;
  max: number;
}

interface RainDrop {
  x: number;
  y: number;
  length: number;
  fallSpeed: number;
  sizeRatio: number;
  drift: number;
  velocityX: number;
  color: number;
}

interface RainLayerConfig {
  count: number;
  length: Range;
  thickness: number;
  fallSpeed: Range;
  driftFactor: number;
  driftJitter: number;
  alpha: number;
  colors: number[];
}

interface RainSplash {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  life: number;
  lifespan: number;
  width: number;
  color: number;
}

export type RainPreset = 'game' | 'menu';

const RAIN_CONFIG = {
  margin: 24,
  respawnPadding: 40,
  dashSpeedMultiplier: 2,
  layers: [
    {
      count: 200,
      length: { min: 3, max: 5 },
      thickness: 1,
      fallSpeed: { min: 340, max: 450 },
      driftFactor: 0.85,
      driftJitter: 55,
      alpha: 1,
      colors: [getPaletteColor(2), getPaletteColor(8)],
    },
    {
      count: 15,
      length: { min: 6, max: 9 },
      thickness: 1,
      fallSpeed: { min: 480, max: 620 },
      driftFactor: 1.35,
      driftJitter: 95,
      alpha: 1,
      colors: [getPaletteColor(3), getPaletteColor(8), getPaletteColor(9)],
    },
    {
      count: 4,
      length: { min: 10, max: 14 },
      thickness: 2,
      fallSpeed: { min: 900, max: 1050 },
      driftFactor: 1.85,
      driftJitter: 130,
      alpha: 1,
      colors: [getPaletteColor(8), getPaletteColor(11), getPaletteColor(15)],
    },
  ] as RainLayerConfig[],
};

const SPLASH_CONFIG = {
  bandHeight: 40,
  spawnChance: 0.06,
  extraChance: 0.35,
  poolSize: 48,
  lifespan: { min: 160, max: 320 },
  speedX: { min: -50, max: 50 },
  speedY: { min: -220, max: -50 },
  gravityY: 650,
  alpha: 1,
  colors: [getPaletteColor(2), getPaletteColor(8), getPaletteColor(9), getPaletteColor(11)],
};

const PRESET_DEPTHS: Record<RainPreset, readonly number[]> = {
  game: [22, 23, 24],
  menu: [0, 1, 2],
};

export class Rain {
  private readonly graphics: Phaser.GameObjects.Graphics[];
  private readonly splashGraphics: Phaser.GameObjects.Graphics;
  private readonly layers: RainLayerConfig[];
  private readonly drops: RainDrop[][];
  private readonly splashes: RainSplash[];
  private splashCursor: number = 0;

  constructor(scene: Phaser.Scene, preset: RainPreset = 'game') {
    const depths = PRESET_DEPTHS[preset];
    this.layers = RAIN_CONFIG.layers;
    this.graphics = this.layers.map((_, index) => scene.add.graphics().setDepth(depths[index]));
    this.splashGraphics = scene.add.graphics().setDepth(depths[depths.length - 1] + 1);
    this.drops = this.layers.map((layer) =>
      Array.from({ length: layer.count }, () => this._createDrop(layer, true, 0))
    );
    this.splashes = Array.from({ length: SPLASH_CONFIG.poolSize }, () => this._createSplash());
  }

  public update(delta: number, baseSpeed: number, isDashActive: boolean = false): void {
    const seconds = delta / GAMEPLAY_CONFIG.msPerSecond;
    const speedMultiplier = isDashActive ? RAIN_CONFIG.dashSpeedMultiplier : 1;

    this.layers.forEach((layer, index) => {
      const drops = this.drops[index];

      drops.forEach((drop, dropIndex) => {
        const wasAboveBottom = drop.y < GAME_HEIGHT;
        drop.velocityX =
          (baseSpeed * layer.driftFactor * (0.85 + 0.3 * drop.sizeRatio) + drop.drift) *
          speedMultiplier;
        drop.x -= drop.velocityX * seconds;
        drop.y += drop.fallSpeed * seconds;

        if (
          wasAboveBottom &&
          drop.y >= GAME_HEIGHT &&
          drop.x >= 0 &&
          drop.x <= GAME_WIDTH &&
          Phaser.Math.RND.frac() < SPLASH_CONFIG.spawnChance
        ) {
          this._spawnSplash(drop.x, baseSpeed * speedMultiplier);
          if (Phaser.Math.RND.frac() < SPLASH_CONFIG.extraChance) {
            this._spawnSplash(drop.x, baseSpeed * speedMultiplier);
          }
        }

        if (this._isOffscreen(drop)) {
          drops[dropIndex] = this._createDrop(layer, false, baseSpeed * speedMultiplier);
        }
      });

      this._render(index);
    });

    this._updateSplashes(delta);
    this._renderSplashes();
  }

  private _createSplash(): RainSplash {
    return {
      x: 0,
      y: 0,
      velocityX: 0,
      velocityY: 0,
      life: 0,
      lifespan: 1,
      width: 1,
      color: getPaletteColor(2),
    };
  }

  private _spawnSplash(x: number, baseSpeed: number): void {
    const splash = this.splashes[this.splashCursor];
    this.splashCursor = (this.splashCursor + 1) % this.splashes.length;
    splash.x = x;
    splash.y = GAME_HEIGHT - Phaser.Math.Between(1, 3);
    splash.velocityX =
      Phaser.Math.FloatBetween(SPLASH_CONFIG.speedX.min, SPLASH_CONFIG.speedX.max) +
      baseSpeed * 0.15;
    splash.velocityY = Phaser.Math.FloatBetween(SPLASH_CONFIG.speedY.min, SPLASH_CONFIG.speedY.max);
    splash.lifespan = Phaser.Math.Between(SPLASH_CONFIG.lifespan.min, SPLASH_CONFIG.lifespan.max);
    splash.life = splash.lifespan;
    splash.width = Phaser.Math.Between(1, 2);
    splash.color = Phaser.Math.RND.pick(SPLASH_CONFIG.colors);
  }

  private _updateSplashes(delta: number): void {
    const seconds = delta / GAMEPLAY_CONFIG.msPerSecond;
    const bandTop = GAME_HEIGHT - SPLASH_CONFIG.bandHeight;

    this.splashes.forEach((splash) => {
      if (splash.life <= 0) return;

      splash.life -= delta;
      splash.x += splash.velocityX * seconds;
      splash.y += splash.velocityY * seconds;
      splash.velocityY += SPLASH_CONFIG.gravityY * seconds;

      if (
        splash.life <= 0 ||
        splash.y < bandTop ||
        splash.y > GAME_HEIGHT ||
        splash.x < 0 ||
        splash.x > GAME_WIDTH
      ) {
        splash.life = 0;
      }
    });
  }

  private _renderSplashes(): void {
    const graphics = this.splashGraphics;
    graphics.clear();

    this.splashes.forEach((splash) => {
      if (splash.life <= 0) return;
      graphics.fillStyle(splash.color, SPLASH_CONFIG.alpha);
      graphics.fillRect(Math.round(splash.x), Math.round(splash.y), splash.width, 1);
    });
  }

  private _createDrop(layer: RainLayerConfig, initial: boolean, baseSpeed: number): RainDrop {
    const margin = RAIN_CONFIG.margin;
    const windPadding = baseSpeed * layer.driftFactor * 0.4;
    const length = Phaser.Math.Between(layer.length.min, layer.length.max);
    const sizeRatio = (length - layer.length.min) / (layer.length.max - layer.length.min);
    return {
      x: initial
        ? Phaser.Math.Between(-margin, GAME_WIDTH + margin)
        : Phaser.Math.Between(0, GAME_WIDTH + RAIN_CONFIG.respawnPadding + windPadding),
      y: initial
        ? Phaser.Math.Between(-margin, GAME_HEIGHT)
        : -margin - Phaser.Math.Between(0, RAIN_CONFIG.respawnPadding),
      length,
      fallSpeed: Phaser.Math.Linear(layer.fallSpeed.min, layer.fallSpeed.max, sizeRatio),
      sizeRatio,
      drift: layer.driftJitter * sizeRatio,
      velocityX: 0,
      color: Phaser.Math.RND.pick(layer.colors),
    };
  }

  private _isOffscreen(drop: RainDrop): boolean {
    return (
      drop.y > GAME_HEIGHT + RAIN_CONFIG.margin || drop.x < -RAIN_CONFIG.margin - drop.length * 4
    );
  }

  private _render(index: number): void {
    const layer = this.layers[index];
    const drops = this.drops[index];
    const graphics = this.graphics[index];
    graphics.clear();

    layer.colors.forEach((color) => {
      graphics.lineStyle(layer.thickness, color, layer.alpha);
      graphics.beginPath();
      drops.forEach((drop) => {
        if (drop.color !== color) return;
        const slant = (drop.velocityX / drop.fallSpeed) * drop.length;
        graphics.moveTo(drop.x + slant, drop.y - drop.length);
        graphics.lineTo(drop.x, drop.y);
      });
      graphics.strokePath();
    });
  }
}
