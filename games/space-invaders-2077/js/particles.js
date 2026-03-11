// ===================== PARTICLES =====================
class Particle {
  constructor(x, y, color, vx, vy, life, size) {
    this.x = x; this.y = y; this.color = color;
    this.vx = vx; this.vy = vy;
    this.life = life; this.maxLife = life;
    this.size = size;
  }
  update() {
    this.x += this.vx; this.y += this.vy;
    this.vy += 0.06;
    this.size *= 0.96;
    this.life--;
    return this.life > 0 && this.size > 0.2;
  }
  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
    ctx.shadowBlur = 8; ctx.shadowColor = this.color;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, Math.max(0.1, this.size), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class ParticleSystem {
  constructor() { this.list = []; }

  add(x, y, color, vx, vy, life, size) {
    this.list.push(new Particle(x, y, color, vx, vy, life, size));
  }

  burst(x, y, color, count = 12, speed = 3, life = 30, size = 3) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = speed * (0.4 + Math.random() * 0.8);
      this.add(x, y, color, Math.cos(angle) * spd, Math.sin(angle) * spd,
        life + Math.random() * 15, size + Math.random() * 2);
    }
  }

  update() { this.list = this.list.filter(p => p.update()); }
  draw(ctx) { this.list.forEach(p => p.draw(ctx)); }
  clear() { this.list = []; }
}

// ===================== STARFIELD =====================
class StarField {
  constructor(w, h) {
    this.w = w; this.h = h;
    this.layers = [];
    this.reset();
  }

  reset() {
    this.layers = [
      Array.from({ length: 80 },  () => this._make(0.25, 0.8, 0.15)),
      Array.from({ length: 45 },  () => this._make(0.55, 1.3, 0.35)),
      Array.from({ length: 18 },  () => this._make(1.0,  2.2, 0.7)),
    ];
  }

  _make(spd, size, bright) {
    return {
      x: Math.random() * this.w,
      y: Math.random() * this.h,
      spd, size, bright,
      twinkle: Math.random() * Math.PI * 2,
    };
  }

  update() {
    this.layers.forEach(layer => {
      layer.forEach(s => {
        s.y += s.spd;
        s.twinkle += 0.04;
        if (s.y > this.h) { s.y = 0; s.x = Math.random() * this.w; }
      });
    });
  }

  draw(ctx) {
    this.layers.forEach(layer => {
      layer.forEach(s => {
        const alpha = s.bright * (0.5 + Math.sin(s.twinkle) * 0.5);
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      });
    });
    ctx.globalAlpha = 1;
  }
}

const particles = new ParticleSystem();
