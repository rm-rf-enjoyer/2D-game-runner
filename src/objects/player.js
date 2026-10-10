import Phaser from 'phaser';

export class Player {
  constructor(scene, x, y) {
    this.scene = scene;

    this.sprite = scene.physics.add.sprite(x, y, 'player-run');
    this.sprite.setScale(6);
    this.sprite.setDepth(5);

    
    this.sprite.body.setSize(18, 32);
    this.sprite.body.setOffset(7, 0);

    this.sprite.play('run');

    this.isJumping = false;
    this.jumpVelocity = -1300;
  }

  jump() {
    if (this.isJumping) return;
    this.sprite.setVelocityY(this.jumpVelocity);
    this.isJumping = true;
    this.sprite.play('jump-up', true);
  }

  onLand() {
    if (!this.isJumping) return;
    this.isJumping = false;

    this.sprite.anims.stop();
    this.sprite.play('run', true);
  }

  update() {
    const body = this.sprite.body;
    const onGround = body.onFloor() || body.touching.down || body.blocked.down;
    const goingUp = body.velocity.y < 0;

    if (onGround && this.isJumping && !goingUp) {
      this.onLand();
      return;
    }

    if (this.isJumping) {
      const goingUp = body.velocity.y < 0;
      const currentKey = this.sprite.anims.currentAnim?.key;

      if (goingUp && currentKey !== 'jump-up') {
        this.sprite.play('jump-up', true);
      } else if (!goingUp && currentKey !== 'jump-down') {
        this.sprite.play('jump-down', true);
      }
    } 
  }
}
