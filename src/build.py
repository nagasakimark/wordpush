import json, subprocess, os, hashlib
here = os.path.dirname(os.path.abspath(__file__))
os.chdir(here)
d = 'src/' if os.path.exists('src/template.html') else ''
src_hash = hashlib.md5((open(d + 'levels.js', 'rb').read() + open(d + 'engine.js', 'rb').read())).hexdigest()
cache = d + 'solutions.json'
sol = json.load(open(cache)) if os.path.exists(cache) else {}
if sol.get('hash') != src_hash:
    print('solving all levels (takes a few minutes)...')
    res = json.loads(subprocess.check_output(['node', '--max-old-space-size=4000', '-e',
      "const {solve}=require('./%ssolve.js');const {LEVELS}=require('./%slevels.js');console.log(JSON.stringify(LEVELS.map(d=>{let r=solve(d,{cap:d.solution?200000:3000000});if(!r.solved&&d.solution){const WP=require('./%sengine.js');const L=WP.parseLevel(d);let s=L.st0;for(const a of d.solution){const n=WP.move(L,s,a==='W'?null:a,{});if(n)s=n;}if(!WP.isWin(L,s))throw new Error('bad solution '+d.title);r={moves:d.solution.length,path:d.solution};}return [r.moves||0,r.path||'']})))" % (d, d, d)]))
    sol = {'hash': src_hash, 'par': [r[0] for r in res], 'paths': [r[1] for r in res]}
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
