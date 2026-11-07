const WP=require('./engine.js');
function lv(W,H,words,objs){ // words:[[x,y,w]], objs:[[x,y,char]]
  const g=Array.from({length:H},(_,y)=>Array.from({length:W},(_,x)=>(x===0||y===0||x===W-1||y===H-1)?'#':'.'));
  objs.forEach(([x,y,c])=>g[y][x]=c);const ws=words.slice().sort((a,b)=>a[1]-b[1]||a[0]-b[0]);ws.forEach(([x,y])=>g[y][x]='*');
  return WP.parseLevel({title:'t',hero:'BOY',words:ws.map(w=>w[2]),map:g.map(r=>r.join(''))});}
let ok=0,bad=0;const t=(n,c)=>{console.log((c?'PASS ':'FAIL ')+n);c?ok++:bad++;};
const has=(st,ty)=>st.objs.some(o=>o.t===ty);
// 1: ROCK HAS KEY (row) + vertical ROCK IS NOT ROCK sharing the first ROCK
{const L=lv(10,8,[[2,2,'ROCK'],[3,2,'HAS'],[4,2,'KEY'],[2,3,'IS'],[2,4,'NOT'],[2,5,'ROCK']],[[1,1,'B'],[6,5,'o']]);
 t('1 ROCK IS NOT ROCK: rock vanishes',!has(L.st0,'ROCK'));
 t('1 ...and drops the KEY it HAS where it stood',L.st0.objs.some(o=>o.t==='KEY'&&o.x===6&&o.y===5));}
// 2: hero vanishes
{const L=lv(10,8,[[2,2,'BOY'],[3,2,'IS'],[4,2,'NOT'],[5,2,'BOY']],[[1,1,'B']]);
 t('2 BOY IS NOT BOY: you vanish (nobody to move)',WP.youCount(L,L.st0)===0&&!WP.isWin(L,L.st0));}
// 3: AM mode — I AM NOT BOY beats I AM BOY
{const L=lv(10,8,[[2,2,'I'],[3,2,'AM'],[4,2,'BOY'],[2,4,'I'],[3,4,'AM'],[4,4,'NOT'],[5,4,'BOY']],[[1,1,'B']]);
 const R=WP.rulesOf(L,L.st0);
 t('3 I AM NOT BOY beats I AM BOY (boy not you)',R.sentences.some(s=>s.text==='I AM NOT BOY')&&WP.youCount(L,L.st0)===0);}
// 4: NOT cancels a transformation
{const L=lv(11,8,[[2,2,'ROCK'],[3,2,'IS'],[4,2,'KEY'],[2,4,'ROCK'],[3,4,'IS'],[4,4,'NOT'],[5,4,'KEY']],[[1,1,'B'],[7,5,'o']]);
 t('4 ROCK IS NOT KEY cancels ROCK IS KEY',has(L.st0,'ROCK')&&!has(L.st0,'KEY'));
 const L2=lv(11,8,[[2,2,'ROCK'],[3,2,'IS'],[4,2,'KEY']],[[1,1,'B'],[7,5,'o']]);
 t('4b control: without NOT the rock becomes a key',!has(L2.st0,'ROCK')&&has(L2.st0,'KEY'));}
// 5: NOT removes a natural default
{const L=lv(10,8,[[2,2,'WALL'],[3,2,'IS'],[4,2,'NOT'],[5,2,'BIG']],[[1,1,'B'],[6,5,'W']]);
 const R=WP.rulesOf(L,L.st0);
 t('5 WALL IS NOT BIG: wall loses natural BIG',!WP.eff(R,'WALL').p.has('BIG'));
 const L0=lv(10,8,[[2,2,'WALL'],[3,2,'IS'],[5,2,'BIG']],[[1,1,'B'],[6,5,'W']]);
 t('5b control: plain wall is BIG',WP.eff(WP.rulesOf(L0,L0.st0),'WALL').p.has('BIG'));}
// 6: NOT beats the positive sentence (NOT SMALL vs SMALL)
{const L=lv(11,8,[[2,2,'ROCK'],[3,2,'IS'],[4,2,'SMALL'],[2,4,'ROCK'],[3,4,'IS'],[4,4,'NOT'],[5,4,'SMALL']],[[1,1,'B'],[7,5,'o']]);
 t('6 ROCK IS NOT SMALL beats ROCK IS SMALL',!WP.eff(WP.rulesOf(L,L.st0),'ROCK').p.has('SMALL'));}
// 7: misplaced NOT is not a sentence and does not crash
{const L=lv(10,8,[[2,2,'WALL'],[3,2,'NOT'],[4,2,'IS'],[5,2,'BIG']],[[1,1,'B'],[6,5,'W']]);
 t('7 WALL NOT IS BIG is rejected',WP.rulesOf(L,L.st0).sentences.length===0);
 const L2=lv(10,8,[[2,2,'DOG'],[3,2,'CAN'],[4,2,'NOT'],[5,2,'SWIM']],[[1,1,'B']]);
 t('7b DOG CAN NOT SWIM is rejected (use CAN\'T)',WP.rulesOf(L2,L2.st0).sentences.length===0);}
// 8: Japanese strings exist for every NOT form
{const L=lv(10,8,[[2,2,'WALL'],[3,2,'IS'],[4,2,'NOT'],[5,2,'BIG']],[[1,1,'B'],[6,5,'W']]);
 const s=WP.rulesOf(L,L.st0).sentences[0];t('8 JP: '+WP.sentenceJP(s),/おおきく ない/.test(WP.sentenceJP(s)));}
console.log(ok+' pass, '+bad+' fail');
