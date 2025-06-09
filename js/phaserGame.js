import { createMap } from './map.js';

class MainScene extends Phaser.Scene {
  constructor() {
    super('main');
    this.shooting = false;
    this.lastShot = 0;
    this.kills = 0;
    this.totalEnemies = 0;
    this.gameOver = false;
    this.startTime = 0;
    this.bloodParticles = [];
    this.overlay = null;
  }

  preload() {
    for (let i = 1; i <= 4; i++) {
      this.load.image(`tree${i}`, `assets/tree${i}.png`);
    }
    // simple 1x1 red texture for particles
    if (!this.textures.exists('pixel')) {
      const tex = this.textures.createCanvas('pixel', 1, 1);
      tex.context.fillStyle = '#ff0000';
      tex.context.fillRect(0, 0, 1, 1);
      tex.refresh();
    }
    // 1x1 white texture for bullets
    if (!this.textures.exists('bulletPixel')) {
      const tex = this.textures.createCanvas('bulletPixel', 1, 1);
      tex.context.fillStyle = '#ffffff';
      tex.context.fillRect(0, 0, 1, 1);
      tex.refresh();
    }
  }

  create() {
    // reset state when restarting
    this.gameOver = false;
    this.shooting = false;
    this.lastShot = 0;
    this.kills = 0;
    this.totalEnemies = 0;
    this.bloodParticles = [];
    if (this.physics.world.isPaused) {
      this.physics.resume();
    }

    const width = this.scale.width;
    const height = this.scale.height;

    // environment
    this.environment = this.physics.add.staticGroup();
    const map = createMap();
    map.forEach(obj => {
      let item;
      if (obj.type === 'tree') {
        const tex = `tree${Phaser.Math.Between(1, 4)}`;
        item = this.add.image(obj.x + obj.w/2, obj.y + obj.h/2, tex);
        item.setDisplaySize(obj.w, obj.h);
      } else {
        const color = {
          fence: 0x8b4513,
          flower: 0xff00ff,
          lake: 0x1e90ff
        }[obj.type] || 0x808080;
        item = this.add.rectangle(obj.x + obj.w/2, obj.y + obj.h/2, obj.w, obj.h, color);
      }
      this.physics.add.existing(item, true);
      this.environment.add(item);
    });

    // player
    this.player = this.add.rectangle(width/2, height/2, 32, 32, 0x4169e1);
    this.physics.add.existing(this.player);
    this.player.hp = 100;
    this.player.maxHp = 100;

    // groups
    this.bullets = this.physics.add.group();
    this.enemies = this.physics.add.group();

    this.physics.add.collider(this.player, this.environment);
    this.physics.add.collider(this.enemies, this.environment);
    this.physics.add.collider(this.bullets, this.environment, (bullet) => bullet.destroy());
    this.physics.add.overlap(this.bullets, this.enemies, (bullet, enemy) => {
      this.spawnBlood(bullet.x, bullet.y, 2);
      enemy.hp -= 2;
      bullet.destroy();
      if (enemy.hp <= 0) {
        this.spawnBlood(enemy.x, enemy.y, enemy.maxHp);
        enemy.destroy();
        this.kills += 1;
        this.updateUI();
        if (this.kills >= this.totalEnemies) {
          this.handleGameOver(true);
        }
      }
    });
    this.physics.add.overlap(this.enemies, this.player, (enemy) => {
      const now = this.time.now;
      if (!enemy.lastAttack || now - enemy.lastAttack > 1000) {
        enemy.lastAttack = now;
        this.player.hp -= 10;
        this.spawnBlood(this.player.x, this.player.y, 10);
        if (this.player.hp <= 0) {
          this.spawnBlood(this.player.x, this.player.y, 20);
          this.handleGameOver(false);
        } else {
          this.updateUI();
        }
      }
    });

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');
    this.input.on('pointerdown', () => this.shooting = true);
    this.input.on('pointerup', () => this.shooting = false);

    this.spawnEnemies(10);

    // UI setup
    this.enemyHpGfx = this.add.graphics();
    const barW = 100, barH = 15;
    const barX = width - barW - 30, barY = 10;
    this.hpBarBack = this.add.rectangle(barX, barY, barW, barH, 0x555555).setOrigin(0,0);
    this.hpBarFill = this.add.rectangle(barX, barY, barW, barH, 0xff0000).setOrigin(0,0);
    this.hpNumber = this.add.text(barX + barW, barY + barH + 4, '', { font:'14px sans-serif', color:'#ffffff' }).setOrigin(1,0);
    this.killText = this.add.text(10, barY, '', { font:'20px sans-serif', color:'#ffffff' });
    this.timerText = this.add.text(10, barY, '', { font:'20px sans-serif', color:'#ffffff' });
    this.startTime = this.time.now;
    this.updateUI();
  }

