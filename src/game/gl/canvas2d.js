/* =====================================================
   WEBGL-ДВИЖОК ОТРИСОВКИ
   Понимает те же команды, что обычный холст (drawImage, arc, fill,
   stroke, fillText…), но рисует видеокартой. Поэтому весь код
   отрисовки игры (render/*) работает с ним без изменений, а картинка
   остаётся той же.

   Как устроено:
   - Готовые картинки (спрайты героев, врагов, свечение) один раз
     копируются в большую текстуру-атлас, дальше рисуются с неё.
   - Круги, линии и фигуры режутся на треугольники прямо здесь.
   - Надписи (цифры урона) рисуются один раз в маленькую картинку и
     запоминаются: «28» нарисуется один раз, а показываться будет сотни.
   - Всё за кадр складывается в один список треугольников и уходит на
     видеокарту пачками: новая пачка нужна, только когда меняется
     текстура или способ смешивания (обычный / «свечение»).
   ===================================================== */

const VS = 'attribute vec2 p;attribute vec2 t;attribute vec4 c;uniform vec2 res;varying vec2 vt;varying vec4 vc;' +
  'void main(){vt=t;vc=c;gl_Position=vec4(p.x/res.x*2.0-1.0,1.0-p.y/res.y*2.0,0.0,1.0);}';
// highp там, где есть: на телефонах mediump путает соседние пиксели в большом атласе
const FS = '#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\nuniform sampler2D tex;varying vec2 vt;varying vec4 vc;void main(){gl_FragColor=texture2D(tex,vt)*vc;}';

const MAXV = 6 * 12000;          // вершин в одной пачке
const STRIDE = 20;               // байт на вершину: x, y, u, v (float) + цвет (4 байта)
const PAD = 2;                   // поля вокруг картинки в атласе, чтобы соседи не «просачивались»
const OWN = 320;                 // картинки крупнее — в свою текстуру, а не в атлас
const TAU = Math.PI * 2;

/* ---------- цвета ---------- */
const colorCache = new Map();
const NAMED = { white: [1, 1, 1, 1], black: [0, 0, 0, 1], transparent: [0, 0, 0, 0], red: [1, 0, 0, 1] };
export function parseColor(s) {
  let c = colorCache.get(s);
  if (c) return c;
  c = [0, 0, 0, 1];
  if (typeof s === 'string') {
    const t = s.trim().toLowerCase();
    if (t[0] === '#') {
      let h = t.slice(1);
      if (h.length === 3 || h.length === 4) h = h.split('').map((q) => q + q).join('');
      const n = parseInt(h, 16);
      if (h.length === 8) c = [(n >>> 24 & 255) / 255, (n >>> 16 & 255) / 255, (n >>> 8 & 255) / 255, (n & 255) / 255];
      else c = [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255, 1];
    } else if (t.startsWith('rgb')) {
      const m = t.slice(t.indexOf('(') + 1, t.lastIndexOf(')')).split(/[\s,/]+/).filter(Boolean).map(Number);
      c = [(m[0] || 0) / 255, (m[1] || 0) / 255, (m[2] || 0) / 255, m.length > 3 ? m[3] : 1];
    } else if (NAMED[t]) c = NAMED[t];
  }
  if (colorCache.size > 2000) colorCache.clear();
  colorCache.set(s, c);
  return c;
}
// цвет с учётом общей прозрачности → 4 байта (r,g,b уже умножены на прозрачность)
function packRGBA(r, g, b, a) {
  const A = a < 0 ? 0 : a > 1 ? 1 : a;
  return ((Math.round(A * 255) << 24) | (Math.round(b * A * 255) << 16) | (Math.round(g * A * 255) << 8) | Math.round(r * A * 255)) >>> 0;
}

/* ---------- градиенты (их понимает fillStyle) ---------- */
class Gradient {
  constructor(kind, a) { this.kind = kind; this.a = a; this.stops = []; }
  addColorStop(o, col) { this.stops.push([o, parseColor(col)]); this.stops.sort((x, y) => x[0] - y[0]); }
  // цвет в точке (x, y) — в координатах, в которых градиент задан
  at(x, y) {
    const a = this.a, S = this.stops;
    if (!S.length) return [0, 0, 0, 0];
    let t;
    if (this.kind === 'linear') {
      const dx = a[2] - a[0], dy = a[3] - a[1], l2 = dx * dx + dy * dy || 1;
      t = ((x - a[0]) * dx + (y - a[1]) * dy) / l2;
    } else {
      const d = Math.hypot(x - a[3], y - a[4]);
      t = (d - a[2]) / ((a[5] - a[2]) || 1);
    }
    if (t <= S[0][0]) return S[0][1];
    for (let i = 1; i < S.length; i++) {
      if (t <= S[i][0]) {
        const k = (t - S[i - 1][0]) / ((S[i][0] - S[i - 1][0]) || 1), p = S[i - 1][1], q = S[i][1];
        return [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k, p[2] + (q[2] - p[2]) * k, p[3] + (q[3] - p[3]) * k];
      }
    }
    return S[S.length - 1][1];
  }
}

