// Strata World · TSL materials. Every surface is a MeshPhysicalNodeMaterial driven by a material seed;
// the procedural parts (drips, eyes, pores, marbled oil, Gerstner sea, porous rock, goo) are node graphs.
import * as THREE from 'three/webgpu';
import {Fn,If,Loop,float,int,vec2,vec3,vec4,uniform,uniformArray,attribute,instanceIndex,positionLocal,positionWorld,cameraPosition,
 sin,cos,atan,abs,exp,pow,mix,clamp,smoothstep,step,max,min,fract,floor,dot,cross,normalize,length,select,oneMinus,saturate,fwidth,
 varying,transformNormalToView,texture,uv,mx_noise_float,mx_fractal_noise_float,mx_worley_noise_vec2,sqrt,negate} from 'three/tsl';

// ---------- shared uniforms (one clock, one look target, one set of pulse rings and ripples for the whole world)
export const U={
 t:uniform(0),look:uniform(new THREE.Vector3(0,2,10)),melt:uniform(0),drip:uniform(1),wob:uniform(1),flow:uniform(1),glit:uniform(1),
 poke:uniform(new THREE.Vector4(0,0,0,-99)),pop:uniform(-99),startle:uniform(0),
 sun:uniform(new THREE.Vector3(0,1,0)),irisA:uniform(new THREE.Color()),irisB:uniform(new THREE.Color()),sclera:uniform(new THREE.Color()),
 hole:uniform(new THREE.Color()),pulseCol:uniform(new THREE.Color()),
 pulses:uniformArray(Array.from({length:6},()=>new THREE.Vector4(0,0,0,-99)),'vec4'),
 rips:uniformArray(Array.from({length:8},()=>new THREE.Vector4(0,0,0,-99)),'vec4'),
 mounds:uniformArray(Array.from({length:16},()=>new THREE.Vector4(0,0,0,0)),'vec4')
};
// ---------- helpers
const ss=(a,b,x)=>a<=b?smoothstep(a,b,x):oneMinus(smoothstep(b,a,x));   // reversed edges are undefined in WGSL
const hh=n=>fract(sin(n).mul(43758.5453));
const h31=p=>fract(sin(dot(p,vec3(12.9898,78.233,37.719))).mul(43758.5453));
const h33=p=>fract(sin(vec3(dot(p,vec3(127.1,311.7,74.7)),dot(p,vec3(269.5,183.3,246.1)),dot(p,vec3(113.5,271.9,124.6)))).mul(43758.5453));
const hueShift=(c,a)=>{const k=vec3(.57735);return c.mul(cos(a)).add(cross(k,c).mul(sin(a))).add(k.mul(dot(k,c)).mul(oneMinus(cos(a))))};
const viewDir=()=>normalize(cameraPosition.sub(positionWorld));
// travelling light rings from pokes, pops and ripples
export const pulseSum=Fn(([P])=>{const g=float(0).toVar();
 Loop(6,({i})=>{const pv=U.pulses.element(i),a=U.t.sub(pv.w);If(a.greaterThan(0).and(a.lessThan(4)),()=>{const x=length(P.sub(pv.xyz)).sub(a.mul(6));g.addAssign(exp(x.mul(x).mul(-1.4)).mul(exp(a.mul(-1.1))).mul(.7))})});
 return g});
// glow-through (subsurface-ish) term the physical model lacks: back light through goo plus a soft rim
const glowThrough=(col,N,V)=>{const nv=saturate(dot(N,V));return col.mul(pow(saturate(dot(U.sun.negate(),V)),3).mul(1.3).mul(oneMinus(nv).mul(.65).add(.35)).add(pow(oneMinus(nv),2).mul(.22)))};

// ---------- seeds → physical material
export function applySeed(m,s){
 m.color.set(s.a);m.roughness=Math.min(1,Math.max(.025,1-s.gloss));m.metalness=s.metal;
 m.clearcoat=s.coat;m.clearcoatRoughness=.04;m.iridescence=s.filmK>0&&s.film>0?Math.min(1,s.filmK*1.6):0;m.iridescenceIOR=1.35;
 m.iridescenceThicknessRange=[Math.max(60,s.film*.55),Math.max(120,s.film*1.45)];
 if(m.userData.u){m.userData.u.rough.value=m.roughness;m.userData.u.base.value.set(s.a);m.userData.u.sss.value.set(s.sss);m.userData.u.emit.value=s.emit;m.userData.u.accent.value.set(s.b);m.userData.u.pore.value=s.pore}
 m.needsUpdate=false;return m}
