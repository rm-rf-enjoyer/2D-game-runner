import { expect, test } from '@playwright/test';
import { ASSET_KEYS } from '../../src/config/assetKeys.ts';
import { EVENT_KEYS } from '../../src/config/eventKeys.ts';
import {
  GAME_SCENE,
  MENU_SCENE,
  UI_SCENE,
  findPanel,
  findText,
  findTexture,
  flattenDisplay,
  gamePoint,
  openGame,
  openMenu,
  settleFrames,
  snapshotDisplay,
  snapshotGameListeners,
  snapshotUiScene,
} from './helpers.ts';

test('preload registers textures, audio and animations', async ({ page }) => {
  await openGame(page);

  const textures = ASSET_KEYS.texture;
  const animations = ASSET_KEYS.animation;
  const missing = await page.evaluate(
    (keys) => {
      const game = window.__game!;

      return {
        textures: keys.textures.filter((key) => !game.textures.exists(key)),
        audio: keys.audio.filter((key) => !game.cache.audio.exists(key)),
        animations: keys.animations.filter((key) => !game.anims.exists(key)),
      };
    },
    {
      textures: [
        textures.player,
        textures.playerJump,
        textures.playerDeath,
        textures.playerDash,
        textures.button('normal', 'left'),
        textures.button('pressed', 'left'),
        textures.font,
        textures.background1,
        textures.pipeTiles,
        textures.fan,
      ],
      audio: Object.values(ASSET_KEYS.audio),
      animations: Object.values(animations),
    }
  );

  expect(missing).toEqual({ textures: [], audio: [], animations: [] });
});

test('pause menu closes without leaving interactive zones', async ({ page }) => {
  await openGame(page);

  const before = await snapshotUiScene(page);

  await page.evaluate((key) => {
    const scene = window.__game!.scene.getScene(key) as unknown as { openPause(): void };
    scene.openPause();
  }, UI_SCENE);
  await settleFrames(page);

  const opened = await snapshotUiScene(page);
  expect(opened.zones).toBeGreaterThan(before.zones);

  const point = await gamePoint(page, 240, 95);
  await page.mouse.click(point.x, point.y);
  await settleFrames(page);

  expect(await snapshotUiScene(page)).toEqual(before);
  expect(await page.evaluate((key) => window.__game!.scene.isPaused(key), GAME_SCENE)).toBe(false);
});

test('restarting game scene does not duplicate listeners or UI scenes', async ({ page }) => {
  await openGame(page);

  const before = await snapshotGameListeners(page);

  await page.evaluate((key) => {
    const game = window.__game!;
    game.scene.stop(key);
    game.scene.start(key);
  }, GAME_SCENE);
  await settleFrames(page, 5);

  expect(await snapshotGameListeners(page)).toEqual(before);
});

test('pointer halves route to jump and dash', async ({ page }) => {
  await openGame(page);
  await page.waitForTimeout(250);

  const jumpPoint = await gamePoint(page, 40, 150);
  await page.mouse.click(jumpPoint.x, jumpPoint.y);

  const afterJump = findTexture(
    await snapshotDisplay(page, GAME_SCENE),
    ASSET_KEYS.texture.playerJump
  );
  expect(afterJump?.textureKey).toBe(ASSET_KEYS.texture.playerJump);

  const dashPoint = await gamePoint(page, 420, 150);
  await page.mouse.click(dashPoint.x, dashPoint.y);

  const afterDash = findTexture(
    await snapshotDisplay(page, GAME_SCENE),
    ASSET_KEYS.texture.playerDash
  );
  expect(afterDash?.textureKey).toBe(ASSET_KEYS.texture.playerDash);
});

