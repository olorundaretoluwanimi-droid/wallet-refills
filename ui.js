// 2D overlay: chapter cards, title, the day counter, the teller's serial tally, dialogue boxes, narration subtitles, fades.
// Also reports on-screen text for readcheck (window.TEXTS). One metal: gold, plus paper white, over dark plates.
import { VO, CHAPTERS, T, DUR, CHIPS, chipState } from './story.js';

const cv = document.getElementById('ov'), g = cv.getContext('2d');
const W = 1920, H = 1080;
let DURS = {};
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ss = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const GOLD = '#e2c989', GOLD_D = 'rgba(216,190,128,', PAPER = '#f6f0e2', INK = 'rgba(14,10,6,';

export async function overlayReady() {
  await Promise.all(['500 40px Cinzel', '700 40px Cinzel', 'italic 500 40px "Cormorant Garamond"', '600 40px "Cormorant Garamond"', '500 40px "Cormorant Garamond"'].map(f => document.fonts.load(f)));
  DURS = await (await fetch('voices/dur.json')).json();
}
const dur = v => DURS[v.id] || 3;

function ornament(cx, y, w, a, col = GOLD) {
  g.save(); g.globalAlpha = a; g.fillStyle = col; g.lineWidth = 1.5;
  for (const s of [-1, 1]) {
    const gr = g.createLinearGradient(cx, 0, cx + s * w, 0); gr.addColorStop(0, GOLD_D + '1)'); gr.addColorStop(1, GOLD_D + '0)');
    g.strokeStyle = gr; g.beginPath(); g.moveTo(cx + s * 16, y); g.lineTo(cx + s * w, y); g.stroke();
    g.beginPath(); g.arc(cx + s * 26, y, 2.5, 0, 7); g.fill();
  }
  // a coin in the middle
  g.strokeStyle = col; g.beginPath(); g.arc(cx, y, 8, 0, 7); g.stroke(); g.beginPath(); g.arc(cx, y, 3.5, 0, 7); g.fill();
  g.restore();
}
function spaced(text, x, y, sp) {
  const ws = [...text].map(c => g.measureText(c).width), tot = ws.reduce((a, b) => a + b, 0) + sp * (ws.length - 1);
  let cx = x - tot / 2; [...text].forEach((c, i) => { g.fillText(c, cx + ws[i] / 2, y); cx += ws[i] + sp; });
  return tot;
}
function spacedLeft(text, x, y, sp) { const ws = [...text].map(c => g.measureText(c).width); let cx = x; [...text].forEach((c, i) => { g.fillText(c, cx, y); cx += ws[i] + sp; }); return cx - x; }
function glowText(fn, col, blur) { g.save(); g.shadowColor = col; g.shadowBlur = blur; fn(); g.restore(); fn(); }
function corners(x, y, w, h, col) { for (const [cx, cy] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) { g.fillStyle = col; g.beginPath(); g.moveTo(cx, cy - 7); g.lineTo(cx + 7, cy); g.lineTo(cx, cy + 7); g.lineTo(cx - 7, cy); g.fill(); } }
function plate(x, y, w, h, a = .88) {
  const bgr = g.createLinearGradient(0, y, 0, y + h); bgr.addColorStop(0, INK + a + ')'); bgr.addColorStop(1, INK + (a + .04) + ')');
  g.fillStyle = bgr; g.fillRect(x, y, w, h);
  g.strokeStyle = GOLD_D + '.9)'; g.lineWidth = 2; g.strokeRect(x + .5, y + .5, w - 1, h - 1);
  g.strokeStyle = GOLD_D + '.3)'; g.lineWidth = 1; g.strokeRect(x + 7.5, y + 7.5, w - 15, h - 15);
  corners(x, y, w, h, '#ecd8a0');
}

