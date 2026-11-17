// Model sheet: every pose of every character, enlarged (review only: ?sheet=1)
import { atlas, TABLES, LOOKS, FW, FH } from './chars.js';
const c = document.getElementById('ov'), g = c.getContext('2d'); g.imageSmoothingEnabled = false;
g.fillStyle = '#6a6258'; g.fillRect(0, 0, 1920, 1080);
const rows = [['hero','hero'],['pike','pike'],['barista','barista'],['teller','teller'],['folk','t2'],['folk','t8']];
let y = 6; const S = +(new URLSearchParams(location.search).get('s') ?? 3);
for (const [k, l] of rows) { const A = atlas(TABLES[k], LOOKS[l]); const n = A.n, perRow = Math.floor(1900 / (FW * S));
  for (let i = 0; i < n; i++) { const col = i % perRow, row = Math.floor(i / perRow); g.drawImage(A.canvas, i * FW, 0, FW, FH, 10 + col * FW * S, y + row * FH * S, FW * S, FH * S); }
  y += Math.ceil(n / perRow) * FH * S + 4; }
window.DUR = 1; window.render = () => {}; window.READY = true;