/* ---------- атлас: много мелких картинок в одной большой текстуре ---------- */
class Atlas {
  constructor(r, size, maxPages) { this.r = r; this.size = size; this.max = maxPages; this.pages = []; this.map = new WeakMap(); this.resets = 0; }
  newPage() {
    const gl = this.r.gl, tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.size, this.size, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    setFilter(gl);
    // белый квадратик в углу: им заливаются фигуры, чтобы не менять текстуру
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 4, 4, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(64).fill(255));
    const pg = { tex, x: 4 + PAD, y: 0, rowH: 4, wu: 2 / this.size, wv: 2 / this.size };
    this.pages.push(pg);
    this.r.boundTex = null;
    return pg;
  }
  reset() {
    const gl = this.r.gl;
    this.r.flush();
    for (const pg of this.pages) gl.deleteTexture(pg.tex);
    this.pages = []; this.map = new WeakMap(); this.r.boundTex = null; this.resets++;
  }
  // место под картинку w×h; если атлас полон — начинаем его заново
  alloc(w, h) {
    for (let pass = 0; pass < 2; pass++) {
      for (const pg of this.pages) {
        if (pg.x + w + PAD > this.size) { pg.x = PAD; pg.y += pg.rowH + PAD; pg.rowH = 0; }
        if (pg.y + h + PAD <= this.size) {
          const at = { pg, x: pg.x, y: pg.y };
          pg.x += w + PAD; pg.rowH = Math.max(pg.rowH, h);
          return at;
        }
      }
      if (this.pages.length < this.max) { this.newPage(); pass--; continue; }
      this.reset();
    }
    return null;
  }
  get(img) {
    let e = this.map.get(img);
    if (e && e.v === (img._glv || 0)) return e;
    const w = img.width, h = img.height;
    if (!e || e.w !== w || e.h !== h) {
      const at = this.alloc(w, h);
      if (!at) return null;
      e = { tex: at.pg.tex, pg: at.pg, x: at.x, y: at.y, w, h, u0: at.x / this.size, v0: at.y / this.size, u1: (at.x + w) / this.size, v1: (at.y + h) / this.size };
    }
    const gl = this.r.gl;
    this.r.flush();
    gl.bindTexture(gl.TEXTURE_2D, e.tex); this.r.boundTex = e.tex;
    try { gl.texSubImage2D(gl.TEXTURE_2D, 0, e.x, e.y, gl.RGBA, gl.UNSIGNED_BYTE, img); } catch (_) { return null; }
    e.v = img._glv || 0;
    this.map.set(img, e);
    return e;
  }
}
function setFilter(gl) {
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}

/* ---------- надписи: каждая рисуется один раз и запоминается ---------- */
const measure = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;
let fontsReady = typeof document === 'undefined' || !document.fonts || document.fonts.status === 'loaded';
const textCache = new Map();
if (!fontsReady) document.fonts.ready.then(() => { fontsReady = true; textCache.clear(); });
function textSprite(s, font, mode, style, lw, join, k) {
  const key = mode + '|' + font + '|' + style + '|' + lw + '|' + join + '|' + k + '|' + s;
  let c = textCache.get(key);
  if (c) { textCache.delete(key); textCache.set(key, c); return c; }
  measure.font = font;
  const m = measure.measureText(s), px = parseFloat((/(\d+(?:\.\d+)?)px/.exec(font) || [0, 16])[1]);
  const asc = m.actualBoundingBoxAscent || px * 0.8, desc = m.actualBoundingBoxDescent || px * 0.25;
  const pad = Math.ceil(lw) + 2, cw = Math.ceil(m.width) + pad * 2, ch = Math.ceil(asc + desc) + pad * 2;
  c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(cw * k)); c.height = Math.max(1, Math.ceil(ch * k));
  const x = c.getContext('2d');
  x.scale(k, k); x.font = font; x.textBaseline = 'alphabetic'; x.lineJoin = join;
  if (mode === 'fill') { x.fillStyle = style; x.fillText(s, pad, pad + asc); }
  else { x.strokeStyle = style; x.lineWidth = lw; x.strokeText(s, pad, pad + asc); }
  c.tw = m.width; c.cw = cw; c.ch = ch; c.pad = pad; c.asc = asc; c._glText = true;
  // забытые надписи не держим: последних 600 хватает с запасом (цифры урона повторяются).
  // Пока шрифт игры не загрузился, надписи временные: с загрузкой шрифта они нарисуются заново
  textCache.set(key, c); if (textCache.size > 600) textCache.delete(textCache.keys().next().value);
  return c;
}

/* ---------- сам движок ---------- */
export function createGLContext(canvas, opts) {
  const attrs = { alpha: false, antialias: !(opts && opts.noAA), premultipliedAlpha: true, preserveDrawingBuffer: false, stencil: true, depth: false, powerPreference: 'high-performance' };
  let gl = null;
  try { gl = canvas.getContext('webgl2', attrs) || canvas.getContext('webgl', attrs); } catch (_) { gl = null; }
  if (!gl) return null;
  const r = new GLCanvas(canvas, gl, opts && opts.onFail);
  return r.ok ? r : null;
}

