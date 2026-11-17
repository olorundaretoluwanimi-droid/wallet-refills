// Larkfield props for the wallet film: banknotes with serial numbers, cash bricks, cut-away rooms, furniture,
// the kayak, evidence lockers (locker 46 glows), market stalls and price boards, pendant lamps, the fountain.
import * as THREE from 'three';
import { PX, ramp, h2, fbm, texOf } from './px.js';
import { box } from './kit.js';
import { cmats, solid, screen, pixText } from './city_art.js';

const stdM = o => new THREE.MeshStandardMaterial({ roughness: .85, ...o });

// A banknote: green pixel note, portrait oval, corner numerals, a printed serial number
const _notes = {};
export function noteTex(serial) {
  if (_notes[serial]) return _notes[serial];
  const P = new PX(64, 28), G = ramp(['#24402a', '#3c6040', '#5c8a5a', '#8ab486', '#c4dcb8'], .45), Ink = [30, 56, 36];
  P.fill((x, y) => {
    const b = Math.min(x, y, 63 - x, 27 - y); let v = b < 1 ? .25 : b < 3 ? .55 + ((x + y) % 3 === 0 ? .2 : 0) : .72 + (fbm(x * .2, y * .2, 3) - .5) * .3;
    const dx = (x - 34) / 7, dy = (y - 12) / 8; if (dx * dx + dy * dy < 1) v = .5 + (1 - dx * dx - dy * dy) * .4 - (dy > .2 ? .2 : 0);
    return G(v, x, y);
  });
  pixText(P, '100', 3, 3, Ink); pixText(P, '100', 49, 3, Ink);
  pixText(P, serial.replace(/ /g, ''), 6, 20, [20, 40, 26]);
  return (_notes[serial] = texOf(P.done()));
}
export function note(serial, w = .3) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 28 / 64), stdM({ map: noteTex(serial) }));
  m.rotation.x = -Math.PI / 2; m.receiveShadow = true; return m;
}
// A brick of cash
let _cashM = null;
export function cashBrick(w = .32, h = .08) {
  if (!_cashM) { const P = new PX(32, 16), G = ramp(['#24402a', '#3c6040', '#5c8a5a', '#8ab486'], .45); P.fill((x, y) => G(y % 2 ? .35 : .7 + (h2(x, y, 4) - .5) * .2, x, y)); _cashM = stdM({ map: texOf(P.done()) }); }
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, w * .44).translate(0, h / 2, 0), _cashM); b.castShadow = b.receiveShadow = true; return b;
}
// Room box: floor, back wall, side walls, a removable front wall and ceiling (a cut-away set)
export function roomBox(o) {
  const M = cmats(), g = new THREE.Group(), { w, d } = o, h = o.h ?? 3.2, wm = o.wall ?? M.plaster;
  const fl = box(w, .1, d, o.floor ?? M.wood, { cast: false }); fl.position.y = -.1; g.add(fl);
  const bk = box(w, h, .2, wm); bk.position.set(0, 0, -d / 2); g.add(bk);
  for (const s of [-1, 1]) { const sw = box(.2, h, d, wm); sw.position.set(s * w / 2, 0, 0); g.add(sw); }
  const front = box(w, h, .2, wm); front.position.set(0, 0, d / 2); g.add(front);
  const ceil = box(w + .4, .2, d + .4, wm, { cast: false }); ceil.position.y = h; g.add(ceil);
  const sk = box(w - .2, .12, .04, M.dark, { cast: false }); sk.position.set(0, 0, -d / 2 + .12); g.add(sk);
  g.position.set(o.x, o.y ?? 0, o.z); g.userData = { front, ceil, h }; return g;
}
export function table(w = 1.6, d = .9, h = .76, m) {
  const M = cmats(), g = new THREE.Group(); const t = box(w, .06, d, m ?? M.wood); t.position.y = h - .06; g.add(t);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const l = box(.06, h - .06, .06, M.metal); l.position.set(x * (w / 2 - .08), 0, z * (d / 2 - .08)); g.add(l); }
  g.userData.h = h; return g;
}
export function chair(m) {
  const M = cmats(), g = new THREE.Group(); const s = box(.46, .05, .46, m ?? M.metal); s.position.y = .44; g.add(s);
  const b = box(.05, .5, .46, m ?? M.metal); b.position.set(-.22, .46, 0); g.add(b);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const l = box(.04, .44, .04, M.metal); l.position.set(x * .2, 0, z * .2); g.add(l); }
  return g;
}
export function fridge() {
  const g = new THREE.Group(), wh = solid(['#9a9e9c', '#bcc0bc', '#d8dcd6', '#eceee8'], 21);
  g.add(box(.8, 1.9, .7, wh));
  const pivot = new THREE.Group(); pivot.position.set(.4, 0, .37); g.add(pivot);       // freezer door (top), hinged on the right
  const fz = box(.8, .62, .06, wh); fz.position.set(-.4, 1.27, 0); pivot.add(fz);
  const lo = box(.8, 1.2, .06, wh); lo.position.set(0, .03, .37); g.add(lo);
  const hd = box(.04, .26, .05, cmats().metal); hd.position.set(-.72, 1.45, .05); pivot.add(hd);
  g.userData.pivot = pivot; return g;
}
export function dresser() {
  const M = cmats(), g = new THREE.Group(), wd = solid(['#3a2a1c', '#5a4028', '#7a5838', '#96704a'], 23);
  g.add(box(1.1, .9, .5, wd));
  const dr = new THREE.Group(); g.add(dr);
  const f = box(1.0, .26, .48, wd); f.position.set(0, .58, .03); dr.add(f);
  const k = box(.14, .04, .04, M.metal); k.position.set(0, .7, .28); dr.add(k);
  for (const y of [.14, .32]) { const ln = box(1.0, .02, .02, M.dark, { cast: false }); ln.position.set(0, y + .12, .26); g.add(ln); }
  g.userData.drawer = dr; return g;
}
export function cardboard(w = .5, h = .4, d = .4, seed = 1) {
  const P = new PX(16, 16), R = ramp(['#6a4a28', '#8a6436', '#a87e48', '#c49a5c'], .45);
  P.fill((x, y) => R(x === 7 || x === 8 ? .22 : .55 + (h2(x, y, seed) - .5) * .3, x, y));
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), stdM({ map: texOf(P.done()) }));
  m.castShadow = m.receiveShadow = true; return m;
}
export function kayak(len = 3.0) {
  const g = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 8).scale(len / 2, .3, .36).translate(0, .22, 0), solid(['#7a1e0c', '#a8320e', '#d04a14', '#ee6a24'], 25));
  hull.castShadow = hull.receiveShadow = true; g.add(hull);
  const ck = box(1.0, .04, .4, cmats().dark, { cast: false }); ck.position.y = .46; g.add(ck); const rim = new THREE.Mesh(new THREE.TorusGeometry(.42, .04, 6, 16).scale(1.3, .55, 1).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#2a1008' })); rim.position.y = .5; g.add(rim);
  const cash = new THREE.Group(); g.add(cash);
  for (let i = 0; i < 12; i++) { const c = cashBrick(.3, .07); c.position.set(-1.0 + (i % 6) * .4, .44 + Math.floor(i / 6) * .07, (i % 2 ? .07 : -.07)); c.rotation.y = i * .7; cash.add(c); }
  g.userData.cash = cash; return g;
}
// Lockers: a row of grey steel lockers with numbers; `hit` has its own door (pivot) and vents that can glow
export function lockers(nums, hit) {
  const M = cmats(), g = new THREE.Group(), st = solid(['#3a3e44', '#4e535a', '#646a72', '#7c828a'], 27), lw = .6, H = 1.9;
  let vents = null, pivot = null, lightPos = null;
  nums.forEach((n, i) => {
    const x = (i - (nums.length - 1) / 2) * lw;
    const body = box(lw - .02, H, .5, st); body.position.x = x; g.add(body);
    const num = screen(12, 7, (P, s) => pixText(P, s, 2, 1, [236, 230, 210])); num.set(String(n));
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(.22, .13), new THREE.MeshStandardMaterial({ map: num.tex, roughness: .8 }));
    if (n === hit) {
      pivot = new THREE.Group(); pivot.position.set(x + lw / 2 - .02, 0, .27); g.add(pivot);
      const door = box(lw - .04, H - .06, .04, st); door.position.set(-lw / 2 + .02, .03, 0); pivot.add(door);
      lab.position.set(-lw / 2 + .02, 1.55, .03); pivot.add(lab);
      vents = new THREE.MeshBasicMaterial({ color: new THREE.Color(0, 0, 0) });
      for (let k = 0; k < 4; k++) { const v = new THREE.Mesh(new THREE.PlaneGeometry(.3, .028), vents); v.position.set(-lw / 2 + .02, 1.27 - k * .065, .025); pivot.add(v); }
      const seam = new THREE.Mesh(new THREE.PlaneGeometry(.012, H - .12), vents); seam.position.set(-.004, H / 2, .025); pivot.add(seam);
      const inside = box(lw - .08, H - .1, .02, M.dark, { cast: false }); inside.position.set(x, .05, -.22); g.add(inside);
      lightPos = new THREE.Vector3(x, 1.15, .1);
    } else {
      const dr = box(lw - .04, H - .06, .04, st); dr.position.set(x, .03, .27); g.add(dr); lab.position.set(x, 1.55, .3); g.add(lab);
      for (let k = 0; k < 4; k++) { const v = box(.3, .02, .01, M.dark, { cast: false }); v.position.set(x, 1.25 - k * .065, .29); g.add(v); }
    }
  });
  g.userData = { pivot, vents, lightPos }; return g;
}
// Market stall: table, striped awning on poles, a row of loaves
export function stall(col, goods = '#c08a4a') {
  const M = cmats(), g = new THREE.Group();
  g.add(box(2.4, .9, 1.0, M.wood));
  for (const x of [-1.15, 1.15]) for (const z of [-.45, .45]) { const p = box(.06, 2.4, .06, M.metal); p.position.set(x, 0, z); g.add(p); }
  const c = document.createElement('canvas'); c.width = 64; c.height = 32; const cx = c.getContext('2d');
  for (let i = 0; i < 64; i += 8) { cx.fillStyle = (i / 8) % 2 ? '#ece4d0' : col; cx.fillRect(i, 0, 8, 32); }
  const aw = new THREE.Mesh(new THREE.BoxGeometry(2.7, .06, 1.4), stdM({ map: texOf(c) })); aw.position.set(0, 2.45, .1); aw.rotation.x = -.18; aw.castShadow = true; g.add(aw);
  for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(.12, 6, 4).scale(1.5, .7, 1), stdM({ color: goods })); b.position.set(-.9 + i * .36, .97, (i % 2) * .2 - .1); b.castShadow = true; g.add(b); }
  return g;
}
// Price board on a post: a slate with a pixel label and price
export function priceBoard(label = 'BREAD') {
  const M = cmats(), g = new THREE.Group();
  g.add(box(.08, 2.1, .08, M.wood));
  const fr = box(1.6, .9, .08, M.wood); fr.position.y = 1.95; g.add(fr);
  const scr = screen(56, 28, (P, s) => { P.fill(() => [30, 36, 32]); pixText(P, label, Math.round((56 - label.length * 4) / 2), 3, [200, 196, 176]); const sc = s.length > 6 ? 1 : 2, w = s.length * 4 * sc; pixText(P, s, Math.max(1, Math.round((56 - w) / 2)), sc === 2 ? 12 : 15, [252, 248, 228], sc); });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(1.44, .72), new THREE.MeshStandardMaterial({ map: scr.tex, roughness: .9, emissive: new THREE.Color('#ffffff'), emissiveMap: scr.tex, emissiveIntensity: .35 }));
  face.position.set(0, 2.4, .05); g.add(face);
  g.userData.scr = scr; return g;
}
export function pendant(col = '#ffcf8a', drop = .9) {
  const M = cmats(), g = new THREE.Group();
  const cord = box(.02, drop, .02, M.dark, { cast: false }); cord.position.y = -drop; g.add(cord);
  const sh = new THREE.Mesh(new THREE.ConeGeometry(.3, .24, 12, 1, true), stdM({ color: '#2a3032', side: THREE.DoubleSide })); sh.position.y = -drop - .08; g.add(sh);
  const b = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(3) })); b.position.y = -drop - .16; g.add(b);
  g.userData.bulb = b; g.userData.bulbY = -drop - .16; return g;
}
export function fountain() {
  const M = cmats(), g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, .55, 20).translate(0, .27, 0), M.stone); b.castShadow = b.receiveShadow = true; g.add(b);
  const w = new THREE.Mesh(new THREE.CircleGeometry(2.15, 20), stdM({ color: '#3a6a84', roughness: .2, metalness: .1, emissive: new THREE.Color('#1a3a4a'), emissiveIntensity: .4 })); w.rotation.x = -Math.PI / 2; w.position.y = .5; g.add(w);
  const c = new THREE.Mesh(new THREE.CylinderGeometry(.25, .35, 1.4, 8).translate(0, .7, 0), M.stone); c.castShadow = true; g.add(c);
  return g;
}
export function tv() { const g = new THREE.Group(); const s = box(1.5, .88, .06, stdM({ color: '#0a0a0c', roughness: .3 })); s.position.y = .45; g.add(s); g.add(box(.5, .45, .3, cmats().metal)); return g; }
export function flamingo() {
  const g = new THREE.Group(), m = stdM({ color: '#f07aa8', roughness: .4 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(.42, 10, 8).scale(1.2, .8, .8).translate(0, .42, 0), m); body.castShadow = true; g.add(body);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.07, .08, .7, 6), m); neck.position.set(.38, .95, 0); neck.rotation.z = -.25; neck.castShadow = true; g.add(neck);
  const hd = new THREE.Mesh(new THREE.SphereGeometry(.13, 8, 6), m); hd.position.set(.46, 1.32, 0); g.add(hd);
  return g;
}
export function drums() {
  const g = new THREE.Group(), red = stdM({ color: '#8a1a24', roughness: .4 }), M = cmats();
  const k = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .35, 12).rotateX(Math.PI / 2).translate(0, .3, 0), red); k.castShadow = true; g.add(k);
  for (const [x, z, r] of [[.45, .2, .17], [-.4, .25, .18], [.1, .45, .16]]) { const d = new THREE.Mesh(new THREE.CylinderGeometry(r, r, .2, 10).translate(0, .6, 0), red); d.position.set(x, 0, z); d.castShadow = true; g.add(d); }
  const cy = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .01, 12), stdM({ color: '#c8a040', metalness: .7, roughness: .3 })); cy.position.set(.6, 1.0, -.2); g.add(cy);
  const p = box(.02, 1.0, .02, M.metal); p.position.set(.6, 0, -.2); g.add(p);
  return g;
}
export function gamingChair() {
  const g = new THREE.Group(), m = stdM({ color: '#1a1a20' }), r = stdM({ color: '#3a6ad8' });
  const s = box(.55, .1, .55, m); s.position.y = .45; g.add(s);
  const b = box(.55, .8, .1, m); b.position.set(0, .5, -.25); g.add(b);
  const st = box(.4, .2, .04, r); st.position.set(0, .9, -.19); g.add(st);
  g.add(box(.06, .45, .06, cmats().metal));
  return g;
}
export function bigTape(w = .55, h = .45, d = .45) {   // the duct-taped box (silver tape bands)
  const g = new THREE.Group(); g.add(cardboard(w, h, d, 9));
  const tm = stdM({ color: '#a8acb0', roughness: .35, metalness: .4 });
  for (const k of [-.3, 0, .3]) { const t = new THREE.Mesh(new THREE.BoxGeometry(w + .02, .06, d + .02), tm); t.position.set(0, h / 2 + k * h * .7, 0); t.rotation.z = k * .4; g.add(t); }
  return g;
}
