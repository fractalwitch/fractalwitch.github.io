// Strata World · GooCore layer: one shared goo state over the terrain that the visuals read and touch writes.
// L1 law from the GOOAE Viscous Standard: fixed substeps, capped h³ slump mobility, 15% face limiter, 18% donor cap,
// residual film, tanh soft-knee for the visible height, saturating pour, RGBA32F so no mass is lost.
// Passes run as fragment ping-pong (QuadMesh + float RenderTargets), so the same code runs on WebGPU and WebGL2.
// State texel: x = h (goo thickness), y,z = velocity (texels/s), w = Life tissue height (0 dead, .5 newborn → 1 at 20 generations).
import * as THREE from 'three/webgpu';
import {Fn,If,Loop,float,int,vec2,vec3,vec4,uniform,uniformArray,uv,texture,clamp,min,max,abs,exp,sqrt,length,dot,step,select,tanh,hash,floor,fract,mix,sin,cos,normalize,oneMinus,smoothstep,
 positionLocal,positionWorld,varying,transformNormalToView,cameraPosition,pow,saturate,mx_noise_float,mx_worley_noise_vec2,Discard,atan} from 'three/tsl';
import {U,pulseSum,poresFn} from './materials.js';

export const LAW=Object.freeze({SUBSTEPS:5,CFL:.45,HEFF:1.45,FACE:.15,DONOR:.18,HMIN:.0015,HVIS:2.2,HCAP:2.6});
export const HS=.22;        // world units per goo unit of thickness
export const REEF_H=1.1;    // goo units a grown reef cell adds to the floor
export const NSRC=24,NBLOB=46;
export const LIFE_Q=.15;    // goo a living cell holds per goo texel: births eat it, deaths give it back
// B/S rules as bit masks (bit n set = n neighbours qualifies)
const mask=str=>[...str].reduce((m,c)=>m|(1<<+c),0);
export const RULES={life:{name:'Life',B:'3',S:'23'},highlife:{name:'HighLife',B:'36',S:'23'},coral:{name:'Coral',B:'3',S:'45678'},daynight:{name:'Day & Night',B:'3678',S:'34678'},maze:{name:'Maze',B:'3',S:'12345'},seeds:{name:'Seeds',B:'2',S:''}};
export const ruleMasks=k=>{const r=RULES[k]||RULES.life;return [mask(r.B),mask(r.S)]};

