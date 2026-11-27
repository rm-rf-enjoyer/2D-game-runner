import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig.ts';
import { SCENE_KEYS } from '../config/sceneKeys.ts';
import { ASSET_KEYS } from '../config/assetKeys.ts';
import { MenuPanel } from '../objects/MenuPanel.ts';
import { createMenuButton, createMenuButtons, MenuButtonConfig } from '../objects/buttonFactory.ts';
import { createPanelTitle } from '../objects/panelTitleFactory.ts';
import { toggleSoundMuted } from '../utils/settings.ts';
import { PauseMenuState } from '../systems/PauseMenuState.ts';
import { SAVE_DIALOG_CONFIG, getSaveDialogPanelBounds } from '../config/saveDialogConfig.ts';
import { getPanelBounds } from '../config/panelConfig.ts';
import { getRecordsService } from '../services/records/recordsService.ts';

const UI_SOUND_KEY = ASSET_KEYS.audio.ui;
const SAVE_NAME_SYMBOLS = 'a-zA-Z0-9 _-';
const SAVE_NAME_CLEAN_PATTERN = new RegExp(`[^${SAVE_NAME_SYMBOLS}]`, 'g');

export class UIScene extends Phaser.Scene {
  private pauseBtn!: Phaser.GameObjects.Image;
  private pauseContainer: Phaser.GameObjects.Container | null = null;
  private readonly pauseState = new PauseMenuState();

  private saveContainer: Phaser.GameObjects.Container | null = null;
  private nameLabel: Phaser.GameObjects.BitmapText | null = null;
  private nameInput: HTMLInputElement | null = null;
  private caret: Phaser.GameObjects.Rectangle | null = null;
  private caretTimer: Phaser.Time.TimerEvent | null = null;
  private saveName = '';
  private resultScore = '';

  private readonly UI_CONFIG = {
    pauseBtn: { x: GAME_WIDTH - 20, y: 20, depth: 100 },
    pauseMenu: { depth: 200, panelTiles: 6, title: 'pause' },
    buttons: { startY: 95, step: 40 },
    volume: 1,
  };

  constructor() {
    super(SCENE_KEYS.UI);
  }

