/* ============================================================
   Super Mario Galaxy – Luma Feeder  |  game.js
   Canvas API  –  25 Lumas con movimiento, física y colisiones
   ============================================================ */

'use strict';

/* ─── Constantes globales ─── */
const TOTAL_LUMAS    = 25;
const LUMA_RADIUS    = 28;          // radio base (aumentado para mejor visibilidad)
const FLICKER_FRAMES = 10;           // destello breve al chocar (≈130 ms @ 60 fps)
const MOVE_TYPES     = ['vertical', 'diagonal', 'circular', 'horizontal'];

/* ─── Canvas setup ─── */
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

function resizeCanvas() {
  const wrapper = canvas.parentElement;
  const maxW = Math.min(wrapper.clientWidth, 960);
  const maxH = Math.min(window.innerHeight * 0.65, 560);
  canvas.width  = maxW  < 1400 ? 1400 : maxW;
  canvas.height = maxH  < 700  ? 700  : maxH;
}
resizeCanvas();
window.addEventListener('resize', () => { resizeCanvas(); });

/* ─── Assets: fondo ─── */
const bgImage = new Image();
bgImage.src   = 'assets/img/background.jpg';

/* ─── Assets: 4 variantes de Luma ─── */
const LUMA_SRCS = [
  'assets/img/luma.png',
  'assets/img/luma1.png',
  'assets/img/luma2.png',
  'assets/img/luma3.png'
];
const lumaImages = LUMA_SRCS.map(src => {
  const img = new Image();
  img.src   = src;
  return img;
});

/* ─── Audio ─── */
const bgMusic = document.getElementById('bgMusic');
document.addEventListener('click', () => {
  if (bgMusic.paused) {
    bgMusic.volume = 0.4;
    bgMusic.play().catch(() => {});
  }
}, { once: true });

/* ─── Contador de score ─── */
let score = 0;
const scoreDisplay = document.getElementById('scoreDisplay');

function incrementScore() {
  score++;
  scoreDisplay.textContent = score;
  scoreDisplay.classList.remove('pop');
  void scoreDisplay.offsetWidth;      // reflow para reiniciar animación
  scoreDisplay.classList.add('pop');
}

/* ─── Utilidades ─── */
function rand(min, max) { return Math.random() * (max - min) + min; }
function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
function randSign() { return Math.random() < 0.5 ? 1 : -1; }

const LUMA_COLORS = [
  '#fffde0', '#ffe066', '#ff99cc', '#66ccff',
  '#aaffaa', '#ff8866', '#cc99ff', '#66ffee',
  '#ffcc44', '#ff66aa'
];

/* ============================================================
   Clase Luma
   ============================================================ */
class Luma {
  constructor() {
    this.reset(true);
  }

  /* Inicializa / reposiciona la Luma */
  reset(_initial = false) {
    const margin = LUMA_RADIUS + 5;
    this.x = rand(margin, canvas.width  - margin);
    this.y = rand(margin, canvas.height - margin);

    /* Tipo de movimiento */
    this.moveType = MOVE_TYPES[randInt(0, MOVE_TYPES.length - 1)];

    /* ── Ángulo aleatorio real (no más diagonales fijas de 45°) ── */
    const speed = rand(8, 15);
    const dir   = rand(0, Math.PI * 2);
    this.vx = speed * Math.cos(dir);
    this.vy = speed * Math.sin(dir);

    /* Parámetros de movimiento circular */
    this.orbitAngle = rand(0, Math.PI * 2);
    this.angleSpeed = rand(0.05, 0.08) * randSign();
    this.orbitR     = rand(30, 180);
    this.cx         = this.x;   // centro de órbita (se desplaza con vx/vy)
    this.cy         = this.y;

    /* Apariencia – tamaño fijo (sin pulsación de escala) */
    this.color   = LUMA_COLORS[randInt(0, LUMA_COLORS.length - 1)];
    this.radius  = rand(LUMA_RADIUS * 1, LUMA_RADIUS * 1.8);  // promedio ≈ 31 px

    /* Imagen aleatoria entre las 4 variantes */
    this.lumaImg = lumaImages[randInt(0, lumaImages.length - 1)];

    /* Estado de destello (colisión) */
    this.flickerTimer = 0;
    this.isFlickering = false;

    /* Flag de eliminación */
    this.alive = true;
  }