export function makeGoo(renderer,{N,rect,base,init,rheo,lifeInit,rule='life'}){
 const LN=N/2,ltex=1/LN;   // Life grid: one cell per 2×2 goo texels
 const [x0,z0,x1,z1]=rect,W=x1-x0,D=z1-z0,tex=1/N,txl=W/N;   // world units per texel
 const rt=()=>new THREE.RenderTarget(N,N,{type:THREE.FloatType,format:THREE.RGBAFormat,minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter,depthBuffer:false,generateMipmaps:false});
 const A=rt(),B=rt(),Fx=rt(),P=rt();
 const lrt=()=>new THREE.RenderTarget(LN,LN,{type:THREE.FloatType,format:THREE.RGBAFormat,minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter,depthBuffer:false,generateMipmaps:false});
 const L=lrt(),L2=lrt();   // Life state: x alive, y age (generations), z lineage hue, w last event (+1 birth, −1 death)
 const dataTex=(arr)=>{const t=new THREE.DataTexture(arr,N,N,THREE.RGBAFormat,THREE.FloatType);t.minFilter=t.magFilter=THREE.NearestFilter;t.needsUpdate=true;return t};
 const b4=new Float32Array(N*N*4),i4=new Float32Array(N*N*4);for(let k=0;k<N*N;k++){b4[k*4]=base[k];i4[k*4]=init[k]}
 const baseTex=dataTex(b4),initTex=dataTex(i4);
 const li=new Float32Array(LN*LN*4);if(lifeInit)li.set(lifeInit);const lifeInitTex=new THREE.DataTexture(li,LN,LN,THREE.RGBAFormat,THREE.FloatType);lifeInitTex.minFilter=lifeInitTex.magFilter=THREE.NearestFilter;lifeInitTex.needsUpdate=true;
 const [bm0,sm0]=ruleMasks(rule);
 // rheology uniforms (seed → physics)
 const R={dt:uniform(1/150),grav:uniform(rheo.grav),drag:uniform(rheo.drag),slump:uniform(rheo.slump),yieldH:uniform(rheo.yieldH),inertia:uniform(rheo.inertia),grow:uniform(rheo.grow),t:U.t,
  fresh:uniform(0),bm:uniform(bm0),sm:uniform(sm0),feed:uniform(.2),push:uniform(1),seedHue:uniform(0),spark:uniform(.0016),gen:uniform(0)};
 const SRC=uniformArray(Array.from({length:NSRC},()=>new THREE.Vector4(0,0,1,0)),'vec4'),SRC2=uniformArray(Array.from({length:NSRC},()=>new THREE.Vector4(-1,0,0,0)),'vec4');
 const BL=uniformArray(Array.from({length:NBLOB},()=>new THREE.Vector4(0,0,1,0)),'vec4'),BL2=uniformArray(Array.from({length:NBLOB},()=>new THREE.Vector4(0,0,0,0)),'vec4');
 const at=(t,o)=>texture(t,uv().add(o.mul(tex)));
 const wall=Fn(([o])=>{const ip=floor(uv().mul(N)).add(o);return ip.x.lessThan(1).or(ip.y.lessThan(1)).or(ip.x.greaterThan(N-2)).or(ip.y.greaterThan(N-2))});
 // ---- source field, once a frame: x = press potential, yz = drag velocity target·weight, w = pour (+) / eat (−) rate; folds already expanded on the CPU
 const srcFn=Fn(()=>{const p=uv().mul(N),press=float(0).toVar(),vel=vec2(0).toVar(),wv=float(0).toVar(),rate=float(0).toVar(),seed=float(0).toVar();
  Loop(NSRC,({i})=>{const s=SRC.element(i),k=SRC2.element(i),kd=k.x,act=step(-.5,kd),d=p.sub(s.xy),g=exp(dot(d,d).div(s.z.mul(s.z)).negate()).mul(act);
   press.addAssign(g.mul(s.w).mul(step(kd,.5)));
   const isDrag=step(.5,kd).mul(step(kd,1.5));vel.addAssign(k.yz.mul(g).mul(isDrag));wv.addAssign(g.mul(s.w).mul(isDrag));
   rate.addAssign(g.mul(s.w).mul(step(1.5,kd).mul(step(kd,2.5))));
   seed.assign(max(seed,step(.5,g).mul(step(2.5,kd))))});
  Loop(NBLOB,({i})=>{const b=BL.element(i),k=BL2.element(i),act=step(.5,k.w),d=p.sub(b.xy),g=exp(dot(d,d).div(b.z.mul(b.z)).negate()).mul(act);
   press.addAssign(g.mul(b.w));rate.addAssign(g.mul(k.x));seed.assign(max(seed,step(.5,g).mul(step(.5,k.x))));   // a melting droplet sows Life where it lands
  vel.addAssign(k.yz.mul(g).mul(.5));wv.addAssign(g.mul(.5).mul(step(.01,length(k.yz))))});
  return vec4(press.add(seed.mul(1000)),vel.div(max(wv,1e-4)).mul(min(wv,1)),rate)});
 // seed flag rides on press (+1000) so the growth pass can read it without another target
 // ---- Life pass, once a generation (reads L, A, P; writes L2): B/S rule fed by goo thickness, lineage hue, seeded by pours
 const bit=(m,n)=>floor(m.div(pow(float(2),n))).mod(2);
 const lifeFn=Fn(()=>{const lu=uv(),c=texture(L.texture,lu),ip=floor(lu.mul(LN));
  const n=float(0).toVar(),hx=float(0).toVar(),hy=float(0).toVar();
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){const q=texture(L.texture,lu.add(vec2(dx,dy).mul(ltex)));
   n.addAssign(q.x);hx.addAssign(cos(q.z.mul(6.2831853)).mul(q.x));hy.addAssign(sin(q.z.mul(6.2831853)).mul(q.x))}
  // goo under this cell: the four goo texels it covers
  const g=o=>texture(A.texture,lu.add(o.mul(ltex*.25))).x,f=g(vec2(1,1)).add(g(vec2(-1,1))).add(g(vec2(1,-1))).add(g(vec2(-1,-1))).mul(.25);
  const r=hash(ip.dot(vec2(1,LN)).add(R.gen.mul(13.37)).toUint()),r2=hash(ip.dot(vec2(LN,1)).add(R.gen.mul(7.13)).add(911).toUint());
  const seedHere=step(999,texture(P.texture,lu).x);
  const born=oneMinus(c.x).mul(bit(R.bm,n)).mul(step(R.feed,f));
  const surv=c.x.mul(bit(R.sm,n));
  const sow=oneMinus(c.x).mul(seedHere).mul(step(r,.42)).mul(step(LIFE_Q*1.2,f));
  const spark=oneMinus(c.x).mul(step(r2,R.spark)).mul(step(1.05,f));     // thick goo quickens on its own
  const wallL=ip.x.lessThan(1).or(ip.y.lessThan(1)).or(ip.x.greaterThan(LN-2)).or(ip.y.greaterThan(LN-2));
  const a=select(wallL,float(0),max(max(born,surv),max(sow,spark)));
  const parentHue=fract(atan(hy,hx).div(6.2831853).add(1));
  const hue=select(surv.greaterThan(.5),c.z,select(born.greaterThan(.5),parentHue,select(sow.greaterThan(.5),R.seedHue,r)));
  const age=select(surv.greaterThan(.5),c.y.add(1),float(0)).mul(a);
  return vec4(a,age,select(a.greaterThan(.5),hue,c.z),a.sub(c.x))});
 // ---- velocity pass (reads A, writes B); the reef channel is the Life tissue, taller as it ages; Life currents drag the goo along
 const velFn=Fn(()=>{const s=at(A.texture,vec2(0)),h=s.x,u=vec2(s.y,s.z),pv=at(P.texture,vec2(0));
  const pres=o=>{const q=at(P.texture,o).x;return q.sub(step(999,q).mul(1000))};
  const Hp=o=>{const n=at(A.texture,o);return n.x.add(at(baseTex,o).x).add(n.w.mul(REEF_H)).add(pres(o))};
  const grad=vec2(Hp(vec2(1,0)).sub(Hp(vec2(-1,0))),Hp(vec2(0,1)).sub(Hp(vec2(0,-1)))).mul(.5);
  const acc=grad.mul(R.grav).negate();
  // births minus deaths around this spot point the way the tissue is travelling (a glider's heading)
  const cur=vec2(0).toVar();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]])cur.addAssign(vec2(dx,dy).mul(texture(L.texture,uv().add(vec2(dx,dy).mul(ltex))).w));
  const un=u.add(acc.add(cur.mul(R.push).mul(160)).mul(R.dt).mul(R.inertia)).div(R.drag.mul(R.dt).add(1)).toVar();
  const tgt=vec2(pv.y,pv.z);un.assign(un.add(tgt.sub(un).mul(min(length(tgt).mul(.02),.6))));
  If(h.lessThan(LAW.HMIN*2),()=>{un.assign(vec2(0))});
  const sp=length(un),lim=float(LAW.CFL).div(R.dt);If(sp.greaterThan(lim),()=>{un.assign(un.mul(lim.div(sp)))});
  const lc=texture(L.texture,uv()),wn=lc.x.mul(min(lc.y.div(20),1).mul(.5).add(.5));
  return vec4(h,un,wn)});
 // ---- flux pass (reads B): capped h³ slump + upwind advection, donor cap (GooCore faceFlux)
 const fluxFn=Fn(()=>{const s=at(B.texture,vec2(0)),h=s.x,u=vec2(s.y,s.z);
  const pc=at(P.texture,vec2(0)).x,Hc=h.add(at(baseTex,vec2(0)).x).add(s.w.mul(REEF_H)).add(pc.sub(step(999,pc).mul(1000)));
  const face=(o,dir)=>{const t=at(B.texture,o),pn=at(P.texture,o).x,Hn=t.x.add(at(baseTex,o).x).add(t.w.mul(REEF_H)).add(pn.sub(step(999,pn).mul(1000)));
   const dh=Hc.sub(Hn),m=min(h.add(t.x).mul(.5),LAW.HEFF);
   const fs=select(dh.greaterThan(R.yieldH),min(R.slump.mul(m).mul(m).mul(m).mul(R.dt),LAW.FACE).mul(dh.sub(R.yieldH)),float(0));
   const uf=dot(u.add(vec2(t.y,t.z)).mul(.5),dir),fa=max(uf,0).mul(R.dt).mul(h);
   return select(wall(o),float(0),fs.add(fa))};
  const f=vec4(face(vec2(1,0),vec2(1,0)),face(vec2(0,1),vec2(0,1)),face(vec2(-1,0),vec2(-1,0)),face(vec2(0,-1),vec2(0,-1))).toVar();
  const tot=f.x.add(f.y).add(f.z).add(f.w),cap=max(h.sub(LAW.HMIN),0).mul(LAW.DONOR);
  If(tot.greaterThan(cap),()=>{f.assign(f.mul(cap.div(max(tot,1e-6))))});
  return select(wall(vec2(0)),vec4(0),f)});
 // ---- mass pass (reads B + flux + sources, writes A): conservative gather, saturating pour, blob eating
 const massFn=Fn(()=>{const s=at(B.texture,vec2(0)),mine=at(Fx.texture,vec2(0));
  const inflow=o=>select(wall(o),vec4(0),at(Fx.texture,o));
  const h=s.x.sub(mine.x.add(mine.y).add(mine.z).add(mine.w)).add(inflow(vec2(1,0)).z).add(inflow(vec2(0,1)).w).add(inflow(vec2(-1,0)).x).add(inflow(vec2(0,-1)).y).toVar();
  const rate=at(P.texture,vec2(0)).w;
  If(rate.greaterThan(0),()=>{const sat=oneMinus(clamp(h.div(LAW.HCAP),0,1));h.addAssign(rate.mul(sat).mul(sat).mul(R.dt))});
  If(rate.lessThan(0),()=>{h.addAssign(rate.mul(R.dt).mul(min(h,1)))});
  const ev=texture(L.texture,uv()).w;h.addAssign(ev.negate().mul(LIFE_Q).mul(R.fresh).div(LAW.SUBSTEPS));
  return select(wall(vec2(0)),vec4(0),vec4(clamp(h,0,8),s.y,s.z,s.w))});
 const pass=node=>{const m=new THREE.NodeMaterial();m.fragmentNode=node();m.blending=THREE.NoBlending;m.depthTest=m.depthWrite=false;return new THREE.QuadMesh(m)};
 const qSrc=pass(srcFn),qVel=pass(velFn),qFlux=pass(fluxFn),qMass=pass(massFn),qInit=pass(()=>texture(initTex,uv()));
 const qLife=pass(lifeFn),qCopyL=pass(()=>texture(L2.texture,uv())),qInitL=pass(()=>texture(lifeInitTex,uv()));
 const run=(q,t)=>{renderer.setRenderTarget(t);q.render(renderer)};
 const prev=renderer.getRenderTarget();run(qInit,A);run(qInitL,L);renderer.setRenderTarget(prev);
 let simSteps=0,genAcc=0,gens=0,genRate=6*rheo.grow;
 function stepSim(dt){const prev=renderer.getRenderTarget();dt=Math.min(dt,.033);R.dt.value=dt/LAW.SUBSTEPS;
  run(qSrc,P);genAcc+=dt*genRate;R.fresh.value=0;
  if(genAcc>=1){genAcc=Math.min(genAcc-1,1);gens++;R.gen.value=gens;run(qLife,L2);run(qCopyL,L);R.fresh.value=1}
  for(let k=0;k<LAW.SUBSTEPS;k++){run(qVel,B);run(qFlux,Fx);run(qMass,A)}renderer.setRenderTarget(prev);simSteps++}
 // world ↔ texel helpers for the CPU side
 const toTex=(x,z)=>[(x-x0)/W*N,(z-z0)/D*N];
 return {A,P,L,LN,baseTex,R,SRC,SRC2,BL,BL2,step:stepSim,toTex,N,rect,txl,base,get gens(){return gens},get genRate(){return genRate},set genRate(v){genRate=v},
  setRule(k){const [b,m]=ruleMasks(k);R.bm.value=b;R.sm.value=m},
  setRheo(r){for(const k of ['grav','drag','slump','yieldH','inertia','grow'])if(r[k]!==undefined)R[k].value=r[k];if(r.grow!==undefined)genRate=6*r.grow},
  dispose(){[A,B,Fx,P,L,L2].forEach(t=>t.dispose());baseTex.dispose();initTex.dispose();lifeInitTex.dispose();[qSrc,qVel,qFlux,qMass,qInit,qLife,qCopyL,qInitL].forEach(q=>q.material.dispose())},get steps(){return simSteps}};
}

