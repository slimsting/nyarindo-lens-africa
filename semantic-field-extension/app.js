/* ═══════════════════════════════════════════════════════════════
   NYARINDO SEMANTIC FIELD
   Training algorithm: Lennard-Jones physics + green stability
   detection + stale state + local wake on injection
   Colors preserved through stale. Status on dashboard only.
═══════════════════════════════════════════════════════════════ */

const canvas = document.getElementById('c');
const ctx    = canvas.getContext('2d');
const tip    = document.getElementById('tip');

let pts = [], ticks = 0, rafId = null, hovered = null;
let systemPhase = 'waiting';
let stableRequired = 300;
let greenStableCount = 0;
let lastGreenCount = -1;

const WALL = 26, R0 = 48, MAX_F = 2.8, DT = 0.87;

/* ── UTILS ── */
function log(m, err=false) {
  const el = document.getElementById('log');
  el.textContent = m; el.className = err ? 'err' : '';
}

const PHASE = {
  waiting:     { label:'waiting',                    col:'#5a5854', dot:'#5a5854' },
  training:    { label:'training',                   col:'#4a9eff', dot:'#4a9eff' },
  stale:       { label:'stale — pattern compressed', col:'#5fc97a', dot:'#5fc97a' },
  integrating: { label:'integrating',                col:'#34d3b5', dot:'#34d3b5' },
  paused:      { label:'paused',                     col:'#f59e0b', dot:'#f59e0b' },
};
function setPhase(p) {
  systemPhase = p;
  const m = PHASE[p] || PHASE.waiting;
  const lightColors = { waiting:'#74766f', training:'#2866ad', stale:'#2e784a', integrating:'#147b71', paused:'#9b6000' };
  document.getElementById('phaseVal').textContent = m.label;
  document.getElementById('phaseVal').style.color = document.documentElement.dataset.theme === 'light' ? (lightColors[p] || lightColors.waiting) : m.col;
  document.getElementById('phaseDot').style.background = document.documentElement.dataset.theme === 'light' ? (lightColors[p] || lightColors.waiting) : m.dot;
}

function updateStatus(gc, sc, wc, stabCount, stabReq) {
  document.getElementById('staleVal').textContent = sc > 0 ? sc : '—';
  document.getElementById('wakeVal').textContent  = wc > 0 ? wc : '—';
  const dimEl = document.getElementById('dimVal');
  if (dimEl && pts.length > 0) {
    const dim = pts[0].vec ? pts[0].vec.length : '—';
    dimEl.textContent = incrTraining
      ? `${currentTrainDim}D / ${maxVocabDim}D`
      : `${dim}D`;
  }
  if (systemPhase === 'stale') {
    document.getElementById('stabPct').textContent   = '100%';
    document.getElementById('stabFill').style.width  = '100%';
    document.getElementById('stabFill').style.background = document.documentElement.dataset.theme === 'light' ? '#2e784a' : '#5fc97a';
    document.getElementById('stabDetail').textContent = `locked — green=${gc}`;
  } else if (systemPhase === 'waiting') {
    document.getElementById('stabPct').textContent   = '—';
    document.getElementById('stabFill').style.width  = '0%';
    document.getElementById('stabDetail').textContent = '—';
  } else {
    const pct = Math.min(100, Math.round((stabCount / stabReq) * 100));
    document.getElementById('stabPct').textContent   = pct + '%';
    document.getElementById('stabFill').style.width  = pct + '%';
    document.getElementById('stabFill').style.background =
      pct < 40 ? '#ff5f5f' : pct < 80 ? '#f59e0b' : '#5fc97a';
    document.getElementById('stabDetail').textContent =
      `green=${gc}, stable ${stabCount}/${stabReq} ticks`;
  }
}

/* ── CANVAS ── */
function resize() {
  const p = canvas.parentElement;
  canvas.width  = Math.floor(p.clientWidth)  || 600;
  canvas.height = Math.floor(p.clientHeight) || 500;
}
resize();
window.addEventListener('resize', () => { resize(); if (!pts.length) draw(); });