// —— Chapter card ——
const CH_LEN = 5.0;
function chapter(t, c) {
  if (t < c.t || t > c.t + CH_LEN) return null;
  const a0 = ss(seg(t, c.t, c.t + .6)), a1 = ss(seg(t, c.t + .35, c.t + 1.0)), out = 1 - ss(seg(t, c.t + CH_LEN - .6, c.t + CH_LEN));
  g.save();
  const band = g.createLinearGradient(0, 120, 0, 380); band.addColorStop(0, 'rgba(10,6,2,0)'); band.addColorStop(.5, `rgba(10,6,2,${.55 * a0 * out})`); band.addColorStop(1, 'rgba(10,6,2,0)');
  g.fillStyle = band; g.fillRect(0, 120, W, 260);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.globalAlpha = a0 * out; g.fillStyle = '#ecd9a6'; g.font = '500 32px Cinzel'; spaced('CHAPTER  ' + c.n, W / 2, 196, 10);
  ornament(W / 2, 236, 220 * (.4 + .6 * a0), a0 * out);
  g.globalAlpha = a1 * out; g.fillStyle = PAPER; g.font = 'italic 500 70px "Cormorant Garamond"';
  glowText(() => g.fillText(c.name, W / 2, 300 - (1 - a1) * 10), 'rgba(255,200,110,.35)', 22);
  g.restore();
  return { id: 'ch' + c.n, text: 'CHAPTER ' + c.n + ' ' + c.name, x0: 560, y0: 170, x1: 1360, y1: 340 };
}

// —— Title card (two lines) and end title ——
function titleCard(t, a, b, lines, sub, size) {
  if (t < a || t > b) return null;
  const ain = ss(seg(t, a, a + 1.1)), out = 1 - ss(seg(t, b - .7, b));
  g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
  g.globalAlpha = ain * out * .45; g.fillStyle = '#0a0602'; g.fillRect(0, 0, W, H);
  g.globalAlpha = ain * out; g.font = `700 ${size}px Cinzel`;
  const y0 = 470 - (lines.length - 1) * size * .62;
  lines.forEach((L, i) => { const y = y0 + i * size * 1.24, gr = g.createLinearGradient(0, y - size / 2, 0, y + size / 2); gr.addColorStop(0, '#fff6dc'); gr.addColorStop(.55, '#ecd08c'); gr.addColorStop(1, '#b08a44'); g.fillStyle = gr; glowText(() => spaced(L, W / 2, y, size * .1), 'rgba(255,196,96,.5)', 36); });
  const oy = y0 + (lines.length - 1) * size * 1.24 + size * .85;
  ornament(W / 2, oy, 330 * (.3 + .7 * ain), ain * out);
  const bA = ss(seg(t, a + .6, a + 1.4));
  if (sub) { g.globalAlpha = bA * out; g.font = 'italic 500 50px "Cormorant Garamond"'; g.fillStyle = PAPER; g.fillText(sub, W / 2, oy + 68); }
  g.restore();
  return [{ id: 'title' + a, text: lines.join(' ') + ' ' + (sub || ''), x0: 260, y0: y0 - size, x1: 1660, y1: oy + 100 }];
}

// —— Day counter chip (top right): DAY n · $total; ticks with a gold flash ——
const money = s => '$' + s.toLocaleString('en-US');
function chip(t, c) {
  const al = ss(seg(t, c.a, c.a + .3)) * (1 - ss(seg(t, c.b - .3, c.b)));
  if (al <= 0) return null;
  const { d, s } = chipState(c, t), who = c.who ? c.who + ' · ' : '';
  const ticks = [c.at, ...(c.steps || []).map(x => x[0])].filter(a => a != null && t >= a && t - a < .6), fl = ticks.length ? 1 - (t - ticks[ticks.length - 1]) / .6 : 0;
  g.save(); g.font = '700 30px Cinzel'; const dayTxt = who + 'DAY ' + d.toLocaleString('en-US'); const dw = g.measureText(dayTxt).width + 6 * dayTxt.length;
  g.font = '600 34px "Cormorant Garamond"'; const mw = g.measureText(money(s)).width;
  const bw = Math.max(330, dw + mw + 110), bh = 64, x = W - bw - 64, y = 60;
  g.globalAlpha = al; plate(x, y, bw, bh);
  if (fl > 0) { g.globalAlpha = al * fl * .5; g.fillStyle = '#ffd36a'; g.fillRect(x + 2, y + 2, bw - 4, bh - 4); g.globalAlpha = al; }
  g.font = '700 30px Cinzel'; g.fillStyle = '#f0e2bc'; g.textAlign = 'left'; g.textBaseline = 'middle'; spacedLeft(dayTxt, x + 26, y + bh / 2 + 1, 2);
  g.fillStyle = GOLD; g.beginPath(); g.arc(x + bw - mw - 46, y + bh / 2, 9, 0, 7); g.fill(); g.fillStyle = '#8a6a2a'; g.beginPath(); g.arc(x + bw - mw - 46, y + bh / 2, 4, 0, 7); g.fill();
  g.font = '600 34px "Cormorant Garamond"'; g.fillStyle = PAPER; g.textAlign = 'right'; g.fillText(money(s), x + bw - 24, y + bh / 2 + 1);
  g.restore();
  const spinning = c.run && t >= c.run[0] && t < c.run[1];   // an odometer while it runs: one moving counter, not a string to read
  return { id: 'chip' + c.a + (spinning ? 'run' : ''), text: spinning ? who + 'DAY counter running' : dayTxt + ' ' + money(s), x0: x, y0: y, x1: x + bw, y1: y + bh };
}

