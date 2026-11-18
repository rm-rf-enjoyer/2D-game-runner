import Phaser from 'phaser';

const TILE_SIZE = 32;

export class MenuPanel {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, centerX: number, centerY: number, widthTiles: number = 6, heightTiles: number = 6) {
    this.scene = scene;
    this.container = this.scene.add.container(0, 0);

    const totalWidth = widthTiles * TILE_SIZE;
    const totalHeight = heightTiles * TILE_SIZE;

    const startX = centerX - totalWidth / 2 + TILE_SIZE / 2;
    const startY = centerY - totalHeight / 2 + TILE_SIZE / 2;

    for (let row = 0; row < heightTiles; row++) {
      for (let col = 0; col < widthTiles; col++) {
        const key = this._getTileKey(row, col, widthTiles, heightTiles);
        
        const x = startX + col * TILE_SIZE;
        const y = startY + row * TILE_SIZE;

        const img = this.scene.add.image(x, y, key);
        this.container.add(img);
      }
    }
  }

  private _getTileKey(row: number, col: number, maxRows: number, maxCols: number): string {
    // 0 = край, 1 = центр
    const rowType = row === 0 ? 0 : (row === maxRows - 1 ? 2 : 1);
    const colType = col === 0 ? 0 : (col === maxCols - 1 ? 2 : 1);
    
    // Индекс от 0 до 8 (row 0-2, col 0-2)
    const index = (rowType * 3) + colType + 1;
    return `menu-${index}`;
  }

  public setDepth(depth: number): this {
    this.container.setDepth(depth);
    return this;
  }

  public destroy(): void {
    this.container.destroy();
  }
}