/* ── VOCABULARY: 6D vectors [animate, nature, abstract, social, force, scale] ── */
const VOCAB = {
  lion:[0.95,0.80,0.0,0.1,0.7,0.6],      tiger:[0.95,0.80,0.0,0.1,0.75,0.6],
  leopard:[0.95,0.78,0.0,0.1,0.7,0.5],   wolf:[0.90,0.78,0.0,0.3,0.65,0.55],
  dog:[0.90,0.65,0.0,0.6,0.3,0.35],      cat:[0.88,0.60,0.0,0.5,0.25,0.3],
  elephant:[0.92,0.82,0.0,0.2,0.5,0.85], whale:[0.92,0.85,0.0,0.1,0.4,0.95],
  bird:[0.88,0.75,0.0,0.1,0.3,0.3],      fish:[0.85,0.75,0.0,0.1,0.2,0.3],
  animal:[0.88,0.72,0.0,0.1,0.4,0.5],    human:[0.95,0.5,0.3,0.8,0.5,0.6],
  person:[0.95,0.45,0.25,0.8,0.45,0.55], child:[0.95,0.45,0.1,0.75,0.25,0.3],
  tree:[0.3,0.92,0.0,0.05,0.1,0.7],      forest:[0.4,0.95,0.0,0.05,0.15,0.8],
  plant:[0.25,0.88,0.0,0.05,0.05,0.4],   flower:[0.2,0.85,0.1,0.15,0.05,0.25],
  ocean:[0.1,0.95,0.0,0.05,0.6,0.95],    sea:[0.1,0.93,0.0,0.05,0.55,0.9],
  river:[0.1,0.90,0.0,0.1,0.45,0.7],     lake:[0.1,0.88,0.0,0.1,0.3,0.65],
  water:[0.05,0.85,0.0,0.1,0.35,0.6],    mountain:[0.05,0.92,0.0,0.05,0.3,0.95],
  earth:[0.05,0.90,0.1,0.1,0.4,1.0],     sky:[0.05,0.88,0.1,0.05,0.2,0.9],
  sun:[0.0,0.85,0.1,0.05,0.9,0.95],      fire:[0.0,0.7,0.1,0.1,0.95,0.6],
  wind:[0.0,0.75,0.1,0.05,0.7,0.6],      stone:[0.0,0.80,0.0,0.05,0.1,0.5],
  banana:[0.0,0.80,0.0,0.2,0.0,0.2],     fruit:[0.0,0.78,0.0,0.2,0.0,0.25],
  food:[0.1,0.5,0.0,0.4,0.0,0.3],
  justice:[0.0,0.0,0.95,0.75,0.5,0.7],   law:[0.0,0.0,0.90,0.8,0.55,0.65],
  rule:[0.0,0.0,0.85,0.75,0.5,0.55],     order:[0.0,0.05,0.82,0.7,0.5,0.6],
  ethics:[0.0,0.0,0.92,0.7,0.45,0.65],   morality:[0.0,0.0,0.93,0.65,0.45,0.65],
  truth:[0.0,0.0,0.95,0.6,0.5,0.7],      freedom:[0.1,0.1,0.88,0.7,0.6,0.75],
  rights:[0.0,0.0,0.85,0.75,0.5,0.65],   democracy:[0.0,0.0,0.85,0.9,0.5,0.8],
  politics:[0.0,0.0,0.75,0.95,0.6,0.75], power:[0.0,0.1,0.7,0.75,0.85,0.8],
  government:[0.0,0.0,0.7,0.95,0.65,0.8],war:[0.1,0.1,0.5,0.8,0.95,0.85],
  peace:[0.05,0.1,0.7,0.8,0.1,0.65],     conflict:[0.1,0.05,0.55,0.75,0.9,0.75],
  violence:[0.2,0.05,0.35,0.5,0.95,0.7], love:[0.3,0.2,0.6,0.85,0.2,0.55],
  hate:[0.1,0.05,0.55,0.6,0.85,0.6],     fear:[0.4,0.1,0.5,0.55,0.7,0.5],
  joy:[0.3,0.2,0.6,0.7,0.15,0.5],        grief:[0.2,0.05,0.65,0.6,0.3,0.45],
  pain:[0.3,0.05,0.55,0.5,0.7,0.45],     harmony:[0.05,0.2,0.72,0.55,0.1,0.55],
  mind:[0.1,0.0,0.9,0.5,0.4,0.65],       thought:[0.05,0.0,0.92,0.45,0.35,0.55],
  awareness:[0.1,0.0,0.95,0.4,0.3,0.6],  consciousness:[0.1,0.0,0.97,0.35,0.3,0.7],
  perception:[0.1,0.0,0.90,0.4,0.35,0.6],attention:[0.1,0.0,0.85,0.45,0.4,0.55],
  memory:[0.1,0.0,0.88,0.45,0.3,0.55],
  container:[0.0,0.1,0.7,0.3,0.4,0.6],   boundary:[0.0,0.1,0.75,0.3,0.45,0.55],
  field:[0.0,0.2,0.72,0.3,0.5,0.7],      pulse:[0.1,0.2,0.7,0.25,0.65,0.45],
  expansion:[0.0,0.1,0.75,0.2,0.8,0.7],  contraction:[0.0,0.1,0.72,0.2,0.75,0.6],
  balance:[0.0,0.1,0.80,0.35,0.3,0.55],  equilibrium:[0.0,0.1,0.82,0.3,0.25,0.55],
  resonance:[0.0,0.2,0.78,0.3,0.6,0.55], rhythm:[0.1,0.25,0.7,0.4,0.55,0.5],
  pattern:[0.0,0.1,0.75,0.35,0.4,0.5],   fog:[0.0,0.4,0.6,0.15,0.2,0.4],
  clarity:[0.0,0.1,0.8,0.35,0.35,0.5],   signal:[0.0,0.0,0.72,0.4,0.6,0.5],
  noise:[0.0,0.1,0.55,0.25,0.5,0.4],     force:[0.0,0.15,0.6,0.2,0.95,0.7],
  energy:[0.0,0.2,0.65,0.2,0.9,0.7],     wave:[0.0,0.3,0.6,0.15,0.7,0.55],
  particle:[0.0,0.1,0.6,0.1,0.5,0.2],    matter:[0.0,0.2,0.6,0.1,0.4,0.5],
  space:[0.0,0.3,0.7,0.1,0.3,0.95],      time:[0.0,0.1,0.8,0.15,0.4,0.9],
  void:[0.0,0.1,0.7,0.05,0.05,0.8],      emptiness:[0.0,0.1,0.72,0.05,0.05,0.75],
  silence:[0.0,0.2,0.7,0.1,0.05,0.55],   stillness:[0.0,0.15,0.72,0.1,0.05,0.5],
  motion:[0.1,0.2,0.55,0.15,0.8,0.55],   change:[0.0,0.1,0.7,0.3,0.65,0.6],
  flow:[0.05,0.4,0.6,0.2,0.6,0.6],       structure:[0.0,0.1,0.7,0.35,0.35,0.65],
  system:[0.0,0.05,0.72,0.4,0.4,0.7],    network:[0.0,0.0,0.65,0.6,0.5,0.65],
  connection:[0.05,0.1,0.7,0.6,0.4,0.55],separation:[0.0,0.1,0.68,0.35,0.55,0.55],
  unity:[0.05,0.1,0.78,0.6,0.3,0.65],    division:[0.0,0.05,0.68,0.5,0.6,0.6],
  whole:[0.05,0.15,0.75,0.45,0.3,0.7],   part:[0.0,0.1,0.6,0.3,0.3,0.4],
  self:[0.3,0.0,0.75,0.5,0.3,0.5],       other:[0.2,0.05,0.65,0.55,0.3,0.5],
  god:[0.0,0.1,0.92,0.5,0.8,0.95],       spirit:[0.0,0.1,0.90,0.45,0.6,0.8],
  soul:[0.1,0.05,0.88,0.5,0.45,0.7],     religion:[0.0,0.05,0.82,0.75,0.5,0.75],
  faith:[0.0,0.05,0.85,0.65,0.4,0.65],   science:[0.0,0.05,0.85,0.55,0.55,0.75],
  knowledge:[0.0,0.0,0.88,0.5,0.45,0.7], wisdom:[0.05,0.05,0.90,0.55,0.4,0.7],
  learning:[0.1,0.0,0.80,0.6,0.4,0.6],   growth:[0.1,0.3,0.7,0.4,0.55,0.6],
  decay:[0.05,0.3,0.55,0.2,0.45,0.55],   birth:[0.5,0.3,0.5,0.4,0.4,0.4],
  death:[0.2,0.15,0.65,0.35,0.5,0.55],   life:[0.5,0.4,0.5,0.5,0.4,0.6],
  red:[0.0,0.1,0.3,0.2,0.8,0.4],         blue:[0.0,0.3,0.35,0.3,0.4,0.5],
  green:[0.0,0.5,0.25,0.25,0.2,0.45],
  nyarindo:[0.1,0.1,0.90,0.35,0.5,0.65], dot:[0.0,0.1,0.6,0.2,0.3,0.2],
  lens:[0.0,0.0,0.78,0.3,0.45,0.4],      attending:[0.05,0.05,0.80,0.4,0.3,0.45],
  grammar:[0.0,0.0,0.75,0.5,0.35,0.5],   ontology:[0.0,0.0,0.88,0.4,0.4,0.65],
  coherence:[0.0,0.05,0.85,0.4,0.3,0.65],integration:[0.0,0.05,0.78,0.4,0.45,0.6],
  compression:[0.0,0.0,0.72,0.3,0.4,0.55],protocol:[0.0,0.0,0.70,0.45,0.5,0.55],
  metabolism:[0.1,0.2,0.6,0.2,0.4,0.5],  mycelium:[0.1,0.85,0.2,0.1,0.3,0.4],
  kernel:[0.0,0.0,0.6,0.25,0.45,0.45],   stale:[0.0,0.05,0.65,0.2,0.1,0.4],
};