function seedMaterial(s,extra={}){const m=new THREE.MeshPhysicalNodeMaterial(extra);
 m.userData.u={rough:uniform(Math.min(1,Math.max(.025,1-s.gloss))),base:uniform(new THREE.Color(s.a)),sss:uniform(new THREE.Color(s.sss)),emit:uniform(s.emit),accent:uniform(new THREE.Color(s.b)),pore:uniform(s.pore)};
 m.roughness=Math.min(1,Math.max(.025,1-s.gloss));applySeed(m,s);m.userData.seed=s;return m}

// ---------- pores: 3D Voronoi cells, larger ones grow eyes that look at U.look (returns rgb + mask in w, emissive via out var)
const poresFn=Fn(([p,N,Pw])=>{
 const ip=floor(p),fp=fract(p),best=vec3(0).toVar(),bc=vec3(0).toVar(),d1=float(9).toVar();
 Loop({start:-1,end:2,name:'z'},({z})=>{Loop({start:-1,end:2,name:'y'},({y})=>{Loop({start:-1,end:2,name:'x'},({x})=>{
  const g=vec3(float(x),float(y),float(z)),r=g.add(h33(ip.add(g))).sub(fp),d=dot(r,r);If(d.lessThan(d1),()=>{d1.assign(d);best.assign(r);bc.assign(ip.add(g))})})})});
 const id=h31(bc.mul(1.7).add(3)),rad=fract(id.mul(7.3)).mul(.24).add(.24),dist=sqrt(d1);
 const edge=ss(rad,rad.mul(.8),dist).mul(step(dist,rad));
 const L=normalize(U.look.sub(Pw)),tt=L.sub(N.mul(dot(L,N))),off=best.negate().sub(tt.mul(rad).mul(.3)),ri=length(off).div(rad);
 const ic=mix(U.irisB,U.irisA,smoothstep(.1,.62,ri)).mul(sin(atan(off.y,off.x.add(off.z)).mul(22)).mul(.35).add(.75));
 const ir=ss(.64,.58,ri),pu=ss(.28,.23,ri);
 const eye=mix(mix(U.sclera,ic,ir),vec3(.01,0,.03),pu).mul(mix(.5,1,ss(1,.72,dist.div(rad))));
 const hole=U.hole.mul(mix(.12,1,dist.div(rad)));
 const isEye=step(.5,id);
 return vec4(mix(hole,eye,isEye),edge)});

