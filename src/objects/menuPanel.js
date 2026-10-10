import Phaser from 'phaser';

export class MenuPanel {
  constructor(scene, centerX, centerY, scale = 6) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);

    const SIZE = 32;
    const tile = SIZE * scale;
    const step = tile;

    const centerCol = 1;
    const centerRow = 1;

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const key = `menu-${row * 3 + col + 1}`;
        const x = centerX + (col - centerCol) * step;
        const y = centerY + (row - centerRow) * step;

        const img = scene.add.image(x, y, key);
        img.setScale(scale);
        this.container.add(img);
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
