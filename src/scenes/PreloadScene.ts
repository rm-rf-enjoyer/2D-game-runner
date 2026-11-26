import Phaser from 'phaser';

import menuMusic from '../assets/audio/menu.mp3';
import menuGame from '../assets/audio/game_theme2.mp3';
import uiSound from '../assets/audio/ui.mp3';
import deathSound from '../assets/audio/death.mp3';
import dashSound from '../assets/audio/dash.mp3';
import clickSound from '../assets/audio/click.mp3';

import bg1 from '../assets/bg/city1.png';
import bg2 from '../assets/bg/city2.png';
import bg3 from '../assets/bg/city3.png';
import bg4 from '../assets/bg/city4.png';
import bg5 from '../assets/bg/city5.png';

import pipeTilesPng from '../assets/tiles/pipeTileset.png';
import tilePng from '../assets/tiles/tile.png';
import fanSpinPng from '../assets/objects/fanSpin.png';
import { PLATFORM_CONFIGS, PLATFORM_TILE_SIZE } from '../config/platforms';
import {
  FAN_ANIM_KEY,
  FAN_FOG_TEXTURE_KEY,
  FAN_FRAME_COUNT,
  FAN_FRAME_RATE,
  FAN_FRAME_SIZE,
  FAN_TEXTURE_KEY,
} from '../config/objectsConfig';
import bg6a from '../assets/bg/city6a.png';
import bg6b from '../assets/bg/city6b.png';
import foregroundPng from '../assets/bg/Foreground.png';
import traffic1Png from '../assets/bg/trafficObject1.png';
import traffic2Png from '../assets/bg/trafficObject2.png';
import traffic3Png from '../assets/bg/trafficObject3.png';
import traffic4Png from '../assets/bg/trafficObject4.png';
import traffic5Png from '../assets/bg/trafficObject5.png';

import menu1 from '../assets/ui/menu/1.png';
import menu2 from '../assets/ui/menu/2.png';
import menu3 from '../assets/ui/menu/3.png';
import menu4 from '../assets/ui/menu/4.png';
import menu5 from '../assets/ui/menu/5.png';
import menu6 from '../assets/ui/menu/6.png';
import menu7 from '../assets/ui/menu/7.png';
import menu8 from '../assets/ui/menu/8.png';
import menu9 from '../assets/ui/menu/9.png';
import pausePng from '../assets/ui/pause/pause.png';
import fontPng from '../assets/ui/font/font-white.png';

import btnNormalLeft from '../assets/ui/buttons/1.png';
import btnNormalCenter from '../assets/ui/buttons/2.png';
import btnNormalRight from '../assets/ui/buttons/3.png';
import btnPressedLeft from '../assets/ui/buttons/4.png';
import btnPressedCenter from '../assets/ui/buttons/5.png';
import btnPressedRight from '../assets/ui/buttons/6.png';

import { DASH_TEXTURE_KEY, DASH_ANIM_KEY } from '../config/playerConfig';
import { getPaletteColor } from '../config/palette';

import runPng from '../assets/player/player.png';
import jumpPng from '../assets/player/hero-jump.png';
import playerDeathPng from '../assets/player/player-death.png';
import playerDashPng from '../assets/player/player-dash.png';