// ---------- eye-bulbs, goo blobs, foam: one sphere, drips in positionNode, eyes in colorNode/emissiveNode
// instance attributes: aB0 centre+scale, aB1 socket+kind, aB2 seed,drip,ao,squash, aB3 eyeSize,lashes,irisHue,-, aCol
// gaze+lid come from a storage buffer that the life compute shader updates
export function bulbMaterial(seed,gazeBuf,opts={}){
 const m=seedMaterial(seed),u=m.userData.u;m.userData.gazeAttr=gazeBuf.value;
 const B0=attribute('aB0','vec4'),B1=attribute('aB1','vec4'),B2=attribute('aB2','vec4'),B3=attribute('aB3','vec4'),C=attribute('aCol','vec3');
 const GL=gazeBuf.element(instanceIndex);
 const seedR=B2.x;
 // jiggle from the latest poke, stateless: amplitude falls with distance, decays with time since the wave arrived
 const pd=length(B0.xyz.sub(U.poke.xyz)),pa=U.t.sub(U.poke.w).sub(pd.mul(.02)),jig=select(pa.greaterThan(0),exp(pd.mul(-.35)).mul(1.2).mul(exp(pa.mul(-2.6))),float(0));
 const disp=Fn(([p])=>{
  const amt=B2.y.mul(U.drip).mul(U.melt.mul(1.6).add(1));
  const w=U.wob.mul(sin(U.t.mul(1.7).add(seedR.mul(20)).add(p.y.mul(3))).mul(.03).add(sin(U.t.mul(2.3).add(p.x.mul(4)).add(seedR.mul(7))).mul(sin(p.z.mul(3).add(U.t))).mul(.02)))
   .add(jig.mul(.14).mul(sin(U.t.mul(21).add(p.x.mul(5)).add(p.y.mul(4)))).mul(sin(p.z.mul(4).add(seedR))));
  const q=p.mul(w.add(1)).mul(vec3(1,B2.w,1)).toVar();
  const ang=atan(p.z,p.x),best=float(0).toVar(),ax=vec2(1,0).toVar();
  Loop(5,({i})=>{const fi=float(i),a=seedR.mul(31).add(fi.mul(1.2566)).add(sin(seedR.mul(7).add(fi.mul(3))).mul(.5)),wd=hh(seedR.mul(13).add(fi)).mul(.14).add(.2);
   const dd=abs(atan(sin(ang.sub(a)),cos(ang.sub(a)))),mm=exp(dd.mul(dd).div(wd.mul(wd)).negate());
   const len=hh(seedR.mul(91).add(fi.mul(7))).mul(.75).add(.25).mul(sin(U.t.mul(.5).add(fi.mul(2)).add(seedR.mul(9))).mul(.2).add(.8));
   If(mm.mul(len).greaterThan(best),()=>{best.assign(mm.mul(len));ax.assign(vec2(cos(a),sin(a)))})});
  const t=ss(0,-.9,p.y),s=best.mul(amt).mul(t).mul(t);
  const k=clamp(s.mul(1.4),0,1).mul(ss(-.25,-.95,p.y));
  const nxz=mix(vec2(q.x,q.z),ax.mul(.5).add(vec2(q.x,q.z).sub(ax.mul(.5)).mul(.3)),k);
  return vec3(nxz.x,q.y.sub(s.mul(1.5)),nxz.y)});
 const p=normalize(positionLocal),t1=normalize(cross(select(abs(p.y).lessThan(.99),vec3(0,1,0),vec3(1,0,0)),p)),t2=cross(p,t1);
 const a=disp(p),b=disp(normalize(p.add(t1.mul(.03)))),c=disp(normalize(p.add(t2.mul(.03))));
 m.positionNode=B0.xyz.add(a.mul(B0.w));
 const nW=varying(normalize(cross(b.sub(a),c.sub(a))),'vNw');m.normalNode=transformNormalToView(nW);
 const od=varying(p,'vOd'),gaze=varying(GL.xyz,'vGaze'),lidV=varying(GL.w,'vLid'),inst=varying(vec4(B1.xyz,B1.w),'vB1'),e3=varying(B3,'vB3'),s2=varying(B2,'vB2'),col=varying(C,'vCol');
 const V=viewDir(),N=normalize(nW);
 // ---- eye map
 const S=normalize(inst.xyz),G=normalize(gaze),up=vec3(0,1,0),Sx=normalize(cross(up,S)),Sy=cross(S,Sx);
 const es=e3.x,front=dot(od,S),lid=max(lidV,.03),av=vec2(dot(od,Sx),dot(od,Sy)).div(es),ae=vec2(av.x,av.y.div(lid));
 const eyeD=max(length(ae.sub(vec2(0,-.22))),length(ae.sub(vec2(0,.22)))).sub(1),onF=smoothstep(.15,.4,front),aa=fwidth(eyeD).mul(1.2).add(1e-4);
 const isEye=step(.5,inst.w),eyeM=oneMinus(smoothstep(aa.negate(),aa,eyeD)).mul(onF).mul(isEye);
 const Gx=normalize(cross(up,G)),Gy=cross(G,Gx),g2=vec2(dot(od,Gx),dot(od,Gy));
 const rr=length(g2).div(es.mul(.84)).mul(select(dot(od,G).greaterThan(0),float(1),float(9)));
 const dil=float(.5).add(U.melt.mul(.35)).sub(U.startle.mul(.3)),pr=mix(.28,.58,dil),th=atan(g2.y,g2.x),ra=fwidth(rr).add(1e-4);
 const scl=U.sclera.mul(oneMinus(smoothstep(.2,1,length(av)).mul(.55))).mul(oneMinus(smoothstep(-.2,1,av.y.mul(lid)).mul(.25)));
 const str=sin(th.mul(29).add(s2.x.mul(9))).mul(sin(th.mul(11).sub(rr.mul(7)))).mul(.38).add(.62).add(sin(rr.mul(34)).mul(.2));
 const ic0=mix(hueShift(U.irisA,e3.z),hueShift(U.irisB,e3.z),smoothstep(pr,1,rr)).mul(str).mul(oneMinus(smoothstep(.45,1,rr)).mul(.55).add(.75));
 const ic=mix(ic0,ic0.mul(.1),smoothstep(.84,1,rr)).add(vec3(.9,.95,1).mul(ss(.12,.02,length(g2.div(es.mul(.84)).sub(vec2(-.3,.35))))).mul(1.5));
 const irM=oneMinus(smoothstep(oneMinus(ra),ra.add(1),rr)),puM=oneMinus(smoothstep(pr.sub(ra),pr.add(ra),rr));
 const ea=mix(mix(scl,ic,irM),vec3(.004,0,.012),puM);
 const crease=exp(eyeD.mul(eyeD).mul(-90)).mul(onF).mul(oneMinus(eyeM)).mul(isEye);
 const lash=smoothstep(0,.05,eyeD).mul(ss(.6,.05,eyeD)).mul(smoothstep(0,.35,av.y)).mul(smoothstep(.45,.95,sin(atan(av.x,av.y.add(.6)).mul(46)))).mul(onF).mul(step(.5,e3.y)).mul(isEye);
 const popGlow=exp(U.t.sub(U.pop).mul(-.8)).mul(step(U.pop,U.t)),glow=max(U.melt.mul(.7),popGlow);
 let skin=col,poreE=vec3(0);
 if(opts.pores){const pr4=poresFn(od.mul(u.pore.mul(5).add(2.5)).add(s2.x.mul(3)),N,positionWorld);skin=mix(col,pr4.xyz,pr4.w);poreE=pr4.xyz.mul(pr4.w).mul(.25)}
 m.colorNode=mix(skin,ea,eyeM).mul(oneMinus(crease.mul(.65))).mul(oneMinus(lash.mul(.9))).mul(mix(s2.z,1,eyeM.mul(.6)));
 m.roughnessNode=mix(u.rough,float(.02),eyeM);
 const gh=h31(floor(od.mul(120).add(s2.x.mul(10))));
 m.emissiveNode=ic.mul(irM).mul(oneMinus(puM)).mul(glow.mul(.9).add(.3)).mul(eyeM)
  .add(vec3(1,.9,1).mul(step(.994,gh)).mul(pow(sin(U.t.mul(3).add(gh.mul(80))).mul(.5).add(.5),6)).mul(U.glit).mul(2).mul(oneMinus(eyeM)))
  .add(glowThrough(u.sss,N,V).mul(oneMinus(eyeM)).mul(s2.z))
  .add(col.mul(u.emit))
  .add(U.pulseCol.mul(pulseSum(positionWorld)).mul(col.add(.25)))
  .add(poreE);
 return m}

