import Phaser from 'phaser';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar } from '@capacitor/status-bar';
import { ScrollbarHider } from 'capacitor-scrollbar-hider';

import { gameConfig } from './config/gameConfig';
import { BootScene } from './scenes/bootScene';
import { PreloadScene } from './scenes/preloadScene';
import { MenuScene } from './scenes/menuScene';
import { GameScene } from './scenes/gameScene';
import { UIScene } from './scenes/UIScene';

ScrollbarHider.hideScrollbars();

// Регистрируем сцены здесь, а не в gameConfig
gameConfig.scene = [BootScene, PreloadScene, MenuScene, GameScene, UIScene];

const game = new Phaser.Game(gameConfig);

if (Capacitor.isNativePlatform()) {
  StatusBar.hide();
}

let isEnginePaused = false;

function pauseGameEngine() {
  if (isEnginePaused) return;
  isEnginePaused = true;
  game.events.emit('app-paused');
  setTimeout(() => {
    game.loop.sleep();      
    game.sound.pauseAll();  
  }, 50); 
}

function resumeGameEngine() {
  if (!isEnginePaused) return;
  isEnginePaused = false;
  game.loop.wake();       
  game.sound.resumeAll(); 
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) pauseGameEngine();
  else resumeGameEngine();
});

window.addEventListener('blur', pauseGameEngine);
window.addEventListener('focus', resumeGameEngine);

if (Capacitor.isNativePlatform()) {
  App.addListener('appStateChange', ({ isActive }) => {
    if (!isActive) pauseGameEngine();
    else resumeGameEngine();
  });
}
