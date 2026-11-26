import Phaser from 'phaser';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar } from '@capacitor/status-bar';
import { ScrollbarHider } from 'capacitor-scrollbar-hider';

import { createGameConfig } from './config/gameConfig';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';
import { AppLifecycle } from './systems/AppLifecycle';

ScrollbarHider.hideScrollbars();

const game = new Phaser.Game(
  createGameConfig([BootScene, PreloadScene, MenuScene, GameScene, UIScene])
);

if (Capacitor.isNativePlatform()) {
  StatusBar.hide();
}

const lifecycle = new AppLifecycle(game);

document.addEventListener('visibilitychange', () => {
  if (document.hidden) lifecycle.pause('visibility');
  else lifecycle.resume('visibility');
});

window.addEventListener('blur', () => lifecycle.pause('focus'));
window.addEventListener('focus', () => lifecycle.resume('focus'));

if (Capacitor.isNativePlatform()) {
  App.addListener('appStateChange', ({ isActive }) => {
    if (isActive) lifecycle.resume('native');
    else lifecycle.pause('native');
  });
}
