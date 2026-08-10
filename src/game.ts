import type { Vector2D, Size, GameObject, GameState, Upgrades } from './types';

export class Player implements GameObject {
  position: Vector2D;
  size: Size = { width: 36, height: 40 };
  velocity: Vector2D = { x: 0, y: 0 };
  speed = 340;
  hasShield = false;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.position = {
      x: canvasWidth / 2 - this.size.width / 2,
      y: canvasHeight - 65,
    };
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    
    // Пламя двигателя
    ctx.fillStyle = '#ff9900';
    ctx.beginPath();
    ctx.moveTo(this.position.x + 12, this.position.y + this.size.height);
    ctx.lineTo(this.position.x + 18, this.position.y + this.size.height + 12 + Math.random() * 6);
    ctx.lineTo(this.position.x + 24, this.position.y + this.size.height);
    ctx.closePath();
    ctx.fill();

    // Защитный щит
    if (this.hasShield) {
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 3;
      ctx.shadowBlur = 10;
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

    // Корпус
    ctx.fillStyle = '#00ffcc';
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#00ffcc';
    ctx.beginPath();
    ctx.moveTo(this.position.x + this.size.width / 2, this.position.y);
    ctx.lineTo(this.position.x + this.size.width, this.position.y + this.size.height);
    ctx.lineTo(this.position.x + this.size.width / 2, this.position.y + this.size.height - 8);
    ctx.lineTo(this.position.x, this.position.y + this.size.height);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  update(deltaTime: number): void {
    this.position.x += this.velocity.x * this.speed * deltaTime;
  }
}

export class Bullet implements GameObject {
  position: Vector2D;
  size: Size = { width: 4, height: 16 };
  velocity: Vector2D;
  active = true;
  isEnemy = false;

  constructor(x: number, y: number, vx = 0, vy = -650, isEnemy = false) {
    this.position = { x, y };
    this.velocity = { x: vx, y: vy };
    this.isEnemy = isEnemy;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.fillStyle = this.isEnemy ? '#ff0000' : '#ff0055';
    ctx.shadowBlur = 8;
    ctx.shadowColor = this.isEnemy ? '#ff0000' : '#ff0055';
    ctx.fillRect(this.position.x, this.position.y, this.size.width, this.size.height);
    ctx.restore();
  }

  update(deltaTime: number): void {
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    if (this.position.y < -20 || this.position.y > 700) this.active = false;
  }
}

export class Enemy implements GameObject {
  position: Vector2D;
  size: Size;
  velocity: Vector2D;
  active = true;
  hp: number;
  maxHp: number;
  type: 'asteroid' | 'drone' | 'boss';

  constructor(canvasWidth: number, level: number, forceType?: 'boss') {
    if (forceType === 'boss') {
      this.type = 'boss';
      this.size = { width: 90, height: 70 };
      this.position = { x: canvasWidth / 2 - 45, y: -80 };
      this.velocity = { x: 120, y: 80 };
      this.hp = 30 + level * 20;
      this.maxHp = this.hp;
      return;
    }

    const isDrone = Math.random() > 0.6;
    this.type = isDrone ? 'drone' : 'asteroid';

    if (this.type === 'drone') {
      this.size = { width: 32, height: 32 };
      this.hp = 1;
      this.velocity = { x: (Math.random() - 0.5) * 120, y: 180 + level * 15 };
    } else {
      const radius = Math.random() * 12 + 14;
      this.size = { width: radius * 2, height: radius * 2 };
      this.hp = radius > 20 ? 2 : 1;
      this.velocity = { x: (Math.random() - 0.5) * 50, y: 120 + level * 20 };
    }
    this.maxHp = this.hp;

    this.position = {
      x: Math.random() * (canvasWidth - this.size.width),
      y: -this.size.height,
    };
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    if (this.type === 'boss') {
      // Отрисовка флагмана Босса
      ctx.fillStyle = '#ff0033';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#ff0033';
      ctx.beginPath();
      ctx.moveTo(this.position.x + this.size.width / 2, this.position.y + this.size.height);
      ctx.lineTo(this.position.x + this.size.width, this.position.y);
      ctx.lineTo(this.position.x, this.position.y);
      ctx.closePath();
      ctx.fill();

      // Шкала HP босса
      ctx.fillStyle = '#333';
      ctx.fillRect(this.position.x, this.position.y - 12, this.size.width, 6);
      ctx.fillStyle = '#00ffcc';
      ctx.fillRect(this.position.x, this.position.y - 12, (this.size.width * (this.hp / this.maxHp)), 6);

    } else if (this.type === 'drone') {
      ctx.fillStyle = '#a855f7';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#a855f7';
      ctx.fillRect(this.position.x, this.position.y, this.size.width, this.size.height);
    } else {
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(
        this.position.x + this.size.width / 2,
        this.position.y + this.size.height / 2,
        this.size.width / 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    ctx.restore();
  }

  update(deltaTime: number, canvasWidth: number): void {
    if (this.type === 'boss') {
      if (this.position.y < 40) {
        this.position.y += this.velocity.y * deltaTime;
      } else {
        this.position.x += this.velocity.x * deltaTime;
        if (this.position.x <= 10 || this.position.x + this.size.width >= canvasWidth - 10) {
          this.velocity.x *= -1;
        }
      }
      return;
    }

    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    if (this.position.y > 600) this.active = false;
  }
}

interface Star {
  x: number;
  y: number;
  speed: number;
  size: number;
}

export class GameEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  player: Player;
  bullets: Bullet[] = [];
  enemies: Enemy[] = [];
  stars: Star[] = [];
  
  score = 0;
  coins = 0;
  level = 1;
  state: GameState = 'START';
  lastTime = 0;
  spawnTimer = 0;
  bossShootTimer = 0;
  hasBossSpawned = false;

  upgrades: Upgrades = {
    fireRateLevel: 1,
    multishotLevel: 1,
    shieldLevel: 0,
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.player = new Player(this.canvas.width, this.canvas.height);

    for (let i = 0; i < 45; i++) {
      this.stars.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        speed: Math.random() * 80 + 20,
        size: Math.random() * 2 + 1,
      });
    }
  }

