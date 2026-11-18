import Phaser from 'phaser';

const TILE_SIZE = 16;
const COLLISION_HEIGHT = 64;
const DEBUG_COLOR = 0xff0000;
const OBSTACLE_SIZE = { width: 16, height: 16 };
const OBSTACLE_Y_OFFSET = 8;

export class Platform {
  constructor(scene, x, y, widthInBlocks, type, physicsGroup, trashGroup, endFrame = 2) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.width = widthInBlocks * TILE_SIZE;
    this.physicsGroup = physicsGroup;
    this.trashGroup = trashGroup;
    this.endFrame = endFrame;

    this.images = [];
    this.obstacles = [];
    this.hasObstacle = false;

    this._buildVisuals();
    this._buildPhysics();
  }

  _buildVisuals() {
    const totalBlocks = this.width / TILE_SIZE;

    for (let i = 0; i < totalBlocks; i++) {
      let frameIndex = 1;
      if (i === 0) frameIndex = 0;
      else if (i === totalBlocks - 1) frameIndex = this.endFrame;

      const img = this.scene.add.image(
        this.x + (i * TILE_SIZE) + (TILE_SIZE / 2),
        this.y + (TILE_SIZE / 2), 
        'pipe-platform',
        frameIndex
      ).setDepth(1);

      this.images.push(img);
    }
  }

  _buildPhysics() {
    this.body = this.scene.add.rectangle(
      this.x + this.width / 2,
      this.y + (COLLISION_HEIGHT / 2),
      this.width,
      COLLISION_HEIGHT, 
      DEBUG_COLOR,
      0
    );
    
    this.scene.physics.add.existing(this.body, true);
    this.body.body.updateFromGameObject();
    this.physicsGroup.add(this.body);
  }

  addObstacle() {
    this.hasObstacle = true;
    const lastBlockX = this.x + this.width - (TILE_SIZE / 2);

    const obsImg = this.scene.add.image(lastBlockX, this.y, 'pipe-platform', 8)
      .setOrigin(0.5, 1)
      .setDepth(2);

    const obsBody = this.scene.add.rectangle(
      lastBlockX, 
      this.y - OBSTACLE_Y_OFFSET, 
      OBSTACLE_SIZE.width, 
      OBSTACLE_SIZE.height, 
      DEBUG_COLOR, 
      0
    );
    
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
