// Scripted-solution helper for big levels.  node: const P = require('./plan.js'); const r = P.run(def, r => { r.shove('DOOR','R',2); ... });
const WP = require('./engine.js');
const DIRV = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };
class Run {
  clone() { const c = Object.create(Run.prototype); c.def = this.def; c.L = this.L; c.st = this.st; c.path = this.path; return c; }
  constructor(def) { this.def = def; this.L = WP.parseLevel(def); this.st = this.L.st0; this.path = ''; }
  get R() { return WP.rulesOf(this.L, this.st); }
  you() { const R = this.R; return this.st.objs.filter(o => R.isYou(o)); }
  step(a) { const ns = WP.move(this.L, this.st, a === 'W' ? null : a, {}); if (!ns) throw new Error('blocked move ' + a + ' at ' + this.path.length + ' (' + this.path.slice(-12) + ')'); this.st = ns; this.path += a; return ns; }
  mv(s) { for (const a of s) this.step(a); return this; }
  find(sel) { // sel: [x,y] | 'WORD' | {t:'*WORD', nth}
    const T = this.L.w; let list = this.st.objs;
    if (sel && typeof sel === 'object' && sel.id != null) { const o = list.find(p => p.id === sel.id); if (!o) throw new Error('no id ' + sel.id); return o; }
    if (Array.isArray(sel)) return list.find(o => o.x === sel[0] && o.y === sel[1] && !WP.isText(o.t) === !(sel[2] === 'w') ) || list.find(o => o.x === sel[0] && o.y === sel[1]);
    const nth = (typeof sel === 'object') ? sel.nth || 0 : 0; const name = typeof sel === 'object' ? sel.t : sel;
    const c = list.filter(o => name.startsWith('obj:') ? o.t === name.slice(4) : o.t === '*' + name).sort((a, b) => a.y - b.y || a.x - b.x);
    if (!c[nth]) throw new Error('no ' + name + '#' + nth); return c[nth];
  }
  walk(tx, ty) { // BFS for you[0], never pushing/changing anything else
    const L = this.L, you0 = this.you()[0]; if (!you0) throw new Error('no you');
    if (you0.x === tx && you0.y === ty) return this;
    const sigOf = st => st.objs.filter(o => !(o.id === you0.id)).map(o => o.id + ':' + o.x + ',' + o.y).sort().join('|');
    const base = sigOf(this.st); const seen = new Set([you0.x + ',' + you0.y]); let fr = [[this.st, '']];
    while (fr.length) { const nx = [];
      for (const [st, p] of fr) for (const a of 'UDLR') {
        const ns = WP.move(L, st, a, {}); if (!ns) continue; if (sigOf(ns) !== base) continue;
        const y = ns.objs.find(o => o.id === you0.id); if (!y) continue; const k = y.x + ',' + y.y; if (seen.has(k)) continue; seen.add(k);
        if (y.x === tx && y.y === ty) { for (const c of p + a) this.step(c); return this; }
        nx.push([ns, p + a]); }
      fr = nx; }
    throw new Error('cannot walk to ' + tx + ',' + ty + ' from ' + you0.x + ',' + you0.y);
  }
  shove(sel, dir, n) { // push an object n cells in dir, you end up right behind it
    const o = this.find(sel), [dx, dy] = DIRV[dir]; const id = o.id; const sx = o.x - dx, sy = o.y - dy;
    this.walk(sx, sy);
    for (let i = 0; i < n; i++) { this.step(dir); }
    const o2 = this.st.objs.find(p => p.id === id); if (!o2 || o2.x !== o.x + dx * n || o2.y !== o.y + dy * n) throw new Error('shove did not land: ' + JSON.stringify(sel) + ' ' + dir + n + ' now ' + (o2 && o2.x + ',' + o2.y));
    return this;
  }
  place(sel, tx, ty) { // move one object to (tx,ty): BFS over (you, object) with everything else untouched
    const L = this.L, you0 = this.you()[0]; const o0 = this.find(sel); const id = o0.id;
    if (o0.x === tx && o0.y === ty) return this;
    if (this.st.objs.some(o => o.id !== id && o.x === tx && o.y === ty && (WP.isText(o.t) || o.id === you0.id))) throw new Error('target occupied');
    const sigOf = st => st.objs.filter(o => o.id !== you0.id && o.id !== id).map(o => o.id + ':' + o.x + ',' + o.y).sort().join('|');
    const base = sigOf(this.st); const K = st => { const y = st.objs.find(o => o.id === you0.id), o = st.objs.find(o => o.id === id); return y.x + ',' + y.y + ',' + o.x + ',' + o.y; };
    const seen = new Set([K(this.st)]); let fr = [[this.st, '']];
    while (fr.length) { const nx = []; if (seen.size > (this.cap || 6000)) break;
      for (const [st, p] of fr) for (const a of 'UDLR') {
        const ns = WP.move(L, st, a, {}); if (!ns) continue; if (sigOf(ns) !== base) continue;
        const y = ns.objs.find(o => o.id === you0.id), o = ns.objs.find(o => o.id === id); if (!y || !o) continue;
        const k = K(ns); if (seen.has(k)) continue; seen.add(k);
        if (o.x === tx && o.y === ty) { for (const c of p + a) this.step(c); return this; }
        nx.push([ns, p + a]); }
      fr = nx; }
    throw new Error('cannot place ' + JSON.stringify(sel) + ' at ' + tx + ',' + ty);
  }
  ids(word) { return this.st.objs.filter(o => o.t === '*' + word).sort((a, b) => a.y - b.y || a.x - b.x).map(o => ({ id: o.id })); }
  sents() { return this.R.sentences.map(s => s.text); }
  won() { return WP.isWin(this.L, this.st); }
}
function replay(def, path) { const r = new Run(def); for (const a of path) r.step(a); return r; }
module.exports = { Run, replay, WP };
Run.prototype.dump = function () { const L = this.L; const g = []; for (let y = 0; y < L.h; y++) { g.push([]); for (let x = 0; x < L.w; x++) g[y].push(L.frame[y * L.w + x] ? '#' : '.'); }
  this.st.objs.forEach(o => { g[o.y][o.x] = WP.isText(o.t) ? o.t[1] : (o.t === 'BOY' ? '@' : o.t[0].toLowerCase()); }); return g.map(r => r.join('')).join('\n'); };