  public init(): void {
    this.lastTime = performance.now();
    requestAnimationFrame(this.renderStartScreen);
  }

  public start(): void {
    this.state = 'PLAYING';
    this.score = 0;
    this.level = 1;
    this.bullets = [];
    this.enemies = [];
    this.hasBossSpawned = false;
    this.player = new Player(this.canvas.width, this.canvas.height);
    this.player.hasShield = this.upgrades.shieldLevel > 0;
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop);
  }

  public shoot(): void {
    if (this.state !== 'PLAYING') return;

    const px = this.player.position.x + this.player.size.width / 2 - 2;
    const py = this.player.position.y;

    if (this.upgrades.multishotLevel === 1) {
      this.bullets.push(new Bullet(px, py));
    } else if (this.upgrades.multishotLevel === 2) {
      this.bullets.push(new Bullet(px - 8, py));
      this.bullets.push(new Bullet(px + 8, py));
    } else {
      this.bullets.push(new Bullet(px, py));
      this.bullets.push(new Bullet(px - 10, py, -80, -600));
      this.bullets.push(new Bullet(px + 10, py, 80, -600));
    }
  }

  public buyUpgrade(type: keyof Upgrades, cost: number): boolean {
    if (this.coins >= cost) {
      this.coins -= cost;
      this.upgrades[type]++;
      if (type === 'shieldLevel') this.player.hasShield = true;
      return true;
    }
    return false;
  }

  private loop = (time: number): void => {
    const deltaTime = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    if (this.state === 'PLAYING') {
      this.update(deltaTime);
      this.render();
      requestAnimationFrame(this.loop);
    } else if (this.state === 'GAMEOVER') {
      this.renderGameOver();
    }
  };

  private renderStartScreen = (time: number): void => {
    const deltaTime = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    if (this.state === 'START') {
      this.updateStars(deltaTime);
      this.ctx.fillStyle = '#0a0a12';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.drawStars();
      this.player.draw(this.ctx);

      this.ctx.fillStyle = '#00ffcc';
      this.ctx.font = 'bold 22px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('SPACE ARCADE 2.0', this.canvas.width / 2, this.canvas.height / 2 - 40);

      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '14px monospace';
      this.ctx.fillText('ТАПНИТЕ ДЛЯ СТАРТА', this.canvas.width / 2, this.canvas.height / 2 + 20);

      requestAnimationFrame(this.renderStartScreen);
    }
  };

  private updateStars(deltaTime: number): void {
    this.stars.forEach(star => {
      star.y += star.speed * deltaTime;
      if (star.y > this.canvas.height) {
        star.y = 0;
        star.x = Math.random() * this.canvas.width;
      }
    });
  }

  private drawStars(): void {
    this.ctx.fillStyle = '#ffffff';
    this.stars.forEach(star => {
      this.ctx.fillRect(star.x, star.y, star.size, star.size);
    });
  }

  private update(deltaTime: number): void {
    this.updateStars(deltaTime);
    this.player.update(deltaTime);

    if (this.player.position.x < 0) this.player.position.x = 0;
    if (this.player.position.x > this.canvas.width - this.player.size.width) {
      this.player.position.x = this.canvas.width - this.player.size.width;
    }

    // Рост уровня по очкам (до 10 уровня)
    const targetLevel = Math.min(Math.floor(this.score / 150) + 1, 10);
    if (targetLevel !== this.level) {
      this.level = targetLevel;
      this.hasBossSpawned = false;
    }

    // Боссы на 5 и 10 уровнях
    if ((this.level === 5 || this.level === 10) && !this.hasBossSpawned) {
      this.enemies.push(new Enemy(this.canvas.width, this.level, 'boss'));
      this.hasBossSpawned = true;
    }

    // Спавн рядовых врагов
    this.spawnTimer += deltaTime;
    const spawnRate = Math.max(0.7 - this.level * 0.05, 0.25);
    if (this.spawnTimer > spawnRate && (!this.hasBossSpawned || this.enemies.filter(e => e.type === 'boss').length === 0)) {
      this.enemies.push(new Enemy(this.canvas.width, this.level));
      this.spawnTimer = 0;
    }

    // Атака Босса
    const boss = this.enemies.find(e => e.type === 'boss');
    if (boss) {
      this.bossShootTimer += deltaTime;
      if (this.bossShootTimer > 1.2) {
        const bx = boss.position.x + boss.size.width / 2 - 2;
        const by = boss.position.y + boss.size.height;
        this.bullets.push(new Bullet(bx, by, 0, 320, true));
        this.bossShootTimer = 0;
      }
    }

    this.bullets.forEach(b => b.update(deltaTime));
    this.enemies.forEach(e => e.update(deltaTime, this.canvas.width));

    this.bullets = this.bullets.filter(b => b.active);
    this.enemies = this.enemies.filter(e => e.active);

    // Столкновения пуль с врагами
    this.bullets.forEach(bullet => {
      if (bullet.isEnemy) {
        if (this.checkCollision(bullet, this.player)) {
          bullet.active = false;
          this.handlePlayerHit();
        }
        return;
      }

      this.enemies.forEach(enemy => {
        if (this.checkCollision(bullet, enemy)) {
          bullet.active = false;
          enemy.hp--;
          if (enemy.hp <= 0) {
            enemy.active = false;
            this.score += enemy.type === 'boss' ? 200 : 15;
            this.coins += enemy.type === 'boss' ? 50 : 5;
          }
        }
      });
    });

    // Столкновение игрока с врагами
    this.enemies.forEach(enemy => {
      if (this.checkCollision(this.player, enemy)) {
        if (enemy.type !== 'boss') enemy.active = false;
        this.handlePlayerHit();
      }
    });
  }

  private handlePlayerHit(): void {
    if (this.player.hasShield) {
      this.player.hasShield = false;
      this.upgrades.shieldLevel = 0;
    } else {
      this.state = 'GAMEOVER';
    }
  }

  private checkCollision(a: GameObject, b: GameObject): boolean {
    return (
      a.position.x < b.position.x + b.size.width &&
      a.position.x + a.size.width > b.position.x &&
      a.position.y < b.position.y + b.size.height &&
      a.position.y + a.size.height > b.position.y
    );
  }

  private render(): void {
    this.ctx.fillStyle = '#0a0a12';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawStars();
    this.player.draw(this.ctx);
    this.bullets.forEach(b => b.draw(this.ctx));
    this.enemies.forEach(e => e.draw(this.ctx));

    // Интерфейс (HUD)
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 14px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`СЧЕТ: ${this.score}`, 12, 25);
    this.ctx.fillText(`УРОВЕНЬ: ${this.level}`, 12, 45);

    this.ctx.fillStyle = '#eab308';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`МОНЕТЫ: $${this.coins}`, this.canvas.width - 12, 25);
  }

  private renderGameOver(): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#ff0055';
    this.ctx.font = 'bold 24px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 30);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '14px monospace';
    this.ctx.fillText(`Уровень: ${this.level}  |  Очки: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
    this.ctx.fillText(`Монет собрано: $${this.coins}`, this.canvas.width / 2, this.canvas.height / 2 + 35);
    
    this.ctx.fillStyle = '#00ffcc';
    this.ctx.fillText('НАЖМИТЕ ДЛЯ СТАРТА', this.canvas.width / 2, this.canvas.height / 2 + 75);
  }
}
