import Phaser from 'phaser';

export class Player {
  constructor(scene, x, y, groundSpeed = 200) {
    this.scene = scene;
    this.groundSpeed = groundSpeed;

    this.sprite = scene.physics.add.sprite(x, y, 'player-run');
    this.sprite.setScale(6);
    this.sprite.setDepth(5);

    this.sprite.body.setSize(18, 32);
    this.sprite.body.setOffset(7, 0);

    this.sprite.play('run');

    this.isJumping = false;
    this.jumpVelocity = -1300;

    // РЫВОК
    this.isDashing = false;
    this.dashDuration = 200;
    this.dashSpeed = 2000;
    this.dashCooldown = 500;
    this.dashStartedAt = -Infinity;

    // шлейф
    this.trail = scene.add.particles(0, 0, 'player-trail', {
      follow: this.sprite,
      lifespan: 200,
      frequency: 100,
      scale: { start: 6, end: 6 },
      tint: 0x50e0f3,
      quantity: 1,
      emitting: false,
      roundPixels: true,
      speedX: -groundSpeed,
      speedY: 0,
    });
    this.trail.setDepth(4);
  }

  jump() {
    if (this.isJumping) return;
    if (this.isDashing) return;

    const body = this.sprite.body;
    const onGround = body.blocked.down || body.touching.down;
    if (!onGround) return;

    this.sprite.setVelocityY(this.jumpVelocity);
    this.isJumping = true;
    this.sprite.play('jump-up', true);
    this.trail.emitting = true;
  }

  dash() {
    const now = this.scene.time.now;
    if (this.isDashing) return;
    if (now - this.dashStartedAt < this.dashCooldown) return;

    this.isDashing = true;
    this.dashStartedAt = now;

    this.sprite.body.setAllowGravity(false);
    this.sprite.setVelocityY(0);

    this.scene.events.emit('dash', this.dashDuration, this.dashSpeed);

    this.sprite.play('jump-up', true);
    this.trail.emitting = true;
    this.trail.frequency = 50;
    this.trail.lifespan = 600;
    this.trail.speedX = -this.dashSpeed;

    this.scene.time.delayedCall(this.dashDuration, () => {
      this.isDashing = false;
      this.sprite.body.setAllowGravity(true);
      this.trail.emitting = false;
      this.trail.frequency = 100;
      this.trail.lifespan = 200;
      this.trail.speedX = -this.groundSpeed;

      const body = this.sprite.body;
      const onGround = body.blocked.down || body.touching.down;


      if (onGround) {
        this.isJumping = false;
        this.sprite.anims.stop();
        this.sprite.play('run', true);
        this.trail.emitting = false;
      } else {
        const goingUp = body.velocity.y < 0;
        this.sprite.play(goingUp ? 'jump-up' : 'jump-down', true);
      }
    });
  }

  onLand() {
    if (!this.isJumping) return;
    this.isJumping = false;
    this.sprite.anims.stop();
    this.sprite.play('run', true);
    this.trail.emitting = false;
  }

  update() {
    const body = this.sprite.body;
    const onGround = body.blocked.down || body.touching.down;
    const goingUp = body.velocity.y < 0;
    const goingDown = body.velocity.y > 0;

    if (this.isDashing) return;

    if (onGround && this.isJumping && !goingUp) {
      this.onLand();
      return;
    }

    if (onGround && !this.isJumping) {
      if (this.trail.emitting) this.trail.emitting = false;

      const currentKey = this.sprite.anims.currentAnim?.key;
      if (currentKey !== 'run') {
        this.sprite.anims.stop();
        this.sprite.play('run', true);
      }
      return;
    }

    const currentKey = this.sprite.anims.currentAnim?.key;

    if (goingUp && currentKey !== 'jump-up') {
      this.sprite.play('jump-up', true);
    } else if (goingDown && currentKey !== 'jump-down') {
      this.sprite.play('jump-down', true);
    }
  }
}
