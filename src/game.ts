import type { Vector2D, Size, GameObject, GameState } from './types';

export class Player implements GameObject {
  position: Vector2D;
  size: Size = { width: 40, height: 40 };
  velocity: Vector2D = { x: 0, y: 0 };
  speed = 300;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.position = {
      x: canvasWidth / 2 - this.size.width / 2,
      y: canvasHeight - 70,
    };
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
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

  update(deltaTime: number): void {
    this.position.x += this.velocity.x * this.speed * deltaTime;
  }
}

export class Bullet implements GameObject {
  position: Vector2D;
  size: Size = { width: 4, height: 14 };
  velocity: Vector2D = { x: 0, y: -500 };
  active = true;

  constructor(x: number, y: number) {
    this.position = { x, y };
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#ff0055';
    ctx.fillRect(this.position.x, this.position.y, this.size.width, this.size.height);
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
    const radius = Math.random() * 15 + 15;
    this.size = { width: radius * 2, height: radius * 2 };
    this.position = {
      x: Math.random() * (canvasWidth - this.size.width),
      y: -this.size.height,
    };
    this.velocity = { x: (Math.random() - 0.5) * 50, y: Math.random() * 150 + 100 };
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#ffcc00';
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

  update(deltaTime: number): void {
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    if (this.position.y > 1000) this.active = false;
  }
}

export class GameEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  player: Player;
  bullets: Bullet[] = [];
  asteroids: Asteroid[] = [];
  
  score = 0;
  state: GameState = 'START';
  lastTime = 0;
  spawnTimer = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.player = new Player(this.canvas.width, this.canvas.height);
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
    const deltaTime = (time - this.lastTime) / 1000;
    this.lastTime = time;

    if (this.state === 'PLAYING') {
      this.update(deltaTime);
      this.render();
      requestAnimationFrame(this.loop);
    } else if (this.state === 'GAMEOVER') {
      this.renderGameOver();
    }
  };

  private update(deltaTime: number): void {
    this.player.update(deltaTime);

    if (this.player.position.x < 0) this.player.position.x = 0;
    if (this.player.position.x > this.canvas.width - this.player.size.width) {
      this.player.position.x = this.canvas.width - this.player.size.width;
    }

    this.spawnTimer += deltaTime;
    if (this.spawnTimer > 0.8) {
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

    this.player.draw(this.ctx);
    this.bullets.forEach(b => b.draw(this.ctx));
    this.asteroids.forEach(a => a.draw(this.ctx));

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '16px monospace';
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
    this.ctx.fillText(`Итог: ${this.score} очков`, this.canvas.width / 2, this.canvas.height / 2 + 20);
    this.ctx.fillText('Нажмите для старта', this.canvas.width / 2, this.canvas.height / 2 + 60);
  }
}
