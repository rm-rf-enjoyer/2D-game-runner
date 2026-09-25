import Phaser from 'phaser';

export class MenuPanel {
  constructor(scene, centerX, centerY, tileSize) {
    this.scene = scene;
    this.centerX = centerX;
    this.centerY = centerY;
    this.tileSize = tileSize;
    this.container = scene.add.container(0, 0);

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const key = `menu-${row * 3 + col + 1}`;
        const x = Math.floor(centerX + (col - 1) * (tileSize - 3));
        const y = Math.floor(centerY + (row - 1) * (tileSize - 3));

        const tile = scene.add.image(x, y, key);
         tile.displayWidth = Math.round(tileSize);
         tile.displayHeight = Math.round(tileSize);

        this.container.add(tile);
      }
    }
  }

  setDepth(d) {
    this.container.setDepth(d);
    return this;
  }

  destroy() {
    this.container.destroy();
  }
}
