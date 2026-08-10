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

// Простая синтетическая аудиосистема на Web Audio API
class SoundManager {
  ctx: AudioContext | null = null;

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playLaser() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playExplosion() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(120, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  playPowerup() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }
}

export const sound = new SoundManager();

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
    if (this.position.x < 0) this.position.x = 0;
    if (this.position.x + this.size.width > canvasWidth) {
      this.position.x = canvasWidth - this.size.width;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();

    // Пламя
    ctx.fillStyle = '#ff9900';
    ctx.beginPath();
    ctx.moveTo(this.position.x + 12, this.position.y + this.size.height);
    ctx.lineTo(this.position.x + 18, this.position.y + this.size.height + 10 + Math.random() * 5);
    ctx.lineTo(this.position.x + 24, this.position.y + this.size.height);
    ctx.closePath();
    ctx.fill();

    // Щит
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

  constructor(x: number, y: number, vx = 0, vy = -500) {
    this.position = { x, y };
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
    ctx.fillStyle = '#ffff00';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#ffff00';
    ctx.fillRect(this.position.x, this.position.y, this.size.width, this.size.height);
    ctx.restore();
  }
}

export class Enemy implements GameObject {
  position: Vector2D;
  size: Size = { width: 32, height: 32 };
  speed: number;
  hp: number;
  maxHp: number;
  isBoss: boolean;
  active = true;

  constructor(x: number, y: number, speed = 120, isBoss = false, hp = 1) {
    this.position = { x, y };
    this.speed = speed;
    this.isBoss = isBoss;
    this.hp = hp;
    this.maxHp = hp;
    if (isBoss) {
      this.size = { width: 64, height: 64 };
    }
  }

