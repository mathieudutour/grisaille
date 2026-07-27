"use strict";
/* ============================================================
   GRISAILLE — playable slice, v3
   Hub → raids (bays → archive → objective) → back to the hub.

   Arc: Prologue (The Inventory) → Vermilion's cold forge
      → Ultramarine's flooded hatch → Orpiment's buried vault
      → resonance reveals the Purple Kiln → the Firing → birth
      → the Processing Floors (endless).

   Rendering: procedural watercolor on paper. No image assets.
   Systems from the design doc:
     §3.3 Payne is the darkest thing on screen, always
     §3.4 fissure glow IS the charge meter
     §3.6 stains are permanent but dry (hub stains persist forever)
     §4   shape signatures always legible; color is preattentive
     §7.2 pigment economy + cross-harvest (own-color resistance)
     §7.3 swatches: per-run buffs to one slot of one color
     §7.5 raid structure: bays, archives, the objective room
     §7.6 the Firing: only the mix feeds the kiln
     §7.7 death is re-shelving; Working Stock floor
     §8   two slots: delivery × payload, colors mix in the barrel
     §9   resonance: the mix is the key, not the reward
   ============================================================ */

const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
let W=0,H=0,DPR=1;
function resize(){
  DPR = Math.min(window.devicePixelRatio||1, 2);
  W = window.innerWidth; H = window.innerHeight;
  cv.width = W*DPR; cv.height = H*DPR;
  cv.style.width = W+'px'; cv.style.height = H+'px';
  makePaper(); resizeStains();
}
window.addEventListener('resize', resize);

/* ---------- deterministic noise ---------- */
function h1(n){ const s = Math.sin(n*127.1+311.7)*43758.5453; return s-Math.floor(s); }
function h2(a,b){ return h1(a*157.31+b*61.7); }
const rand=(a,b)=>a+Math.random()*(b-a);

/* ---------- palette ---------- */
const PAPER   = [233,226,211];
const INK     = [58,53,44];
const PAYNE   = [38,33,30];
function css(c,a=1){ return `rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`; }
function mix(a,b,t){ return [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t]; }
function dark(c,f){ return [c[0]*f,c[1]*f,c[2]*f]; }

/* the colors of the world — live hue, matte stain ceiling (§3.6),
   and the grey each wears while still in storage */
const COLORS = {
  grey:{ live:[105,98,88],  stain:[128,122,112], grey:[105,98,88],
         warden:'—', tool:'STUMP',  payload:'TRACE', glow:[180,172,158] },
  red: { live:[186,52,36],  stain:[150,86,74],   grey:[138,130,118],
         warden:'VERMILION', tool:'BRUSH', payload:'BURN', glow:[255,90,50] },
  blue:{ live:[44,86,148],  stain:[96,112,140],  grey:[124,127,132],
         warden:'ULTRAMARINE', tool:'ROLLER', payload:'CHILL', glow:[90,140,255] },
  yellow:{ live:[204,156,26], stain:[176,150,86], grey:[141,137,124],
         warden:'ORPIMENT', tool:'QUILL', payload:'CHAIN', glow:[255,215,80] },
  /* purple is never liberated — it is FIRED at the kiln (§2.4, §7.6) */
  purple:{ live:[118,62,132], stain:[122,96,130], grey:[126,123,128],
         warden:'TYRIAN', tool:'COMPASS', payload:'SINGULARITY', glow:[210,130,255] },
};
const COLOR_ORDER=['red','blue','yellow','purple'];

/* ---------- liberation state (persistent, §6) ---------- */
const lib = { red:{on:false,t:0}, blue:{on:false,t:0}, yellow:{on:false,t:0}, purple:{on:false,t:0} };
function tint(c){ if(c==='grey') return COLORS.grey.live;
  return mix(COLORS[c].grey, COLORS[c].live, lib[c].t); }
function stainTint(c){ if(c==='grey') return COLORS.grey.stain;
  return mix([150,145,135], COLORS[c].stain, lib[c].t); }
function ownedColors(){ return COLOR_ORDER.filter(c=>lib[c].on); }

const SAVE_KEY='grisaille-save-v1';
function save(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify({
  red:lib.red.on, blue:lib.blue.on, yellow:lib.yellow.on, purple:lib.purple.on,
  resonance })); }catch(e){} }
function loadSave(){ try{ return JSON.parse(localStorage.getItem(SAVE_KEY)||'null'); }catch(e){ return null; } }

/* ---------- paper (cached) ---------- */
let paper=null;
function makePaper(){
  paper = document.createElement('canvas');
  paper.width = W*DPR; paper.height = H*DPR;
  const p = paper.getContext('2d');
  p.scale(DPR,DPR);
  p.fillStyle = css(PAPER); p.fillRect(0,0,W,H);
  for(let i=0;i<60;i++){
    const x=h1(i*3)*W, y=h1(i*3+1)*H, r=40+h1(i*3+2)*160;
    const g=p.createRadialGradient(x,y,0,x,y,r);
    const v = h1(i)>.5 ? 255 : 90;
    g.addColorStop(0,`rgba(${v},${v-10},${v-30},${.028})`);
    g.addColorStop(1,'rgba(0,0,0,0)');
    p.fillStyle=g; p.fillRect(x-r,y-r,r*2,r*2);
  }
  p.strokeStyle='rgba(120,110,95,.05)'; p.lineWidth=.6;
  for(let i=0;i<450;i++){
    const x=h1(i*7)*W, y=h1(i*7+2)*H, a=h1(i*7+4)*Math.PI, l=3+h1(i*7+5)*9;
    p.beginPath(); p.moveTo(x,y); p.lineTo(x+Math.cos(a)*l, y+Math.sin(a)*l); p.stroke();
  }
  const gr=p.createImageData(160,160);
  for(let i=0;i<gr.data.length;i+=4){
    const v=(Math.random()*38)|0;
    gr.data[i]=v; gr.data[i+1]=v; gr.data[i+2]=v; gr.data[i+3]=14;
  }
  const gc=document.createElement('canvas'); gc.width=160; gc.height=160;
  gc.getContext('2d').putImageData(gr,0,0);
  p.globalCompositeOperation='multiply';
  p.fillStyle=p.createPattern(gc,'repeat'); p.fillRect(0,0,W,H);
  p.globalCompositeOperation='source-over';
  p.strokeStyle='rgba(58,53,44,.06)'; p.lineWidth=1;
  const cell=64;
  for(let x=cell;x<W;x+=cell){ p.beginPath(); p.moveTo(x,0); p.lineTo(x,H); p.stroke(); }
  for(let y=cell;y<H;y+=cell){ p.beginPath(); p.moveTo(0,y); p.lineTo(W,y); p.stroke(); }
}

/* ---------- persistent stains (§3.6) ----------
   The hub layer persists forever — the save file you can look at.
   Each raid bay gets a fresh layer; it is that room's painting. */
let hubStains=null, roomStains=null;
function makeLayer(old){
  const c=document.createElement('canvas');
  c.width=W*DPR; c.height=H*DPR;
  const g=c.getContext('2d'); g.scale(DPR,DPR);
  if(old) g.drawImage(old,0,0,W,H);
  return c;
}
function resizeStains(){
  hubStains=makeLayer(hubStains);
  roomStains=makeLayer(roomStains);
}
function clearRoomStains(){
  roomStains=makeLayer(null);
}
function activeStains(){ return mode==='raid' ? roomStains : hubStains; }
function splat(x,y,t,size,alpha){
  const g=activeStains().getContext('2d');
  const n=5+(h1(x+y)*4|0);
  for(let i=0;i<n;i++){
    const a=h2(x+i,y)*Math.PI*2, d=h2(y+i,x)*size*.8;
    const px=x+Math.cos(a)*d, py=y+Math.sin(a)*d, r=size*(.35+h2(i,x+y)*.65);
    g.beginPath();
    blobPath(g, px,py, r, 9, (x*13+y*7+i*31)|0, .45);
    g.fillStyle=css(t, alpha*(0.5+h1(i+x)*0.5));
    g.fill();
  }
}

/* ---------- boiling-line drawing kit ---------- */
let boilFrame=0;
function jit(seed,i,amp){ return (h2(seed+i*17, boilFrame*911)-.5)*2*amp; }

function blobPath(c,x,y,r,pts,seed,rough){
  for(let i=0;i<=pts;i++){
    const k=i%pts, a=(k/pts)*Math.PI*2;
    const rr=r*(1-rough/2+h2(seed,k)*rough)+jit(seed,k,r*.06);
    const px=x+Math.cos(a)*rr, py=y+Math.sin(a)*rr;
    i===0?c.moveTo(px,py):c.lineTo(px,py);
  }
  c.closePath();
}

/* jagged shard star — red's shape signature (§11.2) */
function shardPath(c,x,y,r,rot,seed,squash){
  const pts=7;
  for(let i=0;i<=pts*2;i++){
    const k=i%(pts*2);
    const a=rot+(k/(pts*2))*Math.PI*2;
    const base=(k%2===0)? r : r*(.38+h2(seed,k)*.2);
    const rr=base+jit(seed,k,r*.09);
    const px=x+Math.cos(a)*rr, py=y+Math.sin(a)*rr*(squash||1);
    i===0?c.moveTo(px,py):c.lineTo(px,py);
  }
  c.closePath();
}

/* flowing layered strata — blue's shape signature (§11.2) */
function strataPath(c,x,y,r,rot,seed){
  const pts=14;
  for(let i=0;i<=pts;i++){
    const k=i%pts, a=(k/pts)*Math.PI*2;
    const wave=Math.sin(a*3+rot*2+seed)*r*.18;
    const rx=r*1.35, ry=r*.72;
    const rr=1-.12+h2(seed,k)*.24;
    const px=x+Math.cos(a)*rx*rr, py=y+Math.sin(a)*ry*rr+wave+jit(seed,k,r*.05);
    i===0?c.moveTo(px,py):c.lineTo(px,py);
  }
  c.closePath();
}

/* radiant spines — yellow's shape signature (§11.2) */
function spinePath(c,x,y,r,rot,seed){
  const pts=10;
  for(let i=0;i<=pts*2;i++){
    const k=i%(pts*2);
    const a=rot+(k/(pts*2))*Math.PI*2;
    const base=(k%2===0)? r*(0.9+h2(seed,k)*.3) : r*.18;
    const rr=base+jit(seed,k,r*.07);
    const px=x+Math.cos(a)*rr, py=y+Math.sin(a)*rr;
    i===0?c.moveTo(px,py):c.lineTo(px,py);
  }
  c.closePath();
}

/* watercolor fill + misregistered boiling outline */
function watercolor(c, pathFn, fill, edge, seed, opts={}){
  const mis = opts.mis ?? 2.5;
  const mx = jit(seed,101,1)+Math.cos(seed)*mis;
  const my = jit(seed,102,1)+Math.sin(seed*1.7)*mis;
  c.save(); c.translate(mx,my);
  c.beginPath(); pathFn(c,seed);
  c.fillStyle=css(fill, opts.a1 ?? .38); c.fill();
  c.beginPath(); pathFn(c,seed+7);
  c.fillStyle=css(fill, opts.a2 ?? .3); c.fill();
  c.beginPath(); pathFn(c,seed);
  c.strokeStyle=css(dark(fill,.72), .4); c.lineWidth=opts.edgeW ?? 3; c.stroke();
  c.restore();
  c.beginPath(); pathFn(c,seed+13);
  c.strokeStyle=css(edge, opts.lineA ?? .8); c.lineWidth=opts.lineW ?? 1.4; c.stroke();
}