// ---------- goo strands: one capped tube bent from A to B per instance, bulges sliding down
export function strandMaterial(seed){const m=seedMaterial(seed),u=m.userData.u;
 const T0=attribute('aT0','vec4'),T1=attribute('aT1','vec4'),T2=attribute('aT2','vec4'),C=attribute('aCol','vec3'),P=attribute('aProf','vec4');
 const st=select(T2.x.greaterThan(3),sin(U.t.mul(.6).add(T2.y)).mul(.2).add(.85).add(U.melt.mul(.9)).mul(U.drip),float(1));
 const A=T0.xyz,B=A.add(T1.xyz.sub(A).mul(st)),D=B.sub(A),L=length(D),Tn=D.div(max(L,1e-4));
 const Un=normalize(cross(select(abs(Tn.y).lessThan(.99),vec3(0,1,0),vec3(1,0,0)),Tn)),W=cross(Tn,Un);
 const s=P.x,e=P.y,rad=mix(T0.w,T1.w,pow(s,T2.x)).mul(pow(max(sin(s.mul(L).mul(2.6).sub(U.t.mul(2.4).mul(T2.z)).add(T2.y)),0),6).mul(T2.z).mul(.4).add(1));
 const n=Un.mul(cos(P.z)).add(W.mul(sin(P.z))),axis=A.add(D.mul(s)).add(Tn.mul(e).mul(rad)).sub(vec3(0,T2.w.mul(sin(s.mul(3.14159))).mul(L).mul(.15),0));
 m.positionNode=axis.add(n.mul(rad).mul(P.w));
 const nW=varying(normalize(n.mul(P.w).add(Tn.mul(e))),'vNs');m.normalNode=transformNormalToView(nW);
 const col=varying(C,'vCs');m.colorNode=col;
 m.emissiveNode=glowThrough(u.sss,normalize(nW),viewDir()).add(col.mul(u.emit)).add(U.pulseCol.mul(pulseSum(positionWorld)).mul(.6));
 return m}

// ---------- rigid props: crystal hearts (transmission + dispersion, flat facets, spin and bob in positionNode)
export function heartMaterial(seed,{transmission=true}={}){
 const m=seedMaterial(seed,{flatShading:true});const u=m.userData.u;
 const I0=attribute('aI0','vec4'),I1=attribute('aI1','vec4'),C=attribute('aCol','vec3');
 const yaw=I1.x.add(I1.z.mul(U.t)),c=cos(yaw),s=sin(yaw),pl=positionLocal.mul(I0.w);
 m.positionNode=I0.xyz.add(vec3(pl.x.mul(c).sub(pl.z.mul(s)),pl.y.add(sin(U.t.mul(1.3).add(I1.w)).mul(.05).mul(I0.w).mul(step(.01,I1.z))),pl.x.mul(s).add(pl.z.mul(c))));
 const col=varying(C,'vCh');m.colorNode=col;
 if(transmission){m.transmission=1;m.thickness=.6;m.ior=1.7;m.dispersion=4;m.attenuationColor=new THREE.Color(seed.a);m.attenuationDistance=.5;m.roughness=.02}
 const tw=pow(sin(U.t.mul(2.6).add(h31(floor(positionLocal.mul(9))).mul(60))).mul(.5).add(.5),10);
 m.emissiveNode=col.mul(u.emit).mul(sin(U.t.mul(2).add(I1.w)).mul(.3).add(.7)).add(mix(col,vec3(1),.4).mul(tw).mul(U.glit).mul(2.5)).add(U.pulseCol.mul(pulseSum(positionWorld)).mul(1.2));
 return m}
