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
import trafficObjectPng from '../assets/bg/trafficObject.png';

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

  preload() {
    this.load.image('bg1', bg1);
    this.load.image('bg2', bg2);
    this.load.image('bg3', bg3);
    this.load.image('bg4', bg4);
    this.load.image('foreground', foregroundPng);
    this.load.image('traffic-object', trafficObjectPng);

    this.load.image('menu-1', menu1);
    this.load.image('menu-2', menu2);
    this.load.image('menu-3', menu3);
    this.load.image('menu-4', menu4);
    this.load.image('menu-5', menu5);
    this.load.image('menu-6', menu6);
    this.load.image('menu-7', menu7);
    this.load.image('menu-8', menu8);
    this.load.image('menu-9', menu9);
    this.load.image('btn-pause', pausePng);
    this.load.image('pixel-font', fontPng);

    this.load.image('btn-normal-left', btnNormalLeft);
    this.load.image('btn-normal-center', btnNormalCenter);
    this.load.image('btn-normal-right', btnNormalRight);
    this.load.image('btn-pressed-left', btnPressedLeft);
    this.load.image('btn-pressed-center', btnPressedCenter);
    this.load.image('btn-pressed-right', btnPressedRight);
    
    this.load.image('top-ground-tile1', topGroundTile1Png);
    this.load.image('top-ground-tile2', topGroundTile2Png);
    this.load.image('top-ground-tile3', topGroundTile3Png);
    
    this.load.spritesheet('bottom-ground-tiles', bottomGroundTilesPng, {
      frameWidth: 16,
      frameHeight: 16,
    });
    this.load.spritesheet('pipe-platform-tiles', pipePlatformTilesPng, {
      frameWidth: 16,
      frameHeight: 16,
    });

    this.load.image('vending1', vending1Png);
    this.load.image('vending2', vending2Png);
    this.load.image('trash', trashPng);
    this.load.image('car', carPng);
    this.load.image('obstacle-tile', obstacleTilePng);

    // ЗАГРУЖАЕМ КАК ПРОСТУЮ КАРТИНКУ (без frameWidth)
    this.load.image('player', runPng);

    this.load.spritesheet('player-jump', jumpPng, {
      frameWidth: 24,
      frameHeight: 24,
    });

    this.load.spritesheet('player-death', playerDeathPng, {
      frameWidth: 24,
      frameHeight: 24,
    });

    this.load.audio('music-menu', menuMusic);
    this.load.audio('music-game', menuGame);
    this.load.audio('sfx-ui', uiSound);
    this.load.audio('sfx-death', deathSound);
    this.load.audio('sfx-dash', dashSound); // Используем для дэша и прыжка
    this.load.audio('sfx-click', clickSound);
  }

  create() {
    
    this.anims.create({
      key: 'jump-anim',
      frames: this.anims.generateFrameNumbers('player-jump', { start: 0, end: 7 }),
      frameRate: 20, // Скорость переворота. Увеличь, если слишком медленно.
      repeat: 0,     // Проиграть один раз и остановиться на последнем кадре
    });

    this.anims.create({
      key: 'death-anim',
      frames: this.anims.generateFrameNumbers('player-death', { start: 0, end: 3 }), // 4 кадра (0, 1, 2, 3)
      frameRate: 10, // Скорость анимации
      repeat: 0,     // Проиграть один раз и остановиться на последнем кадре
    });

    const FONT_CHARS =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
      '0123456789' +
      '.:,+-=;\'#|\\/()[]{}!<>?÷%×−' +
      ' ';

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

        // Создаем белый пиксель для частиц
    const g1 = this.add.graphics();
    g1.fillStyle(0xffffff, 1);
    g1.fillRect(0, 0, 2, 2);
    g1.generateTexture('pixel-particle', 2, 2);
    g1.destroy();

        const g2 = this.add.graphics();
    g2.fillStyle(0xffffff, 1);
    g2.fillRect(0, 0, 16, 2);
    g2.generateTexture('speed-line', 16, 2);
    g2.destroy();

    this.scene.start('MenuScene');
  }
}
