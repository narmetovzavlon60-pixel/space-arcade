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
  velocity: Vector2D;
  draw(ctx: CanvasRenderingContext2D): void;
  update(deltaTime: number): void;
}

export type GameState = 'START' | 'PLAYING' | 'GAMEOVER';
