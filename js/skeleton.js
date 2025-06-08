import { isColliding, collidesWithMap } from './util.js';

export class Skeleton {
  constructor(x, y, hp) {
    this.x = x; this.y = y;
    this.w = 28; this.h = 28;
    this.hp = this.maxHp = hp;
    this.speed = 1;
    this.attackCD = 1000;
    this.lastAttack = 0;
  }
  update(player, mapObjects) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    const vx = (dx/dist)*this.speed;
    const vy = (dy/dist)*this.speed;
    const nx = this.x + vx;
    if (!collidesWithMap(nx, this.y, this.w, this.h, mapObjects)) {
      this.x = nx;
    }
    const ny = this.y + vy;
    if (!collidesWithMap(this.x, ny, this.w, this.h, mapObjects)) {
      this.y = ny;
    }
  }
  draw(ctx) {
    const shade = 255 - (this.maxHp/10)*200;
    ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
    ctx.fillRect(this.x, this.y, this.w, this.h);
  }
  tryAttack(now, player, spawnBloodEffect) {
    if (now - this.lastAttack < this.attackCD) return false;
    if (!isColliding(this, player)) return false;
    this.lastAttack = now;
    let chance = this.maxHp <= 5 ? 0.1 : this.maxHp > 8 ? 0.3 : 0.2;
    const isMaxHit = Math.random() < chance;
    const dmg = isMaxHit ? 15 : 4 + Math.floor(Math.random()*11);
    player.hp = Math.max(0, player.hp - dmg);
    spawnBloodEffect(player.x+player.w/2, player.y+player.h/2, dmg);
    return player.hp <= 0;
  }
}