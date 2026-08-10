import type { Vector2D, Size, GameObject, GameState } from './types';

export class Player implements GameObject {
  position: Vector2D;
  size: Size = { width: 36, height: 40 };
  velocity: Vector2D = { x: 0, y: 0 };
  speed = 320;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.position = {
      x: canvasWidth / 2 - this.size.width / 2,
      y: canvasHeight - 65,
    };
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    
    // Сопло / пламя двигателя
    ctx.fillStyle = '#ff9900';
    ctx.beginPath();
    ctx.moveTo(this.position.x + 12, this.position.y + this.size.height);
    ctx.lineTo(this.position.x + 18, this.position.y + this.size.height + 10 + Math.random() * 5);
    ctx.lineTo(this.position.x + 24, this.position.y + this.size.height);
    ctx.closePath();
    ctx.fill();

    // Корпус корабля
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
  velocity: Vector2D = { x: 0, y: -600 };
  active = true;

  constructor(x: number, y: number) {
    this.position = { x, y };
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.fillStyle = '#ff0055';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#ff0055';
    ctx.fillRect(this.position.x, this.position.y, this.size.width, this.size.height);
    ctx.restore();
  }

  update(deltaTime: number): void {
    this.position.y += this.velocity.y * deltaTime;
    if (this.position.y < -20) this.active = false;
  }
}

export class Asteroid implements GameObject {
  position: Vector2D;
  size: Size;
  velocity: Vector2D;
  active = true;

  constructor(canvasWidth: number) {
    const radius = Math.random() * 14 + 14;
    this.size = { width: radius * 2, height: radius * 2 };
    this.position = {
      x: Math.random() * (canvasWidth - this.size.width),
      y: -this.size.height,
    };
    this.velocity = { 
      x: (Math.random() - 0.5) * 60, 
      y: Math.random() * 120 + 130 
    };
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.fillStyle = '#ffcc00';
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#ffcc00';
    ctx.beginPath();
    ctx.arc(
      this.position.x + this.size.width / 2,
      this.position.y + this.size.height / 2,
      this.size.width / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();
  }

  update(deltaTime: number): void {
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
  asteroids: Asteroid[] = [];
  stars: Star[] = [];
  
  score = 0;
  state: GameState = 'START';
  lastTime = 0;
  spawnTimer = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.player = new Player(this.canvas.width, this.canvas.height);

    for (let i = 0; i < 40; i++) {
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
    this.bullets = [];
    this.asteroids = [];
    this.player = new Player(this.canvas.width, this.canvas.height);
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop);
  }

  public shoot(): void {
    if (this.state !== 'PLAYING') return;
    const bulletX = this.player.position.x + this.player.size.width / 2 - 2;
    this.bullets.push(new Bullet(bulletX, this.player.position.y));
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
      this.ctx.fillText('SPACE ARCADE', this.canvas.width / 2, this.canvas.height / 2 - 40);

      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '14px monospace';
      this.ctx.fillText('НАЖМИТЕ НА ЭКРАН', this.canvas.width / 2, this.canvas.height / 2 + 20);
      this.ctx.fillText('ДЛЯ СТАРТА', this.canvas.width / 2, this.canvas.height / 2 + 45);

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

    this.spawnTimer += deltaTime;
    if (this.spawnTimer > 0.7) {
      this.asteroids.push(new Asteroid(this.canvas.width));
      this.spawnTimer = 0;
    }

    this.bullets.forEach(b => b.update(deltaTime));
    this.asteroids.forEach(a => a.update(deltaTime));

    this.bullets = this.bullets.filter(b => b.active);
    this.asteroids = this.asteroids.filter(a => a.active);

    this.bullets.forEach(bullet => {
      this.asteroids.forEach(asteroid => {
        if (this.checkCollision(bullet, asteroid)) {
          bullet.active = false;
          asteroid.active = false;
          this.score += 10;
        }
      });
    });

    this.asteroids.forEach(asteroid => {
      if (this.checkCollision(this.player, asteroid)) {
        this.state = 'GAMEOVER';
      }
    });
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
    this.asteroids.forEach(a => a.draw(this.ctx));

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 16px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`СЧЕТ: ${this.score}`, 15, 30);
  }

  private renderGameOver(): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#ff0055';
    this.ctx.font = 'bold 24px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 20);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '16px monospace';
    this.ctx.fillText(`Очки: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
    this.ctx.fillText('Нажмите для старта', this.canvas.width / 2, this.canvas.height / 2 + 60);
  }
}
