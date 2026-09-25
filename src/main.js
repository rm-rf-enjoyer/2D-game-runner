import Phaser from 'phaser';
import { gameConfig } from './config/gameConfig.js';
import { StatusBar } from '@capacitor/status-bar';
import { ScrollbarHider } from 'capacitor-scrollbar-hider';
ScrollbarHider.hideScrollbars();


console.log('MAIN start');
console.log('MAIN scenes:', gameConfig.scene.map(s => s.name));

new Phaser.Game(gameConfig);
if (Capacitor.isNativePlatform()) {
  StatusBar.hide();
}
