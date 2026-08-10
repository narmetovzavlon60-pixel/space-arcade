import { GameEngine } from './game';

declare global {
  interface Window {
    gameEngine: GameEngine;
  }
}

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const engine = new GameEngine(canvas);
window.gameEngine = engine;

const btnLeft = document.getElementById('btnLeft') as HTMLButtonElement;
const btnRight = document.getElementById('btnRight') as HTMLButtonElement;
const btnFire = document.getElementById('btnFire') as HTMLButtonElement;
const btnUpgradeGun = document.getElementById('btnUpgradeGun') as HTMLButtonElement;
const btnUpgradeShield = document.getElementById('btnUpgradeShield') as HTMLButtonElement;

const shopGunBtn = document.getElementById('shopGunBtn') as HTMLButtonElement;
const shopShieldBtn = document.getElementById('shopShieldBtn') as HTMLButtonElement;

// Кнопки магазина
shopGunBtn.addEventListener('click', () => {
  const cost = engine.upgrades.multishotLevel * 30;
  engine.buyUpgrade('multishotLevel', cost);
});

shopShieldBtn.addEventListener('click', () => {
  engine.buyUpgrade('shieldLevel', 20);
});

// Кнопки быстрой покупки под холстом
btnUpgradeGun.addEventListener('click', () => {
  const cost = engine.upgrades.multishotLevel * 30;
  engine.buyUpgrade('multishotLevel', cost);
});

btnUpgradeShield.addEventListener('click', () => {
  engine.buyUpgrade('shieldLevel', 20);
});

// Клавиатура
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

// Привязка тач/мыши для игровых кнопок
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
