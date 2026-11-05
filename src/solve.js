// BFS solver: proves each level is beatable and reports which rule-sets win.
const WP = require('./engine.js');
const LEVELS = require('./levels.js');
const fs = require('fs');

const DIRS = [[0, -1, 'U'], [0, 1, 'D'], [-1, 0, 'L'], [1, 0, 'R']];
const CAP = Number(process.env.CAP || 3000000);

function canonKey(L, st, wordIdx) {
  // identical words are interchangeable
  const arr = [];
  for (let i = 0; i < L.words.length; i++) arr.push(wordIdx[i] * 256 + st.p[2 * i + 1] * L.w + st.p[2 * i]);
  arr.sort((a, b) => a - b);
  return st.hy * L.w + st.hx + '|' + arr.join(',');
}

function relevantSig(L, st) {
  const R = WP.rulesOf(L, st);
  const out = [];
  R.abil.forEach(v => out.push('can:' + v));
  if (R.door) out.push('DOOR:OPEN');
  if (R.river) out.push('RIVER:COLD');
  if (R.mountain) out.push('MOUNTAIN:LOW');
  if (R.wall) out.push('WALL:LOW');
  R.wants.forEach(w => out.push('want:' + w));
  return out.sort();
}

function solve(def) {
  const L = WP.parseLevel(def);
  const names = [...new Set(L.words)];
  const wordIdx = L.words.map(w => names.indexOf(w));
  const start = L.st0;
  const seen = new Map(); // key -> {prev, mv}
  const k0 = canonKey(L, start, wordIdx);
  seen.set(k0, null);
  let frontier = [{ st: start, key: k0 }];
  let depth = 0, best = null, capped = false;
  const sigs = new Map(); // sig string -> {depth, path}
  const pathOf = (key) => { const m = []; let k = key; while (seen.get(k)) { const e = seen.get(k); m.push(e.mv); k = e.prev; } return m.reverse().join(''); };
  while (frontier.length && !capped) {
    depth++;
    const next = [];
    for (const { st, key } of frontier) {
      for (const [dx, dy, ch] of DIRS) {
        const ns = WP.move(L, st, dx, dy);
        if (!ns) continue;
        const nk = canonKey(L, ns, wordIdx);
        if (seen.has(nk)) continue;
        seen.set(nk, { prev: key, mv: ch });
        if (WP.isWin(L, ns)) {
          const sig = relevantSig(L, ns).join(' + ');
          if (!sigs.has(sig)) sigs.set(sig, { depth, path: pathOf(nk) });
          if (!best) best = { depth, path: pathOf(nk), st: ns };
          continue; // level ends on win
        }
        next.push({ st: ns, key: nk });
      }
      if (seen.size > CAP) { capped = true; break; }
    }
    frontier = next;
  }
  // minimal signatures (no other winning sig is a strict subset)
  const all = [...sigs.keys()].map(s => ({ s, set: new Set(s ? s.split(' + ') : []) }));
  const minimal = all.filter(a => !all.some(b => b !== a && b.set.size < a.set.size && [...b.set].every(x => a.set.has(x))));
  return { id: def.id, solved: !!best, moves: best && best.depth, path: best && best.path, states: seen.size, capped, minimal: minimal.map(m => m.s + '  (' + sigs.get(m.s).depth + ' moves)') };
}

if (require.main === module) {
  const only = process.argv[2] ? Number(process.argv[2]) : null;
  let bad = 0;
  for (const def of LEVELS) {
    if (only && def.id !== only) continue;
    const t = Date.now();
    let r;
    try { r = solve(def); } catch (e) { console.log('L' + def.id, 'ERROR', e.message); bad++; continue; }
    console.log('L' + String(r.id).padStart(2), r.solved ? 'SOLVED ' + String(r.moves).padStart(3) + ' moves' : 'UNSOLVED', '| states', r.states, r.capped ? '(CAPPED)' : '', '|', ((Date.now() - t) / 1000).toFixed(1) + 's');
    r.minimal.forEach(m => console.log('      way:', m));
    if (!r.solved) bad++;
  }
  process.exit(bad ? 1 : 0);
}
module.exports = { solve };