/* ============================================================
   AUDIO — tiny procedural blips
   ============================================================ */
let AC=null;
function audioOn(){ if(!AC){ try{ AC=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} }
  if(AC&&AC.state==='suspended') AC.resume(); }
function blip(f,dur,type,vol){
  if(!AC) return;
  const o=AC.createOscillator(), g=AC.createGain();
  o.type=type||'triangle'; o.frequency.value=f;
  g.gain.setValueAtTime(vol||.05,AC.currentTime);
  g.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+dur);
  o.connect(g); g.connect(AC.destination);
  o.start(); o.stop(AC.currentTime+dur);
}

/* ============================================================
   WORLD STATE
   ============================================================ */
let mode='title';           // title | hub | raid
let raid=null;              // { act, room, state, endless }
let hubDoors=[];            // entrances in the hub
let door=null;              // exit door of a cleared bay
let kiln=null, kilnTemp=0;
let resonance=0;
const RES_MAX=12;
let killsTotal=0;
let timescale=1, cineT=0;
let reshelving=0, reportT=0, returnT=0;

let crates=[];
function makeCrates(){
  crates=[];
  const n = W<700?4:6;
  for(let i=0;i<n;i++){
    crates.push({ x:rand(W*.12,W*.88), y:rand(H*.15,H*.85),
      w:rand(50,110), h:rand(40,90), seed:(Math.random()*9999)|0 });
  }
}
let motes=[];
function makeMotes(){
  motes=[];
  for(let i=0;i<(W<700?26:42);i++){
    motes.push({ x:rand(0,W), y:rand(0,H), a:rand(0,7),
      s:rand(.10,.32), r:rand(2.2,3.4), seed:i*31 });
  }
}

/* Payne, sediment */
const player={ x:0,y:0, r:15, aim:0, hits:0, maxHits:6, fireT:0, seed:555,
  inv:0, dashT:0, dashCd:0, dashA:0,
  heat:0, overheated:false, qT:0, beamT:0, beamA:0,
  charge:{red:1, blue:1, yellow:1, purple:1} };

/* fissure network across Payne's back — each seam is one color's meter (§3.4) */
const fissures=[];
(function(){
  for(let f=0;f<4;f++){
    const line=[]; let a=rand(0,Math.PI*2), x=rand(-4,4), y=rand(-4,4);
    for(let s=0;s<5;s++){
      line.push([x,y]);
      a+=rand(-.9,.9); x+=Math.cos(a)*5.5; y+=Math.sin(a)*5.5;
    }
    fissures.push(line);
  }
})();

/* the two-slot weapon (§8.2) */
const slots={ delivery:'grey', payload:'grey' };

let enemies=[], ebullets=[], pbullets=[], drops=[], pulses=[], arcs=[], shake=0;
let interactable=null;      // the objective in the current room
let swatchDrops=[];         // the archive's offering
let swatches=[];            // the per-run build (§7.3)

/* ============================================================
   ENEMIES — the Conservation Staff, then the guilds
   ============================================================ */
function spawnPoint(edge){
  const m=40;
  if(edge){ const s=Math.random()*4|0;
    return [ s===0?-m : s===1?W+m : rand(0,W),
             s===2?-m : s===3?H+m : rand(0,H) ];
  }
  let x,y,tries=0;
  do{ x=rand(m,W-m); y=rand(m,H-m); tries++; }
  while(Math.hypot(x-player.x,y-player.y)<220 && tries<30);
  return [x,y];
}

function spawnEnemy(type,edge,px,py){
  const [x,y]= px!==undefined ? [px,py] : spawnPoint(edge);
  const base={ x,y, rot:rand(0,7), spin:rand(-.8,.8), seed:(Math.random()*9999)|0,
    hurt:0, burn:0, chill:0, frozen:0, contactCd:0, type };
  if(type==='plaster') Object.assign(base,{ faction:'grey', r:10, hp:2, speed:rand(64,86) });
  if(type==='husk')    Object.assign(base,{ faction:'grey', r:22, hp:16, speed:20, fireT:rand(2,4) });
  if(type==='shard')   Object.assign(base,{ faction:'red',  r:rand(14,19), hp:7, fireT:rand(1,3),
                          orbit:rand(170,300), dir:Math.random()<.5?1:-1 });
  if(type==='strata')  Object.assign(base,{ faction:'blue', r:18, hp:12, speed:34,
                          fireT:rand(2,4), ph:rand(0,7) });
  if(type==='spine')   Object.assign(base,{ faction:'yellow', r:14, hp:8, speed:46,
                          aimT:rand(1.5,3), locked:null, lockT:0 });
  if(type==='spiral')  Object.assign(base,{ faction:'purple', r:16, hp:10, speed:30,
                          fireT:rand(2,4), ph:rand(0,3.8), phased:false });
  enemies.push(base);
  return base;
}
function spawnSet(set){
  for(const t in set) for(let i=0;i<set[t];i++) spawnEnemy(t,false);
}

/* waves are only maintained during the Firing (§7.6) — bays are clear-based */
function desiredRoster(){
  const small = W<700;
  if(raid && raid.state==='firing') return { shard: small?4:5, strata: small?4:5 };
  if(raid && raid.state==='birth')  return { shard:2, strata:2 };
  return null;
}
function maintainWaves(){
  const want=desiredRoster();
  if(!want) return;
  const have={};
  for(const e of enemies) have[e.type]=(have[e.type]||0)+1;
  for(const t in want){
    let n=(want[t]||0)-(have[t]||0);
    while(n-->0) spawnEnemy(t,true);
  }
}

/* ============================================================
   INPUT — keyboard/mouse + twin-stick touch
   ============================================================ */
const keys={};
addEventListener('keydown',e=>{
  const k=e.key.toLowerCase();
  keys[k]=true;
  if(k==='q') cycleSlot('delivery');
  if(k==='e') cycleSlot('payload');
  if(k===' ') { dash(); e.preventDefault(); }
});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
let mouse={x:0,y:0,down:false};
cv.addEventListener('mousemove',e=>{mouse.x=e.clientX;mouse.y=e.clientY;});
cv.addEventListener('mousedown',()=>{mouse.down=true; audioOn();});
addEventListener('mouseup',()=>mouse.down=false);

let moveTouch=null, aimTouch=null;
cv.addEventListener('touchstart',e=>{
  audioOn(); document.body.classList.add('touch');
  for(const t of e.changedTouches){
    if(t.clientX<W/2 && !moveTouch) moveTouch={id:t.identifier,ox:t.clientX,oy:t.clientY,x:t.clientX,y:t.clientY};
    else if(!aimTouch) aimTouch={id:t.identifier,x:t.clientX,y:t.clientY};
  }
  e.preventDefault();
},{passive:false});
cv.addEventListener('touchmove',e=>{
  for(const t of e.changedTouches){
    if(moveTouch&&t.identifier===moveTouch.id){moveTouch.x=t.clientX;moveTouch.y=t.clientY;}
    if(aimTouch&&t.identifier===aimTouch.id){aimTouch.x=t.clientX;aimTouch.y=t.clientY;}
  }
  e.preventDefault();
},{passive:false});
addEventListener('touchend',e=>{
  for(const t of e.changedTouches){
    if(moveTouch&&t.identifier===moveTouch.id) moveTouch=null;
    if(aimTouch&&t.identifier===aimTouch.id) aimTouch=null;
  }
});

function dash(){
  if(player.dashCd>0 || mode==='title' || reshelving>0) return;
  let mx=0,my=0;
  if(keys['w']||keys['arrowup'])my--; if(keys['s']||keys['arrowdown'])my++;
  if(keys['a']||keys['arrowleft'])mx--; if(keys['d']||keys['arrowright'])mx++;
  if(moveTouch){
    const dx=moveTouch.x-moveTouch.ox, dy=moveTouch.y-moveTouch.oy, d=Math.hypot(dx,dy);
    if(d>8){ mx=dx/d; my=dy/d; }
  }
  if(!mx&&!my){ mx=Math.cos(player.aim); my=Math.sin(player.aim); }
  const l=Math.hypot(mx,my);
  player.dashA=Math.atan2(my/l,mx/l);
  player.dashT=.18; player.dashCd=1.1; player.inv=Math.max(player.inv,.3);
  blip(180,.09,'sine',.03);
}

/* ============================================================
   SWATCHES — the per-run build (§7.3)
   ============================================================ */
const SWATCH_POOL=[
  { id:'brush_pierce', color:'red',    slot:'delivery', name:'cinnabar grind',
    desc:'brush dabs pierce' },
  { id:'burn_long',    color:'red',    slot:'payload',  name:'slow roast',
    desc:'burn lasts longer' },
  { id:'splash_big',   color:'blue',   slot:'delivery', name:'heavy body',
    desc:'roller splash wider' },
  { id:'chill_fast',   color:'blue',   slot:'payload',  name:'deep chill',
    desc:'chill stacks faster' },
  { id:'quill_cool',   color:'yellow', slot:'delivery', name:'tempered nib',
    desc:'quill overheats slower' },
  { id:'chain_more',   color:'yellow', slot:'payload',  name:'long arc',
    desc:'chain jumps further' },
  { id:'bolt_dmg',     color:'purple', slot:'delivery', name:'true north',
    desc:'compass hits harder' },
  { id:'sing_wide',    color:'purple', slot:'payload',  name:'event horizon',
    desc:'singularity pulls wider' },
];
function sw(id){ return swatches.find(s=>s.id===id)||null; }
function swMag(id,base,perm,fug){
  const s=sw(id); return !s ? base : (s.fugitive ? fug : perm);
}
function offerSwatches(){
  swatchDrops=[];
  const owned=ownedColors();
  const pool=SWATCH_POOL.filter(p=>owned.includes(p.color) && !sw(p.id));
  for(let i=pool.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [pool[i],pool[j]]=[pool[j],pool[i]]; }
  const n=Math.min(3,pool.length);
  for(let i=0;i<n;i++){
    swatchDrops.push({ def:pool[i], fugitive:Math.random()<.4,
      x:W/2+(i-(n-1)/2)*120, y:H/2, seed:(Math.random()*999)|0 });
  }
}
function pickSwatch(sd){
  swatches.push({ id:sd.def.id, name:sd.def.name, color:sd.def.color,
    fugitive:sd.fugitive, life:sd.fugitive?100:Infinity });
  splat(sd.x,sd.y,stainTint(sd.def.color),8,.14);
  swatchDrops=[];               // the rest are re-filed
  blip(660,.15,'sine',.05); blip(880,.2,'sine',.04);
  updateWeaponHud();
}
function updateSwatches(dt){
  let changed=false;
  for(const s of swatches){
    if(s.fugitive){ s.life-=dt; if(s.life<=0) changed=true; }
  }
  if(changed){
    swatches=swatches.filter(s=>s.life>0);   // fugitive pigment fades in the light
    blip(300,.3,'sine',.04);
    updateWeaponHud();
  }
}

