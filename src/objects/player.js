import Phaser from 'phaser';

export class Player {
  constructor(scene, x, y, groundSpeed = 200) {
    this.scene = scene;
    this.groundSpeed = groundSpeed;

    this.baseX = x;
    this.baseY = y;

    this.sprite = scene.physics.add.sprite(x, y, 'player');
    this.sprite.setScale(1);
    this.sprite.setDepth(5);

    this.sprite.body.setSize(14, 24);
    this.sprite.body.setOffset(5, 0);

    // ЗАЩИТА ОТ ТУННЕЛИРОВАНИЯ: Ограничиваем скорость падения (макс 400 px/s)
    this.sprite.setMaxVelocity(300, 400);

    this.isJumping = false;
    this.jumpVelocity = -270;

    // РЫВОК
    this.isDashing = false;
    this.dashDuration = 200;
    this.dashSpeed = 250;
    this.dashCooldown = 500;
    this.dashStartedAt = -Infinity;

    // --- ЧАСТИЦЫ ХОВЕРБОРДА (ВЫХЛОП) ---
    this.exhaust = scene.add.particles(0, 0, 'pixel-particle', {
      follow: this.sprite,
      followOffset: { x: 0, y: 12 }, 
      lifespan: 300,
      speedX: { min: -20, max: -50 }, 
      speedY: { min: -10, max: 10 },
      scale: 1, 
      frequency: 100, 
      tint: 0x4FE8F4,  
      roundPixels: true
    }).setDepth(4);

    // --- ПИКСЕЛЬНАЯ АНИМАЦИЯ ЛЕВИТАЦИИ ---
    this.hoverState = 0; 
    
    this.hoverTimer = scene.time.addEvent({
      delay: 200, 
      loop: true,
      callback: () => {
        if (this.isJumping || this.isDashing) return; 
        if (this.isJumping || this.isDashing || this.isDead) return;

        switch (this.hoverState) {
          case 0:
            this.sprite.y -= 1; 
            this.sprite.body.setOffset(5, 1); 
            break;
          case 1:
            this.sprite.y += 1; 
            this.sprite.body.setOffset(5, 0);
            break;
          case 2:
            this.sprite.x += 1; 
            break;
          case 3:
            this.sprite.x -= 1; 
            break;
          case 4:
            this.sprite.x -= 1; 
            break;
          case 5:
            this.sprite.x += 1; 
            break;
        }

        this.hoverState = (this.hoverState + 1) % 6;
      }
    });

    this.isDead = false;

  }

  jump() {
    if (this.isJumping) return;
    if (this.isDashing) return;

    const body = this.sprite.body;
    const onGround = body.blocked.down || body.touching.down;
    if (!onGround) return;

    // Сбрасываем левитацию, НО НЕ ТЕЛЕПОРТИРУЕМ НА БАЗОВЫЙ Y!
    this.sprite.x = this.baseX;
    this.sprite.y = Math.round(this.sprite.y); // Просто округляем текущую позицию
    this.sprite.body.setOffset(5, 0);
    this.hoverState = 0; 

    this.sprite.setVelocityY(this.jumpVelocity);
    this.isJumping = true;

    this.scene.sound.play('sfx-dash', { volume: 0.3, rate: 1.5 });
    this.sprite.setTexture('player-jump');
    this.sprite.play('jump-anim');
  }

