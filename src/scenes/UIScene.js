import Phaser from 'phaser';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig.js';
import { MenuPanel } from '../objects/menuPanel.js';
import { createMenuButton } from '../objects/buttonFactory.js';

export class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  create() {
    this.pauseBtn = this.add.image(GAME_WIDTH - 68, 68, 'btn-pause')
    .setScale(6)                  
    .setDepth(100)
    .setInteractive({ useHandCursor: true });

    this.pauseBtn.on('pointerdown', () => this.openPause());

    this.pauseContainer = null;
  }

  openPause() {
  // защита от двойного открытия
  if (this.pauseContainer) return;

  this.scene.pause('GameScene');
  this.pauseBtn.setVisible(false);

  this.pauseContainer = this.add.container(0, 0).setDepth(200);

  const panel = new MenuPanel(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, 6, 3, 3);
  this.pauseContainer.add(panel.container);

  const cx = GAME_WIDTH / 2;
  const cy = GAME_HEIGHT / 2;
  const step = 160;

  const resumeBtn = createMenuButton(this, cx, cy - step, 'RESUME', () => this.closePause());
  const menuBtn   = createMenuButton(this, cx, cy,        'MENU',   () => this.backToMenu());
  const exitBtn   = createMenuButton(this, cx, cy + step, 'EXIT',   () => this.exitApp());

  this.pauseContainer.add(resumeBtn.button.container);
  this.pauseContainer.add(resumeBtn.label);
  this.pauseContainer.add(menuBtn.button.container);
  this.pauseContainer.add(menuBtn.label);
  this.pauseContainer.add(exitBtn.button.container);
  this.pauseContainer.add(exitBtn.label);
}

closePause() {
  if (!this.pauseContainer) return;

  this.pauseContainer.destroy(true);
  this.pauseContainer = null;

  this.pauseBtn.setVisible(true);
  this.scene.resume('GameScene');
}
  
  backToMenu() {
    this.scene.stop('GameScene');
    this.scene.stop('UIScene');
    this.scene.start('MenuScene');
  }

  exitApp() {
    if (Capacitor.isNativePlatform()) {
      App.exitApp();
    }
  }
}