/* ============================================================
   THE WEAPON — two slots, any color (§8)
   ============================================================ */
const DELIVERY={
  grey:  { rate:7,  cost:0 },
  red:   { rate:10, cost:.012 }, // Brush — rapid stream, short range
  blue:  { rate:2.3,cost:.035 }, // Roller — arcing lob, splash
  yellow:{ rate:0,  cost:.006 }, // Quill — hitscan beam, overheats (cost per tick)
  purple:{ rate:3.5,cost:.028 }, // Compass — phase bolt, pierces a line
};
function cycleSlot(which){
  const own=ownedColors();
  if(own.length<2 || mode==='title') return;
  const cur=slots[which], i=own.indexOf(cur);
  slots[which]=own[(i+1)%own.length];
  blip(which==='delivery'?300:380,.06,'sine',.035);
  updateWeaponHud();
}
function chargeOk(c){ return c==='grey' || player.charge[c]>0.02; }
function drainFor(shot){
  const d=slots.delivery, p=slots.payload;
  if(d!=='grey') player.charge[d]=Math.max(0,player.charge[d]-shot.dCost);
  if(p!=='grey'&&chargeOk(p)) player.charge[p]=Math.max(0,player.charge[p]-shot.pCost);
}
function bulletColor(){
  const d=tint(slots.delivery);
  const p=chargeOk(slots.payload)? tint(slots.payload) : COLORS.grey.live;
  return mix(d,p,.5);   // §12: red emitter + blue payload renders purple automatically
}
function fireWeapon(){
  const d=slots.delivery;
  if(!chargeOk(d)) { blip(90,.05,'square',.015); player.fireT=.25; return; }
  const spec=DELIVERY[d];
  player.fireT=1/spec.rate;
  const mono = d!=='grey' && d===slots.payload;
  const col=bulletColor();
  if(d==='blue'){
    // Roller: lob to the aim point, splash on landing
    const maxR=360;
    let tx=mouse.x, ty=mouse.y;
    if(aimTouch){ tx=aimTouch.x; ty=aimTouch.y; }
    const dist=Math.min(maxR,Math.hypot(tx-player.x,ty-player.y)||1);
    const a=player.aim;
    pbullets.push({ kind:'lob', x:player.x, y:player.y,
      sx:player.x, sy:player.y,
      tx:player.x+Math.cos(a)*dist, ty:player.y+Math.sin(a)*dist,
      t:0, T:.62, dmg:mono?5:3, splash:60*swMag('splash_big',1,1.45,1.8), col, mono,
      dCost:mono?spec.cost*2:spec.cost, pCost:.02, seed:(Math.random()*999)|0 });
    blip(150,.1,'sine',.03);
  } else if(d==='purple'){
    const a=player.aim+rand(-.03,.03);
    pbullets.push({ kind:'bolt', x:player.x+Math.cos(a)*16, y:player.y+Math.sin(a)*16,
      vx:Math.cos(a)*620, vy:Math.sin(a)*620,
      life:.5, dmg:(mono?2.2:1.3)*swMag('bolt_dmg',1,1.6,2), col, mono, hitList:[],
      dCost:mono?spec.cost*2:spec.cost, pCost:.01, seed:(Math.random()*999)|0 });
    blip(500,.07,'sine',.025);
  } else {
    const spread = d==='red'?.09:.05;
    const a=player.aim+rand(-spread,spread);
    const life = d==='red'?.6:1.4;
    const pierce = d==='red' ? swMag('brush_pierce',1,2,3) : 1;
    pbullets.push({ kind:'dab', x:player.x+Math.cos(a)*16, y:player.y+Math.sin(a)*16,
      vx:Math.cos(a)*(d==='red'?460:430), vy:Math.sin(a)*(d==='red'?460:430),
      life, dmg:mono?1.7:1, col, mono, pierce, hitList:[],
      dCost:mono?spec.cost*2:spec.cost, pCost:.008, seed:(Math.random()*999)|0 });
    blip(d==='grey'?240:330,.05,'square',.02);
  }
  drainFor(pbullets[pbullets.length-1]);
}

/* the Quill (§8.3): instant beam, pierces the room, overheats fast */
function quill(dt){
  if(player.overheated || !chargeOk('yellow')){ if(!chargeOk('yellow')) blip(90,.04,'square',.01); return; }
  player.qT-=dt;
  if(player.qT>0) return;
  player.qT=.08;
  const mono = slots.payload==='yellow';
  player.beamT=.09; player.beamA=player.aim;
  const len=560;
  const x1=player.x, y1=player.y, x2=x1+Math.cos(player.aim)*len, y2=y1+Math.sin(player.aim)*len;
  const dmg=(mono?.9:.55);
  for(const e of enemies){
    if(e.dead||e.phased) continue;
    // distance from enemy to beam segment
    const t=Math.max(0,Math.min(1,((e.x-x1)*(x2-x1)+(e.y-y1)*(y2-y1))/(len*len)));
    const px=x1+(x2-x1)*t, py=y1+(y2-y1)*t;
    if(Math.hypot(e.x-px,e.y-py)<e.r){
      hitEnemy(e,{kind:'ray', dmg, x:px, y:py});
    }
  }
  player.heat=Math.min(1, player.heat+.07*swMag('quill_cool',1,.55,.35));
  if(player.heat>=1){ player.overheated=true; blip(70,.4,'sawtooth',.04); }
  const cost=mono?DELIVERY.yellow.cost*2:DELIVERY.yellow.cost;
  player.charge.yellow=Math.max(0,player.charge.yellow-cost);
  if(slots.payload!=='grey'&&slots.payload!=='yellow'&&chargeOk(slots.payload))
    player.charge[slots.payload]=Math.max(0,player.charge[slots.payload]-.004);
  blip(880+player.heat*300,.03,'square',.012);
}

/* payload on-hit effects (§8.4) */
function applyPayload(e,strong,hx,hy,emitPulse=true){
  const p=slots.payload;
  if(p==='grey'||!chargeOk(p)) return;
  if(p==='red'){ e.burn=Math.max(e.burn, swMag('burn_long',2.5,4,5.5)); }
  if(p==='blue'){
    e.chill=Math.min(5, e.chill+(strong?2:1)+swMag('chill_fast',0,1,2));
    if(e.chill>=5 && e.frozen<=0){ e.frozen=1.3; blip(700,.15,'sine',.04); }
  }
  if(p==='purple' && emitPulse) singularity(hx,hy);
}
function singularity(x,y){
  pulses.push({x,y,t:.35,r:130*swMag('sing_wide',1,1.55,2)});
  blip(240,.14,'sine',.03);
}
/* the Chain (§8.4): arcs to nearby targets */
function chainFrom(e,dmg){
  const jumps=2+swMag('chain_more',0,2,3);
  const range=130+swMag('chain_more',0,40,60);
  const targets=enemies
    .filter(o=>!o.dead&&!o.phased&&o!==e&&Math.hypot(o.x-e.x,o.y-e.y)<range)
    .sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y))
    .slice(0,jumps);
  for(const o of targets){
    arcs.push({x1:e.x,y1:e.y,x2:o.x,y2:o.y,t:.12,seed:(Math.random()*999)|0});
    o.hp-=dmg*.5*dmgMult(o); o.hurt=1;
    if(o.hp<=0) killEnemy(o);
  }
  if(targets.length) blip(1200,.05,'square',.02);
}

/* own-color resistance (§11.1) — the cross-harvest driver */
function dmgMult(e){
  let m=1;
  if(slots.delivery===e.faction) m*=.45;
  if(slots.payload===e.faction && slots.payload!=='grey') m*=.45;
  if(e.frozen>0) m*=1.5;
  return m;
}

function hitEnemy(e,b){
  const dmg=b.dmg*dmgMult(e);
  e.hp-=dmg; e.hurt=1;
  // a lob emits one pulse at its landing point instead of one per enemy caught
  applyPayload(e, b.kind==='lob', b.x, b.y, b.kind!=='lob');
  if(slots.payload==='yellow'&&chargeOk('yellow')) chainFrom(e,b.dmg);
  splat(b.x,b.y,stainTint(slots.payload!=='grey'?slots.payload:slots.delivery),4.5,.09);
  blip(dmgMult(e)<1?260:420,.04,'triangle',.02);
  if(e.hp<=0) killEnemy(e);
}
function killEnemy(e){
  if(e.dead) return;
  e.dead=true;
  killsTotal++;
  splat(e.x,e.y,stainTint(e.faction),e.r*1.5,.16);
  shake=Math.max(shake,.15);
  blip(560,.12,'triangle',.04);
  if(e.frozen>0){ splat(e.x,e.y,stainTint('blue'),e.r*2,.12); blip(880,.2,'sine',.04); }
  // burn spreads on death (§8.4)
  if(e.burn>0) for(const o of enemies)
    if(!o.dead && o!==e && Math.hypot(o.x-e.x,o.y-e.y)<70) o.burn=Math.max(o.burn,2);
  // the pigment economy (§7.2): factions drop their own color
  if(e.faction!=='grey' && lib[e.faction].on){
    for(let i=0;i<3;i++)
      drops.push({x:e.x+rand(-10,10), y:e.y+rand(-10,10), color:e.faction, life:9, seed:i*7+e.seed});
  } else if(e.faction==='grey' && ownedColors().length && Math.random()<.25){
    const c=ownedColors()[Math.random()*ownedColors().length|0];
    drops.push({x:e.x, y:e.y, color:c, life:9, seed:e.seed});
  }
  // resonance (§9): purple-tinted kills reveal the kiln
  if(isMixedRB() && !lib.purple.on){
    resonance=Math.min(RES_MAX,resonance+1); save();
    if(resonance>=RES_MAX && mode==='hub') buildHub();
  }
  // the Firing (§7.6): only kills made with the target mix feed the kiln
  if(raid && raid.state==='firing' && isMixedRB()){
    kilnTemp=Math.min(1,kilnTemp+.075);
    blip(620,.08,'sine',.03);
  }
  // the birth phase ends when the player survives their own creation
  if(e.birth && !enemies.some(o=>o!==e && !o.dead && o.birth)){
    liberate('purple');
    if(kiln){ splat(kiln.x,kiln.y,stainTint('purple'),44,.2); }
    if(raid) raid.state='done';
    returnT=3;
  }
}
function isMixedRB(){
  return (slots.delivery==='red'&&slots.payload==='blue') ||
         (slots.delivery==='blue'&&slots.payload==='red');
}

/* ============================================================
   HUD — the paperwork
   ============================================================ */
const reportEl=document.getElementById('report');
const stampEl=document.getElementById('stamp');
const formEl=document.getElementById('form'), formText=document.getElementById('formText');
const weaponEl=document.getElementById('weapon');
const comboEl=document.getElementById('comboName');
const slotDEl=document.getElementById('slotD'), slotPEl=document.getElementById('slotP');
const heatWrap=document.getElementById('heatWrap'), heatBar=document.getElementById('heatBar');
const swatchListEl=document.getElementById('swatchList');
const meterRows={ red:document.querySelector('#meterRed'), blue:document.querySelector('#meterBlue'),
  yellow:document.querySelector('#meterYellow'), purple:document.querySelector('#meterPurple') };
