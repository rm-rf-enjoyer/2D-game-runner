import Phaser from 'phaser';

console.log('BOOT module loaded');

export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    console.log('BOOT create');
    this.scene.start('PreloadScene');
  }
}
