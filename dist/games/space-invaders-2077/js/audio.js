let audioCtx = null;
let audioStarted = false;

function initAudio() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  audioStarted = true;
}

function playSound(type) {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;

  const osc = (freq, waveType, start, dur, vol = 0.3) => {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    o.type = waveType; o.frequency.setValueAtTime(freq, t + start);
    g.gain.setValueAtTime(vol, t + start);
    g.gain.exponentialRampToValueAtTime(0.001, t + start + dur);
    o.start(t + start); o.stop(t + start + dur + 0.01);
  };

  const noise = (start, dur, vol = 0.2) => {
    const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * dur, audioCtx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = audioCtx.createBufferSource();
    const g = audioCtx.createGain();
    src.buffer = buf; src.connect(g); g.connect(audioCtx.destination);
    g.gain.setValueAtTime(vol, t + start);
    g.gain.exponentialRampToValueAtTime(0.001, t + start + dur);
    src.start(t + start);
  };

  switch (type) {
    case 'laser':
      osc(880, 'square', 0, 0.08, 0.15);
      osc(440, 'square', 0, 0.08, 0.08);
      break;
    case 'rocket':
      noise(0, 0.25, 0.3);
      osc(120, 'sawtooth', 0, 0.25, 0.2);
      break;
    case 'explosion':
      noise(0, 0.5, 0.5);
      osc(80, 'sawtooth', 0, 0.3, 0.3);
      break;
    case 'hit':
      osc(300, 'square', 0, 0.1, 0.2);
      osc(150, 'square', 0.05, 0.08, 0.15);
      break;
    case 'powerup':
      osc(440, 'sine', 0,    0.1, 0.25);
      osc(550, 'sine', 0.08, 0.1, 0.25);
      osc(660, 'sine', 0.16, 0.15,0.25);
      break;
    case 'bossDeath':
      noise(0, 1.0, 0.6);
      osc(60,  'sawtooth', 0,   0.5, 0.4);
      osc(90,  'sawtooth', 0.2, 0.5, 0.3);
      break;
    case 'levelClear':
      osc(523, 'sine', 0,    0.15, 0.3);
      osc(659, 'sine', 0.12, 0.15, 0.3);
      osc(784, 'sine', 0.24, 0.3,  0.3);
      break;
    case 'gameOver':
      osc(400, 'sawtooth', 0,    0.3, 0.3);
      osc(300, 'sawtooth', 0.25, 0.3, 0.3);
      osc(200, 'sawtooth', 0.5,  0.5, 0.3);
      break;
  }
}

// ===================== MUSIC ENGINE =====================
class MusicEngine {
  constructor() {
    this.osc1 = null; this.osc2 = null; this.gain = null;
    this.playing = false; this.t = 0;
    this.interval = null;
  }

  start() {
    if (this.playing || !audioCtx) return;
    this.playing = true;
    this.gain = audioCtx.createGain();
    this.gain.connect(audioCtx.destination);
    this.gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    
    this.t = 0;
    this.interval = setInterval(() => this.tick(), 200);
  }

  stop() {
    this.playing = false;
    if (this.interval) clearInterval(this.interval);
    if (this.gain) this.gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
  }

  tick() {
    if (!this.playing || !audioCtx) return;
    const now = audioCtx.currentTime;
    
    // Simple bassline (cyberpunk style)
    const notes = [55, 55, 65.41, 55, 48.99, 55, 65.41, 58.27]; // A1, C2, G1...
    const freq = notes[this.t % notes.length];
    
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(freq, now);
    o.connect(g); g.connect(this.gain);
    
    g.gain.setValueAtTime(0.1, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    
    o.start(now); o.stop(now + 0.2);
    
    // Spacey pad every 8 ticks
    if (this.t % 8 === 0) {
      const p = audioCtx.createOscillator();
      const pg = audioCtx.createGain();
      p.type = 'sine';
      p.frequency.setValueAtTime(freq * 4, now);
      p.connect(pg); pg.connect(this.gain);
      pg.gain.setValueAtTime(0.05, now);
      pg.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      p.start(now); p.stop(now + 1.6);
    }
    
    this.t++;
  }
}

const music = new MusicEngine();

