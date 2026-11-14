import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig.js';

export class Foreground {
  constructor(scene) {
    this.scene = scene;
    this.speedMultiplier = 1.5;

    this.sprite = scene.add.tileSprite(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      'foreground'
    );
    this.sprite.setDepth(20);

    this.trafficObjects = [];
    this.maxObjects = 5;

    scene.time.addEvent({
      delay: 500,
      loop: true,
      callback: () => this._trySpawnObject()
    });
  }

  _trySpawnObject() {
    const count = this.trafficObjects.length;
    if (count === 0 || (count === 1 && Math.random() < 0.5) || (count < this.maxObjects && Math.random() < 0.4)) {
      this._spawnObject();
    }
  }

  _spawnObject() {
    const tex = this.scene.textures.get('traffic-object').getSourceImage();
    const objWidth = tex.width;
    
    // Позиция в верхней трети
    const startY = Phaser.Math.Between(10, 90);
    
    const obj = this.scene.add.image(
      GAME_WIDTH + objWidth / 2, 
      startY, 
      'traffic-object'
    );
    obj.setDepth(21);
    
    const speedMultiplier = Phaser.Math.FloatBetween(1.5, 2.5);

    // Переменные для смены полосы
    this.trafficObjects.push({ 
      sprite: obj, 
      speedMultiplier,
      currentY: startY,
      targetY: startY,
      laneChangeTimer: 0,
      laneChangeCooldown: Phaser.Math.Between(1500, 4000), // Следующее решение о маневре через 1.5-4 сек
      moveTimer: 0,       // Таймер для пошагового движения
      moveSpeed: 50       // 50 мс на 1 пиксель
    });
  }

  update(delta, baseSpeed) {
    const dt = delta / 1000;
    
    this.sprite.tilePositionX += baseSpeed * this.speedMultiplier * dt;

    for (let i = this.trafficObjects.length - 1; i >= 0; i--) {
      const obj = this.trafficObjects[i];
      
      // 1. Движение влево
      obj.sprite.x -= baseSpeed * obj.speedMultiplier * dt;

      // 2. Логика принятия решения о смене полосы
      obj.laneChangeTimer += delta;
      if (obj.laneChangeTimer >= obj.laneChangeCooldown) {
        obj.laneChangeTimer = 0;
        obj.laneChangeCooldown = Phaser.Math.Between(1500, 4000); // Ждем перед следующим маневром
        
        // 40% шанс, что объект решит сменить полосу (иначе летит прямо)
        if (Math.random() < 0.4) {
          // Смещаемся на 1-3 пикселя, но не вылетаем за верхнюю треть (10-90)
          const shift = Phaser.Math.Between(1, 3) * (Math.random() < 0.5 ? 1 : -1);
          const newTarget = Phaser.Math.Clamp(obj.currentY + shift, 10, 90);
          
          // Если сместились, задаем новую цель
          if (newTarget !== obj.currentY) {
            obj.targetY = newTarget;
          }
        }
      }

      // 3. Пошаговое движение к целевой полосе (если цель изменилась)
      if (obj.currentY !== obj.targetY) {
        obj.moveTimer += delta;
        
        // Каждые 50 мс делаем шаг на 1 пиксель
        if (obj.moveTimer >= obj.moveSpeed) {
          obj.moveTimer = 0;
          
          if (obj.currentY < obj.targetY) {
            obj.currentY += 1;
          } else {
            obj.currentY -= 1;
          }
          
          // Применяем новую позицию к спрайту (всегда целые числа)
          obj.sprite.y = obj.currentY;
        }
      }

      // Удаление
      if (obj.sprite.x + obj.sprite.displayWidth / 2 < 0) {
        obj.sprite.destroy();
        this.trafficObjects.splice(i, 1);
      }
    }
  }

  destroy() {
    this.sprite.destroy();
    this.trafficObjects.forEach(obj => obj.sprite.destroy());
    this.trafficObjects = [];
  }
}
