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
  multishotLevel: number; // 1: Одинарная, 2: Двойная, 3: Тройная веером, 4: Квадро, 5: Плазменный залп, 6: Овердрайв
  shieldLevel: number;
  speedLevel: number;
  maxHp: number;
  hasLaser: boolean;
}

export interface Quest {
  id: string;
  title: string;
  difficulty: 'Легкий' | 'Средний' | 'Сложный';
  rewardType: 'coins' | 'skin';
  rewardValue: number | string; // сумма монет или id скина
  progress: number;
  target: number;
  completed: boolean;
}

export interface ShipSkin {
  id: string;
  name: string;
  color: string;
  accentColor: string;
  unlocked: boolean;
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
    osc.frequency.exponentialRampToValueAtTime(320, this.ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  playExplosion() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(25, this.ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.18);
  }

  playLevelClear() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      gain.gain.setValueAtTime(0.05, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.18);
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
  skinColor = '#00ffcc';
  accentColor = '#00ffff';

  constructor(canvasWidth: number, canvasHeight: number, skin: ShipSkin) {
    this.position = {
      x: canvasWidth / 2 - this.size.width / 2,
      y: canvasHeight - this.size.height - 20
    };
    this.skinColor = skin.color;
    this.accentColor = skin.accentColor;
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
    const cx = this.position.x + this.size.width / 2;
    const cy = this.position.y + this.size.height / 2;

    // Пламя двигателей с анимацией
    ctx.fillStyle = this.accentColor;
    ctx.beginPath();
    ctx.moveTo(this.position.x + 10, this.position.y + this.size.height);
    ctx.lineTo(cx, this.position.y + this.size.height + 10 + Math.random() * 6);
    ctx.lineTo(this.position.x + 26, this.position.y + this.size.height);
    ctx.closePath();
    ctx.fill();

    // Щит
    if (this.hasShield) {
      ctx.strokeStyle = '#00ffcc';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#00ffcc';
      ctx.beginPath();
      ctx.arc(cx, cy, 28, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Детализированный корпус корабля по скину
    ctx.fillStyle = this.skinColor;
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.skinColor;
    ctx.beginPath();
    ctx.moveTo(cx, this.position.y);
    ctx.lineTo(this.position.x + this.size.width, cy + 10);
    ctx.lineTo(this.position.x + this.size.width - 6, this.position.y + this.size.height);
    ctx.lineTo(cx, this.position.y + this.size.height - 6);
    ctx.lineTo(this.position.x + 6, this.position.y + this.size.height);
    ctx.lineTo(this.position.x, cy + 10);
    ctx.closePath();
    ctx.fill();

    // Кабина
    ctx.fillStyle = this.accentColor;
    ctx.fillRect(cx - 4, cy - 4, 8, 14);

    ctx.restore();
  }
}

export class Bullet implements GameObject {
  position: Vector2D;
  size: Size = { width: 5, height: 16 };
  velocity: Vector2D;
  active = true;
  isLaser = false;

  constructor(x: number, y: number, vx = 0, vy = -600, isLaser = false) {
    this.position = { x, y };
    this.velocity = { x: vx, y: vy };
    this.isLaser = isLaser;
    if (isLaser) {
      this.size = { width: 6, height: 28 };
    }
  }

  update(dt: number) {
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    if (this.position.y < -30 || this.position.y > 520) {
      this.active = false;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.fillStyle = this.isLaser ? '#ff0055' : '#ffff00';
    ctx.shadowBlur = 8;
    ctx.shadowColor = this.isLaser ? '#ff0055' : '#ffff00';
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
        this.size = { width: 30, height: 30 };
        this.speed = 190 + level * 7;
        this.hp = 1;
        break;
      case 'HEAVY':
        this.size = { width: 46, height: 46 };
        this.speed = 70 + level * 4;
        this.hp = 4 + Math.floor(level / 2);
        break;
      case 'BOSS':
        this.size = { width: 76, height: 76 };
        this.speed = 35 + level * 2;
        this.hp = 15 + level * 10;
        break;
      case 'NORMAL':
      default:
        this.size = { width: 36, height: 36 };
        this.speed = 110 + level * 5;
        this.hp = 2 + Math.floor(level / 3);
        break;
    }
    this.maxHp = this.hp;
  }

  update(dt: number) {
    this.position.y += this.speed * dt;
    this.animTimer += dt * 6;
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
      // Продвинутый дизайн Босса
      ctx.fillStyle = '#ff0055';
      ctx.shadowBlur = 14;
      ctx.shadowColor = '#ff0055';
      ctx.beginPath();
      ctx.moveTo(cx, cy + h / 2);
      ctx.lineTo(cx - w / 2, cy - h / 4);
      ctx.lineTo(cx - w / 3, cy - h / 2);
      ctx.lineTo(cx + w / 3, cy - h / 2);
      ctx.lineTo(cx + w / 2, cy - h / 4);
      ctx.closePath();
      ctx.fill();

      // Детали брони и пульсирующий реактор
      ctx.fillStyle = '#111';
      ctx.fillRect(cx - 16, cy - 8, 32, 16);
      ctx.fillStyle = Math.sin(this.animTimer * 4) > 0 ? '#00ffcc' : '#ffff00';
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();

      // HP Bar
      ctx.fillStyle = '#333';
      ctx.fillRect(this.position.x, this.position.y - 12, w, 5);
      ctx.fillStyle = '#00ffcc';
      ctx.fillRect(this.position.x, this.position.y - 12, w * (this.hp / this.maxHp), 5);
    } else if (this.type === 'HEAVY') {
      // Тяжелый истребитель с крыльями
      ctx.fillStyle = '#aa00ff';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#aa00ff';
      ctx.beginPath();
      ctx.moveTo(cx, cy + h / 2);
      ctx.lineTo(cx - w / 2, cy - h / 4);
      ctx.lineTo(cx - w / 3, cy - h / 2);
      ctx.lineTo(cx + w / 3, cy - h / 2);
      ctx.lineTo(cx + w / 2, cy - h / 4);
      ctx.closePath();
      ctx.fill();

      // Окна кабины
      ctx.fillStyle = '#ffff00';
      ctx.fillRect(cx - 4, cy - 6, 8, 8);
    } else if (this.type === 'FAST') {
      // Стреловидный перехватчик
      ctx.fillStyle = '#ff9900';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#ff9900';
      ctx.beginPath();
      ctx.moveTo(cx, cy + h / 2);
      ctx.lineTo(cx - w / 2, cy - h / 2);
      ctx.lineTo(cx, cy - h / 4);
      ctx.lineTo(cx + w / 2, cy - h / 2);
      ctx.closePath();
      ctx.fill();
    } else {
      // Тактический дрон
      ctx.fillStyle = '#00aaff';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#00aaff';
      ctx.beginPath();
      ctx.moveTo(cx, cy + h / 2);
      ctx.lineTo(cx - w / 2, cy);
      ctx.lineTo(cx, cy - h / 2);
      ctx.lineTo(cx + w / 2, cy);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.fillRect(cx - 3, cy - 3, 6, 6);
    }

    ctx.restore();
  }
}

export class GameEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  player!: Player;
  bullets: Bullet[] = [];
  enemies: Enemy[] = [];
  state: 'MENU' | 'SHOP' | 'QUESTS' | 'CUSTOM' | 'PLAYING' | 'GAMEOVER' = 'MENU';
  mode: 'CAMPAIGN' | 'ENDLESS' | 'BOSSRUN' = 'CAMPAIGN';
  score = 0;
  levelScore = 0;
  level = 1;
  coins = 120;
  spawnTimer = 0;
  isLoopRunning = false;
  isLevelClearing = false;
  theme: 'space' | 'cyber' | 'matrix' = 'space';

