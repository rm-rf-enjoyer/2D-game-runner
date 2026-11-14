import Phaser from 'phaser';

export class Button {
  constructor(scene, x, y, width, height, onClick) {
    this.scene = scene;
    this.x = Math.round(x);
    this.y = Math.round(y);
    this.width = Math.round(width);
    this.height = Math.round(height);
    this.onClick = onClick;
    this.isPressed = false;

    this.container = scene.add.container(this.x, this.y);

    const leftTex = scene.textures.get('btn-normal-left').getSourceImage();
    const rightTex = scene.textures.get('btn-normal-right').getSourceImage();

    const leftW  = leftTex.width;
    const rightW = rightTex.width;
    const centerW = Math.round(this.width - leftW - rightW);

    this.leftW = leftW;
    this.rightW = rightW;
    this.centerW = centerW;

    this.left = scene.add.image(-this.width / 2 + leftW / 2, 0, 'btn-normal-left');
    this.center = scene.add.tileSprite(0, 0, centerW, this.height, 'btn-normal-center');
    this.right = scene.add.image(this.width / 2 - rightW / 2, 0, 'btn-normal-right');

    this.container.add([this.left, this.center, this.right]);

    this.hitArea = scene.add
      .zone(this.x, this.y, this.width, this.height)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.hitArea.on('pointerdown', () => this._press());
    this.hitArea.on('pointerup',   () => this._release(true));
    this.hitArea.on('pointerout',  () => this._release(false));
  }

  _press() {
    if (this.isPressed) return;
    this.isPressed = true;
    
    this.left.setTexture('btn-pressed-left');
    this.center.setTexture('btn-pressed-center');
    this.right.setTexture('btn-pressed-right');

    // ЗВУК КЛИКА ТЕПЕРЬ ЗДЕСЬ (срабатывает при нажатии)
    this.scene.sound.play('sfx-click', { volume: 1 }); 
  }

  _release(invoke) {
    if (!this.isPressed) return;
    this.isPressed = false;
    
    this.left.setTexture('btn-normal-left');
    this.center.setTexture('btn-normal-center');
    this.right.setTexture('btn-normal-right');

    if (invoke && this.onClick) {
      this.onClick();
    }
  }
  
  setDepth(d) {
    this.container.setDepth(d);
    this.hitArea.setDepth(d);
    return this;
  }

  destroy() {
    this.container.destroy();
    this.hitArea.destroy();
  }
}
