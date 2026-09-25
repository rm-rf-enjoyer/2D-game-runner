import Phaser from 'phaser';

export class Button {
    constructor(scene, x, y, width, height, onClick) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.onClick = onClick;
    this.isPressed = false;

    this.container = scene.add.container(x, y);

    const leftTex = scene.textures.get('btn-normal-left').getSourceImage();
    const rightTex = scene.textures.get('btn-normal-right').getSourceImage();
    const centerTex = scene.textures.get('btn-normal-center').getSourceImage();

    const scaleY = height / leftTex.height;
    const leftW  = leftTex.width  * scaleY;
    const rightW = rightTex.width * scaleY;
    const centerW = width - leftW - rightW;

    this.leftW = leftW;
    this.rightW = rightW;
    this.centerW = centerW;
    this.scaleY = scaleY;

    this.left   = scene.add.image(-width / 2 + leftW / 2, 0, 'btn-normal-left')
      .setScale(scaleY);
    this.center = scene.add.image(0, 0, 'btn-normal-center')
      .setDisplaySize(centerW, height);
    this.right  = scene.add.image(width / 2 - rightW / 2, 0, 'btn-normal-right')
      .setScale(scaleY)

    this.container.add([this.left, this.center, this.right]);

    this.hitArea = scene.add
      .zone(x, y, width, height)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.hitArea.on('pointerdown', () => this._press());
    this.hitArea.on('pointerup',   () => this._release(true));
    this.hitArea.on('pointerout',  () => this._release(false));
  }

  _press() {
    if (this.isPressed) return;
    this.isPressed = true;
    this.left.setTexture('btn-pressed-left').setScale(this.scaleY);
    this.center.setTexture('btn-pressed-center').setDisplaySize(this.centerW, this.height);
    this.right.setTexture('btn-pressed-right').setScale(this.scaleY);
  }

  _release(invoke) {
    if (!this.isPressed) return;
    this.isPressed = false;
    this.left.setTexture('btn-normal-left').setScale(this.scaleY);
    this.center.setTexture('btn-normal-center').setDisplaySize(this.centerW, this.height);
    this.right.setTexture('btn-normal-right').setScale(this.scaleY);

    if (invoke && this.onClick) this.onClick();
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
