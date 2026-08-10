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
}

export interface Quest {
  id: string;
  title: string;
  reward: number;
  progress: number;
  target: number;
  completed: boolean;
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

  playLaser() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(320, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playExplosion() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playLevelClear() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [440, 554.37, 659.25, 880].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.06, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.2);
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
    // Турбины
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.moveTo(this.position.x + 10, this.position.y + this.size.height);
    ctx.lineTo(this.position.x + 18, this.position.y + this.size.height + 8 + Math.random() * 4);
    ctx.lineTo(this.position.x + 26, this.position.y + this.size.height);
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

    // Истребитель
    ctx.fillStyle = '#00ffcc';
    ctx.shadowBlur = 8;
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
  animTimer = Math.random() * 10;

  constructor(x: number, y: number, type: EnemyType, level: number) {
    this.position = { x, y };
    this.type = type;

    switch (type) {
      case 'FAST':
        this.size = { width: 28, height: 28 };
        this.speed = 170 + level * 8;
        this.hp = 1;
        break;
      case 'HEAVY':
        this.size = { width: 44, height: 44 };
        this.speed = 65 + level * 4;
        this.hp = 3 + Math.floor(level / 2);
        break;
      case 'BOSS':
        this.size = { width: 72, height: 72 };
        this.speed = 30 + level * 2;
        this.hp = 12 + level * 8;
        break;
      case 'NORMAL':
      default:
        this.size = { width: 34, height: 34 };
        this.speed = 100 + level * 6;
        this.hp = 1 + Math.floor(level / 4);
        break;
    }
    this.maxHp = this.hp;
  }

