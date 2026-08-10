import './style.css';
import { GameEngine } from './game';

// Расширяем глобальный интерфейс Window для Telegram Web App SDK
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

// Инициализация Telegram Mini App
if (window.Telegram?.WebApp) {
  window.Telegram.WebApp.ready();
  window.Telegram.WebApp.expand();
}

const canvas = document.querySelector<HTMLCanvasElement>('#gameCanvas')!;
const engine = new GameEngine(canvas);

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

// Сенсорное управление для смартфонов
const btnLeft = document.querySelector('#btn-left')!;
const btnRight = document.querySelector('#btn-right')!;
const btnFire = document.querySelector('#btn-fire')!;

const bindTouch = (elem: Element, onStart: () => void, onEnd: () => void) => {
  elem.addEventListener('touchstart', (e) => { e.preventDefault(); onStart(); });
  elem.addEventListener('touchend', (e) => { e.preventDefault(); onEnd(); });
};

bindTouch(btnLeft, () => engine.player.velocity.x = -1, () => engine.player.velocity.x = 0);
bindTouch(btnRight, () => engine.player.velocity.x = 1, () => engine.player.velocity.x = 0);
bindTouch(btnFire, () => engine.shoot(), () => {});

canvas.addEventListener('click', () => {
  if (engine.state !== 'PLAYING') engine.start();
});
