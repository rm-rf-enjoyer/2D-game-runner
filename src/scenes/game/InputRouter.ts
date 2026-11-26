import type Phaser from 'phaser';
import { GAME_WIDTH, GAMEPLAY_CONFIG } from '../../config/gameConstants.ts';

export interface InputRouterHandlers {
  onJumpPress(): void;
  onJumpRelease(): void;
  onDash(): void;
}

export class InputRouter {
  private readonly scene: Phaser.Scene;
  private readonly handlers: InputRouterHandlers;
  private jumpPointerId: number | null = null;

  private readonly onPointerDown = (pointer: Phaser.Input.Pointer): void => {
    const split = GAME_WIDTH * GAMEPLAY_CONFIG.input.splitRatio;
    if (pointer.x < split) {
      this.jumpPointerId = pointer.id;
      this.handlers.onJumpPress();
      return;
    }

    this.handlers.onDash();
  };

  private readonly onPointerRelease = (pointer: Phaser.Input.Pointer): void => {
    if (pointer.id !== this.jumpPointerId) return;

    this.jumpPointerId = null;
    this.handlers.onJumpRelease();
  };

  private readonly onKeyDownSpace = (): void => this.handlers.onJumpPress();
  private readonly onKeyUpSpace = (): void => this.handlers.onJumpRelease();
  private readonly onKeyDownShift = (): void => this.handlers.onDash();

  constructor(scene: Phaser.Scene, handlers: InputRouterHandlers) {
    this.scene = scene;
    this.handlers = handlers;
  }

  public enable(): void {
    this.jumpPointerId = null;

    this.scene.input.on('pointerdown', this.onPointerDown);
    this.scene.input.on('pointerup', this.onPointerRelease);
    this.scene.input.on('pointerupoutside', this.onPointerRelease);

    this.scene.input.keyboard?.on('keydown-SPACE', this.onKeyDownSpace);
    this.scene.input.keyboard?.on('keyup-SPACE', this.onKeyUpSpace);
    this.scene.input.keyboard?.on('keydown-SHIFT', this.onKeyDownShift);
  }

  public disable(): void {
    this.scene.input.off('pointerdown', this.onPointerDown);
    this.scene.input.off('pointerup', this.onPointerRelease);
    this.scene.input.off('pointerupoutside', this.onPointerRelease);

    this.scene.input.keyboard?.off('keydown-SPACE', this.onKeyDownSpace);
    this.scene.input.keyboard?.off('keyup-SPACE', this.onKeyUpSpace);
    this.scene.input.keyboard?.off('keydown-SHIFT', this.onKeyDownShift);

    this.jumpPointerId = null;
  }
}
