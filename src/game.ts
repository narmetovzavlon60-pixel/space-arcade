export interface Vector2D {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface GameObject {
  position: Vector2D;
  size: Size;
}

export interface Upgrades {
  multishotLevel: number;
  shieldLevel: number;
}

export class Player implements GameObject {
  position: Vector2D;
  size: Size = { width: 36, height: 40 };
  velocity: Vector2D = { x: 0, y: 0 };
  speed = 320;
  hasShield = false;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.position = {
      x: canvasWidth / 2 - this.size.width / 2,
      y: canvasHeight - this.size.height - 20
    };
  }

  update(dt: number, canvasWidth: number) {
    this.position.x += this.velocity.x * this.speed * dt;
    
    // Ограничение движения в границах экрана
    if (this.position.x < 0) {
      this.position.x = 0;
    }
    if (this.position.x + this.size.width > canvasWidth) {
      this.position.x = canvasWidth - this.size.width;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();

    // Огонь двигателя
    ctx.fillStyle = '#ff9900';
    ctx.beginPath();
    ctx.moveTo(this.position.x + 12, this.position.y + this.size.height);
    ctx.lineTo(this.position.x + 18, this.position.y + this.size.height + 10 + Math.random() * 5);
    ctx.lineTo(this.position.x + 24, this.position.y + this.size.height);
    ctx.closePath();
    ctx.fill();

    // Защитное поле
    if (this.hasShield) {
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 3;
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#00ffff';
      ctx.beginPath();
      ctx.arc(
        this.position.x + this.size.width / 2,
        this.position.y + this.size.height / 2,
        28,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }

    // Корабль
    ctx.fillStyle = '#00ffcc';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00ffcc';
    ctx.beginPath();
    ctx.moveTo(this.position.x + this.size.width / 2, this.position.y);
    ctx.lineTo(this.position.x + this.size.width, this.position.y + this.size.height);
    ctx.lineTo(this.position.x, this.position.y + this.size.height);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

export class Bullet implements GameObject {
  position: Vector2D;
  size: Size = { width: 4, height: 16 };
  velocity: Vector2D;
  active = true;
  isEnemy = false;

  constructor(x: number, y: number, isEnemy = false, vx = 0, vy = -500) {
    this.position = { x, y };
    this.isEnemy = isEnemy;
    this.velocity = { x: vx, y: vy };
  }

  update(dt: number) {
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    if (this.position.y < -20 || this.position.y > 600) {
      this.active = false;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.fillStyle = this.isEnemy ? '#ff0055' : '#ffff00';
    ctx.shadowBlur = 8;
    ctx.shadowColor = ctx.fillStyle;
    ctx.fillRect(this.position.x, this.position.y, this.size.width, this.size.height);
    ctx.restore();
  }
}

export class Enemy implements GameObject {
  position: Vector2D;
  size: Size = { width: 32, height: 32 };
  speed = 120;
  hp: number;
  maxHp: number;
  type: string;
  isBoss: boolean;
  active = true;

  constructor(x: number, y: number, type = 'normal', isBoss = false, hp = 1) {
    this.position = { x, y };
    this.type = type;
    this.isBoss = isBoss;
    this.hp = hp;
    this.maxHp = hp;
    if (isBoss) {
      this.size = { width: 56, height: 56 };
      this.speed = 60;
    }
  }

  update(dt: number) {
    this.position.y += this.speed * dt;
    if (this.position.y > 500) {
      this.active = false;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.fillStyle = this.isBoss ? '#ff0055' : '#ff9900';
    ctx.shadowBlur = 10;
    ctx.shadowColor = ctx.fillStyle;
    
    ctx.beginPath();
    ctx.arc(
      this.position.x + this.size.width / 2,
      this.position.y + this.size.height / 2,
      this.size.width / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();

    if (this.isBoss) {
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(this.position.x, this.position.y - 10, this.size.width, 5);
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(this.position.x, this.position.y - 10, this.size.width * (this.hp / this.maxHp), 5);
    }

    ctx.restore();
  }
}

export class GameEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  player: Player;
  bullets: Bullet[] = [];
  enemies: Enemy[] = [];
  state: 'MENU' | 'PLAYING' | 'GAMEOVER' = 'MENU';
  score = 0;
  coins = 0;
  spawnTimer = 0;
  upgrades: Upgrades = {
    multishotLevel: 1,
    shieldLevel: 0
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.player = new Player(canvas.width, canvas.height);
  }

  init() {
    this.state = 'PLAYING';
    this.score = 0;
    this.coins = 50;
    this.enemies = [];
    this.bullets = [];
    this.start();
  }

  start() {
    let lastTime = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      this.update(dt);
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  shoot() {
    if (this.state !== 'PLAYING') return;

    const centerX = this.player.position.x + this.player.size.width / 2 - 2;
    const topY = this.player.position.y;

    if (this.upgrades.multishotLevel === 1) {
      this.bullets.push(new Bullet(centerX, topY));
    } else if (this.upgrades.multishotLevel === 2) {
      this.bullets.push(new Bullet(centerX - 8, topY));
      this.bullets.push(new Bullet(centerX + 8, topY));
    } else {
      this.bullets.push(new Bullet(centerX, topY));
      this.bullets.push(new Bullet(centerX - 12, topY, false, -100));
      this.bullets.push(new Bullet(centerX + 12, topY, false, 100));
    }
  }

  buyUpgrade(type: keyof Upgrades, cost: number): boolean {
    if (this.coins >= cost) {
      this.coins -= cost;
      this.upgrades[type]++;
      if (type === 'shieldLevel') {
        this.player.hasShield = true;
      }
      return true;
    }
    return false;
  }

  update(dt: number) {
    if (this.state !== 'PLAYING') return;

    // Обновляем позицию игрока
    this.player.update(dt, this.canvas.width);

    // Спавн врагов
    this.spawnTimer += dt;
    if (this.spawnTimer > 1.2) {
      this.spawnTimer = 0;
      const x = Math.random() * (this.canvas.width - 40);
      this.enemies.push(new Enemy(x, -40, 'normal', false, 1));
    }

    // Движение пуль и врагов
    this.bullets.forEach((b) => b.update(dt));
    this.enemies.forEach((e) => e.update(dt));

    // Фильтрация неактивных
    this.bullets = this.bullets.filter((b) => b.active);
    this.enemies = this.enemies.filter((e) => e.active);

    // Коллизии: Пули -> Враги
    for (const b of this.bullets) {
      for (const e of this.enemies) {
        if (b.active && e.active && this.checkCollision(b, e)) {
          b.active = false;
          e.hp--;
          if (e.hp <= 0) {
            e.active = false;
            this.score += 10;
            this.coins += 5;
          }
        }
      }
    }
  }

  checkCollision(a: GameObject, b: GameObject): boolean {
    return (
      a.position.x < b.position.x + b.size.width &&
      a.position.x + a.size.width > b.position.x &&
      a.position.y < b.position.y + b.size.height &&
      a.position.y + a.size.height > b.position.y
    );
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Рисуем интерфейс
    this.ctx.fillStyle = '#00ffcc';
    this.ctx.font = '14px sans-serif';
    this.ctx.fillText(`Счет: ${this.score}`, 10, 25);
    this.ctx.fillStyle = '#ffff00';
    this.ctx.fillText(`Монеты: $${this.coins}`, 10, 45);

    this.player.draw(this.ctx);
    this.bullets.forEach((b) => b.draw(this.ctx));
    this.enemies.forEach((e) => e.draw(this.ctx));
  }
}
