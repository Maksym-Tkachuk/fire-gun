import { isColliding, collidesWithMap } from './util.js';
import { createMap } from './map.js';
import { Player } from './player.js';
import { Skeleton } from './skeleton.js';
import { Bullet } from './bullet.js';
import { Particle, spawnBloodEffect } from './particle.js';

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
const WIDTH  = canvas.width;
const HEIGHT = canvas.height;

// для відстеження останнього запиту анімації
let rafId = null;

let gameObjects = [], enemies = [], bullets = [], particles = [];
let player, totalSkeletons, startTime, gameOver, victory, endTime;
let keys = {}, mouseDown = false, mouseX = 0, mouseY = 0, lastShotTime = 0;
const shootInterval = 200;

function spawnEnemies(count = 10) {
  totalSkeletons = count;
  let spawned = 0;
  while (spawned < count) {
    const x = Math.random() * (WIDTH - 28);
    const y = Math.random() * (HEIGHT - 28);
    if (!collidesWithMap(x, y, 28, 28, gameObjects)) {
      enemies.push(new Skeleton(x, y, Math.ceil(Math.random() * 10)));
      spawned++;
    }
  }
}

function init() {
  // зупиняємо попередній цикл, якщо він був
  if (rafId) cancelAnimationFrame(rafId);

  gameObjects = createMap();
  player      = new Player(WIDTH/2 - 16, HEIGHT/2 - 16);
  enemies     = [];
  bullets     = [];
  particles   = [];
  spawnEnemies(10);
  startTime = performance.now();
  gameOver  = false;
  victory   = false;
  endTime   = 0;

  // запускаємо новий цикл
  rafId = requestAnimationFrame(loop);
}

function loop() {
  const now   = performance.now();
  const isEnd = victory || gameOver;

  // оновлення
  if (!isEnd) {
    player.update(keys, gameObjects);
    enemies.forEach(e => e.update(player, gameObjects));
    bullets.forEach(b => b.update(gameObjects));
  }
  particles.forEach(p => p.update());

  // авто-стрільба
  if (!isEnd && mouseDown && now - lastShotTime >= shootInterval) {
    lastShotTime = now;
    const px = player.x + player.w/2;
    const py = player.y + player.h/2;
    const dx = mouseX - px;
    const dy = mouseY - py;
    const dist = Math.hypot(dx, dy) || 1;
    bullets.push(new Bullet(px, py, dx / dist, dy / dist));
  }

  bullets = bullets.filter(b => !b.dead);

  // попадання та смерть скелета
  bullets.forEach((b, bi) => {
    enemies.slice().forEach((e, ei) => {
      if (isColliding(b, e)) {
        spawnBloodEffect(particles, b.x + b.w/2, b.y + b.h/2, 2);
        e.hp -= 2;
        b.dead = true;
        if (e.hp <= 0) {
          spawnBloodEffect(particles, e.x + e.w/2, e.y + e.h/2, e.maxHp);
          enemies.splice(ei, 1);
          if (!victory && enemies.length === 0) {
            victory = true;
            endTime = now;
          }
        }
      }
    });
  });

  // атаки скелетів
  if (!isEnd) {
    enemies.forEach(e => {
      const died = e.tryAttack(now, player, spawnBloodEffect.bind(null, particles));
      if (died) {
        gameOver = true;
        endTime  = now;
      }
    });
  }

  // малювання поля бою з блюром при кінці
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.save();
  if (isEnd) ctx.filter = 'blur(4px)';
  gameObjects.forEach(o => o.draw(ctx));
  player.draw(ctx);
  enemies.forEach(e => e.draw(ctx));
  bullets.forEach(b => b.draw(ctx));
  particles.forEach(p => p.draw(ctx));
  ctx.restore();

  // UI під час гри
  if (!isEnd) {
    // HP
    const barW = 100, barH = 15;
    const barX = WIDTH - barW - 30, barY = 10;
    ctx.fillStyle = '#555'; ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = 'red'; ctx.fillRect(barX, barY, barW * (player.hp / player.maxHp), barH);
    ctx.font = 'bold 14px sans-serif'; ctx.fillStyle = 'red';
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.fillText('+', barX - 18, barY + barH/2);
    ctx.font = '14px sans-serif'; ctx.fillStyle = 'white';
    ctx.textBaseline = 'top'; ctx.textAlign = 'right';
    ctx.fillText(`${player.hp}/${player.maxHp}`, barX + barW, barY + barH + 4);

    // лічильник та таймер
    const elapsed = now - startTime;
    const mins = Math.floor(elapsed/60000);
    const secs = Math.floor((elapsed%60000)/1000);
    const timerText = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
    ctx.font = '20px sans-serif'; ctx.fillStyle = 'white';
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    const killText = `${enemies.length}/${totalSkeletons}`;
    const labelY = barY + barH/2;
    ctx.fillText(killText, 10, labelY);
    const killW = ctx.measureText(killText).width;
    ctx.fillText(timerText, 10 + killW + 20, labelY);
  }

  // оверлей при кінці гри
  if (isEnd) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = 'white'; ctx.font = '24px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const elapsed = endTime - startTime;
    const mins = Math.floor(elapsed/60000);
    const secs = Math.floor((elapsed%60000)/1000);
    const timerText = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
    const kills = totalSkeletons - enemies.length;
    const title = victory ? 'Mission Complete!' : 'Game Over';
    ctx.fillText(title, WIDTH/2, HEIGHT/2 - 50);
    ctx.fillText(`Time: ${timerText}`, WIDTH/2, HEIGHT/2 - 10);
    ctx.fillText(`Kills: ${kills}`, WIDTH/2, HEIGHT/2 + 30);

    const bw = 120, bh = 40;
    const bx = WIDTH/2 - bw/2, by = HEIGHT/2 + 70;
    ctx.fillStyle = 'darkgray'; ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = 'white'; ctx.font = '18px sans-serif';
    ctx.textBaseline = 'middle'; ctx.fillText('Restart', WIDTH/2, by + bh/2);
  }

  rafId = requestAnimationFrame(loop);
}

// обробка вводу
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup',   e => keys[e.code] = false);
canvas.addEventListener('mousedown', e => {
  if (victory || gameOver) {
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const bw = 120, bh = 40;
    const bx = WIDTH/2 - bw/2, by = HEIGHT/2 + 70;
    if (x >= bx && x <= bx + bw && y >= by && y <= by + bh) {
      init(); return;
    }
  }
  mouseDown = true;
  const r = canvas.getBoundingClientRect();
  mouseX = e.clientX - r.left;
  mouseY = e.clientY - r.top;
});
canvas.addEventListener('mouseup', () => mouseDown = false);
canvas.addEventListener('mousemove', e => {
  const r = canvas.getBoundingClientRect();
  mouseX = e.clientX - r.left;
  mouseY = e.clientY - r.top;
});

init();