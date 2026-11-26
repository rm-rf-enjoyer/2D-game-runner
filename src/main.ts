import Phaser from 'phaser';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar } from '@capacitor/status-bar';
import { ScrollbarHider } from 'capacitor-scrollbar-hider';

import { createGameConfig } from './config/gameConfig.ts';
import { BootScene } from './scenes/BootScene.ts';
import { PreloadScene } from './scenes/PreloadScene.ts';
import { MenuScene } from './scenes/MenuScene.ts';
import { GameScene } from './scenes/game/GameScene.ts';
import { UIScene } from './scenes/UIScene.ts';
import { AppLifecycle } from './systems/AppLifecycle.ts';

declare global {
  interface Window {
    __game?: Phaser.Game;
  }
}

ScrollbarHider.hideScrollbars();

const game = new Phaser.Game(
  createGameConfig([BootScene, PreloadScene, MenuScene, GameScene, UIScene])
);

if (import.meta.env.DEV) {
  window.__game = game;
}

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