  /* ── Actualización de posición según tipo de movimiento ── */
  update() {
    if (!this.alive) return;

    switch (this.moveType) {
      case 'vertical':
        this.y += this.vy;
        break;

      case 'horizontal':
        this.x += this.vx;
        break;

      case 'diagonal':
        this.x += this.vx;
        this.y += this.vy;
        break;

      case 'circular':
        /*
         * El centro de órbita se desplaza → efecto de onda / espiral:
         *   x(t) = cx(t) + R·cos(ωt)
         *   y(t) = cy(t) + R·sin(ωt)
         */
        this.cx += this.vx * 0.15;
        this.cy += this.vy * 0.15;
        this.orbitAngle += this.angleSpeed;
        this.x = this.cx + Math.cos(this.orbitAngle) * this.orbitR;
        this.y = this.cy + Math.sin(this.orbitAngle) * this.orbitR;
        break;
    }

    this._handleBorderCollision();

    if (this.flickerTimer > 0) {
      this.flickerTimer--;
      this.isFlickering = this.flickerTimer > 0;
    }
  }

  /* ── Rebote contra bordes con separación explícita ── */
  _handleBorderCollision() {
    const margin = this.radius;
    const W = canvas.width;
    const H = canvas.height;
    let bounced = false;

    if (this.moveType === 'circular') {
      /* Para circular corregimos el centro de órbita */
      if (this.cx - this.orbitR < margin)      { this.cx = margin + this.orbitR;      this.vx =  Math.abs(this.vx); bounced = true; }
      if (this.cx + this.orbitR > W - margin)  { this.cx = W - margin - this.orbitR;  this.vx = -Math.abs(this.vx); bounced = true; }
      if (this.cy - this.orbitR < margin)      { this.cy = margin + this.orbitR;      this.vy =  Math.abs(this.vy); bounced = true; }
      if (this.cy + this.orbitR > H - margin)  { this.cy = H - margin - this.orbitR;  this.vy = -Math.abs(this.vy); bounced = true; }
    } else {
      /* Separación explícita: la posición ya queda en el límite correcto */
      if (this.x - margin < 0)   { this.x =  margin;     this.vx =  Math.abs(this.vx); bounced = true; }
      if (this.x + margin > W)   { this.x =  W - margin; this.vx = -Math.abs(this.vx); bounced = true; }
      if (this.y - margin < 0)   { this.y =  margin;     this.vy =  Math.abs(this.vy); bounced = true; }
      if (this.y + margin > H)   { this.y =  H - margin; this.vy = -Math.abs(this.vy); bounced = true; }
    }

    if (bounced) this.triggerFlicker();
  }

  /* ── Activa el destello de colisión ── */
  triggerFlicker() {
    this.flickerTimer = FLICKER_FRAMES;
    this.isFlickering = true;
  }

  /* ── Dibujado ── */
  draw() {
    if (!this.alive) return;

    /* Destello sutil: alternar entre semi-transparente y opaco */
    const flashOn = this.isFlickering && (this.flickerTimer % 3 < 2);
    const alpha   = flashOn ? 0.95 : 1.0;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(this.x, this.y);

    const s = this.radius * 2.2;    // tamaño de dibujo fijo (sin escala pulse)

    if (this.lumaImg.complete && this.lumaImg.naturalWidth > 0) {
      ctx.drawImage(this.lumaImg, -s / 2, -s / 2, s, s);

      /* Overlay blanco rápido para dar sensación de "flash" */
      if (flashOn) {
        ctx.globalAlpha = 0.55;
        ctx.globalCompositeOperation = 'lighter';
        ctx.drawImage(this.lumaImg, -s / 2, -s / 2, s, s);
        ctx.globalCompositeOperation = 'source-over';
      }
    } else {
      /* Fallback procedural si el PNG no carga */
      this._drawProcedural(flashOn ? '#ffffff' : this.color);
    }

    ctx.restore();
  }

