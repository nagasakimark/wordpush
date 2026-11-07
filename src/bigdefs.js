// Big open stages. Built from coordinates so scenes can be laid out freely.
function build(o) {
  const { w, h } = o; const g = []; for (let y = 0; y < h; y++) { g.push([]); for (let x = 0; x < w; x++) g[y].push(x === 0 || y === 0 || x === w - 1 || y === h - 1 ? '#' : '.'); }
  const put = (c, x, y, what) => { if (x < 0 || y < 0 || x >= w || y >= h) throw new Error('out of map ' + c + x + ',' + y); if (g[y][x] !== '.') throw new Error('overlap at ' + x + ',' + y + ' (' + g[y][x] + ' vs ' + what + ') in ' + o.title); g[y][x] = c; };
  (o.hedge || []).forEach(([x, y, x2, y2]) => { for (let yy = y; yy <= (y2 == null ? y : y2); yy++) for (let xx = x; xx <= (x2 == null ? x : x2); xx++) put('#', xx, yy, 'hedge'); });
  (o.objs || []).forEach(([c, x, y, x2, y2]) => { for (let yy = y; yy <= (y2 == null ? y : y2); yy++) for (let xx = x; xx <= (x2 == null ? x : x2); xx++) put(c, xx, yy, c); });
  const ws = (o.words || []).map(([t, x, y]) => ({ t, x, y }));
  ws.forEach(q => put('*', q.x, q.y, q.t));
  const order = ws.slice().sort((a, b) => a.y - b.y || a.x - b.x);
  const map = g.map(r => r.join(''));
  const def = { title: o.title, gp: o.gp, hero: o.hero || 'BOY', tip: o.tip, hint: o.hint, words: order.map(q => q.t), chapter: o.chapter, map };
  ['intro', 'face', 'extra', 'sandbox'].forEach(k => { if (o[k] != null) def[k] = o[k]; });
  return def;
}
const BIG = {};

// ---- A. make a star -------------------------------------------------------------------------------------------
BIG.A = build({
  title: 'ほしを つくろう', gp: 'ないなら つくる!', chapter: 9, w: 17, h: 9,
  tip: '⭐ は かべに かこまれて いる! ドアも ないよ。ほしに さわる ほうほうは ほかに ある…?',
  hint: 'ROCK IS STAR で いわが ⭐ に なるよ。WALL IS LOW で かべを こえる ことも できる。',
  objs: [['B', 1, 4], ['W', 11, 2, 15, 2], ['W', 11, 6, 15, 6], ['W', 11, 3, 11, 5], ['W', 15, 3, 15, 5], ['S', 13, 4],
    ['o', 4, 3], ['o', 8, 6],
    ['f', 2, 1], ['f', 6, 1], ['f', 9, 2], ['f', 1, 6], ['f', 5, 7], ['f', 10, 5], ['f', 13, 1], ['f', 14, 7], ['f', 12, 7], ['f', 3, 5]],
  hedge: [[6, 4, 6, 5], [9, 7, 10, 7], [2, 2]],
  words: [['ROCK', 3, 2], ['IS', 6, 3], ['STAR', 4, 5], ['WALL', 8, 2], ['IS', 2, 6], ['LOW', 9, 5], ['DOG', 7, 6], ['CAN', 2, 4], ['SWIM', 9, 3], ['BIG', 5, 6], ['HOT', 3, 7]]
});

// ---- B. four gates, few words -------------------------------------------------------------------------------
BIG.B = build({
  title: 'ことばの やりくり', gp: 'AND で まとめよう', chapter: 9, w: 19, h: 10,
  tip: 'かわ、ひ、かべ、やま。ぜんぶ こえないと ⭐ に つけない! でも IS は ひとつだけ…。ことばを うまく つかおう!',
  hint: 'RIVER AND WALL AND MOUNTAIN ARE LOW と、FIRE IS COLD。ひとつの ことばで たくさんの ものを かえられるよ。I CAN CLIMB を つかう やりかたも ある。',
  objs: [['B', 1, 4], ['R', 9, 1, 9, 8], ['F', 11, 1, 11, 8], ['W', 13, 1, 13, 8], ['M', 15, 1, 15, 8], ['S', 17, 4],
    ['f', 1, 1], ['f', 1, 8], ['f', 3, 8], ['f', 5, 8], ['f', 8, 3], ['f', 8, 6], ['f', 10, 3], ['f', 10, 6], ['f', 12, 2], ['f', 12, 7], ['f', 14, 4], ['f', 14, 6], ['f', 16, 2], ['f', 16, 7], ['f', 17, 1], ['f', 17, 8], ['f', 1, 6]],
  hedge: [[3, 1]],
  words: [["RIVER",3,2],["AND",2,6],["WALL",4,5],["AND",3,5],["MOUNTAIN",2,4],["ARE",6,3],["LOW",2,7],["FIRE",3,7],["IS",5,7],["COLD",2,3],["I",4,7],["CAN",7,2],["CLIMB",6,5],["SWIM",4,3],["HOT",3,3]]
});

