import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { MenuPanel } from '../objects/MenuPanel';
import { createMenuButton } from '../objects/buttonFactory';

const SCENES = { GAME: 'GameScene', UI: 'UIScene', MENU: 'MenuScene' };
const SOUNDS = { UI: 'sfx-ui' };

interface PauseButtonConfig {
  text: string;
  yOffset: number;
  onClick: () => void;
}

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

    this.pauseContainer = this.add.container(0, 0).setDepth(this.UI_CONFIG.pauseMenu.depth);
    
    this._buildPausePanel();
    this._buildPauseButtons();
  }

  private _playUISound(): void {
    this.sound.play(SOUNDS.UI, { volume: this.UI_CONFIG.volume });  
  }

  private _buildPausePanel(): void {
    if (!this.pauseContainer) return;
    
    const panel = new MenuPanel(
      this, 
      GAME_WIDTH / 2, 
      GAME_HEIGHT / 2, 
      this.UI_CONFIG.pauseMenu.panelTiles, 
      this.UI_CONFIG.pauseMenu.panelTiles
    );
    this.pauseContainer.add(panel.container);
  }

  private _buildPauseButtons(): void {
    if (!this.pauseContainer) return;

    const buttonConfigs: PauseButtonConfig[] = [
      { text: 'CONTINUE', yOffset: 0, onClick: () => this.closePause() },
      { text: 'RECORDS', yOffset: this.UI_CONFIG.buttons.step, onClick: () => this._onRecords() },
      { text: 'SOUND', yOffset: this.UI_CONFIG.buttons.step * 2, onClick: () => this._onSound() },
      { text: 'MENU', yOffset: this.UI_CONFIG.buttons.step * 3, onClick: () => this.backToMenu() }
    ];

    const cx = GAME_WIDTH / 2;

    buttonConfigs.forEach(config => {
      const btn = createMenuButton(
        this, 
        cx, 
        this.UI_CONFIG.buttons.startY + config.yOffset, 
        config.text, 
        config.onClick
      );
      
      this.pauseContainer?.add(btn.button.container);
      this.pauseContainer?.add(btn.label);
    });
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
    this.sound.mute = !this.sound.mute;
  }
}