  /* Luma procedural (estrella con resplandor) */
  _drawProcedural(color) {
    const r = this.radius;

    /* Halo exterior */
    const glow = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 2.8);
    glow.addColorStop(0,   color + 'cc');
    glow.addColorStop(0.5, color + '44');
    glow.addColorStop(1,   color + '00');
    ctx.beginPath();
    ctx.arc(0, 0, r * 2.8, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    /* Cuerpo estrella */
    ctx.beginPath();
    this._starPath(r, 5, r * 0.45);
    const bodyGrad = ctx.createRadialGradient(-r * 0.2, -r * 0.2, 0, 0, 0, r);
    bodyGrad.addColorStop(0,   '#ffffff');
    bodyGrad.addColorStop(0.5, color);
    bodyGrad.addColorStop(1,   this._darken(color, 0.5));
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    /* Ojo */
    ctx.beginPath();
    ctx.arc(r * 0.15, -r * 0.05, r * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = '#1a0030';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(r * 0.18, -r * 0.08, r * 0.08, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }

  /* Traza el path de una estrella de n puntas */
  _starPath(outerR, points, innerR) {
    const step = Math.PI / points;
    ctx.moveTo(0, -outerR);
    for (let i = 0; i < points * 2; i++) {
      const a = i * step - Math.PI / 2;
      const r = i % 2 === 0 ? outerR : innerR;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
  }

  /* Oscurece un color hex */
  _darken(hex, factor) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.floor(((n >> 16) & 0xff) * factor);
    const g = Math.floor(((n >>  8) & 0xff) * factor);
    const b = Math.floor(( n        & 0xff) * factor);
    return `rgb(${r},${g},${b})`;
  }

  /* ── Detecta si el punto (px, py) está dentro de la Luma ── */
  contains(px, py) {
    const dx = px - this.x;
    const dy = py - this.y;
    return Math.sqrt(dx * dx + dy * dy) <= this.radius * 1.4;
  }
}

/* ============================================================
   Pool de Lumas – siempre exactamente 25
   ============================================================ */
let lumas = [];

function initLumas() {
  lumas = [];
  for (let i = 0; i < TOTAL_LUMAS; i++) lumas.push(new Luma());
}

/* ============================================================
   Detección de colisiones entre Lumas con separación explícita
   ============================================================ */
function resolveCollisions() {
  for (let i = 0; i < lumas.length; i++) {
    if (!lumas[i].alive) continue;
    for (let j = i + 1; j < lumas.length; j++) {
      if (!lumas[j].alive) continue;

      const a  = lumas[i];
      const b  = lumas[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist    = Math.sqrt(dx * dx + dy * dy);
      const minDist = a.radius + b.radius;

      if (dist < minDist && dist > 0) {
        /* Separar los objetos (+ 2 px de margen extra para evitar vibración) */
        const overlap = (minDist - dist) / 2 + 1;
        const nx = dx / dist;
        const ny = dy / dist;

        a.x -= nx * overlap;
        a.y -= ny * overlap;
        b.x += nx * overlap;
        b.y += ny * overlap;

        /* Colisión elástica (masas iguales) en la dirección normal */
        const dvx = b.vx - a.vx;
        const dvy = b.vy - a.vy;
        const dot  = dvx * nx + dvy * ny;

        if (dot < 0) {           // sólo si se están acercando
          a.vx += dot * nx;
          a.vy += dot * ny;
          b.vx -= dot * nx;
          b.vy -= dot * ny;
        }

        /* Para circular: reanclamos el centro de órbita tras la separación */
        // if (a.moveType === 'circular') { a.cx = a.x; a.cy = a.y; }
        // if (b.moveType === 'circular') { b.cx = b.x; b.cy = b.y; }

        a.triggerFlicker();
        b.triggerFlicker();
      }
    }
  }
}

/* ============================================================
   Fondo estelar procedural (fallback si background.jpg no carga)
   ============================================================ */
const stars = Array.from({ length: 180 }, () => ({
  x:     Math.random(),
  y:     Math.random(),
  r:     Math.random() * 1.5 + 0.3,
  sp:    Math.random() * 0.015 + 0.005,
  phase: Math.random() * Math.PI * 2
}));

function drawBackground(t) {
  if (bgImage.complete && bgImage.naturalWidth > 0) {
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(0,0,5,0.45)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = '#03001e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const neb1 = ctx.createRadialGradient(
      canvas.width * 0.25, canvas.height * 0.35, 10,
      canvas.width * 0.25, canvas.height * 0.35, canvas.width * 0.4
    );
    neb1.addColorStop(0, 'rgba(80,0,160,0.18)');
    neb1.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = neb1;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const neb2 = ctx.createRadialGradient(
      canvas.width * 0.75, canvas.height * 0.6, 10,
      canvas.width * 0.75, canvas.height * 0.6, canvas.width * 0.35
    );
    neb2.addColorStop(0, 'rgba(0,40,140,0.15)');
    neb2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = neb2;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    stars.forEach(s => {
      const alpha = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * s.sp + s.phase));
      ctx.beginPath();
      ctx.arc(s.x * canvas.width, s.y * canvas.height, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
      ctx.fill();
    });
  }
}

/* ============================================================
   Sistema de partículas – feedback visual del clic
   ============================================================ */
let particles = [];

function spawnParticles(x, y, color) {
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 / 8) * i;
    particles.push({
      x, y,
      vx: Math.cos(angle) * rand(1.5, 4),
      vy: Math.sin(angle) * rand(1.5, 4),
      life: 1,
      decay: rand(0.04, 0.09),
      r: rand(2, 5),
      color
    });
  }
}

