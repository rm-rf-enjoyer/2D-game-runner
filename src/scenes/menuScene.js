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

    // Панель строго по центру
    this.panel = new MenuPanel(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, 6, 6);
    this.panel.setDepth(0);

    const cx = GAME_WIDTH / 2;
    
    // Пересчитал позиции под 4 кнопки. 
    // Экран 270. Центр 135. Начинаем с 75. Шаг 40.
    // 75, 115, 155, 195. Все кнопки идеально влезают в панель.
    const startY = 75; 
    const step = 40; 

    this.btnPlay    = createMenuButton(this, cx, startY,            'PLAY',    () => this._onPlay());
    this.btnRecords = createMenuButton(this, cx, startY + step,     'RECORDS', () => this._onRecords());
    this.btnSound   = createMenuButton(this, cx, startY + step * 2, 'SOUND',   () => this._onSound());
    this.btnExit    = createMenuButton(this, cx, startY + step * 3, 'EXIT',    () => this._onExit());

    // Музыка
    this.sound.getAllPlaying().forEach(s => s.stop());
    if (!this.sound.get('music-menu')) {
      this.music = this.sound.add('music-menu', { loop: true, volume: MUSIC_VOLUME });
    } else {
      this.music = this.sound.get('music-menu');
    }
    if (!this.music.isPlaying) this.music.play();

    if (this.scene.isActive('UIScene')) {
      this.scene.stop('UIScene');
    }
  }

  update(time, delta) {
    if (this.bg) this.bg.update(delta);
  }

  _onPlay() { 
    this.scene.start('GameScene'); 
  }

  _onRecords() {
    // ЗАГЛУШКА ДЛЯ БУДУЩЕГО БЭКЕНДА
    console.log('Opening Global Leaderboard...');
    // Здесь в будущем будет:
    // 1. Запрос к API (fetch)
    // 2. Запуск сцены RecordsScene с полученными данными
  }

  _onSound() { 
    this.sound.mute = !this.sound.mute; 
  }

  _onExit() {
    if (Capacitor.isNativePlatform()) App.exitApp();
  }
}