/* ── VECTOR UTILS ── */
function cosineSim(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let d=0,ma=0,mb=0;
  for (let i=0;i<a.length;i++) { d+=a[i]*b[i]; ma+=a[i]*a[i]; mb+=b[i]*b[i]; }
  return d / (Math.sqrt(ma) * Math.sqrt(mb) || 1);
}
function getVector(word) {
  const w = word.toLowerCase().trim();
  // 1. check existing field nodes — primary source for uploaded vocabularies
  const fieldNode = pts.find(p => p.label.toLowerCase() === w);
  if (fieldNode) return fieldNode.vec;
  // 2. determine target dimensionality from field
  const dim = pts.length > 0 ? pts[0].vec.length : 6;
  // 3. fallback to hardcoded 6D vocab only if field is empty and word exists there
  if (dim === 6 && VOCAB[w]) return VOCAB[w];
  // 4. hash to field dimensionality
  const chars = w.split('');
  const v = new Array(dim).fill(0);
  chars.forEach((c,i) => { v[i % dim] += c.charCodeAt(0) / 122 / chars.length; });
  const mag = Math.sqrt(v.reduce((s,x) => s+x*x, 0)) || 1;
  return v.map(x => x / mag * 0.5);
}
function pca2d(vecs) {
  const n=vecs.length, d=vecs[0].length;
  const mean = new Array(d).fill(0);
  vecs.forEach(v => v.forEach((x,i) => mean[i] += x/n));
  const C = vecs.map(v => v.map((x,i) => x-mean[i]));
  function dot(a,b){let s=0;for(let i=0;i<a.length;i++)s+=a[i]*b[i];return s;}
  function norm(v){const m=Math.sqrt(dot(v,v))||1;return v.map(x=>x/m);}
  function powerIter(mat,iters=80){
    let u=new Array(d).fill(0); u[0]=1;
    for(let k=0;k<iters;k++){
      const w=new Array(d).fill(0);
      mat.forEach(r=>{const s=dot(r,u);r.forEach((x,j)=>w[j]+=x*s);});
      u=norm(w);
    }
    return u;
  }
  const u1=powerIter(C);
  const D=C.map(v=>{const s=dot(v,u1);return v.map((x,j)=>x-s*u1[j]);});
  const u2=powerIter(D);
  return C.map(v=>({x:dot(v,u1), y:dot(v,u2)}));
}

/* ── SPAWN ── */
function spawn(labels, rawVecs, coords) {
  const W=canvas.width, H=canvas.height, pad=72;
  const xs=coords.map(c=>c.x), ys=coords.map(c=>c.y);
  const mnX=Math.min(...xs), mxX=Math.max(...xs);
  const mnY=Math.min(...ys), mxY=Math.max(...ys);
  const rX=mxX-mnX||1, rY=mxY-mnY||1;
  pts = labels.map((lbl,i) => ({
    label: lbl,
    vec: rawVecs[i],
    inVocab: !!VOCAB[lbl.toLowerCase().trim()],
    x: WALL+pad + ((coords[i].x-mnX)/rX)*(W-WALL*2-pad*2),
    y: WALL+pad + ((coords[i].y-mnY)/rY)*(H-WALL*2-pad*2),
    vx: (Math.random()-0.5)*0.3,
    vy: (Math.random()-0.5)*0.3,
    prevSpd: 0,
    state: 'exp',
    frozenState: 'exp',  // color preserved through stale
    stale: false,
    woken: false,
    nearestIdx: -1,
    nearestSim: 0,
  }));
  updateNearest();
}
function updateNearest() {
  for (let i=0;i<pts.length;i++) {
    let bestSim=-1, bestJ=-1;
    for (let j=0;j<pts.length;j++) {
      if (i===j) continue;
      const s = cosineSim(pts[i].vec, pts[j].vec);
      if (s>bestSim) { bestSim=s; bestJ=j; }
    }
    pts[i].nearestIdx = bestJ;
    pts[i].nearestSim = bestSim;
  }
}

/* ── PHYSICS ── */
function lj(r, att, rep) {
  if (r<1) r=1;
  const s6=Math.pow(R0/r,6), s12=s6*s6;
  return (rep*0.5*12*s12/r) - (att*0.07*6*s6/r);
}

/* ── EQUILIBRIUM DETECTION: green count stability ── */
function checkEquilibrium(gc) {
  if (systemPhase!=='training' && systemPhase!=='integrating') return;
  if (gc === lastGreenCount) greenStableCount++;
  else greenStableCount = 0;
  lastGreenCount = gc;
  if (greenStableCount >= stableRequired) {
    pts.filter(p=>!p.stale).forEach(p => {
      p.frozenState = p.state;
      p.stale = true;
      p.woken = false;
      p.vx = 0; p.vy = 0;
    });
    setPhase('stale');
    greenStableCount = 0;
    lastGreenCount = -1;
    cancelAnimationFrame(rafId); rafId = null;
    if (incrTraining) {
      checkDimensionStep();
    } else {
      log(`equilibrium — green locked at ${gc}. inject to continue.`);
    }
  }
}

/* ── TICK ── */
function tick() {
  const W=canvas.width, H=canvas.height;
  const att  = parseFloat(document.getElementById('att').value);
  const rep  = parseFloat(document.getElementById('rep').value);
  const damp = parseFloat(document.getElementById('damp').value);
  const n = pts.length; if (!n) return;

  const ax=new Float32Array(n), ay=new Float32Array(n);
  for (let i=0;i<n;i++) {
    if (pts[i].stale) continue;
    for (let j=i+1;j<n;j++) {
      if (pts[j].stale) continue;
      const dx=pts[j].x-pts[i].x, dy=pts[j].y-pts[i].y;
      const r=Math.sqrt(dx*dx+dy*dy)||0.1;
      const f=Math.max(-MAX_F, Math.min(MAX_F, lj(r,att,rep)));
      const nx=dx/r, ny=dy/r;
      ax[i]+=f*nx; ay[i]+=f*ny;
      ax[j]-=f*nx; ay[j]-=f*ny;
    }
  }

  let bc=0,rc=0,gc=0,sc=0,wc=0;
  for (let i=0;i<n;i++) {
    const p=pts[i];
    if (p.stale) { sc++; continue; }
    if (p.woken) wc++;
    p.vx=(p.vx+ax[i]*DT)*damp;
    p.vy=(p.vy+ay[i]*DT)*damp;
    const sp=Math.sqrt(p.vx*p.vx+p.vy*p.vy);
    if (sp>3) { p.vx*=3/sp; p.vy*=3/sp; }
    p.state = sp<0.06 ? 'eq' : sp>p.prevSpd ? 'exp' : 'con';
    p.prevSpd=sp;
    p.x+=p.vx*DT; p.y+=p.vy*DT;
    if(p.x<WALL){p.x=WALL;p.vx=Math.abs(p.vx)*0.5;}
    if(p.x>W-WALL){p.x=W-WALL;p.vx=-Math.abs(p.vx)*0.5;}
    if(p.y<WALL){p.y=WALL;p.vy=Math.abs(p.vy)*0.5;}
    if(p.y>H-WALL){p.y=H-WALL;p.vy=-Math.abs(p.vy)*0.5;}
    if(p.state==='exp')bc++; else if(p.state==='con')rc++; else gc++;
  }
  ticks++;
  checkEquilibrium(gc);
  updateStatus(gc,sc,wc,greenStableCount,stableRequired);
  document.getElementById('sB').textContent=bc;
  document.getElementById('sR').textContent=rc;
  document.getElementById('sG').textContent=gc;
  document.getElementById('sT').textContent=ticks;
}