// pearl for the batched spires and arches: per-instance colour comes from BatchedMesh, accent parts from the 'part' attribute
export function pearlMaterial(seed){const m=seedMaterial(seed),u=m.userData.u;const part=attribute('part','float');
 m.colorNode=mix(vec3(1),u.accent,part);   // multiplied by the batch colour
 m.emissiveNode=u.accent.mul(part).mul(u.emit).mul(.5).add(U.pulseCol.mul(pulseSum(positionWorld)).mul(1.2));
 const g=sin(positionLocal.y.mul(140)).mul(.06).mul(oneMinus(part));m.roughnessNode=u.rough.add(g.abs());
 return m}
export function coralMaterial(seed){const m=seedMaterial(seed);const u=m.userData.u;const ao=attribute('aX','vec4').x;
 m.colorNode=u.base.mul(mx_noise_float(positionWorld.mul(9)).mul(.2).add(.9));
 const gh=h31(floor(positionWorld.mul(60)));
 m.emissiveNode=u.base.mul(u.emit).mul(ao).add(vec3(1,.85,.5).mul(step(.985,gh)).mul(pow(sin(U.t.mul(4).add(gh.mul(70))).mul(.5).add(.5),8)).mul(U.glit).mul(3)).add(U.pulseCol.mul(pulseSum(positionWorld)).mul(.5));
 m.aoNode=ao;return m}

// ---------- terrain: porous lime rock (two Voronoi octaves as pits), sand, goo from a baked mask with its own seed
export function terrainMaterial(rock,goo,gooCols,sand){
 const m=seedMaterial(rock),u=m.userData.u,X=attribute('aX','vec4');
 const g0=uniform(new THREE.Color(gooCols[0])),g1=uniform(new THREE.Color(gooCols[1])),g2=uniform(new THREE.Color(gooCols[2])),sandC=uniform(new THREE.Color(sand));
 const gooS={rough:uniform(1-goo.gloss),sss:uniform(new THREE.Color(goo.sss))};m.userData.goo={g0,g1,g2,sandC,gooS};
 const P=positionWorld;
 const w1=mx_worley_noise_vec2(P.mul(1.5)),w2=mx_worley_noise_vec2(P.mul(4.2).add(5));
 const pit=ss(.3,.12,w1.x),pit2=ss(.28,.1,w2.x).mul(.75),pits=max(pit,pit2);
 const sandM=ss(.9,.25,P.y).mul(ss(.55,.2,X.w));
 const rockA=mix(u.base,u.accent,pits.mul(.9)).mul(mx_noise_float(P.mul(vec3(.6,2.4,.6))).mul(.3).add(.85));
 const gm=smoothstep(.42,.58,X.y.add(mx_noise_float(P.mul(1.6)).mul(.4)));
 const sel=X.z,gc=mix(mix(g1,g0,smoothstep(.3,.42,sel)),g2,smoothstep(.58,.7,sel));
 m.colorNode=mix(mix(rockA,sandC,sandM),gc,gm);
 m.roughnessNode=mix(mix(u.rough,float(.85),sandM),gooS.rough,gm);
 m.clearcoatNode=gm;m.clearcoatRoughnessNode=float(.05);
 m.aoNode=X.x.mul(oneMinus(pits.mul(.45).mul(oneMinus(sandM)).mul(oneMinus(gm))));
 const V=viewDir(),N=normalize(attribute('normal','vec3'));
 m.emissiveNode=glowThrough(gooS.sss,N,V).mul(gm).add(glowThrough(u.sss,N,V).mul(oneMinus(gm)).mul(.4)).add(U.pulseCol.mul(pulseSum(P)).mul(.5));
 return m}

