// Strata World · jelly beings. Soft-body blobs with spring cores; rendered as one raymarched SDF smooth-min union,
// so blobs that touch merge with a gooey neck. Family slots form a heap: the children of slot i are slots 2i+2 and 2i+3,
// each born at 0.6 of its parent's radius (volume conserved), so a pinch-off is the same being, smaller.
// Slot 0 is the player orb (ORB MODE). Droplets past the third generation melt back into the goo heightfield.
import * as THREE from 'three/webgpu';
import {Fn,If,Loop,float,int,ivec2,vec2,vec3,vec4,uniform,textureLoad,positionLocal,positionWorld,cameraPosition,cameraNear,cameraFar,cameraViewMatrix,instanceIndex,varying,
 normalize,length,dot,cross,max,min,abs,clamp,exp,pow,mix,smoothstep,step,select,saturate,oneMinus,sin,cos,atan,fwidth,sqrt,reflect,viewZToPerspectiveDepth,Discard,hash,floor,pmremTexture} from 'three/tsl';
import {U,pulseSum} from './materials.js';
import {norm,vsub,vadd,vscl,vdot,clamp as cl,mix as mx,hexLin} from './core.js';

export const M=46,ROOTS=[1,2,3];
const kids=i=>i>=1?[2*i+2,2*i+3].filter(k=>k<M):[];
const parentOf=j=>j>=4?Math.floor((j-2)/2):-1;
const genOf=j=>j===0?0:j<4?0:j<10?1:j<22?2:3;

