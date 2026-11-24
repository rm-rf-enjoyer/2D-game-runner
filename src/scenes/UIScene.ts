import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { MenuPanel } from '../objects/MenuPanel';
import {
  createMenuButtons,
  MenuButtonConfig
} from '../objects/buttonFactory';
import { toggleSoundMuted } from '../utils/settings';

const SCENES = { GAME: 'GameScene', UI: 'UIScene', MENU: 'MenuScene' };
const SOUNDS = { UI: 'sfx-ui' };

export class UIScene extends Phaser.Scene {
  private pauseBtn!: Phaser.GameObjects.Image;
  private pauseContainer: Phaser.GameObjects.Container | null = null;
  
  private readonly UI_CONFIG = {
    pauseBtn: { x: GAME_WIDTH - 20, y: 20, depth: 100 },
    pauseMenu: { depth: 200, panelTiles: 6 },
    buttons: { startY: 75, step: 40 },
    volume: 1,
  };

  constructor() {
    super(SCENES.UI);
  }

  public create(): void {
    this.pauseBtn = this.add.image(
      this.UI_CONFIG.pauseBtn.x, 
      this.UI_CONFIG.pauseBtn.y, 
      'btn-pause'
    )
    .setDepth(this.UI_CONFIG.pauseBtn.depth)
    .setInteractive({ useHandCursor: true });

    this.pauseBtn.on('pointerdown', () => this.openPause());
  }

  public openPause(): void {
    if (this.pauseContainer) return; 

    this._playUISound();
    this.scene.pause(SCENES.GAME);
    this.pauseBtn.setVisible(false);

    this.pauseContainer = this.add.container(0, 0)
      .setDepth(this.UI_CONFIG.pauseMenu.depth);
    
    this._buildPausePanel();
    this._buildPauseButtons();
  }

  private _playUISound(): void {
    this.sound.play(SOUNDS.UI, { volume: this.UI_CONFIG.volume });  
  }

  private _buildPausePanel(): void {
    if (!this.pauseContainer) return;
    
    const panel = new MenuPanel({
      scene: this,
      centerX: GAME_WIDTH / 2,
      centerY: GAME_HEIGHT / 2,
      widthTiles: this.UI_CONFIG.pauseMenu.panelTiles,
      heightTiles: this.UI_CONFIG.pauseMenu.panelTiles
    });
    this.pauseContainer.add(panel.getContainer());
  }

  private _buildPauseButtons(): void {
    if (!this.pauseContainer) return;

    const step = this.UI_CONFIG.buttons.step;
    const configs: MenuButtonConfig[] = [
      { text: 'CONTINUE', yOffset: 0, onClick: () => this.closePause() },
      {
        text: 'RECORDS',
        yOffset: step,
        onClick: () => this._onRecords()
      },
      {
        text: 'SOUND',
        yOffset: step * 2,
        onClick: () => this._onSound()
      },
      {
        text: 'MENU',
        yOffset: step * 3,
        onClick: () => this.backToMenu()
      }
    ];

    createMenuButtons({
      scene: this,
      centerX: GAME_WIDTH / 2,
      startY: this.UI_CONFIG.buttons.startY,
      container: this.pauseContainer
    }, configs);
  }

  public closePause(): void {
    if (!this.pauseContainer) return;

    this.pauseContainer.destroy(true);
    this.pauseContainer = null;

    this.pauseBtn.setVisible(true);
    this.scene.resume(SCENES.GAME);
  }

  private backToMenu(): void {
    this.scene.stop(SCENES.GAME);
    this.scene.stop(SCENES.UI);
    this.scene.start(SCENES.MENU);
  }

  private _onRecords(): void {
    // В будущем: this.scene.start('RecordsScene');
  }

  private _onSound(): void {
    this.sound.mute = toggleSoundMuted(this.sound.mute);
  }
}
