// ===================== GRID ENEMY =====================
const ECOLORS = [C.green, C.purple, C.orange];

class GridEnemy {
  constructor(x, y, type = 0) {
    this.x = x; this.y = y; this.type = type;
    this.hp = type + 1; this.maxHp = this.hp;
    this.active = true; this.hitFlash = 0; this.t = Math.random() * Math.PI * 2;
    this.score = [100, 200, 350][type];
    this.color = ECOLORS[type];
    this.shootTimer = 60 + Math.random() * 120;
  }

  update() { this.t += 0.05; if (this.hitFlash > 0) this.hitFlash--; this.shootTimer--; }

  canShoot(chance) { return this.shootTimer <= 0 && Math.random() < chance; }

  shoot() {
    this.shootTimer = 90 + Math.random() * 100;
    return new EnemyProjectile(this.x, this.y + 14, 0, 4.5, this.color);
  }

  takeDamage(amt) {
    this.hp -= amt; this.hitFlash = 8;
    if (this.hp <= 0) { this.active = false; return true; }
    return false;
  }

  draw(ctx) {
    if (!this.active) return;
    const { x, y, type, hitFlash, t, color } = this;
    const w = Math.sin(t) * 2;
    ctx.save();
    if (hitFlash > 0) ctx.filter = 'brightness(3)';
    sh(ctx, color);

    if (type === 0) {
      // Basic: neon crab
      ctx.strokeStyle = color; ctx.fillStyle = color + '28'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(x - 14, y - 10, 28, 20, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(x - 6, y - 2, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 6, y - 2, 3, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = 1;
      [[-8,-10,-12,-16+w],[8,-10,12,-16+w]].forEach(([ax,ay,bx,by]) => {
        ctx.beginPath(); ctx.moveTo(x+ax, y+ay); ctx.lineTo(x+bx, y+by); ctx.stroke();
      });
      [[-14,-2,-20,w],[-14,5,-20,8+w],[14,-2,20,w],[14,5,20,8+w]].forEach(([ax,ay,bx,by]) => {
        ctx.beginPath(); ctx.moveTo(x+ax, y+ay); ctx.lineTo(x+bx, y+by); ctx.stroke();
      });

    } else if (type === 1) {
      // Medium: squid
      ctx.strokeStyle = color; ctx.fillStyle = color + '28'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x, y - 4, 13, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(x - 5, y - 6, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 5, y - 6, 3, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = 1;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath(); ctx.moveTo(x + i * 5, y + 9);
        ctx.quadraticCurveTo(x + i * 6, y + 15 + w, x + i * 5 + 2, y + 19);
        ctx.stroke();
      }

    } else {
      // Elite: hexagon mech
      ctx.strokeStyle = color; ctx.fillStyle = color + '33'; ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3 - Math.PI / 6;
        i === 0 ? ctx.moveTo(x + 14 * Math.cos(a), y + 12 * Math.sin(a))
                : ctx.lineTo(x + 14 * Math.cos(a), y + 12 * Math.sin(a));
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(x - 4, y - 2, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 4, y - 2, 3, 0, Math.PI * 2); ctx.fill();
      for (let h = 0; h < this.maxHp; h++) {
        ctx.fillStyle = h < this.hp ? color : color + '33';
        ctx.fillRect(x - 8 + h * 7, y + 7, 5, 3);
      }
    }
    ctx.restore();
  }

  getBounds() { return { x: this.x - 16, y: this.y - 14, w: 32, h: 28 }; }
}

// ===================== WILD CARDS =====================
class WildCard {
  constructor(type) {
    this.type = type;
    this.x = 40 + Math.random() * (GW - 80);
    this.y = -30; this.active = true;
    this.hp = 2; this.maxHp = 2; this.score = 500;
    this.hitFlash = 0; this.t = 0; this.shootTimer = 80;
    this.color = { zigzagger: C.pink, diver: C.yellow, spinner: C.cyan }[type];
    if (type === 'diver') {
      this.phase = 'in'; this.tx = 60 + Math.random() * (GW - 120); this.ty = 80 + Math.random() * 100; this.hoverT = 70;
    } else if (type === 'spinner') {
      this.cx = this.x; this.cy = 160; this.angle = 0;
    }
  }

  update(px, py) {
    this.t += 0.07; if (this.hitFlash > 0) this.hitFlash--; this.shootTimer--;
    if (this.type === 'zigzagger') {
      this.x += Math.sin(this.t * 1.4) * 4.5; this.y += 2.2;
      this.x = Math.max(20, Math.min(GW - 20, this.x));
    } else if (this.type === 'diver') {
      if (this.phase === 'in') {
        this.x += (this.tx - this.x) * 0.05; this.y += (this.ty - this.y) * 0.05;
        if (Math.abs(this.y - this.ty) < 4) this.phase = 'hover';
      } else if (this.phase === 'hover') {
        this.x += Math.sin(this.t) * 2; this.hoverT--;
        if (this.hoverT <= 0) this.phase = 'dive';
      } else {
        this.x += (px - this.x) * 0.025; this.y += 9;
      }
    } else {
      this.angle += 0.04; this.cy += 0.25;
      this.x = this.cx + Math.cos(this.angle) * 65;
      this.y = this.cy + Math.sin(this.angle) * 28;
    }
    if (this.y > GH + 50) this.active = false;
  }

  canShoot() { return this.shootTimer <= 0; }

  shoot() {
    this.shootTimer = 80 + Math.random() * 60;
    if (this.type === 'spinner') {
      return [0, 1, 2, 3].map(i => {
        const a = i * Math.PI / 2 + this.angle;
        return new EnemyProjectile(this.x, this.y, Math.cos(a) * 3, Math.sin(a) * 3, this.color);
      });
    }
    return [new EnemyProjectile(this.x, this.y, 0, 5, this.color)];
  }

  takeDamage(amt) {
    this.hp -= amt; this.hitFlash = 8;
    if (this.hp <= 0) { this.active = false; return true; }
    return false;
  }

  draw(ctx) {
    ctx.save(); if (this.hitFlash > 0) ctx.filter = 'brightness(3)';
    const { x, y, color, t } = this;
    sh(ctx, color, 16);
    if (this.type === 'zigzagger') {
      ctx.save(); ctx.translate(x, y); ctx.rotate(t);
      ctx.strokeStyle = color; ctx.fillStyle = color + '22'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0,-16); ctx.lineTo(10,0); ctx.lineTo(16,16);
      ctx.lineTo(0,8); ctx.lineTo(-16,16); ctx.lineTo(-10,0); ctx.closePath();
      ctx.fill(); ctx.stroke(); ctx.restore();
    } else if (this.type === 'diver') {
      ctx.strokeStyle = color; ctx.fillStyle = color + '22'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x,y+18); ctx.lineTo(x-14,y-10); ctx.lineTo(x-6,y-4);
      ctx.lineTo(x,y-16); ctx.lineTo(x+6,y-4); ctx.lineTo(x+14,y-10); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x,y,4,0,Math.PI*2); ctx.fill();
    } else {
      ctx.save(); ctx.translate(x, y); ctx.rotate(this.angle * 2.5);
      ctx.strokeStyle = color; ctx.fillStyle = color + '22'; ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        ctx.save(); ctx.rotate(i * Math.PI / 2);
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(8,-14); ctx.lineTo(4,-14); ctx.lineTo(0,-7); ctx.closePath();
        ctx.fill(); ctx.stroke(); ctx.restore();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  getBounds() { return { x: this.x - 16, y: this.y - 17, w: 32, h: 34 }; }
}

// ===================== BOSS =====================
class Boss {
  constructor(type, level) {
    this.type = type; this.x = GW / 2; this.y = -110; this.targetY = 130;
    this.active = true; this.phase = 0; this.t = 0; this.hitFlash = 0;
    this.shootTimer = 80; this.moveDir = 1; this.splitDone = false;
    const mult = 1 + (level - 1) * 0.3;
    const cfg = { sentinel: [200, 'SENTINEL', C.green], hydra: [350, 'HYDRA', C.purple], overlord: [500, 'OVERLORD', C.orange] }[type];
    this.maxHp = Math.floor(cfg[0] * mult); this.hp = this.maxHp;
    this.name = cfg[1]; this.color = cfg[2]; this.score = this.maxHp * 5;
  }

