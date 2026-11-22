import Phaser from 'phaser';
import { GAMEPLAY_CONFIG } from '../config/gameConfig';
import {
  PLAYER_CONFIG,
  DeathCause,
  DASH_TEXTURE_KEY,
  DASH_ANIM_KEY
} from '../config/playerConfig';
import { PlayerEffects } from './player/PlayerEffects';
import { PlayerHover } from './player/PlayerHover';
import { PlayerTrail } from './player/PlayerTrail';

const SPRITE_CONFIG = { scale: 1, depth: 5 };

export class Player {
  public sprite: Phaser.Physics.Arcade.Sprite;
  public isDead: boolean = false;

  private readonly scene: Phaser.Scene;
  private readonly baseX: number;
  private readonly baseY: number;

  private isJumping: boolean = false;
  private justJumped: boolean = false;
  private isDashing: boolean = false;
  private textureBeforeDash: string = 'player';

  private readonly effects: PlayerEffects;
  private readonly hover: PlayerHover;
  private readonly trail: PlayerTrail;

  constructor(scene: Phaser.Scene, x: number, y: number, speed: number) {
    this.scene = scene;
    this.baseX = x;
    this.baseY = y;

    this.sprite = this.scene.physics.add.sprite(x, y, 'player');
    this.setupPhysics();
    this.effects = new PlayerEffects(scene, this.sprite);
    this.hover = new PlayerHover(
      scene,
      this.sprite,
      () => !this.isJumping && !this.isDashing && !this.isDead
    );
    this.trail = new PlayerTrail(scene, this.sprite);
  }

  public jump(): void {
    if (this.isJumping || !this.isOnGround()) return;

    this.resetHoverAndPosition();
    this.sprite.setVelocityY(PLAYER_CONFIG.jumpVelocity);

    this.isJumping = true;
    this.justJumped = true;

    this.effects.playJumpSound();
    this.sprite.setTexture('player-jump');
    this.sprite.play('jump-anim');
  }

  public dash(): void {
    if (this.isDashing) return;

    this.isDashing = true;
    this.textureBeforeDash = this.sprite.texture.key;
    this.effects.playDashSound();
    this.effects.startDash();
    this.trail.start();
    this.sprite.play(DASH_ANIM_KEY);

    this.scene.time.delayedCall(PLAYER_CONFIG.dashDuration, () => {
      this.endDash();
    });
  }

  public onLand(): void {
    if (!this.isJumping) return;

    this.isJumping = false;
    this.resetHoverAndPosition();

    this.sprite.anims.stop();
    this.sprite.setTexture('player');
    this.effects.emitDust();
  }

  public die(cause: DeathCause = 'pit'): void {
    if (this.isDead) return;
    this.isDead = true;

    this.hover.stop();
    this.effects.stopExhaust();
    this.sprite.setVelocity(0, 0);
    this.sprite.body.enable = false;

    this.trail.clear();
    this.sprite.play('death-anim');

    if (cause === 'pit' || cause === 'wall') {
      this.playDeathFallTween();
    }
  }

  public update(delta: number): void {
    const worldSpeed = (this.scene as any).world?.speed
      || GAMEPLAY_CONFIG.worldSpeed;
    const seconds = delta / GAMEPLAY_CONFIG.msPerSecond;
    this.trail.update(worldSpeed * seconds);

    if (this.justJumped) {
      this.justJumped = false;
      return;
    }

    if (this.isOnGround() && this.isJumping) {
      this.onLand();
    }
  }

  private setupPhysics(): void {
    this.sprite.setScale(SPRITE_CONFIG.scale);
    this.sprite.setDepth(SPRITE_CONFIG.depth);
    this.sprite.setGravityY(PLAYER_CONFIG.gravityY);

    const { width, height } = PLAYER_CONFIG.bodySize;
    const { x, y } = PLAYER_CONFIG.bodyOffset;
    this.sprite.body.setSize(width, height);
    this.sprite.body.setOffset(x, y);
    this.sprite.setMaxVelocity(
      PLAYER_CONFIG.maxVelocityX,
      PLAYER_CONFIG.maxVelocityY
    );
  }

  private isOnGround(): boolean {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    return body.blocked.down || body.touching.down;
  }

  private resetHoverAndPosition(): void {
    this.sprite.x = this.baseX;
    this.sprite.y = Math.round(this.sprite.y);
    const { x, y } = PLAYER_CONFIG.bodyOffset;
    this.sprite.body.setOffset(x, y);
    this.hover.reset();
  }

  private endDash(): void {
    this.isDashing = false;
    this.effects.endDash();
    this.trail.stop();

    if (this.isDead || this.sprite.texture.key !== DASH_TEXTURE_KEY) return;
    this.sprite.anims.stop();
    this.sprite.setTexture(this.textureBeforeDash);
    if (this.isJumping) {
      this.sprite.play('jump-anim');
    }
  }

  private playDeathFallTween(): void {
    this.scene.tweens.add({
      targets: this.sprite,
      y: this.sprite.y + PLAYER_CONFIG.deathTween.yDistance,
      duration: PLAYER_CONFIG.deathTween.duration,
      ease: 'Linear'
    });
  }
}