const resRow=document.querySelector('#meterRes'), kilnRow=document.querySelector('#meterKiln');

const ACT_LABEL={
  red:'THE INVENTORY', blue:'VAULT OF ULTRAMARINE',
  yellow:'THE BURIED VAULT', purple:'THE UNACCESSIONED TERRITORY',
  endless:'THE PROCESSING FLOORS',
};
function objectiveText(){
  if(mode==='hub'){
    if(!lib.red.on) return 'report to the inventory';
    if(!lib.blue.on) return 'the vault of ultramarine stands open';
    if(!lib.yellow.on) return 'the buried vault is catalogued. dig.';
    if(!lib.purple.on) return resonance>=RES_MAX
      ? 'the kiln is revealed. enter the unaccessioned territory.'
      : `fire mixed red+blue pigment — resonance ${resonance}/${RES_MAX}`;
    return `restoration ongoing — ${killsTotal} accessions struck`;
  }
  if(!raid) return 'awaiting accession';
  const alive=enemies.filter(e=>!e.dead).length;
  const bay=raid.endless?`processing floor ${raid.room+1}`:`bay ${raid.room+1}`;
  switch(raid.state){
    case 'combat':  return `${bay} — ${alive} to process`;
    case 'cleared': return `${bay} processed. proceed.`;
    case 'archive': return 'archive — select one swatch, or proceed';
    case 'objective':
      if(raid.act==='red') return 'the forge is exposed. touch it.';
      if(raid.act==='blue') return 'the hatch is open. enter.';
      if(raid.act==='yellow') return 'the buried door. unearth it.';
      if(raid.act==='purple') return 'the kiln. light it.';
      return bay;
    case 'firing':  return `HOLD THE MIX — kiln at ${Math.round(kilnTemp*100)}%`;
    case 'birth':   return 'the first purple things. survive your creation.';
    case 'done':    return 'accession complete. returning to storage.';
  }
  return 'awaiting accession';
}
function tyrianLine(){
  if(lib.purple.on) return 'FIRED — no record exists';
  if(raid&&(raid.state==='firing'||raid.state==='birth')) return 'firing in progress';
  return 'unfired — never existed';
}
function updateReport(){
  const cond = player.hits===0 ? 'cracked throughout. Stable.' :
               `cracked throughout. Abrasions — ${player.hits}.`;
  reportEl.innerHTML =
`<span class="hd">CONDITION REPORT&nbsp;&nbsp;A-17</span>
OBJECT ......... figure, compacted pigment
CONDITION ...... ${cond}
VERMILION ...... ${lib.red.on?'RELEASED — in circulation':'in storage (grey)'}
ULTRAMARINE .... ${lib.blue.on?'RELEASED — in circulation':'submerged (grey)'}
ORPIMENT ....... ${lib.yellow.on?'RELEASED — in circulation':'buried (grey)'}
TYRIAN ......... ${tyrianLine()}
OBJECTIVE ...... ${objectiveText()}
RECOMMENDATION . ${player.hits>=player.maxHits-1?'contain':'monitor'}`;
}
function updateWeaponHud(){
  const own=ownedColors();
  weaponEl.style.display = own.length? 'block':'none';
  if(!own.length) return;
  comboEl.textContent = `${COLORS[slots.delivery].tool} of ${COLORS[slots.payload].payload}`;
  slotDEl.textContent = COLORS[slots.delivery].warden.toLowerCase();
  slotPEl.textContent = COLORS[slots.payload].warden.toLowerCase();
  slotDEl.style.color = css(tint(slots.delivery));
  slotPEl.style.color = css(tint(slots.payload));
  swatchListEl.innerHTML = swatches.map(s=>{
    const life = s.fugitive ? ` (fugitive ${Math.max(0,s.life)|0}s)` : '';
    return `<span style="color:${css(tint(s.color))}">■</span> ${s.name}${life}`;
  }).join('<br>');
}
function updateMeters(){
  for(const c of COLOR_ORDER){
    const row=meterRows[c];
    row.classList.toggle('on', lib[c].on);
    if(lib[c].on){
      const bar=row.querySelector('i');
      bar.style.width=(player.charge[c]*100)+'%';
      bar.style.background=css(tint(c),.8);
    }
  }
  const showRes = lib.blue.on && !lib.purple.on && resonance<RES_MAX;
  resRow.classList.toggle('on', showRes);
  if(showRes){
    const bar=resRow.querySelector('i');
    bar.style.width=(resonance/RES_MAX*100)+'%';
    bar.style.background=css(COLORS.purple.live,.6);
  }
  const showKiln = raid&&raid.state==='firing';
  kilnRow.classList.toggle('on', !!showKiln);
  if(showKiln){
    const bar=kilnRow.querySelector('i');
    bar.style.width=(kilnTemp*100)+'%';
    bar.style.background=css(COLORS.purple.live,.85);
  }
  const showHeat = slots.delivery==='yellow';
  heatWrap.style.display = showHeat?'block':'none';
  if(showHeat){
    heatBar.style.width=(player.heat*100)+'%';
    heatBar.style.background = player.overheated ? css(COLORS.red.live,.8) : '#9a7d18';
  }
}
function showStamp(color,lines,dur){
  stampEl.textContent=lines;
  stampEl.classList.remove('blue','purple','yellow');
  if(color==='blue'||color==='purple'||color==='yellow') stampEl.classList.add(color);
  stampEl.classList.add('show');
  setTimeout(()=>stampEl.classList.remove('show'), dur||2600);
}

/* ---------- re-shelving (§7.7) ---------- */
function reshelve(){
  splat(player.x,player.y,[45,40,36],26,.28);       // the dark mark stays (§3.6)
  reshelving=2.2;
  const offsite = mode==='raid' ? 'recovered off-site  ☑' : 'recovered on-site, aisle B-3';
  formText.innerHTML =
`<b>RE-SHELVING FORM</b>\nOBJECT ......... figure, compacted pigment\nRECOVERED ...... ${offsite}\nCARRIED PIGMENT  forfeited above working stock\nSWATCHES ....... returned to the drawer\nWORKING STOCK .. issued (standard)\nFILED BY ....... L.H.`;
  formEl.style.display='flex';
  player.hits=0;
  // Working Stock: re-shelving refills every owned color to the floor.
  for(const c of ownedColors()) player.charge[c]=Math.max(player.charge[c],.55);
  swatches=[];                    // the per-run build is forfeit
  player.heat=0; player.overheated=false;
  blip(140,.5,'sine',.06);
  setTimeout(()=>formEl.style.display='none',2200);
  enterHub();                     // the staff carry Payne back to storage
  updateReport(); updateWeaponHud();
}

/* ============================================================
   HUB & RAIDS (§7.5)
   ============================================================ */
function clearField(){
  enemies=[]; ebullets=[]; pbullets=[]; drops=[]; pulses=[]; arcs=[];
  interactable=null; door=null; kiln=null; swatchDrops=[];
}
function enterHub(){
  mode='hub'; raid=null; returnT=0;
  clearField();
  swatches=[];                  // the per-run build ends with the run (§7.3)
  makeCrates(); makeMotes();
  player.x=W/2; player.y=H*.72;
  buildHub();
  updateReport(); updateWeaponHud();
}
function buildHub(){
  hubDoors=[];
  const acts=[];
  if(!lib.red.on) acts.push('red');
  else if(!lib.blue.on) acts.push('blue');
  else if(!lib.yellow.on) acts.push('yellow');
  else {
    acts.push('endless');
    if(!lib.purple.on && resonance>=RES_MAX) acts.push('purple');
  }
  acts.forEach((act,i)=>{
    hubDoors.push({ act, x:W*(.5+(i-(acts.length-1)/2)*.3), y:H*.3,
      r:30, seed:(act.length*131+7)|0, pulse:0 });
  });
}
function startRaid(act){
  raid={ act, room:0, state:'combat', endless:act==='endless' };
  loadRoom();
  blip(392,.2,'sine',.04);
}
/* what lives in each bay */
function roomPlan(act,room){
  const small=W<700, s=small?-1:0;
  if(act==='endless'){
    if(room%4===3) return {type:'archive'};
    const k=Math.floor(room/3);
    return {type:'combat', set:{ plaster:3+k+s, husk:1+Math.floor(k/2),
      shard:2+k+s, strata:2+k+s, spine:1+k+s, spiral:lib.purple.on?1+Math.floor(k/2):0 }};
  }
  const plans={
    red:[ {type:'combat', set:{plaster:5+s,husk:1}},
          {type:'combat', set:{plaster:7+s,husk:2}},
          {type:'objective'} ],
    blue:[ {type:'combat', set:{plaster:4+s,shard:4+s}},
           {type:'combat', set:{plaster:3,husk:1,shard:5+s}},
           {type:'archive'},
           {type:'objective'} ],
    yellow:[ {type:'combat', set:{plaster:3,shard:3+s,strata:3+s}},
             {type:'combat', set:{shard:4+s,strata:4+s,husk:1}},
             {type:'archive'},
             {type:'objective'} ],
    purple:[ {type:'combat', set:{shard:4+s,strata:4+s}},
             {type:'combat', set:{shard:5+s,strata:5+s,spine:2}},
             {type:'archive'},
             {type:'objective'} ],
  };
  return plans[act][room]||null;
}
function loadRoom(){
  clearField();
  clearRoomStains();
  makeCrates(); makeMotes();
  player.x=60; player.y=H/2;
  const plan=roomPlan(raid.act, raid.room);
  if(!plan){ enterHub(); return; }
  if(plan.type==='combat'){
    raid.state='combat';
    spawnSet(plan.set);
  } else if(plan.type==='archive'){
    raid.state='archive';
    offerSwatches();
    placeDoor();
  } else if(plan.type==='objective'){
    raid.state='objective';
    placeObjective(raid.act);
  }
  updateReport();
}
function placeDoor(){
  door={ x:W-36, y:H/2, r:26, seed:77 };
}
function nextRoom(){
  raid.room++;
  blip(494,.12,'sine',.04);
  loadRoom();
}
function placeObjective(act){
  const x=W*.72, y=H/2;
  if(act==='purple'){
    kiln={ x, y, r:30, seed:(Math.random()*999)|0 };
    interactable={ kind:'kiln', x, y, r:30, seed:kiln.seed, pulse:0 };
    // parents guard their kiln
    for(let i=0;i<3;i++){ spawnEnemy('shard',false, x+rand(-180,-60), y+rand(-160,160));
                          spawnEnemy('strata',false, x+rand(-180,-60), y+rand(-160,160)); }
    return;
  }
  const kind = act==='red'?'forge' : act==='blue'?'hatch' : 'barrow';
  interactable={ kind, x, y, r:26, seed:(Math.random()*999)|0, pulse:0 };
  // its keepers, still in storage, rendered grey — the crowd you cannot yet read (§4)
  const guard = act==='red'?'shard' : act==='blue'?'strata' : 'spine';
  const n = W<700?4:5;
  for(let i=0;i<n;i++){
    const a=(i/n)*Math.PI*2;
    spawnEnemy(guard,false, x+Math.cos(a)*130+rand(-20,20), y+Math.sin(a)*130+rand(-20,20));
  }
}

