# Mix: score (out/score.wav) + ambience beds per place + event foley + voices → out/mix.wav
# Reads events.json (export with: node core/render/events.mjs <project>) for voice and event times.
# Usage: <LIB>/.venv/bin/python mix.py
import sys, os, json, numpy as np, soundfile as sf
from scipy.ndimage import uniform_filter1d
from scipy.signal import resample_poly
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB') or os.path.expanduser('~/lemo-opuscar')
sys.path.insert(0, os.path.join(LIB, 'core', 'audio'))
from sfx import *

E = json.load(open(os.path.join(HERE, 'events.json')))
DUR = E['dur']; EV = E['ev']; N = int(DUR * SR); tt = np.arange(N) / SR
rng = np.random.default_rng(29)
def stereo(x, pan=0.0): l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4); return np.stack([x * l * 1.414, x * r * 1.414], 1)
def place(buf, x, t, pan=0.0, g=1.0):
    s = int(t * SR); x = stereo(x, pan) if x.ndim == 1 else x
    if s >= len(buf) or s < 0: return
    n = min(len(x), len(buf) - s); buf[s:s + n] += x[:n] * g
def rms_db(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
def full(fn): return fn(DUR)[:N]
def gate(*spans, fi=.5, fo=.5):
    g = np.zeros(N)
    for a, b in spans: g = np.maximum(g, np.clip(np.minimum((tt - a) / fi + 1, (b - tt) / fo + 1), 0, 1))
    return g

# —— Ambience beds ——
NZ = full(noise); BR = full(brown)
def babble(seed, voices=10):
    r = np.random.default_rng(seed); out = np.zeros(N)
    for v in range(voices):
        f = r.uniform(250, 700); am = (np.sin(2 * np.pi * r.uniform(3, 6) * tt + r.uniform(0, 6)) > r.uniform(-.2, .4)).astype(float)
        am = uniform_filter1d(am, int(.03 * SR)) * (np.sin(2 * np.pi * r.uniform(.05, .2) * tt + v) > -.3)
        out += bp(np.roll(NZ, int(r.integers(0, N))), f * .7, f * 2.6) * am
    return out / voices
birds = np.zeros(N)
for k in range(320):
    t0 = rng.uniform(0, DUR); f0 = rng.uniform(2600, 4300); d = rng.uniform(.06, .16); n = int(d * SR); x = np.arange(n) / SR
    ch = np.sin(2 * np.pi * np.cumsum(f0 * (1 + .35 * np.sin(2 * np.pi * rng.uniform(15, 30) * x))) / SR) * np.sin(np.pi * x / d) ** 2
    s = int(t0 * SR); birds[s:s + n] += ch[:max(0, min(n, N - s))] * rng.uniform(.2, .6)
traffic = lp(BR, 220) * .8 + bp(np.roll(NZ, 1234), 200, 1200) * .25 * (.5 + .5 * np.sin(2 * np.pi * .05 * tt) ** 2)
hvac = lp(np.roll(BR, 4321), 180) * .9 + (np.sin(2 * np.pi * 60 * tt) + .5 * np.sin(2 * np.pi * 120 * tt)) * .05
lampbuzz = (np.sin(2 * np.pi * 120 * tt) + .4 * np.sin(2 * np.pi * 240 * tt) + .2 * np.sin(2 * np.pi * 360 * tt)) * .12 * (1 + .1 * np.sin(2 * np.pi * 3 * tt))
fridgeHum = (np.sin(2 * np.pi * 50 * tt) + .5 * np.sin(2 * np.pi * 100 * tt)) * .2 + lp(np.roll(BR, 777), 120) * .3
cafeTone = lp(BR, 400) * .4 + bp(np.roll(NZ, 4242), 400, 2000) * .08
hiss = hp(np.roll(NZ, 999), 3000) * (np.sin(2 * np.pi * .04 * tt) > .75)
crowd = babble(3, 14); murmur = babble(9, 6)
fountainW = bp(np.roll(NZ, 2718), 400, 4000) * (.8 + .2 * np.sin(2 * np.pi * .4 * tt))
marbleRoom = hp(murmur, 300) * .6 + lp(np.roll(BR, 55), 200) * .4
g_int = gate((0, 27.4), fi=.3, fo=.3) + gate((352, 378.8), fi=.4, fo=.4) + gate((424, 466), fi=.6, fo=.4)
g_flatN = gate((35, 46), fi=.5, fo=1.0) + gate((68, 104), fi=.5, fo=.3)
g_flatD = gate((46, 68), fi=2, fo=.5) + gate((146, 186), fi=.5, fo=.4) + gate((220, 246), fi=.5, fo=.4) + gate((480, 490), fi=.4, fo=.4)
g_birdsF = gate((47, 68), fi=2) * .5 + sum(gate((a + .4, a + 10.5), fi=.5, fo=1) for a in (75.0, 87.5, 100.0)) * .45 + gate((146, 186)) * .4
g_street = gate((104, 118), fi=.4, fo=.4) + gate((246, 257.5), fi=.6, fo=.3) + gate((466, 480), fi=.5, fo=.4) * .8 + gate((575, 600), fi=3, fo=1) * .7
g_birds = gate((104, 118)) * .7 + gate((204, 220)) * .35 + gate((246, 257.5)) * .6 + gate((575, 600), fi=3) * .8
g_cafe = gate((118, 146), fi=.4, fo=.4) + gate((186, 204), fi=.4, fo=.4) + gate((546, 582), fi=.4, fo=2.5)
g_plaza = gate((204, 220), fi=.5, fo=.5)
g_bank = gate((257.5, 330.02), fi=.3, fo=.02) + gate((330.02, 336.0), fi=.02, fo=.4) * .25 + gate((336.0, 352), fi=.4, fo=.4)
g_market = gate((379, 417.6), fi=1.0, fo=.08) * np.clip((tt - 379) / 30, .4, 1.0)
g_evid = gate((490, 546), fi=.4, fo=.4)
amb = (stereo(hvac * g_int * 1.2, 0) + stereo(lampbuzz * g_int, .15)
       + stereo(fridgeHum * (g_flatN + g_flatD * .6) * .8, .35) + stereo(traffic * (g_flatN * .3 + g_flatD * .45), -.3)
       + stereo(traffic * g_street, -.2) + stereo(np.roll(traffic, 8001) * g_street, .2)
       + stereo(birds * (g_birds + g_birdsF), -.3) + stereo(np.roll(birds, 9001) * (g_birds + g_birdsF), .35)
       + stereo((cafeTone + hiss * .25 + murmur * .5) * g_cafe, 0)
       + stereo((fountainW * .35 + crowd * .25) * g_plaza, 0)
       + stereo(marbleRoom * g_bank, -.1) + stereo(np.roll(marbleRoom, 5000) * g_bank, .1)
       + stereo(crowd * g_market, -.3) + stereo(np.roll(crowd, 7001) * g_market, .3)
       + stereo(hvac * g_evid * .5, 0))

# —— Foley ——
fx = np.zeros((N, 2))
def tone(f, d, tau, v=1.0, h=((1, 1),)):
    x = t_(d); return norm(sum(a * np.sin(2 * np.pi * f * m * x) for m, a in h) * np.exp(-x / tau) * np.minimum(1, x / .004)) * v
def ping(v=1.0, f=1568): return tone(f, .5, .14, v, ((1, 1), (2, .25)))
def place_m(buf, x, t): s = int(t * SR); n = min(len(x), len(buf) - s); buf[s:s + n] += x[:n]
def paper(v=1.0, d=.08): x = t_(d); return norm(bp(noise(d), 900, 6000) * np.exp(-x / (d / 4)) + bp(noise(d), 200, 900) * np.exp(-x / (d / 6)) * .6) * v
def coinsfx(v=1.0, n=5):
    o = np.zeros(int(1.0 * SR))
    for i in range(n): place_m(o, tone(rng.uniform(2800, 4600), .35, .06, v * rng.uniform(.5, 1), ((1, 1), (2.7, .4))), i * rng.uniform(.04, .09))
    return o
def alarm(v=1.0):
    d = 2.0; x = t_(d); on = ((x % .5) < .12) | (((x - .18) % .5) < .12) & ((x % .5) > .18); sq = np.sign(np.sin(2 * np.pi * 2093 * x)) * on
    return norm(lp(sq, 5000) * np.minimum(1, (d - x) / .05)) * v
def shimmer(v=1.0, d=2.4, big=False):
    x = t_(d); out = np.zeros(len(x))
    for i, f in enumerate([1047, 1397, 1760, 2093, 2794, 3520]):
        out += np.sin(2 * np.pi * f * x + i) * np.exp(-x / (.5 + .12 * i)) * np.minimum(1, np.maximum(0, (x - i * .045)) / .01)
    sw = bp(noise(d), 3000, 12000) * np.exp(-x / .35) * np.minimum(1, x / .08)
    lo = np.sin(2 * np.pi * 65 * x) * np.exp(-x / 1.2) * np.minimum(1, x / .05) if big else 0
    return norm(out * .6 + sw * .5 + lo * (1.4 if big else 0)) * v
def zipper(v=1.0, d=.45):
    x = t_(d); clk = np.zeros(len(x)); pos = np.cumsum(np.full(len(x), 1.0)); clk[(np.arange(len(x)) % int(SR / 90)) == 0] = 1
    return norm(bp(np.convolve(clk, np.exp(-np.arange(60) / 8), 'same'), 2000, 8000) * np.sin(np.pi * x / d)) * v
def slide(v=1.0, d=.35): x = t_(d); return norm(lp(bp(noise(d), 200, 1800), 1200) * np.sin(np.pi * x / d) + np.concatenate([np.zeros(len(x) - int(.08 * SR)), thump(1, 90)[:int(.08 * SR)]]) * .8) * v
def seal(v=1.0): d = .25; x = t_(d); return norm(bp(noise(d), 300, 2500) * np.exp(-x / .03) + lp(noise(d), 300) * np.exp(-x / .06)) * v
def tapefx(v=1.0, d=.7): x = t_(d); return norm(bp(noise(d), 1200, 7000) * (rng.random(len(x)) > .45) * np.sin(np.pi * x / d) ** .4) * v
def bell(v=1.0): o = np.zeros(int(1.2 * SR)); place_m(o, tone(2637, 1.0, .35, v, ((1, 1), (2.4, .3))), 0); place_m(o, tone(2093, 1.0, .35, v * .8, ((1, 1), (2.4, .3))), .16); return o
def register(v=1.0): o = np.zeros(int(1.2 * SR)); place_m(o, tone(3136, 1.0, .4, v, ((1, 1), (2.1, .4), (3.3, .2))), 0); place_m(o, slide(v * .7, .25), .08); return o
def clink(v=1.0): return tone(2650, .5, .09, v, ((1, 1), (2.3, .5), (3.7, .2)))
def slurp(v=1.0, d=.6): x = t_(d); return norm(bp(noise(d), 300, 1600) * (.5 + .5 * np.sin(2 * np.pi * 18 * x)) * np.sin(np.pi * x / d)) * v
def boxdrop(v=1.0): o = np.zeros(int(.6 * SR)); place_m(o, thump(1, 75), 0); place_m(o, bp(noise(.12), 300, 2500) * np.exp(-t_(.12) / .02), 0); return norm(o) * v
def stepM(v=1.0): d = .1; x = t_(d); return norm(bp(noise(d), 1200, 7000) * np.exp(-x / .01) + np.sin(2 * np.pi * 300 * x) * np.exp(-x / .015) * .4) * v
def stepS(v=1.0): d = .09; x = t_(d); return norm(bp(noise(d), 600, 4500) * np.exp(-x / .014) + np.sin(2 * np.pi * 220 * x) * np.exp(-x / .012) * .35) * v
def steps(a, b, every, v, kind=stepS, pan=0.0):
    t = a
    while t < b: place(fx, kind(v * rng.uniform(.8, 1.1)), t + rng.uniform(-.012, .012), pan); t += every
def chalk(v=1.0, d=.5): x = t_(d); return norm(bp(noise(d), 2500, 8000) * (np.sin(2 * np.pi * 22 * x) > 0) * np.sin(np.pi * x / d)) * v
def flutter(d, v=1.0):
    o = np.zeros(int(d * SR)); t = 0.0
    while t < d - .1: place_m(o, paper(rng.uniform(.2, .6), rng.uniform(.04, .1)), t); t += rng.uniform(.01, .06)
    return norm(o) * v * np.minimum(1, np.minimum(t_(d) / .4, (d - t_(d)) / 1.5))[:len(o)]
def metal(v=1.0, d=1.2):
    x = t_(d); return norm(sum(a * np.sin(2 * np.pi * f * x) * np.exp(-x / tau) for f, a, tau in [(233, 1, .3), (411, .7, .25), (697, .5, .18), (1093, .35, .12)]) + bp(noise(d), 600, 6000) * np.exp(-x / .03) * 2) * v
def doorfx(v=1.0): o = np.zeros(int(1.4 * SR)); place_m(o, click(1.1, .8), 0); place_m(o, creak(.6)[:int(1.2 * SR)], .1); return norm(o) * v

for e in EV:
    t0, k = e['t'], e['type']
    if k == 'chime': place(fx, ping(.12, 1318), t0)
    elif k == 'tick': place(fx, coinsfx(.35, 2), t0, .45)
    elif k == 'slap': place(fx, thump(1, 85)[:int(.4 * SR)] * .7 + 0, t0, .1); place(fx, paper(.9, .1), t0, .1)
    elif k == 'riffle':
        t = t0
        while t < e['b']: place(fx, paper(rng.uniform(.25, .45), .05), t, rng.uniform(-.3, .3)); t += rng.uniform(.03, .06)
    elif k == 'walletDown': place(fx, thump(.5, 120)[:int(.3 * SR)], t0, -.1)
    elif k == 'coins': place(fx, coinsfx(.5, 6), t0, -.1)
    elif k == 'alarm': place(fx, alarm(.45), t0, -.2)
    elif k == 'refill': place(fx, shimmer(.6 if e.get('big') else .22 if e.get('small') else .45, 3.5 if e.get('big') == 2 else 2.4, bool(e.get('big'))), t0, -.1)
    elif k == 'zip': place(fx, zipper(.35), t0, -.1)
    elif k == 'drawer': place(fx, slide(.5), t0, .1)
    elif k == 'fridge': place(fx, seal(.6), t0, .3)
    elif k == 'tape': place(fx, tapefx(.4, .9), t0, .2); place(fx, tapefx(.35, .6), t0 + 1.1, .2)
    elif k == 'tapeRip': place(fx, tapefx(.55, .5), t0, .2)
    elif k == 'doorbell': place(fx, bell(.35), t0, .2)
    elif k == 'note': place(fx, paper(.4, .12), t0, .1)
    elif k == 'till': place(fx, register(.4), t0, .2)
    elif k == 'cup': place(fx, clink(.4), t0, .1)
    elif k == 'sip': place(fx, slurp(.3), t0, 0)
    elif k == 'thump': place(fx, boxdrop(.7), t0 + .3, rng.uniform(-.4, .4))
    elif k == 'kayak': place(fx, tone(150, .9, .2, 1, ((1, 1), (2.07, .6), (3.3, .3))) * .8, t0 + .3, 0); place(fx, boxdrop(.6), t0 + .3, 0)
    elif k == 'door': place(fx, doorfx(.5), t0, -.3)
    elif k == 'bag': place(fx, thump(1, 70)[:int(.4 * SR)] * .8, t0, -.1); place(fx, bp(noise(.25), 300, 3000) * np.exp(-t_(.25) / .05) * .5, t0, -.1)
    elif k == 'noteSlap': place(fx, paper(.6, .09), t0, rng.uniform(-.2, .2))
    elif k == 'click': place(fx, click(1.5, .45), t0, .2)
    elif k == 'bankDoor': place(fx, doorfx(.7), t0, -.6)
    elif k == 'step': place(fx, stepM(.4), t0, -.4 + .05 * ((t0 - 337) / .68))
    elif k == 'refillCrowd':
        for i in range(36): place(fx, shimmer(.12, 1.6), t0 + (i * 7 % 36) * .09, rng.uniform(-.8, .8))
    elif k == 'chalk': place(fx, chalk(.35), t0, .2); place(fx, register(.3 + .02 * e['i']), t0 + .45, -.2)
    elif k == 'paper': place(fx, flutter(6.0, .5), t0, 0); place(fx, np.roll(flutter(6.0, .4), 999), t0 + .2, .5)
    elif k == 'lockerShut': place(fx, metal(.5, .9), t0, .1)
    elif k == 'lock': place(fx, clack(1.6, .5), t0, .1)
    elif k == 'switch': place(fx, click(1.2, .6), t0, -.4)
    elif k == 'lockerOpen': place(fx, metal(.35, 1.0), t0, .1); place(fx, creak(.4), t0 + .05, .1); place(fx, shimmer(.35, 2.4), t0 + .1, 0)
    elif k == 'paperForm': place(fx, paper(.4, .2), t0, .2)
    elif k == 'stamp': place(fx, thump(.6, 140)[:int(.25 * SR)], t0, .2); place(fx, paper(.3, .06), t0, .2)
# footsteps
steps(104.4, 117.6, .27, .28); steps(118.6, 121.0, .3, .22, pan=.2); steps(547.0, 549.6, .3, .22, pan=.2)
steps(247.0, 256.6, .3, .26, pan=-.2); steps(258.2, 265.4, .3, .3, stepM, -.3); steps(466.4, 479.6, .38, .22)
for a, b in [(68 + 1.0, 68 + 2.1), (81.0, 82.1), (93.0, 94.1)]: steps(a, b, .3, .18, stepS, .1)
steps(490.2, 491.6, .34, .3, stepM, -.3); steps(495.2, 497.0, .34, .3, stepM, -.5); steps(511.0, 515.0, .34, .3, stepM, -.4)
# the evidence room's wall clock: a tick a second, a ratchet while the night races by, nothing after 6:00
t = 490.0
while t < 507.5:
    place(fx, click(2.2, .1 if t < 498 else .14), t, .4); t += 1.0 if t < 498 else max(.05, .5 - (t - 498) * .06)
# a heartbeat in the silence before the agent opens the locker
place(fx, heartbeat(.35), 517.0)

# —— Voices ——
VT = {e['id']: e['t'] for e in EV if e['type'] == 'voice'}
DLG = {e['id'] for e in EV if e['type'] == 'voice' and e.get('dlg')}
Dd = json.load(open(os.path.join(HERE, 'voices', 'dur.json')))
vo = np.zeros((N, 2)); vmask = np.zeros(N)
for k, t0 in VT.items():
    y, sr = sf.read(os.path.join(HERE, 'voices', k + '.wav'))
    if y.ndim > 1: y = y.mean(1)
    if sr != SR: y = resample_poly(y, SR, sr)
    y = compress(norm(y, .9), thr=.25, ratio=3.2)
    act = np.abs(y) > .02 * np.abs(y).max(); y = y * (10 ** (-20 / 20)) / (np.sqrt(np.mean(y[act] ** 2)) + 1e-9)
    if k in DLG: y = lp(y, 7000) * 1.05
    pan = -.12 if k.startswith('y') else .12 if k[0] in 'ptb' else 0
    place(vo, y, t0, pan); s = int(t0 * SR); vmask[s:s + len(y)] = 1

# —— Music ——
m, sr = sf.read(os.path.join(HERE, 'out', 'score.wav'), always_2d=True)
mus = np.zeros((N, 2)); n = min(len(m), N); mus[:n] = m[:n]
duck = uniform_filter1d(vmask, int(.35 * SR)); mus *= (1 - .2 * np.clip(duck * 1.6, 0, 1))[:, None]

def lvl(x, db): sel = np.abs(x).sum(1) > 1e-4; r = np.sqrt(np.mean(x[sel] ** 2)) if sel.any() else 1; return x * (10 ** (db / 20)) / (r + 1e-9)
voS = lvl(vo, -17); musS = lvl(mus, -21); ambS = lvl(amb, -31); fxS = lvl(fx, -27)
keys = [(0, 1.0)]
for k, t0 in sorted(VT.items(), key=lambda kv: kv[1]):
    a, b = int(t0 * SR), int((t0 + Dd[k]) * SR); need = rms_db(voS[a:b]) - 10 - rms_db((musS + ambS + fxS)[a:b]) - 1.5; g = min(1.0, 10 ** (need / 20))
    keys += [(t0 - .35, 1.0), (t0 - .05, g), (t0 + Dd[k] + .1, g), (t0 + Dd[k] + .6, 1.0)]
keys.sort(); gk = np.array(keys); bedG = np.interp(tt, gk[:, 0], gk[:, 1])
musS *= bedG[:, None]; ambS *= (.2 + .8 * bedG)[:, None]; fxS *= (.45 + .55 * bedG)[:, None]
mix = voS + musS + ambS + fxS
pk = np.abs(mix).max(); mix = np.tanh(mix / max(pk, 1e-6) * 1.2) * .9
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR, subtype='FLOAT')
print('wrote out/mix.wav', DUR, 's | vo', round(rms_db(voS), 1), 'mus', round(rms_db(musS), 1), 'amb', round(rms_db(ambS), 1), 'fx', round(rms_db(fxS), 1))
low = []
for k, t0 in sorted(VT.items(), key=lambda kv: kv[1]):
    a, b = int(t0 * SR), int((t0 + Dd[k]) * SR); gap = rms_db(voS[a:b]) - rms_db((musS + ambS + fxS)[a:b])
    if gap < 7: low.append(f'{k}@{t0:.1f}:{gap:.1f}dB')
print('voice over bed below 7 dB:', low or 'none')
