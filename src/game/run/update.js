/* =====================================================
   ОБНОВЛЕНИЕ МИРА (каждый кадр)
   ===================================================== */
import { TAU, rnd } from '../gfx.js';
import { TYPES, BOSSES, MAXE, DOOM_T, DOOM } from '../data.js';
import { BIOMES, BIOME_EVERY, HELL } from '../sprites/biomes.js';
import { stick, keys } from '../input.js';
import { state, G, GRACE_RAMP } from './state.js';
import { toast, burst, pop, addFx } from './fx.js';
import { spawnDist, pickType, spawnEnemy, enemyAI, separate } from './enemies.js';
import { addXp, usePickup, hurtPlayer, hitEnemy } from './combat.js';
import { TRAIL, TRAILC, explode, updateWeapons } from './weapons.js';
import { openChest } from './chests.js';
import { openLevelUp } from './levelup.js';
import { sendBeat } from './session.js';
import { compact, alive, corpseVisible, notDead, notTaken, ringVisible } from './compact.js';
import { clampToArena, arenaSpot } from './arena.js';
import { makeMiniboss } from './elites.js';
import { tickLegend } from './legend.js';

// Направление, куда бежит герой в этом кадре: нужно и движению, и искрам от ускорения.
// Один объект на всю игру, а не новый на каждый кадр.
const moveDir = { ix: 0, iy: 0 };

export function update(dt) {
  // передышка после выбора: сначала стоп, потом плавный разгон до нормальной скорости
  if (G.grace > 0) {
    const left = G.grace;
    G.grace = Math.max(0, left - dt);
    dt *= left > GRACE_RAMP ? 0 : 1 - left / GRACE_RAMP;
    if (dt <= 0) return;
  }
  const g = G, p = g.p, t = (g.t += dt);
  if (t >= g.run.nextBeat) { g.run.nextBeat += 15; sendBeat(g); }
  movePlayer(dt, g, p);
  updateTimeline(dt, g, p, t);
  spawnEnemies(dt, g, t);
  moveEnemies(dt, g, p);
  separate(dt);
  updateWeapons(dt);
  moveShots(dt, g, p);
  moveEnemyShots(dt, g, p);
  collectLoot(dt, g, p);
  tickBuffs(dt, g, p);
  tickLegend(dt);
  const chestHit = touchChests(dt, g, p);
  cleanupWorld(dt, g);
  levelUpOrChest(g, p, chestHit);
}

// Движение героя: клавиатура или джойстик, таймеры героя, пыль из-под ног
function movePlayer(dt, g, p) {
  let ix = 0, iy = 0;
  if (keys.size) {
    ix = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0);
    iy = (keys.has('down') ? 1 : 0) - (keys.has('up') ? 1 : 0);
    const m = Math.hypot(ix, iy); if (m > 1) { ix /= m; iy /= m; }
  } else { ix = stick.vx; iy = stick.vy; }
  const hasteK = (g.buffs.haste > 0 ? 1.4 : 1) * (p.webT > 0 ? 0.6 : 1);
  if (p.webT > 0) p.webT -= dt;
  p.x += ix * p.speed * hasteK * dt; p.y += iy * p.speed * hasteK * dt;
  clampToArena(p, p.r + 4);
  p.moving = Math.hypot(ix, iy) > 0.05;
  if (p.moving) { p.walkT += dt * (0.6 + Math.hypot(ix, iy) * 0.6); const m = Math.hypot(ix, iy); p.dirX = ix / m; p.dirY = iy / m; }
  if (p.faceLock > 0) p.faceLock -= dt;
  else if (ix > 0.2) p.face = 1; else if (ix < -0.2) p.face = -1;
  p.hp = Math.min(p.maxHp, p.hp + p.regen * dt);
  if (p.inv > 0) p.inv -= dt;
  if (p.hurt > 0) p.hurt -= dt;
  if (p.atk >= 0) { p.atk += dt / p.atkDur; if (p.atk >= 1) p.atk = -1; }
  if (p.moving) {
    g.dustT -= dt;
    if (g.dustT <= 0) {
      const fast = g.buffs.haste > 0;
      g.dustT = fast ? 0.06 : 0.13;
      addFx({ type: 'dust', x: p.x + rnd(-5, 5), y: p.y + 17, vx: -ix * 30, vy: -iy * 20 - 8, life: 0.45, T: 0.45, r: rnd(3, 5), col: fast ? '122,240,192' : '170,190,170' });
    }
  }
  moveDir.ix = ix; moveDir.iy = iy;
}

