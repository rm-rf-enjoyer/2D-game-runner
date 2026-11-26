import Phaser from 'phaser';
import { GAMEPLAY_CONFIG, GROUND_Y } from '../../config/gameConfig.ts';
import { SCENE_KEYS } from '../../config/sceneKeys.ts';
import { ASSET_KEYS } from '../../config/assetKeys.ts';
import { EVENT_KEYS } from '../../config/eventKeys.ts';
import { PLAYER_CONFIG, type DeathCause } from '../../config/playerConfig.ts';
import { getPaletteColor } from '../../config/palette.ts';
import { WorldManager } from '../../systems/WorldManager.ts';
import { SceneMusic } from '../../systems/SceneMusic.ts';
import { Rain } from '../../objects/Rain.ts';
import { Scenery, type SceneryState } from '../../objects/Scenery.ts';
import { Player } from '../../objects/Player.ts';
import { getBodyBounds } from '../../utils/common.ts';
import { rectToAabb } from '../../systems/CollisionRules.ts';
import type { AABB } from '../../systems/CollisionRules.ts';
import { Phase1 } from '../../phases/Phase1.ts';
import { Phase2 } from '../../phases/Phase2.ts';
import type { UIScene } from '../UIScene.ts';
import { DeathEffects } from './DeathEffects.ts';
import { InputRouter } from './InputRouter.ts';
import { ScoreTracker } from './ScoreTracker.ts';
import { DEATH_CONFIG, GAME_MUSIC } from './config.ts';

const BLOOD_COLORS = [getPaletteColor(6), getPaletteColor(5)];
const SCORE_TINT_COLOR = getPaletteColor(14);

export class GameScene extends Phaser.Scene {
  private isDead = false;
  private readonly playerBounds = new Phaser.Geom.Rectangle();
  private readonly playerAabb: AABB = { left: 0, top: 0, right: 0, bottom: 0 };

  private world!: WorldManager;
  private player!: Player;
  private scenery!: Scenery;
  private rain!: Rain;
  private score!: ScoreTracker;
  private inputRouter!: InputRouter;
  private deathEffects!: DeathEffects;

  private readonly music = new SceneMusic(GAME_MUSIC);

  constructor() {
    super(SCENE_KEYS.GAME);
  }

  public create(data: { scenery?: SceneryState } = {}): void {
    this.isDead = false;

    this._setupPlayer();
    this._createWorld();
    this._setupInput();
    this._setupScenery(data.scenery);
    this._setupRain();
    this._setupScore();
    this._setupDeathEffects();
    this._setupAudio();
    this._setupUI();
    this._setupEvents();
  }

  public update(_time: number, delta: number): void {
    const currentSpeed = this.world.speed;
    this.rain.update(delta, currentSpeed, this.world.isDashActive);

    if (this.isDead) return;

    this.world.update(delta);
    this.scenery.update(delta, this.world.speed);
    this.player.update(delta);

    this._handleCollisions();
    this._handlePitFall();

    if (this.isDead) return;

    this.score.update(currentSpeed, delta);
  }

  private _setupPlayer(): void {
    this.player = new Player({
      scene: this,
      x: GAMEPLAY_CONFIG.playerStartX,
      y: GROUND_Y - GAMEPLAY_CONFIG.playerYOffset,
      getWorldSpeed: () => this.world.speed,
    });
  }

  private _createWorld(): void {
    const physicsGroup = this.physics.add.staticGroup();
    const phase1 = new Phase1(this, GROUND_Y, physicsGroup);
    phase1.init();

    const phase2 = new Phase2(this, GROUND_Y, physicsGroup, {
      startX: phase1.nextX,
      onComplete: () => this._handleLevelComplete(),
    });
    phase2.init();

    this.world = new WorldManager([phase1, phase2]);
    this.physics.add.collider(this.player.sprite, physicsGroup);
  }

  private _setupInput(): void {
    this.inputRouter = new InputRouter(this, {
      onJumpPress: () => this.player.pressJump(),
      onJumpRelease: () => this.player.releaseJump(),
      onDash: () => {
        if (this.world.triggerDash(this.time.now)) {
          this.player.dash();
        }
      },
    });
    this.inputRouter.enable();
  }

  private _setupScenery(state?: SceneryState): void {
    this.scenery = new Scenery(this, 'game', state);
  }

  private _setupRain(): void {
    this.rain = new Rain(this, 'game');
  }

  private _setupScore(): void {
    const score = GAMEPLAY_CONFIG.score;
    const label = this.add
      .bitmapText(score.x, score.y, ASSET_KEYS.texture.font, score.initialText, score.fontSize)
      .setScale(score.scale)
      .setTint(SCORE_TINT_COLOR)
      .setDepth(score.depth);

    this.score = new ScoreTracker(label);
  }

  private _setupDeathEffects(): void {
    this.deathEffects = new DeathEffects(this, BLOOD_COLORS);
  }

  private _setupAudio(): void {
    this.music.start(this.sound);
  }

  private _setupUI(): void {
    this.scene.launch(SCENE_KEYS.UI);
  }

  private _setupEvents(): void {
    this.game.events.on(EVENT_KEYS.appPaused, this._onAppPaused, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(EVENT_KEYS.appPaused, this._onAppPaused, this);
      this.inputRouter.disable();
      this.music.stop();
    });
  }

  private _handleCollisions(): void {
    const playerBody = this.player.sprite.body as Phaser.Physics.Arcade.Body;
    const bounds = getBodyBounds(playerBody, this.playerBounds);
    const cause = this.world.getWallCollisionCause(rectToAabb(bounds, this.playerAabb));
    if (!cause) return;

    this._onHit(cause);
  }

  private _handlePitFall(): void {
    const playerHalfHeight = PLAYER_CONFIG.bodySize.height / 2;
    const playerBottomY = this.player.sprite.y + playerHalfHeight;

    if (playerBottomY > GROUND_Y + GAMEPLAY_CONFIG.pitFallTolerance) {
      this._onHit('pit');
    }
  }

  private _handleLevelComplete(): void {
    if (this.isDead) return;
    this._goToMenu();
  }

  private _onHit(cause: DeathCause): void {
    if (this.isDead) return;
    this.isDead = true;

    this._stopGameplay();
    this.player.die(cause);
    this.score.render();
    this.deathEffects.play(cause, this.player.sprite.x, this.player.sprite.y);

    this.time.delayedCall(DEATH_CONFIG.restartDelay, () => this._goToMenu());
  }

  private _stopGameplay(): void {
    this.sound.play(ASSET_KEYS.audio.death, { volume: DEATH_CONFIG.soundVolume });
    this.inputRouter.disable();
    this.music.stop();
  }

  private _goToMenu(): void {
    this.scene.stop(SCENE_KEYS.UI);
    this.scene.start(SCENE_KEYS.MENU, { scenery: this.scenery.getState() });
  }

  private _onAppPaused(): void {
    if (this.isDead) return;
    if (!this.scene.isActive(SCENE_KEYS.GAME)) return;

    this.scene.pause(SCENE_KEYS.GAME);
    const uiScene = this.scene.get(SCENE_KEYS.UI) as UIScene | null;
    uiScene?.openPause();
  }
}
