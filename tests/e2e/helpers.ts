import type { Page } from '@playwright/test';
import { SCENE_KEYS } from '../../src/config/sceneKeys.ts';
import { EVENT_KEYS } from '../../src/config/eventKeys.ts';

export const GAME_SCENE = SCENE_KEYS.GAME;
export const UI_SCENE = SCENE_KEYS.UI;
export const MENU_SCENE = SCENE_KEYS.MENU;

export interface DebugScene {
  children: { list: { type: string }[] };
  input: {
    _list: { type: string }[];
    listenerCount(event: string): number;
    keyboard?: { listenerCount(event: string): number };
  };
  player?: {
    isDead: boolean;
    isDashing: boolean;
    sprite: { y: number; texture: { key: string } };
  };
  score?: { text: string };
}

export interface SceneSnapshot {
  children: number;
  interactive: number;
  zones: number;
}

export interface ListenerSnapshot {
  appPaused: number;
  pointerDown: number;
  pointerUp: number;
  space: number;
  shift: number;
  activeUiScenes: number;
}

export async function settleFrames(page: Page, frames = 3): Promise<void> {
  await page.evaluate(
    (count) =>
      new Promise<void>((resolve) => {
        const tick = () => {
          if (count <= 1) {
            resolve();
            return;
          }

          count -= 1;
          requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
      }),
    frames
  );
}

export async function openGame(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForFunction(
    (key) => Boolean(window.__game && window.__game.scene.isActive(key)),
    MENU_SCENE
  );

  await page.evaluate(
    ([menuKey, gameKey]) => {
      const game = window.__game!;
      game.scene.stop(menuKey);
      game.scene.start(gameKey);
    },
    [MENU_SCENE, GAME_SCENE]
  );

  await page.waitForFunction(
    (key) => Boolean(window.__game && window.__game.scene.isActive(key)),
    GAME_SCENE
  );
  await settleFrames(page, 5);
}

export async function gamePoint(page: Page, x: number, y: number) {
  return page.evaluate(
    ([gameX, gameY]) => {
      const canvas = document.querySelector('canvas')!;
      const rect = canvas.getBoundingClientRect();
      const game = window.__game!;
      const width = game.scale.gameSize.width;
      const height = game.scale.gameSize.height;

      return {
        x: rect.left + (gameX / width) * rect.width,
        y: rect.top + (gameY / height) * rect.height,
      };
    },
    [x, y]
  );
}

export async function snapshotUiScene(page: Page): Promise<SceneSnapshot> {
  return page.evaluate((key) => {
    const scene = window.__game!.scene.getScene(key) as unknown as DebugScene;

    return {
      children: scene.children.list.length,
      interactive: scene.input._list.length,
      zones: scene.input._list.filter((item) => item.type === 'Zone').length,
    };
  }, UI_SCENE);
}

export async function snapshotGameListeners(page: Page): Promise<ListenerSnapshot> {
  return page.evaluate(
    ([sceneKey, uiKey, eventKey]) => {
      const game = window.__game!;
      const scene = game.scene.getScene(sceneKey) as unknown as DebugScene;

      return {
        appPaused: game.events.listenerCount(eventKey),
        pointerDown: scene.input.listenerCount('pointerdown'),
        pointerUp: scene.input.listenerCount('pointerup'),
        space: scene.input.keyboard?.listenerCount('keydown-SPACE') ?? 0,
        shift: scene.input.keyboard?.listenerCount('keydown-SHIFT') ?? 0,
        activeUiScenes: game.scene.getScenes(true).filter((item) => item.scene.key === uiKey)
          .length,
      };
    },
    [GAME_SCENE, UI_SCENE, EVENT_KEYS.appPaused]
  );
}
