// Layout generator: scatter word blocks on '*' cells, keep layouts the solver can beat in [minMoves,maxMoves]
// usage: node gen.js '<json config>'
const { solve } = require('./solve.js');

function rnd(n) { return Math.floor(Math.random() * n); }
function place(skel, words, fixed, candsBy, sides) {
  // fixed: [{idx, x, y}] pre-placed words ; cands: list of [x,y]
  const rows = skel.map(r => r.replace(/[*+]/g, '.').split(''));
  const used = new Set();
  const digit = i => (i === 9 ? '0' : String(i + 1));
  for (const f of fixed) { rows[f.y][f.x] = digit(f.idx); used.add(f.x + ',' + f.y); }
  const free = words.map((_, i) => i).filter(i => !fixed.some(f => f.idx === i));
  const pools = {};
  for (const k of Object.keys(candsBy)) pools[k] = candsBy[k].filter(c => !used.has(c[0] + ',' + c[1]));
  for (const i of free) {
    const pool = pools[(sides && sides[i]) || '*'];
    if (!pool || !pool.length) return null;
    const k = rnd(pool.length); const [x, y] = pool.splice(k, 1)[0];
    rows[y][x] = digit(i);
  }
  return rows.map(r => r.join(''));
}

function run(cfg) {
  const cands = { '*': [], '+': [] };
  cfg.skel.forEach((r, y) => [...r].forEach((c, x) => { if (c === '*' || c === '+') cands[c].push([x, y]); }));
  const found = [];
  const t0 = Date.now();
  for (let t = 0; t < cfg.trials && Date.now() - t0 < (cfg.seconds || 60) * 1000; t++) {
    const map = place(cfg.skel, cfg.words, cfg.fixed || [], { '*': cands['*'].slice(), '+': cands['+'].slice() }, cfg.sides);
    if (!map) break;
    process.env.CAP = String(cfg.cap || 250000);
    const r = solve({ id: 0, hero: cfg.hero, words: cfg.words, map });
    if (!r.solved || r.capped) continue;
    if (r.moves < cfg.min || r.moves > cfg.max) continue;
    if (cfg.single && r.minimal.length !== 1) continue;
    found.push({ moves: r.moves, states: r.states, way: r.minimal, map });
  }
  const tg = cfg.target || 99; found.sort((a, b) => Math.abs(a.moves - tg) - Math.abs(b.moves - tg));
  return found;
}

if (require.main === module) {
  const cfg = JSON.parse(process.argv[2]);
  const HERO = { names: cfg.names || ['I'] };
  cfg.hero = HERO;
  const f = run(cfg);
  console.log('found', f.length);
  f.slice(0, cfg.show || 3).forEach(x => { console.log('--', x.moves, 'moves,', x.states, 'states', x.way.join(' | ')); console.log(x.map.map(r => "'" + r + "',").join('\n')); });
}
module.exports = { run };
