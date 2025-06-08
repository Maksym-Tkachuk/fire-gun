import { collidesWithMap } from './util.js';

export class Player {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.w = 32; this.h = 32;
    this.speed = 2;
    this.hp = this.maxHp = 100;
    this.lastDamage = performance.now();
    this.lastRegen  = performance.now();
  }
  update(keys, mapObjects) {
    const now = performance.now();
    let nx = this.x, ny = this.y;
    if (keys.ArrowLeft || keys.KeyA)  nx -= this.speed;
    if (keys.ArrowRight|| keys.KeyD)  nx += this.speed;
    if (!collidesWithMap(nx, this.y, this.w, this.h, mapObjects)) {
      this.x = nx;
    }
    if (keys.ArrowUp   || keys.KeyW)  ny -= this.speed;
    if (keys.ArrowDown || keys.KeyS)  ny += this.speed;
    if (!collidesWithMap(this.x, ny, this.w, this.h, mapObjects)) {
      this.y = ny;
    }

    if (
      this.hp < this.maxHp &&
      now - this.lastDamage >= 5000 &&
      now - this.lastRegen >= 1000
    ) {
      this.hp = Math.min(this.maxHp, this.hp + 1);
      this.lastRegen = now;
    }
  }
  draw(ctx) {
    ctx.fillStyle = 'royalblue';
    ctx.fillRect(this.x, this.y, this.w, this.h);
  }

  takeDamage(dmg) {
    this.hp = Math.max(0, this.hp - dmg);
    const now = performance.now();
    this.lastDamage = now;
    this.lastRegen  = now;
  }
}