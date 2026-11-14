import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig.js';
import { MenuPanel } from '../objects/menuPanel.js';
import { createMenuButton } from '../objects/buttonFactory.js';

export class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  create() {
    // Кнопка паузы (||) в правом верхнем углу
    this.pauseBtn = this.add.image(GAME_WIDTH - 20, 20, 'btn-pause')
      .setScale(1)
      .setDepth(100)
      .setInteractive({ useHandCursor: true });

    this.pauseBtn.on('pointerdown', () => this.openPause());

    this.pauseContainer = null;
  }

  openPause() {
    if (this.pauseContainer) return; // Защита от двойного клика
    this.sound.play('sfx-ui', { volume: 1 });  

    this.scene.pause('GameScene');
    this.pauseBtn.setVisible(false);

    this.pauseContainer = this.add.container(0, 0).setDepth(200);

    // Панель по центру
    const panel = new MenuPanel(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, 6, 6);
    this.pauseContainer.add(panel.container);

    // Кнопки
    const cx = GAME_WIDTH / 2;
    const startY = 75;
    const step = 40;

    const btnContinue = createMenuButton(this, cx, startY,            'CONTINUE', () => this.closePause());
    const btnRecords  = createMenuButton(this, cx, startY + step,     'RECORDS',  () => this._onRecords());
    const btnSound    = createMenuButton(this, cx, startY + step * 2, 'SOUND',    () => this._onSound());
    const btnMenu     = createMenuButton(this, cx, startY + step * 3, 'MENU',     () => this.backToMenu());

    // Добавляем кнопки в контейнер
    [btnContinue, btnRecords, btnSound, btnMenu].forEach(btn => {
      this.pauseContainer.add(btn.button.container);
      this.pauseContainer.add(btn.label);
    });
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

  _onRecords() {
    // Заглушка для будущего бэкенда
    console.log('Opening Global Leaderboard from Pause...');
    // В будущем: this.scene.start('RecordsScene');
  }

  _onSound() {
    this.sound.mute = !this.sound.mute;
    console.log('Sound toggled:', !this.sound.mute ? 'ON' : 'OFF');
  }
}