/* ── DRAW ── */
const COL = { exp:[74,158,255], con:[255,95,95], eq:[95,201,122] };
const WOKEN = [167,139,250];

function draw() {
  const W=canvas.width, H=canvas.height;
  const lightTheme = document.documentElement.dataset.theme === 'light';
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle=lightTheme ? '#f2f0e9' : '#0c0d0e';
  ctx.fillRect(0,0,W,H);

  // subtle grid
  ctx.strokeStyle=lightTheme ? 'rgba(35,38,32,0.07)' : 'rgba(255,255,255,0.025)';
  ctx.lineWidth=0.5;
  const gs=90;
  for(let x=0;x<W;x+=gs){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for(let y=0;y<H;y+=gs){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

  // container wall
  ctx.strokeStyle=lightTheme ? 'rgba(138,97,47,0.24)' : 'rgba(200,184,154,0.1)';
  ctx.lineWidth=0.5;
  ctx.setLineDash([2,8]);
  ctx.strokeRect(WALL,WALL,W-WALL*2,H-WALL*2);
  ctx.setLineDash([]);

  // bond lines — all pairs within draw range
  for (let i=0;i<pts.length;i++) {
    for (let j=i+1;j<pts.length;j++) {
      const pi=pts[i], pj=pts[j];
      const dx=pj.x-pi.x, dy=pj.y-pi.y;
      const dist=Math.sqrt(dx*dx+dy*dy);
      const maxDraw = pts.length > 150 ? R0*2.2 : R0*3.6;
      if (dist>maxDraw) continue;
      const bothStale = pi.stale && pj.stale;
      const bothActive = !pi.stale && !pj.stale;
      if (!bothStale && !bothActive) continue;
      const sim = cosineSim(pi.vec, pj.vec);
      const prox = 1-dist/maxDraw;
      const baseA = bothStale ? 0.08 : prox*0.28;
      let r,g,b;
      if (sim>0.85)      { r=lightTheme?46:95;  g=lightTheme?120:201; b=lightTheme?74:122; }
      else if (sim>0.65) { r=lightTheme?155:245; g=lightTheme?96:158; b=lightTheme?0:11; }
      else               { r=lightTheme?183:255; g=lightTheme?59:80;  b=lightTheme?59:70; }
      const eq = !bothStale && pi.state==='eq' && pj.state==='eq';
      ctx.beginPath();
      ctx.moveTo(pi.x,pi.y); ctx.lineTo(pj.x,pj.y);
      ctx.strokeStyle=`rgba(${r},${g},${b},${(baseA*(eq?2.0:1)).toFixed(3)})`;
      ctx.lineWidth = bothStale ? 0.35 : eq ? 0.9 : 0.4;
      ctx.stroke();
    }
  }

  // nodes
  const lightCOL = { exp:[40,99,163], con:[183,59,59], eq:[46,120,74] };
  const lightWOKEN = [112,75,163];
  const renderedNodes = [];
  for (const p of pts) {
    const isHov = p===hovered;
    const cs = p.stale ? p.frozenState : (p.woken ? 'woken' : p.state);
    const [r,g,b] = cs==='woken' ? (lightTheme ? lightWOKEN : WOKEN) : ((lightTheme ? lightCOL[cs] : COL[cs]) || (lightTheme ? lightCOL.eq : COL.eq));
    const coreAlpha = p.stale ? 0.52 : 0.92;

    // glow — only on hover at high node counts
    if (isHov || pts.length < 100) {
      ctx.beginPath(); ctx.arc(p.x,p.y,isHov?8:4,0,Math.PI*2);
      ctx.fillStyle=`rgba(${r},${g},${b},${isHov?0.18:(p.stale?0.04:0.08)})`;
      ctx.fill();
    }

    // core dot
    ctx.beginPath(); ctx.arc(p.x,p.y,isHov?3:1.5,0,Math.PI*2);
    ctx.fillStyle=`rgba(${r},${g},${b},${coreAlpha})`;
    ctx.fill();

    // stale ring
    if (p.stale && pts.length < 150) {
      ctx.beginPath(); ctx.arc(p.x,p.y,5,0,Math.PI*2);
      ctx.strokeStyle=`rgba(${r},${g},${b},0.18)`;
      ctx.lineWidth=0.7; ctx.setLineDash([1.5,3]); ctx.stroke(); ctx.setLineDash([]);
    }

    // unknown vocab ring
    if (!p.inVocab && pts.length < 150) {
      ctx.beginPath(); ctx.arc(p.x,p.y,p.stale?6:4,0,Math.PI*2);
      ctx.strokeStyle=`rgba(${r},${g},${b},0.22)`;
      ctx.lineWidth=0.4; ctx.setLineDash([2,2]); ctx.stroke(); ctx.setLineDash([]);
    }

    renderedNodes.push({ p, r, g, b, isHov });
  }

  // labels — readable rounded bubbles; avoid collisions when the field is small
  const placedLabels = [];
  const labelHeight = 24;
  const labelGap = 4;
  ctx.font = '600 12px "IBM Plex Mono", monospace';
  ctx.textBaseline = 'middle';

  function roundedRectPath(x, y, w, h, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function overlapsPlacedLabel(candidate) {
    return placedLabels.some(box =>
      candidate.x < box.x + box.w + labelGap &&
      candidate.x + candidate.w + labelGap > box.x &&
      candidate.y < box.y + box.h + labelGap &&
      candidate.y + candidate.h + labelGap > box.y
    );
  }

  for (const { p, r, g, b, isHov } of renderedNodes) {
    if (!isHov && pts.length > 60) continue;
    const width = Math.ceil(ctx.measureText(p.label).width) + 14;
    const candidates = [
      { x:p.x+8, y:p.y-labelHeight/2, w:width, h:labelHeight },
      { x:p.x-width-8, y:p.y-labelHeight/2, w:width, h:labelHeight },
      { x:p.x-width/2, y:p.y-labelHeight-12, w:width, h:labelHeight },
      { x:p.x-width/2, y:p.y+12, w:width, h:labelHeight }
    ];
    const bubble = candidates.find(box =>
      box.x >= WALL &&
      box.y >= WALL &&
      box.x + box.w <= W-WALL &&
      box.y + box.h <= H-WALL &&
      !overlapsPlacedLabel(box)
    ) || candidates[0];

    placedLabels.push(bubble);
    roundedRectPath(bubble.x, bubble.y, bubble.w, bubble.h, 8);
    ctx.fillStyle = lightTheme
      ? (p.stale ? 'rgba(242,240,233,.78)' : 'rgba(248,246,239,.94)')
      : (p.stale ? 'rgba(15,17,17,.72)' : 'rgba(12,14,14,.9)');
    ctx.fill();
    ctx.strokeStyle = `rgba(${r},${g},${b},${isHov ? .82 : p.stale ? .28 : .48})`;
    ctx.lineWidth = isHov ? 1.2 : .75;
    ctx.stroke();

    ctx.fillStyle = lightTheme
      ? (p.stale ? 'rgba(70,72,65,.82)' : 'rgba(35,38,32,.96)')
      : (p.stale ? 'rgba(187,184,175,.78)' : 'rgba(235,232,224,.98)');
    ctx.fillText(p.label, bubble.x + 7, bubble.y + bubble.h / 2 + .5);
  }
  ctx.textBaseline = 'alphabetic';

  // cluster labels — only when stale and above 80 nodes
  if (systemPhase === 'stale' && pts.length > 80) {
    computeClusterLabels();
  }
}

/* ── CLUSTER LABELS ── */
function computeClusterLabels() {
  if (!pts.length) return;

  // count deep bonds (sim > 0.85) per node
  const deepBonds = new Array(pts.length).fill(0);
  for (let i=0;i<pts.length;i++) {
    for (let j=i+1;j<pts.length;j++) {
      const sim = cosineSim(pts[i].vec, pts[j].vec);
      if (sim > 0.85) { deepBonds[i]++; deepBonds[j]++; }
    }
  }

  // identify cluster representatives using spatial proximity grouping
  const visited = new Array(pts.length).fill(false);
  const clusterRadius = R0 * 2.8;

  ctx.font = '600 12px "IBM Plex Mono", monospace';
  ctx.textBaseline = 'middle';

  for (let i=0;i<pts.length;i++) {
    if (visited[i] || deepBonds[i] === 0) continue;

    // find all nodes within spatial radius
    const cluster = [i];
    for (let j=0;j<pts.length;j++) {
      if (i===j) continue;
      const dx=pts[j].x-pts[i].x, dy=pts[j].y-pts[i].y;
      if (Math.sqrt(dx*dx+dy*dy) < clusterRadius) cluster.push(j);
    }

    if (cluster.length < 3) continue;

    // find node with most deep bonds within this cluster
    let bestIdx = cluster[0];
    let bestCount = -1;
    for (const idx of cluster) {
      if (deepBonds[idx] > bestCount) { bestCount = deepBonds[idx]; bestIdx = idx; }
    }

    // mark all in cluster visited
    cluster.forEach(idx => visited[idx] = true);

    // draw cluster label at representative node position
    const rep = pts[bestIdx];
    const cs = rep.frozenState || 'eq';
    const [r,g,b] = COL[cs] || COL.eq;

    const lw = ctx.measureText(rep.label).width;
    const bubbleX = rep.x - 7;
    const bubbleY = rep.y - 18;
    const bubbleW = lw + 14;
    const bubbleH = 24;
    ctx.beginPath();
    ctx.roundRect(bubbleX, bubbleY, bubbleW, bubbleH, 8);
    ctx.fillStyle = 'rgba(12,13,14,0.82)';
    ctx.fill();
    ctx.strokeStyle = `rgba(${r},${g},${b},0.62)`;
    ctx.lineWidth = .8;
    ctx.stroke();

    ctx.fillStyle = 'rgba(236,233,226,0.96)';
    ctx.fillText(rep.label, bubbleX + 7, bubbleY + bubbleH / 2 + .5);
  }

  ctx.font = '10px "IBM Plex Mono", monospace';
  ctx.textBaseline = 'alphabetic';
}

function loop() { tick(); draw(); rafId = requestAnimationFrame(loop); }

/* ── HOVER ── */
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX-rect.left)*(canvas.width/rect.width);
  const my = (e.clientY-rect.top)*(canvas.height/rect.height);
  let found=null, best=999;
  for (const p of pts) {
    const d = Math.sqrt((p.x-mx)**2+(p.y-my)**2);
    if (d<24 && d<best) { best=d; found=p; }
  }
  hovered = found;
  if (found && found.nearestIdx>=0) {
    const nearest = pts[found.nearestIdx];
    const sim = found.nearestSim;
    const ds = found.stale ? found.frozenState : found.state;
    let stateLabel, stateCol;
    if (found.stale) {
      stateLabel = `stale — earned ${ds}`;
      stateCol = ds==='eq'?'#5fc97a' : ds==='exp'?'#4a9eff' : '#ff5f5f';
    } else if (found.woken) {
      stateLabel='woken — integrating'; stateCol='#a78bfa';
    } else if (found.state==='exp') {
      stateLabel='expanding — blue'; stateCol='#4a9eff';
    } else if (found.state==='con') {
      stateLabel='contracting — red'; stateCol='#ff5f5f';
    } else {
      stateLabel='equilibrium — green'; stateCol='#5fc97a';
    }
    const bondLabel = sim>0.92?'deep semantic bond':sim>0.78?'semantic bond':sim>0.60?'loose semantic':'proximity only';
    document.getElementById('tipWord').textContent    = found.label+(found.inVocab?'':' *');
    document.getElementById('tipNearest').textContent = 'nearest: '+nearest.label+' ('+sim.toFixed(2)+')';
    document.getElementById('tipBar').style.width     = Math.round(sim*100)+'%';
    document.getElementById('tipBar').style.background= stateCol;
    document.getElementById('tipSim').textContent     = (sim*100).toFixed(0)+'% cosine similarity';
    document.getElementById('tipState').textContent   = stateLabel;
    document.getElementById('tipState').style.color   = stateCol;
    document.getElementById('tipBond').textContent    = bondLabel;
    tooltipShowPayload(found.label);
    const fx=e.clientX-rect.left, fy=e.clientY-rect.top;
    tip.style.left = (fx>canvas.clientWidth/2 ? fx-186 : fx+14)+'px';
    tip.style.top  = Math.max(4, fy-72)+'px';
    tip.style.display='block';
  } else {
    tip.style.display='none';
  }
});
canvas.addEventListener('mouseleave', () => { hovered=null; tip.style.display='none'; });

