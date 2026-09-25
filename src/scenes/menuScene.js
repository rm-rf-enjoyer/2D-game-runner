import Phaser from 'phaser';
import { Capacitor } from '@capacitor/core';
import { ParallaxBackground } from '../objects/parallaxBackground.js';
import { MenuPanel } from '../objects/menuPanel.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig.js';
import { Button } from '../objects/button.js';
import { createMenuButton } from '../objects/buttonFactory.js';
import { App } from '@capacitor/app';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    this.bg = new ParallaxBackground(this);

    this.bg.layers.forEach(l => 
      l.sprites.forEach(s => s.setDepth(-10))
    );

    const tileSize = 200;
    this.panel = new MenuPanel(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, tileSize);
    this.panel.setDepth(0);

    const cx = GAME_WIDTH / 2;
    const step = 130; // расстояние между кнопками
    const startY = GAME_HEIGHT / 2 - step + 65;

    this.btnPlay = createMenuButton(this, cx, startY,         'PLAY',   () => this._onPlay());
    this.btnSound = createMenuButton(this, cx, startY + step, 'SOUND',  () => this._onSound());
    this.btnExit = createMenuButton(this, cx, startY + step * 2, 'EXIT', () => this._onExit());

    //Музыка
    if (!this.sound.get('music-menu')) {
      this.music = this.sound.add('music-menu', {
        loop: true,
        volume: 0.5,
      });
    } else {
      this.music = this.sound.get('music-menu');
    }

    // запускаем только если ещё не играет
    if (!this.music.isPlaying) {
      this.music.play();
    }
  }

  update(time, delta) {
    this.bg.update(delta);
  }

  _onPlay()  { console.log('PLAY'); }
  _onSound() { console.log('onLeaderBoard'); this.sound.mute = !this.sound.mute; }
  _onExit() {
  if (Capacitor.isNativePlatform()) {
    App.exitApp();
  }
}
}