// Ход времени: новые враги в списке, Волна смерти, смена местности, запас вампиризма
function updateTimeline(dt, g, p, t) {
  while (g.unlocked < TYPES.length && t >= TYPES[g.unlocked].from) { toast('Новый враг: ' + TYPES[g.unlocked].name); g.unlocked++; }

  // Волна смерти
  if (!g.doomWarn && t >= DOOM_T - 30) { g.doomWarn = true; toast('Через 30 секунд начнётся Волна смерти!'); }
  if (!g.doom && t >= DOOM_T) { g.doom = true; g.flash = 0.35; g.shake = 0.6; toast('ВОЛНА СМЕРТИ! Враги сильнее с каждой минутой'); }
  if (g.doom) {
    const m = Math.floor((t - DOOM_T) / 60);
    if (m > g.doomMin) { g.doomMin = m; g.shake = 0.3; toast('Волна смерти усилилась: ' + (m + 1) + '-я минута'); }
  }
  // смена местности
  {
    const want = g.doom ? HELL : g.biomeOrder[Math.min(g.biomeOrder.length - 1, Math.floor(t / BIOME_EVERY))];
    if (want !== g.biome) {
      g.biomePrev = g.biome; g.biome = want; g.biomeK = 0;
      if (want !== HELL) toast('Местность: ' + BIOMES[want].name);
    }
    if (g.biomeK < 1) g.biomeK = Math.min(1, g.biomeK + dt / 3);
  }
  g.vampBank = Math.min(p.maxHp * 0.04, g.vampBank + p.maxHp * 0.03 * dt);
}

// Появление врагов: постоянный поток, волны, элита, боссы
function spawnEnemies(dt, g, t) {
  const maxE = g.doom ? 320 : MAXE;
  // в начале врагов поменьше, к пятой минуте — столько же, сколько раньше
  const rate = g.doom ? 16 + (t - DOOM_T) / 60 * 5 : Math.min(13, 0.6 + t * 0.014 + t * t * 0.00005);
  if (g.enemies.length < maxE) {
    g.spawnAcc += rate * dt;
    while (g.spawnAcc >= 1) { g.spawnAcc -= 1; spawnEnemy(g.doom && Math.random() < 0.35 ? DOOM : pickType(t)); }
  } else g.spawnAcc = 0;

  g.waveT -= dt;
  if (g.waveT <= 0) {
    g.waveT = 28;
    // волна приходит с одной стороны — с той, где за экраном ещё есть поляна
    const n = Math.min(40, Math.round(4 + t / 7)), d = spawnDist() + 10, a = arenaSpot(g.p.x, g.p.y, Math.random() * TAU, d + 30, 40).a, T = pickType(t);
    for (let i = 0; i < n && g.enemies.length < MAXE + 60; i++) spawnEnemy(T, a + rnd(-0.45, 0.45), d + Math.random() * 60);
    toast('Волна врагов!');
  }
  g.eliteT -= dt;
  if (g.eliteT <= 0) {
    g.eliteT = 50;
    spawnEnemy(TYPES[Math.max(0, g.unlocked - 1 - Math.floor(Math.random() * Math.min(2, g.unlocked)))], undefined, undefined, true);
    const M = makeMiniboss(g.enemies[g.enemies.length - 1]);
    toast('Минибосс: ' + M.name + '! Победи его и получи сундук');
  }
  g.bossT -= dt;
  if (g.bossT <= 0) { g.bossT = 150; const Bs = BOSSES[g.bossN % BOSSES.length]; g.bossN++; spawnEnemy(Bs); g.shake = 0.3; toast('Появился босс: ' + Bs.name); }
}

