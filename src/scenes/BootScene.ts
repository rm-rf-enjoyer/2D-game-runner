import Phaser from 'phaser';
import { getSoundMuted } from '../utils/settings';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  public create(): void {
    this.sound.mute = getSoundMuted();
    this.scene.start('PreloadScene');
  }
}