  update(dt: number) {
    this.position.y += this.speed * dt;
    this.animTimer += dt * 5;
    if (this.position.y > 520) {
      this.active = false;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    const cx = this.position.x + this.size.width / 2;
    const cy = this.position.y + this.size.height / 2;
    const w = this.size.width;
    const h = this.size.height;

    if (this.type === 'BOSS') {
      // Флагманский босс
      ctx.fillStyle = '#ff0055';
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#ff0055';
      ctx.beginPath();
      ctx.moveTo(cx, cy + h / 2);
      ctx.lineTo(cx - w / 2, cy - h / 4);
      ctx.lineTo(cx - w / 3, cy - h / 2);
      ctx.lineTo(cx + w / 3, cy - h / 2);
      ctx.lineTo(cx + w / 2, cy - h / 4);
      ctx.closePath();
      ctx.fill();

      // Кабина
      ctx.fillStyle = '#00ffcc';
      ctx.fillRect(cx - 10, cy - 10, 20, 15);

      // HP Bar
      ctx.fillStyle = '#333';
      ctx.fillRect(this.position.x, this.position.y - 12, w, 5);
      ctx.fillStyle = '#00ffcc';
      ctx.fillRect(this.position.x, this.position.y - 12, w * (this.hp / this.maxHp), 5);
    } else if (this.type === 'HEAVY') {
      // Тяжелый крейсер
      ctx.fillStyle = '#aa00ff';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#aa00ff';
      ctx.beginPath();
      ctx.moveTo(cx, cy + h / 2);
      ctx.lineTo(cx - w / 2, cy);
      ctx.lineTo(cx - w / 2 + 6, cy - h / 2);
      ctx.lineTo(cx + w / 2 - 6, cy - h / 2);
      ctx.lineTo(cx + w / 2, cy);
      ctx.closePath();
      ctx.fill();
    } else if (this.type === 'FAST') {
      // Перехватчик
      ctx.fillStyle = '#ffcc00';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#ffcc00';
      ctx.beginPath();
      ctx.moveTo(cx, cy + h / 2);
      ctx.lineTo(cx - w / 2, cy - h / 2);
      ctx.lineTo(cx, cy - h / 4);
      ctx.lineTo(cx + w / 2, cy - h / 2);
      ctx.closePath();
      ctx.fill();
    } else {
      // Обычный разведчик
      ctx.fillStyle = '#ff5500';
      ctx.shadowBlur = 6;
      ctx.shadowColor = '#ff5500';
      ctx.beginPath();
      ctx.moveTo(cx, cy + h / 2);
      ctx.lineTo(cx - w / 2, cy - h / 3);
      ctx.lineTo(cx, cy - h / 2);
      ctx.lineTo(cx + w / 2, cy - h / 3);
      ctx.closePath();
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
  state: 'MENU' | 'SHOP' | 'QUESTS' | 'PLAYING' | 'GAMEOVER' = 'MENU';
  mode: 'CAMPAIGN' | 'ENDLESS' | 'BOSSRUN' = 'CAMPAIGN';
  score = 0;
  levelScore = 0; // Очки на текущем уровне
  level = 1;
  coins = 50;
  spawnTimer = 0;
  isLoopRunning = false;
  isLevelClearing = false;
  upgrades: Upgrades = {
    multishotLevel: 1,
    shieldLevel: 0,
    speedLevel: 1,
    maxHp: 1
  };
  quests: Quest[] = [
    { id: 'q1', title: 'Уничтожить 20 врагов', reward: 40, progress: 0, target: 20, completed: false },
    { id: 'q2', title: 'Набрать 500 очков', reward: 50, progress: 0, target: 500, completed: false },
    { id: 'q3', title: 'Пройти 3 уровня', reward: 60, progress: 0, target: 3, completed: false }
  ];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.player = new Player(canvas.width, canvas.height);
    this.startLoop();
  }

  setMode(mode: 'CAMPAIGN' | 'ENDLESS' | 'BOSSRUN') {
    this.mode = mode;
    this.syncUI();
  }

  startLevel(lvl: number) {
    sound.init();
    this.level = Math.min(Math.max(lvl, 1), 20);
    this.score = 0;
    this.levelScore = 0;
    this.enemies = [];
    this.bullets = [];
    this.isLevelClearing = false;

    this.player = new Player(this.canvas.width, this.canvas.height);
    this.player.speed = 260 + this.upgrades.speedLevel * 40;
    this.player.hp = this.upgrades.maxHp;
    if (this.upgrades.shieldLevel > 0) this.player.hasShield = true;

    if (this.mode === 'BOSSRUN' || (this.mode === 'CAMPAIGN' && this.level % 5 === 0)) {
      this.enemies.push(new Enemy(this.canvas.width / 2 - 36, -70, 'BOSS', this.level));
    }

    this.state = 'PLAYING';
    this.syncUI();
  }

  nextLevel() {
    if (this.level < 20) {
      this.level++;
      this.levelScore = 0;
      this.isLevelClearing = false;
      this.enemies = [];
      this.bullets = [];
      document.getElementById('levelClearOverlay')?.classList.add('hidden');
      if (this.mode === 'CAMPAIGN' && this.level % 5 === 0) {
        this.enemies.push(new Enemy(this.canvas.width / 2 - 36, -70, 'BOSS', this.level));
      }
      this.updateQuest('q3', 1);
    } else {
      this.state = 'GAMEOVER';
      this.syncUI();
    }
  }

  triggerLevelClear() {
    this.isLevelClearing = true;
    sound.playLevelClear();
    const overlay = document.getElementById('levelClearOverlay');
    const text = document.getElementById('levelClearText');
    if (overlay && text) {
      text.textContent = `Уровень ${this.level} завершен! Переход дальше...`;
      overlay.classList.remove('hidden');
    }
  }

  openShop() {
    sound.init();
    this.state = 'SHOP';
    this.syncUI();
  }

  openQuests() {
    sound.init();
    this.state = 'QUESTS';
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
    if (this.state !== 'PLAYING' || this.isLevelClearing) return;

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
      this.syncUI();
      return true;
    }
    return false;
  }

  updateQuest(id: string, amount: number) {
    const q = this.quests.find((item) => item.id === id);
    if (q && !q.completed) {
      q.progress += amount;
      if (q.progress >= q.target) {
        q.progress = q.target;
        q.completed = true;
        this.coins += q.reward;
      }
    }
  }

  update(dt: number) {
    if (this.state !== 'PLAYING' || this.isLevelClearing) return;

    this.player.update(dt, this.canvas.width);

    // Проверка перехода на следующий уровень в Кампании (каждые 200 очков)
    if (this.mode === 'CAMPAIGN' && this.levelScore >= 200) {
      this.triggerLevelClear();
      return;
    }

    // Генерация мобов
    this.spawnTimer += dt;
    const spawnRate = this.mode === 'BOSSRUN' ? 4 : Math.max(0.3, 1.1 - this.level * 0.04);
    if (this.spawnTimer > spawnRate) {
      this.spawnTimer = 0;
      const x = Math.random() * (this.canvas.width - 40);
      const rand = Math.random();

      let type: EnemyType = 'NORMAL';
      if (this.mode === 'BOSSRUN') {
        type = 'BOSS';
      } else {
        if (rand < 0.25) type = 'FAST';
        else if (rand < 0.45 && this.level > 2) type = 'HEAVY';
      }

      this.enemies.push(new Enemy(x, -40, type, this.level));
    }

    this.bullets.forEach((b) => b.update(dt));
    this.enemies.forEach((e) => e.update(dt));

    // Коллизия пуль
    for (const b of this.bullets) {
      for (const e of this.enemies) {
        if (b.active && e.active && this.checkCollision(b, e)) {
          b.active = false;
          e.hp--;
          if (e.hp <= 0) {
            e.active = false;
            sound.playExplosion();
            const gainScore = e.type === 'BOSS' ? 100 : 10;
            this.score += gainScore;
            this.levelScore += gainScore;
            this.coins += e.type === 'BOSS' ? 30 : 3;

            this.updateQuest('q1', 1);
            this.updateQuest('q2', gainScore);
          }
        }
      }
    }

    // Коллизия с игроком
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
    this.ctx.font = '12px sans-serif';
    this.ctx.fillText(`Счет: ${this.score}`, 10, 20);
    this.ctx.fillText(`Уровень: ${this.level} (${this.mode})`, 10, 36);
    if (this.mode === 'CAMPAIGN') {
      this.ctx.fillText(`Прогресс: ${this.levelScore} / 200`, 10, 52);
    }
    this.ctx.fillText(`ХП: ${'❤️'.repeat(Math.max(0, this.player.hp))}`, 10, 68);
    this.ctx.fillStyle = '#ffff00';
    this.ctx.fillText(`Монеты: $${this.coins}`, 10, 84);

    this.player.draw(this.ctx);
    this.bullets.forEach((b) => b.draw(this.ctx));
    this.enemies.forEach((e) => e.draw(this.ctx));
  }

  syncUI() {
    const menu = document.getElementById('menuScreen');
    const shop = document.getElementById('shopScreen');
    const quests = document.getElementById('questsScreen');
    const gameOver = document.getElementById('gameOverScreen');
    const overlay = document.getElementById('levelClearOverlay');

    if (menu) menu.classList.toggle('hidden', this.state !== 'MENU');
    if (shop) shop.classList.toggle('hidden', this.state !== 'SHOP');
    if (quests) quests.classList.toggle('hidden', this.state !== 'QUESTS');
    if (gameOver) gameOver.classList.toggle('hidden', this.state !== 'GAMEOVER');
    if (overlay && this.state !== 'PLAYING') overlay.classList.add('hidden');

    document.getElementById('modeCampaign')?.classList.toggle('active', this.mode === 'CAMPAIGN');
    document.getElementById('modeEndless')?.classList.toggle('active', this.mode === 'ENDLESS');
    document.getElementById('modeBossRun')?.classList.toggle('active', this.mode === 'BOSSRUN');

    const lvlSelectTitle = document.getElementById('lvlSelectTitle');
    const levelGrid = document.getElementById('levelGrid');
    if (lvlSelectTitle && levelGrid) {
      const showGrid = this.mode === 'CAMPAIGN';
      lvlSelectTitle.style.display = showGrid ? 'block' : 'none';
      levelGrid.style.display = showGrid ? 'grid' : 'none';
    }

    const menuCoins = document.getElementById('menuCoins');
    if (menuCoins) menuCoins.textContent = `Монеты: $${this.coins}`;

    const shopCoins = document.getElementById('shopCoins');
    if (shopCoins) shopCoins.textContent = `Баланс: $${this.coins}`;

    const finalScore = document.getElementById('finalScore');
    if (finalScore) finalScore.textContent = `Счет: ${this.score}`;

    const finalCoins = document.getElementById('finalCoins');
    if (finalCoins) finalCoins.textContent = `Баланс монет: $${this.coins}`;

    // Рендер квестов
    const questList = document.getElementById('questList');
    if (questList) {
      questList.innerHTML = '';
      this.quests.forEach((q) => {
        const div = document.createElement('div');
        div.className = `quest-item ${q.completed ? 'completed' : ''}`;
        div.innerHTML = `
          <div>
            <strong>${q.title}</strong><br/>
            <span>Прогресс: ${q.progress}/${q.target}</span>
          </div>
          <div style="color:#ffff00; font-weight:bold;">${q.completed ? 'ВЫПОЛНЕНО' : '+$' + q.reward}</div>
        `;
        questList.appendChild(div);
      });
    }

    // Обновление магазина
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
