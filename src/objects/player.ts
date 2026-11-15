import Phaser from 'phaser';
import {
  PLAYER_CONFIG,
  EXHAUST_PARTICLE_CONFIG,
  DASH_PARTICLE_CONFIG,
  DUST_PARTICLE_CONFIG,
  AFTERIMAGE_CONFIG,
  DeathCause
} from '../config/playerConfig';

export class Player {
  public sprite: Phaser.Physics.Arcade.Sprite;
  public isDead: boolean = false;
  
  private scene: Phaser.Scene;
  private baseX: number;
  private baseY: number;
  private groundSpeed: number;

  private isJumping: boolean = false;
  private justJumped: boolean = false;
  
  private isDashing: boolean = false;
  private dashStartedAt: number = -Infinity;

  private hoverState: number = 0;
  private hoverTimer: Phaser.Time.TimerEvent;
  private exhaust: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(scene: Phaser.Scene, x: number, y: number, groundSpeed: number = PLAYER_CONFIG.groundSpeed) {
    this.scene = scene;
    this.groundSpeed = groundSpeed;
    this.baseX = x;
    this.baseY = y;

    this.sprite = this.scene.physics.add.sprite(x, y, 'player');
    this.setupPhysics();
    this.exhaust = this.createExhaust();
    this.hoverTimer = this.setupHoverTimer();
  }

  public jump(): void {
    if (this.isJumping || this.isDashing || !this.isOnGround()) return;

    this.resetHoverAndPosition();
    this.sprite.setVelocityY(PLAYER_CONFIG.jumpVelocity);
    
    this.isJumping = true;
    this.justJumped = true;

    this.playSound('sfx-dash', { volume: 0.3, rate: 1.5 });
    this.sprite.setTexture('player-jump');
    this.sprite.play('jump-anim');
  }

  public dash(): void {
    if (this.isDashing || !this.canDash()) return;

    this.startDashMode();
    this.scene.events.emit('dash', PLAYER_CONFIG.dashDuration, PLAYER_CONFIG.dashSpeed);

    const trailTimer = this.createAfterimageTrail();

    this.scene.time.delayedCall(PLAYER_CONFIG.dashDuration, () => {
      this.endDashMode(trailTimer);
    });
  }

  public onLand(): void {
    if (!this.isJumping) return;
    
    this.isJumping = false;
    this.resetHoverAndPosition();
    
    this.sprite.anims.stop();
    this.sprite.setTexture('player');
    this.createDust();
  }

  public die(cause: DeathCause = 'pit'): void {
    if (this.isDead) return;
    this.isDead = true;

    this.hoverTimer?.remove();
    this.exhaust?.stop();
    this.sprite.body.enable = false; 

    this.sprite.play('death-anim');

    if (cause === 'pit' || cause === 'wall') {
      this.playDeathFallTween();
    }
  }

  public update(): void {
    if (this.isDashing) return;

    if (this.justJumped) {
      this.justJumped = false;
      return;
    }

    if (this.isOnGround() && this.isJumping) {
      this.onLand();
    }
  }

  // --- PRIVATE HELPER METHODS (Single Responsibility) ---

  private setupPhysics(): void {
    this.sprite.setScale(1);
    this.sprite.setDepth(5);
    this.sprite.body.setSize(PLAYER_CONFIG.bodySize.width, PLAYER_CONFIG.bodySize.height);
    this.sprite.body.setOffset(PLAYER_CONFIG.bodyOffset.x, PLAYER_CONFIG.bodyOffset.y);
    this.sprite.setMaxVelocity(PLAYER_CONFIG.maxVelocityX, PLAYER_CONFIG.maxVelocityY);
  }

  private isOnGround(): boolean {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    return body.blocked.down || body.touching.down;
  }

  private canDash(): boolean {
    return this.scene.time.now - this.dashStartedAt >= PLAYER_CONFIG.dashCooldown;
  }

  private resetHoverAndPosition(): void {
    this.sprite.x = this.baseX;
    this.sprite.y = Math.round(this.sprite.y);
    this.sprite.body.setOffset(PLAYER_CONFIG.bodyOffset.x, PLAYER_CONFIG.bodyOffset.y);
    this.hoverState = 0;
  }

  private playSound(key: string, config?: Phaser.Types.Sound.SoundConfig): void {
    this.scene.sound.play(key, config);
  }

  private setupHoverTimer(): Phaser.Time.TimerEvent {
    return this.scene.time.addEvent({
      delay: PLAYER_CONFIG.hoverDelay,
      loop: true,
      callback: () => {
        if (this.isJumping || this.isDashing || this.isDead) return;
        this.processHoverStep();
      }
    });
  }

  private processHoverStep(): void {
    switch (this.hoverState) {
      case 0: this.sprite.y -= 1; this.sprite.body.setOffset(5, 1); break;
      case 1: this.sprite.y += 1; this.sprite.body.setOffset(5, 0); break;
      case 2: this.sprite.x += 1; break;
      case 3: this.sprite.x -= 1; break;
      case 4: this.sprite.x -= 1; break;
      case 5: this.sprite.x += 1; break;
    }
    this.hoverState = (this.hoverState + 1) % 6;
  }

  private createExhaust(): Phaser.GameObjects.Particles.ParticleEmitter {
    return this.scene.add.particles(0, 0, 'pixel-particle', {
      ...EXHAUST_PARTICLE_CONFIG,
      follow: this.sprite,
      scale: 1,
      roundPixels: true
    }).setDepth(4);
  }

  private createDust(): void {
    const dust = this.scene.add.particles(this.sprite.x, this.sprite.y + 12, 'pixel-particle', {
      ...DUST_PARTICLE_CONFIG,
      emitting: false,
      roundPixels: true
    }).setDepth(4);
    
    dust.explode(DUST_PARTICLE_CONFIG.quantity);
    this.scene.time.delayedCall(500, () => dust.destroy());
  }

  private startDashMode(): void {
    this.isDashing = true;
    this.dashStartedAt = this.scene.time.now;
    
    this.playSound('sfx-dash', { volume: 1, rate: 1.0 });
    this.sprite.anims.stop();
    this.sprite.setTexture('player');

    if (this.isOnGround()) {
      this.sprite.y = Math.round(this.sprite.y);
    }
    
    this.resetHoverAndPosition();
    this.sprite.body.setAllowGravity(false);
    this.sprite.setVelocityY(0);

    this.exhaust.setConfig(DASH_PARTICLE_CONFIG);
  }

  private endDashMode(trailTimer: Phaser.Time.TimerEvent): void {
    this.isDashing = false;
    this.sprite.body.setAllowGravity(true);
    
    this.exhaust.setConfig(EXHAUST_PARTICLE_CONFIG);
    trailTimer.remove(); 

    if (this.isOnGround()) {
      this.isJumping = false;
    }
  }

  private createAfterimageTrail(): Phaser.Time.TimerEvent {
    return this.scene.time.addEvent({
      delay: AFTERIMAGE_CONFIG.delay,
      loop: true,
      callback: () => this.spawnAfterimage()
    });
  }

  private spawnAfterimage(): void {
    const ghost = this.scene.add.image(this.sprite.x, this.sprite.y, 'player');
    ghost.setTintFill(AFTERIMAGE_CONFIG.tint); 
    ghost.setDepth(4); 
    ghost.setFlipX(this.sprite.flipX);

    this.scene.tweens.add({
      targets: ghost,
      x: ghost.x + AFTERIMAGE_CONFIG.shiftX, 
      duration: AFTERIMAGE_CONFIG.lifespan,
      onComplete: () => ghost.destroy()
    });
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
