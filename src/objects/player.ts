import Phaser from 'phaser';
import {
  PLAYER_CONFIG,
  EXHAUST_PARTICLE_CONFIG,
  DASH_PARTICLE_CONFIG,
  DUST_PARTICLE_CONFIG,
  DeathCause
} from '../config/playerConfig';

interface TrailPoint {
  x: number;
  y: number;
}

export class Player {
  private static readonly MOTOR_OFFSET_X = -8;
  private static readonly MOTOR_OFFSET_Y = 8;
  private static readonly MAX_TRAIL_POINTS = 40;
  private static readonly TRAIL_COLOR = 0x4FE8F4;
  private static readonly MIN_TRAIL_X = -150;
  private static readonly TRAIL_DELAY = 15;

  public sprite: Phaser.Physics.Arcade.Sprite;
  public isDead: boolean = false;
  
  private scene: Phaser.Scene;
  private baseX: number;
  private baseY: number;
  private isJumping: boolean = false;
  private justJumped: boolean = false;
  private isDashing: boolean = false;

  private hoverState: number = 0;
  private hoverTimer: Phaser.Time.TimerEvent;
  private exhaust: Phaser.GameObjects.Particles.ParticleEmitter;
  
  private trailPoints: TrailPoint[] = [];
  private trailGraphics?: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number, speed: number) {
    this.scene = scene;
    this.baseX = x;
    this.baseY = y;

    this.sprite = this.scene.physics.add.sprite(x, y, 'player');
    this.setupPhysics();
    this.exhaust = this.createExhaust();
    this.hoverTimer = this.setupHoverTimer();
    this.trailGraphics = this.scene.add.graphics().setDepth(7);
  }

  public jump(): void {
    if (this.isJumping || !this.isOnGround()) return;

    this.resetHoverAndPosition();
    this.sprite.setVelocityY(PLAYER_CONFIG.jumpVelocity);
    
    this.isJumping = true;
    this.justJumped = true;

    this.scene.sound.play('sfx-dash', { volume: 0.3, rate: 1.5 });
    this.sprite.setTexture('player-jump');
    this.sprite.play('jump-anim');
  }

  public dash(): void {
    if (this.isDashing) return;

    this.isDashing = true;
    this.scene.sound.play('sfx-dash', { volume: 1, rate: 1.0 });
    this.exhaust.setConfig(DASH_PARTICLE_CONFIG);

    const timer = this.createTrailTimer();
    this.scene.time.delayedCall(PLAYER_CONFIG.dashDuration, () => {
      this.endDash(timer);
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
    
    this.clearTrail();
    this.sprite.play('death-anim');

    if (cause === 'pit' || cause === 'wall') {
      this.playDeathFallTween();
    }
  }

  public update(delta: number): void {
    const worldSpeed = (this.scene as any).world?.speed || 130;
    this.updateTrail(worldSpeed * (delta / 1000));
    this.renderTrail();

    if (this.justJumped) {
      this.justJumped = false;
      return;
    }

    if (this.isOnGround() && this.isJumping) {
      this.onLand();
    }
  }

  private setupPhysics(): void {
    this.sprite.setScale(1);
    this.sprite.setDepth(5);
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
    this.hoverState = 0;
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
    const steps = [
      () => { this.sprite.y -= 1; this.sprite.body.setOffset(5, 1); },
      () => { this.sprite.y += 1; this.sprite.body.setOffset(5, 0); },
      () => { this.sprite.x += 1; },
      () => { this.sprite.x -= 1; },
      () => { this.sprite.x -= 1; },
      () => { this.sprite.x += 1; }
    ];
    steps[this.hoverState]();
    this.hoverState = (this.hoverState + 1) % steps.length;
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
    const dust = this.scene.add.particles(
      this.sprite.x, 
      this.sprite.y + 12, 
      'pixel-particle', 
      { ...DUST_PARTICLE_CONFIG, emitting: false, roundPixels: true }
    ).setDepth(4);
    
    dust.explode(DUST_PARTICLE_CONFIG.quantity);
    this.scene.time.delayedCall(500, () => dust.destroy());
  }

  private endDash(timer: Phaser.Time.TimerEvent): void {
    this.isDashing = false;
    this.exhaust.setConfig(EXHAUST_PARTICLE_CONFIG);
    timer.remove(); 
    this.clearTrail();
  }

  private createTrailTimer(): Phaser.Time.TimerEvent {
    return this.scene.time.addEvent({
      delay: Player.TRAIL_DELAY,
      loop: true,
      callback: () => this.spawnTrailPoint()
    });
  }

  private spawnTrailPoint(): void {
    const x = this.sprite.x + Player.MOTOR_OFFSET_X;
    const y = this.sprite.y + Player.MOTOR_OFFSET_Y;

    this.trailPoints.unshift({ x, y });
    if (this.trailPoints.length > Player.MAX_TRAIL_POINTS) {
      this.trailPoints.pop();
    }
  }

  private updateTrail(deltaMove: number): void {
    for (let i = this.trailPoints.length - 1; i >= 0; i--) {
      this.trailPoints[i].x -= deltaMove;
      if (this.trailPoints[i].x < Player.MIN_TRAIL_X) {
        this.trailPoints.splice(i, 1);
      }
    }
  }

  private renderTrail(): void {
    if (!this.trailGraphics) return;
    this.trailGraphics.clear();
    if (this.trailPoints.length < 2) return;

    for (let i = 0; i < this.trailPoints.length - 1; i++) {
      const p1 = this.trailPoints[i];
      const p2 = this.trailPoints[i + 1];
      const thickness = Math.max(1, 5 * (1 - i / this.trailPoints.length));

      this.trailGraphics.lineStyle(thickness, Player.TRAIL_COLOR, 1.0);
      this.trailGraphics.beginPath();
      this.trailGraphics.moveTo(p1.x, p1.y);
      this.trailGraphics.lineTo(p2.x, p2.y);
      this.trailGraphics.strokePath();
    }
  }

  private clearTrail(): void {
    this.trailPoints = [];
    this.trailGraphics?.clear();
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
