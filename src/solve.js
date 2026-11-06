// BFS solver for Word Push v2 levels. node solve.js [levelNumber...]
const WP = require('./engine.js');
function solve(def, opts) {
  opts = opts || {};
  const cap = opts.cap || +process.env.CAP || 2000000;
  const L = def.st0 ? def : WP.parseLevel(def);
  const acts = L.hasRun ? ['U', 'D', 'L', 'R', 'W'] : ['U', 'D', 'L', 'R'];
  const start = L.st0;
  if (WP.isWin(L, start)) return { solved: true, moves: 0, path: '', states: 1 };
  const seen = new Map(); seen.set(WP.stateKey(L, start), null);
  let frontier = [[start, '']]; let states = 1;
  while (frontier.length) {
    const next = [];
    for (const [st, path] of frontier) {
      for (const a of acts) {
        const ns = WP.move(L, st, a === 'W' ? null : a, {});
        if (!ns) continue;
        const k = WP.stateKey(L, ns);
        if (seen.has(k)) continue;
        seen.set(k, 1); states++;
        if (WP.isWin(L, ns)) return { solved: true, moves: path.length + 1, path: path + a, states };
        if (states > cap) return { solved: false, capped: true, states };
        next.push([ns, path + a]);
      }
    }
    frontier = next;
  }
  return { solved: false, states };
}
module.exports = { solve };
if (require.main === module) {
  global.WP = WP;
  const { LEVELS } = require('./levels.js');
  const want = process.argv.slice(2).map(Number);
  LEVELS.forEach((d, i) => {
    if (want.length && !want.includes(i + 1)) return;
    const t = Date.now(); const r = solve(d);
    console.log(String(i + 1).padStart(2), (d.title || '').padEnd(22), r.solved ? 'OK ' : (r.capped ? 'CAP' : 'NO '), 'moves', r.moves, 'states', r.states, (Date.now() - t) + 'ms', r.path || '');
  });
}