// —— The teller's tally: the five serial numbers, each counted up to ×46 ——
const SER = ['LB 04620718 A', 'LB 11893204 C', 'LB 52071946 D', 'LB 38265117 F', 'LB 90413382 E'];
const TALLY = { a: 316.2, b: 329.6, count: [317.2, 324.6] };
function tally(t) {
  const P = TALLY, al = ss(seg(t, P.a, P.a + .35)) * (1 - ss(seg(t, P.b - .35, P.b)));
  if (al <= 0) return null;
  const bw = 760, bh = 104 + SER.length * 54, x = (W - bw) / 2, y = 40 + (1 - al) * 16;
  g.save(); g.globalAlpha = al; plate(x, y, bw, bh, .9);
  g.textBaseline = 'middle'; g.textAlign = 'left'; g.font = '600 28px Cinzel'; g.fillStyle = '#ecd9a6'; spacedLeft('SERIAL  NUMBERS', x + 40, y + 48, 4);
  g.font = '600 26px Cinzel'; g.fillStyle = '#c8b484'; g.textAlign = 'right'; g.fillText('COUNT', x + bw - 40, y + 48);
  g.strokeStyle = GOLD_D + '.35)'; g.beginPath(); g.moveTo(x + 32, y + 82); g.lineTo(x + bw - 32, y + 82); g.stroke();
  const n = Math.round(1 + 45 * ss(seg(t, P.count[0], P.count[1])));
  SER.forEach((s, i) => {
    const iy = y + 118 + i * 54; g.textAlign = 'left'; g.font = '600 32px Cinzel'; g.fillStyle = PAPER; spacedLeft(s, x + 50, iy, 2);
    g.textAlign = 'right'; g.font = '700 40px "Cormorant Garamond"'; g.fillStyle = n >= 46 ? '#ff9a6a' : GOLD; g.fillText('× ' + n, x + bw - 44, iy + 2);
  });
  g.restore();
  return [{ id: 'tally', text: 'SERIAL NUMBERS COUNT ' + SER.join(' ') + ' × 46', x0: x, y0: y, x1: x + bw, y1: y + bh }];
}

// —— Dialogue box ——
function wrap(text, maxW) { const words = text.split(' '), lines = []; let cur = ''; for (const w of words) { const n = cur ? cur + ' ' + w : w; if (g.measureText(n).width > maxW && cur) { lines.push(cur); cur = w; } else cur = n; } if (cur) lines.push(cur); return lines; }
const dlgSpan = v => [v.t - .45, Math.max(v.t + dur(v) + 1.6, v.t + (v.who.length + 1 + v.sub.length) / 15 + 1.6)];
const DLG = VO.filter(v => v.dlg).sort((a, b) => a.t - b.t);
function dialog(t, v) {
  let [a, b] = dlgSpan(v); const nx = DLG[DLG.indexOf(v) + 1]; if (nx) b = Math.min(b, nx.t - .45);
  const al = ss(seg(t, a, a + .35)) * (1 - ss(seg(t, b - .35, b)));
  if (al <= 0) return null;
  const bw = 1180, bh = 210, x = (W - bw) / 2, y = H - bh - 58 + (1 - al) * 14;
  g.save(); g.globalAlpha = al; plate(x, y, bw, bh, .84);
  g.font = '600 34px "Cormorant Garamond"'; const nw = g.measureText(v.who).width + 56;
  g.fillStyle = 'rgba(16,11,6,.96)'; g.fillRect(x + 36, y - 26, nw, 50); g.strokeStyle = GOLD_D + '.9)'; g.lineWidth = 1.5; g.strokeRect(x + 36.5, y - 25.5, nw - 1, 49);
  g.fillStyle = v.who === 'You' ? '#c8f070' : v.who === 'Agent Pike' ? '#c8d0e0' : '#f0e2bc'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(v.who, x + 64, y - 1);
  g.font = '500 46px "Cormorant Garamond"'; g.fillStyle = PAPER;
  const n = v.sub.length, shown = Math.floor(n * clamp((t - v.t + .05) / (dur(v) * .9)));
  const lines = wrap(v.sub, bw - 150); let k = shown;
  lines.forEach((L, i) => { const s = L.slice(0, Math.max(0, k)); k -= L.length + 1; g.fillText(s, x + 72, y + 80 + i * 60); });
  if (shown >= n && Math.floor(t * 2.5) % 2 === 0) { g.fillStyle = '#ecd8a0'; const tx = x + bw - 56, ty = y + bh - 38; g.beginPath(); g.moveTo(tx - 9, ty - 5); g.lineTo(tx + 9, ty - 5); g.lineTo(tx, ty + 6); g.fill(); }
  g.restore();
  return { id: v.id, text: v.who + ' ' + v.sub, x0: x, y0: y - 26, x1: x + bw, y1: y + bh };
}

