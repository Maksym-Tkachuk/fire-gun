export class Particle {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.vx = (Math.random()-0.5)*4;
    this.vy = (Math.random()-0.5)*4;
    this.life = 30 + Math.random()*20;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
  }
  draw(ctx) {
    ctx.fillStyle = `rgba(200,0,0,${this.life/50})`;
    ctx.fillRect(this.x, this.y, 4, 4);
  }
}

export function spawnBloodEffect(particles, x, y, dmg) {
  const count = Math.min(20, 5 + dmg);
  for (let i = 0; i < count; i++) {
    particles.push(new Particle(x, y));
  }
}