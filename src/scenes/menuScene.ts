import Phaser from 'phaser';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { ParallaxBackground } from '../objects/ParallaxBackground';
import { MenuPanel } from '../objects/MenuPanel';
import { GAME_WIDTH, GAME_HEIGHT, MUSIC_VOLUME } from '../config/gameConfig';
import { createMenuButton } from '../objects/buttonFactory';

const PANEL_TILES = 6;
const BTN_START_Y = 75;
const BTN_STEP = 40;
const MENU_MUSIC_KEY = 'music-menu';

interface MenuButtonConfig {
  text: string;
  yOffset: number;
  callback: () => void;
}

export class MenuScene extends Phaser.Scene {
  private bg!: ParallaxBackground;
  private panel!: MenuPanel;
  private music?: Phaser.Sound.BaseSound;

  constructor() {
    super('MenuScene');
  }

  public create(): void {
    this.setupUI();
    this.setupMusic();
    this.setupEvents();
  }

  public update(_time: number, delta: number): void {
    if (this.bg) {
      this.bg.update(delta);
    }
  }

  private setupUI(): void {
    this.bg = new ParallaxBackground(this);
    
    this.panel = new MenuPanel(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, PANEL_TILES);
    this.panel.setDepth(0);

    const buttonConfigs: MenuButtonConfig[] = [
      { text: 'PLAY', yOffset: 0, callback: () => this.handlePlay() },
      { text: 'RECORDS', yOffset: BTN_STEP, callback: () => this.handleRecords() },
      { text: 'SOUND', yOffset: BTN_STEP * 2, callback: () => this.handleSound() },
      { text: 'EXIT', yOffset: BTN_STEP * 3, callback: () => this.handleExit() }
    ];

    buttonConfigs.forEach(config => {
      createMenuButton(
        this,
        GAME_WIDTH / 2,
        BTN_START_Y + config.yOffset,
        config.text,
        config.callback
      );
    });
  }

  private setupMusic(): void {
    this.sound.getAllPlaying().forEach(sound => sound.stop());

    const existingMusic = this.sound.get(MENU_MUSIC_KEY);
    
    if (!existingMusic) {
      this.music = this.sound.add(MENU_MUSIC_KEY, { loop: true, volume: MUSIC_VOLUME });
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
    this.scene.start('GameScene');
  }

  private handleRecords(): void {
    console.log('Opening Global Leaderboard...');
  }

  private handleSound(): void {
    this.sound.mute = !this.sound.mute;
  }

  private handleExit(): void {
    if (Capacitor.isNativePlatform()) {
      App.exitApp();
    }
  }
}
