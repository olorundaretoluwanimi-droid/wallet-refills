# Original score for "What If Your Wallet Refilled Every Morning?": 96 bpm, 4/4 (bar = 2.5 s), F major (comic chamber),
# D minor for the interrogation groove. Motif: the refill — five rising notes (one per hundred-dollar bill) on
# glockenspiel + harp + vibraphone. Instruments: pizzicato strings, bassoon / clarinet / oboe staccato, tuba, xylophone,
# glockenspiel, harp, muted trumpet; jazz bass, vibraphone and brushed snare for the interrogation room.
# Usage: <LIB>/.venv/bin/python score.py   → out/score.wav
import sys, os, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB') or os.path.expanduser('~/lemo-opuscar')
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import SR

S.seed(96)
BPM = 96; B = 60 / BPM; BAR = 4 * B
DUR = 600.0
bt = lambda bar, beat=0: (bar - 1) * BAR + beat * B
EV = []
def ev(t, inst, pitch, dur, vel, pan=0, gain=1.0, **kw):
    if 0 <= t < DUR: EV.append(dict(t=t, inst=inst, pitch=pitch, dur=dur, vel=vel, pan=pan, gain=gain, **kw))
m = S.midi
CH = {'F': ['F2', 'C3', 'F3', 'A3', 'C4'], 'C': ['C2', 'G2', 'C3', 'E3', 'G3'], 'C7': ['C2', 'G2', 'Bb2', 'E3', 'G3'], 'Dm': ['D2', 'A2', 'D3', 'F3', 'A3'],
      'Bb': ['Bb1', 'F2', 'Bb2', 'D3', 'F3'], 'Gm': ['G2', 'D3', 'G3', 'Bb3', 'D4'], 'A7': ['A1', 'E2', 'G2', 'C#3', 'E3'], 'Am': ['A2', 'E3', 'A3', 'C4', 'E4'],
      'G7': ['G2', 'D3', 'F3', 'B3', 'D4'], 'Dm7': ['D2', 'A2', 'C3', 'F3', 'A3'], 'E7': ['E2', 'B2', 'D3', 'G#3', 'B3']}
P_MAIN = ['F', 'Dm', 'Bb', 'C7']
P_GROOVE = ['Dm7', 'G7', 'Dm7', 'A7']

THEME = [(0, 'C5', .5), (.5, 'F5', .5), (1, 'A5', 1), (2, 'G5', .5), (2.5, 'F5', .5), (3, 'E5', 1), (4, 'F5', .5), (4.5, 'G5', .5), (5, 'A5', .5), (5.5, 'Bb5', .5), (6, 'C6', 2),
         (8, 'A5', .5), (8.5, 'F5', .5), (9, 'G5', 1), (10, 'E5', .5), (10.5, 'C5', .5), (11, 'D5', 1), (12, 'E5', 1), (13, 'G5', 1), (14, 'F5', 2)]
SAD = [(0, 'D3', 1), (1, 'F3', 1), (2, 'A3', 1), (3, 'G3', .5), (3.5, 'F3', .5), (4, 'E3', 2), (6, 'C#3', 2), (8, 'D3', 1), (9, 'E3', 1), (10, 'F3', 1), (11, 'E3', .5), (11.5, 'D3', .5), (12, 'A2', 4)]
GENTLE = [(0, 'A3', 1), (1, 'C4', 1), (2, 'F4', 2), (4, 'E4', 1), (5, 'D4', 1), (6, 'C4', 2), (8, 'Bb3', 1), (9, 'D4', 1), (10, 'G4', 2), (12, 'F4', 4)]

def melody(t0, inst, notes, vel=.45, pan=.1, tr=0, gain=1.0, rate=1.0):
    for b, p, d in notes:
        if p: ev(t0 + b * B / rate, inst, m(p) + tr, d * B / rate * .92, vel, pan, gain, attack=.05)
def motif(t0, vel=.5, tr=0, big=False, low=False):
    """The refill: five rising notes, one per bill."""
    ns = ['C5', 'F5', 'A5', 'C6', 'F6']
    for i, p in enumerate(ns):
        t = t0 + i * B / 2; pp = m(p) + tr - (12 if low else 0)
        ev(t, 'glockenspiel', pp, 1.8, vel, .15)
        ev(t, 'harp', pp - 12, 1.6, vel * .9, -.2)
        if big: ev(t, 'vibraphone_hard', pp - 12, 2.0, vel * .7, .3)
    if big:
        for p in CH['F']: ev(t0 + 5 * B / 2, 'violins' if m(p) >= 55 else 'cellos', m(p) + 12 + tr, BAR * 2, vel * .55, 0, attack=.3)
        ev(t0 + 5 * B / 2, 'horn', m('A3') + tr, BAR * 2, vel * .5, -.1, attack=.2); ev(t0 + 5 * B / 2, 'horn', m('F3') + tr, BAR * 2, vel * .45, .1, attack=.2)
        ev(t0 + 5 * B / 2, 'sus_cymbal', None, None, vel * .4, 0)
