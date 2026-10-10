import Phaser from 'phaser';

export class Enemy {
  constructor(scene, x, y, speed, type = 'normal') {
    this.scene = scene;
    this.speed = speed;
    this.type = type;

    const textureKey = type === 'tall' ? 'enemy-tall' : 'enemy-walk';
    const animKey    = type === 'tall' ? 'enemy-tall-walk' : 'enemy-walk';

    this.sprite = scene.physics.add.sprite(x, y, 'enemy-walk');
    this.sprite.setDepth(4);

    this.sprite.setFlipX(false);

    if (type === 'tall') {
      this.sprite.setScale(6);
      this.sprite.body.setSize(16, 64);   // хитбокс выше
      this.sprite.body.setOffset(7, 0);
    } else {
      this.sprite.setScale(6);
      this.sprite.body.setSize(16, 32);
      this.sprite.body.setOffset(7, 0);
    }

    // ОТКЛЮЧАЕМ гравитацию и физику полностью
    this.sprite.body.setAllowGravity(false);
    this.sprite.body.setImmovable(true);

    this.sprite.setVelocityX(-speed);
    this.sprite.play(animKey);

    this.isDead = false;

  }

  update() {
    if (this.sprite.x < -200) {
      this.destroy();
    }
  }

  destroy() {
    if (this.isDead) return;
    this.isDead = true;
    this.sprite.destroy();
  }
}