  public create(): void {
    this.pauseState.reset();
    this.pauseContainer = null;
    this._destroySaveDialog();

    this.pauseBtn = this.add
      .image(this.UI_CONFIG.pauseBtn.x, this.UI_CONFIG.pauseBtn.y, ASSET_KEYS.texture.pauseButton)
      .setDepth(this.UI_CONFIG.pauseBtn.depth)
      .setInteractive({ useHandCursor: true });

    this.pauseBtn.on('pointerdown', () => this.openPause());

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.pauseState.reset();
      this.pauseContainer = null;
      this._destroySaveDialog();
    });
  }

  public openPause(): void {
    if (this.saveContainer || !this.pauseState.tryOpen()) return;

    this._playUISound();
    this.scene.pause(SCENE_KEYS.GAME);
    this.pauseBtn.setVisible(false);

    this.pauseContainer = this.add.container(0, 0).setDepth(this.UI_CONFIG.pauseMenu.depth);

    this._buildPausePanel();
    this._buildPauseButtons();
  }

  public openSaveDialog(score: string): void {
    if (this.saveContainer) return;
    if (this.pauseState.isOpen) this.closePause();

    this._playUISound();
    this.pauseBtn.setVisible(false).disableInteractive();

    this.resultScore = score;
    this.saveName = '';
    this.saveContainer = this.add.container(0, 0).setDepth(SAVE_DIALOG_CONFIG.depth);

    this._buildSavePanel();
    this._buildNameField();
    this._buildSaveButtons();
    this._createNameInput();
    this._focusNameInput();

    this.caretTimer = this.time.addEvent({
      delay: SAVE_DIALOG_CONFIG.field.caretBlinkDelay,
      loop: true,
      callback: () => {
        if (this.caret) this.caret.setVisible(!this.caret.visible);
      },
    });
  }

  private _buildSavePanel(): void {
    if (!this.saveContainer) return;

    const panel = new MenuPanel({
      scene: this,
      centerX: SAVE_DIALOG_CONFIG.centerX,
      centerY: SAVE_DIALOG_CONFIG.centerY,
      widthTiles: SAVE_DIALOG_CONFIG.panel.widthTiles,
      heightTiles: SAVE_DIALOG_CONFIG.panel.heightTiles,
    });
    this.saveContainer.add(panel.getContainer());
  }

  private _buildNameField(): void {
    if (!this.saveContainer) return;

    const bounds = getSaveDialogPanelBounds();
    const field = SAVE_DIALOG_CONFIG.field;
    const x = bounds.left + field.x;
    const y = bounds.top + field.y;

    const background = this.add
      .rectangle(x, y, field.width, field.height, field.color)
      .setOrigin(0, 0);

    const label = this.add
      .bitmapText(
        x + 1,
        y + (field.height - field.fontSize) / 2,
        ASSET_KEYS.texture.fontLower,
        '',
        field.fontSize
      )
      .setOrigin(0, 0)
      .setTint(field.textColor);

    const caret = this.add
      .rectangle(
        x + 1,
        y + field.height - field.caretHeight,
        field.caretWidth,
        field.caretHeight,
        field.textColor
      )
      .setOrigin(0, 0);

    const zone = this.add
      .zone(x, y, field.width, field.height)
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => this._focusNameInput());

    this.saveContainer.add([background, label, caret, zone]);
    this.nameLabel = label;
    this.caret = caret;
  }

  private _buildSaveButtons(): void {
    if (!this.saveContainer) return;

    const bounds = getSaveDialogPanelBounds();
    const { width, padding, labelColor } = SAVE_DIALOG_CONFIG.button;
    const common = {
      scene: this,
      y: SAVE_DIALOG_CONFIG.centerY,
      width,
      labelTint: labelColor,
      labelFont: ASSET_KEYS.texture.fontLower,
    };

    const save = createMenuButton({
      ...common,
      x: bounds.left + padding + width / 2,
      text: 'save',
      onClick: () => this._onSave(),
    });
    const menu = createMenuButton({
      ...common,
      x: bounds.left + bounds.width - padding - width / 2,
      text: 'menu',
      onClick: () => this.backToMenu(),
    });

    this.saveContainer.add([save.button.container, save.label, menu.button.container, menu.label]);
  }

  private _createNameInput(): void {
    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = SAVE_DIALOG_CONFIG.field.maxLength;
    input.autocomplete = 'off';
    input.setAttribute('aria-label', 'save name');
    input.style.position = 'fixed';
    input.style.left = '-9999px';
    input.style.opacity = '0';
    input.addEventListener('input', () => this._setName(input.value));
    input.addEventListener('keydown', (event: KeyboardEvent) => event.stopPropagation());

    document.body.appendChild(input);
    this.nameInput = input;
  }

  private _focusNameInput(): void {
    this.nameInput?.focus();
  }

  private _setName(value: string): void {
    const name = value
      .replace(SAVE_NAME_CLEAN_PATTERN, '')
      .slice(0, SAVE_DIALOG_CONFIG.field.maxLength);
    this.saveName = name;

    if (this.nameInput && this.nameInput.value !== name) {
      this.nameInput.value = name;
    }

    this._renderName();
  }

  private _renderName(): void {
    if (!this.nameLabel) return;

    const field = SAVE_DIALOG_CONFIG.field;
    const bounds = getSaveDialogPanelBounds();
    this.nameLabel.setText(this.saveName.toLowerCase());

    const overflow = Math.max(0, this.nameLabel.width - (field.width - field.caretWidth - 2));
    this.nameLabel.x = bounds.left + field.x + 1 - overflow;

    if (this.caret) {
      this.caret.x = this.nameLabel.x + this.nameLabel.width;
    }
  }

  private _onSave(): void {
    const name = this.saveName.trim();
    if (!name) {
      this._focusNameInput();
      return;
    }

    const scoreMeters = Number.parseInt(this.resultScore, 10);
    getRecordsService().save(name, Number.isFinite(scoreMeters) ? scoreMeters : 0);
    this.backToMenu();
  }

  private _destroySaveDialog(): void {
    this.caretTimer?.remove();
    this.caretTimer = null;

    this.saveContainer?.destroy(true);
    this.saveContainer = null;
    this.nameLabel = null;
    this.caret = null;

    this.nameInput?.remove();
    this.nameInput = null;
  }

  private _playUISound(): void {
    this.sound.play(UI_SOUND_KEY, { volume: this.UI_CONFIG.volume });
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

    const title = createPanelTitle({
      scene: this,
      centerX: GAME_WIDTH / 2,
      panelTop: this._getPausePanelTop(),
      text: this.UI_CONFIG.pauseMenu.title,
    });
    this.pauseContainer.add(title);
  }

  private _getPausePanelTop(): number {
    const tiles = this.UI_CONFIG.pauseMenu.panelTiles;

    return getPanelBounds({
      centerX: GAME_WIDTH / 2,
      centerY: GAME_HEIGHT / 2,
      widthTiles: tiles,
      heightTiles: tiles,
    }).top;
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
    this._destroySaveDialog();
    this.scene.stop(SCENE_KEYS.GAME);
    this.scene.stop(SCENE_KEYS.UI);
    this.scene.start(SCENE_KEYS.MENU);
  }

  private _onSound(): void {
    this.sound.mute = toggleSoundMuted(this.sound.mute);
  }
}