function liberate(color){
  lib[color].on=true;
  player.charge[color]=1;
  save();
  if(color==='red'){ slots.delivery='red'; slots.payload='red'; }
  timescale=.22; cineT=1.7;
  // secondaries are not released from storage — they are made (§2.4)
  const stampText = color==='purple'
    ? 'TYRIAN — FIRED\ncondition: new. no record exists.'
    : `${COLORS[color].warden} — RELEASED\ncondition: fugitive. in circulation.`;
  showStamp(color, stampText, 3000);
  blip(520,.5,'sine',.06); blip(660,.8,'sine',.05);
  if(color==='blue') setTimeout(()=>blip(392,.8,'sine',.04),150);
  if(color==='yellow') setTimeout(()=>blip(587,.7,'sine',.045),150);
  if(color==='purple') setTimeout(()=>blip(311,.9,'sine',.045),150);
  updateReport(); updateWeaponHud();
}

function touchThings(){
  // hub entrances
  if(mode==='hub'){
    for(const hd of hubDoors){
      if(Math.hypot(player.x-hd.x,player.y-hd.y)<hd.r+player.r){
        mode='raid'; startRaid(hd.act); return;
      }
    }
    return;
  }
  if(!raid) return;
  // bay exit door
  if(door && Math.hypot(player.x-door.x,player.y-door.y)<door.r+player.r){
    door=null; nextRoom(); return;
  }
  // archive offering
  for(const sd of swatchDrops){
    if(Math.hypot(player.x-sd.x,player.y-sd.y)<20+player.r){ pickSwatch(sd); break; }
  }
  // the objective
  if(!interactable) return;
  const d=Math.hypot(player.x-interactable.x, player.y-interactable.y);
  if(d>interactable.r+player.r) return;
  const kind=interactable.kind;
  if(kind==='kiln'){
    interactable=null;
    raid.state='firing'; kilnTemp=.2;
    showStamp('purple','THE FIRING\nonly the mix feeds the kiln', 2600);
    blip(392,.4,'sine',.05); blip(311,.6,'sine',.04);
    updateReport();
    return;
  }
  const color = kind==='forge'?'red' : kind==='hatch'?'blue' : 'yellow';
  splat(interactable.x,interactable.y, stainTint(color), 30,.2);
  interactable=null;
  liberate(color);
  raid.state='done';
  returnT=3;
}

/* the final minute of the Firing: the new color is born, hostile (§7.6.5) */
function birthPhase(){
  raid.state='birth';
  timescale=.25; cineT=1.4;
  splat(kiln.x,kiln.y,stainTint('purple'),40,.2);
  const n=5;
  for(let i=0;i<n;i++){
    const a=(i/n)*Math.PI*2;
    const e=spawnEnemy('spiral',false, kiln.x+Math.cos(a)*80, kiln.y+Math.sin(a)*80);
    e.birth=true;
  }
  showStamp('purple','THE KILN FIRES\nthe first purple thing turns on you', 2800);
  blip(392,.5,'sine',.05); blip(466,.7,'sine',.05); blip(554,.9,'sine',.04);
}

/* ============================================================
   UPDATE
   ============================================================ */
function update(rdt,t){
  // liberation tint eases on unscaled time, so the world colors *through* the slow-mo
  for(const c of COLOR_ORDER)
    lib[c].t += ((lib[c].on?1:0)-lib[c].t)*Math.min(1,rdt*2.2);
  boilFrame = Math.floor(t*8);
  if(cineT>0){ cineT-=rdt; if(cineT<=0) timescale=1; }
  const dt=rdt*timescale;

  if(mode==='title') return;
  if(reshelving>0){ reshelving-=rdt; return; }

  reportT-=rdt; if(reportT<=0){ reportT=.3; updateReport();
    if(swatches.some(s=>s.fugitive)) updateWeaponHud(); }
  if(returnT>0){ returnT-=rdt; if(returnT<=0){ enterHub(); return; } }

  // -- player movement
  let mx=0,my=0;
  if(keys['w']||keys['arrowup'])my--; if(keys['s']||keys['arrowdown'])my++;
  if(keys['a']||keys['arrowleft'])mx--; if(keys['d']||keys['arrowright'])mx++;
  if(moveTouch){
    const dx=moveTouch.x-moveTouch.ox, dy=moveTouch.y-moveTouch.oy, d=Math.hypot(dx,dy);
    if(d>8){ mx=dx/d; my=dy/d; }
  }
  player.dashCd=Math.max(0,player.dashCd-dt);
  player.inv=Math.max(0,player.inv-dt);
  if(player.dashT>0){
    player.dashT-=dt;
    player.x+=Math.cos(player.dashA)*720*dt;
    player.y+=Math.sin(player.dashA)*720*dt;
  } else {
    const ml=Math.hypot(mx,my)||1;
    player.x+=mx/ml*230*dt; player.y+=my/ml*230*dt;
  }
  player.x=Math.max(24,Math.min(W-24,player.x));
  player.y=Math.max(24,Math.min(H-24,player.y));

  // -- aim + fire
  let firing=false;
  if(aimTouch){ player.aim=Math.atan2(aimTouch.y-player.y,aimTouch.x-player.x); firing=true; }
  else { player.aim=Math.atan2(mouse.y-player.y,mouse.x-player.x); firing=mouse.down; }
  if(firing && slots.delivery==='yellow' && ownedColors().length){
    quill(dt);
  } else {
    player.fireT-=dt;
    if(firing && player.fireT<=0) fireWeapon();
  }
  // quill heat management
  if(!(firing&&slots.delivery==='yellow')) player.heat=Math.max(0,player.heat-.5*dt);
  else if(player.overheated) player.heat=Math.max(0,player.heat-.5*dt);
  if(player.overheated && player.heat<.35) player.overheated=false;
  player.beamT=Math.max(0,player.beamT-dt);
  // slow passive regen — drops are the real economy
  for(const c of ownedColors()) player.charge[c]=Math.min(1,player.charge[c]+.02*dt);

  updateSwatches(dt);
  touchThings();
  if(interactable) interactable.pulse+=dt;
  for(const hd of hubDoors) hd.pulse+=dt;

  // -- the Firing (§7.6): the kiln cools unless fed with the mix
  if(raid && raid.state==='firing'){
    if(kilnTemp>=1) birthPhase();
    else {
      kilnTemp=Math.max(0,kilnTemp-.012*dt);
      if(kilnTemp<=0){
        raid.state='objective';
        interactable={ kind:'kiln', x:kiln.x, y:kiln.y, r:30, seed:kiln.seed, pulse:0 };
        showStamp('purple','THE KILN COOLS\nlight it again', 2000);
        blip(120,.4,'sine',.05);
      }
    }
  }

  // -- room cleared?
  if(raid && raid.state==='combat' && !enemies.some(e=>!e.dead)){
    raid.state='cleared';
    placeDoor();
    blip(523,.2,'sine',.05); blip(659,.3,'sine',.04);
    updateReport();
  }

  // -- enemies
  maintainWaves();
  for(const e of enemies){
    e.hurt=Math.max(0,e.hurt-dt*4);
    e.contactCd=Math.max(0,e.contactCd-dt);
    // status
    if(e.frozen>0){ e.frozen-=dt; if(e.frozen<=0) e.chill=0; }
    if(e.burn>0){
      e.burn-=dt;
      e.hp-=1.4*dt;
      if(Math.random()<dt*4) splat(e.x+rand(-6,6),e.y+rand(-6,6),stainTint('red'),3,.05);
      if(e.hp<=0 && !e.dead){ killEnemy(e); continue; }
    }
    const slow = e.frozen>0 ? 0 : 1-.13*e.chill;
    if(slow<=0) continue;
    const dx=player.x-e.x, dy=player.y-e.y, d=Math.hypot(dx,dy)||1;

    if(e.type==='plaster'){
      e.x+=dx/d*e.speed*slow*dt; e.y+=dy/d*e.speed*slow*dt;
      e.rot+=e.spin*dt;
      if(d<e.r+player.r && e.contactCd<=0){ e.contactCd=.9; hurtPlayer(); }
    }
    if(e.type==='husk'){
      if(d>230){ e.x+=dx/d*e.speed*slow*dt; e.y+=dy/d*e.speed*slow*dt; }
      e.fireT-=dt*slow;
      if(e.fireT<=0){
        e.fireT=rand(3.8,4.6);
        const n=10;
        for(let i=0;i<n;i++){
          const a=(i/n)*Math.PI*2+e.rot;
          ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*72,vy:Math.sin(a)*72,
            life:7,kind:'dot',rot:0,spin:0,seed:(Math.random()*999)|0});
        }
        blip(110,.1,'sine',.02);
      }
    }
    if(e.type==='shard'){
      const tangential=(d-e.orbit)*.9;
      e.x += (dx/d*tangential - dy/d*46*e.dir)*slow*dt;
      e.y += (dy/d*tangential + dx/d*46*e.dir)*slow*dt;
      e.rot += e.spin*dt;
      e.fireT-=dt*slow;
      if(e.fireT<=0 && d<W*.7){
        e.fireT=rand(2.2,3.6);
        const base=Math.atan2(dy,dx), n=5;
        for(let i=0;i<n;i++){
          const a=base+(i-(n-1)/2)*.16;
          ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*95,vy:Math.sin(a)*95,
            life:6,kind:'shard',rot:rand(0,7),spin:rand(-3,3),seed:(Math.random()*999)|0});
        }
        blip(150,.06,'sawtooth',.012);
      }
    }
    if(e.type==='strata'){
      e.ph+=dt;
      if(d>300){ e.x+=dx/d*e.speed*slow*dt; e.y+=dy/d*e.speed*slow*dt; }
      e.y+=Math.sin(e.ph*1.6)*18*slow*dt;
      e.fireT-=dt*slow;
      if(e.fireT<=0 && d<W*.75){
        e.fireT=rand(3.2,4.2);
        const base=Math.atan2(dy,dx);
        for(let i=-1;i<=1;i++){
          const a=base+i*.28;
          ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*62,vy:Math.sin(a)*62,
            life:8,kind:'glob',rot:0,spin:0,seed:(Math.random()*999)|0});
        }
        blip(95,.12,'sine',.02);
      }
    }
    if(e.type==='spine'){
      // Orpiment snipes from range and lights the player up (§3.2)
      e.rot+=dt*.4;
      if(d<340){ e.x-=dx/d*e.speed*slow*dt; e.y-=dy/d*e.speed*slow*dt; }
      else if(d>460){ e.x+=dx/d*e.speed*.7*slow*dt; e.y+=dy/d*e.speed*.7*slow*dt; }
      if(e.locked){
        e.lockT-=dt*slow;
        if(e.lockT<=0){
          const a=Math.atan2(e.locked[1]-e.y, e.locked[0]-e.x);
          ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*320,vy:Math.sin(a)*320,
            life:3,kind:'sbolt',rot:a,spin:0,seed:(Math.random()*999)|0});
          blip(1000,.08,'square',.02);
          e.locked=null; e.aimT=rand(2.4,3.4);
        }
      } else {
        e.aimT-=dt*slow;
        if(e.aimT<=0 && d<W*.8){ e.locked=[player.x,player.y]; e.lockT=.65; blip(1400,.05,'sine',.015); }
      }
    }
    if(e.type==='spiral'){
      // Tyrian phases in and out (§3.2) — immaterial while phased out
      e.ph+=dt;
      e.phased = (e.ph%3.8)>2.4;
      e.rot+=dt*1.4;
      if(!e.phased){
        if(d>240){ e.x+=dx/d*e.speed*slow*dt; e.y+=dy/d*e.speed*slow*dt; }
        e.fireT-=dt*slow;
        if(e.fireT<=0 && d<W*.7){
          e.fireT=rand(2.6,3.6);
          const base=Math.atan2(dy,dx);
          for(let i=-1;i<=1;i++){
            const a=base+i*.12;
            ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*105,vy:Math.sin(a)*105,
              life:6,kind:'pbolt',rot:rand(0,7),spin:rand(-2,2),seed:(Math.random()*999)|0});
          }
          blip(180,.08,'sine',.015);
        }
      } else {
        e.x+=Math.cos(e.rot)*22*dt; e.y+=Math.sin(e.rot)*22*dt;
      }
    }
  }

  // -- enemy bullets
  for(const b of ebullets){
    b.x+=b.vx*dt; b.y+=b.vy*dt; b.life-=dt; b.rot+=b.spin*dt;
    const rr = b.kind==='glob'?7 : b.kind==='dot'?4 : b.kind==='pbolt'?4.5 : b.kind==='sbolt'?3.5 : 4.6;
    if(Math.hypot(b.x-player.x,b.y-player.y)<player.r-2+rr*.4){
      b.life=0; hurtPlayer();
    }
  }
  ebullets=ebullets.filter(b=>b.life>0 && b.x>-40&&b.x<W+40&&b.y>-40&&b.y<H+40);

  // -- player bullets
  for(const b of pbullets){
    if(b.kind==='lob'){
      b.t+=dt;
      const k=Math.min(1,b.t/b.T);
      b.x=b.sx+(b.tx-b.sx)*k; b.y=b.sy+(b.ty-b.sy)*k;
      if(k>=1){
        b.life=0;
        splat(b.x,b.y,stainTint(slots.payload!=='grey'?slots.payload:'blue'),14,.12);
        shake=Math.max(shake,.12);
        blip(200,.12,'sine',.04);
        // one pulse at the landing point, even on a clean miss
        if(slots.payload==='purple' && chargeOk('purple')) singularity(b.x,b.y);
        for(const e of enemies)
          if(!e.dead && !e.phased && Math.hypot(e.x-b.x,e.y-b.y)<b.splash+e.r) hitEnemy(e,b);
      } else b.life=1;
      continue;
    }
    b.x+=b.vx*dt; b.y+=b.vy*dt; b.life-=dt;
    for(const e of enemies){
      if(e.dead || e.phased) continue;
      if(Math.hypot(b.x-e.x,b.y-e.y)<e.r){
        if(b.kind==='bolt' || (b.kind==='dab'&&b.pierce>1)){
          // pierces — hits everything on the line, once each
          if(b.hitList.includes(e)) continue;
          b.hitList.push(e); hitEnemy(e,b);
          if(b.kind==='dab' && b.hitList.length>=b.pierce){ b.life=0; break; }
        } else {
          b.life=0; hitEnemy(e,b);
          break;
        }
      }
    }
  }
  pbullets=pbullets.filter(b=>b.life>0);
  enemies=enemies.filter(e=>!e.dead);

  // -- pigment drops (§7.2)
  for(const d of drops){
    d.life-=dt;
    const dx=player.x-d.x, dy=player.y-d.y, dist=Math.hypot(dx,dy);
    if(dist<110){ d.x+=dx/dist*240*dt; d.y+=dy/dist*240*dt; }
    if(dist<player.r+4){
      d.life=0;
      player.charge[d.color]=Math.min(1,player.charge[d.color]+.08);
      blip(700,.06,'sine',.03);
    }
  }
  drops=drops.filter(d=>d.life>0);

  // -- singularity pulses: pull the crowd toward the impact point
  for(const pu of pulses){
    pu.t-=dt;
    for(const e of enemies){
      if(e.dead||e.phased) continue;
      const dx=pu.x-e.x, dy=pu.y-e.y, dd=Math.hypot(dx,dy);
      if(dd>4&&dd<pu.r){ const s=Math.min(380*dt*(pu.t/.35), dd); e.x+=dx/dd*s; e.y+=dy/dd*s; }
    }
  }
  pulses=pulses.filter(p=>p.t>0);
  for(const a of arcs) a.t-=dt;
  arcs=arcs.filter(a=>a.t>0);

  // -- motes drift
  for(const m of motes){
    m.a+=rand(-.5,.5)*dt;
    m.x+=Math.cos(m.a)*14*m.s; m.y+=Math.sin(m.a)*14*m.s;
    if(m.x<-10)m.x=W+10; if(m.x>W+10)m.x=-10;
    if(m.y<-10)m.y=H+10; if(m.y>H+10)m.y=-10;
  }
  shake=Math.max(0,shake-dt*2);
}

