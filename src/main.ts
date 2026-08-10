import './style.css';
import { GameEngine } from './game';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
      };
    };
  }
}

if (window.Telegram?.WebApp) {
  window.Telegram.WebApp.ready();
  window.Telegram.WebApp.expand();
}

const canvas = document.querySelector<HTMLCanvasElement>('#gameCanvas')!;
const engine = new GameEngine(canvas);

// Автоматический запуск при старте приложения
engine.init();

// Запуск/перезапуск по тапу на холст (работает и на десктопе, и на мобильных)
const handleStart = (e: Event) => {
  e.preventDefault();
  if (engine.state !== 'PLAYING') {
    engine.start();
  }
};

canvas.addEventListener('click', handleStart);
canvas.addEventListener('touchstart', handleStart, { passive: false });

// Управление с клавиатуры
window.addEventListener('keydown', (e) => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') engine.player.velocity.x = -1;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') engine.player.velocity.x = 1;
  if (e.code === 'Space') engine.shoot();
});

window.addEventListener('keyup', (e) => {
  if (['ArrowLeft', 'KeyA', 'ArrowRight', 'KeyD'].includes(e.code)) {
    engine.player.velocity.x = 0;
  }
});

// Сенсорные кнопки управления
const btnLeft = document.querySelector('#btn-left')!;
const btnRight = document.querySelector('#btn-right')!;
const btnFire = document.querySelector('#btn-fire')!;

const bindTouch = (elem: Element, onStart: () => void, onEnd: () => void) => {
  elem.addEventListener('touchstart', (e) => { e.preventDefault(); onStart(); }, { passive: false });
  elem.addEventListener('touchend', (e) => { e.preventDefault(); onEnd(); }, { passive: false });
  elem.addEventListener('mousedown', () => onStart());
  elem.addEventListener('mouseup', () => onEnd());
};

bindTouch(btnLeft, () => engine.player.velocity.x = -1, () => engine.player.velocity.x = 0);
bindTouch(btnRight, () => engine.player.velocity.x = 1, () => engine.player.velocity.x = 0);
bindTouch(btnFire, () => engine.shoot(), () => {});
