// ===================== CONSTANTS & CANVAS =====================
const canvas = document.getElementById('gameCanvas');
canvas.setAttribute('tabindex', '0');
const ctx = canvas.getContext('2d');
canvas.width = GW; canvas.height = GH;


// ===================== INPUT =====================
const keys = {}, keyOnce = {};
document.addEventListener('keydown', e => {
  if (!keys[e.code]) keyOnce[e.code] = true;
  keys[e.code] = true;
  if (['Space','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.code)) e.preventDefault();
});
document.addEventListener('keyup', e => { delete keys[e.code]; });
function consumeOnce(code) { if (keyOnce[code]) { delete keyOnce[code]; return true; } return false; }

let mouseX = GW / 2, mouseActive = false, mouseDown = false, _mouseTO;
canvas.addEventListener('mousemove', e => {
  const r = canvas.getBoundingClientRect();
  mouseX = (e.clientX - r.left) * (GW / r.width);
  mouseActive = true;
  clearTimeout(_mouseTO); _mouseTO = setTimeout(() => { mouseActive = false; }, 3000);
});
canvas.addEventListener('mousedown', e => { if (e.button === 0) mouseDown = true; if (!audioStarted) initAudio(); });
canvas.addEventListener('mouseup', e => { if (e.button === 0) mouseDown = false; });
canvas.addEventListener('contextmenu', e => e.preventDefault());

// ===================== GAME STATE =====================
let state = 'init'; // init|menu|playing|paused|bossWarn|levelClear|gameOver
let playerName = '';
let highScore = parseInt(localStorage.getItem('si2077hs') || '0');
let player, stars, enemyGrid, wildcards, boss, projectiles, powerups;
let gridDir = 1, gridSpeed = 0.8;
let wildcardTimer = 250, bossWarnTimer = 0, transTimer = 0;
let level = 1, wave = 1;

// ===================== INIT =====================
function initGame() {
  level = 1; wave = 1;
  player = new Player();
  stars = new StarField(GW, GH);
  resetWave();
  state = 'playing';
}

function resetWave() {
  const cols = Math.min(7 + Math.floor(level / 2), 11);
  const startX = (GW - (cols - 1) * 64) / 2;
  enemyGrid = [];
  [2, 2, 1, 0, 0].forEach((type, r) => {
    for (let c = 0; c < cols; c++)
      enemyGrid.push(new GridEnemy(startX + c * 64, 80 + r * 52, type));
  });
  wildcards = []; boss = null; projectiles = [];
  powerups = powerups ? powerups.filter(p => p.active) : [];
  gridDir = 1; gridSpeed = 0.6 + level * 0.1;
  wildcardTimer = 250;
}

// ===================== COLLISION =====================
function aabb(a, b) {
  const A = a.getBounds(), B = b.getBounds();
  return A.x < B.x + B.w && A.x + A.w > B.x && A.y < B.y + B.h && A.y + A.h > B.y;
}

function checkCollisions() {
  const playerShots = projectiles.filter(p => p.isPlayer);
  const enemyShots  = projectiles.filter(p => !p.isPlayer);
  const allTargets  = [...enemyGrid.filter(e => e.active), ...wildcards, ...(boss ? [boss] : [])];

  playerShots.forEach(shot => {
    if (!shot.active) return;
    allTargets.forEach(e => {
      if (!e.active || !aabb(shot, e)) return;
      const dmg = shot instanceof Rocket ? 80 : 20;
      const killed = e.takeDamage(dmg);
      if (shot instanceof Rocket) {
        allTargets.filter(t => t !== e && t.active).forEach(t => {
          const dx = t.x-e.x, dy = t.y-e.y;
          if (Math.sqrt(dx*dx+dy*dy) < 70) t.takeDamage(40);
        });
        particles.burst(shot.x, shot.y, C.orange, 22, 4, 35, 4);
        playSound('explosion');
      } else {
        particles.burst(shot.x, shot.y, e.color || C.green, 6, 2, 20, 2);
      }
      shot.active = false;
      if (killed) {
        player.score += e.score;
        if (player.score > highScore) { highScore = player.score; localStorage.setItem('si2077hs', highScore); }
        if (Math.random() < 0.12) powerups.push(new PowerUp(e.x, e.y));
        particles.burst(e.x, e.y, e.color || C.green, e instanceof Boss ? 50 : 14, 4, 40, 4);
        playSound(e instanceof Boss ? 'bossDeath' : 'explosion');
      }
    });
  });

  enemyShots.forEach(shot => {
    if (!shot.active) return;
    if (aabb(shot, player)) {
      const result = player.takeDamage();
      shot.active = false;
      particles.burst(player.x, player.y, C.red, 10, 3, 25, 3);
      if (result === 'dead') { 
        state = 'gameOver'; transTimer = 0; playSound('gameOver'); 
        showPlayOverlay(); music.stop(); 
      }
    }
  });

  powerups.forEach(pu => {
    if (!pu.active || !aabb(pu, player)) return;
    const r = pu.apply(player); pu.active = false; playSound('powerup');
    if (r === 'emp') {
      [...enemyGrid.filter(e => e.active), ...wildcards].forEach(e => {
        player.score += e.score; e.active = false;
        particles.burst(e.x, e.y, C.pink, 10, 3, 25, 3);
      });
      wildcards = [];
      particles.burst(GW/2, GH/2, C.pink, 40, 6, 50, 5);
      playSound('explosion');
    }
  });

  // Enemies reach bottom
  if (enemyGrid.some(e => e.active && e.y > GH - 90)) {
    player.lives = 0; state = 'gameOver'; transTimer = 0; playSound('gameOver'); 
    showPlayOverlay(); music.stop();
  }
}

// ===================== HUD =====================
function drawHUD() {
  ctx.fillStyle = 'rgba(0,8,18,0.82)';
  ctx.fillRect(0, 0, GW, 48);

  // Score
  ctx.font = 'bold 13px "Share Tech Mono"'; ctx.textAlign = 'left';
  ctx.shadowColor = C.cyan; ctx.shadowBlur = 8; ctx.fillStyle = C.cyan;
  ctx.fillText(`SCORE: ${String(player.score).padStart(8,'0')}`, 14, 20);
  ctx.font = '11px "Share Tech Mono"'; ctx.fillStyle = 'rgba(0,255,255,0.45)';
  ctx.fillText(`BEST:  ${String(highScore).padStart(8,'0')}`, 14, 38);

  // Level
  ctx.textAlign = 'center'; ctx.shadowColor = C.yellow; ctx.shadowBlur = 8;
  ctx.fillStyle = C.yellow; ctx.font = 'bold 14px "Share Tech Mono"';
  ctx.fillText(`LVL ${level}  ·  WAVE ${wave}`, GW/2, 28);

  // Pilot name
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '11px "Share Tech Mono"'; ctx.shadowBlur = 0;
  ctx.fillText(playerName.toUpperCase(), GW/2, 42);

  // Lives
  ctx.textAlign = 'right'; ctx.font = '18px serif';
  for (let i = 0; i < 3; i++) {
    ctx.globalAlpha = i < player.lives ? 1 : 0.12;
    ctx.fillText('❤', GW - 14 - i * 26, 30);
  }
  ctx.globalAlpha = 1;

  // Shield bar
  ctx.shadowColor = C.cyan; ctx.shadowBlur = 6;
  ctx.strokeStyle = C.cyan; ctx.lineWidth = 1;
  ctx.strokeRect(10, GH-30, 140, 10);
  const sc = player.shield > 60 ? '#00aaff' : player.shield > 30 ? C.yellow : C.red;
  ctx.fillStyle = sc; ctx.shadowColor = sc; ctx.shadowBlur = 8;
  ctx.fillRect(10, GH-30, (player.shield/player.maxShield)*140, 10);
  ctx.font = '10px "Share Tech Mono"'; ctx.fillStyle = C.cyan; ctx.textAlign = 'left';
  ctx.fillText('⚡ SHIELD', 10, GH-34);
  
  // Heat bar
  const hx = GW - 150;
  ctx.shadowColor = player.overheated ? C.red : C.orange; ctx.shadowBlur = 6;
  ctx.strokeStyle = player.overheated ? C.red : C.orange;
  ctx.strokeRect(hx, GH-30, 140, 10);
  ctx.fillStyle = player.overheated ? C.red : C.orange;
  ctx.fillRect(hx, GH-30, (player.heat/100)*140, 10);
  ctx.font = '10px "Share Tech Mono"'; ctx.textAlign = 'right';
  ctx.fillText(player.overheated ? '⚠ OVERHEAT' : '♨ HEAT', GW-10, GH-34);

  // Weapon
  ctx.textAlign = 'center'; ctx.font = '12px "Share Tech Mono"';
  ctx.fillStyle = player.weapon==='laser' ? C.cyan : 'rgba(0,255,255,0.25)';
  ctx.shadowColor = C.cyan; ctx.shadowBlur = player.weapon==='laser' ? 10 : 0;
  ctx.fillText('LASER', GW/2-60, GH-18);
  ctx.shadowBlur = 0; ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.fillText('|',GW/2,GH-18);
  ctx.fillStyle = player.weapon==='rocket' ? C.orange : 'rgba(255,102,0,0.25)';
  ctx.shadowColor = C.orange; ctx.shadowBlur = player.weapon==='rocket' ? 10 : 0;
  ctx.fillText(`ROCKET ×${player.rocketAmmo}`, GW/2+65, GH-18);
  ctx.shadowBlur = 0; ctx.fillStyle='rgba(255,255,255,0.2)'; ctx.font='10px "Share Tech Mono"';
  ctx.fillText('[Q] switch weapon', GW/2, GH-6);

  // Power-up timers
  let px2 = 165;
  if (player.rapidFire > 0)  { drawPUTimer(ctx,'⚡',C.yellow,player.rapidFire/600,px2,GH-24); px2+=50; }
  if (player.tripleShot > 0) { drawPUTimer(ctx,'🔱',C.cyan,player.tripleShot/600,px2,GH-24); }

  // Boss health bar
  if (boss && boss.active) {
    ctx.textAlign='center'; ctx.font='bold 11px "Share Tech Mono"';
    ctx.fillStyle=boss.color; ctx.shadowColor=boss.color; ctx.shadowBlur=10;
    ctx.fillText(`⚠ ${boss.name} ⚠`, GW/2, 62);
    ctx.strokeStyle=boss.color; ctx.lineWidth=1; ctx.shadowBlur=6;
    ctx.strokeRect(GW/2-200, 66, 400, 8);
    ctx.fillStyle=boss.color; ctx.fillRect(GW/2-200, 66, (boss.hp/boss.maxHp)*400, 8);
  }
  ctx.shadowBlur = 0;
}

function drawPUTimer(ctx, icon, color, pct, x, y) {
  ctx.save(); ctx.shadowColor=color; ctx.shadowBlur=8;
  ctx.font='14px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillStyle='#fff'; ctx.fillText(icon,x,y);
  ctx.strokeStyle=color; ctx.lineWidth=2; ctx.shadowBlur=6;
  ctx.beginPath(); ctx.arc(x,y-2,10,-Math.PI/2,-Math.PI/2+pct*Math.PI*2); ctx.stroke();
  ctx.restore();
}

// ===================== STATE OVERLAYS =====================
function drawOverlay() {
  if (state === 'bossWarn') {
    ctx.fillStyle=`rgba(255,0,0,${0.25+Math.sin(bossWarnTimer*0.25)*0.15})`;
    ctx.fillRect(0,0,GW,GH);
    ctx.textAlign='center'; ctx.font='bold 46px "Orbitron"';
    ctx.fillStyle=C.red; ctx.shadowColor=C.red; ctx.shadowBlur=30;
    ctx.fillText('⚠  BOSS  INCOMING  ⚠', GW/2, GH/2);
    ctx.shadowBlur=0;

  } else if (state === 'levelClear') {
    ctx.fillStyle='rgba(0,14,30,0.75)'; ctx.fillRect(0,0,GW,GH);
    ctx.textAlign='center';
    ctx.fillStyle=C.yellow; ctx.shadowColor=C.yellow; ctx.shadowBlur=25;
    ctx.font='bold 52px "Orbitron"'; ctx.fillText('SECTOR  CLEAR', GW/2, GH/2-24);
    ctx.fillStyle=C.cyan; ctx.shadowColor=C.cyan; ctx.shadowBlur=12;
    ctx.font='22px "Share Tech Mono"'; ctx.fillText(`SCORE: ${String(player.score).padStart(8,'0')}`, GW/2, GH/2+28);
    ctx.fillStyle='rgba(255,255,255,0.45)'; ctx.shadowBlur=0;
    ctx.font='15px "Share Tech Mono"';
    if (Math.floor(transTimer/30)%2===0) ctx.fillText('PRESS  ENTER  TO  CONTINUE', GW/2, GH/2+68);

  } else if (state === 'paused') {
    ctx.fillStyle='rgba(0,0,0,0.65)'; ctx.fillRect(0,0,GW,GH);
    ctx.textAlign='center'; ctx.fillStyle=C.cyan; ctx.shadowColor=C.cyan; ctx.shadowBlur=22;
    ctx.font='bold 54px "Orbitron"'; ctx.fillText('PAUSED', GW/2, GH/2);
    ctx.shadowBlur=0; ctx.fillStyle='rgba(255,255,255,0.4)';
    ctx.font='15px "Share Tech Mono"'; ctx.fillText('[P] RESUME   [ESC] MENU', GW/2, GH/2+55);

  } else if (state === 'gameOver') {
    ctx.fillStyle='rgba(0,0,18,0.88)'; ctx.fillRect(0,0,GW,GH);
    ctx.textAlign='center'; ctx.fillStyle=C.red; ctx.shadowColor=C.red; ctx.shadowBlur=28;
    ctx.font='bold 60px "Orbitron"'; ctx.fillText('GAME  OVER', GW/2, GH/2-70);
    ctx.fillStyle=C.yellow; ctx.shadowColor=C.yellow; ctx.shadowBlur=12;
    ctx.font='24px "Share Tech Mono"';
    ctx.fillText(`${playerName.toUpperCase()}  —  ${String(player.score).padStart(8,'0')}`, GW/2, GH/2-14);
    if (player.score >= highScore && player.score > 0) {
      ctx.fillStyle=C.cyan; ctx.shadowColor=C.cyan; ctx.shadowBlur=16;
      ctx.font='bold 20px "Orbitron"'; ctx.fillText('✦  NEW  HIGH  SCORE  ✦', GW/2, GH/2+28);
    }
    ctx.shadowBlur=0; ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.font='15px "Share Tech Mono"';
    if (transTimer > 90 && Math.floor(transTimer/30)%2===0) ctx.fillText('PRESS  ENTER  TO  PLAY  AGAIN', GW/2, GH/2+80);

  } else if (state === 'menu') {
    ctx.fillStyle='rgba(0,0,0,0.55)'; ctx.fillRect(0,0,GW,GH);
    ctx.textAlign='center';
    ctx.fillStyle=C.cyan; ctx.shadowColor=C.cyan; ctx.shadowBlur=30;
    ctx.font='bold 50px "Orbitron"'; ctx.fillText('SPACE  INVADERS', GW/2, GH/2-80);
    ctx.fillStyle=C.purple; ctx.shadowColor=C.purple; ctx.shadowBlur=22;
    ctx.font='bold 38px "Orbitron"'; ctx.fillText('2077', GW/2, GH/2-28);
    ctx.fillStyle=C.yellow; ctx.shadowColor=C.yellow; ctx.shadowBlur=8;
    ctx.font='18px "Share Tech Mono"'; ctx.fillText(`WELCOME,  ${playerName.toUpperCase()}`, GW/2, GH/2+22);
    ctx.shadowBlur=0; ctx.fillStyle='rgba(255,255,255,0.35)'; ctx.font='13px "Share Tech Mono"';
    ctx.fillText('ARROWS/WASD · SPACE to fire · Q switch weapon · P pause', GW/2, GH/2+60);
    if (Math.floor(Date.now()/600)%2) {
      ctx.fillStyle=C.white; ctx.shadowColor=C.white; ctx.shadowBlur=6;
      ctx.font='16px "Share Tech Mono"'; ctx.fillText('PRESS  ENTER  TO  LAUNCH', GW/2, GH/2+100);
    }
    ctx.shadowBlur=0;
  }
}

// ===================== GAME LOOP =====================
let lastT = 0;

function loop(ts) {
  const dt = Math.min((ts - lastT) / 16.7, 3); lastT = ts;
  ctx.fillStyle = '#000a14'; ctx.fillRect(0, 0, GW, GH);

  if (stars) { stars.update(); stars.draw(ctx); }
  particles.update(); 

  if (state === 'playing') {
    // Update player
    player.update(keys, mouseActive ? mouseX : null, keyOnce);
    Object.keys(keyOnce).forEach(k => delete keyOnce[k]);
    if (keys['Space'] || keys['KeyZ'] || mouseDown) projectiles.push(...player.shoot());

    // Move grid
    const active = enemyGrid.filter(e => e.active);
    let hitEdge = false;
    active.forEach(e => { e.x += gridDir * gridSpeed; e.update(); if (e.x < 26 || e.x > GW-26) hitEdge = true; });
    if (hitEdge) { gridDir *= -1; active.forEach(e => e.y += 18); gridSpeed = Math.min(gridSpeed + 0.06, 3.5); }
    active.forEach(e => { if (e.canShoot(0.0007 + level*0.0002)) projectiles.push(e.shoot()); });

    // Wildcards
    wildcardTimer--;
    if (wildcardTimer <= 0) {
      wildcards.push(new WildCard(['zigzagger','diver','spinner'][Math.floor(Math.random()*3)]));
      wildcardTimer = 180 + Math.random() * 180;
    }
    wildcards = wildcards.filter(w => { w.update(player.x, player.y); if (w.canShoot()) projectiles.push(...w.shoot()); return w.active; });

    // Boss
    if (boss) { const s = boss.update(player.x, player.y); projectiles.push(...s); }

    // Projectiles & powerups
    projectiles = projectiles.filter(p => { p.update(); return p.active; });
    powerups = powerups.filter(p => { p.update(); return p.active; });

    checkCollisions();

    // Draw everything
    enemyGrid.filter(e => e.active).forEach(e => e.draw(ctx));
    wildcards.forEach(w => w.draw(ctx));
    if (boss) boss.draw(ctx);
    projectiles.forEach(p => p.draw(ctx));
    powerups.forEach(p => p.draw(ctx));
    player.draw(ctx);
    particles.draw(ctx);
    drawHUD();

    // Wave/boss triggers
    const enemyCount = enemyGrid.filter(e=>e.active).length + wildcards.length;
    if (!boss && enemyCount === 0) {
      wave++;
      if (wave % 4 === 0) { state = 'bossWarn'; bossWarnTimer = 180; }
      else { resetWave(); playSound('levelClear'); }
    }
    if (boss && !boss.active) {
      state = 'levelClear'; transTimer = 0; level++; wave = 1; playSound('levelClear');
    }

    // Pause
    if (consumeOnce('KeyP')) state = 'paused';
    if (consumeOnce('Escape')) state = 'menu';

  } else if (state === 'bossWarn') {
    bossWarnTimer--;
    enemyGrid.filter(e=>e.active).forEach(e=>e.draw(ctx));
    player.draw(ctx); particles.draw(ctx); drawHUD(); drawOverlay();
    if (bossWarnTimer <= 0) {
      boss = new Boss(['sentinel','hydra','overlord'][(level-1)%3], level);
      enemyGrid=[]; wildcards=[]; projectiles=[]; wildcardTimer=99999; state='playing';
    }

  } else if (state === 'levelClear') {
    transTimer++;
    particles.draw(ctx); drawOverlay();
    if (transTimer > 60 && consumeOnce('Enter')) { resetWave(); state = 'playing'; }

  } else if (state === 'paused') {
    enemyGrid.filter(e=>e.active).forEach(e=>e.draw(ctx));
    wildcards.forEach(w=>w.draw(ctx)); if(boss)boss.draw(ctx);
    projectiles.forEach(p=>p.draw(ctx)); powerups.forEach(p=>p.draw(ctx));
    player.draw(ctx); particles.draw(ctx); drawHUD(); drawOverlay();
    if (consumeOnce('KeyP')) state='playing';
    if (consumeOnce('Escape')) state='menu';

  } else if (state === 'menu') {
    drawOverlay();
    if (consumeOnce('Enter') || consumeOnce('Space')) initGame();

  } else if (state === 'gameOver') {
    transTimer++;
    enemyGrid.filter(e=>e.active).forEach(e=>e.draw(ctx));
    if(boss)boss.draw(ctx); player.draw(ctx); particles.draw(ctx); drawHUD(); drawOverlay();
    if (transTimer > 90 && (consumeOnce('Enter') || consumeOnce('Space'))) initGame();

  } else if (state === 'init') {
    // Just stars until player enters name
    particles.draw(ctx);
  }

  requestAnimationFrame(loop);
}

// ===================== NAME SCREEN & PLAY OVERLAY =====================
const playOverlay = document.getElementById('playOverlay');
const playBtn = document.getElementById('playBtn');

function showPlayOverlay() {
  if (playOverlay) playOverlay.classList.remove('hidden');
}
function hidePlayOverlay() {
  if (playOverlay) playOverlay.classList.add('hidden');
}

function startPlay() {
  if (!audioStarted) initAudio();
  initGame();
  hidePlayOverlay();
  music.start();
}

if (playBtn) playBtn.addEventListener('click', startPlay);

document.addEventListener('DOMContentLoaded', () => {
  stars = new StarField(GW, GH);
  requestAnimationFrame(loop);

  const nameInput = document.getElementById('playerName');
  const startBtn2  = document.getElementById('startBtn');
  const nameScreen = document.getElementById('nameScreen');

  function launch() {
    const n = nameInput.value.trim();
    if (!n) {
      nameInput.classList.remove('shake');
      void nameInput.offsetWidth;
      nameInput.classList.add('shake');
      setTimeout(() => nameInput.classList.remove('shake'), 500);
      return;
    }
    playerName = n;
    if (!audioStarted) initAudio();
    nameScreen.classList.add('hidden');
    state = 'menu';
    canvas.focus();
    showPlayOverlay();
  }

  startBtn2.addEventListener('click', launch);
  nameInput.addEventListener('keydown', e => { if (e.code === 'Enter') launch(); });
  canvas.addEventListener('click', () => {
    if (state === 'menu') { startPlay(); }
    else if (state === 'gameOver' && transTimer > 90) { startPlay(); }
  });
  nameInput.focus();
});

// Show play overlay again on game over
const _origGameOver = () => { showPlayOverlay(); };
