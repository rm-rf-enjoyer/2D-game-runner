import Phaser from 'phaser';

export class MenuPanel {
  constructor(scene, centerX, centerY, tileSize, colsMiddle = 3, rowsMiddle = 3) {
    this.scene = scene;
    this.centerX = centerX;
    this.centerY = centerY;
    this.tileSize = tileSize;
    this.container = scene.add.container(0, 0);

    const step = tileSize;   // шаг = размер тайла (без overlap)

    // Сколько тайлов в каждой части
    // Верхний ряд:    1 угол + colsMiddle + 1 угол  = colsMiddle + 2
    // Средний ряд:    1 лево + colsMiddle + 1 право = colsMiddle + 2
    // Нижний ряд:     1 угол + colsMiddle + 1 угол  = colsMiddle + 2
    //
    // Вертикально:    1 верх + rowsMiddle + 1 низ   = rowsMiddle + 2

    const totalCols = colsMiddle + 6;
    const totalRows = rowsMiddle + 6;

    const centerColOffset = (totalCols - 1) / 2;
    const centerRowOffset = (totalRows - 1) / 2;

    // Проходим по всей сетке
    for (let row = 0; row < totalRows; row++) {
      for (let col = 0; col < totalCols; col++) {

        // Определяем, какой PNG использовать
        let key;

        const isLeft   = col === 0;
        const isRight  = col === totalCols - 1;
        const isTop    = row === 0;
        const isBottom = row === totalRows - 1;

        if (isTop && isLeft)         key = 'menu-1';  // верх-лево
        else if (isTop && isRight)   key = 'menu-3';  // верх-право
        else if (isBottom && isLeft) key = 'menu-7';  // низ-лево
        else if (isBottom && isRight)key = 'menu-9';  // низ-право
        else if (isTop)              key = 'menu-2';  // верх-центр
        else if (isBottom)           key = 'menu-8';  // низ-центр
        else if (isLeft)             key = 'menu-4';  // лево-центр
        else if (isRight)            key = 'menu-6';  // право-центр
        else                         key = 'menu-5';  // центр-центр

        const x = Math.floor(centerX + (col - centerColOffset) * step);
        const y = Math.floor(centerY + (row - centerRowOffset) * step);

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
