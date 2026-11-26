import Phaser from 'phaser';

const TILE_SIZE = 32;
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

    const totalWidth = widthTiles * TILE_SIZE;
    const totalHeight = heightTiles * TILE_SIZE;
    const startX = options.centerX - totalWidth / 2 + TILE_SIZE / 2;
    const startY = options.centerY - totalHeight / 2 + TILE_SIZE / 2;

    for (let row = 0; row < heightTiles; row++) {
      for (let col = 0; col < widthTiles; col++) {
        const key = this._getTileKey(row, col, widthTiles, heightTiles);
        const x = startX + col * TILE_SIZE;
        const y = startY + row * TILE_SIZE;
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

  private _getTileKey(row: number, col: number, maxRows: number, maxCols: number): string {
    const rowType = getEdgeType(row, maxRows - 1);
    const colType = getEdgeType(col, maxCols - 1);
    const index = rowType * 3 + colType + 1;
    return `menu-${index}`;
  }
}