/* ── CONTROLS ── */
function stopTraining() {
  if (!rafId) { log('nothing running', true); return; }
  cancelAnimationFrame(rafId); rafId = null;
  log('training paused — press proceed to resume or force stale');
  setPhase('paused');
}

function proceedTraining() {
  if (systemPhase === 'stale') { log('field already stale', true); return; }
  if (systemPhase === 'waiting') { log('train the field first', true); return; }
  if (rafId) {
    // force stale now
    pts.forEach(p => {
      p.stale = true; p.woken = false;
      p.frozenState = p.state;
      p.vx = 0; p.vy = 0;
    });
    cancelAnimationFrame(rafId); rafId = null;
    setPhase('stale');
    log('forced stale — structure committed as-is');
  } else {
    // resume from pause
    if (!rafId) loop();
    setPhase('integrating');
    log('resumed');
  }
}

function startTraining() {
  const raw = document.getElementById('inp').value.trim();
  if (!raw) { log('add items first', true); return; }
  const labels = [...new Set(raw.split('\n').map(s=>s.trim().replace(/[,.]$/,'')).filter(Boolean))];
  if (labels.length<2) { log('need at least 2 items', true); return; }
  if (labels.length>500) { log('max 500 items', true); return; }
  if (rafId) { cancelAnimationFrame(rafId); rafId=null; }
  pts=[]; ticks=0; greenStableCount=0; lastGreenCount=-1;
  ['sB','sR','sG','sT'].forEach(id=>document.getElementById(id).textContent='0');
  updateStatus(0,0,0,0,stableRequired);
  const vecs   = labels.map(l=>getVector(l));
  const coords = pca2d(vecs);
  spawn(labels, vecs, coords);
  setPhase('training');
  log(`training ${labels.length} nodes — watching green stability…`);
  loop();
}

