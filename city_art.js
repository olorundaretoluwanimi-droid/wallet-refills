// Northgate: modern city pieces drawn per pixel (asphalt, paving, concrete, brick, stone, roof gravel, painted steel),
// instanced window panes (lamp / phone light), a 3×5 pixel font for clocks and screens, and builders
// (buildings, shop fronts, tram, cars, lamp posts, barrier, kiosk, the Old River Bridge, the rooftop room).
import * as THREE from 'three';
import { PX, ramp, hex, h2, fbm, texOf, glow } from './px.js';
import { mat, mesh, box } from './kit.js';

// —— Textures ——
const T = (w, h, f) => { const P = new PX(w, h); P.fill(f); return P.done(); };
export const tex = {
  asphalt: (o = {}) => { const R = ramp(o.cols ?? ['#121316', '#1b1c20', '#25262b', '#303137'], .45), s = o.seed ?? 3; return T(96, 96, (x, y) => { let v = .45 + (fbm(x * .12, y * .12, s) - .5) * .5; if (h2(x, y, s) > .93) v += .3; if (h2(x, y, s + 1) > .97) v -= .35; const cr = Math.abs(fbm(x * .03, y * .03, s + 5) - .5); if (cr < .012) v = .05; return R(v, x, y); }); },
  paving: (o = {}) => { const R = ramp(o.cols ?? ['#3a3a3e', '#4c4c50', '#5e5e62', '#727276'], .45), s = o.seed ?? 5, q = o.q ?? 24; return T(96, 96, (x, y) => { const xx = x % q, yy = y % q; if (xx === 0 || yy === 0) return R(.08, x, y); let v = .5 + (h2(Math.floor(x / q), Math.floor(y / q), s) - .5) * .3 + (fbm(x * .2, y * .2, s) - .5) * .25; if (xx === 1 || yy === 1) v += .15; return R(v, x, y); }); },
  concrete: (o = {}) => { const R = ramp(o.cols ?? ['#3c3e44', '#52555c', '#6a6d74', '#82858c'], .45), s = o.seed ?? 7; return T(96, 96, (x, y) => { if (x % 48 === 0 || y % 72 === 0) return R(.12, x, y); let v = .55 + (fbm(x * .08, y * .05, s) - .5) * .4; const st = fbm(x * .04, y * .01, s + 3); if (y % 72 > 40) v -= (y % 72 - 40) / 72 * st * .6; if (h2(x, y, s) > .97) v -= .2; return R(v, x, y); }); },
  brick: (o = {}) => { const B = ramp(o.cols ?? ['#3a1a14', '#55261c', '#703424', '#8a4630'], .45), M = ramp(o.mortar ?? ['#3a3834', '#55524c'], .45), s = o.seed ?? 4; return T(96, 96, (x, y) => { const row = Math.floor(y / 4), off = (row % 2) * 4, xx = (x + off) % 8; if (y % 4 === 3 || xx === 0) return M(.5, x, y); const v = .35 + h2(Math.floor((x + off) / 8), row, s) * .45 + (fbm(x * .1, y * .1, s) - .5) * .3; return B(v, x, y); }); },
  stone: (o = {}) => { const R = ramp(o.cols ?? ['#6a6458', '#8a8372', '#a8a08c', '#c4bca6'], .45), s = o.seed ?? 9; return T(96, 96, (x, y) => { const row = Math.floor(y / 16), off = (row % 2) * 16, xx = (x + off) % 32, yy = y % 16; if (yy === 0 || xx === 0) return R(.1, x, y); let v = .55 + (h2(Math.floor((x + off) / 32), row, s) - .5) * .2 + (fbm(x * .2, y * .3, s) - .5) * .25; if (yy === 1) v += .15; return R(v, x, y); }); },
  gravel: (o = {}) => { const R = ramp(o.cols ?? ['#1c1d20', '#2a2b2f', '#393a3f', '#4a4b50'], .45), s = o.seed ?? 11; return T(96, 96, (x, y) => { let v = .4 + (h2(x, y, s) - .5) * .5 + (fbm(x * .1, y * .1, s) - .5) * .3; if (x % 48 === 0 || y % 48 === 0) v = .7; return R(v, x, y); }); },
  steel: (o = {}) => { const R = ramp(o.cols ?? ['#14201e', '#1f312d', '#2c443e', '#3c5a52', '#507268'], .45), s = o.seed ?? 13; return T(48, 48, (x, y) => { let v = .5 + (fbm(x * .3, y * .1, s) - .5) * .4; if (fbm(x * .15, y * .15, s + 4) > .66) v -= .25; if (y % 12 === 2 && x % 6 === 3) v = .95; if (y % 12 === 3 && x % 6 === 3) v = .1; return R(v, x, y); }); },
  plain: (cols, seed = 1) => { const R = ramp(cols, .45); return T(48, 48, (x, y) => R(.5 + (fbm(x * .15, y * .15, seed) - .5) * .5 + (h2(x, y, seed) > .95 ? .2 : 0), x, y)); },
  wood: (o = {}) => { const R = ramp(o.cols ?? ['#2a1a10', '#40281a', '#5a3a24', '#74502f'], .45), s = o.seed ?? 2; return T(96, 96, (x, y) => { if (y % 12 === 0) return R(.05, x, y); return R(.45 + (fbm(x * .04, y * .6, s) - .5) * .6, x, y); }); },
  rug: () => { const R = ramp(['#2a1418', '#4a2028', '#6c3036', '#8c4a40'], .45); return T(48, 48, (x, y) => { const b = Math.min(x, y, 47 - x, 47 - y); let v = b < 3 ? .8 : b < 5 ? .25 : .45 + ((x + y) % 8 < 2 ? .2 : 0); return R(v, x, y); }); },
};