  spawnEnemies(count) {
    this.totalEnemies = count;
    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Between(0, this.scale.width - 28);
      const y = Phaser.Math.Between(0, this.scale.height - 28);
      const hp = Phaser.Math.Between(4, 10);
      const shade = 255 - Math.round(((hp - 4) / 6) * 200);
      const color = (shade << 16) | (shade << 8) | shade;
      const enemy = this.add.rectangle(x, y, 28, 28, color);
      this.physics.add.existing(enemy);
      enemy.hp = hp;
      enemy.maxHp = hp;
      enemy.speed = 40;
      this.enemies.add(enemy);
    }
  }

  spawnBlood(x, y, dmg) {
    const count = Math.min(20, 5 + dmg);
    for (let i = 0; i < count; i++) {
      const rect = this.add.image(x, y, 'pixel').setDisplaySize(4, 4);
      const vx = (Math.random() - 0.5) * 200;
      const vy = (Math.random() - 0.5) * 200;
      this.bloodParticles.push({ obj: rect, vx, vy, life: 600, maxLife: 600 });
    }
  }

  update(time, delta) {
    // update blood particles first
    this.bloodParticles = this.bloodParticles.filter(p => {
      p.obj.x += (p.vx * delta) / 1000;
      p.obj.y += (p.vy * delta) / 1000;
      p.life -= delta;
      p.obj.setAlpha(Math.max(p.life / p.maxLife, 0));
      if (p.life <= 0) {
        p.obj.destroy();
        return false;
      }
      return true;
    });

    if (this.gameOver) return;

    const speed = 120;
    const body = this.player.body;
    body.setVelocity(0);
    if (this.cursors.left.isDown || this.wasd.A.isDown) body.setVelocityX(-speed);
    if (this.cursors.right.isDown || this.wasd.D.isDown) body.setVelocityX(speed);
    if (this.cursors.up.isDown || this.wasd.W.isDown) body.setVelocityY(-speed);
    if (this.cursors.down.isDown || this.wasd.S.isDown) body.setVelocityY(speed);
    body.velocity.normalize().scale(speed);

    // wrap around screen
    if (this.player.x < -this.player.width/2) this.player.x = this.scale.width;
    else if (this.player.x > this.scale.width + this.player.width/2) this.player.x = 0;
    if (this.player.y < -this.player.height/2) this.player.y = this.scale.height;
    else if (this.player.y > this.scale.height + this.player.height/2) this.player.y = 0;

    this.enemies.children.iterate(enemy => {
      if (!enemy) return;
      const dx = this.player.x - enemy.x;
      const dy = this.player.y - enemy.y;
      const dist = Math.hypot(dx, dy) || 1;
      const vx = (dx / dist) * enemy.speed;
      const vy = (dy / dist) * enemy.speed;
      enemy.body.setVelocity(vx, vy);
    });

    if (this.shooting && time - this.lastShot > 200) {
      const pointer = this.input.activePointer;
      const dx = pointer.worldX - this.player.x;
      const dy = pointer.worldY - this.player.y;
      const len = Math.hypot(dx, dy) || 1;

      const bullet = this.physics.add.image(this.player.x, this.player.y, 'bulletPixel');
      bullet.setDisplaySize(6, 6);
      bullet.setTint(0xffff00);
      // Disable gravity on the bullet's physics body so it travels straight
      bullet.body.setAllowGravity(false);
      bullet.body.setCollideWorldBounds(false);
      bullet.body.setVelocity((dx / len) * 300, (dy / len) * 300);
      this.bullets.add(bullet);

      this.lastShot = time;
    }

    // remove bullets that left the screen
    this.bullets.children.iterate(b => {
      if (!b) return;
      if (b.x < 0 || b.x > this.scale.width || b.y < 0 || b.y > this.scale.height) {
        b.destroy();
      }
    });

    // update enemy HP bars
    this.enemyHpGfx.clear();
    this.enemies.children.iterate(enemy => {
      if (!enemy) return;
      const bw = enemy.width;
      const bh = 3;
      const x = enemy.x - bw/2;
      const y = enemy.y - enemy.height/2 - bh - 2;
      this.enemyHpGfx.fillStyle(0xff0000, 1);
      this.enemyHpGfx.fillRect(x, y, bw * (enemy.hp / enemy.maxHp), bh);
    });

    this.updateUI(time);
  }

  updateUI(now = this.time.now) {
    const percent = this.player.hp / this.player.maxHp;
    this.hpBarFill.displayWidth = 100 * percent;
    this.hpNumber.setText(`${this.player.hp}/${this.player.maxHp}`);

    const elapsed = now - this.startTime;
    const mins = Math.floor(elapsed / 60000).toString().padStart(2, '0');
    const secs = Math.floor((elapsed % 60000) / 1000).toString().padStart(2, '0');
    const killText = `${this.kills}/${this.totalEnemies}`;
    this.killText.setText(killText);
    const killW = this.killText.width;
    this.timerText.setPosition(10 + killW + 20, this.killText.y);
    this.timerText.setText(`${mins}:${secs}`);
  }

  handleGameOver(victory) {
    if (this.gameOver) return;
    this.gameOver = true;
    this.shooting = false;
    this.physics.pause();

    const w = this.scale.width;
    const h = this.scale.height;
    const elapsed = this.time.now - this.startTime;
    const mins = Math.floor(elapsed / 60000).toString().padStart(2, '0');
    const secs = Math.floor((elapsed % 60000) / 1000).toString().padStart(2, '0');
    const title = victory ? 'Mission Complete!' : 'Game Over';

    this.overlay = this.add.container(0, 0);
    this.overlay.add(
      this.add.rectangle(0, 0, w, h, 0x000000, 0.5).setOrigin(0)
    );
    this.overlay.add(
      this.add.text(w/2, h/2 - 50, title, { font: '32px sans-serif', color: '#ffffff' }).setOrigin(0.5)
    );
    this.overlay.add(
      this.add.text(w/2, h/2 - 10, `Time: ${mins}:${secs}`, { font: '24px sans-serif', color: '#ffffff' }).setOrigin(0.5)
    );
    this.overlay.add(
      this.add.text(w/2, h/2 + 30, `Kills: ${this.kills}`, { font: '24px sans-serif', color: '#ffffff' }).setOrigin(0.5)
    );
    const btn = this.add.rectangle(w/2, h/2 + 80, 120, 40, 0x555555).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.overlay.add(btn);
    this.overlay.add(
      this.add.text(w/2, h/2 + 80, 'Restart', { font: '18px sans-serif', color: '#ffffff' }).setOrigin(0.5)
    );
    btn.on('pointerdown', () => this.scene.restart());
  }
}

export function startGame() {
  const config = {
    // Phaser treats Node or headless setups as a custom environment.
    type: Phaser.WEBGL,
    renderType: Phaser.WEBGL,
    width: 800,
    height: 600,
    canvas: document.getElementById('gameCanvas'),
    physics: { default: 'arcade', arcade: { debug: false } },
    scene: MainScene,
    backgroundColor: 0x44aa88
  };
  new Phaser.Game(config);
}

startGame();