function injectData() {
  const raw = document.getElementById('newItem').value.trim();
  if (!raw) { log('enter a word to inject', true); return; }
  if (systemPhase==='waiting') { log('train field first', true); return; }
  const label = raw.replace(/[,.]$/,'');
  const vec = getVector(label);
  const sims = pts.map((p,i)=>({i, sim:cosineSim(vec,p.vec)}));
  sims.sort((a,b)=>b.sim-a.sim);
  const topN = Math.min(3, sims.length);
  const neighbours = sims.slice(0,topN).map(s=>s.i);
  const anchor = pts[neighbours[0]];
  pts.push({
    label, vec,
    inVocab: !!VOCAB[label.toLowerCase()],
    x: anchor.x+(Math.random()-0.5)*44,
    y: anchor.y+(Math.random()-0.5)*44,
    vx:(Math.random()-0.5)*0.5, vy:(Math.random()-0.5)*0.5,
    prevSpd:0, state:'exp', frozenState:'exp',
    stale:false, woken:true,
    nearestIdx:-1, nearestSim:0,
  });
  neighbours.forEach(i => {
    pts[i].stale=false; pts[i].woken=true;
    pts[i].vx=(Math.random()-0.5)*0.4; pts[i].vy=(Math.random()-0.5)*0.4;
    pts[i].state='exp'; pts[i].frozenState='exp';
  });
  updateNearest();
  greenStableCount=0; lastGreenCount=-1;
  setPhase('integrating');
  log(`"${label}" injected — woke: ${neighbours.map(i=>pts[i].label).join(', ')}`);
  if (!rafId) loop();
}

function resetField() {
  if (rafId) { cancelAnimationFrame(rafId); rafId=null; }
  pts=[]; ticks=0; greenStableCount=0; lastGreenCount=-1; hovered=null;
  tip.style.display='none';
  ['sB','sR','sG','sT'].forEach(id=>document.getElementById(id).textContent='0');
  updateStatus(0,0,0,0,stableRequired);
  setPhase('waiting');
  log('ready');
  draw();
  // reset results pane
  document.getElementById('resultsQueryLabel').textContent = '—';
  const empty = document.createElement('div');
  empty.className = 'results-empty';
  empty.append('run a query on the', document.createElement('br'), 'read tab to see results');
  document.getElementById('resultsBody').replaceChildren(empty);
  document.getElementById('resultsMeta').textContent = '—';
}

/* ── DATABASE LAYER ── */
// payload map: label (lowercase) → arbitrary string value
const payloadDB = new Map();

function dbPayloadCount() { return payloadDB.size; }

function updateHeaderCount() {
  const target = document.getElementById('headerPayloadCount');
  if (!target) return;
  const n = dbPayloadCount();
  target.textContent =
    `semantic db — ${n} record${n===1?'':'s'}`;
}

function updateRecordList() {
  const count = payloadDB.size;
  document.getElementById('recordCount').textContent = count;
  const list = document.getElementById('recordList');
  if (count === 0) {
    const empty = document.createElement('div');
    empty.className = 'record-list-empty';
    empty.textContent = 'no records yet';
    list.replaceChildren(empty);
    return;
  }
  list.replaceChildren();
  for (const [k, v] of payloadDB) {
    const row = document.createElement('div');
    row.className = 'record-row';
    const keyEl = document.createElement('div');
    keyEl.className = 'record-key';
    keyEl.textContent = k;
    const valEl = document.createElement('div');
    valEl.className = 'record-value';
    valEl.textContent = v;
    row.appendChild(keyEl);
    row.appendChild(valEl);
    list.appendChild(row);
  }
  updateHeaderCount();
}

/* ── WRITE API ── */
function dbInsert(keyOverride, valueOverride) {
  const key   = (keyOverride   !== undefined) ? keyOverride   : document.getElementById('writeKey').value.trim();
  const value = (valueOverride !== undefined) ? valueOverride : document.getElementById('writeVal').value.trim();
  if (!key) { log('key required', true); return false; }
  if (systemPhase === 'waiting') { log('train the field first', true); return false; }

  const label = key.replace(/[,.]$/,'');
  payloadDB.set(label.toLowerCase(), value);

  // inject node into field
  const vec = getVector(label);
  const sims = pts.map((p,i)=>({i, sim:cosineSim(vec,p.vec)}));
  sims.sort((a,b)=>b.sim-a.sim);
  const topN = Math.min(3, sims.length);
  const neighbours = sims.slice(0,topN).map(s=>s.i);
  const anchor = pts[neighbours[0]];

  // check if this key already has a node in the field
  const existing = pts.findIndex(p=>p.label.toLowerCase()===label.toLowerCase());
  if (existing >= 0) {
    // update payload only, node already placed
    updateRecordList();
    log(`payload updated: "${label}"`);
    return true;
  }

  pts.push({
    label, vec,
    inVocab: !!VOCAB[label.toLowerCase()],
    x: anchor.x+(Math.random()-0.5)*44,
    y: anchor.y+(Math.random()-0.5)*44,
    vx:(Math.random()-0.5)*0.5, vy:(Math.random()-0.5)*0.5,
    prevSpd:0, state:'exp', frozenState:'exp',
    stale:false, woken:true,
    nearestIdx:-1, nearestSim:0,
  });
  neighbours.forEach(i => {
    pts[i].stale=false; pts[i].woken=true;
    pts[i].vx=(Math.random()-0.5)*0.4; pts[i].vy=(Math.random()-0.5)*0.4;
    pts[i].state='exp'; pts[i].frozenState='exp';
  });
  updateNearest();
  greenStableCount=0; lastGreenCount=-1;
  setPhase('integrating');
  if (!rafId) loop();

  updateRecordList();
  log(`inserted: "${label}" → woke ${neighbours.map(i=>pts[i].label).join(', ')}`);
  if (keyOverride === undefined) {
    document.getElementById('writeKey').value = '';
    document.getElementById('writeVal').value = '';
  }
  return true;
}

function dbBatchInsert() {
  const raw = document.getElementById('batchInput').value.trim();
  if (!raw) { log('paste key :: value pairs first', true); return; }
  const lines = raw.split('\n').map(l=>l.trim()).filter(Boolean);
  let inserted = 0, skipped = 0;
  for (const line of lines) {
    const sep = line.indexOf(' :: ');
    if (sep < 0) { skipped++; continue; }
    const k = line.slice(0, sep).trim();
    const v = line.slice(sep + 4).trim();
    if (k) { dbInsert(k, v); inserted++; }
    else skipped++;
  }
  document.getElementById('batchInput').value = '';
  log(`batch: ${inserted} inserted, ${skipped} skipped`);
}