// ---------- liquids
const fb2=p=>mx_fractal_noise_float(vec3(p,.5),4,2.,.5).mul(.5).add(.5);
const ripples=Fn(([p])=>{const y=float(0).toVar();Loop(8,({i})=>{const r=U.rips.element(i),a=U.t.sub(r.w);If(a.greaterThan(0).and(a.lessThan(6)),()=>{const x=length(p.sub(r.xy)).sub(a.mul(3.2));y.addAssign(r.z.mul(exp(a.mul(-.7))).mul(exp(x.mul(x).mul(-.6))).mul(sin(x.mul(5))))})});return y});
const moundSum=Fn(([p])=>{const y=float(0).toVar();Loop(16,({i})=>{const mm=U.mounds.element(i);If(mm.z.greaterThan(0),()=>{const d=p.sub(mm.xy);y.addAssign(exp(dot(d,d).div(mm.z.mul(mm.z).mul(.7)).negate()))})});return y});
// iridescent oil pool: marbled rainbow stripes over a deep base, eye mounds lifted and tinted to skin
export function poolMaterial(seed,skin){const m=seedMaterial(seed),u=m.userData.u;const skinC=uniform(new THREE.Color(skin));m.userData.skin=skinC;
 const xz=vec2(positionLocal.x,positionLocal.z);
 const hgt=Fn(([p])=>{const y=float(0).toVar();Loop(16,({i})=>{const mm=U.mounds.element(i);If(mm.z.greaterThan(0),()=>{const d=p.sub(mm.xy);y.addAssign(mm.w.mul(exp(dot(d,d).div(mm.z.mul(mm.z)).negate())))})});
  return y.add(ripples(p)).add(sin(p.x.mul(1.3).add(U.t.mul(.7).mul(U.flow))).mul(sin(p.y.mul(1.1).sub(U.t.mul(.5).mul(U.flow)))).mul(.012))});
 const e=.08,y0=hgt(xz),yx=hgt(xz.add(vec2(e,0))),yz=hgt(xz.add(vec2(0,e)));
 m.positionNode=vec3(positionLocal.x,y0,positionLocal.z);
 m.normalNode=transformNormalToView(varying(normalize(vec3(yx.sub(y0).div(-e),1,yz.sub(y0).div(-e))),'vNp'));
 const pw=positionWorld,q=vec2(pw.x,pw.z).mul(.2),t=U.t.mul(U.flow);
 const w=vec2(fb2(q.add(vec2(t.mul(.04),0))),fb2(q.add(vec2(5.2,1.3)).sub(vec2(0,t.mul(.035))))),f=fb2(q.add(w.mul(2.2)).add(vec2(t.mul(-.02),t.mul(.015))));
 const ph=f.mul(3.2).add(length(vec2(pw.x,pw.z)).mul(.22)).sub(t.mul(.06));
 const rb=pow(cos(vec3(0,.33,.67).add(ph.mul(1.4)).mul(6.2831)).mul(.5).add(.5),vec3(1.5)).mul(1.5);
 const band=pow(sin(ph.mul(6.2831*3.2)).mul(.5).add(.5),3).mul(smoothstep(.25,.6,f).mul(.5).add(.5)).mul(oneMinus(smoothstep(.25,.9,fwidth(ph.mul(3.2))))).add(smoothstep(.25,.9,fwidth(ph.mul(3.2))).mul(.18));
 const mk=moundSum(vec2(pw.x,pw.z));
 const base=u.base,fade=oneMinus(smoothstep(13,42,length(vec2(pw.x,pw.z))).mul(.93));
 const alb=mix(mix(base,rb,band.mul(seed.filmK)),skinC,smoothstep(.25,.85,mk));
 m.colorNode=alb.mul(fade);m.iridescence=0;
 m.emissiveNode=rb.mul(band).mul(u.emit).mul(fade).add(U.pulseCol.mul(pulseSum(pw)).mul(.5));
 return m}
// Gerstner sea with shallows and shore foam from the baked terrain height texture, pore eyes in the foam
export function seaMaterial(seed,htex,hb){const m=seedMaterial(seed),u=m.userData.u;
 const WV=[[.8,.6,26,.32],[-.3,.95,13,.16],[.95,-.2,7,.08],[.2,.98,3.6,.035]];
 const hgt=Fn(([p])=>{const y=float(0).toVar(),cr=float(0).toVar();const fade=exp(length(p.sub(vec2(cameraPosition.x,cameraPosition.z))).div(-90));
  for(const [dx,dz,lam,amp] of WV){const l=Math.hypot(dx,dz),k=6.2831/lam,ph=dot(vec2(dx/l,dz/l),p).mul(k).sub(U.t.mul(Math.sqrt(9.8*k)*.6)),s=sin(ph);y.addAssign(s.mul(amp).mul(fade));cr.addAssign(max(s,0).mul(amp).mul(fade))}
  return vec2(y.add(ripples(p)),cr)});
 const xz=vec2(positionLocal.x,positionLocal.z),e=.08,h0=hgt(xz),hx=hgt(xz.add(vec2(e,0))),hz=hgt(xz.add(vec2(0,e)));
 m.positionNode=vec3(positionLocal.x,h0.x,positionLocal.z);
 m.normalNode=transformNormalToView(varying(normalize(vec3(hx.x.sub(h0.x).div(-e),1,hz.x.sub(h0.x).div(-e))),'vNo'));
 const crest=varying(h0.y,'vCr'),pw=positionWorld,hu=vec2(pw.x,pw.z).sub(vec2(hb[0],hb[1])).div(vec2(hb[2]-hb[0],hb[3]-hb[1]));
 const inside=step(0,hu.x).mul(step(0,hu.y)).mul(step(hu.x,1)).mul(step(hu.y,1)),th=mix(float(-3),texture(htex,hu).r,inside);
 const sh=smoothstep(-2.6,.1,th),t=U.t.mul(U.flow);
 const water=mix(u.base,u.accent,sh.mul(.85));
 const foam0=smoothstep(-.55,-.05,th.add(crest.mul(.6)).add(fb2(vec2(pw.x,pw.z).mul(.9).add(t.mul(.1))).sub(.5).mul(.5))).add(smoothstep(.5,.7,crest).mul(.25));
 const foam=clamp(foam0.mul(smoothstep(.1,.35,fb2(vec2(pw.x,pw.z).mul(2.3).sub(t.mul(.05))).add(foam0.mul(.3)))),0,1);
 const pr4=poresFn(vec3(pw.x,pw.z,t.mul(.03)).mul(vec3(1.6,1.6,1)),vec3(0,1,0),pw);
 const fc=mix(U.sclera.mul(.95),pr4.xyz,clamp(pr4.w,0,1));
 m.colorNode=mix(water,fc,foam);m.roughnessNode=mix(float(.05),float(.6),foam);m.specularIntensity=.2;m.clearcoat=0;m.iridescence=0;
 const V=viewDir();
 m.emissiveNode=u.sss.mul(pow(saturate(dot(U.sun.negate(),V)),3)).mul(crest.mul(2.5).add(.25)).mul(oneMinus(foam)).add(U.pulseCol.mul(pulseSum(pw)).mul(.5));
 return m}