// Враги: движение, поведение, урон герою при касании
function moveEnemies(dt, g, p) {
  const far = spawnDist() + 480;
  for (let i = 0; i < g.enemies.length; i++) {
    const e = g.enemies[i];
    const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
    let sp = e.spd * (e.frozen > 0 ? 0 : e.slow > 0 ? 0.5 : 1), mx = dx / d, my = dy / d;
    // замороженный враг не двигается, не колдует и не стреляет
    if ((e.T.ai || e.T.ab || e.mod) && !(e.frozen > 0)) {
      sp *= enemyAI(e, d, mx, my, dt);
      if (e.mvx !== undefined) { mx = e.mvx; my = e.mvy; e.mvx = undefined; }
    }
    e.x += (mx * sp + e.kx) * dt; e.y += (my * sp + e.ky) * dt;
    clampToArena(e, e.r);
    const decay = Math.max(0, 1 - 8 * dt); e.kx *= decay; e.ky *= decay;
    if (e.flash > 0) e.flash -= dt;
    if (e.born < 1) e.born = Math.min(1, e.born + dt / 0.35);
    if (e.sq > 0) e.sq = Math.max(0, e.sq - dt * 6);
    if (e.hitCd > 0) e.hitCd -= dt;
    if (e.bladeCd > 0) e.bladeCd -= dt;
    if (e.slow > 0) e.slow -= dt;
    if (e.frozen > 0) e.frozen -= dt;
    if (d > far && !e.T.boss && !e.elite) { const s = arenaSpot(p.x, p.y, Math.random() * TAU, spawnDist(), e.r); e.x = s.x; e.y = s.y; }
    if (d < e.r + p.r && e.hitCd <= 0 && !(e.frozen > 0) && p.inv <= 0 && state === 'play') {
      e.hitCd = 0.6;
      if (Math.random() < Math.min(0.4, p.dodge)) { pop(p.x, p.y - 30, 'Уклон', '#9fe8ff', false); p.inv = 0.15; }
      else hurtPlayer(e.dmg, e);
    }
  }
}