def pizz(t0, bars, prog, vel=.3, tr=0, gain=1.0):
    """Oom-pah in pizzicato: bass on 1 and 3, chord on 2 and 4."""
    for i in range(bars):
        c = CH[prog[i % len(prog)]]; s = t0 + i * BAR
        for k in range(4):
            if k % 2 == 0: ev(s + k * B, 'cellos_pizz', m(c[0]) + 12 * (k == 2) + tr, .4, vel * 1.1, -.2, gain)
            else:
                for p in c[2:4]: ev(s + k * B, 'violins_pizz', m(p) + 12 + tr, .3, vel * .8, .25, gain)
def oompah(t0, bars, prog, vel=.35, tr=0, sub=1):
    """Tuba + snare-less march: tuba on 1/3, spiccato chords on 2/4; sub=2 doubles the chords."""
    for i in range(bars):
        c = CH[prog[i % len(prog)]]; s = t0 + i * BAR
        for k in range(4):
            if k % 2 == 0: ev(s + k * B, 'tuba_stac', m(c[0]) + (7 if k == 2 else 0) + tr, .5, vel, -.15)
            for j in range(sub):
                if k % 2 == 1 or sub > 1:
                    tt = s + k * B + j * B / sub
                    if k % 2 == 0 and j == 0: continue
                    for p in c[2:5]: ev(tt, 'violins_spic', m(p) + tr, .2, vel * .65, .25)
def groove(t0, bars, vel=.3, vib=True, brush=True):
    """Interrogation: walking jazz bass, vibraphone stabs, soft snare on 2 and 4 (D minor)."""
    walk = {'Dm7': ['D2', 'F2', 'A2', 'C3'], 'G7': ['G2', 'B2', 'D3', 'F3'], 'A7': ['A1', 'C#2', 'E2', 'G2']}
    for i in range(bars):
        ch = P_GROOVE[i % 4]; s = t0 + i * BAR
        for k, p in enumerate(walk[ch]): ev(s + k * B, 'jazz_bass', p, B * .9, vel * (1.1 if k == 0 else .9), -.1)
        if vib:
            c = CH[ch]; ev(s + 1.5 * B, 'vibraphone', c[3], 1.2, vel * .7, .3); ev(s + 1.5 * B, 'vibraphone', c[4], 1.2, vel * .6, .3)
            if i % 2: ev(s + 3.5 * B, 'vibraphone', c[2], .8, vel * .5, .35)
        if brush:
            for k in (1, 3): ev(s + k * B, 'snare', None, None, vel * .28, .1)
def pad(t0, bars, prog, vel=.2, upper='violas', low='cellos', att=.5, tr=0):
    for i in range(bars):
        c = CH[prog[i % len(prog)]]; s = t0 + i * BAR
        if low: ev(s, low, m(c[0]) + 12 + tr, BAR * 1.03, vel, -.2, attack=att)
        if upper: ev(s, upper, m(c[3]) + tr, BAR * 1.03, vel * .8, .25, attack=att); ev(s, upper, m(c[4]) + tr, BAR * 1.03, vel * .7, .35, attack=att)
def harp(t0, bars, prog, vel=.3, step=.5, tr=0):
    for i in range(bars):
        c = [m(x) + 12 + tr for x in CH[prog[i % len(prog)]][1:]]; seq = [c[0], c[1], c[2], c[3], c[2], c[1], c[2], c[3]]
        for k in range(int(round(4 / step))): ev(t0 + i * BAR + k * step * B, 'harp', seq[k % 8], 1.3, vel * (1 if k % 4 == 0 else .8), .3)