class GLCanvas {
  constructor(canvas, gl, onFail) {
    this.canvas = canvas; this.gl = gl; this.isGL = true; this.ok = false; this.lost = false;
    // состояние «как у холста»
    this.m = [1, 0, 0, 1, 0, 0]; this.stack = [];
    this.globalAlpha = 1; this.globalCompositeOperation = 'source-over';
    this.fillStyle = '#000'; this.strokeStyle = '#000'; this.lineWidth = 1; this.lineCap = 'butt'; this.lineJoin = 'miter';
    this.font = '10px sans-serif'; this.textAlign = 'start'; this.textBaseline = 'alphabetic';
    this.dash = []; this.lineDashOffset = 0;
    this.path = []; this.sub = null;
    this.buf = new ArrayBuffer(MAXV * STRIDE); this.f32 = new Float32Array(this.buf); this.u32 = new Uint32Array(this.buf); this.n = 0;
    this.stats = { draws: 0, verts: 0 }; this.frameStats = { draws: 0, verts: 0 };
    // Видеокарта может «отвалиться» (сон ноутбука, сбой драйвера). Обычно браузер
    // возвращает её сам; не вернул за 3 секунды — переходим на обычный холст
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault(); this.lost = true;
      clearTimeout(this.lostT); this.lostT = setTimeout(() => { if (this.lost && onFail) onFail(); }, 3000);
    }, false);
    canvas.addEventListener('webglcontextrestored', () => { clearTimeout(this.lostT); this.init(); }, false);
    this.init();
  }
  init() {
    const gl = this.gl;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
    const vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return;
    const pr = gl.createProgram();
    gl.attachShader(pr, vs); gl.attachShader(pr, fs);
    gl.bindAttribLocation(pr, 0, 'p'); gl.bindAttribLocation(pr, 1, 't'); gl.bindAttribLocation(pr, 2, 'c');
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
    gl.useProgram(pr);
    this.uRes = gl.getUniformLocation(pr, 'res');
    gl.uniform1i(gl.getUniformLocation(pr, 'tex'), 0);
    this.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, this.buf.byteLength, gl.STREAM_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, STRIDE, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, STRIDE, 8);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.UNSIGNED_BYTE, true, STRIDE, 16);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.enable(gl.BLEND); gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); this.add = false;
    const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 2048;
    // Все картинки игры помещаются на одну страницу 4096×4096 (64 МБ видеопамяти) —
    // тогда видеокарте не надо переключаться между страницами. Где таких больших
    // текстур нет (старые телефоны), страницы 2048×2048, до четырёх штук.
    const big = maxTex >= 8192;
    this.sprites = new Atlas(this, big ? 4096 : Math.min(2048, maxTex), big ? 2 : 4);
    this.texts = new Atlas(this, Math.min(2048, maxTex), 1);
    this.own = new WeakMap();
    this.curTex = null; this.boundTex = null; this.white = null;
    this.vw = 0; this.vh = 0;
    this.lost = false; this.ok = true;
  }

  /* --- пачки треугольников --- */
  // «Свечение» (lighter) — это сложение цветов. Отдельный режим смешивания не нужен:
  // смешивание здесь всегда «цвет + фон × (1 − прозрачность)», и если у вершины
  // прозрачность 0, остаётся «цвет + фон». Так обычное и светящееся рисуются в одной пачке.
  setBlend(op) { this.add = op === 'lighter'; }
  ck(col) { return this.add ? (col & 0x00ffffff) >>> 0 : col; }
  useTex(tex) { if (tex !== this.curTex) { this.flush(); this.curTex = tex; } }
  room(v) { if (this.n + v > MAXV) this.flush(); }
  flush() {
    if (!this.n || this.lost) { this.n = 0; return; }
    const gl = this.gl;
    if (this.vw !== this.canvas.width || this.vh !== this.canvas.height) {
      this.vw = this.canvas.width; this.vh = this.canvas.height;
      gl.viewport(0, 0, this.vw, this.vh); gl.uniform2f(this.uRes, this.vw, this.vh);
    }
    if (this.boundTex !== this.curTex) { gl.bindTexture(gl.TEXTURE_2D, this.curTex); this.boundTex = this.curTex; }
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.f32.subarray(0, this.n * 5));
    gl.drawArrays(gl.TRIANGLES, 0, this.n);
    this.stats.draws++; this.stats.verts += this.n;
    this.n = 0;
  }
  vtx(x, y, u, v, col) {
    const o = this.n * 5;
    this.f32[o] = x; this.f32[o + 1] = y; this.f32[o + 2] = u; this.f32[o + 3] = v; this.u32[o + 4] = col;
    this.n++;
  }
  // заливка без картинки: белый квадратик любой страницы атласа
  solidUV() {
    let pg = this.sprites.pages.find((q) => q.tex === this.curTex) || this.texts.pages.find((q) => q.tex === this.curTex);
    if (!pg) { if (!this.sprites.pages.length) this.sprites.newPage(); pg = this.sprites.pages[0]; this.useTex(pg.tex); }
    return pg.wu;
  }

  /* --- преобразования, как у холста --- */
  setTransform(a, b, c, d, e, f) { const m = this.m; m[0] = a; m[1] = b; m[2] = c; m[3] = d; m[4] = e; m[5] = f; }
  resetTransform() { this.setTransform(1, 0, 0, 1, 0, 0); }
  transform(a, b, c, d, e, f) {
    const m = this.m, A = m[0], B = m[1], C = m[2], D = m[3];
    m[0] = A * a + C * b; m[1] = B * a + D * b; m[2] = A * c + C * d; m[3] = B * c + D * d;
    m[4] += A * e + C * f; m[5] += B * e + D * f;
  }
  translate(x, y) { this.transform(1, 0, 0, 1, x, y); }
  scale(x, y) { this.transform(x, 0, 0, y, 0, 0); }
  rotate(a) { const c = Math.cos(a), s = Math.sin(a); this.transform(c, s, -s, c, 0, 0); }
  save() {
    this.stack.push([this.m.slice(), this.globalAlpha, this.globalCompositeOperation, this.fillStyle, this.strokeStyle, this.lineWidth,
      this.lineCap, this.lineJoin, this.font, this.textAlign, this.textBaseline, this.dash, this.lineDashOffset]);
  }
  restore() {
    const s = this.stack.pop(); if (!s) return;
    this.m = s[0]; [, this.globalAlpha, this.globalCompositeOperation, this.fillStyle, this.strokeStyle, this.lineWidth,
      this.lineCap, this.lineJoin, this.font, this.textAlign, this.textBaseline, this.dash, this.lineDashOffset] = s;
  }
  scaleK() { const m = this.m; return Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2])) || 1; }
  setLineDash(a) { this.dash = a && a.length ? (a.length % 2 ? a.concat(a) : a.slice()) : []; }
  getLineDash() { return this.dash.slice(); }
  createLinearGradient(x0, y0, x1, y1) { return new Gradient('linear', [x0, y0, x1, y1]); }
  createRadialGradient(x0, y0, r0, x1, y1, r1) { return new Gradient('radial', [x0, y0, r0, x1, y1, r1]); }
  measureText(s) { measure.font = this.font; return measure.measureText(s); }

  /* --- очистка экрана (с неё начинается каждый кадр) --- */
  clearRect() {
    this.flush();
    // сколько пачек и вершин ушло на видеокарту за прошлый кадр — для плашки FPS
    this.frameStats = { draws: this.stats.draws, verts: this.stats.verts }; this.stats.draws = 0; this.stats.verts = 0;
    if (this.lost) return;
    const gl = this.gl;
    if (this.vw !== this.canvas.width || this.vh !== this.canvas.height) {
      this.vw = this.canvas.width; this.vh = this.canvas.height;
      gl.viewport(0, 0, this.vw, this.vh); gl.uniform2f(this.uRes, this.vw, this.vh);
    }
    gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
  }

  /* --- картинки --- */
  texFor(img) {
    if (!img || !img.width || !img.height) return null;
    if (img._glText) return this.texts.get(img);
    if (img._glOwn || img.width > OWN || img.height > OWN) {
      let e = this.own.get(img);
      const gl = this.gl, v = img._glv || 0;
      if (!e) { e = { tex: gl.createTexture(), v: -1, u0: 0, v0: 0, u1: 1, v1: 1 }; this.own.set(img, e); gl.bindTexture(gl.TEXTURE_2D, e.tex); setFilter(gl); this.boundTex = e.tex; }
      if (e.v !== v || e.w !== img.width || e.h !== img.height) {
        if (e.tex === this.curTex) this.flush();
        gl.bindTexture(gl.TEXTURE_2D, e.tex); this.boundTex = e.tex;
        // тот же размер (герой каждый кадр) — переписываем на месте, без новой памяти
        try {
          if (e.w === img.width && e.h === img.height) gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, img);
          else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        } catch (_) { return null; }
        e.v = v; e.w = img.width; e.h = img.height;
      }
      return e;
    }
    return this.sprites.get(img);
  }
  drawImage(img, a, b, c, d, e, f, g, h) {
    if (this.lost) return;
    let sx = 0, sy = 0, sw = img.width, sh = img.height, dx, dy, dw, dh;
    if (e === undefined) { dx = a; dy = b; dw = c === undefined ? img.width : c; dh = d === undefined ? img.height : d; }
    else { sx = a; sy = b; sw = c; sh = d; dx = e; dy = f; dw = g; dh = h; }
    const al = this.globalAlpha;
    if (!(al > 0) || !dw || !dh) return;
    this.setBlend(this.globalCompositeOperation);
    const t = this.texFor(img); if (!t) return;
    this.useTex(t.tex); this.room(6);
    const W = img.width, H = img.height;
    const u0 = t.u0 + (t.u1 - t.u0) * sx / W, u1 = t.u0 + (t.u1 - t.u0) * (sx + sw) / W;
    const v0 = t.v0 + (t.v1 - t.v0) * sy / H, v1 = t.v0 + (t.v1 - t.v0) * (sy + sh) / H;
    const m = this.m, col = this.ck(packRGBA(1, 1, 1, al));
    const x0 = m[0] * dx + m[2] * dy + m[4], y0 = m[1] * dx + m[3] * dy + m[5];
    const ax = m[0] * dw, ay = m[1] * dw, bx = m[2] * dh, by = m[3] * dh;
    this.vtx(x0, y0, u0, v0, col); this.vtx(x0 + ax, y0 + ay, u1, v0, col); this.vtx(x0 + bx, y0 + by, u0, v1, col);
    this.vtx(x0 + ax, y0 + ay, u1, v0, col); this.vtx(x0 + ax + bx, y0 + ay + by, u1, v1, col); this.vtx(x0 + bx, y0 + by, u0, v1, col);
  }

  /* --- пути --- */
  beginPath() { this.path.length = 0; this.sub = null; }
  pt(x, y) { const m = this.m; return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]; }
  moveTo(x, y) { const p = this.pt(x, y); this.sub = { pts: [p[0], p[1]], closed: false }; this.path.push(this.sub); }
  lineTo(x, y) {
    if (!this.sub) { this.moveTo(x, y); return; }
    if (this.sub.closed) this.reopen();
    const p = this.pt(x, y); this.sub.pts.push(p[0], p[1]);
  }
  reopen() { const s = this.sub.pts; this.sub = { pts: [s[0], s[1]], closed: false }; this.path.push(this.sub); }
  last() { const s = this.sub.pts; return [s[s.length - 2], s[s.length - 1]]; }
  quadraticCurveTo(cx, cy, x, y) {
    if (!this.sub) this.moveTo(cx, cy);
    if (this.sub.closed) this.reopen();
    const p0 = this.last(), p1 = this.pt(cx, cy), p2 = this.pt(x, y);
    const n = Math.max(2, Math.min(24, Math.ceil((Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) + Math.hypot(p2[0] - p1[0], p2[1] - p1[1])) / 5)));
    const s = this.sub.pts;
    for (let i = 1; i <= n; i++) {
      const t = i / n, u = 1 - t;
      s.push(u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]);
    }
  }
  bezierCurveTo(c1x, c1y, c2x, c2y, x, y) {
    if (!this.sub) this.moveTo(c1x, c1y);
    if (this.sub.closed) this.reopen();
    const p0 = this.last(), p1 = this.pt(c1x, c1y), p2 = this.pt(c2x, c2y), p3 = this.pt(x, y);
    const L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) + Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) + Math.hypot(p3[0] - p2[0], p3[1] - p2[1]);
    const n = Math.max(3, Math.min(32, Math.ceil(L / 5))), s = this.sub.pts;
    for (let i = 1; i <= n; i++) {
      const t = i / n, u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
      s.push(a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]);
    }
  }
  arc(x, y, r, a0, a1, ccw) { this.ellipse(x, y, r, r, 0, a0, a1, ccw); }
  ellipse(x, y, rx, ry, rot, a0, a1, ccw) {
    if (!(rx >= 0) || !(ry >= 0)) return;
    let da = a1 - a0;
    if (!ccw) { if (da >= TAU) da = TAU; else { while (da < 0) da += TAU; } }
    else { if (-da >= TAU) da = -TAU; else { while (da > 0) da -= TAU; } }
    const rdev = Math.max(rx, ry) * this.scaleK();
    const n = Math.max(3, Math.min(128, Math.ceil(Math.abs(da) / TAU * Math.max(10, Math.sqrt(rdev) * 6))));
    const cr = Math.cos(rot), sr = Math.sin(rot), m = this.m;
    if (!this.sub || this.sub.closed) { this.sub = { pts: [], closed: false }; this.path.push(this.sub); }
    const s = this.sub.pts;
    for (let i = 0; i <= n; i++) {
      const t = a0 + da * i / n, ex = Math.cos(t) * rx, ey = Math.sin(t) * ry;
      const lx = x + ex * cr - ey * sr, ly = y + ex * sr + ey * cr;
      s.push(m[0] * lx + m[2] * ly + m[4], m[1] * lx + m[3] * ly + m[5]);
    }
  }
  rect(x, y, w, h) {
    const a = this.pt(x, y), b = this.pt(x + w, y), c = this.pt(x + w, y + h), d = this.pt(x, y + h);
    this.path.push({ pts: [a[0], a[1], b[0], b[1], c[0], c[1], d[0], d[1]], closed: true });
    this.sub = { pts: [a[0], a[1]], closed: false }; this.path.push(this.sub);
  }
  closePath() { if (this.sub && this.sub.pts.length >= 4) this.sub.closed = true; }

  /* --- заливка --- */
  fillRect(x, y, w, h) { const keep = this.path, ks = this.sub; this.path = []; this.sub = null; this.rect(x, y, w, h); this.fill(); this.path = keep; this.sub = ks; }
  fill(rule) {
    if (this.lost) return;
    const al = this.globalAlpha, st = this.fillStyle;
    if (!(al > 0)) return;
    // Несколько контуров в одной заливке (например, «экран с круглой дырой» за краем
    // поляны) — нужна настоящая заливка с дырами по правилу холста
    let subs = 0;
    for (const sp of this.path) if (sp.pts.length >= 6) subs++;
    if (subs > 1) { this.fillHoles(rule === 'evenodd'); return; }
    this.setBlend(this.globalCompositeOperation);
    const grad = st instanceof Gradient ? st : null, c = grad ? null : parseColor(st);
    if (c && !(c[3] > 0)) return;
    const col = c ? this.ck(packRGBA(c[0], c[1], c[2], c[3] * al)) : 0;
    let inv = null;
    if (grad) { const m = this.m, det = m[0] * m[3] - m[1] * m[2] || 1; inv = [m[3] / det, -m[1] / det, -m[2] / det, m[0] / det, (m[2] * m[5] - m[3] * m[4]) / det, (m[1] * m[4] - m[0] * m[5]) / det]; }
    const uv = this.solidUV();
    const colAt = (x, y) => {
      if (!grad) return col;
      const lx = inv[0] * x + inv[2] * y + inv[4], ly = inv[1] * x + inv[3] * y + inv[5], q = grad.at(lx, ly);
      return this.ck(packRGBA(q[0], q[1], q[2], q[3] * al));
    };
    for (const sp of this.path) {
      let p = sp.pts, k = p.length >> 1;
      if (k >= 2 && p[0] === p[2 * k - 2] && p[1] === p[2 * k - 1]) k--;
      if (k < 3) continue;
      const tris = convex(p, k) ? null : earcut(p, k);
      this.room((tris ? tris.length : (k - 2) * 3));
      if (this.n === 0) this.solidUV();
      if (!tris) {
        const c0 = colAt(p[0], p[1]);
        for (let i = 1; i < k - 1; i++) {
          this.vtx(p[0], p[1], uv, uv, c0);
          this.vtx(p[2 * i], p[2 * i + 1], uv, uv, colAt(p[2 * i], p[2 * i + 1]));
          this.vtx(p[2 * i + 2], p[2 * i + 3], uv, uv, colAt(p[2 * i + 2], p[2 * i + 3]));
        }
      } else for (let i = 0; i < tris.length; i++) { const j = tris[i]; this.vtx(p[2 * j], p[2 * j + 1], uv, uv, colAt(p[2 * j], p[2 * j + 1])); }
    }
  }

  // Заливка с дырами «через трафарет»: сначала все контуры веером пишутся только
  // в трафарет (каждый слой переворачивает чётность или считает обороты), потом
  // прямоугольник вокруг фигуры красится там, где трафарет не ноль. Так
  // получаются ровно те же дыры, что у обычного холста, при любых пересечениях
  fillHoles(evenodd) {
    const gl = this.gl, al = this.globalAlpha, st = this.fillStyle;
    this.setBlend(this.globalCompositeOperation);
    const grad = st instanceof Gradient ? st : null, c = grad ? (st.stops[0] ? st.stops[0][1] : [0, 0, 0, 1]) : parseColor(st);
    if (!(c[3] > 0)) return;
    const col = this.ck(packRGBA(c[0], c[1], c[2], c[3] * al)), uv = this.solidUV();
    this.flush();
    gl.enable(gl.STENCIL_TEST); gl.stencilMask(0xff); gl.clearStencil(0); gl.clear(gl.STENCIL_BUFFER_BIT);
    gl.colorMask(false, false, false, false);
    gl.stencilFunc(gl.ALWAYS, 0, 0xff);
    if (evenodd) gl.stencilOp(gl.KEEP, gl.KEEP, gl.INVERT);
    else { gl.stencilOpSeparate(gl.FRONT, gl.KEEP, gl.KEEP, gl.INCR_WRAP); gl.stencilOpSeparate(gl.BACK, gl.KEEP, gl.KEEP, gl.DECR_WRAP); }
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const sp of this.path) {
      const p = sp.pts, k = p.length >> 1;
      if (k < 3) continue;
      for (let i = 0; i < k; i++) { const x = p[2 * i], y = p[2 * i + 1]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      for (let i = 1; i < k - 1; i++) {
        this.room(3);
        this.vtx(p[0], p[1], uv, uv, col); this.vtx(p[2 * i], p[2 * i + 1], uv, uv, col); this.vtx(p[2 * i + 2], p[2 * i + 3], uv, uv, col);
      }
    }
    this.flush();
    gl.colorMask(true, true, true, true);
    gl.stencilFunc(gl.NOTEQUAL, 0, 0xff); gl.stencilOp(gl.ZERO, gl.ZERO, gl.ZERO);
    if (x1 > x0 && y1 > y0) {
      this.vtx(x0, y0, uv, uv, col); this.vtx(x1, y0, uv, uv, col); this.vtx(x0, y1, uv, uv, col);
      this.vtx(x1, y0, uv, uv, col); this.vtx(x1, y1, uv, uv, col); this.vtx(x0, y1, uv, uv, col);
    }
    this.flush();
    gl.disable(gl.STENCIL_TEST);
  }

  /* --- обводка --- */
  stroke() {
    if (this.lost) return;
    const st = this.strokeStyle;
    let al = this.globalAlpha;
    const c = st instanceof Gradient ? (st.stops[0] ? st.stops[0][1] : [0, 0, 0, 1]) : parseColor(st);
    if (!(al > 0) || !(c[3] > 0)) return;
    const K = this.scaleK();
    let w = this.lineWidth * K;
    if (!(w > 0)) return;
    if (w < 1) { al *= w; w = 1; }   // тоньше пикселя: рисуем пиксель, но бледнее — как холст
    this.setBlend(this.globalCompositeOperation);
    const col = this.ck(packRGBA(c[0], c[1], c[2], c[3] * al)), uv = this.solidUV(), hw = w / 2;
    const dash = this.dash.length ? this.dash.map((v) => v * K) : null;
    for (const sp of this.path) {
      let p = sp.pts;
      if (p.length < 4) continue;
      if (sp.closed) p = p.concat([p[0], p[1]]);
      const lines = dash ? dashed(p, dash, this.lineDashOffset * K) : [p];
      for (const l of lines) this.polyline(l, hw, col, uv, sp.closed && !dash);
    }
  }
  polyline(p, hw, col, uv, closed) {
    const k = p.length >> 1;
    if (k < 2) return;
    this.room(k * 18 + 60);
    if (this.n === 0) this.solidUV();
    // для каждой точки — сдвиг на полширины линии (со стыком «уголком», как у холста)
    const L = [], R = [];
    for (let i = 0; i < k; i++) {
      const ip = i > 0 ? i - 1 : closed ? k - 2 : -1, inx = i < k - 1 ? i + 1 : closed ? 1 : -1;
      let nx = 0, ny = 0, len = hw;
      const d0 = ip >= 0 ? norm(p[2 * i] - p[2 * ip], p[2 * i + 1] - p[2 * ip + 1]) : null;
      const d1 = inx >= 0 ? norm(p[2 * inx] - p[2 * i], p[2 * inx + 1] - p[2 * i + 1]) : null;
      if (d0 && d1) {
        const mx = -(d0[1] + d1[1]), my = d0[0] + d1[0], ml = Math.hypot(mx, my);
        if (ml > 1e-6) {
          nx = mx / ml; ny = my / ml;
          const cosA = nx * -d1[1] + ny * d1[0];
          len = cosA > 0.25 ? hw / cosA : hw;   // слишком острый угол — без длинного «шипа»
        } else { nx = -d1[1]; ny = d1[0]; }
      } else { const d = d1 || d0 || [1, 0]; nx = -d[1]; ny = d[0]; }
      L.push(p[2 * i] + nx * len, p[2 * i + 1] + ny * len); R.push(p[2 * i] - nx * len, p[2 * i + 1] - ny * len);
    }
    for (let i = 0; i < k - 1; i++) {
      const a = 2 * i, b = 2 * i + 2;
      this.vtx(L[a], L[a + 1], uv, uv, col); this.vtx(R[a], R[a + 1], uv, uv, col); this.vtx(L[b], L[b + 1], uv, uv, col);
      this.vtx(R[a], R[a + 1], uv, uv, col); this.vtx(R[b], R[b + 1], uv, uv, col); this.vtx(L[b], L[b + 1], uv, uv, col);
    }
    if (!closed && this.lineCap !== 'butt') {
      for (const [i, j] of [[0, 1], [k - 1, k - 2]]) {
        const x = p[2 * i], y = p[2 * i + 1], d = norm(x - p[2 * j], y - p[2 * j + 1]) || [1, 0];
        if (this.lineCap === 'square') {
          const ex = d[0] * hw, ey = d[1] * hw, nx = -d[1] * hw, ny = d[0] * hw;
          this.vtx(x + nx, y + ny, uv, uv, col); this.vtx(x - nx, y - ny, uv, uv, col); this.vtx(x + nx + ex, y + ny + ey, uv, uv, col);
          this.vtx(x - nx, y - ny, uv, uv, col); this.vtx(x - nx + ex, y - ny + ey, uv, uv, col); this.vtx(x + nx + ex, y + ny + ey, uv, uv, col);
        } else {
          // круглый конец: полукруг наружу
          const seg = hw > 3 ? 8 : 4, a0 = Math.atan2(d[1], d[0]) - Math.PI / 2;
          for (let s = 0; s < seg; s++) {
            const t0 = a0 + Math.PI * s / seg, t1 = a0 + Math.PI * (s + 1) / seg;
            this.vtx(x, y, uv, uv, col); this.vtx(x + Math.cos(t0) * hw, y + Math.sin(t0) * hw, uv, uv, col); this.vtx(x + Math.cos(t1) * hw, y + Math.sin(t1) * hw, uv, uv, col);
          }
        }
      }
    }
  }

  /* --- надписи --- */
  fillText(s, x, y) { this.text(String(s), x, y, 'fill', this.fillStyle); }
  strokeText(s, x, y) { this.text(String(s), x, y, 'stroke', this.strokeStyle); }
  text(s, x, y, mode, style) {
    if (this.lost || !s) return;
    const K = this.scaleK(), k = Math.min(4, Math.max(1, Math.round(K * 2) / 2));
    const c = textSprite(s, this.font, mode, typeof style === 'string' ? style : '#000', mode === 'stroke' ? this.lineWidth : 0, this.lineJoin, k);
    const al = this.textAlign;
    let ox = 0;
    if (al === 'center') ox = -c.tw / 2; else if (al === 'right' || al === 'end') ox = -c.tw;
    let oy = 0;
    if (this.textBaseline === 'middle') oy = c.asc / 2; else if (this.textBaseline === 'top' || this.textBaseline === 'hanging') oy = c.asc;
    this.drawImage(c, x + ox - c.pad, y + oy - c.pad - c.asc, c.cw, c.ch);
  }
}

