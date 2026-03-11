// ===================== PLAYER =====================
class Player {
  constructor() {
    this.x = GW / 2; this.y = GH - 75;
    this.shield = 100; this.maxShield = 100;
    this.lives = 3; this.score = 0;
    this.weapon = 'laser';
    this.rocketAmmo = 10;
    this.laserCD = 0; this.rocketCD = 0;
    this.invincible = 0; this.hitFlash = 0;
    this.rapidFire = 0; this.tripleShot = 0;
    this.thrustT = 0;
    this.heat = 0; this.overheated = false;
    this.color = C.cyan;
  }

  update(keys, mouseX, keyOnce) {
    if (keys['ArrowLeft'] || keys['KeyA']) this.x = Math.max(28, this.x - 5);
    if (keys['ArrowRight'] || keys['KeyD']) this.x = Math.min(GW - 28, this.x + 5);
    if (mouseX !== null) this.x += (mouseX - this.x) * 0.08;
    this.x = Math.max(28, Math.min(GW - 28, this.x));
    if (keyOnce['KeyQ']) this.weapon = this.weapon === 'laser' ? 'rocket' : 'laser';
    if (this.laserCD > 0) this.laserCD--;
    if (this.rocketCD > 0) this.rocketCD--;
    if (this.invincible > 0) this.invincible--;
    if (this.hitFlash > 0) this.hitFlash--;
    if (this.rapidFire > 0) this.rapidFire--;
    if (this.tripleShot > 0) this.tripleShot--;

    // Heat dissipation
    if (this.overheated) {
      this.heat -= 0.3;
      if (this.heat <= 0) { this.heat = 0; this.overheated = false; }
    } else {
      this.heat = Math.max(0, this.heat - 0.45);
    }

    if (this.shield < this.maxShield && this.invincible === 0)
      this.shield = Math.min(this.maxShield, this.shield + 0.07);
    this.thrustT++;
    if (this.thrustT % 2 === 0) {
      particles.add(this.x + (Math.random() - 0.5) * 10, this.y + 16,
        Math.random() > 0.5 ? C.cyan : C.purple, (Math.random() - 0.5) * 2, 2 + Math.random() * 2, 14, 2);
    }
  }

  shoot() {
    if (this.overheated) return [];
    
    const shots = [];
    if (this.weapon === 'laser') {
      const cd = this.rapidFire > 0 ? 6 : 14;
      if (this.laserCD <= 0) {
        if (this.tripleShot > 0) {
          shots.push(new LaserBeam(this.x - 18, this.y - 22, -11, -2.5));
          shots.push(new LaserBeam(this.x,      this.y - 28, -12,  0));
          shots.push(new LaserBeam(this.x + 18, this.y - 22, -11,  2.5));
          this.heat += 4.5;
        } else {
          shots.push(new LaserBeam(this.x, this.y - 28, -12, 0));
          this.heat += 2.5;
        }
        this.laserCD = cd;
        playSound('laser');
      }
    } else if (this.rocketAmmo > 0 && this.rocketCD <= 0) {
      shots.push(new Rocket(this.x, this.y - 20));
      this.rocketAmmo--;
      this.rocketCD = 30;
      this.heat += 15;
      playSound('rocket');
    }

    if (this.heat >= 100) {
      this.heat = 100;
      this.overheated = true;
    }
    return shots;
  }

  takeDamage() {
    if (this.invincible > 0) return 'invincible';
    this.hitFlash = 12;
    this.shield = Math.max(0, this.shield - 30);
    playSound('hit');
    if (this.shield > 0) return 'hit';
    this.lives--;
    this.shield = 35;
    this.invincible = 180;
    if (this.lives <= 0) return 'dead';
    return 'lostlife';
  }

  draw(ctx) {
    if (this.invincible > 0 && Math.floor(this.invincible / 5) % 2) return;
    ctx.save();
    if (this.hitFlash > 0) ctx.filter = 'brightness(2) saturate(0)';
    const x = this.x, y = this.y;
    sh(ctx, C.cyan, 18);
    ctx.strokeStyle = C.cyan; ctx.lineWidth = 2;
    ctx.fillStyle = '#051828';
    ctx.beginPath();
    ctx.moveTo(x, y - 32);
    ctx.lineTo(x + 24, y + 16);
    ctx.lineTo(x + 9,  y + 8);
    ctx.lineTo(x,      y + 16);
    ctx.lineTo(x - 9,  y + 8);
    ctx.lineTo(x - 24, y + 16);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    // cockpit
    ctx.fillStyle = C.cyan; ctx.globalAlpha = 0.4;
    ctx.beginPath(); ctx.ellipse(x, y - 10, 6, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    // wing stripes
    ctx.strokeStyle = C.purple; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x - 16, y + 5); ctx.lineTo(x - 6, y - 6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 16, y + 5); ctx.lineTo(x + 6, y - 6); ctx.stroke();
    ctx.restore();
  }

  getBounds() { return { x: this.x - 18, y: this.y - 28, w: 36, h: 44 }; }
}