// —— Cached materials ——
const MM = {};
export function cmats() {
  if (MM.ok) return MM;
  MM.asphalt = mat(tex.asphalt()); MM.asphaltWet = mat(tex.asphalt({ seed: 4 }), { rough: .35 });
  MM.paving = mat(tex.paving()); MM.kerb = mat(tex.paving({ q: 96, cols: ['#55555a', '#6a6a6e', '#808084'] }));
  MM.concrete = mat(tex.concrete()); MM.concreteW = mat(tex.concrete({ seed: 2, cols: ['#4a4842', '#625f58', '#7c786f', '#958f84'] }));
  MM.concreteB = mat(tex.concrete({ seed: 5, cols: ['#2e3440', '#3e4654', '#505a6a', '#64708a'] }));
  MM.brick = mat(tex.brick()); MM.brickD = mat(tex.brick({ seed: 8, cols: ['#2a1e1c', '#3c2a26', '#523a32', '#684a3e'] }));
  MM.brickY = mat(tex.brick({ seed: 6, cols: ['#4a3a24', '#665030', '#82683e', '#9c824e'] }));
  MM.stone = mat(tex.stone()); MM.gravel = mat(tex.gravel());
  MM.steel = mat(tex.steel()); MM.wood = mat(tex.wood()); MM.rug = mat(tex.rug());
  MM.plaster = mat(tex.plain(['#4e4a52', '#625e66', '#77737b', '#8c8890'], 3));
  MM.dark = new THREE.MeshStandardMaterial({ color: '#0d0e12', roughness: 1 });
  MM.paint = new THREE.MeshStandardMaterial({ color: '#c8c4b4', roughness: .9 });
  MM.yellow = new THREE.MeshStandardMaterial({ color: '#c09a2a', roughness: .9 });
  MM.rail = new THREE.MeshStandardMaterial({ color: '#8a8c92', roughness: .4, metalness: .6 });
  MM.metal = new THREE.MeshStandardMaterial({ color: '#2a2e34', roughness: .6, metalness: .3 });
  MM.ok = true; return MM;
}
export const solid = (cols, seed) => mat(tex.plain(cols, seed));

