import { GameEngine } from './game';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const btnLeft = document.getElementById('btnLeft') as HTMLButtonElement;
const btnRight = document.getElementById('btnRight') as HTMLButtonElement;
const btnFire = document.getElementById('btnFire') as HTMLButtonElement;
const btnUpgradeGun = document.getElementById('btnUpgradeGun') as HTMLButtonElement;
const btnUpgradeShield = document.getElementById('btnUpgradeShield') as HTMLButtonElement;

const engine = new GameEngine(canvas);

// Обновление цен на кнопках под холстом
function updateUI() {
  const gunCost = engine.upgrades.multishotLevel * 30;
  btnUpgradeGun.textContent = `🔫 Оружие (lvl ${engine.upgrades.multishotLevel}) - $${gunCost}`;
  btnUpgradeShield.textContent = `🛡️ Щит - $20`;
  requestAnimationFrame(updateUI);
}
requestAnimationFrame(updateUI);

// Клики по меню/магазину на холсте
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
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
    if (engine.state === 'MENU') engine.changeSelectedLevel(-1);
    else engine.player.velocity.x = -1;
  }
  if (e.code === 'ArrowRight' || e.code === 'KeyD') {
    if (engine.state === 'MENU') engine.changeSelectedLevel(1);
    else engine.player.velocity.x = 1;
  }
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

// Тач / Мышь для кнопок управления внизу
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

// Кнопка влево
bindTouch(btnLeft, () => {
  if (engine.state === 'MENU') {
    engine.changeSelectedLevel(-1);
  } else {
    engine.player.velocity.x = -1;
  }
}, () => {
  engine.player.velocity.x = 0;
});

// Кнопка вправо
bindTouch(btnRight, () => {
  if (engine.state === 'MENU') {
    engine.changeSelectedLevel(1);
  } else {
    engine.player.velocity.x = 1;
  }
}, () => {
  engine.player.velocity.x = 0;
});

// Кнопка АТАКА (Старт / Выстрел / Выход)
bindTouch(btnFire, () => {
  engine.shoot();
});

// Кнопка покупки оружия
bindTouch(btnUpgradeGun, () => {
  const cost = engine.upgrades.multishotLevel * 30;
  engine.buyUpgrade('multishotLevel', cost);
});

// Кнопка покупки щита
bindTouch(btnUpgradeShield, () => {
  engine.buyUpgrade('shieldLevel', 20);
});