// Снаряды героя: движение и попадания
function moveShots(dt, g, p) {
  for (let i = 0; i < g.shots.length; i++) {
    const s = g.shots[i];
    if (s.kind === 'axe') { s.vy += s.grav * dt; s.rot += s.spin * dt; }
    else if (s.kind === 'boom') {
      s.rot += 18 * dt;
      if (!s.back) {
        s.v -= 900 * dt;
        if (s.v <= 0) { s.back = true; s.hit = []; s.v = 0; }
        s.vx = s.dx * s.v; s.vy = s.dy * s.v;
      } else {
        s.v = Math.min(900, s.v + 1100 * dt);
        const ddx = p.x - s.x, ddy = p.y - 6 - s.y, dl = Math.hypot(ddx, ddy) || 1;
        s.vx = ddx / dl * s.v; s.vy = ddy / dl * s.v;
        if (dl < 20) s.life = 0;
      }
    }
    else if (s.kind === 'wisp') {
      if (!s.tgt || s.tgt.dead || s.hit.indexOf(s.tgt.id) >= 0) {
        // новая цель — ближайший враг, которого этот огонёк ещё не задел
        let best = null, bd = 520 * 520;
        for (let j = 0; j < g.enemies.length; j++) {
          const e = g.enemies[j]; if (e.dead || s.hit.indexOf(e.id) >= 0) continue;
          const d2 = (e.x - s.x) ** 2 + (e.y - s.y) ** 2; if (d2 < bd) { bd = d2; best = e; }
        }
        s.tgt = best;
      }
      if (s.tgt) {
        const want = Math.atan2(s.tgt.y - s.y, s.tgt.x - s.x), cur = Math.atan2(s.vy, s.vx);
        let da = want - cur; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU;
        const na = cur + Math.max(-7 * dt, Math.min(7 * dt, da));
        s.vx = Math.cos(na) * s.spd; s.vy = Math.sin(na) * s.spd;
      }
    }
    s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
    if (s.life <= 0) continue;
    if (g.parts.length < 220 && Math.random() < TRAIL[s.kind]) g.parts.push({ x: s.x, y: s.y, vx: rnd(-20, 20), vy: rnd(-20, 20), life: 0.22, col: TRAILC[s.kind], s: s.kind === 'fire' ? 3.5 : 2.2 });
    for (let j = 0; j < g.enemies.length; j++) {
      const e = g.enemies[j]; if (e.dead) continue;
      const dx = e.x - s.x, dy = e.y - s.y, rr = e.r + s.r;
      if (dx * dx + dy * dy < rr * rr && s.hit.indexOf(e.id) < 0) {
        s.hit.push(e.id);
        if (s.kind === 'fire') { explode(s.x, s.y, s.boom, s.dmg); s.life = 0; break; }
        addFx({ type: 'hit', x: s.x, y: s.y, life: 0.16, T: 0.16, col: s.kind === 'frost' ? '#d8f6ff' : s.kind === 'wisp' ? '#e2c9ff' : '#ffe2a0' });
        const k = 90 / (1 + e.r / 14), l = Math.hypot(s.vx, s.vy) || 1;
        if (s.kind === 'frost') { e.slow = 1.6; burst(s.x, s.y, '#d8f6ff', 3, 90); }
        hitEnemy(e, s.dmg, s.vx / l * k, s.vy / l * k);
        if (s.pierce-- <= 0) { s.life = 0; break; }
      }
    }
  }
}

// Снаряды врагов
function moveEnemyShots(dt, g, p) {
  // попадание засчитываем ближе к центру героя, а не по краю: так от снаряда
  // можно увернуться в последний момент, и это видно глазами
  for (let i = 0; i < g.eshots.length; i++) {
    const s = g.eshots[i]; s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
    if (s.life > 0 && p.inv <= 0 && state === 'play' && Math.hypot(s.x - p.x, s.y - p.y) < s.r + p.r * 0.6) {
      s.life = 0;
      if (Math.random() < Math.min(0.4, p.dodge)) pop(p.x, p.y - 30, 'Уклон', '#9fe8ff', false);
      else { hurtPlayer(s.dmg, null, 'shot-' + s.kind); if (s.kind === 'web') { p.webT = 1.6; pop(p.x, p.y - 30, 'Паутина', '#e2c9ff', false); } }
    }
  }
  compact(g.eshots, alive);
}

// Кристаллы опыта, сердечки и временные бонусы
function collectLoot(dt, g, p) {
  for (let i = 0; i < g.gems.length; i++) {
    const gm = g.gems[i];
    const dx = p.x - gm.x, dy = p.y - gm.y, d = Math.hypot(dx, dy) || 1;
    if (!gm.mag && d < p.magnet) gm.mag = true;
    if (gm.mag) { gm.sp = Math.min(700, gm.sp + 1400 * dt); gm.x += dx / d * (240 + gm.sp) * dt; gm.y += dy / d * (240 + gm.sp) * dt; }
    if (d < p.r + 9) {
      gm.take = true;
      if (gm.type === 'heart') { p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.2); pop(p.x, p.y - 26, '+HP', '#ff8d8d', false); }
      else {
        addXp(gm.v);
        if (g.fx.length < 120) addFx({ type: 'hit', x: gm.x, y: gm.y, life: 0.14, T: 0.14, small: true, col: gm.tier === 0 ? '#9fd6ff' : gm.tier === 1 ? '#9fffc0' : '#ffaabb' });
      }
    }
  }
  for (let i = 0; i < g.pickups.length; i++) {
    const q = g.pickups[i]; q.life -= dt;
    if (q.life <= 0) { q.take = true; continue; }
    if (!q.take && Math.hypot(p.x - q.x, p.y - q.y) < p.r + 16) { q.take = true; usePickup(q); }
  }
  compact(g.pickups, notTaken);
}

