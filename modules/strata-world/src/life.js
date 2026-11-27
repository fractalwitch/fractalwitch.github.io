// Strata World · GPU life. Eyes and bubbles live in storage buffers and are stepped by TSL compute shaders.
import * as THREE from 'three/webgpu';
import {Fn,If,instancedArray,instanceIndex,float,vec3,vec4,uniform,normalize,dot,sin,cos,mix,max,min,select,length,abs,fract,floor,hash,oneMinus} from 'three/tsl';
import {U} from './materials.js';

export const L={dt:uniform(1/60),moodLid:uniform(1),stare:uniform(1),hold:uniform(new THREE.Vector4(0,0,0,0)),popI:uniform(-1),
 areaC:uniform(new THREE.Vector3()),areaS:uniform(new THREE.Vector3(1,1,1)),top:uniform(8),rMin:uniform(.2),rMax:uniform(.5),speed:uniform(1)};
const COS=Math.cos(.36),SIN=Math.sin(.36);

// one compute per bulb group: stateful gaze smoothing and lid; blinks are scheduled by hash, pokes arrive as a wave by distance
export function eyeLife(list){
 const n=list.length,S=new Float32Array(n*4),K=new Float32Array(n*4),O=new Float32Array(n*4),G=new Float32Array(n*4);
 list.forEach((b,i)=>{S.set([...b.p,b.lag],i*4);K.set([...b.sock,b.kind],i*4);O.set(b.off.concat(0),i*4);G.set([...b.sock,1],i*4)});
 const stat=instancedArray(S,'vec4'),sock=instancedArray(K,'vec4'),off=instancedArray(O,'vec4'),gaze=instancedArray(G,'vec4');
 const compute=Fn(()=>{
  const st=stat.element(instanceIndex),so=sock.element(instanceIndex),of=off.element(instanceIndex),g=gaze.element(instanceIndex);
  If(so.w.greaterThan(.5),()=>{
   const per=hash(instanceIndex).mul(5).add(2.5),ph=hash(instanceIndex.add(77)).mul(per),bt=fract(U.t.add(ph).div(per)).mul(per);
   const b1=max(float(0),oneMinus(abs(bt.sub(.08)).div(.08)));
   const pd=length(st.xyz.sub(U.poke.xyz)),pa=U.t.sub(U.poke.w.add(pd.mul(.055)));
   const b2=select(pd.lessThan(9),max(float(0),oneMinus(abs(pa.sub(.08)).div(.08))),float(0));
   const lt=L.moodLid.mul(oneMinus(max(b1,b2))).mul(sin(U.t.mul(.7).add(st.w.mul(9))).mul(.05).add(1));
   g.w.assign(g.w.add(lt.sub(g.w).mul(min(1,L.dt.mul(18)))));
   const tgt=U.look.add(of.xyz.mul(oneMinus(L.stare).mul(1.5).add(.35))),dir=normalize(tgt.sub(st.xyz)).toVar(),c=dot(dir,so.xyz);
   If(c.lessThan(COS),()=>{const pp=normalize(dir.sub(so.xyz.mul(c)));dir.assign(so.xyz.mul(COS).add(pp.mul(SIN)))});
   g.xyz.assign(mix(g.xyz,dir,min(1,L.dt.mul(st.w.mul(12).add(3)))));
  });
 })().compute(n);
 return {gaze,stat,compute,n};
}

// bubbles: rise, sway, wrap, pop on request, blow from the hold point while holding
export function bubbleLife(n,cols){
 const B=new Float32Array(n*4),V=new Float32Array(n*4),Cc=new Float32Array(n*4);
 for(let i=0;i<n;i++){B.set([Math.random()*2-1,Math.random(),Math.random()*2-1,0],i*4);V.set([.25+.35*Math.random(),Math.random()*6.28,-99,Math.random()],i*4);const c=cols[i%cols.length];Cc.set([c.r,c.g,c.b,0],i*4)}
 const buf=instancedArray(B,'vec4'),vel=instancedArray(V,'vec4'),col=instancedArray(Cc,'vec4');
 const compute=Fn(()=>{
  const b=buf.element(instanceIndex),v=vel.element(instanceIndex),i=float(instanceIndex);
  // first frame after a reset: bubbles carry normalised coordinates, map them into the area
  If(v.z.lessThan(-50),()=>{b.assign(vec4(L.areaC.add(b.xyz.sub(vec3(0,.5,0)).mul(L.areaS)),0));v.z.assign(U.t.sub(1))});
  b.y.addAssign(v.x.mul(L.dt).mul(L.speed));b.x.addAssign(sin(U.t.mul(.8).add(v.y)).mul(.12).mul(L.dt));b.z.addAssign(cos(U.t.mul(.6).add(v.y)).mul(.08).mul(L.dt));
  const respawn=b.y.greaterThan(L.top).or(i.equal(L.popI));
  If(respawn,()=>{const h1=hash(instanceIndex.add(floor(U.t.mul(7.3)).toUint())),h2=hash(instanceIndex.add(floor(U.t.mul(5.1)).toUint()).add(911));
   b.xyz.assign(L.areaC.add(vec3(h1.sub(.5).mul(L.areaS.x),L.areaS.y.mul(-.5),h2.sub(.5).mul(L.areaS.z))));v.z.assign(U.t)});
  const blow=L.hold.w.greaterThan(.5).and(hash(instanceIndex.add(floor(U.t.mul(4.5)).toUint().mul(131))).lessThan(.12));
  If(blow,()=>{b.xyz.assign(L.hold.xyz.add(vec3(sin(i.mul(7.1)),0,cos(i.mul(3.3))).mul(.2)));v.z.assign(U.t);v.w.assign(.15)});
  const baseR=mix(L.rMin,L.rMax,fract(v.y.mul(.37)));
  b.w.assign(select(v.w.lessThan(.2),baseR.mul(.45),baseR).mul(min(1,U.t.sub(v.z).mul(3))));
  If(b.y.greaterThan(L.top.sub(.5)),()=>{v.w.assign(fract(v.y.mul(.73)).add(.2))});
 })().compute(n);
 return {buf,col,compute,n};
}