// ---- the goo surface: a grid that reads the state in its vertex stage; thickness drives the optics
export function gooSurface(goo,seed,quality){
 const {N,rect}=goo,[x0,z0,x1,z1]=rect,W=x1-x0,D=z1-z0,tex=1/N;
 const g=new THREE.PlaneGeometry(W,D,N-1,N-1);g.rotateX(-Math.PI/2);g.translate((x0+x1)/2,0,(z0+z1)/2);
 const m=new THREE.MeshPhysicalNodeMaterial({transparent:!quality.transmission,depthWrite:true,side:THREE.FrontSide});
 const u={tint:uniform(new THREE.Color(seed.a)),deep:uniform(new THREE.Color(seed.b)),sigma:uniform(new THREE.Vector3(...(seed.sigma||[1,2,.6]))),back:uniform(seed.backlight??1),
  reefA:uniform(new THREE.Color('#ffd25a')),reefB:uniform(new THREE.Color('#9fe8ff')),detail:uniform(1),eyes:uniform(1)};m.userData.u=u;m.userData.seed=seed;
 const uvAt=p=>vec2(p.x.sub(x0).div(W),p.z.sub(z0).div(D));
 const S=goo.A.texture,Bt=goo.baseTex;
 const st=o=>texture(S,uvAt(positionLocal).add(o.mul(tex))).level(0),bs=o=>texture(Bt,uvAt(positionLocal).add(o.mul(tex))).level(0).x;
 const hv=h=>tanh(h.div(LAW.HVIS)).mul(LAW.HVIS);
 // tissue height is blurred over a plus of goo texels so Life cells read as rounded coral mounds, not cubes
 const wB=o=>st(o).w.mul(2).add(st(o.add(vec2(1,0))).w).add(st(o.add(vec2(-1,0))).w).add(st(o.add(vec2(0,1))).w).add(st(o.add(vec2(0,-1))).w).div(6);
 const surfY=o=>{const s=st(o);return bs(o).add(wB(o).mul(REEF_H*.55)).add(hv(s.x)).mul(HS)};
 const s0=st(vec2(0)),y0=surfY(vec2(0)),yx=surfY(vec2(1,0)),yz=surfY(vec2(0,1)),yxm=surfY(vec2(-1,0)),yzm=surfY(vec2(0,-1));
 const tx=W/N;
 const vis=step(.03,s0.x).max(step(.5,s0.w));
 m.positionNode=vec3(positionLocal.x,select(vis.greaterThan(.5),y0.add(.004),bs(vec2(0)).mul(HS).sub(.3)),positionLocal.z);
 const nW=varying(normalize(vec3(yxm.sub(yx),tx*2,yzm.sub(yz))),'vNg');
 const near=varying(wB(vec2(0)).add(st(vec2(2,0)).w).add(st(vec2(-2,0)).w).add(st(vec2(0,2)).w).add(st(vec2(0,-2)).w),'vNear');
 const thick=varying(hv(s0.x),'vTh'),vel=varying(vec2(s0.y,s0.z).mul(tx),'vVel');   // velocity in world units/s
 const V=normalize(cameraPosition.sub(positionWorld)),P=positionWorld;
 // fractal detail ladder: meso (flow-mapped ripples), micro (bubbles), nano (eyes in pores), each fading in with thickness and proximity
 const T=U.t.mul(.35),ph1=fract(T),ph2=fract(T.add(.5)),wgt=abs(ph1.mul(2).sub(1));
 const pz=vec2(P.x,P.z),fl=vel.mul(1.6);
 const meso=p=>mx_noise_float(vec3(p.mul(5.5),U.t.mul(.15)));
 const mesoH=pz2=>mix(meso(pz2.sub(fl.mul(ph1))),meso(pz2.sub(fl.mul(ph2)).add(3.7)),wgt);
 const e=.03,mh=mesoH(pz),mgx=mesoH(pz.add(vec2(e,0))).sub(mh),mgz=mesoH(pz.add(vec2(0,e))).sub(mh);
 const amp=min(length(vel).mul(.25),.6).add(.18).mul(smoothstep(.02,.4,thick)).mul(u.detail);
 const wv=mx_worley_noise_vec2(pz.mul(11)),bub=smoothstep(.16,.05,wv.x).mul(smoothstep(.9,1.8,thick)).mul(u.detail);
 const dist=length(cameraPosition.sub(P));
 // Life tissue as metaball goo: each live cell is a soft blob, the 3×3 neighbourhood sums into one field (gooey necks between cells)
 const LN=goo.LN,cellW=W/LN,LT=goo.L.texture;
 const tis=Fn(()=>{const r=vec4(0).toVar();If(near.greaterThan(.01),()=>{const lp=uvAt(P).mul(LN).sub(.5),c0=floor(lp.add(.5));
   for(const [dx,dy] of [[-1,-1],[0,-1],[1,-1],[-1,0],[0,0],[1,0],[-1,1],[0,1],[1,1]]){const cc=c0.add(vec2(dx,dy)),q=texture(LT,cc.add(.5).div(LN)).level(0),d=lp.sub(cc);
    const wgt=q.x.mul(exp(dot(d,d).div(.3).negate()));r.addAssign(vec4(wgt,d.mul(wgt).mul(-2/.3),wgt.mul(smoothstep(4,0,q.y))))}});return r})();
 const reef=smoothstep(.32,.62,tis.x),fresh=smoothstep(.15,.5,tis.w);
 const lh=texture(LT,uvAt(P)).z,ang=lh.mul(6.2831853);
 const dome=vec3(tis.y,0,tis.z).div(cellW).mul(.05).mul(smoothstep(.1,.5,tis.x));
 const Nn=normalize(normalize(nW).sub(vec3(mgx.div(e),0,mgz.div(e)).mul(amp).mul(.035).mul(oneMinus(reef))).add(vec3(0,bub.mul(.12),0)).sub(dome));
 m.normalNode=transformNormalToView(Nn);
 // thickness optics: Beer-Lambert absorption, deeper colour where thick, forward scatter where thin and backlit
 const NdV=saturate(dot(Nn,V)).max(.2),path=thick.mul(HS).mul(float(1).div(NdV)).mul(4);
 const Tr=exp(u.sigma.mul(path).negate()),Tm=Tr.x.add(Tr.y).add(Tr.z).div(3);
 const body=mix(u.tint,u.deep.mul(u.tint),smoothstep(.4,1.8,thick)).mul(Tr.mul(.5).add(.5));
 // reef = Life tissue: colour by lineage hue around the world's reef palette, newborn cells glow
 const rainbow=pow(cos(vec3(ang,ang.sub(2.094),ang.sub(4.189))).mul(.5).add(.5),vec3(2.2));
 const reefC=mix(rainbow,mix(u.reefA,u.reefB,cos(ang).mul(.5).add(.5)),.22).mul(mx_noise_float(P.mul(9)).mul(.25).add(.8)).mul(.85);
 const nanoV=Fn(()=>{const r=vec4(0).toVar();If(thick.greaterThan(.9).and(dist.lessThan(9)).and(u.eyes.greaterThan(.5)),()=>{const pr=poresFn(P.mul(3.2),Nn,P);r.assign(vec4(pr.xyz,pr.w.mul(smoothstep(9,5,dist))))});return r})();
 const nano=nanoV.w,nanoC=nanoV.xyz;
 const col=mix(mix(body,reefC,reef.mul(.92)),nanoC,nano).add(vec3(1).mul(bub).mul(.25));
 m.colorNode=col;
 m.roughnessNode=mix(float(seed.rough??.04),float(.35),reef.mul(Tm));m.clearcoat=1;m.clearcoatRoughness=.03;
 const scatter=u.tint.mul(u.back).mul(pow(saturate(dot(U.sun.negate(),V)),3)).mul(exp(thick.mul(-.9))).mul(oneMinus(exp(thick.mul(-3)))).mul(2.2);
 const tw=hash(floor(P.mul(40)).dot(vec3(1,57,113)).toUint());
 m.emissiveNode=scatter.add(reefC.mul(reef).mul(.1)).add(reefC.mul(fresh).mul(.55)).add(vec3(1,.9,.8).mul(step(.996,tw)).mul(reef).mul(pow(sin(U.t.mul(3).add(tw.mul(60))).mul(.5).add(.5),8)).mul(3)).add(nanoC.mul(nano).mul(.3))
  .add(U.pulseCol.mul(pulseSum(P)).mul(.6));
 if(quality.transmission){m.transmission=1;m.thicknessNode=thick.mul(HS).mul(2);m.ior=1.42;m.attenuationColor=new THREE.Color(seed.a);m.attenuationDistance=.35;
  m.alphaTestNode=float(.5);m.opacityNode=vis}
 else{m.opacityNode=clamp(oneMinus(Tm).mul(1.3).add(.04),.04,.97).mul(vis).max(reef.mul(.95));m.alphaTestNode=float(.02)}
 const mesh=new THREE.Mesh(g,m);mesh.frustumCulled=false;mesh.renderOrder=1;mesh.receiveShadow=quality.shadows;mesh.castShadow=false;
 return mesh;
}
