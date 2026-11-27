import Phaser from 'phaser';

import { SCENE_KEYS } from '../config/sceneKeys.ts';
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
import { PLATFORM_CONFIGS, PLATFORM_TILE_SIZE } from '../config/platforms/index.ts';
import { FAN_FRAME_COUNT, FAN_FRAME_RATE, FAN_FRAME_SIZE } from '../config/objectsConfig.ts';
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

import { PALETTE } from '../config/palette.ts';
import { ASSET_KEYS } from '../config/assetKeys.ts';

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
    image: ASSET_KEYS.texture.font,
    chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.:,+-=;'#|\\/()[]{}!<>?÷%×− ",
    width: 14,
    height: 14,
    charsPerRow: 63,
    spacing: { x: 0, y: 0 },
    lineSpacing: 0,
  },
  particles: {
    color: PALETTE.white,
    alpha: 1,
    pixel: { key: ASSET_KEYS.texture.pixel, width: 2, height: 2 },
    speedLine: { key: ASSET_KEYS.texture.speedLine, width: 16, height: 2 },
    fog: {
      key: ASSET_KEYS.texture.fanFog,
      size: 8,
      colors: [PALETTE.dustyRose, PALETTE.sand],
    },
  },
};

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.PRELOAD);
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
    this.scene.start(SCENE_KEYS.MENU);
  }

  private _loadBackgrounds(): void {
    const textures = ASSET_KEYS.texture;
    const bgs = {
      [textures.background1]: bg1,
      [textures.background2]: bg2,
      [textures.background3]: bg3,
      [textures.background4]: bg4,
      [textures.background5]: bg5,
      [textures.background6a]: bg6a,
      [textures.background6b]: bg6b,
      [textures.foreground]: foregroundPng,
      [textures.traffic(1)]: traffic1Png,
      [textures.traffic(2)]: traffic2Png,
      [textures.traffic(3)]: traffic3Png,
      [textures.traffic(4)]: traffic4Png,
      [textures.traffic(5)]: traffic5Png,
    };
    this._loadImages(bgs);
  }

  private _loadUI(): void {
    const textures = ASSET_KEYS.texture;
    const ui = {
      [textures.menu(1)]: menu1,
      [textures.menu(2)]: menu2,
      [textures.menu(3)]: menu3,
      [textures.menu(4)]: menu4,
      [textures.menu(5)]: menu5,
      [textures.menu(6)]: menu6,
      [textures.menu(7)]: menu7,
      [textures.menu(8)]: menu8,
      [textures.menu(9)]: menu9,
      [textures.pauseButton]: pausePng,
      [textures.font]: fontPng,
      [textures.button('normal', 'left')]: btnNormalLeft,
      [textures.button('normal', 'center')]: btnNormalCenter,
      [textures.button('normal', 'right')]: btnNormalRight,
      [textures.button('pressed', 'left')]: btnPressedLeft,
      [textures.button('pressed', 'center')]: btnPressedCenter,
      [textures.button('pressed', 'right')]: btnPressedRight,
    };
    this._loadImages(ui);
  }

  private _loadTiles(): void {
    this.load.spritesheet(PLATFORM_CONFIGS.pipe.textureKey, pipeTilesPng, {
      frameWidth: PLATFORM_TILE_SIZE,
      frameHeight: PLATFORM_TILE_SIZE,
    });
    this.load.image(PLATFORM_CONFIGS.tile.textureKey, tilePng);
    this.load.spritesheet(ASSET_KEYS.texture.fan, fanSpinPng, {
      frameWidth: FAN_FRAME_SIZE,
      frameHeight: FAN_FRAME_SIZE,
    });
  }

  private _loadPlayer(): void {
    const frameSize = PRELOAD_CONFIG.player.frameSize;
    const textures = ASSET_KEYS.texture;
    this.load.image(textures.player, runPng);
    this._loadSpriteSheet(textures.playerJump, jumpPng, frameSize);
    this._loadSpriteSheet(textures.playerDeath, playerDeathPng, frameSize);
    this._loadSpriteSheet(textures.playerDash, playerDashPng, frameSize);
  }

  private _loadSpriteSheet(key: string, path: string, frameSize: number): void {
    this.load.spritesheet(key, path, {
      frameWidth: frameSize,
      frameHeight: frameSize,
    });
  }

  private _loadAudio(): void {
    const audio = ASSET_KEYS.audio;
    this.load.audio(audio.menuMusic, menuMusic);
    this.load.audio(audio.gameMusic, menuGame);
    this.load.audio(audio.ui, uiSound);
    this.load.audio(audio.death, deathSound);
    this.load.audio(audio.dash, dashSound);
    this.load.audio(audio.click, clickSound);
  }

  private _loadImages(imageMap: Record<string, string>): void {
    Object.entries(imageMap).forEach(([key, path]) => {
      this.load.image(key, path);
    });
  }

  private _createAnimations(): void {
    const player = PRELOAD_CONFIG.player;
    const { jump, death, dash, repeat } = player;
    const textures = ASSET_KEYS.texture;
    const animations = ASSET_KEYS.animation;
    this._createAnimation(animations.jump, textures.playerJump, jump, repeat);
    this._createAnimation(animations.death, textures.playerDeath, death, repeat);
    this._createAnimation(animations.dash, textures.playerDash, dash, repeat);

    this.anims.create({
      key: animations.fan,
      frames: this.anims.generateFrameNumbers(textures.fan, {
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
    this._registerFont(ASSET_KEYS.texture.font, font.chars);
    this._registerFont(ASSET_KEYS.texture.fontLower, font.chars.toLowerCase());
  }

  private _registerFont(key: string, chars: string): void {
    const { font } = PRELOAD_CONFIG;
    this.cache.bitmapFont.add(
      key,
      Phaser.GameObjects.RetroFont.Parse(this, {
        image: font.image,
        width: font.width,
        height: font.height,
        chars,
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