// ---------- soap bubbles: transmission + iridescence, positions from the bubble compute buffer
export function bubbleMaterial(seed,bubBuf,colBuf,{transmission=true}={}){
 const m=new THREE.MeshPhysicalNodeMaterial({transparent:!transmission,depthWrite:false});
 const B=bubBuf.element(instanceIndex);m.positionNode=positionLocal.mul(sin(U.t.mul(3.1).add(positionLocal.y.mul(4)).add(B.x.mul(3))).mul(.035).add(1)).mul(B.w).add(B.xyz);
 m.color.set('#ffffff');m.roughness=0;m.metalness=0;m.iridescence=1;m.iridescenceIOR=1.33;m.iridescenceThicknessRange=[180,820];
 if(transmission){m.transmission=1;m.thickness=.02;m.ior=1.02}else{m.opacity=.25}
 const tint=colBuf.element(instanceIndex);const rim=oneMinus(saturate(abs(dot(normalize(attribute('normal','vec3')),viewDir()))));const film=cos(vec3(0,2.1,4.2).add(rim.mul(9)).add(U.t.mul(.7))).mul(.5).add(.5);
 m.emissiveNode=tint.xyz.mul(.4).add(film.mul(.6)).mul(pow(rim,2.5)).mul(1.1);
 m.userData.seed=seed;return m}

// ---------- impostor cards (fronds additive, clouds and palaces premultiplied) as billboards in positionNode
export function cardMaterial(atlas,additive){
 const m=new THREE.MeshBasicNodeMaterial({transparent:true,depthWrite:false,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending,fog:false});
 const C0=attribute('aC0','vec4'),C1=attribute('aC1','vec4'),C=attribute('aCol','vec3');
 const camR=uniform(new THREE.Vector3(1,0,0)),camU=uniform(new THREE.Vector3(0,1,0));m.userData.cam={camR,camU};
 const cyl=step(.5,C1.z),R=mix(camR,normalize(vec3(camR.x,0,camR.z)),cyl),Up=mix(camU,vec3(0,1,0),cyl);
 const q0=uv(),q=vec2(q0.x.sub(.5),q0.y.sub(mix(float(.5),float(0),cyl)));const qx=q.x.add(sin(U.t.mul(.4).add(C0.x)).mul(.015).mul(q.y.add(.5)));
 m.positionNode=C0.xyz.add(R.mul(qx).mul(C0.w).mul(C1.y)).add(Up.mul(q.y).mul(C0.w));
 const ri=int(C1.x.add(.5));
 const r0=select(ri.equal(0),vec4(0,0,.5,.5),select(ri.equal(1),vec4(.5,0,1,.25),select(ri.equal(2),vec4(.5,.25,1,.5),select(ri.equal(3),vec4(0,.5,.5,1),vec4(.5,.5,1,1)))));
 const tuv=vec2(mix(r0.x,r0.z,q0.x),mix(r0.w,r0.y,q0.y));
 const tx=texture(atlas,vec2(tuv.x,oneMinus(tuv.y)));
 m.colorNode=additive?vec4(tx.rgb.mul(tx.a).mul(C).mul(C1.w),1):vec4(tx.rgb.mul(C),tx.a.mul(C1.w));
 return m}