  update(dt: number) {
    this.position.y += this.speed * dt;
    if (this.position.y > 520) {
      this.active = false;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    const cx = this.position.x + this.size.width / 2;
    const cy = this.position.y + this.size.height / 2;

    if (this.isBoss) {
      ctx.fillStyle = '#ff0055';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#ff0055';
      ctx.beginPath();
      ctx.moveTo(cx, cy + 32);
      ctx.lineTo(cx - 32, cy - 32);
      ctx.lineTo(cx + 32, cy - 32);
      ctx.closePath();
      ctx.fill();

      // Шкала здоровья
      ctx.fillStyle = '#333';
      ctx.fillRect(this.position.x, this.position.y - 12, this.size.width, 6);
      ctx.fillStyle = '#00ffcc';
      ctx.fillRect(this.position.x, this.position.y - 12, this.size.width * (this.hp / this.maxHp), 6);
    } else {
      ctx.fillStyle = '#ff5500';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#ff5500';
      ctx.fillRect(this.position.x, cy - 4, this.size.width, 8);
      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fill();
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
  state: 'MENU' | 'SHOP' | 'PLAYING' | 'GAMEOVER' = 'MENU';
  score = 0;
  level = 1;
  selectedLevel = 1;
  coins = 50;
  spawnTimer = 0;
  isLoopRunning = false;
  upgrades: Upgrades = {
    multishotLevel: 1,
    shieldLevel: 0
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.player = new Player(canvas.width, canvas.height);
    this.startLoop();
  }

  startLevel(lvl: number) {
    sound.init();
    this.level = lvl;
    this.selectedLevel = lvl;
    this.score = (lvl - 1) * 100;
    this.enemies = [];
    this.bullets = [];
    this.player = new Player(this.canvas.width, this.canvas.height);
    if (this.upgrades.shieldLevel > 0) this.player.hasShield = true;
    this.state = 'PLAYING';
  }

  openShop() {
    sound.init();
    this.state = 'SHOP';
  }

  openMenu() {
    this.state = 'MENU';
  }

  startLoop() {
    if (this.isLoopRunning) return;
    this.isLoopRunning = true;
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
    sound.init();

    if (this.state === 'MENU') {
      this.startLevel(1);
      return;
    }
    if (this.state === 'GAMEOVER') {
      this.state = 'MENU';
      return;
    }
    if (this.state !== 'PLAYING') return;

    sound.playLaser();
    const centerX = this.player.position.x + this.player.size.width / 2 - 2;
    const topY = this.player.position.y;

    if (this.upgrades.multishotLevel === 1) {
      this.bullets.push(new Bullet(centerX, topY));
    } else if (this.upgrades.multishotLevel === 2) {
      this.bullets.push(new Bullet(centerX - 8, topY));
      this.bullets.push(new Bullet(centerX + 8, topY));
    } else {
      this.bullets.push(new Bullet(centerX, topY));
      this.bullets.push(new Bullet(centerX - 12, topY, -100));
      this.bullets.push(new Bullet(centerX + 12, topY, 100));
    }
  }

  buyUpgrade(type: keyof Upgrades, cost: number): boolean {
    sound.init();
    if (this.coins >= cost) {
      this.coins -= cost;
      this.upgrades[type]++;
      if (type === 'shieldLevel') {
        this.player.hasShield = true;
      }
      sound.playPowerup();
      return true;
    }
    return false;
  }

  update(dt: number) {
    if (this.state !== 'PLAYING') return;

    this.player.update(dt, this.canvas.width);

    // Уровень рассчитывается от стартового + набранных очков
    const currentCalcLevel = Math.floor(this.score / 100) + 1;
    if (currentCalcLevel > this.level) {
      this.level = currentCalcLevel;
      sound.playPowerup();
      this.enemies.push(new Enemy(this.canvas.width / 2 - 32, -70, 40, true, 10 * this.level));
    }

    // Спавн обычных мобов (скорость строго зависит только от текущего уровня)
    this.spawnTimer += dt;
    const spawnRate = Math.max(0.5, 1.3 - this.level * 0.1);
    if (this.spawnTimer > spawnRate) {
      this.spawnTimer = 0;
      const x = Math.random() * (this.canvas.width - 40);
      const enemySpeed = 100 + this.level * 25;
      this.enemies.push(new Enemy(x, -40, enemySpeed, false, 1));
    }

    this.bullets.forEach((b) => b.update(dt));
    this.enemies.forEach((e) => e.update(dt));

    // Пули -> Враги
    for (const b of this.bullets) {
      for (const e of this.enemies) {
        if (b.active && e.active && this.checkCollision(b, e)) {
          b.active = false;
          e.hp--;
          if (e.hp <= 0) {
            e.active = false;
            sound.playExplosion();
            this.score += e.isBoss ? 50 : 10;
            this.coins += e.isBoss ? 25 : 5;
          }
        }
      }
    }

    // Враги -> Игрок
    for (const e of this.enemies) {
      if (e.active && this.checkCollision(e, this.player)) {
        e.active = false;
        sound.playExplosion();
        if (this.player.hasShield) {
          this.player.hasShield = false;
          this.upgrades.shieldLevel = 0;
        } else {
          this.state = 'GAMEOVER';
        }
      }
    }

    this.bullets = this.bullets.filter((b) => b.active);
    this.enemies = this.enemies.filter((e) => e.active);
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

    if (this.state === 'MENU') {
      this.renderMenu();
      return;
    }

    if (this.state === 'SHOP') {
      this.renderShop();
      return;
    }

    if (this.state === 'GAMEOVER') {
      this.ctx.fillStyle = '#ff0055';
      this.ctx.font = 'bold 22px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('ИГРА ОКОНЧАНА', this.canvas.width / 2, this.canvas.height / 2 - 20);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '14px sans-serif';
      this.ctx.fillText(`Счет: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
      this.ctx.fillText('Нажмите АТАКА для ВЫХОДА', this.canvas.width / 2, this.canvas.height / 2 + 40);
      this.ctx.textAlign = 'left';
      return;
    }

    // Игровой HUD
    this.ctx.fillStyle = '#00ffcc';
    this.ctx.font = '14px sans-serif';
    this.ctx.fillText(`Счет: ${this.score}`, 10, 25);
    this.ctx.fillText(`Уровень: ${this.level}`, 10, 45);
    this.ctx.fillStyle = '#ffff00';
    this.ctx.fillText(`Монеты: $${this.coins}`, 10, 65);

    this.player.draw(this.ctx);
    this.bullets.forEach((b) => b.draw(this.ctx));
    this.enemies.forEach((e) => e.draw(this.ctx));
  }

  renderMenu() {
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = '#00ffcc';
    this.ctx.font = 'bold 22px sans-serif';
    this.ctx.fillText('SPACE ARCADE', this.canvas.width / 2, 60);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '14px sans-serif';
    this.ctx.fillText(`Монеты: $${this.coins}`, this.canvas.width / 2, 90);

    this.ctx.fillText('ВЫБОР УРОВНЯ:', this.canvas.width / 2, 140);

    // Отрисовка плашек уровней
    for (let i = 1; i <= 3; i++) {
      const y = 160 + (i - 1) * 45;
      this.ctx.fillStyle = this.selectedLevel === i ? '#00ffcc' : '#1a2634';
      this.ctx.fillRect(this.canvas.width / 2 - 80, y, 160, 35);
      this.ctx.fillStyle = this.selectedLevel === i ? '#000' : '#fff';
      this.ctx.fillText(`Уровень ${i}`, this.canvas.width / 2, y + 22);
    }

    this.ctx.fillStyle = '#ff9900';
    this.ctx.fillRect(this.canvas.width / 2 - 80, 310, 160, 35);
    this.ctx.fillStyle = '#000';
    this.ctx.fillText('МАГАЗИН', this.canvas.width / 2, 332);

    this.ctx.fillStyle = '#888';
    this.ctx.font = '12px sans-serif';
    this.ctx.fillText('Нажмите АТАКА чтобы начать', this.canvas.width / 2, 380);

    this.ctx.textAlign = 'left';
  }

  renderShop() {
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = '#ff9900';
    this.ctx.font = 'bold 20px sans-serif';
    this.ctx.fillText('МАГАЗИН УПРАВЛЕНИЯ', this.canvas.width / 2, 50);

    this.ctx.fillStyle = '#ffff00';
    this.ctx.font = '14px sans-serif';
    this.ctx.fillText(`Баланс: $${this.coins}`, this.canvas.width / 2, 80);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText(`Оружие Lvl: ${this.upgrades.multishotLevel}`, this.canvas.width / 2, 130);
    this.ctx.fillText(`Щит: ${this.player.hasShield ? 'АКТИВЕН' : 'НЕТ'}`, this.canvas.width / 2, 170);

    this.ctx.fillStyle = '#00ffcc';
    this.ctx.fillRect(this.canvas.width / 2 - 80, 240, 160, 35);
    this.ctx.fillStyle = '#000';
    this.ctx.fillText('В МЕНЮ', this.canvas.width / 2, 262);

    this.ctx.textAlign = 'left';
  }

  handleCanvasClick(x: number, y: number) {
    sound.init();

    if (this.state === 'MENU') {
      // Выбор уровня
      for (let i = 1; i <= 3; i++) {
        const btnY = 160 + (i - 1) * 45;
        if (x >= this.canvas.width / 2 - 80 && x <= this.canvas.width / 2 + 80 && y >= btnY && y <= btnY + 35) {
          this.selectedLevel = i;
          this.startLevel(i);
          return;
        }
      }
      // Переход в магазин
      if (x >= this.canvas.width / 2 - 80 && x <= this.canvas.width / 2 + 80 && y >= 310 && y <= 310 + 35) {
        this.openShop();
        return;
      }
    }

    if (this.state === 'SHOP') {
      if (x >= this.canvas.width / 2 - 80 && x <= this.canvas.width / 2 + 80 && y >= 240 && y <= 240 + 35) {
        this.openMenu();
        return;
      }
    }
  }
}