  update(px, py) {
    this.t += 0.04; if (this.hitFlash > 0) this.hitFlash--; this.shootTimer--;
    if (this.y < this.targetY) { this.y += 2; return []; }
    const shots = [];

    if (this.type === 'sentinel') {
      this.x += this.moveDir * 1.5; if (this.x > GW-80 || this.x < 80) this.moveDir *= -1;
      if (this.shootTimer <= 0) {
        const n = this.phase >= 1 ? 5 : 3;
        for (let i = 0; i < n; i++) {
          const a = (i/(n-1) - 0.5) * Math.PI * 0.8 + Math.PI/2;
          shots.push(new EnemyProjectile(this.x, this.y+50, Math.cos(a)*3.5, Math.sin(a)*3.5, this.color));
        }
        this.shootTimer = this.phase >= 1 ? 55 : 90;
      }
      if (this.hp < this.maxHp * 0.5) this.phase = 1;

    } else if (this.type === 'hydra') {
      this.x += this.moveDir * 1.2; if (this.x > GW-80 || this.x < 80) this.moveDir *= -1;
      if (this.shootTimer <= 0) {
        const dx = px - this.x, dy = py - this.y, d = Math.sqrt(dx*dx+dy*dy);
        shots.push(new EnemyProjectile(this.x, this.y+40, dx/d*5, dy/d*5, this.color));
        if (this.phase >= 1) {
          shots.push(new EnemyProjectile(this.x-30, this.y+40, -2, 4, this.color));
          shots.push(new EnemyProjectile(this.x+30, this.y+40,  2, 4, this.color));
        }
        this.shootTimer = 75;
      }
      if (this.hp < this.maxHp * 0.5 && !this.splitDone) { this.phase = 1; this.splitDone = true; }

    } else {
      const tx = GW/2 + Math.sin(this.t)*200, ty = this.targetY + Math.sin(this.t*2)*40;
      this.x += (tx-this.x)*0.02; this.y += (ty-this.y)*0.02;
      if (this.shootTimer <= 0) {
        const n = this.phase >= 2 ? 12 : this.phase >= 1 ? 8 : 6;
        for (let i = 0; i < n; i++) {
          const a = (i/n)*Math.PI*2;
          shots.push(new EnemyProjectile(this.x, this.y, Math.cos(a)*3, Math.sin(a)*3, this.color));
        }
        this.shootTimer = this.phase >= 2 ? 48 : 78;
      }
      if (this.hp < this.maxHp * 0.66) this.phase = 1;
      if (this.hp < this.maxHp * 0.33) this.phase = 2;
    }
    return shots;
  }

