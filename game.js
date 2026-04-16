/* ============================================================
   Super Mario Galaxy – Luma Feeder  |  game.js
   Canvas API  –  25 Lumas con movimiento, física y colisiones
   ============================================================ */

'use strict';

/* ─── Constantes globales ─── */
const TOTAL_LUMAS   = 25;
const LUMA_RADIUS   = 18;          // radio de colisión / tamaño base
const FLICKER_FRAMES = 20;         // cuántos frames dura el destello
const MOVE_TYPES    = ['vertical', 'diagonal', 'circular', 'horizontal'];

/* ─── Canvas setup ─── */
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

function resizeCanvas() {
  const wrapper = canvas.parentElement;
  const maxW = Math.min(wrapper.clientWidth, 960);
  const maxH = Math.min(window.innerHeight * 0.65, 560);
  canvas.width  = maxW  < 1400 ? 1400 : maxW;
  canvas.height = maxH  < 700 ? 700 : maxH;
}
resizeCanvas();
window.addEventListener('resize', () => { resizeCanvas(); });

/* ─── Assets ─── */
const bgImage   = new Image();
bgImage.src     = 'assets/img/background.jpg';

const lumaImage = new Image();
lumaImage.src   = 'assets/img/luma.png';

/* ─── Audio ─── */
const bgMusic = document.getElementById('bgMusic');

// Intentar reproducir al primer clic del usuario
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
  // Pequeña animación de "pop" en el contador
  scoreDisplay.classList.remove('pop');
  void scoreDisplay.offsetWidth;          // reflow para reiniciar animación
  scoreDisplay.classList.add('pop');
}

/* ─── Utilidades ─── */
function rand(min, max) { return Math.random() * (max - min) + min; }
function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
function randSign() { return Math.random() < 0.5 ? 1 : -1; }

