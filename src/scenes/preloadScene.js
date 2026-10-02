import Phaser from 'phaser';

import menuMusic from '../assets/audio/menu.mp3'
import menuGame from '../assets/audio/game_theme.mp3'

//Фон
import bg1 from '../assets/bg/city5.png';
import bg2 from '../assets/bg/city4.png';
import bg3 from '../assets/bg/city3.png';
import bg4 from '../assets/bg/city2.png';
import bg5 from '../assets/bg/city1.png';

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

//UI кнопки
import btnNormalLeft from '../assets/ui/buttons/1.png';
import btnNormalCenter from '../assets/ui/buttons/2.png';
import btnNormalRight from '../assets/ui/buttons/3.png';
import btnPressedLeft from '../assets/ui/buttons/4.png';
import btnPressedCenter from '../assets/ui/buttons/5.png';
import btnPressedRight from '../assets/ui/buttons/6.png';

//Земля
import groundTopPng from '../assets/tiles/Tile_02.png';
import groundBottomPng from '../assets/tiles/Tile_12.png';

//Герой
import runPng from '../assets/player/Running.png';
//import jumpUpPng from '../assets/player/Jumping.png';
//import jumpDownPng from '../assets/player/Jumping.png';

//Враг
import enemyWalkPng from '../assets/enemy/cyberzombie.png';



export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    this.load.image('bg1', bg1);
    this.load.image('bg2', bg2);
    this.load.image('bg3', bg3);
    this.load.image('bg4', bg4);
    this.load.image('bg5', bg5);

    this.load.image('menu-1', menu1);
    this.load.image('menu-2', menu2);
    this.load.image('menu-3', menu3);
    this.load.image('menu-4', menu4);
    this.load.image('menu-5', menu5);
    this.load.image('menu-6', menu6);
    this.load.image('menu-7', menu7);
    this.load.image('menu-8', menu8);
    this.load.image('menu-9', menu9);


    this.load.image('btn-normal-left', btnNormalLeft);
    this.load.image('btn-normal-center', btnNormalCenter);
    this.load.image('btn-normal-right', btnNormalRight);
    this.load.image('btn-pressed-left', btnPressedLeft);
    this.load.image('btn-pressed-center', btnPressedCenter);
    this.load.image('btn-pressed-right', btnPressedRight);
    
    this.load.audio('music-menu', menuMusic);
    this.load.audio('music-game', menuGame);

    this.load.image('ground-top', groundTopPng);
    this.load.image('ground-bottom', groundBottomPng);

    this.load.spritesheet('player-run', runPng, {
      frameWidth: 32,
      frameHeight: 32,
    });

    this.load.spritesheet('player-jump-up', runPng, {
      frameWidth: 32,
      frameHeight: 32,
    });

    this.load.spritesheet('player-jump-down', runPng, {
      frameWidth: 32,
      frameHeight: 32,
    });

    this.load.spritesheet('enemy-walk', enemyWalkPng, {
      frameWidth: 32,
      frameHeight: 32,
    });

    this.load.spritesheet('enemy-tall', enemyWalkPng, {
      frameWidth: 48,
      frameHeight: 48,
    });

  }

  create() {
    this.anims.create({
      key: 'run',
      frames: this.anims.generateFrameNumbers('player-run', { start: 0, end: 7 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: 'jump-up',
      frames: this.anims.generateFrameNumbers('player-jump-up', { start: 0, end: 3 }),
      frameRate: 20,
      repeat: 0,              // проиграть один раз и остановиться на последнем кадре
    });

    this.anims.create({
      key: 'jump-down',
      frames: this.anims.generateFrameNumbers('player-jump-down', { start: 3, end: 7 }),
      frameRate: 20,
      repeat: 0,              // проиграть один раз и остановиться на последнем кадре
    });

    this.anims.create({
      key: 'enemy-walk',
      frames: this.anims.generateFrameNumbers('enemy-walk', { start: 0, end: 0 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: 'enemy-tall-walk',
      frames: this.anims.generateFrameNumbers('enemy-walk', { start: 0, end: 0 }),
      frameRate: 10,
      repeat: -1,
    });

    console.log('enemy-walk frames:', this.textures.get('enemy-walk').frameTotal);
console.log('enemy-walk anim exists:', this.anims.exists('enemy-walk'));

    this.scene.start('MenuScene');
  }
}