/* ============================================================
   Animación CSS "pop" para el contador
   ============================================================ */
(function injectPopStyle() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes popAnim {
      0%   { transform: scale(1); }
      40%  { transform: scale(1.5); color: #fffb00; text-shadow: 0 0 14px #ffee00; }
      100% { transform: scale(1); }
    }
    #scoreDisplay.pop { animation: popAnim 0.35s ease-out; }
  `;
  document.head.appendChild(style);
})();

/* ============================================================
   Bucle principal (requestAnimationFrame)
   ============================================================ */
function gameLoop(ts) {
  requestAnimationFrame(gameLoop);

  const t = ts / 1000;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  /* 1. Fondo */
  drawBackground(t);

  /* 2. Física */
  lumas.forEach(l => l.update());
  resolveCollisions();

  /* 3. Dibujar Lumas */
  lumas.forEach(l => l.draw());

  /* 4. Partículas de clic */
  particles = particles.filter(p => {
    p.x  += p.vx;
    p.y  += p.vy;
    p.vx *= 0.92;
    p.vy *= 0.92;
    p.life -= p.decay;
    if (p.life <= 0) return false;

    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur  = 6;
    ctx.fill();
    ctx.restore();
    return true;
  });
}

/* ============================================================
   Evento de clic en Canvas
   ============================================================ */
canvas.addEventListener('click', (e) => {
  const rect   = canvas.getBoundingClientRect();
  const scaleX = canvas.width  / rect.width;
  const scaleY = canvas.height / rect.height;
  const px = (e.clientX - rect.left) * scaleX;
  const py = (e.clientY - rect.top)  * scaleY;

  /* Luma de encima primero (orden inverso) */
  for (let i = lumas.length - 1; i >= 0; i--) {
    if (lumas[i].alive && lumas[i].contains(px, py)) {
      const color = lumas[i].color;
      lumas[i].reset(false);       // respawn → siempre 25 Lumas
      incrementScore();
      spawnParticles(px, py, color);
      break;
    }
  }
});

/* ============================================================
   Arranque
   ============================================================ */
initLumas();
requestAnimationFrame(gameLoop);
