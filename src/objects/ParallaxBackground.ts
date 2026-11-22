import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';

const PARALLAX_CONFIG = {
  train: {
    initialDelay: 2000,
    spawnInterval: 30000,
    speedMultiplier: 1.2,
    startOffset: 200,
    endOffset: 200,
  },
  defaultSpeed: 130,
};

export interface LayerConfig {
  key: string;
  speed: number;
  depth: number;
}

export interface ParallaxLayer {
  ts: Phaser.GameObjects.TileSprite;
  speed: number;
}

export interface ParallaxImageLayer {
  images: Phaser.GameObjects.Image[];
  width: number;
  speed: number;
}

export class ParallaxBackground {
  private scene: Phaser.Scene;
  private layers: ParallaxLayer[] = [];
  private imageLayers: ParallaxImageLayer[] = [];
  private train: Phaser.GameObjects.Image;
  
  private burstRemaining: number = 0;
  private burstPerSecond: number = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    
    const layerConfigs: LayerConfig[] = [
      { key: 'bg1', speed: 0.05, depth: -40 },
      { key: 'bg2', speed: 0.1, depth: -30 },
      { key: 'bg4', speed: 0.2, depth: -10 },
    ];

    this.layers = layerConfigs.map(cfg => ({
      ts: this._createTileSprite(cfg.key, cfg.depth),
      speed: cfg.speed
    }));

    this.imageLayers = [
      this._createImageLayer(['bg5'], 1.0, -6),
      this._createImageLayer(['bg6a', 'bg6b'], 1.0, -2),
    ];

    this.train = this._setupTrain();
    this._setupTrainTimer();
  }

  private _createTileSprite(key: string, depth: number): Phaser.GameObjects.TileSprite {
    return this.scene.add.tileSprite(
      GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, key
    ).setDepth(depth);
  }

  private _createImageLayer(keys: string[], speed: number, depth: number): ParallaxImageLayer {
    const width = (this.scene.textures.get(keys[0]).getSourceImage() as HTMLImageElement).width;
    const images = Array.from({ length: keys.length * 2 }, (_, index) =>
      this.scene.add.image(
        index * width, GAME_HEIGHT / 2, keys[index % keys.length]
      ).setOrigin(0, 0.5).setDepth(depth)
    );

    return { images, width, speed };
  }

  private _setupTrain(): Phaser.GameObjects.Image {
    const train = this.scene.add.image(0, GAME_HEIGHT / 2, 'bg3')
      .setScale(1)
      .setDepth(-20)
      .setVisible(false);
      
    train.x = GAME_WIDTH + train.displayWidth / 2;
    return train;
  }

  private _setupTrainTimer(): void {
    this.scene.time.delayedCall(PARALLAX_CONFIG.train.initialDelay, () => this.spawnTrain());
    this.scene.time.addEvent({
      delay: PARALLAX_CONFIG.train.spawnInterval, 
      loop: true,
      callback: () => this.spawnTrain(),
    });
  }

  public spawnTrain(): void {
    if (this.train.visible) return;
    
    this.train.x = GAME_WIDTH + this.train.displayWidth / 2;
    this.train.setVisible(true);

    this.scene.tweens.add({
      targets: this.train,
      x: -this.train.displayWidth / 2,
      duration: 15000,
      ease: 'Linear',
      onComplete: () => this.train.setVisible(false)
    });
  }

  public burst(distance: number, duration: number): void {
    this.burstRemaining = distance;
    this.burstPerSecond = distance / (duration / 1000);
  }

  public update(delta: number, baseSpeed: number = PARALLAX_CONFIG.defaultSpeed): void {
    const dt = delta / 1000;
    let shift = baseSpeed * dt;
    let burstShift = 0;

    if (this.burstRemaining > 0) {
      burstShift = Math.min(this.burstPerSecond * dt, this.burstRemaining);
      this.burstRemaining -= burstShift;
    }

    const totalShift = shift + burstShift;
    this._moveLayers(totalShift);
    this._moveImageLayers(totalShift);
  }

  private _moveLayers(totalShift: number): void {
    this.layers.forEach(layer => {
      layer.ts.tilePositionX += totalShift * layer.speed;
    });
  }

  private _moveImageLayers(totalShift: number): void {
    this.imageLayers.forEach(layer => {
      const layerShift = totalShift * layer.speed;
      layer.images.forEach(image => {
        image.x -= layerShift;
        if (image.x + layer.width <= 0) {
          image.x += layer.width * layer.images.length;
        }
      });
    });
  }

  public destroy(): void {
    this.layers.forEach(layer => layer.ts.destroy());
    this.imageLayers.forEach(layer => layer.images.forEach(image => image.destroy()));
    if (this.train) this.train.destroy();
    this.layers = [];
    this.imageLayers = [];
  }
}
