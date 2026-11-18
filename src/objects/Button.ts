import Phaser from 'phaser';

export interface ButtonConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  width: number;
  height: number;
  onClick: () => void;
}

export class Button {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private hitArea: Phaser.GameObjects.Zone;
  
  private left: Phaser.GameObjects.Image;
  private center: Phaser.GameObjects.TileSprite;
  private right: Phaser.GameObjects.Image;

  private onClick: () => void;
  private isPressed: boolean = false;

  constructor(config: ButtonConfig) {
    this.scene = config.scene;
    this.onClick = config.onClick;
    
    const x = Math.round(config.x);
    const y = Math.round(config.y);
    const width = Math.round(config.width);
    const height = Math.round(config.height);

    this.container = this.scene.add.container(x, y);

    const leftTex = this.scene.textures.get('btn-normal-left').getSourceImage();
    const rightTex = this.scene.textures.get('btn-normal-right').getSourceImage();
    const leftW = leftTex.width;
    const rightW = rightTex.width;
    const centerW = Math.round(width - leftW - rightW);

    this.left = this.scene.add.image(-width / 2 + leftW / 2, 0, 'btn-normal-left');
    this.center = this.scene.add.tileSprite(0, 0, centerW, height, 'btn-normal-center');
    this.right = this.scene.add.image(width / 2 - rightW / 2, 0, 'btn-normal-right');

    this.container.add([this.left, this.center, this.right]);

    this.hitArea = this.scene.add
      .zone(x, y, width, height)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.hitArea.on('pointerdown', () => this._press());
    this.hitArea.on('pointerup', () => this._release(true));
    this.hitArea.on('pointerout', () => this._release(false));
  }

  private _press(): void {
    if (this.isPressed) return;
    this.isPressed = true;
    
    this._setTextureSet('pressed');
    this.scene.sound.play('sfx-click', { volume: 1 }); 
  }

  private _release(invoke: boolean): void {
    if (!this.isPressed) return;
    this.isPressed = false;
    
    this._setTextureSet('normal');

    if (invoke) {
      this.onClick();
    }
  }

  private _setTextureSet(state: 'normal' | 'pressed'): void {
    this.left.setTexture(`btn-${state}-left`);
    this.center.setTexture(`btn-${state}-center`);
    this.right.setTexture(`btn-${state}-right`);
  }
  
  public setDepth(depth: number): this {
    this.container.setDepth(depth);
    this.hitArea.setDepth(depth);
    return this;
  }

  public destroy(): void {
    this.container.destroy();
    this.hitArea.destroy();
  }
}
