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
}

export interface DisplayNode {
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  visible?: boolean;
  depth?: number;
  originX?: number;
  text?: string;
  fontSize?: number;
  lineSpacing?: number;
  textureKey?: string;
  children?: DisplayNode[];
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

export async function openMenu(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForFunction(
    (key) => Boolean(window.__game && window.__game.scene.isActive(key)),
    MENU_SCENE
  );
  await settleFrames(page, 5);
}

export async function openGame(page: Page): Promise<void> {
  await openMenu(page);

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

export async function snapshotDisplay(page: Page, sceneKey: string): Promise<DisplayNode[]> {
  return page.evaluate((key) => {
    const describe = (value: unknown): DisplayNode => {
      const obj = value as Record<string, unknown>;
      const node: DisplayNode = {
        type: typeof obj.type === 'string' ? obj.type : '',
        x: typeof obj.x === 'number' ? obj.x : 0,
        y: typeof obj.y === 'number' ? obj.y : 0,
      };

      if (typeof obj.width === 'number') node.width = obj.width;
      if (typeof obj.height === 'number') node.height = obj.height;
      if (typeof obj.visible === 'boolean') node.visible = obj.visible;
      if (typeof obj.depth === 'number') node.depth = obj.depth;
      if (typeof obj.originX === 'number') node.originX = obj.originX;
      if (typeof obj.text === 'string') node.text = obj.text;
      if (typeof obj._fontSize === 'number') node.fontSize = obj._fontSize;
      if (typeof obj.lineSpacing === 'number') node.lineSpacing = obj.lineSpacing;

      const texture = obj.texture as Record<string, unknown> | undefined;
      if (texture && typeof texture.key === 'string') node.textureKey = texture.key;
      if (Array.isArray(obj.list)) node.children = obj.list.map((child) => describe(child));

      return node;
    };

    const scene = window.__game!.scene.getScene(key) as unknown as DebugScene;
    return scene.children.list.map((item) => describe(item));
  }, sceneKey);
}

export function flattenDisplay(nodes: DisplayNode[]): DisplayNode[] {
  return nodes.flatMap((node) => [node, ...flattenDisplay(node.children ?? [])]);
}

export function findText(nodes: DisplayNode[], text: string): DisplayNode | undefined {
  return flattenDisplay(nodes).find((node) => node.text === text);
}

export function findTexture(nodes: DisplayNode[], textureKey: string): DisplayNode | undefined {
  return flattenDisplay(nodes).find((node) => node.textureKey === textureKey);
}

export function findPanel(nodes: DisplayNode[], tileCount: number): DisplayNode | undefined {
  return flattenDisplay(nodes).find((node) => node.children?.length === tileCount);
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
