window.addEventListener("load", () => {
  const canvas = document.getElementById("canvas1");
  const ctx = canvas.getContext("2d");

  function resize() {
    canvas.width = 1000;
    canvas.height = 500;
  }
  resize();

 
  const playerImg = new Image();
  playerImg.src = "hero.png";

  const enemyImg = new Image();
  enemyImg.src = "enemy.jpg";

  const input = { up: false, down: false, shoot: false };

  window.addEventListener("keydown", e => {
    if (e.key === "ArrowUp") input.up = true;
    if (e.key === "ArrowDown") input.down = true;
    if (e.key === " ") input.shoot = true;
  });

  window.addEventListener("keyup", () => {
    input.up = input.down = input.shoot = false;
  });

  
  function getCanvasPos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

 

  class Projectile {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.w = 14;
      this.h = 5;
      this.speed = 8;
      this.dead = false;
    }
    update() {
      this.x += this.speed;
      if (this.x > canvas.width) this.dead = true;
    }
    draw() {
      ctx.fillStyle = "#00e5ff";
      ctx.fillRect(this.x, this.y, this.w, this.h);
    }
  }

  class Player {
    constructor() {
      this.w = 70;
      this.h = 70;
      this.x = 30;
      this.y = canvas.height / 2 - this.h / 2;
      this.speed = 5;
      this.health = 100;
      this.projectiles = [];
      this.cooldown = 0;
    }

    update() {
      if (input.up) this.y -= this.speed;
      if (input.down) this.y += this.speed;
      this.y = Math.max(0, Math.min(canvas.height - this.h, this.y));

      if (input.shoot && this.cooldown <= 0) {
        this.projectiles.push(
          new Projectile(this.x + this.w, this.y + this.h / 2)
        );
        this.cooldown = 15;
      }
      if (this.cooldown > 0) this.cooldown--;

      this.projectiles.forEach(p => p.update());
      this.projectiles = this.projectiles.filter(p => !p.dead);
    }

    draw() {
      ctx.drawImage(playerImg, this.x, this.y, this.w, this.h);
      this.projectiles.forEach(p => p.draw());
    }
  }

  class Enemy {
    constructor(player) {
      this.w = 90;
      this.h = 90;
      this.x = canvas.width + Math.random() * 300;
      this.y = Math.random() * (canvas.height - this.h);
      this.speed = Math.random() * 2 + 2;
      this.dead = false;

      if (Math.abs(this.y - player.y) < 120) {
        this.y = (this.y + 150) % canvas.height;
      }
    }

    update() {
      this.x -= this.speed;
      if (this.x + this.w < 0) this.dead = true;
    }

    draw() {
      ctx.drawImage(enemyImg, this.x, this.y, this.w, this.h);
    }
  }

  class Game {
    constructor() {
      this.reset();
    }

    reset() {
      this.player = new Player();
      this.enemies = [];
      this.enemyTimer = 0;
      this.enemyInterval = 1200;
      this.score = 0;
      this.gameOver = false;
      this.paused = false;

      this.pauseBtn = { x: 960, y: 40, r: 18 };
      this.restartBtn = { x: 420, y: 250, w: 160, h: 50 };

      
      this.controls = {
        up:    { x: 80,  y: 380, r: 28, label: "▲" },
        down:  { x: 80,  y: 440, r: 28, label: "▼" },
        shoot: { x: 920, y: 410, r: 32, label: "●" }
      };
    }

    hit(a, b) {
      return (
        a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y
      );
    }

    update(dt) {
      if (this.paused || this.gameOver) return;

      this.score += dt * 0.002;
      this.player.update();

      if (this.enemyTimer > this.enemyInterval && this.enemies.length < 4) {
        this.enemies.push(new Enemy(this.player));
        this.enemyTimer = 0;
      } else this.enemyTimer += dt;

      this.enemies.forEach(e => {
        e.update();

        if (this.hit(this.player, e)) {
          e.dead = true;
          this.player.health -= 25;
          if (this.player.health <= 0) this.gameOver = true;
        }

        this.player.projectiles.forEach(p => {
          if (this.hit(p, e)) {
            p.dead = true;
            e.dead = true;
            this.score += 10;
          }
        });
      });

      this.enemies = this.enemies.filter(e => !e.dead);
    }

    drawUI() {
      ctx.fillStyle = "#00e5ff";
      ctx.font = "16px Arial";
      ctx.fillText("Score: " + Math.floor(this.score), 20, 25);

      ctx.fillStyle = "#300";
      ctx.fillRect(20, 35, 120, 10);
      ctx.fillStyle = "#00ff6a";
      ctx.fillRect(20, 35, this.player.health * 1.2, 10);

      // Pause button
      ctx.fillStyle = "#00e5ff";
      ctx.beginPath();
      ctx.arc(this.pauseBtn.x, this.pauseBtn.y, this.pauseBtn.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#000";
      ctx.fillRect(this.pauseBtn.x - 6, this.pauseBtn.y - 8, 4, 16);
      ctx.fillRect(this.pauseBtn.x + 2, this.pauseBtn.y - 8, 4, 16);
    }

    drawControls() {
      ctx.globalAlpha = 0.85;

      Object.values(this.controls).forEach(btn => {
        ctx.shadowColor = "#00e5ff";
        ctx.shadowBlur = 10;
        ctx.fillStyle = "rgba(0,229,255,0.25)";
        ctx.beginPath();
        ctx.arc(btn.x, btn.y, btn.r, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.fillStyle = "#00e5ff";
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(btn.label, btn.x, btn.y);
      });

      ctx.globalAlpha = 1;
    }

    drawGameOver() {
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "red";
      ctx.font = "40px Arial";
      ctx.textAlign = "center";
      ctx.fillText("GAME OVER", canvas.width / 2, 200);

      ctx.fillStyle = "#00e5ff";
      ctx.fillRect(this.restartBtn.x, this.restartBtn.y, this.restartBtn.w, this.restartBtn.h);

      ctx.fillStyle = "#000";
      ctx.font = "20px Arial";
      ctx.fillText("RESTART", canvas.width / 2, this.restartBtn.y + 32);

      ctx.textAlign = "left";
    }

    draw() {
      this.player.draw();
      this.enemies.forEach(e => e.draw());
      this.drawUI();
      this.drawControls();
      if (this.gameOver) this.drawGameOver();
    }
  }

  const game = new Game();
  let last = 0;

  /* ===== POINTER EVENTS ===== */

  canvas.addEventListener("pointerdown", e => {
    const { x, y } = getCanvasPos(e);

    // Restart
    if (game.gameOver) {
      const b = game.restartBtn;
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
        game.reset();
      }
      return;
    }

    // Pause
    const p = game.pauseBtn;
    if (Math.hypot(x - p.x, y - p.y) <= p.r) {
      game.paused = !game.paused;
      return;
    }

    // On-screen controls
    const c = game.controls;
    if (Math.hypot(x - c.up.x, y - c.up.y) <= c.up.r) {
      input.up = true;
      return;
    }
    if (Math.hypot(x - c.down.x, y - c.down.y) <= c.down.r) {
      input.down = true;
      return;
    }
    if (Math.hypot(x - c.shoot.x, y - c.shoot.y) <= c.shoot.r) {
      input.shoot = true;
      return;
    }
  });

  canvas.addEventListener("pointerup", () => {
    input.up = input.down = input.shoot = false;
  });

  function animate(t) {
    const dt = t - last;
    last = t;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    game.update(dt);
    game.draw();
    requestAnimationFrame(animate);
  }

  animate(0);
});