function norm(x, y) { const l = Math.hypot(x, y); return l > 1e-9 ? [x / l, y / l] : null; }

// Выпуклая ли фигура (круг, эллипс, прямоугольник) — её можно резать «веером»
function convex(p, k) {
  let sign = 0, turn = 0;
  for (let i = 0; i < k; i++) {
    const a = i, b = (i + 1) % k, c = (i + 2) % k;
    const x1 = p[2 * b] - p[2 * a], y1 = p[2 * b + 1] - p[2 * a + 1], x2 = p[2 * c] - p[2 * b], y2 = p[2 * c + 1] - p[2 * b + 1];
    const cr = x1 * y2 - y1 * x2;
    if (Math.abs(cr) > 1e-7) { const s = cr > 0 ? 1 : -1; if (sign && s !== sign) return false; sign = s; }
    turn += Math.atan2(cr, x1 * x2 + y1 * y2);
  }
  return Math.abs(Math.abs(turn) - TAU) < 0.5;
}

// Невыпуклая фигура (звезда, шип, лист) — режем «отрезанием ушей»
function earcut(p, k) {
  let area = 0;
  for (let i = 0, j = k - 1; i < k; j = i++) area += p[2 * j] * p[2 * i + 1] - p[2 * i] * p[2 * j + 1];
  const idx = []; for (let i = 0; i < k; i++) idx.push(i);
  if (area < 0) idx.reverse();
  const out = [];
  const cross = (a, b, c) => (p[2 * b] - p[2 * a]) * (p[2 * c + 1] - p[2 * a + 1]) - (p[2 * b + 1] - p[2 * a + 1]) * (p[2 * c] - p[2 * a]);
  const inside = (a, b, c, q) => cross(a, b, q) >= 0 && cross(b, c, q) >= 0 && cross(c, a, q) >= 0;
  let guard = 0;
  while (idx.length > 3 && guard++ < 4000) {
    let cut = false;
    for (let i = 0; i < idx.length; i++) {
      const a = idx[(i + idx.length - 1) % idx.length], b = idx[i], c = idx[(i + 1) % idx.length];
      if (cross(a, b, c) <= 1e-9) continue;
      let ok = true;
      for (let j = 0; j < idx.length; j++) { const q = idx[j]; if (q !== a && q !== b && q !== c && inside(a, b, c, q)) { ok = false; break; } }
      if (!ok) continue;
      out.push(a, b, c); idx.splice(i, 1); cut = true; break;
    }
    if (!cut) break;
  }
  // осталось что-то неразрезаемое (самопересечение) — добиваем веером
  for (let i = 1; i < idx.length - 1; i++) out.push(idx[0], idx[i], idx[i + 1]);
  return out;
}

