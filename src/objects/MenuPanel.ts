import Phaser from 'phaser';
import { ASSET_KEYS } from '../config/assetKeys.ts';
import { PANEL_TILE_SIZE } from '../config/panelConfig.ts';

const DEFAULT_TILES = 6;

export interface MenuPanelOptions {
  scene: Phaser.Scene;
  centerX: number;
  centerY: number;
  widthTiles?: number;
  heightTiles?: number;
}

function getEdgeType(index: number, lastIndex: number): number {
  if (index === 0) return 0;
  if (index === lastIndex) return 2;
  return 1;
}

export class MenuPanel {
  private readonly root: Phaser.GameObjects.Container;

  constructor(options: MenuPanelOptions) {
    const widthTiles = options.widthTiles ?? DEFAULT_TILES;
    const heightTiles = options.heightTiles ?? DEFAULT_TILES;
    this.root = options.scene.add.container(0, 0);

    const totalWidth = widthTiles * PANEL_TILE_SIZE;
    const totalHeight = heightTiles * PANEL_TILE_SIZE;
    const startX = options.centerX - totalWidth / 2 + PANEL_TILE_SIZE / 2;
    const startY = options.centerY - totalHeight / 2 + PANEL_TILE_SIZE / 2;

    for (let row = 0; row < heightTiles; row++) {
      for (let col = 0; col < widthTiles; col++) {
        const key = this._getTileKey(row, col, heightTiles, widthTiles);
        const x = startX + col * PANEL_TILE_SIZE;
        const y = startY + row * PANEL_TILE_SIZE;
        this.root.add(options.scene.add.image(x, y, key));
      }
    }
  }

  public getContainer(): Phaser.GameObjects.Container {
    return this.root;
  }

  public setDepth(depth: number): this {
    this.root.setDepth(depth);
    return this;
  }

  public destroy(): void {
    this.root.destroy();
  }

  private _getTileKey(row: number, col: number, rows: number, cols: number): string {
    const rowType = getEdgeType(row, rows - 1);
    const colType = getEdgeType(col, cols - 1);
    const index = rowType * 3 + colType + 1;
    return ASSET_KEYS.texture.menu(index);
  }
}
