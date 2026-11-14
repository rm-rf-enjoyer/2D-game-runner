import Phaser from 'phaser';

const SCALE = 1;
const BLOCK_SRC = 16;
const BLOCK_WORLD = BLOCK_SRC * SCALE; // 16 px
const BOTTOM_HEIGHT = 48; // Нижняя часть (16 + 48 = 64 общая высота)
const PIPE_Y_OFFSET = 16 * SCALE;

export class Platform {
  constructor(scene, x, y, widthInBlocks, type, physicsGroup, trashGroup, yOffset = null, isMiddleOnly = false) {
    this.scene = scene;
    this.x = x;
    this.y = y; 
    this.width = widthInBlocks * BLOCK_WORLD;
    this.type = type; 
    this.yOffset = yOffset; 
    this.isMiddleOnly = isMiddleOnly; 
    
    this.physicsGroup = physicsGroup;
    this.trashGroup = trashGroup;

    this.images = [];
    this.obstacles = [];

    this._buildVisuals();
    this._buildPhysics();
  }

  _getDrawY() {
    if (this.type === 'pipe') {
      return this.y + (this.yOffset !== null ? this.yOffset : PIPE_Y_OFFSET);
    }
    return this.y;
  }

  _buildVisuals() {
    const totalBlocks = this.width / BLOCK_WORLD;
    const drawY = this._getDrawY();

    if (this.type === 'ground') {
      for (let i = 0; i < totalBlocks; i++) {
        let textureKey = 'top-ground-tile2';
        if (i === 0) textureKey = 'top-ground-tile1';
        else if (i === totalBlocks - 1) textureKey = 'top-ground-tile3';

        const topImg = this.scene.add.image(
          this.x + (i * BLOCK_WORLD) + (BLOCK_WORLD / 2),
          drawY + (BLOCK_WORLD / 2), 
          textureKey
        ).setScale(SCALE).setDepth(0);

        this.images.push(topImg);
      }

      // Нижняя часть (толстая)
      const bottomImg = this.scene.add.tileSprite(
        this.x + this.width / 2,
        drawY + BLOCK_WORLD + (BOTTOM_HEIGHT / 2),
        this.width,
        BOTTOM_HEIGHT,
        'bottom-ground-tiles',
        0
      ).setDepth(0);
      
      bottomImg.setTileScale(SCALE, SCALE);
      this.images.push(bottomImg);

    } else if (this.type === 'pipe') {
      for (let i = 0; i < totalBlocks; i++) {
        let frameIndex = 1; 
        if (!this.isMiddleOnly) {
          if (i === 0) frameIndex = 0;
          else if (i === totalBlocks - 1) frameIndex = 2;
        }

        const pipeImg = this.scene.add.sprite(
          this.x + (i * BLOCK_WORLD) + (BLOCK_WORLD / 2),
          drawY + (BLOCK_WORLD / 2), 
          'pipe-platform-tiles',
          frameIndex
        ).setScale(SCALE).setDepth(0);

        this.images.push(pipeImg);
      }
    }
  }

  _buildPhysics() {
    const drawY = this._getDrawY();
    
    // Делаем коллизию на всю высоту (64px для земли, 16px для труб)
    const totalHeight = this.type === 'ground' ? (BLOCK_WORLD + BOTTOM_HEIGHT) : BLOCK_WORLD;

    this.body = this.scene.add.rectangle(
      this.x + this.width / 2,
      drawY + (totalHeight / 2),
      this.width,
      totalHeight,
      0xff0000,
      0
    );
    this.scene.physics.add.existing(this.body, true);
    this.body.body.updateFromGameObject();
    
    this.physicsGroup.add(this.body);
  }

  addObstacle(key, offsetFromLeft) {
    const obsX = this.x + offsetFromLeft;
    const obsY = this._getDrawY();
    const obsImg = this.scene.add.image(obsX, obsY, key).setOrigin(0.5, 1).setScale(SCALE).setDepth(2);
    const obsBody = this.scene.add.rectangle(obsX, obsY - (8 * SCALE), 16 * SCALE, 16 * SCALE, 0xff0000, 0);
    this.scene.physics.add.existing(obsBody, true);
    obsBody.body.updateFromGameObject();
    this.trashGroup.add(obsBody);
    this.obstacles.push({ img: obsImg, body: obsBody });
  }

  update(shift) {
    this.x -= shift;
    this.body.x -= shift;
    this.body.body.updateFromGameObject();
    this.images.forEach(img => img.x -= shift);
    this.obstacles.forEach(obs => {
      obs.img.x -= shift;
      obs.body.x -= shift;
      obs.body.body.updateFromGameObject();
    });
  }

  destroy() {
    this.physicsGroup.remove(this.body);
    this.body.destroy();
    this.images.forEach(img => img.destroy());
    this.obstacles.forEach(obj => {
      this.trashGroup.remove(obj.body);
      obj.img.destroy();
      obj.body.destroy();
    });
  }
}
