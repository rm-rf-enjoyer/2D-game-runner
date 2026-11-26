import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig.ts';
import { SCENE_KEYS } from '../config/sceneKeys.ts';
import { ASSET_KEYS } from '../config/assetKeys.ts';
import { MenuPanel } from '../objects/MenuPanel.ts';
import { createMenuButtons, MenuButtonConfig } from '../objects/buttonFactory.ts';
import { toggleSoundMuted } from '../utils/settings.ts';
import { PauseMenuState } from '../systems/PauseMenuState.ts';

const SOUNDS = { UI: ASSET_KEYS.audio.ui };

export class UIScene extends Phaser.Scene {
  private pauseBtn!: Phaser.GameObjects.Image;
  private pauseContainer: Phaser.GameObjects.Container | null = null;
  private readonly pauseState = new PauseMenuState();

  private readonly UI_CONFIG = {
    pauseBtn: { x: GAME_WIDTH - 20, y: 20, depth: 100 },
    pauseMenu: { depth: 200, panelTiles: 6 },
    buttons: { startY: 75, step: 40 },
    volume: 1,
  };

  constructor() {
    super(SCENE_KEYS.UI);
  }

  public create(): void {
    this.pauseState.reset();
    this.pauseContainer = null;

    this.pauseBtn = this.add
      .image(this.UI_CONFIG.pauseBtn.x, this.UI_CONFIG.pauseBtn.y, ASSET_KEYS.texture.pauseButton)
      .setDepth(this.UI_CONFIG.pauseBtn.depth)
      .setInteractive({ useHandCursor: true });

    this.pauseBtn.on('pointerdown', () => this.openPause());

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.pauseState.reset();
      this.pauseContainer = null;
    });
  }

  public openPause(): void {
    if (!this.pauseState.tryOpen()) return;

    this._playUISound();
    this.scene.pause(SCENE_KEYS.GAME);
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

    const panel = new MenuPanel({
      scene: this,
      centerX: GAME_WIDTH / 2,
      centerY: GAME_HEIGHT / 2,
      widthTiles: this.UI_CONFIG.pauseMenu.panelTiles,
      heightTiles: this.UI_CONFIG.pauseMenu.panelTiles,
    });
    this.pauseContainer.add(panel.getContainer());
  }

  private _buildPauseButtons(): void {
    if (!this.pauseContainer) return;

    const step = this.UI_CONFIG.buttons.step;
    const configs: MenuButtonConfig[] = [
      { text: 'CONTINUE', yOffset: 0, onClick: () => this.closePause() },
      {
        text: 'SOUND',
        yOffset: step,
        onClick: () => this._onSound(),
      },
      {
        text: 'MENU',
        yOffset: step * 2,
        onClick: () => this.backToMenu(),
      },
    ];

    createMenuButtons(
      {
        scene: this,
        centerX: GAME_WIDTH / 2,
        startY: this.UI_CONFIG.buttons.startY,
        container: this.pauseContainer,
      },
      configs
    );
  }

  public closePause(): void {
    if (!this.pauseState.close()) return;

    this.pauseContainer?.destroy(true);
    this.pauseContainer = null;

    this.pauseBtn.setVisible(true);
    this.scene.resume(SCENE_KEYS.GAME);
  }

  private backToMenu(): void {
    this.scene.stop(SCENE_KEYS.GAME);
    this.scene.stop(SCENE_KEYS.UI);
    this.scene.start(SCENE_KEYS.MENU);
  }

  private _onSound(): void {
    this.sound.mute = toggleSoundMuted(this.sound.mute);
  }
}
