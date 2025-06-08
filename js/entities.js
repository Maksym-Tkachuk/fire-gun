export class Entity {
    constructor(x, y, w, h) {
      this.x = x; this.y = y;
      this.w = w; this.h = h;
    }
    draw(ctx) {}
  }
  
  export class Environment extends Entity {
    constructor(type, x, y, w = 32, h = 32) {
      super(x, y, w, h);
      this.type = type;
    }
    draw(ctx) {
      switch (this.type) {
        case 'tree':   ctx.fillStyle = 'darkgreen'; break;
        case 'fence':  ctx.fillStyle = 'sienna';    break;
        case 'flower': ctx.fillStyle = 'magenta';   break;
      }
      ctx.fillRect(this.x, this.y, this.w, this.h);
    }
  }
  
  export class Player extends Entity {
    constructor(x, y) {
      super(x, y, 32, 32);
      this.speed = 2;
      this.hp    = 100;
      this.maxHp = 100;
    }
    update(keys, collidesWithMap) {
      let nx = this.x, ny = this.y;
      if (keys.ArrowLeft || keys.KeyA) nx -= this.speed;
      if (keys.ArrowRight|| keys.KeyD) nx += this.speed;
      if (!collidesWithMap(nx, this.y, this.w, this.h)) this.x = nx;
      if (keys.ArrowUp   || keys.KeyW) ny -= this.speed;
      if (keys.ArrowDown || keys.KeyS) ny += this.speed;
      if (!collidesWithMap(this.x, ny, this.w, this.h)) this.y = ny;
    }
    draw(ctx) {
      ctx.fillStyle = 'royalblue';
      ctx.fillRect(this.x, this.y, this.w, this.h);
    }
  }
  
  export class Skeleton extends Entity {
    constructor(x, y, hp) {
      super(x, y, 28, 28);
      this.hp         = hp;
      this.maxHp      = hp;
      this.speed      = 1;
      this.attackCD   = 1000;
      this.lastAttack = 0;
    }
    update(player, collidesWithMap) {
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.hypot(dx, dy) || 1;
      const vx = (dx / dist) * this.speed;
      const vy = (dy / dist) * this.speed;
      if (!collidesWithMap(this.x + vx, this.y, this.w, this.h)) this.x += vx;
      if (!collidesWithMap(this.x, this.y + vy, this.w, this.h)) this.y += vy;
    }
    draw(ctx) {
      const shade = 255 - (this.maxHp / 10) * 200;
      ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
      ctx.fillRect(this.x, this.y, this.w, this.h);
    }
    tryAttack(now, player, spawnBloodEffect) {
      if (now - this.lastAttack < this.attackCD) return;
      if (
        this.x < player.x + player.w &&
        this.x + this.w > player.x &&
        this.y < player.y + player.h &&
        this.y + this.h > player.y
      ) {
        this.lastAttack = now;
        let chance = this.maxHp <= 5 ? 0.1 : this.maxHp > 8 ? 0.3 : 0.2;
        const isMaxHit = Math.random() < chance;
        const dmg = isMaxHit ? 15 : Math.floor(Math.random() * 11) + 4;
        player.takeDamage(dmg);
        spawnBloodEffect(player.x + player.w/2, player.y + player.h/2, dmg);
      }
    }
  }