  dash() {
    const now = this.scene.time.now;
    if (this.isDashing) return;
    if (now - this.dashStartedAt < this.dashCooldown) return;

    this.isDashing = true;
    this.dashStartedAt = now;

    this.scene.sound.play('sfx-dash', { volume: 1, rate: 1.0 });

    this.sprite.anims.stop();
    this.sprite.setTexture('player');

    const body = this.sprite.body;
    const onGround = body.blocked.down || body.touching.down;

    this.sprite.x = this.baseX;
    if (onGround) {
      this.sprite.y = Math.round(this.sprite.y);
    }
    
    this.sprite.body.setOffset(5, 0);
    this.hoverState = 0;

    this.sprite.body.setAllowGravity(false);
    this.sprite.setVelocityY(0);

    this.exhaust.frequency = 30;
    this.exhaust.speedX = { min: -100, max: -200 };

    this.scene.events.emit('dash', this.dashDuration, this.dashSpeed);

    // ЭФФЕКТ AFTERIMAGE (Строго без прозрачности)
    const trailTimer = this.scene.time.addEvent({
      delay: 30, 
      loop: true,
      callback: () => {
        const ghost = this.scene.add.image(this.sprite.x, this.sprite.y, 'player');
        ghost.setTintFill(0x4FE8F4); 
        // УБРАЛИ setAlpha(0.7) — призрак полностью непрозрачный
        ghost.setDepth(4); 
        ghost.setFlipX(this.sprite.flipX);

        this.scene.tweens.add({
          targets: ghost,
          x: ghost.x - 40, 
          duration: 150, // Живёт 150 мс
          onComplete: () => ghost.destroy() // Просто исчезает
        });
      }
    });

    this.scene.time.delayedCall(this.dashDuration, () => {
      this.isDashing = false;
      this.sprite.body.setAllowGravity(true);
      
      this.exhaust.frequency = 100;
      this.exhaust.speedX = { min: -20, max: -50 };

      trailTimer.remove(); 

      const currentBody = this.sprite.body;
      const isNowOnGround = currentBody.blocked.down || currentBody.touching.down;

      if (isNowOnGround) {
        this.isJumping = false;
      }
    });
  }

  onLand() {
    // Проверяем, были ли мы в прыжке/падении, чтобы не спамить пылью
    if (!this.isJumping) return;
    this.isJumping = false;
      this.sprite.x = this.baseX;
    this.sprite.y = Math.round(this.sprite.y);

    this.sprite.body.setOffset(5, 0);

    this.sprite.anims.stop();
    this.sprite.setTexture('player');

    const dust = this.scene.add.particles(this.sprite.x, this.sprite.y + 12, 'pixel-particle', {
      lifespan: 250,
      speedX: { min: -150, max: 150 }, 
      speedY: { min: -10, max: 10 },   
      scale: 1,
      quantity: 12, 
      emitting: false,
      tint: 0x67778D, 
      roundPixels: true
    }).setDepth(4);
    
    dust.explode(12);
    this.scene.time.delayedCall(500, () => dust.destroy());
  }

  die(cause = 'pit') {
    if (this.isDead) return;
    this.isDead = true;

    // Останавливаем левитацию и выхлоп
    if (this.hoverTimer) this.hoverTimer.remove();
    if (this.exhaust) this.exhaust.stop();

    // ВАЖНО: Отключаем физическое тело (оно просто перестает существовать для движка)
    this.sprite.body.enable = false; 

    // Включаем анимацию смерти
    this.sprite.play('death-anim');

    // Если смерть не на земле (удар об стену или падение в яму)
    if (cause === 'pit' || cause === 'wall') {
      // Плавно съезжаем вниз за экран (без использования физики)
      this.scene.tweens.add({
        targets: this.sprite,
        y: this.sprite.y + 300, // Улетает на 300 пикселей вниз
        duration: 1200,         // За 1.2 секунды
        ease: 'Linear'
      });
    }
    // Если cause === 'ground', мы ничего не делаем — он просто замирает на платформе
  }

  update() {
    const body = this.sprite.body;
    const onGround = body.blocked.down || body.touching.down;
    const goingUp = body.velocity.y < 0;

    if (this.isDashing) return;

    // ЗАЩИТА ХИТБОКСА: Если мы на земле, всегда сбрасываем offset
    if (onGround) {
      this.sprite.body.setOffset(5, 0);
    }

    // ПРИЗЕМЛЕНИЕ: Срабатывает, если мы падаем вниз и коснулись земли
    // (Даже если isJumping = false, например, если упали с края платформы)
    if (onGround && !goingUp) {
      if (this.isJumping || body.velocity.y > 0) { 
        // Если velocity.y > 0, значит мы только что упали на платформу
        if (this.isJumping || !this.wasOnGround) {
          this.onLand();
        }
      }
    }
    
    // Запоминаем, были ли мы на земле в прошлом кадре
    this.wasOnGround = onGround;
  }
}