// Colores de Luma (estrellita con variantes de color)
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
  reset(initial = false) {
    const margin = LUMA_RADIUS + 5;
    this.x  = rand(margin, canvas.width  - margin);
    this.y  = rand(margin, canvas.height - margin);

    // Tipo de movimiento
    this.moveType = MOVE_TYPES[randInt(0, MOVE_TYPES.length - 1)];

    // Velocidades base (distintas para cada Luma)
    const speed = rand(0.8, 2.8);
    this.vx = speed * randSign();
    this.vy = speed * randSign();

    // Parámetros de movimiento circular
    this.angle     = rand(0, Math.PI * 2);
    this.angleSpeed = rand(0.01, 0.04) * randSign();
    this.orbitR    = rand(30, 80);
    this.cx        = this.x;   // centro de órbita (actualizado mientras se mueve)
    this.cy        = this.y;

    // Apariencia
    this.color     = LUMA_COLORS[randInt(0, LUMA_COLORS.length - 1)];
    this.radius    = rand(LUMA_RADIUS * 0.7, LUMA_RADIUS * 1.3);
    this.glowSize  = this.radius * 2.5;

    // Estado de destello (colisión)
    this.flickerTimer = 0;
    this.isFlickering = false;

    // Parpadeo suave siempre activo (pulse)
    this.pulseAngle = rand(0, Math.PI * 2);
    this.pulseSpeed = rand(0.04, 0.09);

    // Flag de eliminación (al hacer clic)
    this.alive = true;
  }

  /* ── Actualización de posición según tipo de movimiento ── */
  update() {
    if (!this.alive) return;

    this.pulseAngle += this.pulseSpeed;

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
        // El centro de órbita sí se desplaza lentamente
        this.cx += this.vx * 0.15;
        this.cy += this.vy * 0.15;
        this.angle += this.angleSpeed;
        this.x = this.cx + Math.cos(this.angle) * this.orbitR;
        this.y = this.cy + Math.sin(this.angle) * this.orbitR;
        break;
    }

    this._handleBorderCollision();

    // Reducir timer de destello
    if (this.flickerTimer > 0) {
      this.flickerTimer--;
      this.isFlickering = this.flickerTimer > 0;
    }
  }

  /* ── Rebote contra bordes ── */
  _handleBorderCollision() {
    const margin = this.radius;
    const W = canvas.width;
    const H = canvas.height;

    let bounced = false;

    if (this.moveType === 'circular') {
      // Para circular corregimos el centro de órbita
      if (this.cx - this.orbitR < margin)      { this.cx = margin + this.orbitR;      this.vx =  Math.abs(this.vx); bounced = true; }
      if (this.cx + this.orbitR > W - margin)  { this.cx = W - margin - this.orbitR; this.vx = -Math.abs(this.vx); bounced = true; }
      if (this.cy - this.orbitR < margin)      { this.cy = margin + this.orbitR;      this.vy =  Math.abs(this.vy); bounced = true; }
      if (this.cy + this.orbitR > H - margin)  { this.cy = H - margin - this.orbitR; this.vy = -Math.abs(this.vy); bounced = true; }
    } else {
      if (this.x - margin < 0)     { this.x =  margin; this.vx =  Math.abs(this.vx); bounced = true; }
      if (this.x + margin > W)     { this.x =  W - margin; this.vx = -Math.abs(this.vx); bounced = true; }
      if (this.y - margin < 0)     { this.y =  margin; this.vy =  Math.abs(this.vy); bounced = true; }
      if (this.y + margin > H)     { this.y =  H - margin; this.vy = -Math.abs(this.vy); bounced = true; }
    }

    if (bounced) this.triggerFlicker();
  }

  /* ── Activa el estado de destello ── */
  triggerFlicker() {
    this.flickerTimer  = FLICKER_FRAMES;
    this.isFlickering  = true;
  }

  /* ── Dibujado ── */
  draw() {
    if (!this.alive) return;

    const pulse = 0.85 + 0.15 * Math.sin(this.pulseAngle);   // 0.85 – 1.0

    // Estado de destello: alternar opacidad y color
    let alpha = 1;
    let extraColor = this.color;
    if (this.isFlickering) {
      alpha      = (this.flickerTimer % 4 < 2) ? 0.3 : 1.0;
      extraColor = '#ffffff';
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(this.x, this.y);

    // --- Intentar dibujar sprite PNG, si no cae al procedural ---
    if (lumaImage.complete && lumaImage.naturalWidth > 0) {
      const s = this.radius * 2.2 * pulse;
      ctx.drawImage(lumaImage, -s / 2, -s / 2, s, s);
    } else {
      this._drawProcedural(pulse, extraColor);
    }

    ctx.restore();
  }

  /* Luma procedural (estrella con resplandor) */
  _drawProcedural(pulse, color) {
    const r = this.radius * pulse;

    // Halo exterior
    const glow = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 2.8);
    glow.addColorStop(0,   color + 'cc');
    glow.addColorStop(0.5, color + '44');
    glow.addColorStop(1,   color + '00');
    ctx.beginPath();
    ctx.arc(0, 0, r * 2.8, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    // Cuerpo estrella
    ctx.beginPath();
    this._starPath(r, 5, r * 0.45);
    const bodyGrad = ctx.createRadialGradient(-r * 0.2, -r * 0.2, 0, 0, 0, r);
    bodyGrad.addColorStop(0, '#ffffff');
    bodyGrad.addColorStop(0.5, color);
    bodyGrad.addColorStop(1, this._darken(color, 0.5));
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // Ojo
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
      const angle = i * step - Math.PI / 2;
      const r     = i % 2 === 0 ? outerR : innerR;
      ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
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
   Pool de Lumas
   ============================================================ */
let lumas = [];

function initLumas() {
  lumas = [];
  for (let i = 0; i < TOTAL_LUMAS; i++) {
    lumas.push(new Luma());
  }
}

/* ============================================================
   Detección de colisiones entre Lumas (circle vs circle)
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
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = a.radius + b.radius;

      if (dist < minDist && dist > 0) {
        // Separar para evitar solapamiento
        const overlap = (minDist - dist) / 2;
        const nx = dx / dist;   // normal unitaria
        const ny = dy / dist;

        a.x -= nx * overlap;
        a.y -= ny * overlap;
        b.x += nx * overlap;
        b.y += ny * overlap;

        // Intercambio de componentes de velocidad en la dirección normal
        // (colisión elástica 1D simplificada, misma masa)
        const dvx = b.vx - a.vx;
        const dvy = b.vy - a.vy;
        const dot  = dvx * nx + dvy * ny;

        if (dot < 0) {         // sólo si se están acercando
          a.vx += dot * nx;
          a.vy += dot * ny;
          b.vx -= dot * nx;
          b.vy -= dot * ny;
        }

        // Para movimiento circular, también corregir centro de órbita
        if (a.moveType === 'circular') { a.cx = a.x; a.cy = a.y; }
        if (b.moveType === 'circular') { b.cx = b.x; b.cy = b.y; }

        // Activar destello en ambas
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
  x: Math.random(),
  y: Math.random(),
  r: Math.random() * 1.5 + 0.3,
  a: Math.random(),
  sp: Math.random() * 0.015 + 0.005,
  phase: Math.random() * Math.PI * 2
}));

function drawBackground(t) {
  if (bgImage.complete && bgImage.naturalWidth > 0) {
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    // Overlay oscuro semitransparente para legibilidad
    ctx.fillStyle = 'rgba(0,0,5,0.45)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    // Fondo procedural
    ctx.fillStyle = '#03001e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Nebulosas
    const neb1 = ctx.createRadialGradient(
      canvas.width * 0.25, canvas.height * 0.35, 10,
      canvas.width * 0.25, canvas.height * 0.35, canvas.width * 0.4
    );
    neb1.addColorStop(0, 'rgba(80,0,160,0.18)');
    neb1.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = neb1; ctx.fillRect(0, 0, canvas.width, canvas.height);

    const neb2 = ctx.createRadialGradient(
      canvas.width * 0.75, canvas.height * 0.6, 10,
      canvas.width * 0.75, canvas.height * 0.6, canvas.width * 0.35
    );
    neb2.addColorStop(0, 'rgba(0,40,140,0.15)');
    neb2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = neb2; ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Estrellas parpadeantes
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
   Bucle principal (requestAnimationFrame)
   ============================================================ */
let frameCount = 0;
let lastTime   = 0;

function gameLoop(timestamp) {
  const t = timestamp / 1000;   // tiempo en segundos
  frameCount++;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Fondo
  drawBackground(t);

  // 2. Física
  lumas.forEach(l => l.update());
  resolveCollisions();

  // 3. Dibujar Lumas
  lumas.forEach(l => l.draw());

  // 4. HUD mínimo (FPS en esquina, útil para depuración)
  // ctx.fillStyle = 'rgba(255,255,255,0.3)';
  // ctx.font = '11px monospace';
  // ctx.fillText(`FPS: ${Math.round(1000/(timestamp-lastTime))}`, 8, 16);

  lastTime = timestamp;
  requestAnimationFrame(gameLoop);
}

/* ============================================================
   Evento de clic en Canvas
   ============================================================ */
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width  / rect.width;
  const scaleY = canvas.height / rect.height;
  const px = (e.clientX - rect.left) * scaleX;
  const py = (e.clientY - rect.top)  * scaleY;

  // Buscar la Luma más cercana que contenga el punto
  // (en orden inverso para "la de encima" primero)
  for (let i = lumas.length - 1; i >= 0; i--) {
    if (lumas[i].alive && lumas[i].contains(px, py)) {
      // Respawn en posición aleatoria
      lumas[i].reset(false);
      incrementScore();

      // Efecto de partícula de "pop" (opcional, ligero)
      spawnParticles(px, py, lumas[i].color);
      break;
    }
  }
});

/* ============================================================
   Sistema de partículas mínimo para feedback visual del clic
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

/* Hook al gameLoop para actualizar/dibujar partículas */
const _origLoop = gameLoop;
function gameLoopWithParticles(ts) {
  // Las partículas se dibujan aquí tras el render principal
  requestAnimationFrame(gameLoopWithParticles);

  const t = ts / 1000;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground(t);
  lumas.forEach(l => l.update());
  resolveCollisions();
  lumas.forEach(l => l.draw());

  // Partículas
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
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.restore();
    return true;
  });
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
   Arranque
   ============================================================ */
initLumas();
requestAnimationFrame(gameLoopWithParticles);
