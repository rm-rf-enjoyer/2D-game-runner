import Phaser from 'phaser';
import { getTextureSize } from '../utils/common';

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
  public readonly container: Phaser.GameObjects.Container;
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

    const leftW = getTextureSize(this.scene, 'btn-normal-left').width;
    const rightW = getTextureSize(this.scene, 'btn-normal-right').width;
    const centerW = Math.round(width - leftW - rightW);

    this.left = this._createSideImage('btn-normal-left', -width / 2 + leftW / 2);
    this.center = this.scene.add.tileSprite(0, 0, centerW, height, 'btn-normal-center');
    this.right = this._createSideImage('btn-normal-right', width / 2 - rightW / 2);

    this.container.add([this.left, this.center, this.right]);

    this.hitArea = this.scene.add
      .zone(x, y, width, height)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.hitArea.on('pointerdown', () => this._press());
    this.hitArea.on('pointerup', () => this._release(true));
    this.hitArea.on('pointerout', () => this._release(false));
  }

  private _createSideImage(key: string, x: number): Phaser.GameObjects.Image {
    return this.scene.add.image(x, 0, key);
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
