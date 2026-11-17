// What If Your Wallet Refilled Every Morning? — page contract: window.DUR, window.render(t), window.READY, window.TEXTS, window.EV
import * as THREE from 'three';
import { makePost } from './post_ts.js';
import { DUR, shotAt, VO, T, CHIPS } from './story.js';
import { buildCity } from './city.js';
import { drawOverlay, overlayReady } from './ui.js';

const W = 1920, H = 1080, Q = new URLSearchParams(location.search);
const SS = +(Q.get('ss') ?? 1);
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);
renderer.domElement.style.width = W + 'px'; renderer.domElement.style.height = H + 'px';
const camera = new THREE.PerspectiveCamera(32, W / H, .1, 2000);
const city = buildCity();
const post = makePost(renderer, city.scene, camera, W, H, { ssaa: SS });
const V = post.vig.uniforms;
if (Q.has('nobloom')) post.bloom.enabled = false;
await overlayReady();

const TILT = !Q.has('notilt');
const _v = new THREE.Vector3();
window.DUR = DUR;
window.render = t => {
  const shot = shotAt(t);
  post.dof.scene = city.scene;
  V.fade.value = 1; V.warm.value = .1; V.sat.value = 1.05; V.amt.value = .6; V.contrast.value = .2;
  post.bloom.radius = .7;
  const r = city.update(t, shot, camera, post, renderer) || {};
  if (TILT) {
    let c = r.tiltC;
    if (c == null && r.track) { camera.updateMatrixWorld(); _v.copy(r.track).project(camera); c = Math.min(.8, Math.max(.2, _v.y * .5 + .5)); }
    post.dof.tiltAmt = r.tiltAmt ?? 17; post.dof.tiltC = c ?? .45; post.dof.tiltW = (r.tiltW ?? .075) * (r.band ?? 1); post.dof.tiltF = .3;
    post.dof.maxCoc = Math.max(post.dof.maxCoc, 22); V.sat.value *= 1.12; V.contrast.value = .26;
  }
  post.composer.render();
  drawOverlay(t);
};
window.TEXTS = t => drawOverlay(t);   // 2D only: cheap
// Sound events for the mixer (exported by events.mjs)
const ev = (t, type, o = {}) => ({ t, type, ...o });
const ticks = []; for (const c of CHIPS) { if (c.at != null) ticks.push(ev(c.at + .05, 'tick')); for (const [a] of c.steps || []) ticks.push(ev(a + .05, 'tick')); }
window.EV = [
  ...VO.map(v => ({ t: v.t, type: 'voice', id: v.id, dlg: !!v.dlg, sub: v.sub, who: v.who })),
  ...VO.filter(v => v.dlg).map(v => ev(v.t - .45, 'chime')),
  ...ticks,
  ev(T.slap, 'slap'), ev(8.0, 'riffle', { b: 11.0 }), ev(T.walletDown, 'walletDown'),
  ev(T.dump, 'coins'), ev(T.alarm, 'alarm'), ev(T.glow1, 'refill', { big: 1 }), ev(T.open1, 'zip'),
  ...T.nights.flatMap((n, i) => [ev(n.hide + 1.2, ['drawer', 'fridge', 'tape'][i]), ev(n.glow, 'refill'), ev(n.open - .3, ['drawer', 'fridge', 'tapeRip'][i])]),
  ev(T.cafeDoor1, 'doorbell'), ev(T.pay1, 'note'), ev(126.0, 'till'), ev(T.cup1, 'cup'), ev(T.sip1, 'sip'),
  ...T.spree.map((a, i) => ev(a, i === 2 ? 'kayak' : 'thump')), ...T.spree.map(a => ev(a - .9, 'refill', { small: 1 })),
  ev(T.cafeDoor2, 'doorbell'), ev(T.sip2, 'sip'), ev(T.kayakGlow, 'refill'),
  ev(T.bankEnter, 'door'), ev(T.bagDrop, 'bag'),
  ...T.count.map(a => ev(a, 'noteSlap')),
  ev(T.button, 'click'), ev(T.door, 'bankDoor'), ...[...Array(12)].map((_, i) => ev(T.steps[0] + i * .68, 'step')),
  ev(T.walletOpen, 'zip'),
  ev(T.glowAll, 'refillCrowd'), ...T.prices.map((a, i) => ev(a, 'chalk', { i })), ev(T.paper, 'paper'),
  ev(T.locker - .2, 'lockerShut'), ev(T.lock, 'lock'), ev(T.lightsOff, 'switch'), ev(T.sixAM, 'refill', { big: 2 }),
  ev(T.pikeIn, 'door'), ev(T.lockerOpen, 'lockerOpen'), ev(520.2, 'paperForm'),
  ...T.formGlows.map(a => ev(a, 'refill', { small: 1 })), ...T.formGlows.map(a => ev(a + .5, 'stamp')),
  ev(T.cafeDoor3, 'doorbell'), ev(T.coins, 'coins'), ev(557.6, 'cup'), ev(T.sip3, 'sip'),
];
window.READY = true;
