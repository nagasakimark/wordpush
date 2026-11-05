import json, subprocess
par = [8,20,17,16,19,18,19,18,24,22,11,22,10,25,21,19,28,23,20,25]
t = open('src/template.html', encoding='utf-8').read()
t = t.replace('/*ENGINE*/', open('src/engine.js', encoding='utf-8').read())
t = t.replace('/*LEVELS*/', open('src/levels.js', encoding='utf-8').read())
t = t.replace('/*PAR*/[]', json.dumps(par))
open('index.html', 'w', encoding='utf-8').write(t)
print('built', len(t), 'bytes')
