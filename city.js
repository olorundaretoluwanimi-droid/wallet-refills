// Larkfield: one diorama for the whole film. Main Street (the federal building, Larkfield Savings, the Bean There café,
// your building with the rooftop flat), a plaza with a fountain, a city grid for the wides, and three cut-away interiors
// far east of town: the interrogation room, the evidence room and the bank hall. Every shot = camera + light key + cast.
import * as THREE from 'three';
import { glow } from './px.js';
import { box } from './kit.js';
import { sky, stars, particles, flick } from './fx.js';
import { cmats, Windows, building, shopFront, lampPost, car, bed, desk, screen, pixText, sign, solid, tex } from './city_art.js';
import { note, cashBrick, roomBox, table, chair, fridge, dresser, cardboard, kayak, lockers, stall, priceBoard, pendant, fountain, tv, flamingo, drums, gamingChair, bigTape } from './props.js';
import { mat } from './kit.js';
import { makeChar } from './chars.js';
import { T, PRICES } from './story.js';
import { track, seg, ss, lerp, clamp, mulberry } from '/core/lib.js';

const C = c => new THREE.Color(c);
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
// —— Light keys: each set owns one ——
const KEYS = {
  night: { top: '#03050c', mid: '#0b1428', hor: '#1e2c46', sun: '#8ea8e0', sunI: .7, sunDir: [-20, 34, 16], hemiS: '#3a4c7a', hemiG: '#0a0c14', hemiI: 1.5, fog: '#101a2e', fogD: .006, exp: 1.45, moon: .3 },
  dawn: { top: '#4a5a8a', mid: '#b8a4b8', hor: '#ffd2b0', sun: '#ffd4b0', sunI: 1.6, sunDir: [40, 14, 30], hemiS: '#c8b8d0', hemiG: '#3a3230', hemiI: 1.5, fog: '#c8aaa4', fogD: .006, exp: 1.12, moon: .5 },
  morning: { top: '#46689a', mid: '#90b0d4', hor: '#f0e2c8', sun: '#fff0d8', sunI: 2.3, sunDir: [30, 30, 34], hemiS: '#b0c4e0', hemiG: '#4a4030', hemiI: 1.2, fog: '#c4c8c8', fogD: .0045, exp: 1.05, moon: .2 },
  noon: { top: '#3a70b4', mid: '#88b4e0', hor: '#e8e4d4', sun: '#fff6e0', sunI: 2.7, sunDir: [12, 44, 22], hemiS: '#c0d0e8', hemiG: '#4e4434', hemiI: 1.1, fog: '#c8ccc8', fogD: .004, exp: 1.0, moon: .1 },
  dusk: { top: '#1a2038', mid: '#5a4a6a', hor: '#e08a5a', sun: '#ffa070', sunI: 1.0, sunDir: [-40, 10, 14], hemiS: '#8a7a98', hemiG: '#20181c', hemiI: 1.5, fog: '#5a4a5a', fogD: .0065, exp: 1.25, moon: .6 },
  iroom: { top: '#05070a', mid: '#0a0e14', hor: '#141a22', sun: '#7a8aa8', sunI: .35, sunDir: [-10, 30, 20], hemiS: '#5a6a84', hemiG: '#14161c', hemiI: 1.5, fog: '#1a2230', fogD: .02, exp: 1.35, moon: 0 },
  marble: { top: '#3a70b4', mid: '#88b4e0', hor: '#e8e4d4', sun: '#fff4e4', sunI: 1.6, sunDir: [24, 40, 30], hemiS: '#e4e8ec', hemiG: '#7a7468', hemiI: 1.9, fog: '#d0d2cc', fogD: .008, exp: 1.0, moon: 0 },
  violet: { top: '#2a2050', mid: '#7a5a98', hor: '#e0a0b8', sun: '#e8b8d8', sunI: 1.3, sunDir: [40, 16, 30], hemiS: '#a890c8', hemiG: '#2a2030', hemiI: 1.6, fog: '#8a70a0', fogD: .006, exp: 1.15, moon: .4 },
  hot: { top: '#7a2a10', mid: '#e0602a', hor: '#ffc070', sun: '#ffb070', sunI: 2.6, sunDir: [30, 22, 30], hemiS: '#ffb890', hemiG: '#5a2a18', hemiI: 1.5, fog: '#d07a4a', fogD: .006, exp: 1.08, moon: 0 },
  office: { top: '#05070a', mid: '#0a0e14', hor: '#141a22', sun: '#8090b0', sunI: .2, sunDir: [-10, 30, 20], hemiS: '#4a5466', hemiG: '#0c0e12', hemiI: 1.1, fog: '#121820', fogD: .02, exp: 1.3, moon: 0 },
  black: { top: '#020304', mid: '#04060a', hor: '#080a10', sun: '#405070', sunI: .04, sunDir: [-10, 30, 20], hemiS: '#141c2c', hemiG: '#020304', hemiI: .35, fog: '#04060a', fogD: .03, exp: 1.5, moon: 0 },
};
function mixKey(a, b, k) {
  const A = KEYS[a], B = KEYS[b], o = {};
  for (const n in A) { if (typeof A[n] === 'number') o[n] = lerp(A[n], B[n], k); else if (Array.isArray(A[n])) o[n] = A[n].map((v, i) => lerp(v, B[n][i], k)); else o[n] = C(A[n]).lerp(C(B[n]), k); }
  return o;
}
// The refill: a gold flash that swings every shadow, then a soft afterglow
export function refill(t, t0, sustain = 0) {
  const d = t - t0; if (d < 0) return 0;
  const f = d < .1 ? d / .1 : Math.exp(-(d - .1) * 1.3);
  return Math.max(f, sustain);
}

// —— Layout ——
const HB = { x: 13, z: -11.4, w: 10, d: 12, floors: 3 };          // your building
const RH = 3.6 + 3.1 * (HB.floors - 1);                           // its roof (9.8)
const ROOM = { x: 13, z: -9.0, w: 6.4, d: 4.6, h: 2.8, y: RH + .33 };
const CAFE = { x: -2, w: 10 }, BANK = { x: -24, w: 14 }, FED = { x: -48, w: 18 };
const IR = { x: 200, z: 0 }, ER = { x: 230, z: 0 }, BK = { x: 270, z: 0 };
const PLAZA = { x: 38, z: 17 };
const SERIALS = ['LB 04620718 A', 'LB 11893204 C', 'LB 52071946 D', 'LB 38265117 F', 'LB 90413382 E'];