function hurtPlayer(){
  if(player.inv>0 || reshelving>0) return;
  player.hits++; player.inv=.7; shake=.4;
  blip(90,.15,'sawtooth',.05);
  updateReport();
  if(player.hits>=player.maxHits) reshelve();
}

/* ============================================================
   RENDER
   ============================================================ */
function render(t){
  ctx.setTransform(DPR,0,0,DPR,0,0);
  ctx.drawImage(paper,0,0,W,H);
  ctx.globalCompositeOperation='multiply';
  ctx.drawImage(activeStains(),0,0,W,H);
  ctx.globalCompositeOperation='source-over';

  if(shake>0) ctx.translate((Math.random()-.5)*shake*10,(Math.random()-.5)*shake*10);

  // dust-sheeted crates
  for(const c of crates){
    watercolor(ctx,(cc,s)=>{
      blobPath(cc,c.x,c.y,Math.max(c.w,c.h)*.62,10,s,.3);
    },[208,201,187],[100,94,84],c.seed,{a1:.5,a2:.3,edgeW:2,lineA:.5});
    ctx.strokeStyle='rgba(100,94,84,.3)'; ctx.lineWidth=1;
    for(let i=0;i<3;i++){
      ctx.beginPath();
      ctx.moveTo(c.x-c.w*.3+jit(c.seed,i,2), c.y-c.h*.3+i*c.h*.22);
      ctx.quadraticCurveTo(c.x+jit(c.seed,i+5,4), c.y-c.h*.1+i*c.h*.24,
                           c.x+c.w*.34, c.y-c.h*.2+i*c.h*.26);
      ctx.stroke();
    }
  }

  // hub entrances
  if(mode==='hub') for(const hd of hubDoors) drawEntrance(hd,t);
  // room fixtures
  if(kiln) drawKiln(t);
  if(interactable && interactable.kind!=='kiln') drawInteractable(interactable,t);
  if(door) drawDoor(t);
  for(const sd of swatchDrops) drawSwatchDrop(sd,t);

  // dust motes — the confusers
  for(const m of motes){
    ctx.beginPath();
    ctx.arc(m.x+jit(m.seed,1,1), m.y+jit(m.seed,2,1), m.r,0,7);
    ctx.fillStyle='rgba(125,118,106,.35)'; ctx.fill();
  }

  // enemy bullets
  for(const b of ebullets){
    ctx.save(); ctx.translate(b.x,b.y); ctx.rotate(b.rot);
    if(b.kind==='shard'){
      ctx.beginPath(); shardPath(ctx,0,0,4.6,0,b.seed,1);
      ctx.fillStyle=css(mix([125,118,106],COLORS.red.live,lib.red.t), .55+lib.red.t*.4); ctx.fill();
      if(lib.red.t>.05){ ctx.beginPath(); ctx.arc(0,0,7,0,7);
        ctx.fillStyle=css(COLORS.red.live,.12*lib.red.t); ctx.fill(); }
    } else if(b.kind==='glob'){
      ctx.beginPath(); ctx.ellipse(0,0,7+jit(b.seed,1,.8),5.4,Math.atan2(b.vy,b.vx),0,7);
      ctx.fillStyle=css(mix([120,122,124],COLORS.blue.live,lib.blue.t), .5+lib.blue.t*.4); ctx.fill();
      if(lib.blue.t>.05){ ctx.beginPath(); ctx.arc(0,0,9,0,7);
        ctx.fillStyle=css(COLORS.blue.live,.1*lib.blue.t); ctx.fill(); }
    } else if(b.kind==='sbolt'){
      ctx.beginPath(); ctx.ellipse(0,0,10,1.6,0,0,7);
      ctx.fillStyle=css(mix([130,126,112],COLORS.yellow.live,lib.yellow.t), .85); ctx.fill();
      if(lib.yellow.t>.05){ ctx.beginPath(); ctx.arc(0,0,6,0,7);
        ctx.fillStyle=css(COLORS.yellow.live,.14*lib.yellow.t); ctx.fill(); }
    } else if(b.kind==='pbolt'){
      ctx.beginPath();
      for(let a=0;a<Math.PI*3;a+=.5){
        const rr=4.5*a/(Math.PI*3);
        const px=Math.cos(a+b.rot)*rr, py=Math.sin(a+b.rot)*rr;
        a===0?ctx.moveTo(px,py):ctx.lineTo(px,py);
      }
      ctx.strokeStyle=css(mix([118,114,120],COLORS.purple.live,lib.purple.t), .8);
      ctx.lineWidth=2; ctx.stroke();
      if(lib.purple.t>.05){ ctx.beginPath(); ctx.arc(0,0,7,0,7);
        ctx.fillStyle=css(COLORS.purple.live,.12*lib.purple.t); ctx.fill(); }
    } else {
      ctx.beginPath(); ctx.arc(0,0,4,0,7);
      ctx.fillStyle='rgba(96,90,80,.6)'; ctx.fill();
    }
    ctx.restore();
  }

  // spine telegraphs — the thin line that says "move"
  for(const e of enemies){
    if(e.type==='spine' && e.locked){
      ctx.beginPath();
      ctx.moveTo(e.x,e.y); ctx.lineTo(e.locked[0],e.locked[1]);
      ctx.strokeStyle=css(tint('yellow'), .18+.25*(1-e.lockT/.65));
      ctx.lineWidth=1; ctx.stroke();
    }
  }

  // enemies
  for(const e of enemies) drawEnemy(e);

  // the Quill beam
  if(player.beamT>0){
    const len=560;
    const x2=player.x+Math.cos(player.beamA)*len, y2=player.y+Math.sin(player.beamA)*len;
    ctx.save();
    ctx.strokeStyle=css(mix(tint('yellow'),[255,255,255],.2), .5+player.beamT*4);
    ctx.lineWidth=2.4+jit(3,boilFrame,1);
    ctx.beginPath(); ctx.moveTo(player.x,player.y); ctx.lineTo(x2+jit(5,1,3),y2+jit(5,2,3)); ctx.stroke();
    ctx.strokeStyle=css(tint('yellow'),.2); ctx.lineWidth=6;
    ctx.beginPath(); ctx.moveTo(player.x,player.y); ctx.lineTo(x2,y2); ctx.stroke();
    ctx.restore();
  }
  // chain arcs
  for(const a of arcs){
    ctx.beginPath();
    const segs=5;
    for(let i=0;i<=segs;i++){
      const k=i/segs;
      const px=a.x1+(a.x2-a.x1)*k+(i>0&&i<segs?jit(a.seed,i,7):0);
      const py=a.y1+(a.y2-a.y1)*k+(i>0&&i<segs?jit(a.seed,i+9,7):0);
      i===0?ctx.moveTo(px,py):ctx.lineTo(px,py);
    }
    ctx.strokeStyle=css(tint('yellow'), a.t/.12*.8); ctx.lineWidth=1.6; ctx.stroke();
  }

  // player bullets — pigment dabs, lobs, bolts
  for(const b of pbullets){
    if(b.kind==='lob'){
      const k=Math.min(1,b.t/b.T), hgt=Math.sin(Math.PI*k)*26;
      ctx.beginPath(); ctx.ellipse(b.x,b.y,6*(1-k*.3),2.4,0,0,7);
      ctx.fillStyle='rgba(58,53,44,.15)'; ctx.fill();          // shadow
      ctx.beginPath(); ctx.arc(b.x,b.y-hgt,6+Math.sin(Math.PI*k)*2,0,7);
      ctx.fillStyle=css(b.col,.85); ctx.fill();
      continue;
    }
    const a=Math.atan2(b.vy,b.vx);
    ctx.save(); ctx.translate(b.x,b.y); ctx.rotate(a);
    if(b.kind==='bolt'){
      // Compass phase bolt — a long needle, half in this world
      ctx.beginPath(); ctx.ellipse(0,0,16,1.8,0,0,7);
      ctx.fillStyle=css(b.col,.75); ctx.fill();
      ctx.beginPath(); ctx.ellipse(-18,0,10,1.1,0,0,7);
      ctx.fillStyle=css(b.col,.25); ctx.fill();
    } else {
      ctx.beginPath(); ctx.ellipse(0,0,7,2.6,0,0,7);
      ctx.fillStyle=css(b.col,.85); ctx.fill();
      ctx.beginPath(); ctx.ellipse(-8,0,6,1.6,0,0,7);
      ctx.fillStyle=css(b.col,.3); ctx.fill();
    }
    ctx.restore();
  }

  // singularity pulses — contracting rings
  for(const pu of pulses){
    ctx.beginPath(); ctx.arc(pu.x,pu.y, 20+(pu.r-20)*(pu.t/.35),0,7);
    ctx.strokeStyle=css(tint('purple'), .5*pu.t/.35); ctx.lineWidth=2; ctx.stroke();
  }

  // pigment drops
  for(const d of drops){
    ctx.save(); ctx.translate(d.x,d.y); ctx.rotate(t*2+d.seed);
    ctx.fillStyle=css(tint(d.color),.8);
    ctx.fillRect(-3,-3,6,6);
    ctx.restore();
  }

  drawPayne(t);

  // touch joystick ghost
  if(moveTouch){
    ctx.strokeStyle='rgba(58,53,44,.25)'; ctx.lineWidth=1.4;
    ctx.beginPath(); ctx.arc(moveTouch.ox,moveTouch.oy,34,0,7); ctx.stroke();
    ctx.beginPath(); ctx.arc(moveTouch.x,moveTouch.y,10,0,7); ctx.stroke();
  }

  updateMeters();
}