const PRELOAD_CONFIG = {
  player: {
    frameSize: 24,
    repeat: 0,
    jump: { firstFrame: 0, lastFrame: 7, frameRate: 20 },
    death: { firstFrame: 0, lastFrame: 3, frameRate: 10 },
    dash: { firstFrame: 0, lastFrame: 0, frameRate: 10 },
  },
  font: {
    image: 'pixel-font',
    chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.:,+-=;'#|\\/()[]{}!<>?÷%×− ",
    width: 14,
    height: 14,
    charsPerRow: 63,
    spacing: { x: 0, y: 0 },
    lineSpacing: 0,
  },
  particles: {
    color: 0xffffff,
    alpha: 1,
    pixel: { key: 'pixel-particle', width: 2, height: 2 },
    speedLine: { key: 'speed-line', width: 16, height: 2 },
    fog: {
      key: FAN_FOG_TEXTURE_KEY,
      size: 8,
      colors: [getPaletteColor(8), getPaletteColor(9)],
    },
  },
};

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  public preload(): void {
    this._loadBackgrounds();
    this._loadUI();
    this._loadTiles();
    this._loadPlayer();
    this._loadAudio();
  }

  public create(): void {
    this._createAnimations();
    this._createFont();
    this._createParticles();
    this.scene.start('MenuScene');
  }

  private _loadBackgrounds(): void {
    const bgs = {
      bg1,
      bg2,
      bg3,
      bg4,
      bg5,
      bg6a,
      bg6b,
      foreground: foregroundPng,
      'traffic-1': traffic1Png,
      'traffic-2': traffic2Png,
      'traffic-3': traffic3Png,
      'traffic-4': traffic4Png,
      'traffic-5': traffic5Png,
    };
    this._loadImages(bgs);
  }

  private _loadUI(): void {
    const ui = {
      'menu-1': menu1,
      'menu-2': menu2,
      'menu-3': menu3,
      'menu-4': menu4,
      'menu-5': menu5,
      'menu-6': menu6,
      'menu-7': menu7,
      'menu-8': menu8,
      'menu-9': menu9,
      'btn-pause': pausePng,
      'pixel-font': fontPng,
      'btn-normal-left': btnNormalLeft,
      'btn-normal-center': btnNormalCenter,
      'btn-normal-right': btnNormalRight,
      'btn-pressed-left': btnPressedLeft,
      'btn-pressed-center': btnPressedCenter,
      'btn-pressed-right': btnPressedRight,
    };
    this._loadImages(ui);
  }

  private _loadTiles(): void {
    this.load.spritesheet(PLATFORM_CONFIGS.pipe.textureKey, pipeTilesPng, {
      frameWidth: PLATFORM_TILE_SIZE,
      frameHeight: PLATFORM_TILE_SIZE,
    });
    this.load.image(PLATFORM_CONFIGS.tile.textureKey, tilePng);
    this.load.spritesheet(FAN_TEXTURE_KEY, fanSpinPng, {
      frameWidth: FAN_FRAME_SIZE,
      frameHeight: FAN_FRAME_SIZE,
    });
  }

  private _loadPlayer(): void {
    const frameSize = PRELOAD_CONFIG.player.frameSize;
    this.load.image('player', runPng);
    this._loadSpriteSheet('player-jump', jumpPng, frameSize);
    this._loadSpriteSheet('player-death', playerDeathPng, frameSize);
    this._loadSpriteSheet(DASH_TEXTURE_KEY, playerDashPng, frameSize);
  }

  private _loadSpriteSheet(key: string, path: string, frameSize: number): void {
    this.load.spritesheet(key, path, {
      frameWidth: frameSize,
      frameHeight: frameSize,
    });
  }

  private _loadAudio(): void {
    this.load.audio('music-menu', menuMusic);
    this.load.audio('music-game', menuGame);
    this.load.audio('sfx-ui', uiSound);
    this.load.audio('sfx-death', deathSound);
    this.load.audio('sfx-dash', dashSound);
    this.load.audio('sfx-click', clickSound);
  }

  private _loadImages(imageMap: Record<string, string>): void {
    Object.entries(imageMap).forEach(([key, path]) => {
      this.load.image(key, path);
    });
  }

  private _createAnimations(): void {
    const player = PRELOAD_CONFIG.player;
    const { jump, death, dash, repeat } = player;
    this._createAnimation('jump-anim', 'player-jump', jump, repeat);
    this._createAnimation('death-anim', 'player-death', death, repeat);
    this._createAnimation(DASH_ANIM_KEY, DASH_TEXTURE_KEY, dash, repeat);

    this.anims.create({
      key: FAN_ANIM_KEY,
      frames: this.anims.generateFrameNumbers(FAN_TEXTURE_KEY, {
        start: 0,
        end: FAN_FRAME_COUNT - 1,
      }),
      frameRate: FAN_FRAME_RATE,
      repeat: -1,
    });
  }

  private _createAnimation(
    key: string,
    textureKey: string,
    frames: { firstFrame: number; lastFrame: number; frameRate: number },
    repeat: number
  ): void {
    this.anims.create({
      key,
      frames: this.anims.generateFrameNumbers(textureKey, {
        start: frames.firstFrame,
        end: frames.lastFrame,
      }),
      frameRate: frames.frameRate,
      repeat,
    });
  }

  private _createFont(): void {
    const { font } = PRELOAD_CONFIG;
    this.cache.bitmapFont.add(
      'pixel-font',
      Phaser.GameObjects.RetroFont.Parse(this, {
        image: font.image,
        width: font.width,
        height: font.height,
        chars: font.chars,
        charsPerRow: font.charsPerRow,
        'offset.x': 0,
        'offset.y': 0,
        'spacing.x': font.spacing.x,
        'spacing.y': font.spacing.y,
        lineSpacing: font.lineSpacing,
      })
    );
  }

  private _createParticles(): void {
    const particles = PRELOAD_CONFIG.particles;
    this._generateTexture(particles.pixel);
    this._generateTexture(particles.speedLine);
    this._generateFogTexture(particles.fog);
  }

  private _generateTexture(config: { key: string; width: number; height: number }): void {
    const particles = PRELOAD_CONFIG.particles;
    const g = this.add.graphics();
    g.fillStyle(particles.color, particles.alpha);
    g.fillRect(0, 0, config.width, config.height);
    g.generateTexture(config.key, config.width, config.height);
    g.destroy();
  }

  private _generateFogTexture(config: { key: string; size: number; colors: number[] }): void {
    const pattern = [
      '   x    ',
      '  xxxx  ',
      ' xxxxxx ',
      'xxxxxxxx',
      'xxxxxxxx',
      ' xxxxxx ',
      '  xxxx  ',
      '    x   ',
    ];
    const g = this.add.graphics();

    pattern.forEach((row, y) => {
      [...row].forEach((cell, x) => {
        if (cell === ' ') return;
        const step = (x + y) % 2;
        g.fillStyle(config.colors[step], 1);
        g.fillRect(x, y, 1, 1);
      });
    });

    g.generateTexture(config.key, config.size, config.size);
    g.destroy();
  }
}