// ===================== PROJECTILES =====================
class LaserBeam {
  constructor(x, y, vy = -12, vx = 0) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.active = true; this.isPlayer = true; this.damage = 20;
    this.color = C.cyan;
  }
  update() {
    this.x += this.vx; this.y += this.vy;
    if (this.y < -30 || this.y > GH + 30 || this.x < 0 || this.x > GW) this.active = false;
  }
  draw(ctx) {
    ctx.save(); sh(ctx, C.cyan, 20);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(this.x - 1, this.y - 18, 2, 18);
    ctx.fillStyle = C.cyan; ctx.globalAlpha = 0.5;
    ctx.fillRect(this.x - 2.5, this.y - 18, 5, 18);
    ctx.restore();
  }
  getBounds() { return { x: this.x - 3, y: this.y - 18, w: 6, h: 18 }; }
}

class Rocket {
  constructor(x, y) {
    this.x = x; this.y = y; this.vy = -8; this.vx = 0;
    this.active = true; this.isPlayer = true; this.damage = 80; this.blastRadius = 70;
    this.t = 0; this.color = C.orange;
  }
  update() {
    this.y += this.vy; this.t++;
    if (this.y < -40) this.active = false;
    if (this.t % 2 === 0)
      particles.add(this.x + (Math.random() - 0.5) * 5, this.y + 12,
        Math.random() > 0.5 ? C.orange : C.yellow, (Math.random() - 0.5) * 1.5, 2 + Math.random() * 2, 16, 3);
  }
  draw(ctx) {
    ctx.save(); sh(ctx, C.orange, 22);
    ctx.fillStyle = C.orange; ctx.fillRect(this.x - 3, this.y - 15, 6, 15);
    ctx.fillStyle = C.yellow;
    ctx.beginPath(); ctx.moveTo(this.x, this.y - 22); ctx.lineTo(this.x - 3, this.y - 15); ctx.lineTo(this.x + 3, this.y - 15); ctx.fill();
    ctx.fillStyle = '#cc2200';
    ctx.beginPath(); ctx.moveTo(this.x - 3, this.y - 2); ctx.lineTo(this.x - 7, this.y + 5); ctx.lineTo(this.x - 3, this.y - 7); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(this.x + 3, this.y - 2); ctx.lineTo(this.x + 7, this.y + 5); ctx.lineTo(this.x + 3, this.y - 7); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  getBounds() { return { x: this.x - 4, y: this.y - 22, w: 8, h: 22 }; }
}

class EnemyProjectile {
  constructor(x, y, vx = 0, vy = 4.5, color = C.red) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.color = color; this.active = true; this.isPlayer = false;
  }
  update() {
    this.x += this.vx; this.y += this.vy;
    if (this.y > GH + 10 || this.y < -10 || this.x < 0 || this.x > GW) this.active = false;
  }
  draw(ctx) {
    ctx.save(); sh(ctx, this.color, 12);
    ctx.fillStyle = this.color;
    ctx.beginPath(); ctx.ellipse(this.x, this.y, 3, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  getBounds() { return { x: this.x - 4, y: this.y - 9, w: 8, h: 18 }; }
}

// ===================== POWER-UP =====================
class PowerUp {
  constructor(x, y) {
    this.x = x; this.y = y; this.vy = 1.5; this.active = true; this.t = 0;
    const roll = Math.random() * 100;
    const td = [
      { type: 'shield',     weight: 25, color: '#00aaff', icon: '🛡' },
      { type: 'rocket',     weight: 25, color: C.orange,  icon: '🚀' },
      { type: 'rapidfire',  weight: 20, color: C.yellow,  icon: '⚡' },
      { type: 'tripleshot', weight: 20, color: C.cyan,    icon: '🔱' },
      { type: 'emp',        weight: 10, color: C.pink,    icon: '💥' },
    ];
    let s = 0, picked = td[0];
    for (const d of td) { s += d.weight; if (roll < s) { picked = d; break; } }
    Object.assign(this, picked);
  }
  update() { this.y += this.vy; this.t++; if (this.y > GH + 20) this.active = false; }
  draw(ctx) {
    const bob = Math.sin(this.t * 0.1) * 4;
    ctx.save(); sh(ctx, this.color, 20);
    ctx.strokeStyle = this.color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(this.x, this.y + bob, 16, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = this.color.replace(')', ',0.25)').replace('rgb', 'rgba');
    ctx.beginPath(); ctx.arc(this.x, this.y + bob, 13, 0, Math.PI * 2); ctx.fill();
    ctx.font = '15px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowBlur = 0; ctx.fillStyle = '#fff';
    ctx.fillText(this.icon, this.x, this.y + bob);
    ctx.restore();
  }
  getBounds() { return { x: this.x - 16, y: this.y - 16, w: 32, h: 32 }; }
  apply(player) {
    switch (this.type) {
      case 'shield':     player.shield = player.maxShield; break;
      case 'rocket':     player.rocketAmmo = Math.min(player.rocketAmmo + 5, 30); break;
      case 'rapidfire':  player.rapidFire = 600; break;
      case 'tripleshot': player.tripleShot = 600; break;
      case 'emp':        return 'emp';
    }
    return null;
  }
}

// Helper: set shadow
function sh(ctx, color, blur = 12) { ctx.shadowColor = color; ctx.shadowBlur = blur; }
function clearSh(ctx) { ctx.shadowBlur = 0; }