export function buildCity() {
  const M = cmats(), scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#101a2e', .006);
  const SK = sky(); scene.add(SK.mesh);
  const ST = stars(500, 11); scene.add(ST);
  const sun = new THREE.DirectionalLight('#ffffff', 1); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera; sc.left = -26; sc.right = 26; sc.top = 20; sc.bottom = -20; sc.near = 1; sc.far = 200; sun.shadow.bias = -.0006; sun.shadow.normalBias = .02;
  const sunT = new THREE.Object3D(); scene.add(sunT); sun.target = sunT; scene.add(sun);
  const hemi = new THREE.HemisphereLight('#ffffff', '#222222', 1); scene.add(hemi);
  const W = new Windows(5000); scene.add(W.mesh);
  const R = mulberry(81);

  // —— Ground and Main Street ——
  const gnd = box(420, .2, 300, M.asphalt, { cast: false }); gnd.position.set(0, -.2, 0); scene.add(gnd);
  const road = box(240, .04, 6, M.asphalt, { cast: false }); road.position.set(0, -.02, 0); scene.add(road);
  for (const s of [-1, 1]) { const pv = box(240, .14, 2.4, M.paving, { cast: false }); pv.position.set(0, 0, s * 4.2); scene.add(pv); const kb = box(240, .16, .2, M.kerb, { cast: false }); kb.position.set(0, 0, s * 3.05); scene.add(kb); }
  for (let x = -110; x < 110; x += 4) { const d = box(2, .03, .12, M.paint, { cast: false }); d.position.set(x, .01, 0); scene.add(d); }
  const row = [
    { x: -80, w: 16, mat: 'concreteW', floors: 4 }, { x: -64, w: 14, mat: 'brickY', floors: 5 },
    { x: FED.x, w: FED.w, mat: 'stone', floors: 5, fed: 1 }, { x: BANK.x, w: BANK.w, mat: 'stone', floors: 4, bank: 1 },
    { x: -12, w: 8, mat: 'brick', floors: 4 }, { x: CAFE.x, w: CAFE.w, mat: 'brickY', floors: 4, cafe: 1 },
    { x: HB.x, w: HB.w, mat: 'brickD', floors: HB.floors, hero: 1 }, { x: 26, w: 14, mat: 'concrete', floors: 5 },
    { x: 42, w: 16, mat: 'brick', floors: 4 }, { x: 58, w: 14, mat: 'concreteB', floors: 5 }, { x: 74, w: 16, mat: 'brickY', floors: 4 },
  ];
  for (const b of row) { const g = building(W, { x: b.x, z: -11.4, w: b.w, d: 12, floors: b.floors, mat: b.mat, shop: true, hollow: !!b.cafe, rnd: R, lampP: .4, wpm: b.bank || b.fed ? .3 : .45, roofBoxes: b.hero ? 0 : 2 }); scene.add(g); }
  for (const [x, w, sg, inside] of [[-80, 12, 'PHARMACY', '#c8f0d8'], [-64, 10, 'BOOKS', '#ffd090'], [-12, 6, 'FLORIST', '#ffc8a0'], [HB.x, 6, 'LAUNDRY', '#d8e8ff'], [26, 10, 'BAKERY', '#ffc070'], [42, 12, 'HARDWARE', '#ffd8a0'], [58, 10, 'TOYS', '#ffd0e0']]) {
    const s = shopFront(w, 3.6, { sign: sg, inside, signO: { bg: '#16181e', fg: '#e8d8a8', k: .55 } }); s.position.set(x, 0, -5.38); scene.add(s);
  }
  // Federal building: steps, columns, sign
  for (let i = 0; i < 6; i++) { const c = box(.8, 4.2, .8, M.stone); c.position.set(FED.x - 7 + i * 2.8, 0, -4.9); scene.add(c); }
  const fent = box(FED.w, .8, 1.5, M.stone); fent.position.set(FED.x, 4.2, -5.0); scene.add(fent);
  const fs = sign('FEDERAL BUILDING', 10, .8, { bg: '#22262c', fg: '#e8e0c8', k: .55 }); fs.position.set(FED.x, 4.6, -4.22); scene.add(fs);
  const fdoor = new THREE.Mesh(new THREE.PlaneGeometry(3, 3.2), new THREE.MeshStandardMaterial({ color: '#1a1814' })); fdoor.position.set(FED.x, 1.6, -5.36); scene.add(fdoor);
  // Larkfield Savings: columns, sign, doors
  for (let i = 0; i < 5; i++) { const c = box(.7, 3.8, .7, M.stone); c.position.set(BANK.x - 5.6 + i * 2.8, 0, -4.9); scene.add(c); }
  const bent = box(BANK.w, .7, 1.4, M.stone); bent.position.set(BANK.x, 3.8, -5.0); scene.add(bent);
  const bs = sign('LARKFIELD SAVINGS', 9, .8, { bg: '#20242a', fg: '#e2cf96', k: .55 }); bs.position.set(BANK.x, 4.15, -4.28); scene.add(bs);
  const bsteps = box(8, .3, 1.2, M.stone, { cast: false }); bsteps.position.set(BANK.x, 0, -4.7); scene.add(bsteps);
  const bdoor = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 3.0), new THREE.MeshStandardMaterial({ color: '#2a2016', emissive: C('#ffe4b0'), emissiveIntensity: .25 })); bdoor.position.set(BANK.x, 1.6, -5.36); scene.add(bdoor);

  // —— The Bean There café: open glass front, counter, espresso machine, pendants, menu ——
  const cafeF = shopFront(CAFE.w, 3.6, { sign: 'BEAN THERE', inside: '#ffcf90', opacity: .3, signO: { bg: '#2a1a10', fg: '#f4e0b0', k: .62, font: '"Cormorant Garamond"' } }); cafeF.position.set(CAFE.x, 0, -5.38); scene.add(cafeF); cafeF.userData.glass.depthWrite = false;
  cafeF.children.forEach(c => { if (!c.geometry) return; c.geometry.computeBoundingBox(); const bb = c.geometry.boundingBox; if (Math.abs(c.position.x) < .01 && bb.max.x - bb.min.x < .2 && bb.max.y - bb.min.y > 2) c.visible = false; });
  const cfl = box(CAFE.w - .4, .05, 5.4, M.wood, { cast: false }); cfl.position.set(CAFE.x, 0, -8.2); scene.add(cfl);
  const cwall = solid(['#5a4a3a', '#7a6650', '#9a8268', '#b49c7e'], 31);
  const cbk = box(CAFE.w - .4, 3.5, .2, cwall); cbk.position.set(CAFE.x, 0, -11.0); scene.add(cbk);
  for (const s of [-1, 1]) { const sw = box(.2, 3.5, 5.6, cwall); sw.position.set(CAFE.x + s * (CAFE.w / 2 - .25), 0, -8.2); scene.add(sw); }
  const cceil = box(CAFE.w - .4, .2, 5.6, M.plaster, { cast: false }); cceil.position.set(CAFE.x, 3.5, -8.2); scene.add(cceil);
  const counter = box(4.2, 1.05, .7, M.wood); counter.position.set(CAFE.x, 0, -9.9); scene.add(counter);
  const ctop = box(4.3, .05, .8, solid(['#c8c0b0', '#dcd6c8', '#ece8dc'], 33)); ctop.position.set(CAFE.x, 1.05, -9.9); scene.add(ctop);
  const machine = box(.7, .55, .45, M.metal); machine.position.set(CAFE.x + 1.4, 1.1, -10.0); scene.add(machine);
  const till = box(.4, .3, .35, M.dark); till.position.set(CAFE.x - .9, 1.1, -10.0); scene.add(till);
  const menu = screen(40, 22, P => { P.fill(() => [34, 30, 26]); pixText(P, 'COFFEE', 8, 3, [240, 228, 200]); pixText(P, '$4', 13, 11, [250, 220, 150], 2); });
  menu.set('m'); const mm = new THREE.Mesh(new THREE.PlaneGeometry(1.4, .77), new THREE.MeshStandardMaterial({ map: menu.tex, emissive: C('#ffffff'), emissiveMap: menu.tex, emissiveIntensity: .3 })); mm.position.set(CAFE.x - .4, 2.55, -10.88); scene.add(mm);
  for (const [x, z] of [[-3.4, -6.6], [3.2, -6.8]]) { const tb = table(.8, .8, .74); tb.position.set(CAFE.x + x, 0, z); scene.add(tb); }
  const cpend = [-1.4, .2, 1.8].map(x => { const p = pendant('#ffcf8a', .7); p.position.set(CAFE.x + x, 3.5, -9.6); scene.add(p); return p; });
  const cafeL = new THREE.PointLight('#ffcf90', 0, 9, 2); cafeL.position.set(CAFE.x, 2.6, -8.4); scene.add(cafeL);
  const cups = [0, 1, 2].map(() => { const c = new THREE.Mesh(new THREE.CylinderGeometry(.05, .04, .1, 8).translate(0, .05, 0), new THREE.MeshStandardMaterial({ color: '#ece6d8' })); scene.add(c); return c; });

  // —— Your building: the rooftop flat (cut away for interiors) ——
  const RX = ROOM.x, RY = ROOM.y, RZ = ROOM.z;
  const room = new THREE.Group(); scene.add(room);
  const rflr = box(ROOM.w, .1, ROOM.d, M.wood, { cast: false }); rflr.position.set(RX, RY - .1, RZ); room.add(rflr);
  const rwall = solid(['#7a6e66', '#84786f', '#8e8278'], 35);
  const back = box(ROOM.w, ROOM.h, .16, rwall); back.position.set(RX, RY, RZ - ROOM.d / 2); room.add(back);
  for (const s of [-1, 1]) { const w = box(.16, ROOM.h, ROOM.d, rwall); w.position.set(RX + s * ROOM.w / 2, RY, RZ); room.add(w); }
  const front = new THREE.Group(); room.add(front);
  for (const [x0, x1] of [[-3.2, -1.6], [-.2, 3.2]]) { const p = box(x1 - x0, ROOM.h, .16, rwall); p.position.set(RX + (x0 + x1) / 2, RY, RZ + ROOM.d / 2); front.add(p); }
  const sill = box(1.4, .95, .16, rwall); sill.position.set(RX - .9, RY, RZ + ROOM.d / 2); front.add(sill);
  const lint = box(1.4, .5, .16, rwall); lint.position.set(RX - .9, RY + ROOM.h - .5, RZ + ROOM.d / 2); front.add(lint);
  const wglass = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.35), new THREE.MeshBasicMaterial({ color: '#0a1220' })); wglass.position.set(RX - .9, RY + 1.62, RZ + ROOM.d / 2 + .09); front.add(wglass);
  const roofR = box(ROOM.w + .4, .2, ROOM.d + .4, M.concrete); roofR.position.set(RX, RY + ROOM.h, RZ); room.add(roofR);
  const rug = box(2.0, .02, 1.4, M.rug, { cast: false }); rug.position.set(RX - .4, RY, RZ + .2); room.add(rug);
  const BD = bed(); BD.position.set(RX - 2.1, RY, RZ - 1.45); room.add(BD);
  const NS = box(.5, .55, .45, solid(['#3a2a1c', '#5a4028', '#7a5838'], 37)); NS.position.set(RX - .65, RY, RZ - 1.8); room.add(NS);
  const WAL = { x: RX - .62, y: RY + .57, z: RZ - 1.7 };   // where the wallet lies at night
  const wallet = box(.16, .03, .11, solid(['#2a160c', '#4a2a14', '#6e4020'], 39)); room.add(wallet);
  const DR = dresser(); DR.position.set(RX + .55, RY, RZ - 1.95); room.add(DR);
  const FR = fridge(); FR.position.set(RX + 2.6, RY, RZ - 1.8); room.add(FR);
  const TAPE = bigTape(); TAPE.position.set(RX + 1.6, RY, RZ + .1); room.add(TAPE);
  const rclock = screen(24, 9, (P, s) => pixText(P, s, 2, 2, [255, 120, 90]));
  const rcm = new THREE.Mesh(new THREE.PlaneGeometry(.6, .23), new THREE.MeshBasicMaterial({ map: rclock.tex, transparent: true, color: new THREE.Color(1.8, 1.8, 1.8) }));
  const rcb = box(.68, .3, .05, M.dark); rcb.position.set(RX - .65, RY + 1.9, RZ - ROOM.d / 2 + .1); room.add(rcb); rcm.position.set(RX - .65, RY + 2.05, RZ - ROOM.d / 2 + .14); room.add(rcm);
  const lampL = new THREE.PointLight('#ffb870', 0, 7, 2); lampL.position.set(RX - .6, RY + 1.3, RZ - 1.2); scene.add(lampL);
  const lampG = glow('#ffc070', .5, 1); lampG.position.set(RX - .7, RY + .95, RZ - 1.85); scene.add(lampG);
  const lampShade = box(.22, .26, .22, solid(['#a89470', '#c8b48a', '#e2d0a4'], 41)); lampShade.position.set(RX - .78, RY + .55, RZ - 1.88); room.add(lampShade);
  // what the spree brings (appears at T.spree[i]); and the shoeboxes of cash
  const SP = [
    [cardboard(.3, .2, .3, 2), RX - .2, RZ - .6, 0], [gamingChair(), RX + 1.2, RZ - .2, -.5], [kayak(3.0), RX + .1, RZ + 1.45, 0], [tv(), RX - 2.6, RZ + .5, .9],
    [cardboard(.6, .5, .5, 3), RX + 2.6, RZ - .5, .2], [flamingo(), RX - 1.7, RZ + 1.5, .4], [drums(), RX + 2.3, RZ + 1.1, -.3], [cardboard(.5, .4, .5, 4), RX - .9, RZ - .9, .3],
    [cardboard(.7, .5, .6, 5), RX + 1.4, RZ - 1.2, -.1], [cardboard(.5, .5, .5, 6), RX - 2.8, RZ - .3, 0], [cardboard(.45, .35, .45, 7), RX + 2.6, RZ - .5, .5], [cardboard(.6, .4, .5, 8), RX - 2.6, RZ + .5, .2],
  ];
  const stackY = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, .5, .9];
  SP.forEach(([o, x, z, ry], i) => { o.position.set(x, RY + stackY[i], z); o.rotation.y = ry; o.userData.base = o.position.clone(); room.add(o); });
  const KAY = SP[2][0];
  const shoe = []; for (let i = 0; i < 7; i++) { const g = new THREE.Group(); const b = cardboard(.34, .14, .22, 20 + i); g.add(b); const c = cashBrick(.3, .05); c.position.y = .14; g.add(c); g.position.set(RX - 2.4 + (i % 4) * .55, RY + (i > 3 ? .14 : 0), RZ + .1 + (i % 2) * .25 - (i > 3 ? .6 : 0)); room.add(g); shoe.push(g); }

  // —— South side: low shops, the plaza with the fountain, lamps, parked cars ——
  for (const [x0, x1] of [[-90, -60], [-58, -30], [-28, -2], [0, 22], [56, 70], [72, 100]]) { const b = box(x1 - x0, 3.4, 10, M[['brick', 'concrete', 'brickY', 'concreteW'][Math.abs(x0) % 4]], { cast: false }); b.position.set((x0 + x1) / 2, 0, 32); scene.add(b); }
  const sq = box(240, .1, 22, M.paving, { cast: false }); sq.position.set(0, -.04, 17); scene.add(sq);
  const FT = fountain(); FT.position.set(PLAZA.x, 0, PLAZA.z); scene.add(FT);
  for (const [x, z] of [[PLAZA.x - 7, PLAZA.z - 5], [PLAZA.x + 7, PLAZA.z - 5], [PLAZA.x - 7, PLAZA.z + 6], [PLAZA.x + 7, PLAZA.z + 6]]) { const tr = new THREE.Mesh(new THREE.SphereGeometry(1.3, 8, 6).translate(0, 2.4, 0), solid(['#1a3a1c', '#2a5a2a', '#3e7a38', '#5a9a48'], 43)); tr.castShadow = true; tr.position.set(x, 0, z); scene.add(tr); const tk = box(.25, 1.6, .25, M.wood); tk.position.set(x, 0, z); scene.add(tk); }
  const lamps = [];
  for (const x of [-42, -28, -14, 0, 14, 28, 56, 70]) { const L = lampPost(4.8); L.position.set(x, 0, 4.95); L.rotation.y = Math.PI / 2; scene.add(L); lamps.push(L); }
  const lampGlows = lamps.map(L => { const g = glow('#ffd9a0', 1.6, .9); g.position.copy(L.localToWorld(L.userData.head.clone())); g.material.depthTest = false; g.renderOrder = 6; scene.add(g); return g; });
  for (const [x, col] of [[-36, ['#1a2a3a', '#2a4058', '#3c5878', '#527296']], [-8, ['#3a1a1a', '#5a2828', '#7a3a38', '#9a5048']], [30, ['#2a2a2a', '#404040', '#5a5a5a', '#787878']], [50, ['#3a3420', '#585030', '#786c44', '#988a5a']]]) { const c = car(col, { seed: x & 7 }); c.position.set(x, 0, 2.15); scene.add(c); }
  // —— City grid (wides) ——
  const mats = ['concrete', 'brick', 'brickD', 'brickY', 'concreteW', 'concreteB', 'stone'];
  for (let gx = -140; gx <= 140; gx += 24) for (const gz of [-30, -50, -74, -98, 52, 76]) {
    const n = 1 + Math.floor(R() * 2.5);
    for (let k = 0; k < n; k++) { const w = 16 / n - .6, x = gx - 8 + (k + .5) * 16 / n, d = 12 + R() * 3, fl = 3 + Math.floor(R() * (Math.abs(gz) > 60 ? 5 : 3));
      scene.add(building(W, { x, z: gz, w, d, floors: fl, mat: mats[Math.floor(R() * mats.length)], rnd: R, lampP: .3, wpm: .34, cast: Math.abs(gz) < 40 })); }
  }
  // —— The dream market: stalls along the south pavement, price boards ——
  const market = new THREE.Group(); scene.add(market); market.visible = false;
  const STALLS = [];
  const goods = [['BREAD', '#c08a4a', '#b8241a'], ['MILK', '#e8e6dc', '#2a5aa8'], ['EGGS', '#e8d8b8', '#d8a020'], ['SOAP', '#a8d0e0', '#8a3aa8'], ['BREAD', '#c08a4a', '#2a8a5a'], ['APPLES', '#c83a2a', '#b8241a'], ['CHEESE', '#e8c860', '#2a5aa8']];
  const MULT = [1, .6, 1.3, .9, 1, .8, 2.2];
  goods.forEach(([lab, gcol, acol], i) => { const x = -14 + i * 5; const s = stall(acol, gcol); s.position.set(x, 0, 5.6); market.add(s); const pb = priceBoard(lab); pb.position.set(x + 1.6, 0, 6.3); market.add(pb); STALLS.push({ x, pb, k: MULT[i], lab }); });
  const R6 = mulberry(19), papSeeds = [...Array(420)].map(() => [R6(), R6(), R6(), R6()]);
  const paper = particles(420, (i, t, o) => { const s = papSeeds[i], a = t - T.paper - s[3] * 2.2; o.x = -12 + s[0] * 30 + Math.sin(t * 1.3 + i) * .6; o.z = 3 + s[1] * 9 + Math.cos(t * 1.1 + i) * .4; o.y = Math.max(.05, 9 - a * (1.1 + s[2] * .6)); o.a = a > 0 ? .95 : 0; o.s = .16; o.r = .45 + s[2] * .25; o.g = .7 + s[2] * .2; o.b = .45; }, { soft: 0, blend: THREE.NormalBlending });
  paper.visible = false; scene.add(paper);

  // —— Interrogation room (federal building, 3rd floor): one lamp over the table ——
  const iroom = roomBox({ x: IR.x, z: IR.z, w: 7, d: 6, h: 4, wall: M.concreteB, floor: mat(tex.paving({ q: 12, cols: ['#2a2e34', '#363a42', '#42474f', '#50555e'] })) }); scene.add(iroom);
  iroom.userData.front.visible = false; iroom.userData.ceil.visible = false;
  const mirror = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.3), new THREE.MeshStandardMaterial({ color: '#0a0e14', roughness: .08, metalness: .6 })); mirror.position.set(IR.x - .4, 1.9, IR.z - 2.88); scene.add(mirror);
  const mframe = box(3.2, 1.5, .06, M.metal); mframe.position.set(IR.x - .4, 1.15, IR.z - 2.93); scene.add(mframe);
  const idoor = box(1.0, 2.1, .06, solid(['#3a3e44', '#4e535a', '#646a72'], 45)); idoor.position.set(IR.x + 3.4, 0, IR.z - 1.2); idoor.rotation.y = Math.PI / 2; scene.add(idoor);
  const ITB = table(1.8, .9, .76, solid(['#5a5e64', '#6e7278', '#82868c'], 47)); ITB.position.set(IR.x, 0, IR.z - .4); scene.add(ITB);
  const ich = chair(); ich.position.set(IR.x - 1.25, 0, IR.z - .3); scene.add(ich);
  const ipend = pendant('#ffd8a0', .9); ipend.position.set(IR.x, 4, IR.z - .4); scene.add(ipend);
  const IL = new THREE.PointLight('#ffd8a0', 0, 8, 1.8); IL.castShadow = true; IL.shadow.mapSize.set(1024, 1024); IL.shadow.bias = -.002; IL.position.set(IR.x, 2.75, IR.z - .4); scene.add(IL);
  const ILG = glow('#ffd8a0', .7, 1.2); ILG.position.set(IR.x, 2.95, IR.z - .4); scene.add(ILG);
  // five notes on the table, then piles; the gym bag
  const tnotes = SERIALS.map((s, i) => { const n = note(s, .3); n.position.set(IR.x - .66 + i * .33, .77, IR.z - .35 + (i % 2) * .02); n.rotation.z = (i - 2) * .04; scene.add(n); return n; });
  const tpiles = SERIALS.map((s, i) => { const b = cashBrick(.3, .1); b.position.set(IR.x - .66 + i * .33, .76, IR.z - .35); b.scale.y = .01; scene.add(b); return b; });
  const gymBag = new THREE.Mesh(new THREE.BoxGeometry(.7, .35, .35).translate(0, .175, 0), solid(['#3a0e14', '#6a1a22', '#962a30', '#b84440'], 49)); gymBag.castShadow = true; scene.add(gymBag);

  // —— Evidence room: lockers 43–49, a desk of forms, a strip light, a wall clock ——
  const eroom = roomBox({ x: ER.x, z: ER.z, w: 8, d: 6, h: 3.4, wall: M.concrete, floor: mat(tex.paving({ q: 12, cols: ['#24272c', '#30343a', '#3c4047', '#4a4e56'] })) }); scene.add(eroom);
  eroom.userData.front.visible = false; eroom.userData.ceil.visible = false;
  const LK = lockers([43, 44, 45, 46, 47, 48, 49], 46); LK.position.set(ER.x - .2, 0, ER.z - 2.6); scene.add(LK);
  const LP = LK.userData.lightPos.clone().add(LK.position);
  const edesk = desk(); edesk.position.set(ER.x + 2.7, 0, ER.z - .2); edesk.rotation.y = -Math.PI / 2; scene.add(edesk);
  const forms = new THREE.Mesh(new THREE.BoxGeometry(.32, 1, .42).translate(0, .5, 0), new THREE.MeshStandardMaterial({ color: '#e8e4d8', roughness: .9 })); forms.position.set(ER.x + 2.7, .78, ER.z - .3); forms.castShadow = true; scene.add(forms);
  const formsB = forms.clone(); formsB.position.set(ER.x + 3.2, 0, ER.z + .6); scene.add(formsB);
  const strip = new THREE.Mesh(new THREE.BoxGeometry(1.6, .06, .18), new THREE.MeshBasicMaterial({ color: '#e8f0ff' })); strip.position.set(ER.x, 3.3, ER.z - .8); scene.add(strip);
  const EL = new THREE.PointLight('#dce8ff', 0, 12, 1.6); EL.position.set(ER.x, 3.0, ER.z - .5); scene.add(EL);
  const eclock = screen(24, 9, (P, s) => pixText(P, s, 2, 2, [255, 120, 90]));
  const ecm = new THREE.Mesh(new THREE.PlaneGeometry(.6, .23), new THREE.MeshBasicMaterial({ map: eclock.tex, transparent: true, color: new THREE.Color(1.8, 1.8, 1.8) }));
  const ecb = box(.68, .3, .05, M.dark); ecb.position.set(ER.x + 2.2, 2.3, ER.z - 2.88); scene.add(ecb); ecm.position.set(ER.x + 2.2, 2.45, ER.z - 2.84); scene.add(ecm);
  const edoor = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.1), new THREE.MeshBasicMaterial({ color: '#000000' })); edoor.position.set(ER.x - 3.88, 1.05, ER.z + .6); edoor.rotation.y = Math.PI / 2; scene.add(edoor);
  const corridor = new THREE.PointLight('#ffe8c0', 0, 6, 2); corridor.position.set(ER.x - 3.4, 1.8, ER.z + .6); scene.add(corridor);

  // —— Bank hall: marble, a long counter with glass, green banker's lamps, high windows ——
  const marble = mat(tex.paving({ q: 24, cols: ['#a8a49a', '#c4c0b4', '#dad6ca', '#ecE8dc'.toLowerCase()] }));
  const broom = roomBox({ x: BK.x, z: BK.z, w: 14, d: 9, h: 4.6, wall: M.stone, floor: marble }); scene.add(broom);
  broom.userData.front.visible = false; broom.userData.ceil.visible = false;
  const bcount = box(9, 1.1, .8, solid(['#3a2a1c', '#5a4028', '#7a5838', '#96704a'], 51)); bcount.position.set(BK.x + .5, 0, BK.z - 2.6); scene.add(bcount);
  const bctop = box(9.2, .06, .9, mat(tex.stone({ cols: ['#5a5e58', '#787c74', '#9a9c92', '#b8bab0'] }))); bctop.position.set(BK.x + .5, 1.1, BK.z - 2.6); scene.add(bctop);
  const bglass = new THREE.Mesh(new THREE.PlaneGeometry(9, .9), new THREE.MeshStandardMaterial({ color: '#a8c8d0', transparent: true, opacity: .14, roughness: .05 })); bglass.position.set(BK.x + .5, 1.65, BK.z - 2.95); scene.add(bglass);
  for (let i = 0; i < 5; i++) { const p = box(.06, .9, .06, M.metal); p.position.set(BK.x - 4 + i * 2.25, 1.16, BK.z - 2.95); scene.add(p); }
  const blamps = [-2.5, 1.0, 3.6].map(x => { const g = new THREE.Group(); const sh = new THREE.Mesh(new THREE.CylinderGeometry(.08, .2, .14, 10, 1, true), new THREE.MeshStandardMaterial({ color: '#1a6a3a', emissive: C('#2a9a5a'), emissiveIntensity: .6, side: THREE.DoubleSide })); sh.position.y = .42; g.add(sh); const st = box(.03, .4, .03, M.metal); g.add(st); g.position.set(BK.x + x, 1.13, BK.z - 2.4); scene.add(g); return g; });
  const BL = new THREE.PointLight('#c8ffd8', 0, 6, 1.8); BL.position.set(BK.x + .4, 2.2, BK.z - 1.8); scene.add(BL);
  for (const x of [-4.5, 0, 4.5]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.8), new THREE.MeshBasicMaterial({ color: new THREE.Color('#e8f4ff').multiplyScalar(1.6) })); w.position.set(BK.x + x, 3.2, BK.z - 4.38); scene.add(w); }
  for (const x of [-5, -3.4]) { const p = box(.1, .95, .1, M.metal); p.position.set(BK.x + x, 0, BK.z + 1.2); scene.add(p); }
  const rope = box(1.6, .05, .05, solid(['#5a0e14', '#8a1a22', '#b42a30'], 53)); rope.position.set(BK.x - 4.2, .82, BK.z + 1.2); scene.add(rope);
  const bkPivot = new THREE.Group(); bkPivot.position.set(BK.x - 6.9, 0, BK.z + 2.4); scene.add(bkPivot);
  const bkDoor = box(.08, 2.6, 1.6, mat(tex.wood())); bkDoor.position.set(0, 0, -.8); bkPivot.add(bkDoor);
  const bkDoorLight = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.6), new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff4e0').multiplyScalar(1.4) })); bkDoorLight.position.set(BK.x - 6.98, 1.3, BK.z + 1.6); bkDoorLight.rotation.y = Math.PI / 2; scene.add(bkDoorLight);
  const bclock = screen(24, 9, (P, s) => pixText(P, s, 2, 2, [40, 40, 40])); bclock.set('10:14');
  const bcm = new THREE.Mesh(new THREE.PlaneGeometry(.8, .3), new THREE.MeshBasicMaterial({ map: bclock.tex, transparent: true, color: '#ffffff' })); bcm.position.set(BK.x + 5.2, 3.2, BK.z - 4.36); scene.add(bcm);
  // the counting: piles of the five notes on the counter
  const bnotes = SERIALS.map((s, i) => { const n = note(s, .3); n.position.set(BK.x - .66 + i * .33, 1.175, BK.z - 2.5); n.visible = false; scene.add(n); return n; });
  const bpiles = SERIALS.map((s, i) => { const b = cashBrick(.3, .1); b.position.set(BK.x - .66 + i * .33, 1.165, BK.z - 2.5); b.scale.y = .01; scene.add(b); return b; });
  const bbag = gymBag.clone(); scene.add(bbag);
  // dust motes in the bank's window light
  const R4 = mulberry(5), dustSeeds = [...Array(160)].map(() => [R4(), R4(), R4(), R4()]);
  const DUSTC = { x: 0, y: 0, z: 0, w: 12, h: 4, d: 8 };
  const dust = particles(160, (i, t, o) => { const s = dustSeeds[i]; o.x = DUSTC.x - DUSTC.w / 2 + s[0] * DUSTC.w + Math.sin(t * .3 + i) * .3; o.y = DUSTC.y + .4 + s[1] * DUSTC.h; o.z = DUSTC.z - DUSTC.d / 2 + s[2] * DUSTC.d; o.s = .04; o.a = .35 * s[3]; o.r = 1; o.g = .95; o.b = .82; }, { soft: 1 });
  scene.add(dust);

  // —— Cast ——
  const hero = makeChar('hero', 'hero', { tag: 'hero' }); scene.add(hero.root);
  const pike = makeChar('pike'); scene.add(pike.root);
  const barista = makeChar('barista'); scene.add(barista.root);
  const teller = makeChar('teller'); scene.add(teller.root);
  const LKS = ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8'];
  const folk = [...Array(36)].map((_, i) => { const c = makeChar('folk', LKS[(i * 5 + 3) % 8]); scene.add(c.root); return c; });
  const all = [hero, pike, barista, teller, ...folk];
  // the wallet's light: one shadowed point light + glow; the crowd's wallets in the dream: glows only
  const WL = new THREE.PointLight('#ffc860', 0, 7, 1.7); WL.castShadow = true; WL.shadow.mapSize.set(1024, 1024); WL.shadow.bias = -.003; scene.add(WL);
  const WG = glow('#ffd070', .9, 1.4); WG.material.depthTest = false; WG.renderOrder = 7; scene.add(WG);
  const crowdG = folk.map(() => { const g = glow('#ffd070', .7, 1.2); g.renderOrder = 7; scene.add(g); return g; });
  const fill = new THREE.PointLight('#c8d4f0', 0, 9, 2); scene.add(fill);
  const P0 = new THREE.PointLight('#ffd09a', 0, 16, 1.8); scene.add(P0);

  const walk4 = (t, fps = 8, pre = 'w') => pre + ['0', '1', '2', '3'][Math.floor(t * fps) % 4];
  const idle = (t, s = 0) => (Math.floor(t * 1.4 + s) % 2 ? 'idle1' : 'idle0');
  const blinkOr = (t, f, b, s = 0) => (((t + s) % 3.7) < .12 ? b : f);
  const place = (c, x, y, z) => { c.root.visible = true; c.root.position.set(x, y, z); };
  const talking = (t, id) => { const v = id; return v; };

  // —— Cameras per shot (local time) ——
  const CAM = {
    intA: { p: track([[0, [IR.x + .9, 3.7, IR.z + 5.6]], [6, [IR.x + .7, 3.3, IR.z + 4.8]]]), l: track([[0, [IR.x, .95, IR.z - .4]], [6, [IR.x, .95, IR.z - .4]]]), fov: 30 },
    notes: { p: track([[0, [IR.x + .02, 2.3, IR.z - .1]], [6, [IR.x + .02, 2.1, IR.z - .12]]]), l: track([[0, [IR.x, .76, IR.z - .36]], [6, [IR.x, .76, IR.z - .36]]]), fov: 34 },
    intB: { p: track([[0, [IR.x + .7, 3.3, IR.z + 4.8]], [15.5, [IR.x + .4, 2.8, IR.z + 3.9]]]), l: track([[0, [IR.x, .95, IR.z - .4]], [15.5, [IR.x - .1, .95, IR.z - .4]]]), fov: 30 },
    title: { p: track([[0, [-60, 70, 86]], [7.5, [-46, 62, 76]]]), l: track([[0, [0, 0, -14]], [7.5, [4, 0, -14]]]), fov: 34 },
    night: { p: track([[0, [RX + 3.2, RY + 4.6, RZ + 7.2]], [10, [RX + 2.6, RY + 4.0, RZ + 6.2]]]), l: track([[0, [RX - 1.0, RY + .7, RZ - .9]], [10, [RX - 1.1, RY + .7, RZ - 1.0]]]), fov: 30 },
    dawn: { p: track([[0, [RX + 2.6, RY + 4.0, RZ + 6.2]], [2, [RX + 2.5, RY + 3.9, RZ + 6.0]], [7, [RX + 1.2, RY + 2.0, RZ + 3.0]], [23, [RX + 1.0, RY + 1.8, RZ + 2.7]]]), l: track([[0, [RX - 1.1, RY + .7, RZ - 1.0]], [7, [RX - .9, RY + .7, RZ - 1.4]], [23, [RX - .9, RY + .75, RZ - 1.4]]]), fov: 30 },
    tests: { p: track([[0, [RX + .6, RY + 4.4, RZ + 7.0]], [36, [RX + .5, RY + 4.2, RZ + 6.7]]]), l: track([[0, [RX + .1, RY + .6, RZ - .9]], [36, [RX + .1, RY + .6, RZ - .9]]]), fov: 34 },
    cafe1: { p: track([[0, [CAFE.x + 2.0, 3.0, -1.6]], [28, [CAFE.x + 1.7, 2.9, -2.4]]]), l: track([[0, [CAFE.x - .1, .9, -9.6]], [28, [CAFE.x - .1, .9, -9.6]]]), fov: 30 },
    spree: { p: track([[0, [RX + .4, RY + 5.6, RZ + 8.6]], [40, [RX + .4, RY + 5.0, RZ + 7.8]]]), l: track([[0, [RX, RY + .5, RZ - .3]], [40, [RX, RY + .5, RZ - .3]]]), fov: 34 },
    cafe2: { p: track([[0, [CAFE.x + 1.7, 2.9, -2.4]], [18, [CAFE.x + 1.5, 2.8, -3.0]]]), l: track([[0, [CAFE.x - .1, .9, -9.6]], [18, [CAFE.x - .1, .9, -9.6]]]), fov: 30 },
    plan: { p: track([[0, [PLAZA.x + .4, 18, PLAZA.z + 6.6]], [16, [PLAZA.x, 16, PLAZA.z + 5.8]]]), l: track([[0, [PLAZA.x, 0, PLAZA.z]], [16, [PLAZA.x, 0, PLAZA.z]]]), fov: 30 },
    kayak: { p: track([[0, [RX + .4, RY + 5.0, RZ + 7.8]], [6, [RX + .4, RY + 4.6, RZ + 7.0]], [16, [RX + 1.0, RY + 2.0, RZ + 4.4]], [26, [RX + .9, RY + 1.8, RZ + 4.0]]]), l: track([[0, [RX, RY + .5, RZ - .3]], [16, [RX + .1, RY + .6, RZ + 1.3]], [26, [RX + .1, RY + .6, RZ + 1.3]]]), fov: 30 },
    bankwide: { p: track([[0, [BANK.x + 14, 26, 34]], [11.5, [BANK.x + 5, 3.6, 10]]]), l: track([[0, [BANK.x, 0, -6]], [11.5, [BANK.x + 1, 1.4, -4.6]]]), fov: track([[0, [34]], [11.5, [30]]]) },
    bankIn: { p: track([[0, [BK.x + 3.4, 5.6, BK.z + 9.2]], [8.5, [BK.x + 2.8, 5.0, BK.z + 8.2]]]), l: track([[0, [BK.x - 1.4, 1.0, BK.z - 1.0]], [8.5, [BK.x - .8, 1.0, BK.z - 1.4]]]), fov: 32 },
    counter: { p: track([[0, [BK.x + 2.6, 4.3, BK.z + 5.0]], [44, [BK.x + 2.0, 3.8, BK.z + 4.0]]]), l: track([[0, [BK.x, .45, BK.z - 2.0]], [44, [BK.x, .45, BK.z - 2.1]]]), fov: 30 },
    serials: { p: track([[0, [BK.x, 2.8, BK.z - 2.52]], [20, [BK.x, 2.7, BK.z - 2.53]]]), l: track([[0, [BK.x, 1.17, BK.z - 2.74]], [20, [BK.x, 1.17, BK.z - 2.74]]]), fov: 34 },
    button: { p: track([[0, [BK.x + 1.6, 6.6, BK.z + 9.6]], [22, [BK.x + 1.2, 6.2, BK.z + 9.0]]]), l: track([[0, [BK.x - 1.8, 1.0, BK.z - .8]], [22, [BK.x - 1.8, 1.0, BK.z - .8]]]), fov: 34 },
    int2: { p: track([[0, [IR.x + .9, 3.7, IR.z + 5.6]], [27, [IR.x + .6, 3.1, IR.z + 4.5]]]), l: track([[0, [IR.x, .95, IR.z - .4]], [27, [IR.x, .95, IR.z - .4]]]), fov: 30 },
    dream: { p: track([[0, [4, 24, 32]], [12, [2, 13, 22]], [14, [-6, 4.8, 15.5]], [38, [6, 4.4, 14.4]], [45, [6.4, 4.6, 14.8]]]), l: track([[0, [2, 1, 4]], [12, [2, 1, 5]], [14, [-5, 1.6, 5.6]], [38, [5, 1.8, 5.8]], [45, [5, 1.8, 5.8]]]), fov: track([[0, [34]], [12, [32]], [14, [30]], [45, [30]]]) },
    int3: { p: track([[0, [IR.x + .6, 3.1, IR.z + 4.5]], [42, [IR.x + .3, 2.6, IR.z + 3.6]]]), l: track([[0, [IR.x, .95, IR.z - .4]], [42, [IR.x - .1, .95, IR.z - .4]]]), fov: 30 },
    evidence: { p: track([[0, [ER.x + .6, 4.2, ER.z + 7.2]], [13, [ER.x + .5, 4.0, ER.z + 6.8]], [22, [ER.x + 1.3, 1.9, ER.z + 2.6]], [34, [ER.x + 1.2, 1.85, ER.z + 2.5]]]), l: track([[0, [ER.x, 1.0, ER.z - 1.4]], [13, [ER.x, 1.0, ER.z - 1.5]], [22, [ER.x - .1, 1.2, ER.z - 2.3]], [34, [ER.x - .1, 1.2, ER.z - 2.3]]]), fov: 30 },
    forms: { p: track([[0, [ER.x + 2.2, 3.4, ER.z + 5.4]], [22, [ER.x + 2.0, 3.2, ER.z + 5.0]]]), l: track([[0, [ER.x + 1.0, 1.0, ER.z - 1.2]], [22, [ER.x + 1.0, 1.0, ER.z - 1.2]]]), fov: 30 },
    cafe3: { p: track([[0, [CAFE.x + 2.0, 3.0, -1.6]], [20, [CAFE.x + 1.7, 2.9, -2.4]], [24, [CAFE.x + 1.8, 3.2, -1.0]], [36, [CAFE.x + 5, 9, 12]]]), l: track([[0, [CAFE.x - .1, .9, -9.6]], [20, [CAFE.x - .1, .9, -9.6]], [36, [CAFE.x, 1.4, -7.5]]]), fov: track([[0, [30]], [20, [30]], [36, [32]]]) },
    endWide: { p: track([[0, [CAFE.x + 6, 12, 16]], [18, [CAFE.x + 30, 52, 74]]]), l: track([[0, [CAFE.x, 1.4, -7.2]], [18, [CAFE.x, 0, -8]]]), fov: track([[0, [32]], [18, [36]]]) },
  };

  function applyKey(K, renderer) {
    SK.u.top.value.copy(K.top); SK.u.mid.value.copy(K.mid); SK.u.hor.value.copy(K.hor);
    const sd = new THREE.Vector3(...K.sunDir).normalize();
    SK.u.moonDir.value.copy(sd); SK.u.moonCol.value.copy(K.sun); SK.u.moonI.value = K.moon;
    sun.color.copy(K.sun); sun.intensity = K.sunI; sun.position.copy(sunT.position).addScaledVector(sd, 90);
    hemi.color.copy(K.hemiS); hemi.groundColor.copy(K.hemiG); hemi.intensity = K.hemiI;
    scene.fog.color.copy(K.fog); scene.fog.density = K.fogD; renderer.toneMappingExposure = K.exp;
  }
  const KEY_OF = {
    intA: 'iroom', notes: 'iroom', intB: 'iroom', title: 'morning', night: 'night', dawn: 'night', tests: 'night', street: 'morning', cafe1: 'morning', spree: 'noon', cafe2: 'morning', plan: 'noon', kayak: 'noon',
    bankwide: 'morning', bankIn: 'marble', counter: 'marble', serials: 'marble', button: 'marble', int2: 'iroom', dream: 'violet', int3: 'iroom', home: 'dusk', evidence: 'office', forms: 'office', cafe3: 'morning', endWide: 'morning',
  };
  const ROOM_SHOTS = ['night', 'dawn', 'tests', 'spree', 'kayak'];
  const INTERIOR = { intA: 1, notes: 1, intB: 1, int2: 1, int3: 1, evidence: 1, forms: 1, bankIn: 1, counter: 1, serials: 1, button: 1 };

  function update(t, shot, cam, post, renderer) {
    const lt = t - shot.a, id = shot.id;
    all.forEach(c => { c.root.visible = false; });
    WL.intensity = 0; WG.visible = false; crowdG.forEach(g => { g.visible = false; }); fill.intensity = 0; P0.intensity = 0; lampL.intensity = 0; lampG.visible = false;
    cafeL.intensity = 0; IL.intensity = 0; ILG.visible = false; EL.intensity = 0; BL.intensity = 0; corridor.intensity = 0; dust.visible = false; paper.visible = false; market.visible = false;
    front.visible = true; roofR.visible = true; cafeF.userData.glass.opacity = .3; cups.forEach(c => { c.visible = false; });
    gymBag.visible = false; bbag.visible = false; tnotes.forEach(n => { n.visible = false; }); tpiles.forEach(p => { p.visible = false; }); bnotes.forEach(n => { n.visible = false; }); bpiles.forEach(p => { p.visible = false; });
    LK.userData.vents.color.setRGB(0, 0, 0); LK.userData.pivot.rotation.y = 0;
    const vis = id === 'home' && t > 480;

    // ——— key ———
    let K;
    if (id === 'dawn') K = mixKey('night', 'dawn', ss(seg(t, T.alarm, T.alarm + 4)));
    else if (id === 'tests') { const n = T.nights.find(n => t >= n.a && t < n.a + 12) || T.nights[2]; K = mixKey('night', 'dawn', ss(seg(t, n.glow - .6, n.glow + .3))); }
    else if (id === 'dream') K = mixKey('violet', 'hot', ss(seg(t, T.prices[0], T.paper)));
    else if (id === 'evidence') K = mixKey('office', 'black', ss(seg(t, T.lightsOff, T.lightsOff + .15)) * (t < T.pikeIn + .3 ? 1 : 1));
    else if (id === 'home') K = mixKey('dusk', 'dusk', 0);
    else if (id === 'endWide') K = mixKey('morning', 'morning', 0);
    else K = mixKey(KEY_OF[id] || 'noon', KEY_OF[id] || 'noon', 0);
    if (['title', 'endWide', 'bankwide'].includes(id)) K.fogD *= .5;
    const CK = CAM[id];
    let look = null;
    if (CK) { cam.position.set(...CK.p(lt)); look = V3(...CK.l(lt)); cam.fov = typeof CK.fov === 'number' ? CK.fov : CK.fov(lt)[0]; }
    // tracking shots computed from the action
    let hx = 0;
    if (id === 'street') { hx = lerp(HB.x - 1, CAFE.x + 3.6, ss(seg(t, 104.4, 117.6))); cam.position.set(hx + 2.6, 3.4, 1.8); look = V3(hx + 1.0, 1.0, -4.2); cam.fov = 30; }
    if (id === 'home') { if (t < 480) { hx = lerp(-26, HB.x - 1, seg(t, 466.4, 479.6)); cam.position.set(hx + 2.6, 3.4, 1.8); look = V3(hx + 1.0, 1.0, -4.2); cam.fov = 32; } else { cam.position.set(RX + 1.0, RY + 3.0, RZ + 5.4); look = V3(RX + .1, RY + .6, RZ + 1.0); cam.fov = 30; } }
    if (look) cam.lookAt(look);
    sunT.position.copy(look || V3(0, 0, 0)); sunT.position.y = 0;
    applyKey(K, renderer);
    const night = ['night', 'dusk', 'black'].includes(KEY_OF[id]) || (id === 'tests' && K.sunI < 1) || (id === 'dawn' && t < T.alarm);
    ST.visible = KEY_OF[id] === 'night' && id !== 'dawn'; ST.material.uniforms.t.value = t;
    W.update(t, { night: night || id === 'home' ? 1 : 0, day: night ? null : [K.mid.r * .5, K.mid.g * .5, K.mid.b * .55] });
    lampGlows.forEach(g => { g.visible = night || id === 'home'; });
    lamps.forEach(L => { L.userData.bulb.material.color.setRGB(night || id === 'home' ? 3 : .6, night || id === 'home' ? 2.5 : .55, night || id === 'home' ? 1.6 : .5); });
    cafeF.userData.glass.emissiveIntensity = night ? .4 : .15;
    cpend.forEach(p => p.userData.bulb.material.color.setRGB(3, 2.4, 1.4));

    let flip = false, tiltC = null, focusOn = null;
    const wglow = (p, k, shadow = true, size = 1) => { if (k <= .002) return; WL.position.copy(p).add(V3(0, .25, .35)); WL.intensity = 6 * Math.pow(k, 1.3); WL.castShadow = shadow; WG.visible = true; WG.position.copy(p).add(V3(0, .05, .05)); WG.material.opacity = Math.min(1, k * 1.2); WG.scale.setScalar((.4 + .6 * k) * size); };

    // ——— the flat ———
    if (ROOM_SHOTS.includes(id) || vis) {
      front.visible = false; roofR.visible = false;
      const spreeK = t >= T.spree[0] - .5 || id === 'kayak' || vis;
      SP.forEach(([o], i) => { const a = T.spree[i]; const show = t >= a || (t > 186 && t < 600); o.visible = show && spreeK; if (o.visible) { const d = t - a; const drop = d < .32 && d >= 0 ? (1 - d / .32) : 0; o.position.copy(o.userData.base); o.position.y += drop * drop * 1.4 + (d >= .32 && d < .5 ? Math.sin((d - .32) / .18 * Math.PI) * .05 : 0); } });
      KAY.userData.cash.visible = id === 'kayak' || vis;
      shoe.forEach((s, i) => { s.visible = (id === 'kayak' && t > 223 + i * .5) || vis; });
      DR.userData.drawer.position.z = 0; FR.userData.pivot.rotation.y = 0;
      wallet.visible = false;
      const clockOf = id === 'night' ? '23:58' : id === 'dawn' ? (t < T.alarm ? '5:59' : '6:00') : id === 'kayak' ? '6:00' : id === 'spree' ? '9:30' : vis ? '19:40' : '0:00';
      let ck = clockOf;
      fill.position.set(RX + .6, RY + 2.2, RZ + 2.6); fill.intensity = night ? .9 : 1.2; fill.color.set(night ? '#7a94d0' : '#ffe0c8');
      if (night || vis) { lampL.intensity = 1.6; lampG.visible = true; }
      if (id === 'night') {
        place(hero, RX - 1.4, RY + .36, RZ - .72);
        hero.frame(t < T.dump ? blinkOr(t, 'sitWallet', 'sitBlink') : t < T.dump + 3 ? 'sitWalletOpen' : blinkOr(t, 'sitFlat', 'sitFlatBlink'));
        hero.face(cam, false); focusOn = hero.root.position.clone().add(V3(0, .6, 0));
        if (t >= T.dump + 3) { wallet.visible = true; wallet.position.set(WAL.x, WAL.y, WAL.z); }
      }
      if (id === 'dawn') {
        wallet.visible = t < 51.6; wallet.position.set(WAL.x, WAL.y, WAL.z);
        if (t < T.alarm + 1.4) { place(hero, RX - 2.0, RY + .5, RZ - 1.35); hero.frame(t < T.alarm ? 'lie' : 'lieOpen'); }
        else { place(hero, RX - 1.4, RY + .36, RZ - .72); const f = t < 51.6 ? 'wake' : t < T.open1 ? 'sitWallet' : t < 63.4 ? (Math.floor(t * 1.4) % 2 ? 'sitWalletFull' : 'sitWalletFull2') : null; if (f) hero.frame(f); else { place(hero, RX - 1.0, RY, RZ - .7); hero.frame(Math.floor(t * 2.2) % 2 ? 'walletFull' : 'walletFull2'); } }
        hero.face(cam, false);
        const k = refill(t, T.glow1, 0); wglow(V3(WAL.x, WAL.y + .05, WAL.z), k * 1.2);
        focusOn = t < T.glow1 - .5 ? hero.root.position.clone().add(V3(0, .5, 0)) : t < 52 ? V3(WAL.x, WAL.y + .2, WAL.z) : hero.root.position.clone().add(V3(0, .6, 0));
        if (t > T.open1) { const hp = hero.handPos(false); wglow(hp, .25 + .1 * Math.sin(t * 3), false, .7); }
      }
      if (id === 'tests') {
        const n = T.nights.find(n => t >= n.a && t < n.a + 12) || T.nights[2], ni = T.nights.indexOf(n);
        ck = t < n.sleep ? ['23:51', '23:47', '23:55'][ni] : t < n.glow ? (t < n.glow - 1.5 ? '3:12' : '5:59') : '6:00';
        const spot = [V3(RX + .55, RY, RZ - 1.35), V3(RX + 2.0, RY, RZ - 1.0), V3(RX + 1.0, RY, RZ + .5)][ni];
        const wpos = [V3(RX + .55, RY + .6, RZ - 1.9), V3(RX + 2.6, RY + 1.4, RZ - 1.6), V3(RX + 1.6, RY + .3, RZ + .1)][ni];
        if (t < n.hide) { place(hero, RX - 1.4, RY + .36, RZ - .72); hero.frame('sitWallet'); }
        else if (t < n.sleep - .4) { const k = seg(t, n.hide, n.hide + 1.1); place(hero, lerp(RX - 1.2, spot.x, k), RY, lerp(RZ - .7, spot.z, k)); hero.frame(k < 1 ? walk4(t) : 'reachW'); flip = spot.x < RX - 1.2; }
        else if (t < n.open - .2) { place(hero, RX - 2.0, RY + .5, RZ - 1.35); hero.frame('lie'); }
        else { place(hero, spot.x - .1, RY, spot.z + .25); hero.frame(Math.floor(t * 2.2) % 2 ? 'walletFull' : 'walletFull2'); }
        hero.face(cam, flip);
        // the hiding places open
        if (ni === 0 && (t > n.hide + 1.1 && t < n.sleep - .4 || t > n.open - .4)) DR.userData.drawer.position.z = .35;
        if (ni === 1 && (t > n.hide + 1.1 && t < n.sleep - .4 || t > n.open - .4)) FR.userData.pivot.rotation.y = 1.4;
        const k = refill(t, n.glow, 0); wglow(wpos, k * 1.15);
        if (ni === 1 && t > n.open) { P0.position.set(RX + 2.5, RY + 1.5, RZ - 1.0); P0.color.set('#c8e4ff'); P0.intensity = 2.2; }
        focusOn = t > n.glow - .3 && t < n.open ? wpos.clone() : hero.root.position.clone().add(V3(0, .6, 0));
        if (t > n.open) { const hp = hero.handPos(flip); wglow(hp, .22, false, .6); }
      }
      if (id === 'spree') {
        const ph = t < 160 ? 0 : t < 175 ? 1 : 2;
        place(hero, RX - .5, RY, RZ + .35);
        hero.frame(ph === 0 ? (Math.floor(t * 2.4) % 2 ? 'cheer' : 'cheer1') : ph === 1 ? blinkOr(t, 'smile', 'smileBlink') : blinkOr(t, 'flat', 'flatBlink'));
        hero.face(cam, false);
        // every morning: the nightstand flashes gold
        for (const a of T.spree) { const k = refill(t, a - .9, 0) * .55; if (k > .02) wglow(V3(WAL.x, WAL.y + .05, WAL.z), k, false); }
        focusOn = V3(RX, RY + .6, RZ + .2);
        ck = String(8 + Math.floor((t - 146) / 3) % 4) + ':00';
      }
      if (id === 'kayak') {
        place(hero, RX + .2, RY + .22, RZ + 1.5);
        hero.frame(t > 236 && t < 237.4 ? 'sitTalk' : blinkOr(t, 'sitNote', 'sitFlatBlink'));
        hero.face(cam, false);
        wallet.visible = true; wallet.position.set(WAL.x, WAL.y, WAL.z);
        const k = refill(t, T.kayakGlow, 0); wglow(V3(WAL.x, WAL.y + .05, WAL.z), k);
        focusOn = t < 228 ? V3(RX - 1.6, RY + .3, RZ + .2) : hero.root.position.clone().add(V3(0, .5, 0));
      }
      if (vis) {
        place(hero, RX + .2, RY + .22, RZ + 1.5); hero.frame(blinkOr(t, 'sitFlat', 'sitFlatBlink')); hero.face(cam, false);
        focusOn = hero.root.position.clone().add(V3(0, .5, 0)); ck = '19:40';
      }
      rclock.set(ck);
    }

    // ——— the street ———
    if (id === 'street') {
      place(hero, hx, 0, -4.2); hero.frame(walk4(t)); hero.face(cam, true);
      for (let i = 0; i < 6; i++) { const c = folk[i], dir = i % 2 ? 1 : -1; place(c, (i * 7 - 18) + dir * (t - 104) * 1.1, 0, i % 2 ? 4.2 : -4.6); c.frame(walk4(t + i * .3, 7 + i % 3)); c.face(cam, dir < 0); }
      focusOn = hero.root.position.clone().add(V3(0, .9, 0));
    }
    if (id === 'home' && t < 480) {
      place(hero, hx, 0, -4.2); hero.frame(walk4(t, 6, 'wp')); hero.face(cam, false);
      for (let i = 0; i < 4; i++) { const c = folk[i], dir = i % 2 ? 1 : -1; place(c, (i * 9 - 30) + dir * (t - 466) * 1.0, 0, i % 2 ? 4.2 : -4.7); c.frame(walk4(t + i * .3, 7)); c.face(cam, dir < 0); }
      focusOn = hero.root.position.clone().add(V3(0, .9, 0));
    }

    // ——— the café ———
    if (id === 'cafe1' || id === 'cafe2' || id === 'cafe3') {
      cafeF.userData.glass.opacity = .08; cafeL.intensity = 5;
      const HXc = CAFE.x - .7, HZc = -8.9, BX = CAFE.x + .5, BZ = -10.75;
      let hf, bf, hxp = HXc, hzp = HZc;
      if (id === 'cafe1') {
        if (t < 121.0) { const k = seg(t, T.cafeDoor1, 121.0); hxp = lerp(CAFE.x + 3.4, HXc, k); hzp = lerp(-7.4, HZc, k); hf = walk4(t); }
        else if (t < 127.0) hf = t > T.pay1 ? 'pay' : blinkOr(t, 'smile', 'smileBlink');
        else if (t < 129.5) hf = 'talk';
        else if (t < T.cup1) hf = blinkOr(t, 'smile', 'smileBlink');
        else if (t < T.sip1) hf = 'cup'; else hf = Math.floor((t - T.sip1) / 2.6) % 2 ? 'cup' : 'sip';
        bf = t < T.pay1 + .4 ? blinkOr(t, idle(t), 'blink') : t < 126.5 ? 'note' : t < 133 ? blinkOr(t, 'cross', 'blink') : t < T.cup1 + .6 ? 'offer' : blinkOr(t, idle(t), 'blink', 1);
      } else if (id === 'cafe2') {
        hf = (t > 188.5 && t < 191.0) || (t > 197.6 && t < 199.4) ? 'talk' : t > T.sip2 ? 'sipFlat' : blinkOr(t, 'cupFlat', 'flatBlink');
        bf = t > 193.6 && t < 195.0 ? 'talk' : blinkOr(t, Math.floor(t * 1.4) % 2 ? 'cross1' : 'cross', 'blink');
      } else {
        if (t < 549.6) { const k = seg(t, T.cafeDoor3, 549.6); hxp = lerp(CAFE.x + 3.4, HXc, k); hzp = lerp(-7.4, HZc, k); hf = walk4(t); }
        else if (t < 554.2) hf = blinkOr(t, 'idle0', 'blink');
        else if (t < T.coins + .3) hf = 'talk';
        else if (t < 558.0) hf = 'coins';
        else if (t < T.sip3) hf = 'cup'; else hf = t < 566 ? 'sip' : blinkOr(t, 'cup', 'smileBlink');
        bf = t > 550 && t < 551.4 ? 'talk' : t > T.coins + .2 && t < 557.4 ? 'smile' : t > 557.4 && t < 558.4 ? 'offer' : blinkOr(t, idle(t), 'blink');
      }
      place(hero, hxp, 0, hzp); hero.frame(hf); hero.face(cam, hxp > HXc + .1);
      place(barista, BX, 0, BZ); barista.frame(bf); barista.face(cam, true);
      cups[0].visible = id !== 'cafe1' || t < T.cup1; cups[0].position.set(CAFE.x + 1.2, 1.08, -9.9);
      fill.position.set(CAFE.x, 2.2, -5.0); fill.intensity = 1.4; fill.color.set('#ffe0c0');
      focusOn = V3((hxp + BX) / 2, 1.1, (hzp + BZ) / 2);
      if (id === 'cafe3' && t > 567) focusOn = V3(CAFE.x - .2, 1.1, -9.4);
      // morning regulars at the tables
      [[CAFE.x - 3.0, -6.2], [CAFE.x + 3.5, -6.4]].forEach(([x, z], i) => { const c = folk[10 + i]; place(c, x, .02, z); c.frame('sit'); c.face(cam, i === 0); });
    }
    if (id === 'plan') {
      const a = (t - 204) / 8 * Math.PI * 2, r = 3.5; place(hero, PLAZA.x + Math.cos(a) * r, 0, PLAZA.z + Math.sin(a) * r);
      hero.frame(walk4(t, 7)); hero.face(cam, -Math.sin(a) < 0, .55);
      for (let i = 0; i < 10; i++) { const c = folk[i], dir = i % 2 ? 1 : -1; place(c, PLAZA.x + (i - 5) * 2.4 + dir * (t - 204) * .9, 0, PLAZA.z + (i % 3 - 1) * 6 + 1); c.frame(walk4(t + i * .4, 7)); c.face(cam, dir < 0, .55); }
      focusOn = V3(PLAZA.x, 0, PLAZA.z); tiltC = .5;
    }

    // ——— the bank ———
    if (id === 'bankwide') {
      const k = ss(seg(t, 247.0, 256.6)); place(hero, lerp(BANK.x + 13, BANK.x + .4, k), 0, lerp(-4.0, -4.4, k)); hero.frame(walk4(t, 7, 'wb')); hero.face(cam, true);
      if (t > 256.0) hero.root.visible = false;
      for (let i = 0; i < 6; i++) { const c = folk[i], dir = i % 2 ? 1 : -1; place(c, BANK.x + (i * 6 - 14) + dir * (t - 246) * 1.0, 0, i % 2 ? 4.2 : -4.7); c.frame(walk4(t + i * .3, 7)); c.face(cam, dir < 0); }
      focusOn = hero.root.visible ? hero.root.position.clone().add(V3(0, .9, 0)) : V3(BANK.x, 1.4, -5);
    }
    if (['bankIn', 'counter', 'serials', 'button'].includes(id)) {
      BL.intensity = 3; DUSTC.x = BK.x; DUSTC.y = 0; DUSTC.z = BK.z; dust.visible = true; dust.userData.update(t);
      fill.position.set(BK.x + 1, 2.6, BK.z + 2.5); fill.intensity = 1.0; fill.color.set('#fff4e4');
      const HXb = BK.x - .4, HZb = BK.z - 1.75, TX = BK.x + .3, TZ = BK.z - 3.35;
      let hxp = HXb, hzp = HZb, hf = 'bag', tf;
      if (id === 'bankIn') { const k = ss(seg(t, 258.2, 265.4)); hxp = lerp(BK.x - 6.4, HXb, k); hzp = lerp(BK.z + 1.8, HZb, k); hf = k < 1 ? walk4(t, 7, 'wb') : 'bag'; }
      if (id === 'counter') hf = t < T.bagDrop ? 'bag' : [[270.7, 274.4], [284.5, 288.0], [298.8, 300.6]].some(([a, b]) => t > a && t < b) ? 'talk' : t > 302.8 && t < 306 ? blinkOr(t, 'flat', 'flatBlink') : blinkOr(t, idle(t), 'blink');
      if (id === 'button') hf = t < T.door ? blinkOr(t, 'idle0', 'blink') : t < 346 ? blinkOr(t, 'flat', 'flatBlink') : 'shrug';
      if (id !== 'serials') { place(hero, hxp, 0, hzp); hero.frame(hf); hero.face(cam, false); }
      tf = id === 'counter' ? ([[266.5, 268.0], [276.7, 281.0], [291.1, 295.5], [302.8, 304.4]].some(([a, b]) => t > a && t < b) ? 'talk' : blinkOr(t, Math.floor(t * 1.3) % 2 ? 'cross1' : 'cross', 'blink'))
        : id === 'button' ? (t < T.button ? 'stare' : t < T.button + 1.2 ? 'press' : 'stare') : blinkOr(t, idle(t), 'blink');
      if (id !== 'serials') { place(teller, TX, 0, TZ); teller.frame(tf); teller.face(cam, true); }
      // the bag on the counter, the notes
      if (id === 'counter' && t > T.bagDrop || id === 'button') { bbag.visible = true; bbag.position.set(BK.x - 1.5, 1.16, BK.z - 2.45); }
      if (id === 'serials' || id === 'button') { const n = T.count.filter(a => t >= a).length + (id === 'button' ? 99 : 0); bnotes.forEach((nt, i) => { nt.visible = n > i; const cnt = Math.max(0, Math.floor((n - i + 4) / 5)); const p = bpiles[i]; p.visible = cnt > 1; p.scale.y = Math.min(1.2, cnt * .12); nt.position.y = 1.175 + (p.visible ? p.scale.y * .1 : 0); }); }
      if (id === 'serials') { const last = T.count.filter(a => t >= a).pop(); focusOn = V3(BK.x, 1.13, BK.z - 2.5); tiltC = .5; if (last != null && t - last < .12) cam.position.y += .01 * Math.sin((t - last) * 80); }
      if (id === 'button') {
        // the door opens; Agent Pike walks in
        bkPivot.rotation.y = -ss(seg(t, T.door, T.door + .7)) * 1.3;
        if (t > T.door + .2) { const k = ss(seg(t, T.steps[0], T.steps[1])); place(pike, lerp(BK.x - 6.4, BK.x - 1.5, k), 0, lerp(BK.z + 1.6, BK.z - 1.2, k)); pike.frame(k < 1 ? walk4(t, 6) : t > 346.4 && t < 347.8 ? 'point' : blinkOr(t, 'idle0', 'idle0')); pike.face(cam, false); }
        focusOn = t < T.door ? V3(BK.x, 1.2, BK.z - 2.6) : pike.root.visible ? pike.root.position.clone().add(V3(0, .9, 0)) : V3(BK.x - 3, 1.2, BK.z);
      } else if (id !== 'serials') focusOn = V3((hxp + TX) / 2, 1.2, (hzp + TZ) / 2 + .3);
      if (id === 'bankIn') focusOn = hero.root.position.clone().add(V3(0, .9, 0));
    } else bkPivot.rotation.y = 0;

    // ——— the interrogation room ———
    if (['intA', 'notes', 'intB', 'int2', 'int3'].includes(id)) {
      IL.intensity = 15 * (1 + .03 * Math.sin(t * 9)); ILG.visible = true;
      fill.position.set(IR.x, 2.0, IR.z + 2.6); fill.intensity = .7; fill.color.set('#8a9ab8');
      const lines = { hero: [[12.0, 13.4], [20.2, 22.4], [359.2, 360.4], [366.2, 367.9], [425.0, 427.0], [437.0, 438.4], [454.8, 455.9], [462.9, 463.9]], pike: [[1.6, 3.6], [6.2, 9.4], [15.4, 17.4], [355.0, 356.4], [362.5, 363.8], [370.3, 371.7], [429.4, 433.4], [440.4, 442.4], [457.9, 459.9]] };
      const sp = (L) => L.some(([a, b]) => t > a && t < b);
      if (id !== 'notes') {
        place(hero, IR.x - 1.15, .3, IR.z - .25);
        let hf = sp(lines.hero) ? 'sitTalk' : blinkOr(t, 'sit', 'sitBlink');
        if (id === 'intB' && t > T.walletDown - .8 && t < T.walletDown + .4) hf = 'sitWallet';
        if (id === 'int2' && t > T.walletOpen - .6 && t < 369.0) hf = 'sitWalletOpen';
        if (id === 'int3' && t > 437 && t < 438.6) hf = 'sitSmile';
        if (id === 'int3' && t > 455 && t < 456.5) hf = 'sitShrug';
        hero.frame(hf); hero.face(cam, false);
        place(pike, IR.x + 1.15, 0, IR.z - .45);
        let pf = sp(lines.pike) ? (id === 'intA' && t < 4 ? 'slapTalk' : 'talk') : blinkOr(t, Math.floor(t * 1.2) % 2 ? 'cross1' : 'cross', 'crossBlink');
        if (id === 'intA' && t > T.slap - .3 && t < T.slap + .5) pf = 'slap';
        if (id === 'int3' && t > 457.9) pf = t < 460 ? 'talk' : 'wallet';
        pike.frame(pf); pike.face(cam, true);
      }
      // notes on the table; the piles grow to 46 in the insert
      const showNotes = id === 'notes' || (id === 'intA' && t > T.slap) || id === 'intB' || id === 'int2' || id === 'int3';
      tnotes.forEach((n, i) => { n.visible = showNotes; });
      const pk = id === 'notes' ? ss(seg(t, 8.0, 11.0)) : id === 'intA' ? 0 : 1;
      tpiles.forEach((p, i) => { p.visible = pk > 0; p.scale.y = Math.max(.01, pk * 1.0); tnotes[i].position.y = .77 + pk * .1; });
      if (id === 'int2' || id === 'int3') { gymBag.visible = true; gymBag.position.set(IR.x + .45, .76, IR.z - .62); }
      if (id === 'intA') { const d = t - T.slap; if (d > 0 && d < .2) cam.position.y += Math.sin(d * 70) * .03 * (1 - d / .2); }
      if (id === 'intB' && t > T.walletDown) { wallet.visible = false; }
      focusOn = id === 'notes' ? V3(IR.x, .8, IR.z - .36) : V3(IR.x, 1.0, IR.z - .35);
      if (id === 'notes') tiltC = .5;
      // the wallet on the table (open, empty) after it is put down
      if ((id === 'intB' && t > T.walletDown) || id === 'int2' || id === 'int3') { WG.visible = false; }
    }

    // ——— the dream: every wallet refills ———
    if (id === 'dream') {
      market.visible = true;
      const jumps = T.prices.filter(a => t >= a).length;
      const base = [3, 4, 7, 12, 30, 90, 400, 2000, 15000, 90000, 1e6, 4e7, 2e9, 2e11][Math.max(0, jumps - 1)];
      STALLS.forEach((s, i) => { const v = s.lab === 'BREAD' ? (jumps ? PRICES[jumps - 1] : '$3') : fmt(base * s.k); s.pb.userData.scr.set(v); });
      for (let i = 0; i < folk.length; i++) {
        const c = folk[i], x = -15 + (i % 18) * 2.0 + (i > 17 ? 1 : 0), z = 8.2 + (i > 17 ? 1.6 : 0) + (i % 3) * .3;
        place(c, x, 0, z);
        const on = t > T.glowAll + (i * 7 % 36) * .09;
        let f = !on ? idle(t, i) : t < T.prices[0] ? (Math.floor(t * 2 + i) % 2 ? 'wallet' : 'cheer') : t < T.paper ? (i % 3 === 0 ? 'fan' : i % 3 === 1 ? 'point' : 'up') : (i % 2 ? 'shrug' : 'cross');
        c.frame(f); c.face(cam, i % 2 === 0);
        if (on && t < T.prices[0] + 1.5) { const g = crowdG[i], hp = c.handPos(i % 2 === 0); g.visible = true; g.position.copy(hp); const k = refill(t, T.glowAll + (i * 7 % 36) * .09, .3); g.material.opacity = Math.min(1, k); g.scale.setScalar(.35 + .6 * k); }
      }
      if (t >= T.paper) { paper.visible = true; paper.userData.update(t); }
      focusOn = t < 391 ? V3(2, 1, 6) : V3(look.x, 1.8, 6.3);
      if (t < 391) tiltC = .5;
    }

    // ——— the evidence room ———
    if (id === 'evidence' || id === 'forms') {
      const lit = id === 'forms' || t < T.lightsOff;
      EL.intensity = lit ? 7 : 0; strip.material.color.setRGB(lit ? 2.2 : .04, lit ? 2.3 : .04, lit ? 2.5 : .05);
      let open = 0, vent = 0;
      if (id === 'evidence') {
        // Pike locks the wallet away, leaves; lights out; 6:00; he comes back
        if (t < 497) { const k = ss(seg(t, 490.2, 491.6)), out = ss(seg(t, 495.2, 497.0)); place(pike, lerp(ER.x - 3.2, ER.x + .1, k) - out * 3.4, 0, lerp(ER.z + .8, ER.z - 2.0, k) + out * 2.6); pike.frame(k < 1 || out > 0 ? walk4(t, 6) : t < T.lock ? 'reach' : 'idle0'); pike.face(cam, out > 0); }
        if (t > T.pikeIn) { const k = ss(seg(t, T.pikeIn, T.lockerOpen - .5)); place(pike, lerp(ER.x - 3.2, ER.x + .45, k), 0, lerp(ER.z + .8, ER.z - 1.75, k)); pike.frame(k < 1 ? walk4(t, 6) : t < T.lockerOpen + .4 ? 'reach' : t < 520.2 ? 'stare' : t < 521.8 ? 'form' : blinkOr(t, 'form', 'form1')); pike.face(cam, true); corridor.intensity = t < T.pikeIn + 1.5 ? 3 * (1 - seg(t, T.pikeIn + .5, T.pikeIn + 1.5)) : 0; }
        open = ss(seg(t, T.lockerOpen, T.lockerOpen + .5));
        vent = t >= T.sixAM ? Math.max(.65, refill(t, T.sixAM, 0)) : 0;
        const cl = t < 497 ? '23:12' : t < T.sixAM ? ((h => `${Math.floor(h)}:${String(Math.floor(h % 1 * 60)).padStart(2, '0')}`)(lerp(23.2, 29.98, ss(seg(t, 498, 506.8))) % 24)) : '6:00';
        eclock.set(cl.replace(/^0:/, '0:'));
        focusOn = t < 503 ? V3(ER.x, 1.1, ER.z - 2.2) : V3(LP.x, 1.2, LP.z);
        if (t > T.lockerOpen) focusOn = pike.root.position.clone().add(V3(0, 1.0, 0));
      } else {
        place(pike, ER.x + 2.15, 0, ER.z + .3); const g = T.formGlows.find(a => t > a - .2 && t < a + 1.4); pike.frame(g ? 'form' : blinkOr(t, 'stare', 'blink')); pike.face(cam, false);
        vent = Math.max(0, ...T.formGlows.map(a => refill(t, a, 0))) * .8;
        open = 0; eclock.set(['6:00', '6:00'][0]);
        const n = T.formGlows.filter(a => t >= a).length; forms.scale.y = .25 + n * .22; formsB.scale.y = .3 + n * .3;
        focusOn = V3(ER.x + 1.4, 1.1, ER.z - .8);
      }
      if (id === 'evidence') { forms.scale.y = .25; formsB.scale.y = .3; }
      LK.userData.pivot.rotation.y = open * 1.9;
      const vk = Math.max(vent, open);
      LK.userData.vents.color.setRGB(3.2 * vk, 2.4 * vk, 1.0 * vk);
      if (vk > .01) { const p = LP.clone().add(V3(0, 0, .3 + open * .5)); WL.position.copy(p); WL.intensity = (open ? 8 : 6) * Math.pow(vk, 1.2) * (vent > .9 ? 1.2 : 1); WL.castShadow = true; WG.visible = true; WG.position.copy(LP).add(V3(0, 0, .35)); WG.material.opacity = Math.min(1, vk); WG.scale.setScalar(.5 + .6 * vk + open * .3); WG.material.opacity = Math.min(1, vk) * (open ? .6 : 1); }
      fill.position.set(ER.x + 1.6, 2.2, ER.z + 2.2); fill.intensity = lit ? 2.2 : .12; fill.color.set('#8090b8');
    }

    if (id === 'title' || id === 'endWide') { focusOn = id === 'title' ? V3(FED.x + 20, 0, -8) : V3(CAFE.x, 1, -7); tiltC = .48; }

    cam.updateProjectionMatrix();
    const fo = focusOn || look || V3(0, 0, 0);
    post.dof.focus = cam.position.distanceTo(fo);
    const far = ['title', 'endWide', 'plan', 'bankwide'].includes(id) || (id === 'dream' && t < 391);
    post.dof.aper = far ? 420 : 260; post.dof.maxCoc = far ? 20 : 16;
    if (id === 'notes' || id === 'serials') { post.dof.aper = 90; post.dof.maxCoc = 10; }
    if (id === 'dawn' && t > 51) { post.dof.aper = 150; }
    if (id === 'evidence' && t > 504) { post.dof.aper = 140; post.dof.maxCoc = 12; }
    post.bloom.strength = night || id === 'evidence' || INTERIOR[id] && KEY_OF[id] === 'iroom' ? .75 : .45; post.bloom.threshold = night || id === 'evidence' ? .78 : .9;
    post.vig.uniforms.warm.value = id.startsWith('cafe') ? .2 : id === 'dream' ? .15 : night ? .02 : .1;
    post.vig.uniforms.amt.value = night || INTERIOR[id] ? .68 : .55;
    const band = id === 'endWide' ? 1 - ss(seg(t, 590, 599)) * .6 : 1;
    const tiltW = id === 'notes' || id === 'serials' ? .22 : (id === 'dawn' && t > 51) || (id === 'evidence' && t > 504) || id === 'kayak' ? .13 : null;
    return { tiltC, track: tiltC == null ? fo : null, tiltW, band };
  }
  return { scene, update, hero };
}
function fmt(v) { if (v >= 1e9) return '$' + Math.round(v / 1e9) + 'B'; if (v >= 1e6) return '$' + Math.round(v / 1e6) + 'M'; if (v >= 1e4) return '$' + Math.round(v / 1e3) + ',000'; if (v >= 1000) return '$' + Math.round(v).toLocaleString('en-US'); return '$' + Math.max(1, Math.round(v)); }
