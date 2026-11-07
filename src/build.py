import json, subprocess, os, hashlib
here = os.path.dirname(os.path.abspath(__file__))
os.chdir(here)
d = 'src/' if os.path.exists('src/template.html') else ''
eng_hash = hashlib.md5(open(d + 'engine.js', 'rb').read()).hexdigest()
cache = d + 'solutions.json'
old = json.load(open(cache)) if os.path.exists(cache) else {}
per = old.get('levels', {})   # per-level cache: md5(level json + engine) -> [par, path]
levels = json.loads(subprocess.check_output(['node', '-e', "const {LEVELS}=require('./%slevels.js');console.log(JSON.stringify(LEVELS))" % d]))
keys = [hashlib.md5((json.dumps(l, sort_keys=True, ensure_ascii=False) + eng_hash).encode()).hexdigest() for l in levels]
todo = [i for i, k in enumerate(keys) if k not in per]
if todo:
    print('solving %d of %d levels (cached: %d)...' % (len(todo), len(levels), len(levels) - len(todo)))
    js = ("const {solve}=require('./%ssolve.js');const {LEVELS}=require('./%slevels.js');const WP=require('./%sengine.js');"
          "const idx=%s;console.log(JSON.stringify(idx.map(i=>{const d=LEVELS[i];let r=solve(d,{cap:d.solution?200000:3000000});"
          "if(!r.solved&&d.solution){const L=WP.parseLevel(d);let s=L.st0;for(const a of d.solution){const n=WP.move(L,s,a==='W'?null:a,{});if(n)s=n;}"
          "if(!WP.isWin(L,s))throw new Error('bad solution '+d.title);r={moves:0,path:d.solution};}return [r.moves||0,r.path||'']})))") % (d, d, d, json.dumps(todo))
    res = json.loads(subprocess.check_output(['node', '--max-old-space-size=4000', '-e', js]))
    for i, r in zip(todo, res): per[keys[i]] = r
sol = {'levels': per, 'par': [per[k][0] for k in keys], 'paths': [per[k][1] for k in keys]}
json.dump(sol, open(cache, 'w'))
t = open(d + 'template.html', encoding='utf-8').read()
t = t.replace('/*QR*/', open(d + 'qr.js', encoding='utf-8').read())
t = t.replace('/*ENGINE*/', open(d + 'engine.js', encoding='utf-8').read())
t = t.replace('/*LEVELS*/', open(d + 'levels.js', encoding='utf-8').read())
t = t.replace('/*PAR*/[]', json.dumps(sol['par']))
atlas = json.load(open(d + 'atlas.json'))
atlas = {k: v for k, v in atlas.items() if not k.startswith('_')}
t = t.replace('/*ATLAS*/{}', json.dumps(atlas, separators=(',', ':')))
# always write the playable game to the repo root (the folder above src/), which is what GitHub Pages serves
out = os.path.join(os.path.dirname(here) if os.path.basename(here) == 'src' else here, 'index.html')
open(out, 'w', encoding='utf-8').write(t)
print('built', len(t), 'bytes; par', sol['par'])
