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
  speedLevel: number;
  maxHp: number;
  magnetRadius: number;
}

class SoftSoundManager {
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

  // Приятный синусоидальный бластер с плавной огибающей
  playLaser() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, this.ctx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(320, this.ctx.currentTime + 0.12);
    
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  // Мягкий объёмный взрыв
  playExplosion() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  // Мажорный аккорд/колокольчик при бонусе или победе
  playPowerup() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, index) => { // C5, E5, G5
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.05);
      
      gain.gain.setValueAtTime(0.05, now + index * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.05 + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + index * 0.05);
      osc.stop(now + index * 0.05 + 0.2);
    });
  }
}

export const sound = new SoftSoundManager();

export class Player implements GameObject {
  position: Vector2D;
  size: Size = { width: 36, height: 40 };
  velocity: Vector2D = { x: 0, y: 0 };
  speed = 300;
  hasShield = false;
  hp = 1;

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
    // Двигатель
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.moveTo(this.position.x + 12, this.position.y + this.size.height);
    ctx.lineTo(this.position.x + 18, this.position.y + this.size.height + 8 + Math.random() * 4);
    ctx.lineTo(this.position.x + 24, this.position.y + this.size.height);
    ctx.closePath();
    ctx.fill();

    // Щит
    if (this.hasShield) {
      ctx.strokeStyle = '#00ffcc';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00ffcc';
      ctx.beginPath();
      ctx.arc(this.position.x + this.size.width / 2, this.position.y + this.size.height / 2, 26, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Корпус
    ctx.fillStyle = '#00ffcc';
    ctx.shadowBlur = 8;
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
  size: Size = { width: 4, height: 14 };
  velocity: Vector2D;
  active = true;

  constructor(x: number, y: number, vx = 0, vy = -550) {
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
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#ffff00';
    ctx.fillRect(this.position.x, this.position.y, this.size.width, this.size.height);
    ctx.restore();
  }
}

export type EnemyType = 'FAST' | 'NORMAL' | 'HEAVY' | 'BOSS';

export class Enemy implements GameObject {
  position: Vector2D;
  size: Size;
  speed: number;
  hp: number;
  maxHp: number;
  type: EnemyType;
  active = true;

  constructor(x: number, y: number, type: EnemyType, level: number) {
    this.position = { x, y };
    this.type = type;

    switch (type) {
      case 'FAST':
        this.size = { width: 24, height: 24 };
        this.speed = 180 + level * 10;
        this.hp = 1;
        break;
      case 'HEAVY':
        this.size = { width: 42, height: 42 };
        this.speed = 70 + level * 5;
        this.hp = 3 + Math.floor(level / 3);
        break;
      case 'BOSS':
        this.size = { width: 68, height: 68 };
        this.speed = 35 + level * 2;
        this.hp = 15 + level * 10;
        break;
      case 'NORMAL':
      default:
        this.size = { width: 32, height: 32 };
        this.speed = 110 + level * 8;
        this.hp = 1 + Math.floor(level / 5);
        break;
    }
    this.maxHp = this.hp;
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

    if (this.type === 'BOSS') {
      ctx.fillStyle = '#ff0055';
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#ff0055';
      ctx.beginPath();
      ctx.moveTo(cx, cy + 34);
      ctx.lineTo(cx - 34, cy - 34);
      ctx.lineTo(cx + 34, cy - 34);
      ctx.closePath();
      ctx.fill();

      // HP Bar
      ctx.fillStyle = '#333';
      ctx.fillRect(this.position.x, this.position.y - 10, this.size.width, 5);
      ctx.fillStyle = '#00ffcc';
      ctx.fillRect(this.position.x, this.position.y - 10, this.size.width * (this.hp / this.maxHp), 5);
    } else if (this.type === 'HEAVY') {
      ctx.fillStyle = '#9900ff';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#9900ff';
      ctx.fillRect(this.position.x, this.position.y, this.size.width, this.size.height);
    } else if (this.type === 'FAST') {
      ctx.fillStyle = '#ffcc00';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#ffcc00';
      ctx.beginPath();
      ctx.moveTo(cx, cy + 12);
      ctx.lineTo(cx - 12, cy - 12);
      ctx.lineTo(cx + 12, cy - 12);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = '#ff5500';
      ctx.shadowBlur = 6;
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
  coins = 50;
  spawnTimer = 0;
  isLoopRunning = false;
  upgrades: Upgrades = {
    multishotLevel: 1,
    shieldLevel: 0,
    speedLevel: 1,
    maxHp: 1,
    magnetRadius: 0
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.player = new Player(canvas.width, canvas.height);
    this.startLoop();
  }

  startLevel(lvl: number) {
    sound.init();
    this.level = Math.min(Math.max(lvl, 1), 20);
    this.enemies = [];
    this.bullets = [];
    this.player = new Player(this.canvas.width, this.canvas.height);
    this.player.speed = 260 + this.upgrades.speedLevel * 40;
    this.player.hp = this.upgrades.maxHp;
    if (this.upgrades.shieldLevel > 0) this.player.hasShield = true;

    // Если босс-уровень (каждый 5-й)
    if (this.level % 5 === 0) {
      this.enemies.push(new Enemy(this.canvas.width / 2 - 34, -70, 'BOSS', this.level));
    }

    this.state = 'PLAYING';
    this.syncUI();
  }

  openShop() {
    sound.init();
    this.state = 'SHOP';
    this.syncUI();
  }

  openMenu() {
    this.state = 'MENU';
    this.syncUI();
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
      this.bullets.push(new Bullet(centerX - 12, topY, -120));
      this.bullets.push(new Bullet(centerX + 12, topY, 120));
    }
  }

  buyUpgrade(type: keyof Upgrades, cost: number): boolean {
    sound.init();
    if (this.coins >= cost) {
      this.coins -= cost;
      this.upgrades[type]++;
      if (type === 'shieldLevel') this.player.hasShield = true;
      if (type === 'maxHp') this.player.hp++;
      sound.playPowerup();
      this.syncUI();
      return true;
    }
    return false;
  }

  update(dt: number) {
    if (this.state !== 'PLAYING') return;

    this.player.update(dt, this.canvas.width);

    // Генерация мобов
    this.spawnTimer += dt;
    const spawnRate = Math.max(0.35, 1.2 - this.level * 0.04);
    if (this.spawnTimer > spawnRate) {
      this.spawnTimer = 0;
      const x = Math.random() * (this.canvas.width - 40);
      const rand = Math.random();
      
      let type: EnemyType = 'NORMAL';
      if (rand < 0.25) type = 'FAST';
      else if (rand < 0.45 && this.level > 2) type = 'HEAVY';

      this.enemies.push(new Enemy(x, -40, type, this.level));
    }

    this.bullets.forEach((b) => b.update(dt));
    this.enemies.forEach((e) => e.update(dt));

    // Попадания пуль
    for (const b of this.bullets) {
      for (const e of this.enemies) {
        if (b.active && e.active && this.checkCollision(b, e)) {
          b.active = false;
          e.hp--;
          if (e.hp <= 0) {
            e.active = false;
            sound.playExplosion();
            this.score += e.type === 'BOSS' ? 100 : 10;
            this.coins += e.type === 'BOSS' ? 30 : 3;
          }
        }
      }
    }

    // Столкновения с игроком
    for (const e of this.enemies) {
      if (e.active && this.checkCollision(e, this.player)) {
        e.active = false;
        sound.playExplosion();
        if (this.player.hasShield) {
          this.player.hasShield = false;
          this.upgrades.shieldLevel = 0;
        } else {
          this.player.hp--;
          if (this.player.hp <= 0) {
            this.state = 'GAMEOVER';
            this.syncUI();
          }
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
    if (this.state !== 'PLAYING') return;

    this.ctx.fillStyle = '#00ffcc';
    this.ctx.font = '13px sans-serif';
    this.ctx.fillText(`Счет: ${this.score}`, 10, 20);
    this.ctx.fillText(`Уровень: ${this.level} / 20`, 10, 36);
    this.ctx.fillText(`ХП: ${'❤️'.repeat(this.player.hp)}`, 10, 52);
    this.ctx.fillStyle = '#ffff00';
    this.ctx.fillText(`Монеты: $${this.coins}`, 10, 68);

    this.player.draw(this.ctx);
    this.bullets.forEach((b) => b.draw(this.ctx));
    this.enemies.forEach((e) => e.draw(this.ctx));
  }

  syncUI() {
    const menu = document.getElementById('menuScreen');
    const shop = document.getElementById('shopScreen');
    const gameOver = document.getElementById('gameOverScreen');

    if (menu) menu.classList.toggle('hidden', this.state !== 'MENU');
    if (shop) shop.classList.toggle('hidden', this.state !== 'SHOP');
    if (gameOver) gameOver.classList.toggle('hidden', this.state !== 'GAMEOVER');

    const menuCoins = document.getElementById('menuCoins');
    if (menuCoins) menuCoins.textContent = `Монеты: $${this.coins}`;

    const shopCoins = document.getElementById('shopCoins');
    if (shopCoins) shopCoins.textContent = `Баланс: $${this.coins}`;

    const finalScore = document.getElementById('finalScore');
    if (finalScore) finalScore.textContent = `Счет: ${this.score}`;

    const finalCoins = document.getElementById('finalCoins');
    if (finalCoins) finalCoins.textContent = `Монеты в кошельке: $${this.coins}`;

    // Обновляем ценники в магазине
    const gunCost = this.upgrades.multishotLevel * 30;
    const shopGunBtn = document.getElementById('shopGunBtn');
    if (shopGunBtn) shopGunBtn.textContent = `🔫 Пушка (lvl ${this.upgrades.multishotLevel}) - $${gunCost}`;

    const speedCost = this.upgrades.speedLevel * 25;
    const shopSpeedBtn = document.getElementById('shopSpeedBtn');
    if (shopSpeedBtn) shopSpeedBtn.textContent = `⚡ Двигатель (lvl ${this.upgrades.speedLevel}) - $${speedCost}`;

    const hpCost = this.upgrades.maxHp * 40;
    const shopHpBtn = document.getElementById('shopHpBtn');
    if (shopHpBtn) shopHpBtn.textContent = `❤️ Макс. ХП (${this.upgrades.maxHp}) - $${hpCost}`;
  }
}