# —— Cold open (0–26): the interrogation groove ——
groove(bt(1), 10, vel=.32)
ev(1.2, 'cellos_pizz', 'D2', .6, .6, -.2)                       # the slap
ev(8.0, 'xylophone', 'D6', .4, .3, .3); ev(8.3, 'xylophone', 'F6', .4, .3, .3); ev(8.6, 'xylophone', 'A6', .4, .32, .3)   # the piles rise
ev(24.9, 'trumpet_mute', 'A4', .4, .35, .1); ev(25.4, 'trumpet_mute', 'F4', .9, .35, .1)
# —— Title (28.0): the refill motif, tutti ——
motif(28.0, vel=.6, big=True)
harp(bt(13), 2, ['F', 'Bb'], vel=.26)
# —— Ch I, night (35–45): the bassoon, sad and comic ——
melody(bt(15), 'bassoon', SAD, vel=.42, pan=-.1)
pizz(bt(15), 4, ['Dm', 'A7', 'Dm', 'A7'], vel=.18)
# silence 1: 44.5–50 (alarm only); the first refill at 50.0
motif(50.0, vel=.55, big=True)
pad(bt(22), 6, P_MAIN, vel=.2, upper='violins')
melody(bt(23), 'clarinet', THEME, vel=.32, pan=.2)
# —— Tests (68–104): a nervous pizzicato march each night, cut one beat before each refill ——
for n in [(68, 75.0), (80, 87.5), (92, 100.0)]:
    a, g = n; nb = int((g - a - B) // BAR)
    oompah(a, nb, ['Dm', 'A7'], vel=.24)
    melody(a, 'bassoon_stac', [(0, 'D3', .5), (1, 'F3', .5), (2, 'A3', .5), (3, 'F3', .5), (4, 'E3', .5), (5, 'G3', .5), (6, 'A3', .5), (7, 'C#3', .5)] * 1, vel=.34, pan=-.1)
    motif(g, vel=.5)
    ev(g + 2.6, 'clarinet_stac', 'F5', .2, .35, .2); ev(g + 2.9, 'clarinet_stac', 'A5', .2, .35, .2); ev(g + 3.2, 'clarinet_stac', 'C6', .4, .4, .2)
# —— Street (104–118): the theme, light ——
pizz(104.0, 6, P_MAIN, vel=.24); melody(104.0, 'clarinet', THEME, vel=.36, pan=.2)
# —— Café 1 (118–146): clarinet over pizz; stops dead for "Got anything smaller?" ——
pizz(bt(48), 2, P_MAIN, vel=.22); ev(bt(48), 'oboe_stac', 'C5', .2, .3, .2)
melody(bt(48), 'oboe', [(0, 'F5', 1), (1, 'A5', 1), (2, 'C6', 2), (4, 'Bb5', 1), (5, 'G5', 1)], vel=.3, pan=.2)
# hard stop at 122.8 (below); a deadpan two-note answer after "No. And I never will."
ev(130.0, 'bassoon_stac', 'C3', .3, .4, -.1); ev(130.4, 'bassoon_stac', 'F2', .5, .45, -.1)
harp(bt(54), 6, P_MAIN, vel=.26); pad(bt(54), 6, P_MAIN, vel=.18)
melody(bt(55), 'clarinet', THEME, vel=.34, pan=.2)
ev(T_SIP := 137.5, 'glockenspiel', 'C7', 1.5, .3, .3)
# —— Ch II, spree (146–186): the march gathers speed (density), every morning the motif ——
for i, (b0, nb, sub) in enumerate([(59, 4, 1), (63, 4, 2), (67, 4, 2), (71, 3, 3), (74, 1, 3)]):
    oompah(bt(b0), nb, P_MAIN, vel=.3 + .04 * i, sub=sub)
melody(bt(59), 'trumpet_stac', THEME, vel=.4, pan=.1)
melody(bt(63), 'clarinet', THEME, vel=.38, pan=.25)
melody(bt(67), 'xylophone', THEME, vel=.34, pan=.3)
melody(bt(71), 'trumpet_stac', THEME[:10], vel=.44, pan=.1)
for a in [149.5, 151.5, 155.0, 160.0, 162.5, 165.0, 167.5, 170.0, 172.5, 175.0, 177.5, 180.0]:
    for i, p in enumerate(['C6', 'F6', 'A6']): ev(a - .9 + i * B / 3, 'glockenspiel', p, 1.0, .22, .3)
# 184–186: run out of steam
ev(184.0, 'tuba_stac', 'C2', .5, .4, -.1); ev(184.6, 'tuba_stac', 'F1', 1.0, .45, -.1)
# —— Café 2 (186–204): the same tune, one clarinet, slower ——
melody(bt(76), 'clarinet', THEME, vel=.26, pan=.15, rate=.75)
ev(bt(76), 'cellos', 'F3', BAR * 6, .14, -.2, attack=1.0)
# —— Treadmill (204–246): thin strings + tuba waddle going round and round ——
for i in range(17):
    s = bt(83) + i * BAR; c = CH[['F', 'C7'][i % 2]]
    ev(s, 'tuba_stac', c[0], .4, .32, -.1); ev(s + B, 'tuba_stac', c[1], .4, .26, -.1); ev(s + 2 * B, 'tuba_stac', c[0], .4, .3, -.1); ev(s + 3 * B, 'tuba_stac', c[1], .4, .26, -.1)
pad(bt(83), 17, ['F', 'C7'], vel=.13, upper='violas', low=None)
melody(bt(85), 'bassoon', GENTLE, vel=.16, pan=-.1, tr=-12)
motif(232.5, vel=.32, low=True)
# —— Ch III, the bank (246–310): polite horns and strings, then a quiet bed under the dialogue ——
pad(bt(99), 8, ['C', 'F', 'G7', 'C'], vel=.24, upper='violins')
melody(bt(99), 'horn', [(0, 'G3', 2), (2, 'C4', 2), (4, 'E4', 3), (7, 'D4', 1), (8, 'C4', 2), (10, 'A3', 2), (12, 'G3', 4)], vel=.4, pan=-.1)
melody(bt(103), 'horn', [(0, 'G3', 2), (2, 'C4', 2), (4, 'E4', 2), (6, 'G4', 2), (8, 'F4', 2), (10, 'D4', 2), (12, 'C4', 4)], vel=.38, pan=-.1)
pad(bt(107), 18, ['C', 'Am', 'F', 'G7'], vel=.12, upper='violas')
for i in range(18):
    if i % 2 == 0: ev(bt(107 + i), 'cellos_pizz', CH[['C', 'Am', 'F', 'G7'][i % 4]][0], .5, .2, -.2)
# —— Serials (310–330): a ticking pizz ostinato, then down to one cello note ——
for k in range(32): ev(bt(125) + k * B / 2, 'violins_pizz', 'D5' if k % 2 == 0 else 'A4', .2, .2 + .006 * k, .25)
ev(bt(125), 'cellos', 'D3', BAR * 6, .25, -.2, attack=.6)
ev(bt(129), 'cellos', 'C#3', BAR * 2.2, .3, -.2, attack=.3)
# silence 2: 330.0 hard stop (below); footsteps; at 338 the groove comes back
groove(338.0, 6, vel=.26, vib=False)
groove(353.0, 10, vel=.28)
# —— The dream (379–424): an oompah that climbs a semitone at each price jump and speeds up; dead stop at 417.5 ——
pad(379.0, 5, ['F', 'Bb'], vel=.2, upper='violins')
harp(379.0, 4, ['F', 'Bb', 'F', 'C7'], vel=.28)
motif(381.0, vel=.45)
for i in range(3): motif(381.6 + i * .7, vel=.25 + .05 * i, tr=12 * (i % 2))
PR = [391.0, 395.0, 398.5, 401.5, 404.0, 406.2, 408.2, 410.0, 411.6, 413.0, 414.2, 415.3, 416.3, 417.0]
for j in range(len(PR) - 1):
    a, b = PR[j], PR[j + 1]; tr = j; rate = 1 + j * .12
    n = max(1, int((b - a) / (B / rate)))
    c = CH[['F', 'C7'][j % 2]]
    for k in range(n):
        t = a + k * B / rate
        if k % 2 == 0: ev(t, 'tuba_stac', m(c[0]) + tr, .4, .4 + .02 * j, -.15)
        else:
            for p in c[2:5]: ev(t, 'violins_spic', m(p) + tr, .2, .3 + .02 * j, .25)
    ev(a, 'trumpet_stac', m('C5') + tr, .3, .45, .1); ev(a + B / rate / 2, 'trumpet_stac', m('F5') + tr, .3, .45, .1)
    ev(a, 'crash' if j > 9 else 'xylophone', None if j > 9 else m('F6') + tr, None if j > 9 else .5, .2 + .02 * j, .2)
# 417.5: hard stop (below)
# —— Rounding error (424–466): the groove, lighter ——
groove(424.6, 16, vel=.22, brush=False)
ev(437.2, 'trumpet_mute', 'F4', .3, .3, .1); ev(437.6, 'trumpet_mute', 'A4', .5, .3, .1)
ev(454.9, 'xylophone', 'G6', .3, .3, .3)
# —— Ch V (466–490): the bassoon tune, gently reharmonised ——
melody(bt(187, 1), 'bassoon', GENTLE, vel=.34, pan=-.1)
pad(bt(187), 9, ['F', 'Dm', 'Bb', 'C'], vel=.16, upper='violas')
harp(bt(193), 3, ['Bb', 'C', 'F'], vel=.2, step=1)
# —— Evidence room (490–524): near silence; one low pad as the clock spins; 507.5 THE refill ——
ev(497.5, 'cellos', 'F2', 9.5, .12, -.2, attack=2.0); ev(497.5, 'violas', 'C4', 9.5, .08, .2, attack=2.5)
for k in range(8): ev(498.0 + k * 1.1, 'vibraphone_bowed', 'C5' if k % 2 else 'F5', 1.4, .08 + .02 * k, .2)
motif(507.5, vel=.7, big=True)
for p in ['F3', 'A3', 'C4', 'F4']: ev(509.5, 'vibraphone_bowed', p, 5.5, .22, 0)
ev(515.5, 'glockenspiel', 'F7', 2.5, .35, .3); ev(515.5, 'harp', 'F5', 2, .3, -.2)
# "…Form." — a muted trumpet sinks
for i, p in enumerate(['A4', 'Ab4', 'G4', 'Gb4']): ev(521.6 + i * .55, 'trumpet_mute', p, .5 if i < 3 else 1.6, .4, .1)
# —— Forms (524–546): deadpan pizzicato march; a small motif each morning ——
pizz(524.0, 8, P_MAIN, vel=.22)
melody(524.0, 'bassoon_stac', [(b * 2, p, .5) for b, p in enumerate(['F3', 'A3', 'C4', 'A3', 'Bb3', 'G3', 'C4', 'C3'] * 2)], vel=.3, pan=-.1)
for a in [526.0, 528.5, 531.0, 533.5, 536.0, 538.5, 541.0]: motif(a, vel=.24)
ev(543.6, 'tuba_stac', 'C2', .4, .4, -.1); ev(544.2, 'tuba_stac', 'F1', 1.0, .42, -.1)
# —— Café 3 (546–582): the tune, full and warm ——
pizz(546.0, 4, P_MAIN, vel=.18)
ev(549.7, 'oboe_stac', 'C5', .2, .3, .2)
harp(556.0, 10, P_MAIN, vel=.26); pad(556.0, 10, P_MAIN, vel=.22, upper='violins')
melody(559.5, 'clarinet', THEME, vel=.4, pan=.2)
melody(569.5, 'violins', THEME, vel=.3, pan=.25)
melody(569.5, 'flute', THEME, vel=.22, pan=.3, tr=12)
# —— End title (582–600): the motif, the last chord ——
motif(582.0, vel=.55, big=True)
for p in ['F2', 'C3', 'F3', 'A3', 'C4', 'F4']: ev(587.0, 'violins' if m(p) >= 55 else 'cellos', p, 11.0, .26, 0, attack=1.0)
ev(587.0, 'horn', 'A3', 10.0, .26, -.1, attack=.8); ev(587.0, 'horn', 'C4', 10.0, .22, .1, attack=.8)
harp(587.0, 2, ['F', 'F'], vel=.2, step=1)
motif(593.5, vel=.28, tr=12)

# —— Render ——
mus = S.render(EV, dur=DUR, master=False)
N = int(DUR * SR); mus = mus[:N]
def hard_stop(at, until, size=.9):
    cut = int(at * SR)
    tail = np.zeros((int(2.2 * SR), 2), np.float32); tail[:int(.3 * SR)] = mus[cut - int(.3 * SR):cut]
    tail = S.room(tail, size=size, mix=.9)
    mus[cut:int(until * SR)] = 0
    L = min(len(tail) - int(.3 * SR), N - cut)
    mus[cut:cut + L] += tail[int(.3 * SR):int(.3 * SR) + L] * np.linspace(1, 0, L)[:, None]
hard_stop(26.8, 28.0)        # before the title
hard_stop(44.5, 50.0)        # silence 1: the alarm
hard_stop(122.8, 129.9, .6)  # "Got anything smaller?"
hard_stop(330.0, 338.0)      # silence 2: the button
hard_stop(417.5, 424.6)      # "just paper"
hard_stop(489.6, 497.5, .7)  # the evidence room: near silence
mus = S.room(mus, size=.5, mix=.18)
fade = int(1.4 * SR); mus[-fade:] *= np.linspace(1, 0, fade)[:, None]
mus /= max(1e-6, np.abs(mus).max()) / .9
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'score.wav'), mus.astype(np.float32), SR)
used = sorted({e['inst'] for e in EV})
open(os.path.join(HERE, 'out', 'score_instruments.txt'), 'w').write('\n'.join(used))
print('score', DUR, 's', len(EV), 'notes', used)
