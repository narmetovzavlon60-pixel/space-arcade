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

export interface GameState {
  score: number;
  level: number;
  coins: number;
  multiShotLvl: number;
  hasShield: boolean;
}

export class Player implements GameObject {
  position: Vector2D;
  size: Size = { width: 36, height: 40 };
  velocity: Vector2D = { x: 0, y: 0 };
  speed = 340;
  hasShield = false;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.position = {
      x: canvasWidth / 2 - this.size.width / 2,
      y: canvasHeight - this.size.height - 20
    };
  }

  draw(ctx: CanvasRenderingContext2D) {
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

    // Корпус корабля
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

  constructor(x: number, y: number, isEnemy = false, vx = 0, vy = -600) {
    this.position = { x, y };
    this.isEnemy = isEnemy;
    this.velocity = { x: vx, y: vy };
  }

  update(dt: number) {
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.isEnemy ? '#ff0055' : '#ffff00';
    ctx.fillRect(this.position.x, this.position.y, this.size.width, this.size.height);
  }
}

export class Enemy implements GameObject {
  position: Vector2D;
  size: Size = { width: 32, height: 32 };
  hp: number;
  maxHp: number;
  type: string;
  isBoss: boolean;

  constructor(x: number, y: number, type = 'normal', isBoss = false, hp = 1) {
    this.position = { x, y };
    this.type = type;
    this.isBoss = isBoss;
    this.hp = hp;
    this.maxHp = hp;
    if (isBoss) {
      this.size = { width: 64, height: 64 };
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.fillStyle = this.isBoss ? '#ff0000' : '#ff5500';
    ctx.fillRect(this.position.x, this.position.y, this.size.width, this.size.height);
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
  coins = 100;
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
    this.start();
  }

  start() {
    const loop = () => {
      this.update();
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  shoot() {
    if (this.state !== 'PLAYING') return;
    const bullet = new Bullet(
      this.player.position.x + this.player.size.width / 2 - 2,
      this.player.position.y
    );
    this.bullets.push(bullet);
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

  update() {
    if (this.state !== 'PLAYING') return;
    this.bullets.forEach((b) => b.update(1 / 60));
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.player.draw(this.ctx);
    this.bullets.forEach((b) => b.draw(this.ctx));
  }
}