export function makeJelly(world,P,seedJ,seedOrb){
 const B=Array.from({length:M},(_,i)=>({i,on:false,p:[0,0,0],v:[0,0,0],r:.5,sq:0,sqv:0,st:[0,0,0],gaze:[0,0,1],sock:[0,0,1],lid:1,blinkAt:2+Math.random()*4,blinkT:-9,
  born:-9,lastBud:0,meltT:-1,landT:-9,ground:false,grab:null,wander:[0,0],wanderT:0,col:[1,1,1],hop:0,orb:i===0,es:.62,energy:0}));
 const [x0,z0,x1,z1]=world.rect,cols=(P.jelly||P.bulb||['#9b2fe6']).map(hexLin);
 const place=(b,x,z,r,col)=>{b.on=true;b.p=[x,world.ground(x,z)+r,z];b.v=[0,0,0];b.r=r;b.sq=0;b.sqv=0;b.st=[0,0,0];b.col=col;b.born=0;b.meltT=-1;b.lastBud=0;b.wander=[x,z]};
 ROOTS.forEach((i,k)=>{const a=k/3*Math.PI*2+.6,c=world.foldC;place(B[i],c[0]+Math.cos(a)*3.6,c[2]+Math.sin(a)*2.6+1.5,.62+.08*k,cols[k%cols.length])});
 place(B[0],world.foldC[0]+.8,world.foldC[2]+4.8,.55,hexLin(P.orb||'#ffffff'));B[0].col=hexLin(P.orb||'#d8f8ff');
 // packed data texture: 5 texels per active blob (pos+r, stretch+squash, gaze+lid, socket+eyeSize, colour+wobble)
 const DT=new Float32Array(5*M*4),dataTex=new THREE.DataTexture(DT,5,M,THREE.RGBAFormat,THREE.FloatType);dataTex.minFilter=dataTex.magFilter=THREE.NearestFilter;dataTex.needsUpdate=true;
 const count=uniform(0);
 let time=0,melts=[];
 function spawnChild(par,dir,speed){const free=kids(par.i).find(k=>!B[k].on);if(free===undefined||par.r<.22)return null;const c=B[free];
  const rc=par.r*.6;par.r=Math.cbrt(Math.max(par.r**3-rc**3,(par.r*.5)**3));   // volume conserved, parent never vanishes
  c.on=true;c.r=rc;c.p=vadd(par.p,vscl(dir,par.r+rc*.8));c.v=vadd(vscl(dir,speed),[0,2.2,0]);c.sq=0;c.sqv=-3;c.st=vscl(dir,-rc*.6);c.col=par.col.map(v=>v*(.92+.16*Math.random()));
  c.born=time;c.lastBud=time;c.meltT=-1;c.landT=-9;c.wander=[c.p[0],c.p[2]];par.sqv+=4;par.st=[0,0,0];par.lastBud=time;return c}
 function step(dt,ctx){time=ctx.time;const stiff=seedJ.stiff??1,wob=seedJ.wobble??1;melts=[];
  for(const b of B){if(!b.on)continue;const gen=genOf(b.i);
   // locomotion: the orb follows the stick; others wander toward drifting targets and hop now and then
   if(b.orb&&ctx.orbInput){const s=ctx.orbInput;b.v[0]+=(s[0]*3.4-b.v[0])*Math.min(1,dt*6);b.v[2]+=(s[1]*3.4-b.v[2])*Math.min(1,dt*6)}
   else if(!b.grab){if(time>b.wanderT){b.wanderT=time+2+Math.random()*4;const c=world.foldC;b.wander=[cl(b.p[0]+(Math.random()-.5)*6,x0+2,x1-2),cl(b.p[2]+(Math.random()-.5)*6,z0+2,z1-2)];if(Math.random()<.5)b.wander=[mx(b.wander[0],c[0],.3),mx(b.wander[1],c[2]+1,.3)]}
    const dx=b.wander[0]-b.p[0],dz=b.wander[1]-b.p[2],d=Math.hypot(dx,dz)+1e-3,sp=(b.orb?.6:1.1)/Math.sqrt(b.r/.5);
    if(d>.4){b.v[0]+=(dx/d*sp-b.v[0])*Math.min(1,dt*2);b.v[2]+=(dz/d*sp-b.v[2])*Math.min(1,dt*2)}
    if(b.ground&&Math.random()<dt*.18*(gen+1))b.v[1]=2.5+Math.random()*1.5}
   if(b.grab){const t=b.grab.target,dv=vsub(t,b.p),L=Math.hypot(...dv);b.st=vscl(dv,Math.min(1,b.r*2.1/Math.max(L,1e-3)));b.v=vadd(vscl(b.v,Math.exp(-dt*5)),vscl(dv,dt*7));
    if(L>b.r*1.55){const c=spawnChild(b,norm(dv),Math.min(L*1.6,6));if(c){b.grab.target=vadd(b.p,vscl(norm(dv),b.r));c.v=vscl(norm(dv),4)}}}
   b.v[1]-=9.5*dt;b.p=vadd(b.p,vscl(b.v,dt));
   b.p[0]=cl(b.p[0],x0+.6,x1-.6);b.p[2]=cl(b.p[2],z0+.6,z1-.6);
   const g=world.ground(b.p[0],b.p[2]),rest=g+b.r*(.8-b.sq*.25);b.ground=false;
   if(b.p[1]<rest){if(b.v[1]<-2.2){b.sqv+=-b.v[1]*.55*wob;b.landT=time;ctx.onLand&&ctx.onLand(b)}b.p[1]=rest;b.v[1]=Math.max(0,b.v[1]);b.ground=true;b.v[0]*=Math.exp(-dt*1.6);b.v[2]*=Math.exp(-dt*1.6)}
   if(b.orb&&ctx.orbHop){b.v[1]=5.2;b.sqv+=3*wob;ctx.orbHop=false}
   // squash spring, gooey trailing stretch, wobble energy
   b.sqv+=(-70*stiff*b.sq-(5/wob)*b.sqv)*dt;b.sq=cl(b.sq+b.sqv*dt,-.45,.55);
   if(!b.grab){const trail=[b.v[0]*-.06,Math.max(-b.v[1],0)*-.015,b.v[2]*-.06];b.st=vadd(b.st,vscl(vsub(trail,b.st),Math.min(1,dt*(6*stiff))))}
   b.energy=Math.max(b.energy*Math.exp(-dt*1.5),Math.abs(b.sqv)*.15);
   // eat goo, grow, bud; droplets past the third generation melt back into the heightfield
   const hHere=ctx.gooAt(b.p[0],b.p[2]);b.eat=0;
   if(b.ground&&hHere>.25&&b.r<(b.orb?.85:.8)&&b.meltT<0&&!b.grab){b.eat=1;b.r=Math.cbrt(b.r**3+dt*.012*hHere)}
   if(!b.orb&&b.r>.74&&time-b.lastBud>6&&b.ground&&Math.random()<dt*.3){const a=Math.random()*Math.PI*2;spawnChild(b,norm([Math.cos(a),.6,Math.sin(a)]),2.2)}
   if(!b.orb&&(gen>=3||b.r<.17)&&b.meltT<0&&b.ground&&time-b.landT>1.2&&time-b.born>1.5)b.meltT=time;
   if(b.meltT>=0){const k=(time-b.meltT)/.8;b.r*=Math.exp(-dt*3.2);melts.push(b);if(k>1||b.r<.03){b.on=false;b.meltT=-1}}
   // eyes: the socket turns toward motion or the viewer, the gaze follows the shared look target, random blinks
   const toCam=norm(vsub(ctx.cam,b.p)),mv=Math.hypot(b.v[0],b.v[2]),face=mv>.4?norm(vadd(vscl(toCam,.7),vscl(norm([b.v[0],.2,b.v[2]]),.3))):toCam;b.sock=norm(vadd(vscl(b.sock,1-Math.min(1,dt*3)),vscl(face,Math.min(1,dt*3))));
   let gz=norm(vsub(ctx.look,b.p));const c=vdot(gz,b.sock);if(c<.85){const pp=norm(vsub(gz,vscl(b.sock,c)));gz=vadd(vscl(b.sock,.85),vscl(pp,.527))}b.gaze=norm(vadd(vscl(b.gaze,.85),vscl(gz,.15)));
   if(time>b.blinkAt){b.blinkT=time;b.blinkAt=time+2.5+Math.random()*4.5}const bl=Math.max(0,1-Math.abs(time-b.blinkT-.08)/.08);b.lid+=((ctx.moodLid*(1-bl))-b.lid)*Math.min(1,dt*16)}
  // soft contact: press together until the smooth-min neck shows, never fully overlap; the orb swallows small droplets
  for(let i=0;i<M;i++){const a=B[i];if(!a.on)continue;for(let j=i+1;j<M;j++){const b=B[j];if(!b.on)continue;const d=vsub(b.p,a.p),L=Math.hypot(...d)+1e-4,ov=a.r+b.r-L;if(ov<=0)continue;
   if((a.orb&&b.r<.3&&b.i!==0&&b.meltT<0)||(b.orb&&a.r<.3&&a.meltT<0)){const big=a.orb?a:b,sm=a.orb?b:a;big.r=Math.min(1.1,Math.cbrt(big.r**3+sm.r**3*.8));big.sqv+=2;sm.on=false;ctx.onSwallow&&ctx.onSwallow(big);continue}
   const n=vscl(d,1/L),push=ov*.22,ma=a.r**3,mb=b.r**3,wa=mb/(ma+mb),wb=ma/(ma+mb);
   a.p=vsub(a.p,vscl(n,push*wa));b.p=vadd(b.p,vscl(n,push*wb));const rv=vdot(vsub(b.v,a.v),n);if(rv<0){a.v=vadd(a.v,vscl(n,rv*wa*.6));b.v=vsub(b.v,vscl(n,rv*wb*.6))}
   a.energy=Math.max(a.energy,ov*2);b.energy=Math.max(b.energy,ov*2)}}
  // keep the family alive: a root that has lost all its volume regrows slowly
  for(const i of ROOTS)if(B[i].on&&B[i].r<.5)B[i].r+=dt*.004;
 }
 function upload(){let n=0;for(const b of B){if(!b.on)continue;const o=n*20;
  DT.set([b.p[0],b.p[1],b.p[2],b.r],o);DT.set([b.st[0],b.st[1],b.st[2],b.sq],o+4);DT.set([b.gaze[0],b.gaze[1],b.gaze[2],b.lid],o+8);DT.set([b.sock[0],b.sock[1],b.sock[2],b.orb?.7:b.es],o+12);DT.set([b.col[0],b.col[1],b.col[2],b.energy+(b.orb?10:0)],o+16);n++}
  count.value=n;dataTex.needsUpdate=true;return n}
 // feed the goo: every blob presses the goo it sits in, eats when hungry, melting droplets deposit
 function feedGoo(goo){let n=0;const s=1/goo.txl;for(const b of B){const k=goo.BL.array[n],k2=goo.BL2.array[n];if(n>=goo.BL.array.length)break;
  if(!b.on){continue}const [tx,tz]=goo.toTex(b.p[0],b.p[2]),contact=b.ground?1:Math.max(0,1-(b.p[1]-world.ground(b.p[0],b.p[2])-b.r)/(b.r));
  k.set(tx,tz,b.r*s*.95,b.r/.22*.55*contact);k2.set(b.meltT>=0?1.6*(b.r/.2):(b.eat?-.18:0),b.v[0]*s*contact,b.v[2]*s*contact,1);n++}
  for(;n<goo.BL.array.length;n++)goo.BL2.array[n].w=0}
 return {B,step,upload,feedGoo,dataTex,count,spawnChild,genOf,get time(){return time}};
}

