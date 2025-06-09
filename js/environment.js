// environment.js

// preload tree textures
const treeTextures = [];
for (let i = 1; i <= 4; i++) {
  const img = new Image();
  img.src = `../assets/tree${i}.png`;
  treeTextures.push(img);
}

export class Environment {
  constructor(type, x, y, w = 32, h = 32) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;

    // choose the texture only once for trees to avoid flicker
    if (this.type === 'tree') {
      this.texture = treeTextures[
        Math.floor(Math.random() * treeTextures.length)
      ];
    }
  }

  draw(ctx) {
    if (this.type === 'tree') {
      ctx.drawImage(this.texture, this.x, this.y, this.w, this.h);
      return;
    }

    // fallback for other types
    switch (this.type) {
      case 'fence':
        ctx.fillStyle = 'sienna';
        break;
      case 'flower':
        ctx.fillStyle = 'magenta';
        break;
      case 'lake':
        ctx.fillStyle = 'deepskyblue';
        break;
      default:
        ctx.fillStyle = 'gray';
    }
    ctx.fillRect(this.x, this.y, this.w, this.h);
  }
}
