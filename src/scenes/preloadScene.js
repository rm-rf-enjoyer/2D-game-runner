import Phaser from 'phaser';

import menuMusic from '../assets/audio/menu.mp3'

//Фон
import bg1 from '../assets/bg/1.png';
import bg2 from '../assets/bg/2.png';
import bg3 from '../assets/bg/3.png';
import bg4 from '../assets/bg/4.png';
import bg5 from '../assets/bg/5.png';

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
  }

  create() {
    this.scene.start('MenuScene');
  }
}