function drawEnemy(e){
  let base;
  if(e.faction==='grey') base=[150,144,132];
  else base=tint(e.faction);
  // chill shifts toward pale blue-white; frozen is explicit
  if(e.chill>0) base=mix(base,[210,220,232],Math.min(1,e.chill/5)*.6);
  const tcol = e.hurt>0 ? mix(base,[255,255,255],e.hurt*.5) : base;
  const edge = e.faction==='grey' ? dark(INK,.9)
             : dark(mix(INK,COLORS[e.faction].live,lib[e.faction].t*.5),.9);
  if(e.phased) ctx.globalAlpha=.3;

  if(e.type==='shard'){
    watercolor(ctx,(cc,s)=>{ shardPath(cc,e.x,e.y,e.r,e.rot,e.seed+s,1); },
      tcol,edge,e.seed,{a1:.42,a2:.32,edgeW:2.4,lineW:1.3});
    ctx.strokeStyle=css(dark(tcol,.6),.5); ctx.lineWidth=1;
    ctx.beginPath();
    ctx.moveTo(e.x+jit(e.seed,31,1),e.y+jit(e.seed,32,1));
    ctx.lineTo(e.x+Math.cos(e.rot)*e.r*.8, e.y+Math.sin(e.rot)*e.r*.8);
    ctx.stroke();
  }
  if(e.type==='strata'){
    watercolor(ctx,(cc,s)=>{ strataPath(cc,e.x,e.y,e.r,e.ph||0,e.seed+s); },
      tcol,edge,e.seed,{a1:.4,a2:.3,edgeW:2.2,lineW:1.2});
    ctx.strokeStyle=css(dark(tcol,.65),.5); ctx.lineWidth=1;
    for(let i=-1;i<=1;i++){
      ctx.beginPath();
      for(let s=0;s<=6;s++){
        const px=e.x-e.r*1.1+ (s/6)*e.r*2.2;
        const py=e.y+i*e.r*.32+Math.sin(s*1.4+(e.ph||0)*2+i)*3+jit(e.seed,s+i*9,.7);
        s===0?ctx.moveTo(px,py):ctx.lineTo(px,py);
      }
      ctx.stroke();
    }
  }
  if(e.type==='spine'){
    watercolor(ctx,(cc,s)=>{ spinePath(cc,e.x,e.y,e.r*1.3,e.rot,e.seed+s); },
      tcol,edge,e.seed,{a1:.4,a2:.3,edgeW:1.8,lineW:1.1});
    ctx.beginPath(); ctx.arc(e.x,e.y,e.r*.3,0,7);
    ctx.fillStyle=css(dark(tcol,.6),.7); ctx.fill();
  }
  if(e.type==='plaster'){
    watercolor(ctx,(cc,s)=>{ blobPath(cc,e.x,e.y,e.r,7,e.seed+s,.2); },
      tcol,edge,e.seed,{a1:.45,a2:.3,edgeW:2,lineW:1.1});
    ctx.strokeStyle=css(dark(tcol,.55),.6); ctx.lineWidth=1.2;
    ctx.strokeRect(e.x-3+jit(e.seed,41,.5), e.y-3+jit(e.seed,42,.5), 6,6);
  }
  if(e.type==='husk'){
    watercolor(ctx,(cc,s)=>{ blobPath(cc,e.x,e.y-4,e.r,10,e.seed+s,.22); },
      mix(tcol,[210,204,190],.5),edge,e.seed,{a1:.5,a2:.35,edgeW:2.6,lineW:1.4});
    ctx.strokeStyle='rgba(100,94,84,.4)'; ctx.lineWidth=1;
    for(let i=0;i<3;i++){
      ctx.beginPath();
      ctx.moveTo(e.x-e.r*.5+i*e.r*.5+jit(e.seed,i+60,1.5), e.y-e.r*.7);
      ctx.quadraticCurveTo(e.x-e.r*.4+i*e.r*.5, e.y+jit(e.seed,i+70,2),
                           e.x-e.r*.45+i*e.r*.5, e.y+e.r*.8);
      ctx.stroke();
    }
  }
  if(e.type==='spiral'){
    // Tyrian's shape signature: the spiral shell (§11.2)
    watercolor(ctx,(cc,s)=>{ blobPath(cc,e.x,e.y,e.r,9,e.seed+s,.28); },
      tcol,edge,e.seed,{a1:.4,a2:.3,edgeW:2.2,lineW:1.2});
    ctx.strokeStyle=css(dark(tcol,.55),.65); ctx.lineWidth=1.3;
    ctx.beginPath();
    for(let a=0;a<Math.PI*4;a+=.25){
      const rr=e.r*.85*a/(Math.PI*4);
      const px=e.x+Math.cos(a+e.rot)*rr, py=e.y+Math.sin(a+e.rot)*rr;
      a===0?ctx.moveTo(px,py):ctx.lineTo(px,py);
    }
    ctx.stroke();
  }
  // burn rim
  if(e.burn>0 && lib.red.t>.02){
    ctx.beginPath(); blobPath(ctx,e.x,e.y,e.r+3,9,e.seed+boilFrame,.3);
    ctx.strokeStyle=css(COLORS.red.live,.4+.2*Math.sin(boilFrame)); ctx.lineWidth=1.5; ctx.stroke();
  }
  if(e.frozen>0){
    ctx.beginPath(); blobPath(ctx,e.x,e.y,e.r+2,6,e.seed,.15);
    ctx.strokeStyle=css([210,225,240],.7); ctx.lineWidth=1.6; ctx.stroke();
  }
  ctx.globalAlpha=1;
}

function drawInteractable(it,t){
  const kindColor={ forge:'red', hatch:'blue', barrow:'yellow' }[it.kind]||'red';
  const pulse=.5+.5*Math.sin(it.pulse*2.4);
  ctx.beginPath(); ctx.arc(it.x,it.y,it.r+10+pulse*6,0,7);
  ctx.strokeStyle=css(mix(INK,tint(kindColor),.4),.25+.2*pulse); ctx.lineWidth=1.2; ctx.stroke();
  if(it.kind==='forge'){
    watercolor(ctx,(cc,s)=>{ shardPath(cc,it.x,it.y,it.r,.4,it.seed+s,.8); },
      mix([120,112,104],COLORS.red.live,lib.red.t*.5),[60,52,46],it.seed,
      {a1:.5,a2:.35,edgeW:2.6,lineW:1.5});
    ctx.beginPath(); blobPath(ctx,it.x,it.y,it.r*.4,7,it.seed+3,.3);
    ctx.fillStyle='rgba(28,24,22,.8)'; ctx.fill();
  } else if(it.kind==='hatch'){
    watercolor(ctx,(cc,s)=>{ strataPath(cc,it.x,it.y,it.r*.9,t*.5,it.seed+s); },
      mix([116,120,126],COLORS.blue.live,lib.blue.t*.5),[54,58,66],it.seed,
      {a1:.5,a2:.35,edgeW:2.6,lineW:1.5});
    ctx.strokeStyle='rgba(40,44,52,.6)'; ctx.lineWidth=1.4;
    for(let i=-1;i<=1;i++){
      ctx.beginPath();
      ctx.moveTo(it.x-it.r*.7,it.y+i*8+jit(it.seed,i+80,.8));
      ctx.lineTo(it.x+it.r*.7,it.y+i*8+jit(it.seed,i+83,.8));
      ctx.stroke();
    }
  } else if(it.kind==='barrow'){
    // the buried door — a slab under a mound, radiant seams showing through
    watercolor(ctx,(cc,s)=>{ blobPath(cc,it.x,it.y+6,it.r*1.15,8,it.seed+s,.25); },
      mix([150,142,120],COLORS.yellow.live,lib.yellow.t*.3),[80,72,52],it.seed,
      {a1:.5,a2:.35,edgeW:2.6,lineW:1.5});
    ctx.strokeStyle=css(mix([120,110,80],COLORS.yellow.live,.4),.5); ctx.lineWidth=1.2;
    for(let i=0;i<6;i++){
      const a=(i/6)*Math.PI*2+.3;
      ctx.beginPath();
      ctx.moveTo(it.x+Math.cos(a)*it.r*.3, it.y+Math.sin(a)*it.r*.3);
      ctx.lineTo(it.x+Math.cos(a)*(it.r*.8+jit(it.seed,i,2)), it.y+Math.sin(a)*(it.r*.8));
      ctx.stroke();
    }
  }
  const label={ forge:'COLD FORGE — VERMILION', hatch:'FLOODED HATCH — ULTRAMARINE',
    barrow:'BURIED DOOR — ORPIMENT' }[it.kind];
  ctx.font='9px "Courier New",monospace';
  ctx.textAlign='center';
  ctx.fillStyle='rgba(58,53,44,.6)';
  ctx.fillText(label, it.x, it.y+it.r+24);
}