// four-point sparkles: billboards, ambient twinkle in a box plus bursts
export function sparkMaterial(N){
 const m=new THREE.MeshBasicNodeMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
 const S=attribute('aSeed','vec4'),camR=uniform(new THREE.Vector3(1,0,0)),camU=uniform(new THREE.Vector3(0,1,0)),boxC=uniform(new THREE.Vector3()),boxS=uniform(new THREE.Vector3(1,1,1));
 const bursts=uniformArray(Array.from({length:4},()=>new THREE.Vector4(0,0,0,-99)),'vec4'),count=uniform(400),cA=uniform(new THREE.Color()),cB=uniform(new THREE.Color());
 m.userData.u={camR,camU,boxC,boxS,bursts,count,cA,cB};
 const id=float(instanceIndex),isB=step(id,127.5),bi=int(id.div(32).min(3));
 const B=bursts.element(bi),age=U.t.sub(B.w),dir=normalize(S.xyz.sub(.5).add(.001));
 const pB=B.xyz.add(dir.mul(oneMinus(exp(age.mul(-2.6))).mul(S.w.mul(1.6).add(1.2)))).sub(vec3(0,age.mul(age).mul(.35),0));
 const pA=boxC.add(S.xyz.sub(.5).mul(boxS)).add(vec3(sin(U.t.mul(.2).add(S.w.mul(30))),sin(U.t.mul(.15).add(S.x.mul(20))).mul(.5),cos(U.t.mul(.18).add(S.y.mul(25)))).mul(.4));
 const alive=select(isB.greaterThan(.5),step(0,age).mul(step(age,1.8)),step(id.sub(128),count));
 const bA=pow(sin(U.t.mul(S.w.mul(2.2).add(.5)).add(S.w.mul(61))).mul(.5).add(.5),12).mul(S.w.mul(2.4).add(.6)),bB=pow(oneMinus(age.div(1.8)).max(0),2).mul(5);
 const br=mix(bA,bB,isB).mul(alive),sz=mix(S.w.mul(.12).add(.06),S.w.mul(.1).add(.08),isB).mul(alive);
 const q=uv().sub(.5).mul(2);
 m.positionNode=mix(pA,pB,isB).add(camR.mul(q.x).mul(sz)).add(camU.mul(q.y).mul(sz));
 const rot=step(.6,fract(S.x.mul(13.1))),qr=mix(q,vec2(q.x.add(q.y),q.y.sub(q.x)).mul(.7071),rot);
 const s=max(exp(abs(qr.x).mul(-14)).mul(exp(abs(qr.y).mul(-1.9))),exp(abs(qr.y).mul(-14)).mul(exp(abs(qr.x).mul(-1.9)))).add(exp(dot(qr,qr).mul(-10)).mul(.8));
 m.colorNode=vec4(mix(cA,cB,fract(S.w.mul(7.13))).mul(s).mul(br).mul(3),1);
 return m}

// ---------- sky: a void with nebula and stars, or a sunset dome; also rendered into the environment cube
export function skyMaterial(P){
 const m=new THREE.MeshBasicNodeMaterial({side:THREE.BackSide,depthWrite:false,fog:false});
 const u={a:uniform(new THREE.Color()),b:uniform(new THREE.Color()),c:uniform(new THREE.Color()),sunC:uniform(new THREE.Color()),fill:uniform(new THREE.Color()),world:uniform(0),stars:uniform(1)};m.userData.u=u;
 const d=normalize(positionLocal);
 const voidC=mix(u.a,u.b,smoothstep(-.3,.9,d.y)).add(u.c.mul(pow(smoothstep(.42,.8,mx_fractal_noise_float(d.mul(2.4),4,2,.5).mul(.5).add(.5)),2)).mul(.9));
 const cell=floor(d.mul(150)),hcell=h31(cell),f=fract(d.mul(150)).sub(.5);
 const stars=mix(vec3(1,.75,1),vec3(.6,.8,1),h31(cell.add(1))).mul(step(.988,hcell)).mul(ss(.25,0,length(f))).mul(sin(U.t.mul(1.3).add(hcell.mul(90))).mul(.6).add(.6)).mul(2).mul(u.stars);
 const sd=dot(d,U.sun);
 const g1=mix(u.a,u.b,smoothstep(-.02,.3,d.y)),g2=mix(g1,u.c,smoothstep(.25,.9,d.y)),g3=mix(g2,u.a.mul(1.25),pow(max(sd,0),5).mul(.65));
 const sunset=g3.add(u.sunC.mul(pow(max(sd,0),300).mul(.7).add(pow(max(sd,0),2400).mul(2)))).add(u.sunC.mul(5).mul(smoothstep(.9989,.9993,sd)));
 m.colorNode=mix(voidC.add(stars),sunset,u.world);
 return m}
