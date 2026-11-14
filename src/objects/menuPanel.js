import Phaser from 'phaser';

export class MenuPanel {
  constructor(scene, centerX, centerY, widthTiles = 6, heightTiles = 6) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);

    const TILE = 32; // Размер твоего PNG
    const totalWidth = widthTiles * TILE;
    const totalHeight = heightTiles * TILE;

    // Считаем левый верхний угол
    const startX = centerX - totalWidth / 2 + TILE / 2;
    const startY = centerY - totalHeight / 2 + TILE / 2;

    for (let row = 0; row < heightTiles; row++) {
      for (let col = 0; col < widthTiles; col++) {
        let key;
        const isTop = row === 0;
        const isBottom = row === heightTiles - 1;
        const isLeft = col === 0;
        const isRight = col === widthTiles - 1;

        if (isTop && isLeft)         key = 'menu-1';
        else if (isTop && isRight)   key = 'menu-3';
        else if (isBottom && isLeft) key = 'menu-7';
        else if (isBottom && isRight)key = 'menu-9';
        else if (isTop)              key = 'menu-2';
        else if (isBottom)           key = 'menu-8';
        else if (isLeft)             key = 'menu-4';
        else if (isRight)            key = 'menu-6';
        else                         key = 'menu-5';

        const x = startX + col * TILE;
        const y = startY + row * TILE;

        const img = scene.add.image(x, y, key);
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
