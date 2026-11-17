import Phaser from 'phaser';

import menuMusic from '../assets/audio/menu.mp3';
import menuGame from '../assets/audio/game_theme2.mp3';
import uiSound from '../assets/audio/ui.mp3';
import deathSound from '../assets/audio/death.mp3';
import dashSound from '../assets/audio/dash.mp3';
import clickSound from '../assets/audio/click.mp3';

//Фон
import bg1 from '../assets/bg/city1.png';
import bg2 from '../assets/bg/city2.png';
import bg3 from '../assets/bg/city3.png';
import bg4 from '../assets/bg/city4.png';
import foregroundPng from '../assets/bg/Foreground.png';
import traffic1Png from '../assets/bg/trafficObject1.png';
import traffic2Png from '../assets/bg/trafficObject2.png';
import traffic3Png from '../assets/bg/trafficObject3.png';
import traffic4Png from '../assets/bg/trafficObject4.png';
import traffic5Png from '../assets/bg/trafficObject5.png';

//UI меню
import menu1 from '../assets/ui/menu/1.png'
import menu2 from '../assets/ui/menu/2.png'
import menu3 from '../assets/ui/menu/3.png'
import menu4 from '../assets/ui/menu/4.png'
import menu5 from '../assets/ui/menu/5.png'
import menu6 from '../assets/ui/menu/6.png'
import menu7 from '../assets/ui/menu/7.png'
import menu8 from '../assets/ui/menu/8.png'
import menu9 from '../assets/ui/menu/9.png'
import pausePng from '../assets/ui/pause/pause.png';
import fontPng from '../assets/ui/font/font-white.png';

//UI кнопки
import btnNormalLeft from '../assets/ui/buttons/1.png';
import btnNormalCenter from '../assets/ui/buttons/2.png';
import btnNormalRight from '../assets/ui/buttons/3.png';
import btnPressedLeft from '../assets/ui/buttons/4.png';
import btnPressedCenter from '../assets/ui/buttons/5.png';
import btnPressedRight from '../assets/ui/buttons/6.png';

//Платформы
import topGroundTile1Png from '../assets/tiles/tile-ground-top1.png';
import topGroundTile2Png from '../assets/tiles/tile-ground-top2.png';
import topGroundTile3Png from '../assets/tiles/tile-ground-top3.png';
import bottomGroundTilesPng from '../assets/tiles/tile-ground-bottom.png';
import pipePlatformTilesPng from '../assets/tiles/pipe-platform.png';

//Препятствия
import carPng from '../assets/tiles/obstacle-car-parked.png';
import trashPng from '../assets/tiles/obstacle-trash.png';
import vending1Png from '../assets/tiles/obstacle-vending1.png';
import vending2Png from '../assets/tiles/obstacle-vending2.png';
import obstacleTilePng from '../assets/tiles/obstacleTile.png';

//Герой
import runPng from '../assets/player/player.png'; // Загружаем одну картинку
import jumpPng from '../assets/player/hero-jump.png';
import playerDeathPng from '../assets/player/player-death.png';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  public preload(): void {
    this._loadBackgrounds();
    this._loadUI();
    this._loadTilesAndObstacles();
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
      bg1, bg2, bg3, bg4,
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
      'menu-1': menu1, 'menu-2': menu2, 'menu-3': menu3,
      'menu-4': menu4, 'menu-5': menu5, 'menu-6': menu6,
      'menu-7': menu7, 'menu-8': menu8, 'menu-9': menu9,
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

  private _loadTilesAndObstacles(): void {
    const tiles = {
      'top-ground-tile1': topGroundTile1Png,
      'top-ground-tile2': topGroundTile2Png,
      'top-ground-tile3': topGroundTile3Png,
      'vending1': vending1Png,
      'vending2': vending2Png,
      'trash': trashPng,
      'car': carPng,
      'obstacle-tile': obstacleTilePng,
    };
    this._loadImages(tiles);

    this.load.spritesheet('bottom-ground-tiles', bottomGroundTilesPng, { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('pipe-platform-tiles', pipePlatformTilesPng, { frameWidth: 16, frameHeight: 16 });
  }

  private _loadPlayer(): void {
    this.load.image('player', runPng);
    this.load.spritesheet('player-jump', jumpPng, { frameWidth: 24, frameHeight: 24 });
    this.load.spritesheet('player-death', playerDeathPng, { frameWidth: 24, frameHeight: 24 });
  }

  private _loadAudio(): void {
    this.load.audio('music-menu', menuMusic);
    this.load.audio('music-game', menuGame);
    this.load.audio('sfx-ui', uiSound);
    this.load.audio('sfx-death', deathSound);
    this.load.audio('sfx-dash', dashSound);
    this.load.audio('sfx-click', clickSound);
  }

  // Универсальный загрузчик картинок (DRY)
  private _loadImages(imageMap: Record<string, string>): void {
    Object.entries(imageMap).forEach(([key, path]) => {
      this.load.image(key, path);
    });
  }

  private _createAnimations(): void {
    this.anims.create({
      key: 'jump-anim',
      frames: this.anims.generateFrameNumbers('player-jump', { start: 0, end: 7 }),
      frameRate: 20,
      repeat: 0,
    });

    this.anims.create({
      key: 'death-anim',
      frames: this.anims.generateFrameNumbers('player-death', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: 0,
    });
  }

  private _createFont(): void {
    const FONT_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.:,+-=;\'#|\\/()[]{}!<>?÷%×− ';
    const config = {
      image: 'pixel-font',
      width: 14,
      height: 14,
      chars: FONT_CHARS,
      charsPerRow: 63,
      spacing: { x: 0, y: 0 },
      lineSpacing: 0,
    };

    this.cache.bitmapFont.add(
      'pixel-font',
      Phaser.GameObjects.RetroFont.Parse(this, config)
    );
  }

  private _createParticles(): void {
    this._generateTexture('pixel-particle', 2, 2);
    this._generateTexture('speed-line', 16, 2);
  }

  private _generateTexture(key: string, width: number, height: number): void {
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, width, height);
    g.generateTexture(key, width, height);
    g.destroy();
  }
}
