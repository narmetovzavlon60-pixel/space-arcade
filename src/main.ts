import { GameEngine } from './game';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const btnLeft = document.getElementById('btnLeft') as HTMLButtonElement;
const btnRight = document.getElementById('btnRight') as HTMLButtonElement;
const btnFire = document.getElementById('btnFire') as HTMLButtonElement;
const btnUpgradeGun = document.getElementById('btnUpgradeGun') as HTMLButtonElement;
const btnUpgradeShield = document.getElementById('btnUpgradeShield') as HTMLButtonElement;

const engine = new GameEngine(canvas);

// Клики по экрану (для меню и магазина)
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;
  engine.handleCanvasClick(x, y);
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

// Тач кнопки
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

bindTouch(btnUpgradeGun, () => {
  const cost = engine.upgrades.multishotLevel * 30;
  engine.buyUpgrade('multishotLevel', cost);
});

bindTouch(btnUpgradeShield, () => {
  engine.buyUpgrade('shieldLevel', 20);
});
