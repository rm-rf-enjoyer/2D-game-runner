import { expect, test } from '@playwright/test';
import { ASSET_KEYS } from '../../src/config/assetKeys.ts';
import { EVENT_KEYS } from '../../src/config/eventKeys.ts';
import {
  GAME_SCENE,
  MENU_SCENE,
  UI_SCENE,
  gamePoint,
  openGame,
  settleFrames,
  snapshotGameListeners,
  snapshotUiScene,
  type DebugScene,
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

  const point = await gamePoint(page, 240, 75);
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

  const afterJump = await page.evaluate((key) => {
    const scene = window.__game!.scene.getScene(key) as unknown as DebugScene;
    return { texture: scene.player!.sprite.texture.key, dashing: scene.player!.isDashing };
  }, GAME_SCENE);
  expect(afterJump).toEqual({ texture: ASSET_KEYS.texture.playerJump, dashing: false });

  const dashPoint = await gamePoint(page, 420, 150);
  await page.mouse.click(dashPoint.x, dashPoint.y);

  const afterDash = await page.evaluate((key) => {
    const scene = window.__game!.scene.getScene(key) as unknown as DebugScene;
    return scene.player!.isDashing;
  }, GAME_SCENE);
  expect(afterDash).toBe(true);
});

test('falling into the pit ends the run and returns to menu', async ({ page }) => {
  await openGame(page);
  await page.waitForTimeout(200);

  const score = await page.evaluate((key) => {
    const scene = window.__game!.scene.getScene(key) as unknown as DebugScene;
    return scene.score!.text;
  }, GAME_SCENE);

  await page.evaluate((key) => {
    const scene = window.__game!.scene.getScene(key) as unknown as DebugScene;
    scene.player!.sprite.y = 1000;
  }, GAME_SCENE);

  await page.waitForFunction((key) => {
    const scene = window.__game!.scene.getScene(key) as unknown as DebugScene;
    return scene.player?.isDead === true;
  }, GAME_SCENE);

  await page.waitForTimeout(300);
  expect(
    await page.evaluate((key) => {
      const scene = window.__game!.scene.getScene(key) as unknown as DebugScene;
      return scene.score!.text;
    }, GAME_SCENE)
  ).toBe(score);

  await page.waitForFunction((key) => window.__game!.scene.isActive(key), MENU_SCENE, {
    timeout: 5000,
  });
  expect(await page.evaluate((key) => window.__game!.scene.isActive(key), GAME_SCENE)).toBe(false);
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
