# Subtitles: events.json (voice lines + text) + voices/dur.json → out/cues.json for core/render/srt.py
import os, json
HERE = os.path.dirname(os.path.abspath(__file__))
E = json.load(open(os.path.join(HERE, 'events.json'), encoding='utf-8')); D = json.load(open(os.path.join(HERE, 'voices', 'dur.json')))
cues = [{'t0': round(e['t'] - .35, 3), 't1': round(e['t'] + D[e['id']] + .7, 3), 'text': (e['who'].upper() + ': ' if e.get('dlg') else '') + e['sub']} for e in sorted((e for e in E['ev'] if e['type'] == 'voice'), key=lambda e: e['t'])]
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True); json.dump(cues, open(os.path.join(HERE, 'out', 'cues.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False); print(len(cues), 'cues')