// —— Narration subtitle (two lines for long clips) ——
export const subSpan = v => { const nx = VO.filter(w => w.t > v.t).sort((a, b) => a.t - b.t)[0]; return [v.t - .35, Math.min(v.t + dur(v) + .7, nx ? nx.t - .4 : 1e9)]; };
function subtitle(t, v) {
  const [a, b] = subSpan(v), al = ss(seg(t, a, a + .3)) * (1 - ss(seg(t, b - .35, b)));
  if (al <= 0) return null;
  g.save(); g.globalAlpha = al; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.font = 'italic 500 50px "Cormorant Garamond"';
  const lines = g.measureText(v.sub).width > 1500 ? wrap(v.sub, 1300) : [v.sub];
  const y1 = H - 84, y0 = y1 - (lines.length - 1) * 58, tw = Math.max(...lines.map(L => g.measureText(L).width));
  const sh = g.createLinearGradient(0, y0 - 70, 0, y1 + 40); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(.5, 'rgba(0,0,0,.42)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = sh; g.fillRect(W / 2 - tw / 2 - 160, y0 - 70, tw + 320, y1 - y0 + 110);
  g.shadowColor = 'rgba(0,0,0,.9)'; g.shadowBlur = 10; g.shadowOffsetY = 2; g.fillStyle = PAPER;
  lines.forEach((L, i) => g.fillText(L, W / 2, y0 + i * 58));
  g.restore();
  return { id: v.id, text: v.sub, x0: W / 2 - tw / 2, y0: y0 - 50, x1: W / 2 + tw / 2, y1: y1 + 14 };
}

// —— Fades: dips to black at chapter breaks and into / out of the dream; the end ——
const FADES = [[27.5, .45, .5], [35, .4, .5], [146, .45, .5], [246, .45, .5], [352, .45, .5], [379, .5, .7], [424, .5, .6], [466, .45, .5], [490, .45, .5]];
function blackout(t) {
  let a = 1 - ss(seg(t, 0, .8));
  for (const [c, o, i] of FADES) { if (t < c && t > c - o) a = Math.max(a, ss((t - (c - o)) / o)); if (t >= c && t < c + i) a = Math.max(a, 1 - ss((t - c) / i)); }
  a = Math.max(a, ss(seg(t, DUR - 1.2, DUR - .05)));
  if (a > 0) { g.fillStyle = `rgba(0,0,0,${a})`; g.fillRect(0, 0, W, H); }
}

export function drawOverlay(t) {
  g.clearRect(0, 0, W, H);
  const texts = [];
  for (const c of CHAPTERS) { const r = chapter(t, c); if (r) texts.push(r); }
  const tc = titleCard(t, T.titleIn, T.titleOut, ['WHAT IF YOUR WALLET', 'REFILLED EVERY MORNING?'], null, 92); if (tc) texts.push(...tc);
  const te = titleCard(t, T.endTitle, DUR - .3, ['WHAT IF YOUR WALLET', 'REFILLED EVERY MORNING?'], 'Money is worth something because it runs out.', 84); if (te) texts.push(...te);
  for (const c of CHIPS) { const r = chip(t, c); if (r) texts.push(r); }
  const tl = tally(t); if (tl) texts.push(...tl);
  for (const v of VO) { if (v.dlg) { const r = dialog(t, v); if (r) texts.push(r); } else subtitle(t, v); }
  blackout(t);
  return texts;
}
