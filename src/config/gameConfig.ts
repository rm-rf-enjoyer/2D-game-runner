import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './gameConstants.ts';

export {
  GAME_HEIGHT,
  GAME_WIDTH,
  GAMEPLAY_CONFIG,
  GROUND_Y,
  MUSIC_VOLUME,
} from './gameConstants.ts';

const GAME_GRAVITY_Y = 1000;

export function createGameConfig(
  scenes: Phaser.Types.Scenes.SceneType[]
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: '#000000',
    pixelArt: true,
    antialias: false,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.HEIGHT_CONTROLS_WIDTH,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
    },
    scene: scenes,
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: GAME_GRAVITY_Y },
        debug: false,
      },
    },
  };
}
