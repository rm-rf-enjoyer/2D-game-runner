import Phaser from 'phaser';
import { Scenery, SceneryState } from '../objects/Scenery.ts';
import { MenuPanel } from '../objects/MenuPanel.ts';
import { Rain } from '../objects/Rain.ts';
import { GAME_WIDTH, GAME_HEIGHT, MUSIC_VOLUME } from '../config/gameConfig.ts';
import { SCENE_KEYS } from '../config/sceneKeys.ts';
import { ASSET_KEYS } from '../config/assetKeys.ts';
import { WORLD_INITIAL_SPEED } from '../config/worldConfig.ts';
import { createMenuButtons, MenuButtonConfig } from '../objects/buttonFactory.ts';
import { toggleSoundMuted } from '../utils/settings.ts';

const PANEL_TILES = 6;
const BTN_START_Y = 95;
const BTN_STEP = 40;
const MENU_MUSIC_KEY = ASSET_KEYS.audio.menuMusic;

export class MenuScene extends Phaser.Scene {
  private scenery!: Scenery;
  private rain!: Rain;
  private panel!: MenuPanel;
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

    this.panel = new MenuPanel({
      scene: this,
      centerX: GAME_WIDTH / 2,
      centerY: GAME_HEIGHT / 2,
      widthTiles: PANEL_TILES,
    });
    this.panel.setDepth(5);

    const configs: MenuButtonConfig[] = [
      { text: 'PLAY', yOffset: 0, onClick: () => this.handlePlay() },
      {
        text: 'SOUND',
        yOffset: BTN_STEP,
        onClick: () => this.handleSound(),
      },
    ];

    createMenuButtons(
      {
        scene: this,
        centerX: GAME_WIDTH / 2,
        startY: BTN_START_Y,
      },
      configs
    );
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
}
