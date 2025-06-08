import { collidesWithMap } from './util.js';

export class Bullet {
  constructor(x, y, dx, dy) {
    this.x = x; this.y = y;
    this.w = this.h = 6;
    this.dx = dx * 5;
    this.dy = dy * 5;
    this.dead = false;
  }
  update(mapObjects) {
    const nx = this.x + this.dx;
    const ny = this.y + this.dy;
    if (collidesWithMap(nx, ny, this.w, this.h, mapObjects)) {
      this.dead = true;
    } else {
      this.x = nx; this.y = ny;
    }
  }
  draw(ctx) {
    ctx.fillStyle = 'yellow';
    ctx.fillRect(this.x, this.y, this.w, this.h);
  }
}