/* ── READ API ── */
function dbQuery() {
  if (systemPhase === 'waiting') { log('train the field first', true); return; }
  const raw = document.getElementById('queryKey').value.trim();
  if (!raw) { log('enter a query key', true); return; }

  const queryLabel = raw.replace(/[,.]$/,'').toLowerCase();

  // check if word exists in field — do not hash absent words
  const fieldNode = pts.find(p => p.label.toLowerCase() === queryLabel);
  if (!fieldNode) {
    renderResults(queryLabel, []);
    document.getElementById('resultsMeta').textContent = `"${queryLabel}" not in field — no results`;
    log(`"${queryLabel}" not found in field`, true);
    return;
  }

  const queryVec = fieldNode.vec;
  const topN = parseInt(document.getElementById('queryN').value) || 5;
  const threshold = parseFloat(document.getElementById('confThreshold').value) || 0;

  // Rank all current nodes by similarity to query vector
  const ranked = pts
    .map((p, i) => ({ i, label: p.label, sim: cosineSim(queryVec, p.vec) }))
    .filter(r => r.sim >= threshold)
    .sort((a, b) => b.sim - a.sim)
    .slice(0, topN);

  if (ranked.length === 0) {
    renderResults(queryLabel, []);
    log(`query "${queryLabel}" — no results above threshold ${threshold.toFixed(2)}`);
    return;
  }

  // Wake the top neighbours (visual only)
  ranked.forEach(r => {
    const p = pts[r.i];
    p.stale = false; p.woken = true;
    p.vx=(Math.random()-0.5)*0.3; p.vy=(Math.random()-0.5)*0.3;
    p.state='exp'; p.frozenState='exp';
  });
  updateNearest();
  greenStableCount = 0; lastGreenCount = -1;
  setPhase('integrating');
  if (!rafId) loop();

  // Build result set
  const results = ranked.map(r => ({
    label: r.label,
    sim: r.sim,
    payload: payloadDB.get(r.label.toLowerCase()) || null,
    bondType: r.sim > 0.85 ? 'deep' : r.sim > 0.65 ? 'loose' : 'proximity',
  }));

  renderResults(queryLabel, results);
  log(`query "${queryLabel}" — ${results.length} result${results.length===1?'':'s'}`);
  document.getElementById('queryKey').value = '';
}

function renderResults(queryLabel, results) {
  document.getElementById('resultsQueryLabel').textContent = '«' + queryLabel + '»';
  const body = document.getElementById('resultsBody');
  const meta = document.getElementById('resultsMeta');

  if (results.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'results-empty';
    empty.append('no results above', document.createElement('br'), 'confidence threshold');
    body.replaceChildren(empty);
    meta.textContent = `threshold: ${parseFloat(document.getElementById('confThreshold').value).toFixed(2)}`;
    return;
  }

  body.replaceChildren();
  for (const r of results) {
    const card = document.createElement('div');
    card.className = `result-card ${r.bondType}`;

    const simPct = (r.sim * 100).toFixed(0);
    const bondLabel = r.bondType === 'deep' ? 'deep semantic bond'
                    : r.bondType === 'loose' ? 'loose semantic bond'
                    : 'proximity only';

    const key = document.createElement('div');
    key.className = 'result-key';
    const label = document.createElement('span');
    label.textContent = r.label;
    const sim = document.createElement('span');
    sim.className = `result-sim ${r.bondType}`;
    sim.textContent = `${simPct}%`;
    key.append(label, sim);

    const barWrap = document.createElement('div');
    barWrap.className = 'result-bar-wrap';
    const barFill = document.createElement('div');
    barFill.className = 'result-bar-fill';
    barFill.style.width = `${simPct}%`;
    barWrap.append(barFill);

    const bond = document.createElement('div');
    bond.className = 'result-bond';
    bond.textContent = bondLabel;

    const payload = document.createElement('div');
    payload.className = r.payload ? 'result-payload' : 'result-no-payload';
    payload.textContent = r.payload || 'no payload';

    card.append(key, barWrap, bond, payload);
    body.appendChild(card);
  }

  const withPayload = results.filter(r=>r.payload).length;
  const threshold = parseFloat(document.getElementById('confThreshold').value).toFixed(2);
  meta.textContent = `${results.length} results · ${withPayload} with payload · min sim ${threshold}`;
}

/* ── TOOLTIP PAYLOAD ── */
// Patch the hover handler to also show payload in tooltip
function tooltipShowPayload(label) {
  const payload = payloadDB.get(label.toLowerCase());
  const divider = document.getElementById('tipPayloadDivider');
  const lbl = document.getElementById('tipPayloadLabel');
  const val = document.getElementById('tipPayload');
  if (payload) {
    divider.style.display = ''; lbl.style.display = ''; val.style.display = '';
    val.textContent = payload.length > 120 ? payload.slice(0,120)+'…' : payload;
  } else {
    divider.style.display='none'; lbl.style.display='none'; val.style.display='none';
  }
}

/* ── EXPORT / IMPORT ── */
function exportDB() {
  if (!pts.length) { log('nothing to export', true); return; }
  const data = {
    version: 1,
    phase: systemPhase,
    payloads: Object.fromEntries(payloadDB),
    nodes: pts.map(p => ({
      label: p.label,
      vec: p.vec,
      inVocab: p.inVocab,
      x: p.x, y: p.y,
      frozenState: p.frozenState,
      stale: p.stale,
      nearestIdx: p.nearestIdx,
      nearestSim: p.nearestSim,
    })),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'nyarindo-db.json';
  a.click();
  log(`exported ${pts.length} nodes, ${payloadDB.size} payloads`);
}

/* ── VOCABULARY UPLOAD ── */
function triggerVocabUpload() {
  document.getElementById('vocabFile').click();
}

function loadVocabJSON(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.words || !Array.isArray(data.words)) throw new Error('expected {words:[...]}');
      if (!data.words.length) throw new Error('empty words array');

      const firstVec = data.words[0].vector;
      if (!Array.isArray(firstVec)) throw new Error('each word needs a vector array');
      const incomingDim = firstVec.length;

      const mode = document.querySelector('input[name="vocabMode"]:checked').value;

      // extend mode — check dimension compatibility
      if (mode === 'extend' && pts.length > 0) {
        const existingDim = pts[0].vec.length;
        if (incomingDim !== existingDim) {
          log(`dimension mismatch: field is ${existingDim}D, upload is ${incomingDim}D — use overwrite or match dimensions`, true);
          event.target.value = '';
          return;
        }
      }

      if (mode === 'overwrite') {
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        pts = [];
        payloadDB.clear();
        ticks = 0; greenStableCount = 0; lastGreenCount = -1;
        currentTrainDim = 2;
      }

      const W = canvas.width, H = canvas.height;
      let added = 0, skipped = 0;

      for (const entry of data.words) {
        if (!entry.label || !Array.isArray(entry.vector)) { skipped++; continue; }
        const label = entry.label.trim();
        if (!label) { skipped++; continue; }

        // skip duplicates in extend mode
        if (mode === 'extend' && pts.find(p => p.label.toLowerCase() === label.toLowerCase())) {
          skipped++; continue;
        }

        if (entry.payload) payloadDB.set(label.toLowerCase(), entry.payload);

        pts.push({
          label,
          vec: entry.vector,
          inVocab: true,
          x: WALL + Math.random() * (W - WALL*2),
          y: WALL + Math.random() * (H - WALL*2),
          vx: (Math.random()-0.5)*0.5,
          vy: (Math.random()-0.5)*0.5,
          prevSpd: 0,
          state: 'exp', frozenState: 'exp',
          stale: false, woken: false,
          nearestIdx: -1, nearestSim: 0,
        });
        added++;
      }

      updateNearest();
      updateRecordList();
      setPhase('training');
      log(`loaded ${added} nodes (${incomingDim}D vectors)${skipped ? `, ${skipped} skipped` : ''} — starting incremental training`);
      updateDimDisplay(currentTrainDim, incomingDim);

      // start incremental dimensional training
      startIncrementalTraining(incomingDim);

    } catch(err) {
      log('vocab load failed: ' + err.message, true);
    }
    event.target.value = '';
  };
  reader.readAsText(file);
}

