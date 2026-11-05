// Word Push engine — pure logic (no DOM). Works in browser and Node.
const WP = (function () {
  'use strict';

  // ---------- Vocabulary (every word except CAN / IS is from NH Elementary 2024 list) ----------
  const WORDS = {
    // pronouns
    I:   { t: 'pro', jp: 'わたし' },
    WE:  { t: 'pro', jp: 'わたしたち' },
    YOU: { t: 'pro', jp: 'あなた' },
    HE:  { t: 'pro', jp: 'かれ' },
    SHE: { t: 'pro', jp: 'かのじょ' },
    // animals / people
    DOG:     { t: 'noun', jp: 'イヌ', e: '🐶' },
    CAT:     { t: 'noun', jp: 'ネコ', e: '🐱' },
    BIRD:    { t: 'noun', jp: 'とり', e: '🐦' },
    FISH:    { t: 'noun', jp: 'さかな', e: '🐟' },
    MONKEY:  { t: 'noun', jp: 'サル', e: '🐵' },
    PANDA:   { t: 'noun', jp: 'パンダ', e: '🐼' },
    PENGUIN: { t: 'noun', jp: 'ペンギン', e: '🐧' },
    BOY:     { t: 'noun', jp: 'おとこのこ', e: '👦' },
    GIRL:    { t: 'noun', jp: 'おんなのこ', e: '👧' },
    // terrain things
    DOOR:     { t: 'noun', jp: 'ドア', e: '🚪' },
    RIVER:    { t: 'noun', jp: 'かわ', e: '🌊' },
    MOUNTAIN: { t: 'noun', jp: 'やま', e: '⛰️' },
    WALL:     { t: 'noun', jp: 'かべ', e: '🧱' },
    // food (things you can want)
    APPLE:      { t: 'noun', jp: 'リンゴ', e: '🍎' },
    CAKE:       { t: 'noun', jp: 'ケーキ', e: '🍰' },
    PIZZA:      { t: 'noun', jp: 'ピザ', e: '🍕' },
    BANANA:     { t: 'noun', jp: 'バナナ', e: '🍌' },
    STRAWBERRY: { t: 'noun', jp: 'イチゴ', e: '🍓' },
    // grammar glue
    CAN:  { t: 'can',  jp: 'できる' },
    IS:   { t: 'is',   jp: 'です' },
    WANT: { t: 'want', jp: 'ほしい' },
    // ability verbs
    FLY:   { t: 'verb', jp: 'とぶ',     abil: 'とべる' },
    SWIM:  { t: 'verb', jp: 'およぐ',   abil: 'およげる' },
    JUMP:  { t: 'verb', jp: 'ジャンプ', abil: 'ジャンプできる' },
    CLIMB: { t: 'verb', jp: 'のぼる',   abil: 'のぼれる' },
    // adjectives
    OPEN:   { t: 'adj', jp: 'あいている' },
    CLOSED: { t: 'adj', jp: 'しまっている' },
    COLD:   { t: 'adj', jp: 'つめたい' },
    HOT:    { t: 'adj', jp: 'あつい' },
    LOW:    { t: 'adj', jp: 'ひくい' },
    HIGH:   { t: 'adj', jp: 'たかい' },
  };
  const GRAMMAR_WORDS = ['CAN', 'IS'];
  const ITEM_CHARS = { a: 'APPLE', k: 'CAKE', z: 'PIZZA', b: 'BANANA', r: 'STRAWBERRY' };
  const OPPOSITES = { DOOR: ['OPEN', 'CLOSED'], RIVER: ['COLD', 'HOT'], MOUNTAIN: ['LOW', 'HIGH'], WALL: ['LOW', 'HIGH'] };

  // ---------- Level parsing ----------
  function parseLevel(def) {
    const rows = def.map;
    const h = rows.length, w = rows[0].length;
    const tiles = [];
    const p = [];
    let hx = -1, hy = -1;
    const words = def.words;
    const slot = new Array(words.length).fill(null);
    for (let y = 0; y < h; y++) {
      if (rows[y].length !== w) throw new Error('Level ' + def.id + ' row ' + y + ' has wrong width');
      const r = [];
      for (let x = 0; x < w; x++) {
        const ch = rows[y][x];
        if (ch === '@') { hx = x; hy = y; r.push('.'); }
        else if (ch >= '0' && ch <= '9') {
          const idx = ch === '0' ? 9 : Number(ch) - 1;
          if (idx >= words.length) throw new Error('Level ' + def.id + ' digit ' + ch + ' has no word');
          slot[idx] = [x, y]; r.push('.');
        } else r.push(ch);
      }
      tiles.push(r);
    }
    slot.forEach((s, i) => { if (!s) throw new Error('Level ' + def.id + ' word ' + words[i] + ' not placed'); p.push(s[0], s[1]); });
    if (hx < 0) throw new Error('Level ' + def.id + ' has no hero');
    return Object.assign({}, def, { w, h, tiles, st0: { hx, hy, p } });
  }

  // ---------- Sentences ----------
  function checkSentence(a, b, c) {
    const A = WORDS[a], B = WORDS[b], C = WORDS[c];
    if (B.t === 'can' && (A.t === 'pro' || A.t === 'noun') && C.t === 'verb') return { ok: true, kind: 'can', subj: a, verb: c };
    if (B.t === 'is' && (A.t === 'noun' || a === 'HE' || a === 'SHE') && C.t === 'adj') return { ok: true, kind: 'is', subj: a, adj: c };
    if (B.t === 'want' && (a === 'I' || a === 'WE' || a === 'YOU') && C.t === 'noun') return { ok: true, kind: 'want', subj: a, obj: c };
    return { ok: false };
  }
  function sentenceJP(s) {
    const S = WORDS[s.subj].jp;
    if (s.kind === 'can') return S + 'は ' + WORDS[s.verb].abil;
    if (s.kind === 'is') return S + 'は ' + WORDS[s.adj].jp;
    return S + 'は ' + WORDS[s.obj].jp + 'が ほしい';
  }
  const PERMS = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
  function diagnose(ws) {
    if (ws.length === 2) {
      const A = WORDS[ws[0]], B = WORDS[ws[1]];
      if ((A.t === 'pro' || A.t === 'noun') && (B.t === 'can' || B.t === 'is' || B.t === 'want')) return null; // unfinished, fine
    }
    for (let i = 0; i + 2 < ws.length; i++) {
      const tri = [ws[i], ws[i + 1], ws[i + 2]];
      for (const pm of PERMS) if (checkSentence(tri[pm[0]], tri[pm[1]], tri[pm[2]]).ok) return 'order';
    }
    for (let i = 0; i + 1 < ws.length; i++) {
      const A = WORDS[ws[i]], B = WORDS[ws[i + 1]];
      if (B.t === 'is' && (ws[i] === 'I' || ws[i] === 'WE' || ws[i] === 'YOU')) return 'beIs';
      if (B.t === 'want' && A.t !== 'pro') return 'wantNoun';
      if (B.t === 'want' && (ws[i] === 'HE' || ws[i] === 'SHE')) return 'wantHe';
    }
    return 'nosense';
  }

  function blocksOf(L, st) {
    return L.words.map((word, i) => ({ id: i, word, x: st.p[2 * i], y: st.p[2 * i + 1] }));
  }

  // Reads all rows (left→right) and columns (top→bottom). Returns valid sentences + broken runs.
  function parseRules(L, st) {
    const bl = blocksOf(L, st);
    const at = new Map();
    for (const b of bl) at.set(b.x + ',' + b.y, b);
    const runs = [];
    for (let y = 0; y < L.h; y++) {
      let run = [];
      for (let x = 0; x <= L.w; x++) {
        const b = at.get(x + ',' + y);
        if (b) run.push(b); else { if (run.length >= 2) runs.push(run); run = []; }
      }
    }
    for (let x = 0; x < L.w; x++) {
      let run = [];
      for (let y = 0; y <= L.h; y++) {
        const b = at.get(x + ',' + y);
        if (b) run.push(b); else { if (run.length >= 2) runs.push(run); run = []; }
      }
    }
    const sentences = [], bad = [];
    const seen = new Set();
    for (const run of runs) {
      let any = false;
      for (let i = 0; i + 2 < run.length; i++) {
        const s = checkSentence(run[i].word, run[i + 1].word, run[i + 2].word);
        if (s.ok) {
          any = true;
          s.ids = [run[i].id, run[i + 1].id, run[i + 2].id];
          s.text = run[i].word + ' ' + run[i + 1].word + ' ' + run[i + 2].word;
          sentences.push(s);
        }
      }
      if (!any) {
        const code = diagnose(run.map(b => b.word));
        if (code) bad.push({ ids: run.map(b => b.id), code, text: run.map(b => b.word).join(' ') });
      }
    }
    return { sentences, bad };
  }

  // Turns sentences into what the world does
  function resolve(L, sentences) {
    const names = L.hero.names;
    const abil = new Set(), props = {}, wants = new Set(), conflicts = [];
    for (const s of sentences) {
      s.effect = false;
      if (s.kind === 'can' && names.includes(s.subj)) { abil.add(s.verb); s.effect = true; }
      else if (s.kind === 'want' && s.subj === 'I' && names.includes('I')) { wants.add(s.obj); s.effect = true; }
      else if (s.kind === 'is') { (props[s.subj] = props[s.subj] || new Set()).add(s.adj); }
    }
    const R = { abil, wants, conflicts, door: false, river: false, mountain: false, wall: false };
    const pass = (noun, good) => {
      const pr = props[noun]; if (!pr) return false;
      const [g, b] = OPPOSITES[noun];
      if (pr.has(g) && pr.has(b)) { conflicts.push(noun + ': ' + g + ' ⇄ ' + b); return false; }
      return good === g && pr.has(g);
    };
    R.door = pass('DOOR', 'OPEN');
    R.river = pass('RIVER', 'COLD');
    R.mountain = pass('MOUNTAIN', 'LOW');
    R.wall = pass('WALL', 'LOW');
    for (const s of sentences) {
      if (s.kind === 'is') {
        s.effect = (s.subj === 'DOOR' && R.door && s.adj === 'OPEN') || (s.subj === 'RIVER' && R.river && s.adj === 'COLD') ||
          (s.subj === 'MOUNTAIN' && R.mountain && s.adj === 'LOW') || (s.subj === 'WALL' && R.wall && s.adj === 'LOW');
      }
    }
    return R;
  }

  function rulesOf(L, st) {
    const pr = parseRules(L, st);
    const R = resolve(L, pr.sentences);
    R.sentences = pr.sentences; R.bad = pr.bad;
    return R;
  }

  // ---------- Movement ----------
  const FLOOR = ch => ch === '.' || ch === 'S' || ITEM_CHARS[ch] !== undefined;
  function tileAt(L, x, y) { return (x < 0 || y < 0 || x >= L.w || y >= L.h) ? '#' : L.tiles[y][x]; }
  function blockIndexAt(st, x, y) {
    for (let i = 0; i < st.p.length; i += 2) if (st.p[i] === x && st.p[i + 1] === y) return i >> 1;
    return -1;
  }

  // returns new state or null if the move is blocked. info.hop set when hero jumps.
  function move(L, st, dx, dy, info) {
    const nx = st.hx + dx, ny = st.hy + dy;
    const ch = tileAt(L, nx, ny);
    if (ch === '#') return null;
    const bi = blockIndexAt(st, nx, ny);
    if (bi >= 0) {
      // push a chain of blocks
      const chain = [];
      let cx = nx, cy = ny;
      while (true) {
        const i = blockIndexAt(st, cx, cy);
        if (i < 0) break;
        chain.push(i); cx += dx; cy += dy;
      }
      if (tileAt(L, cx, cy) !== '.') return null; // blocks only slide on plain floor
      const p = st.p.slice();
      for (const i of chain) { p[2 * i] += dx; p[2 * i + 1] += dy; }
      if (info) info.pushed = chain.length;
      return { hx: nx, hy: ny, p };
    }
    if (FLOOR(ch)) return { hx: nx, hy: ny, p: st.p };
    const R = rulesOf(L, st);
    const fly = R.abil.has('FLY');
    let ok = false;
    if (ch === 'D') ok = R.door;
    else if (ch === 'R') ok = R.river || fly || R.abil.has('SWIM');
    else if (ch === 'M') ok = R.mountain || fly || R.abil.has('CLIMB');
    else if (ch === 'W') ok = R.wall || fly;
    if (ok) return { hx: nx, hy: ny, p: st.p };
    if (ch === 'W' && R.abil.has('JUMP')) {
      const tx = nx + dx, ty = ny + dy;
      if (FLOOR(tileAt(L, tx, ty)) && blockIndexAt(st, tx, ty) < 0) {
        if (info) info.hop = true;
        return { hx: tx, hy: ty, p: st.p };
      }
    }
    return null;
  }

  function isWin(L, st) {
    const ch = tileAt(L, st.hx, st.hy);
    if (ch === 'S') return true;
    if (ITEM_CHARS[ch]) return rulesOf(L, st).wants.has(ITEM_CHARS[ch]);
    return false;
  }

  return { WORDS, ITEM_CHARS, GRAMMAR_WORDS, OPPOSITES, parseLevel, checkSentence, sentenceJP, rulesOf, move, isWin, blocksOf, tileAt };
})();
if (typeof module !== 'undefined') module.exports = WP;