// Время бонусов, вспышки и тряска экрана, искры от ускорения и ярости
function tickBuffs(dt, g, p) {
  const ix = moveDir.ix, iy = moveDir.iy;
  for (const k in g.buffs) if (g.buffs[k] > 0) g.buffs[k] = Math.max(0, g.buffs[k] - dt);
  if (g.flash > 0) g.flash -= dt;
  if (g.shake > 0) g.shake -= dt;
  if (g.buffs.haste > 0 && p.moving && g.parts.length < 260) g.parts.push({ x: p.x + rnd(-6, 6), y: p.y + rnd(-4, 14), vx: -ix * 60, vy: -iy * 60, life: 0.3, col: '#7af0c0', s: 3 });
  if (g.buffs.rage > 0 && g.parts.length < 260 && Math.random() < 0.4) g.parts.push({ x: p.x + rnd(-12, 12), y: p.y + rnd(-10, 14), vx: rnd(-10, 10), vy: rnd(-80, -40), life: 0.4, col: '#ff7a4a', s: 2.5 });
}

// Сундук, которого коснулся герой (не больше одного за кадр)
function touchChests(dt, g, p) {
  let chestHit = null;
  for (let i = 0; i < g.chests.length; i++) {
    const c = g.chests[i]; c.t += dt;
    if (!chestHit && Math.hypot(p.x - c.x, p.y - c.y) < p.r + 18) { chestHit = c; c.take = true; }
  }
  return chestHit;
}

// Убираем отработавшее: мёртвых врагов, погасшие снаряды, частицы, тексты
function cleanupWorld(dt, g) {
  compact(g.enemies, notDead);
  compact(g.shots, alive);
  compact(g.gems, notTaken);
  compact(g.chests, notTaken);
  for (let i = 0; i < g.parts.length; i++) { const q = g.parts[i]; q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.9; q.vy *= 0.9; q.life -= dt; }
  compact(g.parts, alive);
  for (let i = 0; i < g.corpses.length; i++) g.corpses[i].t += dt;
  compact(g.corpses, corpseVisible);
  for (let i = 0; i < g.fx.length; i++) { const q = g.fx[i]; q.life -= dt; if (q.vx !== undefined) { q.x += q.vx * dt; q.y += q.vy * dt; } }
  compact(g.fx, alive);
  if (g.lvlFx > 0) g.lvlFx -= dt;
  if (g.hurtFx > 0) g.hurtFx -= dt;
  for (let i = 0; i < g.texts.length; i++) { const q = g.texts[i]; q.y -= 42 * dt; q.life -= dt; }
  compact(g.texts, alive);
  for (let i = 0; i < g.rings.length; i++) g.rings[i].age += dt;
  compact(g.rings, ringVisible);
  for (let i = 0; i < g.bolts.length; i++) g.bolts[i].life -= dt;
  compact(g.bolts, alive);
}

// Открыть сундук или, если набран уровень, — столб света и экран нового уровня
function levelUpOrChest(g, p, chestHit) {
  if (state === 'play' && chestHit) openChest(chestHit.kind);
  else if (state === 'play' && g.pending > 0) {
    if (!g.lvlArm) {
      g.lvlArm = true; g.lvlFx = 0.6;
      g.rings.push({ x: p.x, y: p.y, max: 160, age: 0, life: 0.55, col: '255,214,110' });
      burst(p.x, p.y, '#ffe08a', 28, 260);
    } else if (g.lvlFx <= 0) openLevelUp();
  }
}
