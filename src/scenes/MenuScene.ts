import Phaser from 'phaser';
import { Scenery, SceneryState } from '../objects/Scenery.ts';
import { MenuPanel } from '../objects/MenuPanel.ts';
import { Rain } from '../objects/Rain.ts';
import { GAME_WIDTH, GAME_HEIGHT, MUSIC_VOLUME } from '../config/gameConfig.ts';
import { getPanelBounds } from '../config/panelConfig.ts';
import { SCENE_KEYS } from '../config/sceneKeys.ts';
import { ASSET_KEYS } from '../config/assetKeys.ts';
import { WORLD_INITIAL_SPEED } from '../config/worldConfig.ts';
import { createMenuButtons, MenuButtonConfig, MenuButtonReturn } from '../objects/buttonFactory.ts';
import { createPanelTitle } from '../objects/panelTitleFactory.ts';
import { RecordsPanel } from '../objects/RecordsPanel.ts';
import { toggleSoundMuted } from '../utils/settings.ts';

const MENU_CONFIG = {
  title: 'menu',
  panel: { tiles: 6, depth: 5 },
  buttons: {
    startY: 95,
    step: 40,
    labels: { play: 'PLAY', sound: 'SOUND', records: 'RECORDS' },
  },
} as const;
const MENU_MUSIC_KEY = ASSET_KEYS.audio.menuMusic;

export class MenuScene extends Phaser.Scene {
  private scenery!: Scenery;
  private rain!: Rain;
  private panel: MenuPanel | null = null;
  private title: Phaser.GameObjects.BitmapText | null = null;
  private menuButtons: MenuButtonReturn[] = [];
  private recordsPanel: RecordsPanel | null = null;
  private music?: Phaser.Sound.BaseSound;

  constructor() {
    super(SCENE_KEYS.MENU);
  }

  public create(data: { scenery?: SceneryState } = {}): void {
    this.setupUI(data.scenery);
    this.setupMusic();
    this.setupEvents();
  }

  public update(_time: number, delta: number): void {
    this.scenery.update(delta);
    this.rain.update(delta, WORLD_INITIAL_SPEED);
  }

  private setupUI(state?: SceneryState): void {
    this.scenery = new Scenery(this, 'menu', state);
    this.rain = new Rain(this, 'menu');
    this.recordsPanel = null;
    this._buildMenu();
  }

  private _buildMenu(): void {
    this.panel = new MenuPanel({
      scene: this,
      centerX: GAME_WIDTH / 2,
      centerY: GAME_HEIGHT / 2,
      widthTiles: MENU_CONFIG.panel.tiles,
    });
    this.panel.setDepth(MENU_CONFIG.panel.depth);

    this.title = createPanelTitle({
      scene: this,
      centerX: GAME_WIDTH / 2,
      panelTop: this._getPanelTop(),
      text: MENU_CONFIG.title,
      depth: MENU_CONFIG.panel.depth + 1,
    });

    this.menuButtons = createMenuButtons(
      {
        scene: this,
        centerX: GAME_WIDTH / 2,
        startY: MENU_CONFIG.buttons.startY,
      },
      this._getButtonConfigs()
    );
  }

  private _getButtonConfigs(): MenuButtonConfig[] {
    const { step, labels } = MENU_CONFIG.buttons;

    return [
      { text: labels.play, yOffset: 0, onClick: () => this.handlePlay() },
      { text: labels.sound, yOffset: step, onClick: () => this.handleSound() },
      { text: labels.records, yOffset: step * 2, onClick: () => this.handleRecords() },
    ];
  }

  private _getPanelTop(): number {
    return getPanelBounds({
      centerX: GAME_WIDTH / 2,
      centerY: GAME_HEIGHT / 2,
      widthTiles: MENU_CONFIG.panel.tiles,
      heightTiles: MENU_CONFIG.panel.tiles,
    }).top;
  }

  private _destroyMenu(): void {
    this.panel?.destroy();
    this.panel = null;
    this.title?.destroy();
    this.title = null;

    this.menuButtons.forEach(({ button, label }) => {
      button.destroy();
      label.destroy();
    });
    this.menuButtons = [];
  }

  private setupMusic(): void {
    this.sound.getAllPlaying().forEach((sound) => sound.stop());

    const existingMusic = this.sound.get(MENU_MUSIC_KEY);

    if (!existingMusic) {
      this.music = this.sound.add(MENU_MUSIC_KEY, {
        loop: true,
        volume: MUSIC_VOLUME,
      });
    } else {
      this.music = existingMusic;
    }

    if (this.music && !this.music.isPlaying) {
      this.music.play();
    }
  }

  private setupEvents(): void {
    if (this.scene.isActive(SCENE_KEYS.UI)) {
      this.scene.stop(SCENE_KEYS.UI);
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.sound.stopByKey(MENU_MUSIC_KEY);
    });
  }

  private handlePlay(): void {
    this.scene.start(SCENE_KEYS.GAME, {
      scenery: this.scenery.getState(),
    });
  }

  private handleSound(): void {
    this.sound.mute = toggleSoundMuted(this.sound.mute);
  }

  private handleRecords(): void {
    if (this.recordsPanel) return;

    this._destroyMenu();
    this.recordsPanel = new RecordsPanel(this, () => this.closeRecords());
  }

  private closeRecords(): void {
    if (!this.recordsPanel) return;

    this.recordsPanel.destroy();
    this.recordsPanel = null;
    this._buildMenu();
  }
}