test('falling into the pit opens the save dialog and freezes the score', async ({ page }) => {
  await openGame(page);
  await page.waitForTimeout(200);

  const before = await snapshotUiScene(page);

  await page.evaluate(
    ([key, playerKey]) => {
      const scene = window.__game!.scene.getScene(key) as unknown as {
        children: { list: Array<{ texture?: { key: string }; y: number }> };
      };
      const sprite = scene.children.list.find((item) => item.texture?.key === playerKey);
      if (sprite) sprite.y = 1000;
    },
    [GAME_SCENE, ASSET_KEYS.texture.player]
  );

  await page.waitForFunction(
    ([key, expected]) => {
      const scene = window.__game!.scene.getScene(key as string) as unknown as {
        input: { _list: { type: string }[] };
      };
      return scene.input._list.filter((item) => item.type === 'Zone').length === Number(expected);
    },
    [UI_SCENE, before.zones + 3]
  );
  await settleFrames(page);

  const opened = await snapshotUiScene(page);
  expect(opened.zones).toBe(before.zones + 3);

  const uiNodes = flattenDisplay(await snapshotDisplay(page, UI_SCENE));
  const caret = uiNodes.find((node) => node.width === 14 && node.height === 2);
  const label = uiNodes.find((node) => node.type === 'BitmapText' && node.y === 97);
  expect(caret).toMatchObject({ width: 14, height: 2, y: 97 + 12 });
  expect(label).toMatchObject({ fontSize: 14, y: 97 });

  await expect
    .poll(async () => {
      const nodes = flattenDisplay(await snapshotDisplay(page, UI_SCENE));
      return nodes.find((node) => node.width === 14 && node.height === 2)?.visible;
    })
    .not.toBe(caret?.visible);

  expect(
    findTexture(await snapshotDisplay(page, UI_SCENE), ASSET_KEYS.texture.pauseButton)?.visible
  ).toBe(false);
  const score = async () =>
    flattenDisplay(await snapshotDisplay(page, GAME_SCENE)).find(
      (node) => node.type === 'BitmapText' && node.text?.endsWith(' m')
    )?.text;
  const initialScore = await score();
  await page.waitForTimeout(300);
  expect(await score()).toBe(initialScore);
  expect(await page.evaluate((key) => window.__game!.scene.isActive(key), GAME_SCENE)).toBe(true);

  const menuPoint = await gamePoint(page, 304, 135);
  await page.mouse.click(menuPoint.x, menuPoint.y);
  await page.waitForFunction((key) => window.__game!.scene.isActive(key), MENU_SCENE);
  expect(await page.evaluate((key) => window.__game!.scene.isActive(key), GAME_SCENE)).toBe(false);
});

test('save button stores the result with the entered name', async ({ page }) => {
  await openGame(page);
  await page.waitForTimeout(200);

  await page.evaluate(
    ([key, playerKey]) => {
      const scene = window.__game!.scene.getScene(key) as unknown as {
        children: { list: Array<{ texture?: { key: string }; y: number }> };
      };
      const sprite = scene.children.list.find((item) => item.texture?.key === playerKey);
      if (sprite) sprite.y = 1000;
    },
    [GAME_SCENE, ASSET_KEYS.texture.player]
  );

  await page.waitForFunction((key) => {
    const scene = window.__game!.scene.getScene(key) as unknown as {
      input: { _list: { type: string }[] };
    };
    return scene.input._list.filter((item) => item.type === 'Zone').length === 3;
  }, UI_SCENE);

  const score = flattenDisplay(await snapshotDisplay(page, GAME_SCENE)).find(
    (node) => node.type === 'BitmapText' && node.text?.endsWith(' m')
  )?.text;

  await page.keyboard.type('Hero');
  await page.keyboard.press('Backspace');
  await page.keyboard.type('o');

  const uiNodes = flattenDisplay(await snapshotDisplay(page, UI_SCENE));
  const nameLabel = uiNodes.find((node) => node.type === 'BitmapText' && node.y === 97);
  const caretX = uiNodes.find((node) => node.width === 14 && node.height === 2)?.x;
  expect(nameLabel?.text).toBe('hero');
  expect(nameLabel?.width).toBe(56);
  expect(caretX).toBe((nameLabel?.x ?? 0) + (nameLabel?.width ?? 0));

  const savePoint = await gamePoint(page, 176, 135);
  await page.mouse.click(savePoint.x, savePoint.y);
  await page.waitForFunction((key) => window.__game!.scene.isActive(key), MENU_SCENE);

  const results = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('runGame:records.v1')!)
  );
  expect(results).toHaveLength(1);
  expect(results[0].name).toBe('Hero');
  expect(results[0].scoreMeters).toBe(Number.parseInt(score ?? '', 10));
  expect(results[0].savedAt).toBeTruthy();
  expect(results[0].syncedAt).toBeNull();
});

test('menu and pause panels show centered titles', async ({ page }) => {
  await openMenu(page);

  const menuNodes = await snapshotDisplay(page, MENU_SCENE);
  const menuTitle = findText(menuNodes, 'menu');
  expect(menuTitle).toMatchObject({
    text: 'menu',
    x: 240,
    y: 49,
    fontSize: 14,
    originX: 0.5,
    depth: 6,
  });
  expect(findPanel(menuNodes, 36)?.depth).toBe(5);

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

  await page.evaluate((key) => {
    const scene = window.__game!.scene.getScene(key) as unknown as { openPause(): void };
    scene.openPause();
  }, UI_SCENE);
  await settleFrames(page);

  const pauseTitle = findText(await snapshotDisplay(page, UI_SCENE), 'pause');
  expect(pauseTitle).toMatchObject({
    text: 'pause',
    x: 240,
    y: 49,
    fontSize: 14,
    originX: 0.5,
  });
});

