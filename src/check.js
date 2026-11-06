// For each level: list starting sentences, and try to win WITHOUT moving any word block.
// If that works, the level has a shortcut that skips the grammar.
const WP = require('./engine.js'); const { LEVELS } = require('./levels.js');
const textKey = st => st.objs.filter(o => WP.isText(o.t)).map(o => o.id + ':' + o.x + ',' + o.y).join('|');
function frozenSolve(L, cap = 300000) {
  const acts = L.hasRun ? ['U', 'D', 'L', 'R', 'W'] : ['U', 'D', 'L', 'R'];
  const tk = textKey(L.st0); const seen = new Set([WP.stateKey(L, L.st0)]); let fr = [[L.st0, '']];
  if (WP.isWin(L, L.st0)) return '';
  while (fr.length && seen.size < cap) { const nx = [];
    for (const [st, p] of fr) for (const a of acts) {
      const ns = WP.move(L, st, a === 'W' ? null : a, {}); if (!ns || textKey(ns) !== tk) continue;
      const k = WP.stateKey(L, ns); if (seen.has(k)) continue; seen.add(k);
      if (WP.isWin(L, ns)) return p + a; nx.push([ns, p + a]); }
    fr = nx; }
  return null;
}
const want = process.argv.slice(2).map(Number);
LEVELS.forEach((d, i) => {
  if (want.length && !want.includes(i + 1)) return;
  const L = WP.parseLevel(d); const R = WP.rulesOf(L, L.st0);
  const sc = frozenSolve(L);
  console.log(String(i + 1).padStart(2), d.title.padEnd(16), '| start:', R.sentences.map(s => s.text).join(' / ') || '-', '|', sc === null ? 'ok' : 'SHORTCUT ' + sc);
});
