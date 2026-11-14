import Phaser from 'phaser';
import { gameConfig } from './config/gameConfig.js';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar } from '@capacitor/status-bar';
import { ScrollbarHider } from 'capacitor-scrollbar-hider';

ScrollbarHider.hideScrollbars();
console.log('MAIN start');

const game = new Phaser.Game(gameConfig);

if (Capacitor.isNativePlatform()) {
  StatusBar.hide();
}

let isEnginePaused = false;

function pauseGameEngine() {
  if (isEnginePaused) return;
  isEnginePaused = true;
  
  // Отправляем событие в игру, чтобы GameScene открыл паузу
  game.events.emit('app-paused');
  
  // Даем Phaser 1 кадр, чтобы отрисовать меню паузы, и только потом усыпляем
  setTimeout(() => {
    game.loop.sleep();      
    game.sound.pauseAll();  
    console.log('ENGINE: PAUSED');
  }, 50); 
}

function resumeGameEngine() {
  if (!isEnginePaused) return;
  isEnginePaused = false;
  
  game.loop.wake();       
  game.sound.resumeAll(); 
  console.log('ENGINE: RESUMED');
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
