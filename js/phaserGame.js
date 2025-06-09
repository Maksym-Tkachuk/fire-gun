import { createMap } from './map.js';

class MainScene extends Phaser.Scene {
  constructor() {
    super('main');
    this.shooting = false;
    this.lastShot = 0;
  }

  preload() {}

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    // environment
    this.environment = this.physics.add.staticGroup();
    const map = createMap();
    map.forEach(obj => {
      const color = {
        tree: 0x006400,
        fence: 0x8b4513,
        flower: 0xff00ff,
        lake: 0x1e90ff
      }[obj.type] || 0x808080;
      const rect = this.add.rectangle(obj.x + obj.w/2, obj.y + obj.h/2, obj.w, obj.h, color);
      this.physics.add.existing(rect, true);
      this.environment.add(rect);
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
      enemy.hp -= 2;
      bullet.destroy();
      if (enemy.hp <= 0) enemy.destroy();
    });
    this.physics.add.overlap(this.enemies, this.player, (enemy) => {
      const now = this.time.now;
      if (!enemy.lastAttack || now - enemy.lastAttack > 1000) {
        enemy.lastAttack = now;
        this.player.hp -= 10;
      }
    });

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');
    this.input.on('pointerdown', () => this.shooting = true);
    this.input.on('pointerup', () => this.shooting = false);

    this.spawnEnemies(10);
  }

  spawnEnemies(count) {
    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Between(0, this.scale.width - 28);
      const y = Phaser.Math.Between(0, this.scale.height - 28);
      const enemy = this.add.rectangle(x, y, 28, 28, 0xaaaaaa);
      this.physics.add.existing(enemy);
      enemy.hp = Phaser.Math.Between(4, 10);
      enemy.speed = 40;
      this.enemies.add(enemy);
    }
  }

  update(time, delta) {
    const speed = 120;
    const body = this.player.body;
    body.setVelocity(0);
    if (this.cursors.left.isDown || this.wasd.A.isDown) body.setVelocityX(-speed);
    if (this.cursors.right.isDown || this.wasd.D.isDown) body.setVelocityX(speed);
    if (this.cursors.up.isDown || this.wasd.W.isDown) body.setVelocityY(-speed);
    if (this.cursors.down.isDown || this.wasd.S.isDown) body.setVelocityY(speed);
    body.velocity.normalize().scale(speed);

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
      const bullet = this.add.rectangle(this.player.x, this.player.y, 6, 6, 0xffff00);
      this.physics.add.existing(bullet);
      bullet.body.setVelocity((dx/len)*300, (dy/len)*300);
      this.bullets.add(bullet);
      this.lastShot = time;
    }
  }
}

export function startGame() {
  const config = {
    // Phaser treats Node or headless setups as a custom environment.
    // Specify the renderer explicitly in such cases.
    type: Phaser.WEBGL,
    renderType: Phaser.WEBGL,
    width: 800,
    height: 600,
    canvas: document.getElementById('gameCanvas'),
    physics: { default: 'arcade', arcade: { debug: false } },
    scene: MainScene
  };
  new Phaser.Game(config);
}

startGame();