// ---- S. the big playground ----------------------------------------------------------------------------------
BIG.S = build({
  title: 'あそびば', gp: 'じゆうに ためそう', chapter: 10, sandbox: true, w: 21, h: 10,
  tip: 'ひろい あそびば! ことばを ならべて、なにが おこるか ためそう。⭐ への みちは いくつも あるよ。',
  hint: 'I CAN SWIM で かわを わたって、DOOR IS OPEN で ドアを あけよう。ほかにも ためしてみよう: ひ、こおり、かべ、き…どう すれば とおれる?',
  objs: [['B', 1, 4], ['o', 6, 5], ['R', 10, 1, 10, 8], ['K', 11, 2], ['o', 11, 7],
    ['F', 13, 1, 13, 2], ['W', 13, 3], ['D', 13, 4], ['W', 13, 5], ['I', 13, 6, 13, 7], ['T', 13, 8], ['S', 18, 4], ['d', 15, 2], ['c', 15, 6], ['m', 17, 7],
    ['f', 1, 1], ['f', 1, 8], ['f', 1, 6], ['f', 9, 2], ['f', 9, 7], ['f', 12, 4], ['f', 12, 6], ['f', 12, 1], ['f', 14, 4], ['f', 14, 8], ['f', 16, 1], ['f', 16, 5], ['f', 17, 3], ['f', 18, 7], ['f', 19, 1], ['f', 19, 8], ['f', 19, 5], ['f', 15, 4]],
  words: [["I",7,3],["CAN",5,1],["SWIM",8,2],["DOOR",8,7],["IS",5,4],["OPEN",3,5],["KEY",5,2],["IS",2,5],["ROCK",2,1],["WALL",7,5],["LOW",8,5],["IS",2,8],["RIVER",8,6],["FIRE",2,4],["COLD",2,2],["ICE",7,2],["HOT",8,8],["STAR",4,2],["DOG",4,6],["NOT",6,2]]
});
// ---- L. the lab -------------------------------------------------------------------------------------------------
BIG.L = build({
  title: 'ふしぎ ラボ', gp: 'じゆうに ためそう!', chapter: 10, sandbox: true, w: 19, h: 10,
  tip: 'ふしぎ ラボ! ⭐ は かべ・こおり・ひ・かわに かこまれて いる。ことばを ぜんぶ つかって、へんな ぶんを つくろう!',
  hint: 'FIRE IS COLD で ひが つめたく なって とおれるよ。ほかの ぶんも ためして みよう! (WALL IS LOW? ICE IS LOW? I CAN FLY?)',
  objs: [['B', 1, 4], ['W', 12, 2, 16, 2], ['I', 12, 6, 16, 6], ['F', 12, 3, 12, 5], ['R', 16, 3, 16, 5], ['S', 14, 4],
    ['o', 6, 5], ['o', 10, 7], ['T', 10, 2], ['T', 17, 1], ['T', 17, 8], ['d', 10, 4], ['c', 17, 4], ['K', 9, 1], ['f', 1, 1], ['f', 1, 8], ['f', 1, 6], ['f', 9, 3], ['f', 9, 6], ['f', 11, 1], ['f', 11, 8], ['f', 11, 3], ['f', 11, 6], ['f', 13, 4], ['f', 15, 4], ['f', 17, 2], ['f', 17, 7], ['f', 14, 8], ['f', 14, 1], ['f', 17, 3], ['f', 17, 6]],
  words: [["I",8,7],["CAN",4,7],["FLY",3,4],["SWIM",6,8],["NOT",6,3],["WALL",2,5],["IS",2,8],["FIRE",2,3],["COLD",4,3],["ICE",8,6],["HOT",7,5],["LOW",7,1],["STAR",2,6],["ROCK",8,5],["IS",5,5],["DOG",2,1],["RIVER",6,7],["AND",6,4],["ARE",5,7],["TREE",3,5],["IS",4,4],["NOT",7,2]]
});
BIG.SOL = { A: require('fs').readFileSync('/tmp/solA.txt','utf8').trim(), B: require('fs').readFileSync('/tmp/solB.txt','utf8').trim(), S: require('fs').readFileSync('/tmp/solS.txt','utf8').trim(), L: require('fs').readFileSync('/tmp/solL.txt','utf8').trim() };

// ---- D. the castle of walls -------------------------------------------------------------------------------------
BIG.D = build({
  title: 'かべの おしろ', gp: 'ことばを つなげる', chapter: 9, w: 19, h: 10,
  tip: 'ほしは かべの おしろの まんなか。かべは とおれない…。でも DOOR は ひとつ だけ。ことばを つなげて かんがえよう!',
  hint: 'WALL IS DOOR で かべが ぜんぶ ドアに なる。DOOR は ふたつの ぶんで つかえるよ (よこと たて)。DOOR IS OPEN で ドアが あく!',
  objs: [['B', 1, 4],
    ['W', 8, 2, 16, 2], ['W', 8, 7, 16, 7], ['W', 8, 3, 8, 6], ['W', 16, 3, 16, 6],
    ['W', 10, 3, 14, 3], ['W', 10, 6, 14, 6], ['W', 10, 4, 10, 5], ['W', 14, 4, 14, 5], ['S', 12, 4],
    ['f', 1, 1], ['f', 1, 8], ['f', 1, 6], ['f', 7, 1], ['f', 7, 8], ['f', 9, 4], ['f', 9, 5], ['f', 15, 4], ['f', 15, 5], ['f', 9, 3], ['f', 15, 6], ['f', 12, 1], ['f', 12, 8], ['f', 17, 2], ['f', 17, 7], ['f', 17, 4], ['f', 11, 4], ['f', 13, 5]],
  words: [["WALL",5,6],["IS",4,3],["IS",6,3],["DOOR",5,4],["OPEN",2,4],["BIG",4,7],["HOT",3,6],["COLD",5,7],["CAN",6,4],["SWIM",6,1],["I",3,5],["CLOSED",2,3]]
});
BIG.SOL.D = require('fs').readFileSync('/tmp/solD.txt','utf8').trim();
module.exports = { build, BIG };
