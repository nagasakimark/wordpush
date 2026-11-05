import json, subprocess, os
here = os.path.dirname(os.path.abspath(__file__))
os.chdir(os.path.dirname(here) if os.path.basename(here) == 'src' else here)
d = 'src/' if os.path.exists('src/template.html') else ''
par = json.loads(subprocess.check_output(['node', '--max-old-space-size=4000', '-e',
  "const {solve}=require('./%ssolve.js');const L=require('./%slevels.js');console.log(JSON.stringify(L.map(d=>solve(d).moves)))" % (d, d)]))
t = open(d + 'template.html', encoding='utf-8').read()
t = t.replace('/*ENGINE*/', open(d + 'engine.js', encoding='utf-8').read())
t = t.replace('/*LEVELS*/', open(d + 'levels.js', encoding='utf-8').read())
t = t.replace('/*PAR*/[]', json.dumps(par))
open('index.html' if not d else 'index.html', 'w', encoding='utf-8').write(t)
print('built', len(t), 'bytes; par', par)