// ---- raymarched smooth-min union on instanced proxy spheres (one per active blob)
export function jellyMesh(J,envTex){
 const g=new THREE.IcosahedronGeometry(1,2);const ig=new THREE.InstancedBufferGeometry();ig.index=g.index;ig.setAttribute('position',g.attributes.position);ig.setAttribute('normal',g.attributes.normal);ig.instanceCount=M;
 const m=new THREE.MeshBasicNodeMaterial({side:THREE.BackSide,depthWrite:true,transparent:false});
 const D=J.dataTex,cnt=J.count,row=(i,c)=>textureLoad(D,ivec2(int(c),int(i)));
 const ii=instanceIndex,p0=row(ii,0),s0=row(ii,1),alive=step(float(ii).add(.5),float(cnt));
 const cen=p0.xyz.add(s0.xyz.mul(.5)),rad=p0.w.mul(1.75).add(length(s0.xyz)).add(.15).mul(alive);
 m.positionNode=positionLocal.mul(rad).add(cen);
 const vC=varying(cen,'vJc'),vR=varying(rad,'vJr');
 const smin=(a,b,k)=>{const h=max(k.sub(abs(a.sub(b))),0).div(k);return min(a,b).sub(h.mul(h).mul(k).mul(.25))};
 const sdBlob=(p,i)=>{const P=row(i,0),S=row(i,1),C=row(i,4),r=P.w,st=S.xyz,sq=S.w;
  const q0=p.sub(P.xyz),q=vec3(q0.x.mul(oneMinus(sq.mul(.3))),q0.y.div(oneMinus(sq.mul(.5)).max(.4)),q0.z.mul(oneMinus(sq.mul(.3))));
  const hh=clamp(dot(q,st).div(max(dot(st,st),1e-4)),0,1),dq=q.sub(st.mul(hh)),rr=r.mul(mix(1,.5,hh));
  const wob=sin(U.t.mul(5.2).add(float(i).mul(1.7)).add(dot(q,vec3(1.3,2.1,1.7)).mul(float(4).div(r)))).mul(r).mul(.035).mul(min(C.w.sub(floor(C.w.div(10)).mul(10)).add(.25),1.5));
  return length(dq).sub(rr).add(wob)};
 const map=Fn(([p])=>{const d=float(1e3).toVar();Loop({start:int(0),end:int(cnt),type:'int'},({i})=>{const r=row(i,0).w;d.assign(smin(d,sdBlob(p,i),r.mul(.55).add(.08)))});return d});
 // nearest blob (for the eye) with the margin to the runner-up, and a smooth colour blend so shading never shows a seam where blobs merge
 const nearest=Fn(([p])=>{const best=float(1e3).toVar(),second=float(1e3).toVar(),id=float(0).toVar();
  Loop({start:int(0),end:int(cnt),type:'int'},({i})=>{const d=sdBlob(p,i),isB=step(d,best);second.assign(select(isB.greaterThan(.5),best,min(second,d)));id.assign(select(isB.greaterThan(.5),float(i),id));best.assign(min(best,d))});
  return vec2(id,second.sub(best))});
 const blendCol=Fn(([p])=>{const c=vec3(0).toVar(),ws=float(0).toVar();Loop({start:int(0),end:int(cnt),type:'int'},({i})=>{const w=exp(max(sdBlob(p,i),0).mul(-14));c.addAssign(row(i,4).xyz.mul(w));ws.addAssign(w)});return c.div(max(ws,1e-4))});
 const ro=cameraPosition,rd=normalize(positionWorld.sub(ro));
 const oc=ro.sub(vC),bq=dot(oc,rd),cq=dot(oc,oc).sub(vR.mul(vR)),disc=max(bq.mul(bq).sub(cq),0),t0=max(bq.negate().sub(sqrt(disc)),cameraNear),t1=bq.negate().add(sqrt(disc));
 const march=Fn(()=>{const t=t0.toVar(),hit=float(0).toVar();
  Loop(56,()=>{If(hit.lessThan(.5),()=>{const d=map(ro.add(rd.mul(t)));If(d.lessThan(t.mul(.0015).add(.002)),()=>{hit.assign(1)}).Else(()=>{t.addAssign(d.mul(.9))})})});
  return vec2(t,hit)});
 const tm=march(),t=tm.x,hit=tm.y;
 const out=Fn(()=>{If(hit.lessThan(.5).or(t.greaterThan(t1)),()=>{Discard()});
  const p=ro.add(rd.mul(t)),e=.004;
  const N=normalize(vec3(1,-1,-1).mul(map(p.add(vec3(e,-e,-e)))).add(vec3(-1,-1,1).mul(map(p.add(vec3(-e,-e,e))))).add(vec3(-1,1,-1).mul(map(p.add(vec3(-e,e,-e))))).add(vec3(1,1,1).mul(map(p.add(vec3(e,e,e))))));
  const nm=nearest(p),id=int(nm.x),dom=smoothstep(.02,.12,nm.y),P=row(id,0),E=row(id,2),F=row(id,3),C=row(id,4),isOrb=step(9.5,C.w).mul(dom);
  const V=rd.negate(),L=U.sun,NdV=saturate(dot(N,V)),Fr=float(.04).add(pow(oneMinus(NdV),5).mul(.96));
  const thin=saturate(map(p.sub(N.mul(P.w.mul(.5)))).negate().div(P.w.mul(.5)));   // how much jelly lies behind this point
  const col=blendCol(p);
  // eye on the nearest blob: almond opening around the socket, iris around the gaze
  const od=normalize(p.sub(P.xyz)),S=normalize(F.xyz),G=normalize(E.xyz),up=vec3(0,1,0),Sx=normalize(cross(up,S)),Sy=cross(S,Sx),es=F.w,lid=max(E.w,.03);
  const av=vec2(dot(od,Sx),dot(od,Sy)).div(es),ae=vec2(av.x,av.y.div(lid)),eyeD=max(length(ae.sub(vec2(0,-.22))),length(ae.sub(vec2(0,.22)))).sub(1),aa=fwidth(eyeD).add(.01);
  const eyeM=oneMinus(smoothstep(aa.negate(),aa,eyeD)).mul(smoothstep(.15,.4,dot(od,S))).mul(dom);
  const Gx=normalize(cross(up,G)),Gy=cross(G,Gx),g2=vec2(dot(od,Gx),dot(od,Gy)),rr=length(g2).div(es.mul(.82)),th=atan(g2.y,g2.x);
  const ic=mix(U.irisA,U.irisB,smoothstep(.3,1,rr)).mul(sin(th.mul(27)).mul(sin(th.mul(9).sub(rr.mul(6)))).mul(.35).add(.75)).mul(oneMinus(smoothstep(.85,1,rr).mul(.85)));
  const irM=oneMinus(smoothstep(.97,1.03,rr)),puM=oneMinus(smoothstep(.36,.42,rr)),glint=smoothstep(.13,.04,length(g2.div(es.mul(.82)).sub(vec2(-.3,.35))));
  const eyeC=mix(mix(U.sclera.mul(oneMinus(smoothstep(.2,1,length(av)).mul(.5))),ic,irM),vec3(.004,0,.012),puM).add(glint.mul(1.6));
  // jelly light: soft diffuse, glow-through where thin and backlit, rim, studio reflection, a sharp sun highlight
  const amb=mix(U.amb1,U.amb0,N.y.mul(.5).add(.5));
  const diff=col.mul(amb.mul(.7).add(U.sunCol.mul(saturate(dot(N,L).add(.3).div(1.3))).mul(.55)));
  const sss=col.mul(pow(saturate(dot(L.negate(),V)),3).mul(1.6).add(pow(oneMinus(NdV),2).mul(.8)).add(oneMinus(thin).mul(.5)));
  const env=pmremTexture(envTex,reflect(rd,N),float(.04)).xyz.mul(Fr).mul(1.5);
  const film=cos(vec3(0,2.1,4.2).add(oneMinus(NdV).mul(10)).add(U.t)).mul(.5).add(.5).mul(Fr).mul(isOrb).mul(1.4);
  const spec=U.sunCol.mul(pow(saturate(dot(N,normalize(L.add(V)))),320)).mul(7);
  const gl=hash(floor(od.mul(70)).dot(vec3(1,57,113)).toUint()),twk=step(.992,gl).mul(pow(sin(U.t.mul(3).add(gl.mul(80))).mul(.5).add(.5),8)).mul(2);
  const body=mix(diff.add(sss),eyeC.mul(amb.mul(.4).add(U.sunCol.mul(.5))).add(ic.mul(irM).mul(oneMinus(puM)).mul(.35)),eyeM);
  const c=body.add(env).add(film).add(spec).add(twk).add(U.pulseCol.mul(pulseSum(p)).mul(.6));
  return vec4(c,1)});
 m.colorNode=out();
 const hp=ro.add(rd.mul(t)),vz=cameraViewMatrix.mul(vec4(hp,1)).z;
 m.depthNode=viewZToPerspectiveDepth(vz,cameraNear,cameraFar);
 const mesh=new THREE.Mesh(ig,m);mesh.frustumCulled=false;mesh.renderOrder=0;mesh.userData.jelly=true;
 return mesh;
}
