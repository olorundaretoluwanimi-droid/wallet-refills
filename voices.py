# Voices: Kokoro (offline) for every line, except the lines whose voice is a Microsoft neural voice ("en-US-…Neural"),
# which go through edge-tts (online). Both write voices/<id>.wav; the durations are merged into voices/dur.json.
# Usage: <LIB>/.venv/bin/python voices.py
import os, sys, json, subprocess, tempfile
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB') or os.path.expanduser('~/lemo-opuscar')
PY = sys.executable
L = json.load(open(os.path.join(HERE, 'lines.json'), encoding='utf-8'))
out = os.path.join(HERE, 'voices'); os.makedirs(out, exist_ok=True)
dur = {}
for kind, tool in (('kokoro', 'tts.py'), ('edge', 'tts_zh.py')):
    sub = [l for l in L if (l['voice'].endswith('Neural')) == (kind == 'edge')]
    if not sub: continue
    tmp = tempfile.mkdtemp(); lj = os.path.join(tmp, 'lines.json'); json.dump(sub, open(lj, 'w', encoding='utf-8'), ensure_ascii=False)
    od = os.path.join(out, '_' + kind)   # keeps each tool's cache between runs
    subprocess.run([PY, os.path.join(LIB, 'core', 'tts', tool), lj, od], check=True)
    d = json.load(open(os.path.join(od, 'dur.json')))
    for l in sub:
        os.replace(os.path.join(od, l['id'] + '.wav'), os.path.join(out, l['id'] + '.wav')) if os.path.exists(os.path.join(od, l['id'] + '.wav')) else None
        dur[l['id']] = d[l['id']]
json.dump({l['id']: dur[l['id']] for l in L}, open(os.path.join(out, 'dur.json'), 'w'), indent=1)
print('voices', len(dur))