  takeDamage(amt) {
    this.hp -= amt; this.hitFlash = 8;
    if (this.hp <= 0) { this.active = false; return true; }
    return false;
  }

  draw(ctx) {
    const { x, y, type, color, t, hitFlash } = this;
    ctx.save(); if (hitFlash > 0) ctx.filter = 'brightness(2.5)';
    sh(ctx, color, 25);

    if (type === 'sentinel') {
      ctx.strokeStyle = color; ctx.fillStyle = color + '1a'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(x, y, 55, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = color + '33';
      ctx.beginPath(); ctx.arc(x, y, 36, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(x-18, y-8, 9, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(x+18, y-8, 9, 0, Math.PI*2); ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = color;
      ctx.beginPath(); ctx.moveTo(x-20,y+16);
      for (let i=0;i<5;i++){ctx.lineTo(x-20+i*10,y+21);ctx.lineTo(x-20+i*10+5,y+16);}
      ctx.stroke();
      for (let i=0;i<8;i++){
        const a=t*0.5+i*Math.PI/4;
        ctx.beginPath(); ctx.moveTo(x+Math.cos(a)*55,y+Math.sin(a)*55);
        ctx.lineTo(x+Math.cos(a+0.08)*68,y+Math.sin(a+0.08)*68);
        ctx.lineTo(x+Math.cos(a-0.08)*68,y+Math.sin(a-0.08)*68);
        ctx.closePath(); ctx.fill();
      }

    } else if (type === 'hydra') {
      const heads = this.phase >= 1 ? [-40,0,40] : [-24,24];
      heads.forEach(ox => {
        ctx.strokeStyle = color; ctx.fillStyle = color + '22'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x,y+20);
        ctx.quadraticCurveTo(x+ox*0.5,y,x+ox,y-22); ctx.stroke();
        ctx.beginPath(); ctx.arc(x+ox,y-32,20,0,Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x+ox,y-32,6,0,Math.PI*2); ctx.fill();
      });
      ctx.fillStyle = color + '33'; ctx.strokeStyle = color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(x,y+30,50,35,0,0,Math.PI*2); ctx.fill(); ctx.stroke();

    } else {
      ctx.strokeStyle = color; ctx.fillStyle = color + '1a'; ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i=0;i<6;i++){const a=i*Math.PI/3+t*0.2;i===0?ctx.moveTo(x+55*Math.cos(a),y+55*Math.sin(a)):ctx.lineTo(x+55*Math.cos(a),y+55*Math.sin(a));}
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = color + '33'; ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i=0;i<6;i++){const a=i*Math.PI/3-t*0.4;i===0?ctx.moveTo(x+35*Math.cos(a),y+35*Math.sin(a)):ctx.lineTo(x+35*Math.cos(a),y+35*Math.sin(a));}
      ctx.closePath(); ctx.fill(); ctx.stroke();
      const es = 14+Math.sin(t*3)*3;
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x,y,es,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#ff0000'; ctx.beginPath(); ctx.arc(x,y,es*0.5,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }

  getBounds() { return { x: this.x-55, y: this.y-55, w: 110, h: 110 }; }
}