/* ── INCREMENTAL DIMENSIONAL TRAINING ── */
let currentTrainDim = 2;
let prevGreenCount  = 0;
let dimStableTicks  = 0;
let incrTraining    = false;
let maxVocabDim     = 2;

function updateDimDisplay(current, max) {
  const el = document.getElementById('dimVal');
  if (el) el.textContent = `${current}D / ${max}D`;
}

function startIncrementalTraining(maxDim) {
  maxVocabDim     = maxDim;
  currentTrainDim = 2;
  prevGreenCount  = 0;
  dimStableTicks  = 0;
  incrTraining    = true;
  greenStableCount = 0;
  lastGreenCount   = -1;
  stableRequired   = parseInt(document.getElementById('stableTicks').value) || 300;

  // Project all vectors to starting 2D for physics
  projectNodesToDim(currentTrainDim);
  updateDimDisplay(currentTrainDim, maxVocabDim);
  if (!rafId) loop();
}

function projectNodesToDim(dim) {
  // Physics uses p.x/p.y for 2D spatial position
  // Semantic vec stays full-dimensional for cosine similarity
  // This function reseeds velocities when dimension steps up
  pts.forEach(p => {
    p.vx = (Math.random()-0.5)*0.3;
    p.vy = (Math.random()-0.5)*0.3;
    p.state = 'exp';
    p.frozenState = 'exp';
    p.stale = false;
    p.woken = false;
  });
  greenStableCount = 0;
  lastGreenCount   = -1;
}

function checkDimensionStep() {
  if (!incrTraining) return;
  // Called when field goes stale — check if we should step up
  const gc = pts.filter(p => p.frozenState === 'eq').length;

  if (currentTrainDim >= maxVocabDim) {
    // reached full dimensionality — done
    incrTraining = false;
    updateDimDisplay(currentTrainDim, maxVocabDim);
    log(`incremental training complete at ${currentTrainDim}D — ${gc}/${pts.length} green`);
    return;
  }

  if (gc <= prevGreenCount && currentTrainDim > 2) {
    // no improvement — stop here
    incrTraining = false;
    updateDimDisplay(currentTrainDim, maxVocabDim);
    log(`no improvement at ${currentTrainDim+1}D — settled at ${currentTrainDim}D | ${gc}/${pts.length} green`);
    return;
  }

  // improvement found or first step — extend dimension
  prevGreenCount = gc;
  currentTrainDim = Math.min(currentTrainDim + 1, maxVocabDim);
  updateDimDisplay(currentTrainDim, maxVocabDim);
  log(`dim ${currentTrainDim-1}D → ${currentTrainDim}D | green ${gc}/${pts.length} — continuing`);

  // reseed velocities for new dimension negotiation
  projectNodesToDim(currentTrainDim);
  setPhase('training');
  if (!rafId) loop();
}

function triggerImport() {
  document.getElementById('importFile').click();
}

function importDB(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.nodes || !Array.isArray(data.nodes)) throw new Error('invalid format');
      if (rafId) { cancelAnimationFrame(rafId); rafId=null; }
      pts = data.nodes.map(n => ({
        ...n,
        vx:0, vy:0, prevSpd:0,
        state: n.frozenState || 'eq',
        woken: false,
      }));
      payloadDB.clear();
      if (data.payloads) {
        for (const [k,v] of Object.entries(data.payloads)) payloadDB.set(k,v);
      }
      updateNearest();
      setPhase(data.phase || 'stale');
      ticks = 0; greenStableCount = 0; lastGreenCount = -1;
      updateRecordList();
      draw();
      log(`imported ${pts.length} nodes, ${payloadDB.size} payloads`);
    } catch(err) {
      log('import failed: ' + err.message, true);
    }
    event.target.value = '';
  };
  reader.readAsText(file);
}

/* ── TABS ── */
function switchTab(name) {
  document.querySelectorAll('.tab-btn').forEach((b,i) => {
    const names = ['train','write','read','store'];
    b.classList.toggle('active', names[i] === name);
  });
  document.querySelectorAll('.tab-panel').forEach(p => {
    p.classList.toggle('active', p.id === 'tab-' + name);
  });
}

const themeToggle = document.getElementById('themeToggle');
const themeRoot = document.documentElement;
let themeTransitionTimer;
function applySemanticTheme(theme, animate=true) {
  const light = theme === 'light';
  if (animate && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    themeRoot.classList.add('theme-transition');
    clearTimeout(themeTransitionTimer);
    themeTransitionTimer = setTimeout(() => themeRoot.classList.remove('theme-transition'), 950);
  }
  themeRoot.dataset.theme = light ? 'light' : 'dark';
  themeToggle.setAttribute('aria-pressed', String(!light));
  themeToggle.setAttribute('aria-label', 'Dark mode');
  document.getElementById('themeLabel').textContent = light ? 'DAY' : 'NIGHT';
  themeToggle.querySelector('.theme-icon').textContent = light ? '☼' : '☾';
  document.querySelector('meta[name="theme-color"]').content = light ? '#f2f0e9' : '#0c0d0e';
  try { localStorage.setItem('nyarindo-theme', light ? 'light' : 'dark'); } catch {}
  setPhase(systemPhase);
  draw();
}
themeToggle.addEventListener('click', () => {
  applySemanticTheme(themeRoot.dataset.theme === 'light' ? 'dark' : 'light');
});
applySemanticTheme(themeRoot.dataset.theme === 'light' ? 'light' : 'dark', false);

document.addEventListener('click', event => {
  const control = event.target.closest('[data-action]');
  if (!control) return;
  const actions = {
    tab: () => switchTab(control.dataset.tab),
    'start-training': startTraining,
    'stop-training': stopTraining,
    'proceed-training': proceedTraining,
    'inject-data': injectData,
    'db-insert': dbInsert,
    'db-batch-insert': dbBatchInsert,
    'db-query': dbQuery,
    'trigger-vocab-upload': triggerVocabUpload,
    'export-db': exportDB,
    'trigger-import': triggerImport,
    'reset-field': resetField,
  };
  actions[control.dataset.action]?.();
});

document.addEventListener('input', event => {
  const control = event.target.closest('[data-output]');
  if (!control) return;
  const output = document.getElementById(control.dataset.output);
  if (!output) return;
  const value = Number(control.value);
  if (control.dataset.outputFormat === 'decimal-2') {
    output.textContent = value.toFixed(2);
  } else if (control.dataset.outputFormat === 'decimal-1') {
    output.textContent = value.toFixed(1);
  } else {
    output.textContent = control.value;
  }
  if (control.id === 'stableTicks') stableRequired = parseInt(control.value, 10) || 300;
});

document.addEventListener('change', event => {
  const control = event.target.closest('[data-file-action]');
  if (!control) return;
  if (control.dataset.fileAction === 'vocab') loadVocabJSON(event);
  if (control.dataset.fileAction === 'import') importDB(event);
});

/* ── INIT ── */
setPhase('waiting');
updateStatus(0,0,0,0,stableRequired);
updateRecordList();
draw();
