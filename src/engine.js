// Word Push engine v2 — object-based "rules are words" engine (no DOM). Works in browser and Node.
// Everything on the board is an object. Word blocks are objects too, and the sentences they form
// decide what every other object does — who you are, what is big, what turns into what.
const WP = (function () {
  'use strict';

  // ---------- vocabulary ----------
  // t: block category (decides colour and grammar role)
  const WORDS = {
    I: { t: 'pro', jp: 'わたし' }, HE: { t: 'pro', jp: 'かれ' }, SHE: { t: 'pro', jp: 'かのじょ' },
    BOY: { t: 'noun', jp: 'おとこのこ' }, GIRL: { t: 'noun', jp: 'おんなのこ' },
    DOG: { t: 'noun', jp: 'イヌ' }, CAT: { t: 'noun', jp: 'ネコ' }, MONKEY: { t: 'noun', jp: 'サル' },
    FISH: { t: 'noun', jp: 'さかな' }, FROG: { t: 'noun', jp: 'カエル' }, MOUSE: { t: 'noun', jp: 'ネズミ' },
    TREE: { t: 'noun', jp: 'き' }, WALL: { t: 'noun', jp: 'かべ' }, ROCK: { t: 'noun', jp: 'いわ' },
    MOUNTAIN: { t: 'noun', jp: 'やま' }, RIVER: { t: 'noun', jp: 'かわ' }, DOOR: { t: 'noun', jp: 'ドア' },
    KEY: { t: 'noun', jp: 'かぎ' }, STAR: { t: 'noun', jp: 'ほし' }, FIRE: { t: 'noun', jp: 'ひ' },
    ICE: { t: 'noun', jp: 'こおり' }, FLOWER: { t: 'noun', jp: 'はな' },
    APPLE: { t: 'noun', jp: 'リンゴ' }, BANANA: { t: 'noun', jp: 'バナナ' }, CAKE: { t: 'noun', jp: 'ケーキ' },
    PIZZA: { t: 'noun', jp: 'ピザ' }, STRAWBERRY: { t: 'noun', jp: 'イチゴ' },
    IS: { t: 'is', jp: 'は' }, AM: { t: 'am', jp: 'は' }, ARE: { t: 'are', jp: 'は' },
    CAN: { t: 'can', jp: 'できる' }, "CAN'T": { t: 'cant', jp: 'できない' },
    WANT: { t: 'want', jp: 'ほしい' }, WANTS: { t: 'wants', jp: 'ほしい' },
    HAVE: { t: 'have', jp: 'もっている' }, HAS: { t: 'has', jp: 'もっている' }, AND: { t: 'and', jp: 'と' },
    SWIM: { t: 'verb', jp: 'およぐ', abil: 'およげる', neg: 'およげない' },
    FLY: { t: 'verb', jp: 'とぶ', abil: 'とべる', neg: 'とべない' },
    JUMP: { t: 'verb', jp: 'ジャンプ', abil: 'ジャンプできる', neg: 'ジャンプできない' },
    CLIMB: { t: 'verb', jp: 'のぼる', abil: 'のぼれる', neg: 'のぼれない' },
    RUN: { t: 'verb', jp: 'はしる', abil: 'はしる', neg: 'はしれない' },
    BIG: { t: 'adj', jp: 'おおきい' }, SMALL: { t: 'adj', jp: 'ちいさい' }, LOW: { t: 'adj', jp: 'ひくい' },
    HOT: { t: 'adj', jp: 'あつい' }, COLD: { t: 'adj', jp: 'つめたい' },
    OPEN: { t: 'adj', jp: 'あいている' }, CLOSED: { t: 'adj', jp: 'しまっている' },
    HUNGRY: { t: 'adj', jp: 'はらぺこ' }, SLEEPY: { t: 'adj', jp: 'ねむい' }
  };
  const VERBS = { IS: 1, AM: 1, ARE: 1, CAN: 1, "CAN'T": 1, WANT: 1, WANTS: 1, HAVE: 1, HAS: 1 };
  const PRON = { HE: 'BOY', SHE: 'GIRL' };
  const OPP = { BIG: 'SMALL', SMALL: 'BIG', HOT: 'COLD', COLD: 'HOT', OPEN: 'CLOSED', CLOSED: 'OPEN' };
  const FOOD = { APPLE: 1, BANANA: 1, CAKE: 1, PIZZA: 1, STRAWBERRY: 1, FISH: 1 };
  // "nature" — what things do when no sentence says otherwise (shown in the side panel)
  const DEFAULTS = {
    TREE: ['BIG'], WALL: ['BIG'], ROCK: ['SMALL'], MOUNTAIN: ['steep'], RIVER: ['deep'],
    DOOR: ['CLOSED'], KEY: ['SMALL'], FIRE: ['HOT'], ICE: ['COLD', 'BIG']
  };
  const DEF_ABIL = { FISH: ['SWIM'], FROG: ['JUMP'] };
  const NATURE_JP = {
    TREE: 'き は とおれない', WALL: 'かべ は とおれない', ROCK: 'いわ は おせる', MOUNTAIN: 'やま: のぼれないと とおれない',
    RIVER: 'かわ: およげないと はいれない', DOOR: 'ドア は しまっている', KEY: 'かぎ は おせる',
    FIRE: 'ひ: さわると やけど!', ICE: 'こおり: あつい ものしか とおれない', FISH: 'さかな は およげる', FROG: 'カエル は ジャンプできる',
    STAR: '⭐ に さわったら クリア'
  };
  const MAPCH = {
    B: 'BOY', G: 'GIRL', d: 'DOG', c: 'CAT', m: 'MONKEY', h: 'FISH', g: 'FROG', u: 'MOUSE',
    T: 'TREE', W: 'WALL', o: 'ROCK', M: 'MOUNTAIN', R: 'RIVER', D: 'DOOR', K: 'KEY', S: 'STAR', F: 'FIRE',
    I: 'ICE', f: 'FLOWER', a: 'APPLE', n: 'BANANA', k: 'CAKE', z: 'PIZZA', r: 'STRAWBERRY'
  };
  const DIRV = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };
  const isText = t => t.charCodeAt(0) === 42; // '*'
  const wordOf = t => t.slice(1);

  // ---------- level parsing ----------
  // map chars: '#' outer hedge (absolute edge), '.' floor, letters = objects (MAPCH), '*' = next word in def.words
  function parseLevel(def) {
    const rows = def.map, h = rows.length, w = Math.max(...rows.map(r => r.length));
    const frame = []; const objs = []; let wi = 0, nid = 1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const c = rows[y][x] || '#';
      frame.push(c === '#' ? 1 : 0);
      if (c === '*') { const word = def.words[wi++]; if (!WORDS[word]) throw new Error('unknown word ' + word); objs.push({ id: nid++, t: '*' + word, x, y, d: 'R' }); }
      else if (MAPCH[c]) objs.push({ id: nid++, t: MAPCH[c], x, y, d: 'R' });
      else if (c !== '.' && c !== '#') throw new Error('bad map char ' + c + ' in ' + def.title);
    }
    if (wi !== (def.words || []).length) throw new Error('word count mismatch in ' + def.title + ' ' + wi + '/' + def.words.length);
    (def.extra || []).forEach(([t, x, y]) => objs.push({ id: nid++, t, x, y, d: 'R' }));
    (def.face || []).forEach(([x, y, d]) => objs.forEach(o => { if (o.x === x && o.y === y && !isText(o.t)) o.d = d; }));
    const allWords = objs.filter(o => isText(o.t)).map(o => wordOf(o.t));
    const L = Object.assign({}, def, {
      w, h, frame, hero: def.hero || 'BOY',
      hasAM: allWords.includes('AM'), hasRun: allWords.includes('RUN'),
      types: [...new Set(objs.filter(o => !isText(o.t)).map(o => o.t))]
    });
    if (!allWords.includes('AM')) objs.forEach(o => { if (o.t === (def.hero || 'BOY')) o.me = 1; });
    let st = { objs, nid };
    st = settle(L, st, {});
    L.st0 = st;
    return L;
  }

  // ---------- sentences ----------
  const cat = w => WORDS[w].t;
  const isSubjWord = w => cat(w) === 'noun' || w === 'HE' || w === 'SHE';
  function agree(subjKind, verb) { // subjKind: 'I' | 'one' | 'many'
    const ok = {
      I: { AM: 1, CAN: 1, "CAN'T": 1, WANT: 1, HAVE: 1 },
      one: { IS: 1, CAN: 1, "CAN'T": 1, WANTS: 1, HAS: 1 },
      many: { ARE: 1, CAN: 1, "CAN'T": 1, WANT: 1, HAVE: 1 }
    }[subjKind];
    if (ok[verb]) return null;
    if (subjKind === 'I') return { IS: 'beI', ARE: 'beI', WANTS: 'wantsI', HAS: 'hasI' }[verb];
    if (subjKind === 'one') return { AM: 'amNotI', ARE: 'areOne', WANT: 'wantS', HAVE: 'haveS' }[verb];
    return { IS: 'isMany', AM: 'amNotI', WANTS: 'wantsMany', HAS: 'hasMany' }[verb];
  }
  const objOk = (verb, w) => {
    const c = cat(w);
    if (verb === 'IS' || verb === 'AM' || verb === 'ARE') return c === 'adj' || c === 'noun';
    if (verb === 'CAN' || verb === "CAN'T") return c === 'verb';
    return c === 'noun'; // WANT(S) HAVE HAS
  };
  // try to read a sentence starting at index i of a run. strict=false ignores agreement/category to find the error
  function readAt(run, i, strict) {
    const n = run.length; let j = i; const subj = [];
    if (run[i].w === 'I') { subj.push('I'); j = i + 1; }
    else {
      if (!isSubjWord(run[i].w)) return null;
      subj.push(run[i].w); j = i + 1;
      while (j + 1 < n && run[j].w === 'AND' && isSubjWord(run[j + 1].w)) { subj.push(run[j + 1].w); j += 2; }
    }
    if (j >= n || !VERBS[run[j].w]) return null;
    const verb = run[j].w; const kind = subj[0] === 'I' ? 'I' : subj.length > 1 ? 'many' : 'one';
    const err = agree(kind, verb);
    if (strict && err) return null;
    let k = j + 1; const objs = [];
    const okw = w => strict ? objOk(verb, w) : (cat(w) === 'noun' || cat(w) === 'adj' || cat(w) === 'verb');
    if (k >= n || !okw(run[k].w)) return null;
    objs.push(run[k].w); k++;
    while (k + 1 < n && run[k].w === 'AND' && okw(run[k + 1].w)) { objs.push(run[k + 1].w); k += 2; }
    let code = err;
    if (!code && objs.some(o => !objOk(verb, o))) code = 'nosense';
    if (!code && (verb === 'AM') && objs.some(o => o === 'I')) code = 'nosense';
    return { subj, verb, objs, kind, ids: run.slice(i, k).map(r => r.id), text: run.slice(i, k).map(r => r.w).join(' '), code, end: k };
  }
  function readRun(run, out) {
    const covered = new Set();
    for (let i = 0; i < run.length; i++) {
      if (i >= 2 && run[i - 1].w === 'AND' && isSubjWord(run[i - 2].w)) continue; // middle of "A AND B"
      const s = readAt(run, i, true);
      if (s) { out.sentences.push(s); s.ids.forEach(id => covered.add(id)); }
    }
    // errors: verbs that are not part of any good sentence
    for (let i = 0; i < run.length; i++) {
      if (!VERBS[run[i].w] || covered.has(run[i].id)) continue;
      let found = null;
      for (let s = i - 1; s >= 0 && !found; s--) {
        const r = readAt(run, s, false);
        if (r && r.ids.includes(run[i].id) && r.code) found = r;
      }
      if (found) { out.bad.push({ ids: found.ids, text: found.text, code: found.code }); continue; }
      // reversed order? (e.g. APPLE WANT I / OPEN IS DOOR)
      const rev = run.slice().reverse(); const ri = run.length - 1 - i; let rv = null;
      for (let s = ri - 1; s >= 0 && !rv; s--) { const r = readAt(rev, s, true); if (r && r.ids.includes(run[i].id)) rv = r; }
      if (rv) { out.bad.push({ ids: rv.ids, text: run.filter(r => rv.ids.includes(r.id)).map(r => r.w).join(' '), code: 'order' }); continue; }
      const near = run.slice(Math.max(0, i - 1), i + 2);
      if (near.length >= 3) out.bad.push({ ids: near.map(r => r.id), text: near.map(r => r.w).join(' '), code: 'nosense' });
    }
  }

  function rulesOf(L, st) {
    // text grid
    const g = new Map();
    st.objs.forEach(o => { if (isText(o.t)) g.set(o.y * L.w + o.x, { w: wordOf(o.t), id: o.id }); });
    const out = { sentences: [], bad: [] };
    for (const [dx, dy] of [[1, 0], [0, 1]]) {
      for (const [k, v] of g) {
        const x = k % L.w, y = (k / L.w) | 0;
        if (g.has((y - dy) * L.w + (x - dx)) && x - dx >= 0) continue; // not run start
        const run = []; let cx = x, cy = y;
        while (cx < L.w && cy < L.h && g.has(cy * L.w + cx)) { run.push(g.get(cy * L.w + cx)); cx += dx; cy += dy; }
        if (run.length >= 3) readRun(run, out);
      }
    }
    // derive
    const R = { sentences: out.sentences, bad: out.bad, you: new Set(), prop: {}, can: {}, cant: {}, wants: [], has: {}, xf: {}, lock: new Set(), conflicts: [] };
    const add = (m, k, v) => { (m[k] = m[k] || new Set()).add(v); };
    const subjTypes = s => s.subj.map(w => w === 'I' ? '@you' : (PRON[w] || w));
    for (const s of out.sentences) {
      const subs = subjTypes(s);
      for (const sub of subs) for (const o of s.objs) {
        const c = cat(o);
        if (s.verb === 'AM' && c === 'noun') R.you.add(o);
        else if ((s.verb === 'IS' || s.verb === 'ARE' || s.verb === 'AM') && c === 'adj') add(R.prop, sub, o);
        else if ((s.verb === 'IS' || s.verb === 'ARE') && c === 'noun') { if (o === sub) R.lock.add(sub); else add(R.xf, sub, o); }
        else if (s.verb === 'CAN') add(R.can, sub, o);
        else if (s.verb === "CAN'T") add(R.cant, sub, o);
        else if (s.verb === 'WANT' || s.verb === 'WANTS') R.wants.push([sub, o]);
        else if (s.verb === 'HAVE' || s.verb === 'HAS') add(R.has, sub, o);
      }
    }
    R.amMode = !!L.hasAM;
    R.isYou = o => !isText(o.t) && ((R.amMode && R.you.has(o.t)) || !!o.me);
    R.lock.forEach(t => delete R.xf[t]);
    // conflicts (opposites written for the same thing cancel)
    Object.keys(R.prop).forEach(t => {
      const p = R.prop[t];
      ['BIG', 'HOT', 'OPEN'].forEach(a => { if (p.has(a) && p.has(OPP[a])) { p.delete(a); p.delete(OPP[a]); R.conflicts.push(a + ' / ' + OPP[a]); } });
    });
    const present = new Set(st.objs.filter(o => !isText(o.t)).map(o => o.t));
    const anyYou = st.objs.some(o => R.isYou(o));
    out.sentences.forEach(s => {
      s.effect = subjTypes(s).some(t => t === '@you' ? anyYou : present.has(t)) || (s.verb === 'AM');
    });
    R.effCache = {};
    return R;
  }

  // effective properties of an object type
  function eff(R, t, youArg) {
    const you = !!youArg, ck = t + (you ? '|y' : '');
    if (R.effCache[ck]) return R.effCache[ck];
    const p = new Set(R.prop[t] || []);
    if (you && R.prop['@you']) R.prop['@you'].forEach(a => p.add(a));
    ['BIG', 'HOT', 'OPEN'].forEach(a => { if (p.has(a) && p.has(OPP[a])) { p.delete(a); p.delete(OPP[a]); } });
    const explicit = new Set(p);
    (DEFAULTS[t] || []).forEach(d => {
      if (OPP[d] && explicit.has(OPP[d])) return;
      if (explicit.has('LOW') && (d === 'BIG' || d === 'steep' || d === 'deep')) return;
      if (d === 'deep' && explicit.has('COLD')) return; // frozen river
      p.add(d);
    });
    const ab = new Set(DEF_ABIL[t] || []);
    (R.can[t] || []).forEach(a => ab.add(a)); if (you && R.can['@you']) R.can['@you'].forEach(a => ab.add(a));
    (R.cant[t] || []).forEach(a => ab.delete(a)); if (you && R.cant['@you']) R.cant['@you'].forEach(a => ab.delete(a));
    const e = { p, ab, you };
    R.effCache[ck] = e; return e;
  }
  const effO = (R, o) => eff(R, o.t, R.isYou(o));

  // ---------- turn ----------
  function cloneState(st) { return { objs: st.objs.map(o => { const c = { id: o.id, t: o.t, x: o.x, y: o.y, d: o.d }; if (o.me) c.me = 1; return c; }), nid: st.nid }; }
  function move(L, st0, dir, info) {
    info = info || {}; info.events = [];
    const st = cloneState(st0);
    let R = rulesOf(L, st);
    const W = L.w, H = L.h;
    const cell = new Map();
    const key = (x, y) => y * W + x;
    st.objs.forEach(o => { const k = key(o.x, o.y); (cell.get(k) || cell.set(k, []).get(k)).push(o); });
    const relocate = (o, nx, ny) => {
      const a = cell.get(key(o.x, o.y)); a.splice(a.indexOf(o), 1);
      o.x = nx; o.y = ny; const k = key(nx, ny); (cell.get(k) || cell.set(k, []).get(k)).push(o);
    };
    const E = o => isText(o.t) ? null : effO(R, o);
    const blocks = (p, o, self) => { // does p stop o from entering?
      if (isText(p.t)) return false;
      const P = effO(R, p).p; if (P.has('LOW')) return false;
      const oe = E(o);
      if (P.has('COLD') && oe && oe.p.has('HOT')) return false; // hot things melt their way in
      if (P.has('BIG')) return true;
      if (P.has('CLOSED')) return !(oe && oe.p.has('OPEN'));
      if (P.has('steep')) return !(oe && (oe.ab.has('CLIMB') || oe.ab.has('FLY')));
      if (P.has('deep')) {
        if (!oe) return true; // words float... no: words cannot go in rivers
        if (oe.ab.has('SWIM') || oe.ab.has('FLY')) return false;
        return !!self;
      }
      return false;
    };
    const pushable = p => isText(p.t) || (effO(R, p).p.has('SMALL') && !effO(R, p).p.has('LOW'));
    // plan a move of o by (dx,dy); returns list of objects to move, or null
    function plan(o, dx, dy, self, seen) {
      const nx = o.x + dx, ny = o.y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H || L.frame[key(nx, ny)]) return null;
      const here = cell.get(key(nx, ny)) || [];
      let list = [o];
      for (const p of here) {
        if (p === o) continue;
        if (pushable(p)) {
          if (seen.has(p)) return null; seen.add(p);
          const sub = plan(p, dx, dy, false, seen); if (!sub) return null; list = list.concat(sub);
        } else if (blocks(p, o, self)) return null;
      }
      return list;
    }
    function tryHop(o, dx, dy) {
      const e = E(o); if (!e || !e.ab.has('JUMP')) return false;
      const mx = o.x + dx, my = o.y + dy, nx = o.x + 2 * dx, ny = o.y + 2 * dy;
      if (mx < 0 || my < 0 || mx >= W || my >= H || L.frame[key(mx, my)]) return false;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H || L.frame[key(nx, ny)]) return false;
      const mid = cell.get(key(mx, my)) || [];
      if (!mid.some(p => !pushable(p) && blocks(p, o, true))) return false;
      const land = cell.get(key(nx, ny)) || [];
      if (land.some(p => p !== o && (pushable(p) || blocks(p, o, true)))) return false;
      relocate(o, nx, ny); info.hop = true; info.events.push({ k: 'hop', id: o.id }); return true;
    }
    let moved = false;
    const movedIds = new Set();
    if (dir) {
      const [dx, dy] = DIRV[dir];
      const movers = st.objs.filter(o => R.isYou(o) && !effO(R, o).p.has('SLEEPY'));
      movers.sort((a, b) => (b.x * dx + b.y * dy) - (a.x * dx + a.y * dy));
      movers.forEach(o => {
        o.d = dir;
        const pl = plan(o, dx, dy, true, new Set([o]));
        if (pl) {
          pl.forEach(p => { relocate(p, p.x + dx, p.y + dy); movedIds.add(p.id); });
          if (pl.length > 1) { info.pushed = true; info.events.push({ k: 'push', ids: pl.slice(1).map(p => p.id) }); }
          moved = true;
        } else if (tryHop(o, dx, dy)) { moved = true; movedIds.add(o.id); }
      });
    }
    // hungry things bite right away (so you can't slip past a runner)
    const preDead = new Set();
    st.objs.forEach(o => {
      if (!R.isYou(o) || !movedIds.has(o.id)) return;
      const eo = effO(R, o); if (eo.ab.has('FLY')) return;
      const others = (cell.get(key(o.x, o.y)) || []).filter(p => p !== o && !isText(p.t));
      if (!eo.p.has('HUNGRY') && others.some(p => effO(R, p).p.has('HUNGRY'))) { preDead.add(o); o._why = 'eat'; }
      else if (!eo.p.has('HOT') && others.some(p => effO(R, p).p.has('HOT'))) { preDead.add(o); o._why = 'burn'; }
    });
    if (preDead.size) {
      preDead.forEach(o => { const a = cell.get(key(o.x, o.y)); a.splice(a.indexOf(o), 1); info.events.push({ k: o._why, id: o.id, t: o.t, x: o.x, y: o.y, you: true }); delete o._why; });
      st.objs = st.objs.filter(o => !preDead.has(o));
    }
    // runners
    const runners = st.objs.filter(o => !isText(o.t) && effO(R, o).ab.has('RUN') && !effO(R, o).p.has('SLEEPY'));
    runners.forEach(o => {
      for (let tries = 0; tries < 2; tries++) {
        const [dx, dy] = DIRV[o.d];
        const pl = plan(o, dx, dy, true, new Set([o]));
        if (pl) { pl.forEach(p => { relocate(p, p.x + dx, p.y + dy); movedIds.add(p.id); }); moved = true; if (pl.length > 1) info.events.push({ k: 'push', ids: pl.slice(1).map(p => p.id) }); break; }
        o.d = { U: 'D', D: 'U', L: 'R', R: 'L' }[o.d];
      }
    });
    if (!moved) return null;
    info.moved = movedIds;
    return settle(L, st, info);
  }

  // transformations + interactions after movement
  function settle(L, st, info) {
    info.events = info.events || [];
    let R = rulesOf(L, st);
    // transform
    const born = [];
    st.objs.forEach(o => {
      if (isText(o.t)) return;
      const to = R.xf[o.t]; if (!to || !to.size) return;
      const list = [...to]; const from = o.t; const wasYou = R.isYou(o);
      o.t = list[0]; if (wasYou) o.me = 1;
      for (let i = 1; i < list.length; i++) { const b = { id: st.nid++, t: list[i], x: o.x, y: o.y, d: o.d }; if (wasYou) b.me = 1; born.push(b); }
      info.events.push({ k: 'xf', id: o.id, from, to: o.t });
    });
    born.forEach(b => { st.objs.push(b); info.events.push({ k: 'spawn', id: b.id }); });
    if (born.length || info.events.some(e => e.k === 'xf')) R = rulesOf(L, st);
    // interactions
    const dead = new Set(); const why = {};
    const byCell = new Map();
    st.objs.forEach(o => { if (isText(o.t)) return; const k = o.y * L.w + o.x; (byCell.get(k) || byCell.set(k, []).get(k)).push(o); });
    const kill = (o, reason) => { if (!dead.has(o)) { dead.add(o); why[o.id] = reason; } };
    for (const objs of byCell.values()) {
      if (objs.length < 2) continue;
      const e = o => effO(R, o);
      // sink
      const deep = objs.filter(o => e(o).p.has('deep'));
      if (deep.length) {
        const sinkers = objs.filter(o => !e(o).p.has('deep') && !e(o).ab.has('SWIM') && !e(o).ab.has('FLY'));
        if (sinkers.length) { sinkers.forEach(o => kill(o, 'sink')); kill(deep[0], 'sink'); }
      }
      // melt
      if (objs.some(o => e(o).p.has('HOT'))) objs.forEach(o => {
        if (o.t !== 'RIVER' && e(o).p.has('COLD')) kill(o, 'melt');
        else if (R.isYou(o) && !e(o).p.has('HOT') && !e(o).ab.has('FLY')) kill(o, 'burn');
      });
      // open / closed
      const op = objs.filter(o => e(o).p.has('OPEN')), sh = objs.filter(o => e(o).p.has('CLOSED'));
      if (op.length && sh.length && (op.length > 1 || sh.length > 1 || op[0] !== sh[0])) { op.forEach(o => kill(o, 'open')); sh.forEach(o => kill(o, 'open')); }
      // hungry
      const hun = objs.filter(o => e(o).p.has('HUNGRY') && !dead.has(o));
      if (hun.length) objs.forEach(o => {
        if (e(o).p.has('HUNGRY') || e(o).ab.has('FLY')) return;
        if (R.isYou(o) || FOOD[o.t]) kill(o, 'eat');
      });
    }
    if (dead.size) {
      const drops = [];
      dead.forEach(o => {
        const hs = new Set(R.has[o.t] || []); if (R.isYou(o) && R.has['@you']) R.has['@you'].forEach(t => hs.add(t));
        hs.forEach(t => drops.push({ id: st.nid++, t, x: o.x, y: o.y, d: o.d }));
        info.events.push({ k: why[o.id], id: o.id, t: o.t, x: o.x, y: o.y, you: R.isYou(o) });
      });
      st.objs = st.objs.filter(o => !dead.has(o)).concat(drops);
      drops.forEach(b => info.events.push({ k: 'spawn', id: b.id, has: true }));
    }
    return st;
  }

  function isWin(L, st, R) {
    R = R || rulesOf(L, st);
    const yous = st.objs.filter(o => R.isYou(o));
    for (const o of yous) {
      const want = new Set(['STAR']);
      R.wants.forEach(([who, what]) => { if (who === '@you' || who === o.t) want.add(what); });
      if (want.has(o.t)) return true;
      if (st.objs.some(p => p !== o && !isText(p.t) && p.x === o.x && p.y === o.y && want.has(p.t))) return true;
    }
    return false;
  }
  const youCount = (L, st, R) => { R = R || rulesOf(L, st); return st.objs.filter(o => R.isYou(o)).length; };

  function stateKey(L, st) {
    const a = st.objs.map(o => o.t + (o.x + o.y * L.w) + (L.hasRun && !isText(o.t) ? o.d : '') + (o.me ? 'm' : ''));
    a.sort(); return a.join('|');
  }

  // ---------- Japanese ----------
  const jw = w => w === 'I' ? 'わたし' : WORDS[w].jp;
  const list = (ws, f) => ws.map(f || jw).join(' と ');
  function sentenceJP(s) {
    const S = list(s.subj); const objs = s.objs;
    if (s.verb === 'AM' && objs.every(o => cat(o) === 'noun')) return 'わたしは ' + list(objs) + ' (に なる!)';
    if (['IS', 'ARE', 'AM'].includes(s.verb)) {
      const adj = objs.filter(o => cat(o) === 'adj'), nn = objs.filter(o => cat(o) === 'noun');
      const parts = [];
      if (adj.length) parts.push(S + 'は ' + list(adj));
      if (nn.length) parts.push(S + 'は ' + list(nn) + ' (に なる!)');
      return parts.join('、');
    }
    if (s.verb === 'CAN') return S + 'は ' + list(objs, o => WORDS[o].abil);
    if (s.verb === "CAN'T") return S + 'は ' + list(objs, o => WORDS[o].neg);
    if (s.verb === 'WANT' || s.verb === 'WANTS') return S + 'は ' + list(objs) + 'が ほしい';
    if (s.verb === 'HAVE' || s.verb === 'HAS') return S + 'は ' + list(objs) + 'を もっている';
    return s.text;
  }

  return { WORDS, MAPCH, DEFAULTS, DEF_ABIL, NATURE_JP, FOOD, OPP, isText, wordOf, parseLevel, rulesOf, eff, effO, move, settle, isWin, youCount, stateKey, sentenceJP };
})();
if (typeof module !== 'undefined') module.exports = WP;