test('records panel switches between device and global results', async ({ page }) => {
  await page.route('**/v1/records/**', (route) => {
    if (route.request().url().includes('/batch')) {
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ acceptedIds: [], duplicates: [] }),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        records: [
          {
            id: '99999999-9999-4999-8999-999999999999',
            name: 'server',
            scoreMeters: 99,
            savedAt: '2026-01-03T00:00:00.000Z',
          },
        ],
      }),
    });
  });

  await openMenu(page);

  await page.evaluate(() => {
    localStorage.setItem(
      'runGame:results',
      JSON.stringify([
        { name: 'ABCDEFGHIJKLMNOP', score: '20 m', savedAt: '2026-01-01T00:00:00.000Z' },
        { name: 'BEST', score: '30 m', savedAt: '2026-01-02T00:00:00.000Z' },
      ])
    );
  });
  await page.evaluate((key) => {
    const game = window.__game!;
    game.scene.stop(key);
    game.scene.start(key);
  }, MENU_SCENE);
  await settleFrames(page, 5);

  const recordsPoint = await gamePoint(page, 240, 175);
  await page.mouse.click(recordsPoint.x, recordsPoint.y);
  await settleFrames(page);

  const openedNodes = await snapshotDisplay(page, MENU_SCENE);
  const openedFlat = flattenDisplay(openedNodes);
  const recordsContainer = openedNodes.find((node) =>
    node.children?.some((child) => child.children?.length === 112)
  );
  const recordsPanel = findPanel(openedNodes, 112);
  const labels = openedFlat
    .filter((node) => node.type === 'BitmapText')
    .map((node) => node.text)
    .filter((text): text is string => typeof text === 'string');

  expect(findPanel(openedNodes, 36)).toBeUndefined();
  expect(recordsContainer?.visible).toBe(true);
  expect(recordsPanel?.children).toHaveLength(112);
  expect(labels).toEqual(expect.arrayContaining(['DEVICE', 'GLOBAL', 'BACK']));

  const panelChildIndex = recordsContainer?.children?.findIndex(
    (child) => child.children?.length === 112
  );
  const backLabelIndex = recordsContainer?.children?.findIndex((child) => child.text === 'BACK');
  expect(panelChildIndex).toBeGreaterThanOrEqual(0);
  expect(backLabelIndex).toBeGreaterThan(panelChildIndex!);
  expect(findText(openedNodes, 'records')).toBeDefined();
  expect(openedFlat.find((node) => node.text === '1.best\n2.abcdefghijklmnop')).toBeDefined();
  expect(openedFlat.find((node) => node.text === '30m\n20m')).toBeDefined();

  const globalPoint = await gamePoint(page, 240, 240);
  await page.mouse.click(globalPoint.x, globalPoint.y);
  await settleFrames(page, 5);

  const globalNodes = await snapshotDisplay(page, MENU_SCENE);
  const globalFlat = flattenDisplay(globalNodes);
  expect(findText(globalNodes, 'global')).toBeDefined();
  expect(globalFlat.find((node) => node.text === '1.server')).toBeDefined();
  expect(globalFlat.find((node) => node.text === '99m')).toBeDefined();

  const devicePoint = await gamePoint(page, 140, 240);
  await page.mouse.click(devicePoint.x, devicePoint.y);
  await settleFrames(page, 5);

  const deviceNodes = await snapshotDisplay(page, MENU_SCENE);
  expect(findText(deviceNodes, 'records')).toBeDefined();
  expect(
    flattenDisplay(deviceNodes).find((node) => node.text === '1.best\n2.abcdefghijklmnop')
  ).toBeDefined();

  const backPoint = await gamePoint(page, 340, 240);
  await page.mouse.click(backPoint.x, backPoint.y);
  await settleFrames(page, 5);

  const closedNodes = await snapshotDisplay(page, MENU_SCENE);
  expect(findPanel(closedNodes, 36)).toBeDefined();
  expect(findPanel(closedNodes, 112)).toBeUndefined();
});

test('app pause pauses the active game and opens the pause menu once', async ({ page }) => {
  await openGame(page);

  await page.evaluate((key) => window.__game!.events.emit(key), EVENT_KEYS.appPaused);
  await settleFrames(page);

  expect(await page.evaluate((key) => window.__game!.scene.isPaused(key), GAME_SCENE)).toBe(true);

  const opened = await snapshotUiScene(page);
  expect(opened.zones).toBe(3);

  await page.evaluate((key) => window.__game!.events.emit(key), EVENT_KEYS.appPaused);
  await settleFrames(page);
  expect(await snapshotUiScene(page)).toEqual(opened);

  await page.evaluate((key) => {
    const scene = window.__game!.scene.getScene(key) as unknown as { closePause(): void };
    scene.closePause();
  }, UI_SCENE);
  await settleFrames(page);
  expect(await page.evaluate((key) => window.__game!.scene.isPaused(key), GAME_SCENE)).toBe(false);
});