  upgrades: Upgrades = {
    multishotLevel: 1,
    shieldLevel: 0,
    speedLevel: 1,
    maxHp: 1,
    hasLaser: false
  };

  skins: ShipSkin[] = [
    { id: 'default', name: 'Стандарт (Бирюза)', color: '#00ffcc', accentColor: '#00ffff', unlocked: true },
    { id: 'ruby', name: 'Рубиновый штурмовик', color: '#ff0055', accentColor: '#ff9900', unlocked: false },
    { id: 'gold', name: 'Золотой флагман', color: '#ffcc00', accentColor: '#ffffff', unlocked: false },
    { id: 'shadow', name: 'Призрачный теневой', color: '#8800ff', accentColor: '#00ffcc', unlocked: false }
  ];
  selectedSkinId = 'default';

  quests: Quest[] = [
    { id: 'q1', title: 'Уничтожить 15 врагов', difficulty: 'Легкий', rewardType: 'coins', rewardValue: 40, progress: 0, target: 15, completed: false },
    { id: 'q2', title: 'Набрать 300 очков', difficulty: 'Средний', rewardType: 'coins', rewardValue: 70, progress: 0, target: 300, completed: false },
    { id: 'q3', title: 'Пройти 3 уровня кампании', difficulty: 'Средний', rewardType: 'coins', rewardValue: 90, progress: 0, target: 3, completed: false },
    { id: 'q4', title: 'Уничтожить 3 Босса', difficulty: 'Сложный', rewardType: 'skin', rewardValue: 'ruby', progress: 0, target: 3, completed: false },
    { id: 'q5', title: 'Набрать 1000 очков в Endless', difficulty: 'Сложный', rewardType: 'skin', rewardValue: 'gold', progress: 0, target: 1000, completed: false }
  ];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.initPlayer();
    this.startLoop();
  }

  initPlayer() {
    const skin = this.skins.find((s) => s.id === this.selectedSkinId) || this.skins[0];
    this.player = new Player(this.canvas.width, this.canvas.height, skin);
  }

  setMode(mode: 'CAMPAIGN' | 'ENDLESS' | 'BOSSRUN') {
    this.mode = mode;
    this.syncUI();
  }

  setTheme(theme: 'space' | 'cyber' | 'matrix') {
    this.theme = theme;
    this.syncUI();
  }

  selectSkin(id: string) {
    const skin = this.skins.find((s) => s.id === id);
    if (skin && skin.unlocked) {
      this.selectedSkinId = id;
      this.initPlayer();
      this.syncUI();
    }
  }

  startSelectedMode() {
    this.startLevel(this.level);
  }

  startLevel(lvl: number) {
    sound.init();
    this.level = Math.min(Math.max(lvl, 1), 20);
    this.score = 0;
    this.levelScore = 0;
    this.enemies = [];
    this.bullets = [];
    this.isLevelClearing = false;

    this.initPlayer();
    this.player.speed = 260 + this.upgrades.speedLevel * 35;
    this.player.hp = this.upgrades.maxHp;
    if (this.upgrades.shieldLevel > 0) this.player.hasShield = true;

    if (this.mode === 'BOSSRUN' || (this.mode === 'CAMPAIGN' && this.level % 5 === 0)) {
      this.enemies.push(new Enemy(this.canvas.width / 2 - 38, -80, 'BOSS', this.level));
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
        this.enemies.push(new Enemy(this.canvas.width / 2 - 38, -80, 'BOSS', this.level));
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
      text.textContent = `Уровень ${this.level} пройден!`;
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

  openCustomization() {
    sound.init();
    this.state = 'CUSTOM';
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
    const cx = this.player.position.x + this.player.size.width / 2 - 2;
    const topY = this.player.position.y;
    const m = this.upgrades.multishotLevel;

    // Продвинутые модификации стрельбы (более 3 уровней)
    if (m === 1) {
      this.bullets.push(new Bullet(cx, topY));
    } else if (m === 2) {
      this.bullets.push(new Bullet(cx - 8, topY));
      this.bullets.push(new Bullet(cx + 8, topY));
    } else if (m === 3) {
      this.bullets.push(new Bullet(cx, topY, 0, -620));
      this.bullets.push(new Bullet(cx - 14, topY + 4, -100, -580));
      this.bullets.push(new Bullet(cx + 14, topY + 4, 100, -580));
    } else if (m === 4) {
      // Квадро залп
      this.bullets.push(new Bullet(cx - 10, topY, -40, -600));
      this.bullets.push(new Bullet(cx - 3, topY, 0, -640));
      this.bullets.push(new Bullet(cx + 3, topY, 0, -640));
      this.bullets.push(new Bullet(cx + 10, topY, 40, -600));
    } else {
      // Овердрайв (5+ уровней): мощный веер из 5 пуль + лазеры
      this.bullets.push(new Bullet(cx, topY, 0, -700, this.upgrades.hasLaser));
      this.bullets.push(new Bullet(cx - 12, topY, -80, -650));
      this.bullets.push(new Bullet(cx + 12, topY, 80, -650));
      this.bullets.push(new Bullet(cx - 24, topY + 8, -160, -600));
      this.bullets.push(new Bullet(cx + 24, topY + 8, 160, -600));
    }
  }

  buyUpgrade(type: keyof Upgrades, cost: number): boolean {
    sound.init();
    if (this.coins >= cost) {
      this.coins -= cost;
      if (type === 'multishotLevel' || type === 'speedLevel' || type === 'maxHp' || type === 'shieldLevel') {
        this.upgrades[type]++;
      }
      if (type === 'shieldLevel') this.player.hasShield = true;
      if (type === 'maxHp') this.player.hp++;
      this.syncUI();
      return true;
    }
    return false;
  }

  buyLaser() {
    sound.init();
    if (!this.upgrades.hasLaser && this.coins >= 100) {
      this.coins -= 100;
      this.upgrades.hasLaser = true;
      this.syncUI();
    }
  }

  updateQuest(id: string, amount: number) {
    const q = this.quests.find((item) => item.id === id);
    if (q && !q.completed) {
      q.progress += amount;
      if (q.progress >= q.target) {
        q.progress = q.target;
        q.completed = true;
        if (q.rewardType === 'coins') {
          this.coins += Number(q.rewardValue);
        } else if (q.rewardType === 'skin') {
          const skin = this.skins.find((s) => s.id === q.rewardValue);
          if (skin) skin.unlocked = true;
        }
      }
    }
  }

  update(dt: number) {
    if (this.state !== 'PLAYING' || this.isLevelClearing) return;

    this.player.update(dt, this.canvas.width);

    if (this.mode === 'CAMPAIGN' && this.levelScore >= 200) {
      this.triggerLevelClear();
      return;
    }

    this.spawnTimer += dt;
    const spawnRate = this.mode === 'BOSSRUN' ? 3.5 : Math.max(0.25, 1.0 - this.level * 0.04);
    if (this.spawnTimer > spawnRate) {
      this.spawnTimer = 0;
      const x = Math.random() * (this.canvas.width - 40);
      const rand = Math.random();

      let type: EnemyType = 'NORMAL';
      if (this.mode === 'BOSSRUN') {
        type = 'BOSS';
      } else {
        if (rand < 0.25) type = 'FAST';
        else if (rand < 0.45 && this.level > 1) type = 'HEAVY';
        else if (rand < 0.15 && this.level > 3) type = 'BOSS';
      }

      this.enemies.push(new Enemy(x, -40, type, this.level));
    }

    this.bullets.forEach((b) => b.update(dt));
    this.enemies.forEach((e) => e.update(dt));

    for (const b of this.bullets) {
      for (const e of this.enemies) {
        if (b.active && e.active && this.checkCollision(b, e)) {
          b.active = false;
          e.hp--;
          if (e.hp <= 0) {
            e.active = false;
            sound.playExplosion();
            const isBoss = e.type === 'BOSS';
            const gainScore = isBoss ? 120 : 15;
            this.score += gainScore;
            this.levelScore += gainScore;
            this.coins += isBoss ? 35 : 4;

            this.updateQuest('q1', 1);
            this.updateQuest('q2', gainScore);
            if (this.mode === 'ENDLESS') {
              this.updateQuest('q5', gainScore);
            }
            if (isBoss) {
              this.updateQuest('q4', 1);
            }
          }
        }
      }
    }

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

    // Рендер фона в зависимости от выбранной темы
    if (this.theme === 'cyber') {
      this.ctx.fillStyle = '#0a0214';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.strokeStyle = 'rgba(255, 0, 120, 0.15)';
      this.ctx.lineWidth = 1;
      for (let i = 0; i < this.canvas.height; i += 20) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, i);
        this.ctx.lineTo(this.canvas.width, i);
        this.ctx.stroke();
      }
    } else if (this.theme === 'matrix') {
      this.ctx.fillStyle = '#011204';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = 'rgba(0, 255, 100, 0.1)';
      for (let i = 20; i < this.canvas.width; i += 40) {
        this.ctx.fillRect(i, 0, 1, this.canvas.height);
      }
    } else {
      this.ctx.fillStyle = '#020408';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    if (this.state !== 'PLAYING') return;

    this.ctx.fillStyle = '#00ffcc';
    this.ctx.font = '11px sans-serif';
    this.ctx.fillText(`Счет: ${this.score}`, 10, 18);
    this.ctx.fillText(`Уровень: ${this.level} (${this.mode})`, 10, 32);
    if (this.mode === 'CAMPAIGN') {
      this.ctx.fillText(`Прогресс: ${this.levelScore} / 200`, 10, 46);
    }
    this.ctx.fillText(`ХП: ${'❤️'.repeat(Math.max(0, this.player.hp))}`, 10, 60);
    this.ctx.fillStyle = '#ffff00';
    this.ctx.fillText(`Монеты: $${this.coins}`, 10, 74);

    this.player.draw(this.ctx);
    this.bullets.forEach((b) => b.draw(this.ctx));
    this.enemies.forEach((e) => e.draw(this.ctx));
  }

  syncUI() {
    const menu = document.getElementById('menuScreen');
    const shop = document.getElementById('shopScreen');
    const quests = document.getElementById('questsScreen');
    const custom = document.getElementById('customScreen');
    const gameOver = document.getElementById('gameOverScreen');
    const overlay = document.getElementById('levelClearOverlay');

    if (menu) menu.classList.toggle('hidden', this.state !== 'MENU');
    if (shop) shop.classList.toggle('hidden', this.state !== 'SHOP');
    if (quests) quests.classList.toggle('hidden', this.state !== 'QUESTS');
    if (custom) custom.classList.toggle('hidden', this.state !== 'CUSTOM');
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
    if (finalCoins) finalCoins.textContent = `Заработано монет: $${this.coins}`;

    // Рендер скинов в ангаре
    const skinContainer = document.getElementById('skinListContainer');
    if (skinContainer) {
      skinContainer.innerHTML = '';
      this.skins.forEach((s) => {
        const div = document.createElement('div');
        div.className = 'quest-item';
        div.innerHTML = `
          <div>
            <strong style="color:${s.color}">${s.name}</strong><br/>
            <span>Статус: ${s.unlocked ? (this.selectedSkinId === s.id ? '✅ НАДЕТО' : '🔓 Доступно') : '🔒 Заблокировано (нужен сложный квест)'}</span>
          </div>
        `;
        if (s.unlocked && this.selectedSkinId !== s.id) {
          const btn = document.createElement('button');
          btn.className = 'btn';
          btn.style.width = '70px';
          btn.style.padding = '4px';
          btn.textContent = 'Надеть';
          btn.onclick = () => this.selectSkin(s.id);
          div.appendChild(btn);
        }
        skinContainer.appendChild(div);
      });
    }

    // Рендер квестов по сложностям
    const questList = document.getElementById('questList');
    if (questList) {
      questList.innerHTML = '';
      this.quests.forEach((q) => {
        const diffColor = q.difficulty === 'Легкий' ? '#00ffcc' : q.difficulty === 'Средний' ? '#ff9900' : '#ff0055';
        const rewardText = q.rewardType === 'coins' ? `+$${q.rewardValue}` : `Скин: ${q.rewardValue}`;
        const div = document.createElement('div');
        div.className = `quest-item ${q.completed ? 'completed' : ''}`;
        div.innerHTML = `
          <div>
            <span style="color:${diffColor}; font-weight:bold;">[${q.difficulty}]</span> <strong>${q.title}</strong><br/>
            <span>Прогресс: ${q.progress}/${q.target}</span>
          </div>
          <div style="color:#ffff00; font-weight:bold; text-align:right;">${q.completed ? 'ГОТОВО' : rewardText}</div>
        `;
        questList.appendChild(div);
      });
    }

    // Кнопки апгрейдов оружия
    const gunCost = this.upgrades.multishotLevel * 40;
    const shopGunBtn = document.getElementById('shopGunBtn');
    if (shopGunBtn) {
      shopGunBtn.textContent = `🔫 Оружие (Ур. ${this.upgrades.multishotLevel}) - $${gunCost}`;
    }

    const speedCost = this.upgrades.speedLevel * 30;
    const shopSpeedBtn = document.getElementById('shopSpeedBtn');
    if (shopSpeedBtn) {
      shopSpeedBtn.textContent = `⚡ Двигатель (Ур. ${this.upgrades.speedLevel}) - $${speedCost}`;
    }

    const hpCost = this.upgrades.maxHp * 50;
    const shopHpBtn = document.getElementById('shopHpBtn');
    if (shopHpBtn) {
      shopHpBtn.textContent = `❤️ Корпус (${this.upgrades.maxHp}) - $${hpCost}`;
    }

    const shopLaserBtn = document.getElementById('shopLaserBtn');
    if (shopLaserBtn) {
      shopLaserBtn.textContent = this.upgrades.hasLaser ? '⚡ Лазерный модуль (Куплено)' : '⚡ Лазерный модуль - $100';
    }
  }
}
