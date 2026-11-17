// Timeline (seconds): the single source of truth for shots, events, voice, chapter cards and the day counter.
// 96 bpm, 4/4: one bar = 2.5 s; the downbeat of bar n is at (n-1)*2.5.
export const BPM = 96, BAR = 240 / BPM;
export const bar = n => (n - 1) * BAR;
export const DUR = 600;
export const SHOTS = [
  { id: 'intA', a: 0, b: 6 },          // interrogation: the notes slap down
  { id: 'notes', a: 6, b: 12 },        // insert: five notes, serial numbers
  { id: 'intB', a: 12, b: 27.5 },      // two-shot: "start with the printer"
  { id: 'title', a: 27.5, b: 35 },     // the town, very high
  { id: 'night', a: 35, b: 45 },       // the flat at night: empty wallet
  { id: 'dawn', a: 45, b: 68 },        // 6:00, the first refill
  { id: 'tests', a: 68, b: 104 },      // three nights, three hiding places
  { id: 'street', a: 104, b: 118 },    // walk to the café
  { id: 'cafe1', a: 118, b: 146 },     // "Got anything smaller?"
  { id: 'spree', a: 146, b: 186 },     // the flat fills up
  { id: 'cafe2', a: 186, b: 204 },     // same coffee, no smile
  { id: 'plan', a: 204, b: 220 },      // top-down: the treadmill around the fountain
  { id: 'kayak', a: 220, b: 246 },     // cash in shoe boxes, then the kayak
  { id: 'bankwide', a: 246, b: 257.5 }, // crane down to the bank door
  { id: 'bankIn', a: 257.5, b: 266 },  // inside: walk to the counter
  { id: 'counter', a: 266, b: 310 },   // teller: the report, structuring
  { id: 'serials', a: 310, b: 330 },   // insert: the same five numbers
  { id: 'button', a: 330, b: 352 },    // silent alarm; the agent arrives
  { id: 'int2', a: 352, b: 379 },      // "Where's the printer?"
  { id: 'dream', a: 379, b: 424 },     // every wallet refills: prices climb
  { id: 'int3', a: 424, b: 466 },      // rounding error, taxes, evidence
  { id: 'home', a: 466, b: 490 },      // dusk: home without the wallet
  { id: 'evidence', a: 490, b: 524 },  // locker 46 glows at 6:00
  { id: 'forms', a: 524, b: 546 },     // three years of forms
  { id: 'cafe3', a: 546, b: 582 },     // small change
  { id: 'endWide', a: 582, b: 600 },   // end title over the town
];
export const T = {
  slap: 1.2, slap2: 6.6, walletDown: 22.6,
  titleIn: 28.0, titleOut: 34.4,
  dump: 40.0, alarm: 46.0, glow1: 50.0, open1: 54.0,
  nights: [
    { a: 68, hide: 69.0, sleep: 71.5, glow: 75.0, open: 76.2, where: 'drawer' },
    { a: 80, hide: 81.0, sleep: 83.5, glow: 87.5, open: 88.0, where: 'freezer' },
    { a: 92, hide: 93.0, sleep: 95.5, glow: 100.0, open: 100.2, where: 'tape' },
  ],
  cafeDoor1: 118.6, pay1: 121.6, cup1: 134.0, sip1: 137.5,
  spree: [149.5, 151.5, 155.0, 160.0, 162.5, 165.0, 167.5, 170.0, 172.5, 175.0, 177.5, 180.0],   // a delivery lands
  cafeDoor2: 186.5, sip2: 201.0,
  kayakGlow: 232.5,
  bankEnter: 251.0, bagDrop: 266.8,
  count: [311.0, 313.0, 315.0, 317.0, 318.4, 319.6, 320.8, 322.0, 323.0, 324.0, 325.0, 326.0],   // notes laid down
  silence: 330.0, button: 331.5, door: 336.0, steps: [337.0, 345.0],
  walletOpen: 361.0,
  glowAll: 381.0,
  prices: [391.0, 395.0, 398.5, 401.5, 404.0, 406.2, 408.2, 410.0, 411.6, 413.0, 414.2, 415.3, 416.3, 417.0],
  paper: 417.5, dreamOut: 423.4,
  locker: 492.0, lock: 494.5, lightsOff: 497.0, sixAM: 507.5, pikeIn: 511.0, lockerOpen: 515.5,
  formGlows: [526.0, 528.5, 531.0, 533.5, 536.0, 538.5, 541.0],
  cafeDoor3: 547.0, coins: 555.4, sip3: 559.5,
  endTitle: 582.0,
};
// bread prices in the dream (one per jump)
export const PRICES = ['$3', '$4', '$7', '$12', '$30', '$90', '$400', '$2,000', '$15,000', '$90,000', '$1M', '$40M', '$2B', '$200B'];
// Chapter cards (overlay)
export const CHAPTERS = [
  { t: 35.2, n: 'I', name: 'Day One' },
  { t: 146.2, n: 'II', name: 'The Treadmill' },
  { t: 246.2, n: 'III', name: 'The Bank' },
  { t: 352.2, n: 'IV', name: 'The Printer' },
  { t: 466.2, n: 'V', name: 'Lost and Found' },
];
// Voice: t = start; dur from voices/dur.json. dlg = dialogue box (who = name plate). sub = on-screen text.
const P = 'Agent Pike', Y = 'You', B = 'Barista', TL = 'Teller';
export const VO = [
  { id: 'p01', t: 1.6, dlg: true, who: P, sub: 'Five bills. All hundreds.' },
  { id: 'p02', t: 6.2, dlg: true, who: P, sub: 'Same five serial numbers. Forty-six of each.' },
  { id: 'y01', t: 12.0, dlg: true, who: Y, sub: 'I can explain.' },
  { id: 'p03', t: 15.4, dlg: true, who: P, sub: 'Great. Start with the printer.' },
  { id: 'y02', t: 20.2, dlg: true, who: Y, sub: 'There’s no printer. There’s a wallet.' },
  { id: 'n01', t: 24.9, sub: 'To be fair, it was a very good wallet.' },
  { id: 'n02', t: 37.4, sub: 'This is you. Thirty-one, rent due on Friday, and three dollars short of everything.' },
  { id: 'n03', t: 51.0, sub: 'This is your wallet, the next morning.' },
  { id: 'y03', t: 55.0, dlg: true, who: Y, sub: 'Wait. What?' },
  { id: 'n04', t: 58.2, sub: 'Five hundred dollars. In hundreds. You have never even held a hundred.' },
  { id: 'y04', t: 63.8, dlg: true, who: Y, sub: 'Okay. Okay. Nobody panic.' },
  { id: 'n05', t: 68.6, sub: 'So you test it, like a scientist. A nervous scientist.' },
  { id: 'n06', t: 76.6, sub: 'Sock drawer. Full.' },
  { id: 'n07', t: 88.6, sub: 'Freezer. Full, and cold.' },
  { id: 'n08', t: 100.8, sub: 'Taped shut. Full, and sticky.' },
  { id: 'n09', t: 104.6, sub: 'Five hundred a day is three thousand five hundred a week.' },
  { id: 'n10', t: 109.0, sub: 'A hundred and eighty-two thousand, five hundred a year. Tax-free, as far as you know.' },
  { id: 'b01', t: 123.0, dlg: true, who: B, sub: 'Got anything smaller?' },
  { id: 'y05', t: 127.0, dlg: true, who: Y, sub: 'No. And I never will.' },
  { id: 'n11', t: 131.0, sub: 'That one, at least, was true.' },
  { id: 'n12', t: 149.0, sub: 'Day two, the good headphones. Day three, the good chair.' },
  { id: 'n13', t: 153.4, sub: 'Day five, a kayak. You live on the fourth floor.' },
  { id: 'n14', t: 158.0, sub: 'And every morning, five hundred more.' },
  { id: 'y06', t: 188.5, dlg: true, who: Y, sub: 'This coffee used to taste like a holiday.' },
  { id: 'b02', t: 193.6, dlg: true, who: B, sub: 'It’s the same coffee.' },
  { id: 'y07', t: 197.6, dlg: true, who: Y, sub: 'I know. That’s the problem.' },
  { id: 'n15', t: 205.0, sub: 'In 1978, psychologists asked lottery winners how happy they were.' },
  { id: 'n16', t: 210.8, sub: 'They turned out no happier than people who hadn’t won.' },
  { id: 'n17', t: 214.6, sub: 'It’s called hedonic adaptation. The amazing becomes normal. Fast.' },
  { id: 'n18', t: 222.0, sub: 'By day forty, you have a new problem. You can’t spend it fast enough.' },
  { id: 'n19', t: 226.6, sub: 'Hundreds pile up in shoe boxes. Then in the kayak.' },
  { id: 'y08', t: 236.0, dlg: true, who: Y, sub: 'I need a bank.' },
  { id: 'n20', t: 239.6, sub: 'Oh, you do. And you really, really don’t.' },
  { id: 't01', t: 266.5, dlg: true, who: TL, sub: 'Good morning. Depositing?' },
  { id: 'y09', t: 270.7, dlg: true, who: Y, sub: 'Twenty-three thousand dollars. In cash. Normal amount.' },
  { id: 't02', t: 276.7, dlg: true, who: TL, sub: 'Over ten thousand in cash, I file a report with the government. It’s routine.' },
  { id: 'y10', t: 284.5, dlg: true, who: Y, sub: 'Then do nine thousand nine hundred today, and the rest tomorrow?' },
  { id: 't03', t: 291.1, dlg: true, who: TL, sub: 'Splitting deposits to dodge the report is called structuring. That’s a crime.' },
  { id: 'y11', t: 298.8, dlg: true, who: Y, sub: 'Even if the money’s real?' },
  { id: 't04', t: 302.8, dlg: true, who: TL, sub: 'Even if the money’s real.' },
  { id: 'n21', t: 306.9, sub: 'True, by the way. And it wasn’t even your biggest problem.' },
  { id: 'n22', t: 311.2, sub: 'Every banknote has its own serial number. One number, one note.' },
  { id: 'n23', t: 316.4, sub: 'Yours had the same five numbers. Forty-six times each.' },
  { id: 'n24', t: 338.0, sub: 'Fake money in America is a job for the Secret Service. It’s what they were founded for, in 1865.' },
  { id: 'p04', t: 346.4, dlg: true, who: P, sub: 'Sir. Bring the bag.' },
  { id: 'p05', t: 355.0, dlg: true, who: P, sub: 'Where’s the printer?' },
  { id: 'y12', t: 359.2, dlg: true, who: Y, sub: 'It’s a wallet.' },
  { id: 'p06', t: 362.5, dlg: true, who: P, sub: 'This is empty.' },
  { id: 'y13', t: 366.2, dlg: true, who: Y, sub: 'It refills in the morning.' },
  { id: 'p07', t: 370.3, dlg: true, who: P, sub: 'Of course it does.' },
  { id: 'n25', t: 374.4, sub: 'Here’s what Agent Pike was really worried about. Not you. Everyone.' },
  { id: 'n26', t: 380.4, sub: 'If one wallet refills, you’re rich. If every wallet refills, nobody is.' },
  { id: 'n27', t: 386.4, sub: 'Everyone has more money, but there’s the same amount of bread.' },
  { id: 'n28', t: 390.6, sub: 'So bread goes up. Then up again.' },
  { id: 'n29', t: 399.6, sub: 'In Germany in 1923, a loaf of bread cost 200 billion marks.' },
  { id: 'n30', t: 405.6, sub: 'In Zimbabwe in 2008, prices doubled about once a day.' },
  { id: 'n31', t: 412.8, sub: 'Money works because there isn’t much of it. Make it endless, and it’s just paper.' },
  { id: 'y14', t: 425.0, dlg: true, who: Y, sub: 'So I’m a threat to the economy?' },
  { id: 'p08', t: 429.4, dlg: true, who: P, sub: 'You? America has over twenty trillion dollars. You’re a rounding error.' },
  { id: 'y15', t: 437.0, dlg: true, who: Y, sub: 'Oh. That’s good.' },
  { id: 'p09', t: 440.4, dlg: true, who: P, sub: 'You’re a threat to my paperwork.' },
  { id: 'n32', t: 445.4, sub: 'Also, found money counts as income. A court ruled on it in 1969, about a couple who found cash inside an old piano.' },
  { id: 'y16', t: 454.8, dlg: true, who: Y, sub: 'A piano?' },
  { id: 'p10', t: 457.9, dlg: true, who: P, sub: 'The wallet stays here. Evidence.' },
  { id: 'y17', t: 462.9, dlg: true, who: Y, sub: 'That’s fair.' },
  { id: 'n33', t: 469.0, sub: 'Day eighty-one. No wallet. One kayak. One tax bill.' },
  { id: 'n34', t: 491.0, sub: 'That night, the wallet slept in locker forty-six.' },
  { id: 'p11', t: 520.6, dlg: true, who: P, sub: '…Form.' },
  { id: 'n35', t: 525.0, sub: 'Agent Pike logged five hundred dollars every morning for the next three years. He never spent a cent of it.' },
  { id: 'n36', t: 532.6, sub: 'People said he was the most honest man in the building. Also the most tired.' },
  { id: 'b03', t: 550.0, dlg: true, who: B, sub: 'Got anything smaller?' },
  { id: 'y18', t: 554.2, dlg: true, who: Y, sub: 'Actually, yes.' },
  { id: 'n37', t: 562.0, sub: 'The coffee tasted like a holiday again. It was never the coffee. It was the running out.' },
];
// The day counter chip (top right): who, day and total; `at` = moment it ticks up from (d0, s0) to (d1, s1)
export const CHIPS = [
  { a: 37.0, b: 44.4, d0: 0, s0: 0 },
  { a: 47.0, b: 67.4, d0: 0, s0: 0, at: 50.0, d1: 1, s1: 500 },
  { a: 72.0, b: 103.4, steps: [[75.0, 2, 1000], [87.5, 3, 1500], [100.0, 4, 2000]], d0: 1, s0: 500 },
  { a: 147.0, b: 185.4, d0: 4, s0: 2000, run: [146.9, 182.4, 19, 9500] },
  { a: 187.0, b: 203.4, d0: 20, s0: 10000 },
  { a: 221.0, b: 245.4, d0: 40, s0: 20000, at: T.kayakGlow, d1: 41, s1: 20500 },
  { a: 247.0, b: 265.4, d0: 80, s0: 40000 },
  { a: 524.6, b: 545.9, who: 'PIKE', d0: 1, s0: 500, run: [524.5, 542.4, 1095, 547500] },
];
export function chipState(c, t) {
  let d = c.d0, s = c.s0;
  if (c.at != null && t >= c.at) { d = c.d1; s = c.s1; }
  if (c.steps) for (const [a, dd, sv] of c.steps) if (t >= a) { d = dd; s = sv; }
  if (c.run) { const [a, b, d1, s1] = c.run, k = Math.max(0, Math.min(1, (t - a) / (b - a))), e = k * k; if (t >= a) { d = Math.round(c.d0 + (d1 - c.d0) * e); s = Math.round((c.s0 + (s1 - c.s0) * e) / 500) * 500; } }
  return { d, s };
}
export const shotAt = t => SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
