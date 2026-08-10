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
  draw(ctx: CanvasRenderingContext2D): void;
  update(deltaTime: number): void;
}

export type GameState = 'START' | 'PLAYING' | 'SHOP' | 'GAMEOVER';

export interface Upgrades {
  fireRateLevel: number;
  multishotLevel: number;
  shieldLevel: number;
}