// —— 3×5 pixel font for clocks, phone, battery ——
const GL = { 0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111', 4: '101101111001001', 5: '111100111001111', 6: '111100111101111', 7: '111001001001001', 8: '111101111101111', 9: '111101111001111', ':': '01010', '%': '101001010100101', ' ': '000000000000000', ',': '00011', '$': '011110010011110', '.': '00001', '#': '101111101111101', 'x': '000101010101000', A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100', K: '101101110101101', L: '100100100100111', M: '101111111101101', O: '111101101101111', R: '110101110101101', S: '011100010001110', T: '111010010010010', Y: '101101010010010', W: '101101111111101', N: '111101101101101', G: '011100101101011', I: '111010010010111', P: '110101110100100', H: '101101111101101', U: '101101101101111', V: '101101101101010' };
export function pixText(P, s, x, y, col, sc = 1) {
  let cx = x;
  for (const ch of String(s)) { const g = GL[ch] ?? GL[' ']; const w = ch === ':' || ch === ',' || ch === '.' ? 1 : 3;
    for (let j = 0; j < 5; j++) for (let i = 0; i < w; i++) if (g[j * w + i] === '1') for (let a = 0; a < sc; a++) for (let b = 0; b < sc; b++) P.set(cx + i * sc + a, y + j * sc + b, col);
    cx += (w + 1) * sc; }
  return cx - x;
}
// A small screen: canvas texture redrawn when its text changes (clock faces, displays)
export function screen(w, h, draw) {
  const P = new PX(w, h), t = texOf(P.c); let last = null;
  return { tex: t, set(key, ...a) { if (key === last) return; last = key; P.d.data.fill(0); draw(P, key, ...a); P.done(); t.needsUpdate = true; } };
}

// —— Text signs (pixel lettering from a small font size, nearest filtered) ——
export function sign(text, wM, hM, o = {}) {
  const pw = Math.round(wM * 24), ph = Math.round(hM * 24), c = document.createElement('canvas'); c.width = pw; c.height = ph;
  const g = c.getContext('2d'); g.fillStyle = o.bg ?? '#1a1c22'; g.fillRect(0, 0, pw, ph);
  g.fillStyle = o.edge ?? '#6a5a3a'; g.fillRect(0, 0, pw, 1); g.fillRect(0, ph - 1, pw, 1);
  g.font = `${o.weight ?? 700} ${Math.round(ph * (o.k ?? .62))}px ${o.font ?? 'Cinzel'}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = o.fg ?? '#e8d8a8';
  g.fillText(text, pw / 2, ph / 2 + 1);
  const d = g.getImageData(0, 0, pw, ph), fg = hex(o.fg ?? '#e8d8a8'), bg = hex(o.bg ?? '#1a1c22');
  for (let i = 0; i < d.data.length; i += 4) { const lum = Math.abs(d.data[i] - bg[0]) + Math.abs(d.data[i + 1] - bg[1]) + Math.abs(d.data[i + 2] - bg[2]), on = lum > 160; if (on) { d.data[i] = fg[0]; d.data[i + 1] = fg[1]; d.data[i + 2] = fg[2]; } else if (lum > 40 && lum <= 160) { d.data[i] = bg[0]; d.data[i + 1] = bg[1]; d.data[i + 2] = bg[2]; } }
  g.putImageData(d, 0, 0);
  const t = texOf(c);
  const m = new THREE.MeshStandardMaterial({ map: t, roughness: .8, emissiveMap: o.lit ? t : null, emissive: new THREE.Color(o.lit ? '#ffffff' : '#000000'), emissiveIntensity: o.lit ?? 0 });
  return new THREE.Mesh(new THREE.PlaneGeometry(wM, hM), m);
}

// —— Window panes: one instanced mesh; colour per window per frame ——
let _wtex = null;
function windowTex() {
  if (_wtex) return _wtex;
  const P = new PX(10, 14), F = ramp(['#26282e', '#3a3d44', '#50545c'], .3);
  P.fill((x, y) => { if (x === 0 || x === 9 || y === 0 || y === 13) return F(.6, x, y); if (y === 6) return F(.35, x, y); const v = .78 + (1 - y / 14) * .22 - h2(x, y, 3) * .12 - (x + y < 8 ? -.1 : 0); const c = Math.round(255 * Math.min(1, v)); return [c, c, c]; });
  return (_wtex = texOf(P.done()));
}
export class Windows {
  constructor(max = 4000) {
    this.list = []; this.max = max;
    this.mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: windowTex(), color: '#ffffff' }), max);
    this.mesh.count = 0; this.mesh.frustumCulled = false;
    this.c = new THREE.Color(); this.m4 = new THREE.Matrix4(); this.q = new THREE.Quaternion(); this.sc = new THREE.Vector3();
  }
  // lamp: true if this window has a warm lamp at night; ph: time its phone lights (spread); seed
  add(p, ry, w, h, lamp = false, ph = Infinity, seed = 0) {
    const i = this.list.length; if (i >= this.max) return;
    this.q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry); this.sc.set(w, h, 1);
    this.m4.compose(new THREE.Vector3(...p), this.q, this.sc); this.mesh.setMatrixAt(i, this.m4);
    this.list.push({ lamp, ph, seed, p }); this.mesh.count = this.list.length;
  }
  // o.night 0..1 (lamps), o.day sky tint for glass, o.phones: show spread state at time t, o.dark glass colour
  update(t, o = {}) {
    const night = o.night ?? 0, dk = o.dark ?? [.07, .08, .1], day = o.day ?? null, ph = o.phones ?? false, warmK = o.warm ?? 1;
    this.list.forEach((w, i) => {
      let r = dk[0], g = dk[1], b = dk[2];
      if (day) { const v = .7 + .3 * h2(i, 3, 7); r = day[0] * v; g = day[1] * v; b = day[2] * v; }
      if (w.lamp && night > 0) { const k = night * warmK * (.8 + .2 * h2(i, 5, 1)); r += 2.3 * k; g += 1.35 * k; b += .55 * k; }
      if (ph && t >= w.ph) { const a = t - w.ph, k = Math.min(1, a / .08) * (.55 + .45 * Math.exp(-a * 1.6)); r = r * (1 - k) + .9 * k; g = g * (1 - k) + 1.9 * k; b = b * (1 - k) + 2.6 * k; }
      this.c.setRGB(r, g, b); this.mesh.setColorAt(i, this.c);
    });
    this.mesh.instanceColor.needsUpdate = true;
  }
}

// —— Builders ——
// Building: storeys + window grid on the four sides + flat gravel roof with parapet and rooftop boxes
export function building(W, o) {
  const M = cmats(), g = new THREE.Group(), R = o.rnd ?? Math.random;
  const fh = o.fh ?? 3.1, gh = o.gh ?? 3.6, H = gh + fh * (o.floors - 1);
  const body = o.hollow ? box(o.w, H - gh, o.d, M[o.mat ?? 'concrete'], { cast: o.cast ?? true }) : box(o.w, H, o.d, M[o.mat ?? 'concrete'], { cast: o.cast ?? true }); if (o.hollow) body.position.y = gh; g.add(body);
  if (o.base) { const b = box(o.w + .06, gh, o.d + .06, M[o.base]); g.add(b); }
  const par = box(o.w + .2, .5, o.d + .2, M[o.parMat ?? o.mat ?? 'concrete'], { cast: false }); par.position.y = H; g.add(par);
  const rf = box(o.w - .3, .06, o.d - .3, M.gravel, { cast: false }); rf.position.y = H + .3; g.add(rf);
  const nb = o.roofBoxes ?? 2; for (let i = 0; i < nb; i++) { const bw = 1 + R() * 1.8, b = box(bw, .8 + R() * 1.4, bw * (.6 + R() * .6), M.metal); b.position.set((R() - .5) * (o.w - 3), H + .3, (R() - .5) * (o.d - 3)); g.add(b); }
  g.position.set(o.x, 0, o.z);
  // windows: front (+z) always; other sides when o.sides
  const sides = o.sides ? [0, 1, 2, 3] : [0];
  const wpm = o.wpm ?? .42;
  for (const s of sides) {
    const len = s % 2 ? o.d : o.w, n = Math.max(1, Math.round(len * wpm)), ry = [0, Math.PI / 2, Math.PI, -Math.PI / 2][s];
    for (let f = o.shop ? 1 : 0; f < o.floors; f++) for (let i = 0; i < n; i++) {
      const u = -len / 2 + (i + .5) * len / n, y = (f === 0 ? gh * .55 : gh + fh * (f - 1) + fh * .55);
      const off = (s % 2 ? o.w : o.d) / 2 + .02;
      const p = s === 0 ? [o.x + u, y, o.z + off] : s === 2 ? [o.x - u, y, o.z - off] : s === 1 ? [o.x + off, y, o.z - u] : [o.x - off, y, o.z + u];
      const lamp = R() < (o.lampP ?? .35), phT = o.phone ? o.phone(p, R) : Infinity;
      W.add(p, ry, o.ww ?? 1.0, o.wh ?? 1.35, lamp, phT, f * 31 + i + s * 7);
    }
  }
  g.userData.H = H;
  return g;
}
// Glass shop front with a lit interior colour and a sign
export function shopFront(wM, hM, o = {}) {
  const M = cmats(), g = new THREE.Group();
  const glass = new THREE.MeshStandardMaterial({ color: o.glass ?? '#0e1418', roughness: .15, metalness: .2, emissive: new THREE.Color(o.inside ?? '#ffb060'), emissiveIntensity: 0, transparent: true, opacity: o.opacity ?? .55 });
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(wM - .3, hM - .9), glass); pane.position.set(0, (hM - .9) / 2 + .35, .01); g.add(pane);
  for (const x of [-wM / 2 + .08, wM / 2 - .08, 0]) { const f = box(.14, hM - .5, .12, M.metal); f.position.set(x, 0, 0); g.add(f); }
  const top = box(wM, .16, .14, M.metal); top.position.y = hM - .7; g.add(top);
  const sill = box(wM, .35, .14, M.metal); g.add(sill);
  if (o.sign) { const s = sign(o.sign, wM * .9, .55, o.signO ?? {}); s.position.set(0, hM - .32, .1); g.add(s); g.userData.sign = s; }
  g.userData.glass = glass; return g;
}
// Lamp post: pole, arm, head; light handled by the set (few shadowed lights)
export function lampPost(h = 4.6) {
  const M = cmats(), g = new THREE.Group();
  const pole = mesh(new THREE.CylinderGeometry(.06, .08, h, 6).translate(0, h / 2, 0), M.metal); g.add(pole);
  const arm = box(.9, .08, .08, M.metal); arm.position.set(.4, h - .1, 0); g.add(arm);
  const head = box(.42, .14, .26, M.metal); head.position.set(.8, h - .22, 0); g.add(head);
  const bulb = new THREE.Mesh(new THREE.PlaneGeometry(.34, .2), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd9a0').multiplyScalar(3) })); bulb.rotation.x = Math.PI / 2; bulb.position.set(.8, h - .23, 0); g.add(bulb);
  g.userData.head = new THREE.Vector3(.8, h - .35, 0); g.userData.bulb = bulb; return g;
}
// Car: body + cabin + wheels + head/tail lights (emissive planes); front faces +x
export function car(col, o = {}) {
  const M = cmats(), g = new THREE.Group(), body = solid(col, o.seed ?? 2);
  const L = o.len ?? 4.2, Wd = 1.8;
  const b = box(L, .75, Wd, body); b.position.y = .32; g.add(b);
  const c = box(L * .52, .62, Wd - .14, body); c.position.set(-L * .06, 1.05, 0); g.add(c);
  const glassM = new THREE.MeshStandardMaterial({ color: '#0b1016', roughness: .2, metalness: .3 });
  for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(L * .48, .45), glassM); w.position.set(-L * .06, 1.08, s * (Wd / 2 - .06)); w.rotation.y = s > 0 ? 0 : Math.PI; g.add(w); }
  const ws = new THREE.Mesh(new THREE.PlaneGeometry(Wd - .2, .5), glassM); ws.position.set(L * .2 + .01, 1.08, 0); ws.rotation.y = Math.PI / 2; g.add(ws);
  for (const [x, z] of [[L * .3, Wd / 2], [-L * .3, Wd / 2], [L * .3, -Wd / 2], [-L * .3, -Wd / 2]]) { const wh = new THREE.Mesh(new THREE.CylinderGeometry(.34, .34, .24, 10).rotateX(Math.PI / 2), M.dark); wh.position.set(x, .34, z); g.add(wh); }
  const hl = new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff2d0').multiplyScalar(.4) }), tl = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff2a1a').multiplyScalar(.4) });
  for (const s of [-1, 1]) { const h = new THREE.Mesh(new THREE.PlaneGeometry(.34, .16), hl); h.position.set(L / 2 + .01, .55, s * .6); h.rotation.y = Math.PI / 2; g.add(h); const t2 = new THREE.Mesh(new THREE.PlaneGeometry(.3, .14), tl); t2.position.set(-L / 2 - .01, .58, s * .6); t2.rotation.y = -Math.PI / 2; g.add(t2); }
  g.userData = { hl, tl, L, head: new THREE.Vector3(L / 2 + .3, .6, 0) };
  return g;
}
// Tram: long two-tone body with a row of windows; front faces +x
export function tram(o = {}) {
  const M = cmats(), g = new THREE.Group(), L = o.len ?? 14;
  const lower = box(L, 1.4, 2.5, solid(['#5a1a14', '#7a261c', '#9a3424', '#b84a34'], 5)); lower.position.y = .4; g.add(lower);
  const upper = box(L, 1.5, 2.5, solid(['#8a8270', '#a8a08a', '#c4bca4', '#dcd4bc'], 6)); upper.position.y = 1.8; g.add(upper);
  const roofB = box(L - .4, .3, 2.2, M.metal); roofB.position.y = 3.3; g.add(roofB);
  const pant = box(.1, 1.2, .1, M.metal); pant.position.set(0, 3.6, 0); pant.rotation.z = .5; g.add(pant);
  const winM = new THREE.MeshStandardMaterial({ color: '#141a20', roughness: .2, emissive: new THREE.Color('#ffe0a8'), emissiveIntensity: 0 });
  for (let i = 0; i < 7; i++) for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.4, .9), winM); w.position.set(-L / 2 + 1.3 + i * (L - 2.6) / 6, 2.35, s * 1.26); w.rotation.y = s > 0 ? 0 : Math.PI; g.add(w); }
  const num = sign('9', .6, .5, { bg: '#101010', fg: '#ffcf5a', lit: 1.4 }); num.position.set(L / 2 + .01, 2.6, 0); num.rotation.y = Math.PI / 2; g.add(num);
  g.userData = { winM, L }; return g;
}
// Road barrier: striped board on two A-legs; width along x
export function barrier(w = 3) {
  const g = new THREE.Group(), c = document.createElement('canvas'); c.width = Math.round(w * 24); c.height = 8;
  const x = c.getContext('2d'); for (let i = 0; i < c.width; i += 8) { x.fillStyle = (i / 8) % 2 ? '#e8e2d4' : '#b8241a'; x.fillRect(i, 0, 8, 8); }
  const t = texOf(c), m = new THREE.MeshStandardMaterial({ map: t, roughness: .7, emissive: new THREE.Color('#ffffff'), emissiveMap: t, emissiveIntensity: 0 });
  const bd = new THREE.Mesh(new THREE.BoxGeometry(w, .32, .06), m); bd.position.y = 1.0; bd.castShadow = true; g.add(bd);
  const M = cmats();
  for (const s of [-1, 1]) for (const k of [-1, 1]) { const l = box(.06, 1.1, .06, M.metal); l.position.set(s * (w / 2 - .2), 0, k * .22); l.rotation.x = k * .2; g.add(l); }
  g.userData.mat = m; return g;
}
// Newspaper kiosk
export function kiosk() {
  const M = cmats(), g = new THREE.Group();
  const b = box(2.2, 2.3, 1.6, solid(['#1a3024', '#24443a', '#30584a', '#3e6e5c'], 7)); g.add(b);
  const r = box(2.6, .14, 2.0, M.metal); r.position.y = 2.3; g.add(r);
  const s = sign('NEWS', 1.8, .4, { bg: '#0c1410', fg: '#e8d8a8' }); s.position.set(0, 2.05, .81); g.add(s);
  const rack = box(1.8, .9, .3, M.wood); rack.position.set(0, .6, .95); g.add(rack);
  for (let i = 0; i < 6; i++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(.26, .34), new THREE.MeshStandardMaterial({ color: i % 2 ? '#d8d2c0' : '#c8c0aa', roughness: .9 })); p.position.set(-.7 + i * .28, 1.25, 1.1); p.rotation.x = -.3; g.add(p); }
  return g;
}
// Steel truss girder between x0..x1 (local), height h: top + bottom chords + Warren diagonals
export function truss(len, h, o = {}) {
  const M = cmats(), g = new THREE.Group(), n = o.n ?? Math.round(len / 4), t = o.t ?? .3;
  const top = box(len, t, t, M.steel); top.position.y = h - t; g.add(top);
  const bot = box(len, t * 1.4, t, M.steel); g.add(bot);
  for (let i = 0; i < n; i++) {
    const x0 = -len / 2 + i * len / n, x1 = x0 + len / n, xm = (x0 + x1) / 2;
    for (const [a, b] of [[x0, xm], [x1, xm]]) { const dx = b - a, L = Math.hypot(dx, h - t); const m = box(t * .8, L, t * .8, M.steel); m.position.set(a, t * .7, 0); m.rotation.z = -Math.atan2(dx, h - t); g.add(m); }
  }
  for (let i = 0; i <= n; i++) { const p = box(t * .7, h, t * .7, M.steel); p.position.x = -len / 2 + i * len / n; g.add(p); }
  return g;
}
// Furniture for the rooftop room
export function bed() { const M = cmats(), g = new THREE.Group(); const f = box(2.0, .35, 1.1, M.wood); g.add(f); const m = box(1.9, .2, 1.0, solid(['#4a4e5c', '#5e6476', '#767c90', '#9096a8'], 3)); m.position.y = .35; g.add(m); const p = box(.5, .14, .7, solid(['#a8a49a', '#c4c0b4', '#dad6ca'], 4)); p.position.set(-.65, .55, 0); g.add(p); return g; }
export function desk() { const M = cmats(), g = new THREE.Group(); const t = box(1.4, .06, .6, M.wood); t.position.y = .74; g.add(t); for (const [x, z] of [[-.64, -.24], [.64, -.24], [-.64, .24], [.64, .24]]) { const l = box(.05, .74, .05, M.metal); l.position.set(x, 0, z); g.add(l); } return g; }
export function heater() {
  const g = new THREE.Group(), M = cmats();
  const body = box(.7, .9, .3, solid(['#3a2a24', '#5a4034', '#7a5a46', '#9a765c'], 9)); g.add(body);
  const coilM = new THREE.MeshStandardMaterial({ color: '#2a0a04', emissive: new THREE.Color('#ff3a10'), emissiveIntensity: 0, roughness: .6 });
  for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .5, 6).rotateZ(Math.PI / 2), coilM); c.position.set(0, .3 + i * .17, .17); g.add(c); }
  const cable = box(.5, .03, .03, M.dark); cable.position.set(.55, .05, 0); g.add(cable);
  g.userData.coil = coilM; return g;
}