// Пунктир: режем ломаную на кусочки «штрих — пробел»
function dashed(p, pat, off) {
  const out = [], total = pat.reduce((a, b) => a + b, 0);
  if (!(total > 0)) return [p];
  let pi = 0, left = pat[0], on = true;
  let o = ((off % total) + total) % total;
  while (o > 0) { if (o >= left) { o -= left; pi = (pi + 1) % pat.length; left = pat[pi]; on = !on; } else { left -= o; o = 0; } }
  let cur = on ? [p[0], p[1]] : null;
  for (let i = 0; i + 3 < p.length; i += 2) {
    let x = p[i], y = p[i + 1];
    const ex = p[i + 2], ey = p[i + 3];
    let seg = Math.hypot(ex - x, ey - y);
    while (seg > 1e-9) {
      const step = Math.min(seg, left), k = step / seg;
      x += (ex - x) * k; y += (ey - y) * k; seg -= step; left -= step;
      if (on) cur.push(x, y);
      if (left <= 1e-9) {
        if (on && cur.length >= 4) out.push(cur);
        pi = (pi + 1) % pat.length; left = pat[pi]; on = !on;
        cur = on ? [x, y] : null;
      }
    }
  }
  if (on && cur && cur.length >= 4) out.push(cur);
  return out;
}
