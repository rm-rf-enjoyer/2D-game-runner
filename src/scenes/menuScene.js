import Phaser from 'phaser';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { ParallaxBackground } from '../objects/parallaxBackground.js';
import { MenuPanel } from '../objects/menuPanel.js';
import { GAME_WIDTH, GAME_HEIGHT, MUSIC_VOLUME } from '../config/gameConfig.js';
import { createMenuButton } from '../objects/buttonFactory.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    this.bg = new ParallaxBackground(this);
    this.bg.layers.forEach(l =>
      l.sprites.forEach(s => s.setDepth(-10))
    );

    const tileSize = 64;
    this.panel = new MenuPanel(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, tileSize);
    this.panel.setDepth(0);

    const cx = GAME_WIDTH / 2;
    const step = 130;
    const startY = GAME_HEIGHT / 2 - step;

    this.btnPlay  = createMenuButton(this, cx, startY,            'PLAY',  () => this._onPlay());
    this.btnSound = createMenuButton(this, cx, startY + step,     'SOUND', () => this._onSound());
    this.btnExit  = createMenuButton(this, cx, startY + step * 2, 'EXIT',  () => this._onExit());

    if (!this.sound.get('music-menu')) {
      this.music = this.sound.add('music-menu', {
        loop: true,
        volume: MUSIC_VOLUME,
      });
    } else {
      this.music = this.sound.get('music-menu');
    }

    if (!this.music.isPlaying) {
      this.music.play();
    }
  }

  update(time, delta) {
    this.bg.update(delta);
  }

  _onPlay() {
    console.log('PLAY');
    this.scene.start('GameScene');
  }

  _onSound() {
    console.log('SOUND');
    this.sound.mute = !this.sound.mute;
  }

  _onExit() {
    if (Capacitor.isNativePlatform()) {
      App.exitApp();
    }
  }
}
