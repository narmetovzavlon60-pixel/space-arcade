import { GameEngine } from './game';

declare global {
  interface Window {
    gameEngine: GameEngine;
  }
}

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const engine = new GameEngine(canvas);
window.gameEngine = engine;

const levelGrid = document.getElementById('levelGrid');
if (levelGrid) {
  levelGrid.innerHTML = '';
  for (let i = 1; i <= 20; i++) {
    const btn = document.createElement('button');
    btn.className = 'lvl-btn';
    btn.textContent = `Ур. ${i}`;
    btn.onclick = () => engine.startLevel(i);
    levelGrid.appendChild(btn);
  }
}

const btnLeft = document.getElementById('btnLeft') as HTMLButtonElement;
const btnRight = document.getElementById('btnRight') as HTMLButtonElement;
const btnFire = document.getElementById('btnFire') as HTMLButtonElement;

const shopGunBtn = document.getElementById('shopGunBtn') as HTMLButtonElement;
const shopShieldBtn = document.getElementById('shopShieldBtn') as HTMLButtonElement;
const shopSpeedBtn = document.getElementById('shopSpeedBtn') as HTMLButtonElement;
const shopHpBtn = document.getElementById('shopHpBtn') as HTMLButtonElement;

shopGunBtn.addEventListener('click', () => {
  engine.buyUpgrade('multishotLevel', engine.upgrades.multishotLevel * 30);
});

shopShieldBtn.addEventListener('click', () => {
  engine.buyUpgrade('shieldLevel', 20);
});

shopSpeedBtn.addEventListener('click', () => {
  engine.buyUpgrade('speedLevel', engine.upgrades.speedLevel * 25);
});

shopHpBtn.addEventListener('click', () => {
  engine.buyUpgrade('maxHp', engine.upgrades.maxHp * 40);
});

window.addEventListener('keydown', (e) => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') engine.player.velocity.x = -1;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') engine.player.velocity.x = 1;
  if (e.code === 'Space') engine.shoot();
});

window.addEventListener('keyup', (e) => {
  if (
    e.code === 'ArrowLeft' ||
    e.code === 'KeyA' ||
    e.code === 'ArrowRight' ||
    e.code === 'KeyD'
  ) {
    engine.player.velocity.x = 0;
  }
});

function bindTouch(
  btn: HTMLButtonElement,
  onPress: () => void,
  onRelease?: () => void
) {
  btn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    onPress();
  });
  btn.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (onRelease) onRelease();
  });
  btn.addEventListener('mousedown', onPress);
  btn.addEventListener('mouseup', () => {
    if (onRelease) onRelease();
  });
}

bindTouch(btnLeft, () => engine.player.velocity.x = -1, () => engine.player.velocity.x = 0);
bindTouch(btnRight, () => engine.player.velocity.x = 1, () => engine.player.velocity.x = 0);
bindTouch(btnFire, () => engine.shoot());

engine.syncUI();
