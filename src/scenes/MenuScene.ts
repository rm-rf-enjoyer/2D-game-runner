import Phaser from 'phaser';
import { Scenery, SceneryState } from '../objects/Scenery';
import { MenuPanel } from '../objects/MenuPanel';
import { Rain } from '../objects/Rain';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  GAMEPLAY_CONFIG,
  MUSIC_VOLUME
} from '../config/gameConfig';
import {
  createMenuButtons,
  MenuButtonConfig
} from '../objects/buttonFactory';
import { toggleSoundMuted } from '../utils/settings';

const PANEL_TILES = 6;
const BTN_START_Y = 95;
const BTN_STEP = 40;
const MENU_MUSIC_KEY = 'music-menu';

export class MenuScene extends Phaser.Scene {
  private scenery!: Scenery;
  private rain!: Rain;
  private panel!: MenuPanel;
  private music?: Phaser.Sound.BaseSound;

  constructor() {
    super('MenuScene');
  }

  public create(data: { scenery?: SceneryState } = {}): void {
    this.setupUI(data.scenery);
    this.setupMusic();
    this.setupEvents();
  }

  public update(_time: number, delta: number): void {
    this.scenery.update(delta);
    this.rain.update(delta, GAMEPLAY_CONFIG.worldSpeed);
  }

  private setupUI(state?: SceneryState): void {
    this.scenery = new Scenery(this, 'menu', state);
    this.rain = new Rain(this, 'menu');

    this.panel = new MenuPanel({
      scene: this,
      centerX: GAME_WIDTH / 2,
      centerY: GAME_HEIGHT / 2,
      widthTiles: PANEL_TILES
    });
    this.panel.setDepth(5);

    const configs: MenuButtonConfig[] = [
      { text: 'PLAY', yOffset: 0, onClick: () => this.handlePlay() },
      {
        text: 'RECORDS',
        yOffset: BTN_STEP,
        onClick: () => this.handleRecords()
      },
      {
        text: 'SOUND',
        yOffset: BTN_STEP * 2,
        onClick: () => this.handleSound()
      }
    ];

    createMenuButtons({
      scene: this,
      centerX: GAME_WIDTH / 2,
      startY: BTN_START_Y
    }, configs);
  }

  private setupMusic(): void {
    this.sound.getAllPlaying().forEach(sound => sound.stop());

    const existingMusic = this.sound.get(MENU_MUSIC_KEY);

    if (!existingMusic) {
      this.music = this.sound.add(MENU_MUSIC_KEY, {
        loop: true,
        volume: MUSIC_VOLUME
      });
    } else {
      this.music = existingMusic;
    }

    if (this.music && !this.music.isPlaying) {
      this.music.play();
    }
  }

  private setupEvents(): void {
    if (this.scene.isActive('UIScene')) {
      this.scene.stop('UIScene');
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.sound.stopByKey(MENU_MUSIC_KEY);
    });
  }

  private handlePlay(): void {
    this.scene.start('GameScene', {
      scenery: this.scenery.getState()
    });
  }

  private handleRecords(): void {
    console.log('Opening Global Leaderboard...');
  }

  private handleSound(): void {
    this.sound.mute = toggleSoundMuted(this.sound.mute);
  }


}
