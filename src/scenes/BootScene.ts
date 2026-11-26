import Phaser from 'phaser';
import { SCENE_KEYS } from '../config/sceneKeys.ts';
import { getSoundMuted } from '../utils/settings.ts';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.BOOT);
  }

  public create(): void {
    this.sound.mute = getSoundMuted();
    this.scene.start(SCENE_KEYS.PRELOAD);
  }
}