function drawEntrance(hd,t){
  const c = hd.act==='endless' ? 'grey' : hd.act;
  const col = c==='grey' ? COLORS.grey.live : tint(c);
  const pulse=.5+.5*Math.sin(hd.pulse*2);
  // the doorway: two jambs and a lintel
  ctx.strokeStyle=css(INK,.7); ctx.lineWidth=2.2;
  ctx.beginPath();
  ctx.moveTo(hd.x-22+jit(hd.seed,1,1), hd.y+30); ctx.lineTo(hd.x-22+jit(hd.seed,2,1), hd.y-26);
  ctx.lineTo(hd.x+22+jit(hd.seed,3,1), hd.y-26); ctx.lineTo(hd.x+22+jit(hd.seed,4,1), hd.y+30);
  ctx.stroke();
  // the dark inside
  ctx.fillStyle='rgba(58,53,44,.14)';
  ctx.fillRect(hd.x-19,hd.y-24,38,52);
  // the seal
  ctx.beginPath(); ctx.arc(hd.x,hd.y-2,8+pulse*2,0,7);
  ctx.strokeStyle=css(col,.8); ctx.lineWidth=2; ctx.stroke();
  ctx.font='9px "Courier New",monospace';
  ctx.textAlign='center';
  ctx.fillStyle='rgba(58,53,44,.65)';
  ctx.fillText(ACT_LABEL[hd.act], hd.x, hd.y+48);
}

function drawDoor(t){
  const pulse=.5+.5*Math.sin(t*3);
  ctx.strokeStyle=css(INK,.6); ctx.lineWidth=2;
  ctx.beginPath();
  ctx.moveTo(door.x-14, door.y-34); ctx.lineTo(door.x+10+jit(door.seed,1,1), door.y-30);
  ctx.moveTo(door.x-14, door.y+34); ctx.lineTo(door.x+10+jit(door.seed,2,1), door.y+30);
  ctx.stroke();
  ctx.beginPath(); ctx.arc(door.x,door.y,10+pulse*4,0,7);
  ctx.strokeStyle=css(INK,.35+.25*pulse); ctx.lineWidth=1.4; ctx.stroke();
  ctx.font='9px "Courier New",monospace';
  ctx.textAlign='center';
  ctx.fillStyle='rgba(58,53,44,.55)';
  ctx.fillText('NEXT BAY', door.x-8, door.y+52);
}

function drawSwatchDrop(sd,t){
  const bob=Math.sin(t*2+sd.seed)*3;
  ctx.save(); ctx.translate(sd.x,sd.y+bob); ctx.rotate(Math.sin(sd.seed)*.15);
  // a paper chip
  ctx.fillStyle=css(PAPER,.9);
  ctx.strokeStyle=css(INK,.5); ctx.lineWidth=1;
  ctx.fillRect(-16,-20,32,40); ctx.strokeRect(-16,-20,32,40);
  ctx.fillStyle=css(tint(sd.def.color),.85);
  ctx.fillRect(-10,-14,20,16);
  if(sd.fugitive){
    ctx.font='7px "Courier New",monospace'; ctx.textAlign='center';
    ctx.fillStyle=css(INK,.55); ctx.fillText('fugitive',0,10);
  }
  ctx.restore();
  ctx.font='9px "Courier New",monospace'; ctx.textAlign='center';
  ctx.fillStyle='rgba(58,53,44,.65)';
  ctx.fillText(sd.def.name, sd.x, sd.y+34);
  ctx.fillStyle='rgba(58,53,44,.45)';
  ctx.fillText(sd.def.desc, sd.x, sd.y+46);
}

function drawKiln(t){
  const k=kiln;
  const st = raid?raid.state:'';
  const heat = st==='firing' ? kilnTemp : (st==='birth'||st==='done'||lib.purple.on) ? 1 : 0;
  if(st==='objective'){
    const pulse=.5+.5*Math.sin(t*2.4);
    ctx.beginPath(); ctx.arc(k.x,k.y,k.r+12+pulse*6,0,7);
    ctx.strokeStyle=css(mix(INK,COLORS.purple.live,.4),.25+.2*pulse); ctx.lineWidth=1.2; ctx.stroke();
  }
  watercolor(ctx,(cc,s)=>{ blobPath(cc,k.x,k.y,k.r*1.05,6,s+k.seed,.18); },
    mix([132,122,112],[96,58,104],heat*.55),[52,44,40],k.seed,
    {a1:.55,a2:.35,edgeW:3,lineW:1.6});
  ctx.strokeStyle='rgba(58,50,44,.35)'; ctx.lineWidth=1;
  for(let i=-1;i<=1;i++){
    ctx.beginPath();
    ctx.moveTo(k.x-k.r*.8, k.y+i*k.r*.4+jit(k.seed,i+90,1));
    ctx.lineTo(k.x+k.r*.8, k.y+i*k.r*.4+jit(k.seed,i+93,1));
    ctx.stroke();
  }
  ctx.beginPath(); blobPath(ctx,k.x,k.y+4,k.r*.42,7,k.seed+5,.3);
  ctx.fillStyle=css(mix([30,26,24],[150,70,160],heat),.9); ctx.fill();
  if(heat>.02){
    ctx.save(); ctx.globalCompositeOperation='lighter';
    ctx.beginPath(); ctx.arc(k.x,k.y+4,k.r*.55,0,7);
    ctx.fillStyle=css([190,100,210],.14*heat*(0.8+.2*Math.sin(t*6))); ctx.fill();
    ctx.restore();
  }
  if(st==='firing'){
    ctx.beginPath(); ctx.arc(k.x,k.y,k.r+18,0,Math.PI*2);
    ctx.strokeStyle='rgba(58,53,44,.2)'; ctx.lineWidth=3; ctx.stroke();
    ctx.beginPath(); ctx.arc(k.x,k.y,k.r+18,-Math.PI/2,-Math.PI/2+kilnTemp*Math.PI*2);
    ctx.strokeStyle=css(COLORS.purple.live,.8); ctx.lineWidth=3; ctx.stroke();
  }
  ctx.font='9px "Courier New",monospace';
  ctx.textAlign='center';
  ctx.fillStyle='rgba(58,53,44,.6)';
  ctx.fillText('KILN — UNACCESSIONED', k.x, k.y+k.r+32);
}

function drawPayne(t){
  const p=player;
  const flick = p.inv>0 && Math.sin(t*40)>0 ? .45 : 1;
  ctx.globalAlpha=flick;
  if(p.dashT>0){
    ctx.beginPath();
    ctx.ellipse(p.x-Math.cos(p.dashA)*18, p.y-Math.sin(p.dashA)*18, 20,8,p.dashA,0,7);
    ctx.fillStyle='rgba(38,33,30,.2)'; ctx.fill();
  }
  watercolor(ctx,(cc,s)=>{ blobPath(cc,p.x,p.y,p.r,11,s+p.seed,.24); },
    PAYNE,[15,12,10],p.seed,{a1:.75,a2:.5,edgeW:2,lineW:1.6,mis:1.5});
  ctx.strokeStyle='rgba(10,8,7,.5)'; ctx.lineWidth=.8;
  for(const f of fissures){
    ctx.beginPath();
    f.forEach(([fx,fy],i)=>{ const X=p.x+fx+jit(p.seed,i,0.6), Y=p.y+fy+jit(p.seed,i+9,0.6);
      i===0?ctx.moveTo(X,Y):ctx.lineTo(X,Y); });
    ctx.stroke();
  }
  // fissure glow IS the charge meter (§3.4) — one seam per owned color
  const own=ownedColors();
  if(own.length){
    ctx.save();
    ctx.globalCompositeOperation='lighter';
    fissures.forEach((f,i)=>{
      const c=own[i%own.length];
      const lt=lib[c].t, ch=p.charge[c];
      if(lt<.02) return;
      ctx.shadowColor=css(COLORS[c].live); ctx.shadowBlur=10*lt*ch+2;
      ctx.strokeStyle=css(COLORS[c].glow, lt*(.12+.88*ch)*flick);
      ctx.lineWidth=1.6;
      ctx.beginPath();
      f.forEach(([fx,fy],j)=>{ const X=p.x+fx, Y=p.y+fy;
        j===0?ctx.moveTo(X,Y):ctx.lineTo(X,Y); });
      ctx.stroke();
    });
    ctx.restore();
  }
  ctx.globalAlpha=1;
  // aim tick — tinted by the loaded mix
  ctx.strokeStyle=css(mix(INK,bulletColor(),ownedColors().length?.8:0),.55); ctx.lineWidth=1.2;
  ctx.beginPath();
  ctx.moveTo(p.x+Math.cos(p.aim)*(p.r+4), p.y+Math.sin(p.aim)*(p.r+4));
  ctx.lineTo(p.x+Math.cos(p.aim)*(p.r+11), p.y+Math.sin(p.aim)*(p.r+11));
  ctx.stroke();
}

/* ============================================================
   TITLE / BOOT
   ============================================================ */
const titleEl=document.getElementById('title');
const beginBtn=document.getElementById('begin');
const resetBtn=document.getElementById('reset');

function applySaveToWorld(s){
  if(!s) return;
  for(const c of COLOR_ORDER){
    if(s[c]){ lib[c].on=true; lib[c].t=1; }
  }
  if(s.red){ slots.delivery='red'; slots.payload='red'; }
  if(typeof s.resonance==='number') resonance=s.resonance;
}
function startGame(){
  audioOn();
  titleEl.style.display='none';
  applySaveToWorld(loadSave());
  player.hits=0;
  for(const c of ownedColors()) player.charge[c]=1;
  enterHub();
  updateWeaponHud();
  blip(392,.2,'sine',.04);
}
beginBtn.addEventListener('click',startGame);
document.getElementById('btnD').addEventListener('click',()=>{audioOn();cycleSlot('delivery');});
document.getElementById('btnP').addEventListener('click',()=>{audioOn();cycleSlot('payload');});
resetBtn.addEventListener('click',()=>{
  try{ localStorage.removeItem(SAVE_KEY); }catch(e){}
  location.reload();
});

(function initTitle(){
  const s=loadSave();
  if(s&&(s.red||s.blue||s.yellow||s.purple)){
    beginBtn.textContent='Resume the restoration';
    resetBtn.style.display='block';
  }
})();

resize(); makeCrates(); makeMotes();
player.x=W/2; player.y=H/2;
updateReport();

let last=performance.now();
function frame(now){
  const t=now/1000;
  let dt=Math.min(.033,(now-last)/1000); last=now;
  update(dt,t);
  render(t);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
