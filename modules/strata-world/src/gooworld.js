// Strata World · the goo world layer: one shared goo state that the surface reads, the jelly beings sit in, eat and melt into,
// the Life reef grows from, and every touch writes. The reef is a B/S automaton fed by goo; eyes open on old tissue.
import * as THREE from 'three/webgpu';
import {makeGoo,gooSurface,LAW,HS,REEF_H,NSRC,LIFE_Q} from './goo.js';
import {makeJelly,jellyMesh} from './jelly.js';
import {bulbMaterial} from './materials.js';
import {eyeLife} from './life.js';
import {geoSphere,coastField,clamp,hexLin,rng} from './core.js';

const SPH=geoSphere(16,12);
export function buildGooLayer(R,S,renderer,quality,envTex){
 const N=quality.gooN||256,reef=S.kind==='reef';
 const rect=reef?[-11,-8,11,14]:[-18,-24,14,10],[x0,z0,x1,z1]=rect,dx=(x1-x0)/N,dz=(z1-z0)/N;
 const base=new Float32Array(N*N),init=new Float32Array(N*N),r=rng(R.seed*5+2);
 const F=reef?null:coastField(R);
 for(let j=0;j<N;j++)for(let i=0;i<N;i++){const x=x0+(i+.5)*dx,z=z0+(j+.5)*dz,k=j*N+i;let b=0,h=0;
  if(reef){for(const m of S.mounds){const d2=(x-m[0])**2+(z-m[1])**2;b+=m[3]*Math.exp(-d2/(m[2]*m[2]))}
   const rr=Math.hypot(x,(z-.7)*1.25);h=1.25*Math.exp(-(((rr-3.4)/.85)**2))*(.55+.45*Math.sin(Math.atan2(z-.7,x)*5+1.3))**2;
   for(const m of S.mounds)h+=.9*Math.exp(-((x-m[0])**2+(z-m[1])**2)/(m[2]*m[2]*.6))}
  else{const H=F.H(x,z),e=.15;b=Math.max(H,0);if(H>.4){const sl=Math.hypot(F.H(x+e,z)-F.H(x-e,z),F.H(x,z+e)-F.H(x,z-e))/(2*e);h=1.7*F.goo(x,z,H,sl)}
   h+=1.3*Math.exp(-(((x+6)**2+(z-5)**2)/5));}
  base[k]=b/HS;init[k]=h}
 // Life seeding: colonies of soup in thick goo, each its own lineage hue, plus gliders that surf the goo sea
 const LN=N/2,lifeInit=new Float32Array(LN*LN*4),setL=(i,j,hue)=>{if(i<1||j<1||i>LN-2||j>LN-2)return;const o=(j*LN+i)*4;lifeInit[o]=1;lifeInit[o+1]=0;lifeInit[o+2]=hue};
 const gAt=(i,j)=>init[Math.min(N-1,j*2)*N+Math.min(N-1,i*2)];
 for(let k=0,tries=0;k<(reef?9:7)&&tries<4000;tries++){const i=2+Math.floor(r()*(LN-4)),j=2+Math.floor(r()*(LN-4));if(gAt(i,j)<.7)continue;
  const hue=(k/(reef?9:7)+r()*.05)%1,rad=3+Math.floor(r()*3);for(let a=-rad;a<=rad;a++)for(let b=-rad;b<=rad;b++)if(a*a+b*b<=rad*rad&&r()<.5)setL(i+a,j+b,hue);k++}
 const GL=[[1,0],[2,1],[0,2],[1,2],[2,2]];
 for(let k=0,tries=0;k<(reef?10:6)&&tries<4000;tries++){const i=3+Math.floor(r()*(LN-6)),j=3+Math.floor(r()*(LN-6));if(gAt(i,j)<.5)continue;
  const fx=r()<.5?1:-1,fz=r()<.5?1:-1,hue=r();for(const [a,b] of GL)setL(i+a*fx,j+b*fz,hue);k++}
 // seeded cells pay for their tissue up front, so deaths only ever return goo that was eaten
 for(let j=0;j<LN;j++)for(let i=0;i<LN;i++)if(lifeInit[(j*LN+i)*4]>.5)for(const [a,b] of [[0,0],[1,0],[0,1],[1,1]]){const k=(j*2+b)*N+i*2+a;init[k]=Math.max(0,init[k]-LIFE_Q)}
 const flow=R.seeds.flow;
 const goo=makeGoo(renderer,{N,rect,base,init,rheo:flow,lifeInit,rule:R.life||'life'});
 const surface=gooSurface(goo,flow,quality);
 // CPU mirror of the state (refreshed by async readback) for picking, blob ground contact and branch detection
 const hb=init.slice(),wb=new Float32Array(N*N);let flip=null;
 const hvis=h=>LAW.HVIS*Math.tanh(h/LAW.HVIS);
 const sampleF=(arr,x,z)=>{const fx=clamp((x-x0)/dx-.5,0,N-1.001),fz=clamp((z-z0)/dz-.5,0,N-1.001),i=Math.floor(fx),j=Math.floor(fz),u=fx-i,v=fz-j,k=j*N+i;
  return arr[k]*(1-u)*(1-v)+arr[k+1]*u*(1-v)+arr[k+N]*(1-u)*v+arr[k+N+1]*u*v};
 const world={rect,foldC:reef?[0,0,.7]:[-3,0,-5],
  ground:(x,z)=>(sampleF(base,x,z)+sampleF(wb,x,z)*REEF_H+hvis(sampleF(hb,x,z)))*HS,
  gooAt:(x,z)=>sampleF(hb,x,z)};
 const jelly=makeJelly(world,R.palette,R.seeds.jelly,R.seeds.orb);
 const jmesh=jellyMesh(jelly,envTex);
 // eyes that open at reef branch nodes: a fixed pool of instanced eye-bulbs, placed as the reef forks
 const K=36,nodes=[],g=new THREE.InstancedBufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(SPH.P,3));g.setAttribute('normal',new THREE.BufferAttribute(SPH.P,3));g.setIndex(new THREE.BufferAttribute(SPH.I,1));
 const list=Array.from({length:K},(_,i)=>({p:[0,-50,0],s:0,sock:[0,.6,.8],kind:1,lag:r(),off:[(r()-.5)*2,(r()-.5)*2,(r()-.5)*2]}));
 const A0=new Float32Array(K*4),A1=new Float32Array(K*4),A2=new Float32Array(K*4),A3=new Float32Array(K*4),AC=new Float32Array(K*3),eyeCol=hexLin((R.palette.jelly||R.palette.bulb||['#9b2fe6'])[0]);
 list.forEach((b,i)=>{A1.set([0,.6,.8,2],i*4);A2.set([r()*10,0,1,.75],i*4);A3.set([.7,1,(r()-.5)*.8,0],i*4);AC.set(eyeCol,i*3)});
 const at=(n,a,s)=>{const x=new THREE.InstancedBufferAttribute(a,s);x.setUsage(THREE.DynamicDrawUsage);g.setAttribute(n,x);return x};
 const aB0=at('aB0',A0,4);at('aB1',A1,4);at('aB2',A2,4);at('aB3',A3,4);at('aCol',AC,3);g.instanceCount=K;
 const life=eyeLife(list);const eyeMesh=new THREE.Mesh(g,bulbMaterial(R.seeds.flow,life.gaze));eyeMesh.frustumCulled=false;eyeMesh.castShadow=quality.shadows;
 function placeEyes(time){for(let i=nodes.length-1;i>=0;i--)if(nodes[i].die>=0&&time-nodes[i].die>.7)nodes.splice(i,1);
  for(let i=nodes.length;i<K;i++)A0[i*4+3]=0;
  for(let i=0;i<nodes.length;i++){const n=nodes[i],grow=Math.min(1,(time-n.t)/1.4),shut=n.die>=0?Math.max(0,1-(time-n.die)/.7):1,s=n.s*(1-Math.pow(1-grow,3))*shut;
   const y=world.ground(n.x,n.z)+s*.55;A0.set([n.x,y,n.z,s],i*4);life.stat.value.array.set([n.x,y,n.z,list[i].lag],i*4)}
  aB0.needsUpdate=true;life.stat.value.needsUpdate=true}
 // readback: refresh the CPU mirror; the first one also tells us the GPU's row order
 function onReadback(px,time){const n=N*N;let dA=0,dB=0;
  if(flip===null){for(let j=0;j<N;j+=8)for(let i=0;i<N;i+=8){const a=px[(j*N+i)*4],b=px[((N-1-j)*N+i)*4],t=init[j*N+i];dA+=Math.abs(a-t);dB+=Math.abs(b-t)}flip=dB<dA}
  for(let j=0;j<N;j++){const sj=flip?N-1-j:j;for(let i=0;i<N;i++){const o=(sj*N+i)*4,k=j*N+i;hb[k]=px[o];wb[k]=px[o+3]}}
  // old tissue grows eyes: a cell alive 20+ generations (reef height maxed) inside a structure; the eye closes when its cell dies
  for(const n of nodes){if(n.die>=0)continue;const i=Math.floor((n.x-x0)/dx),j=Math.floor((n.z-z0)/dz);if(wb[j*N+i]<.25)n.die=time}
  if(nodes.length<K){for(let tries=0;tries<400&&nodes.length<K;tries++){const i=1+Math.floor(Math.random()*(N-2)),j=1+Math.floor(Math.random()*(N-2)),k=j*N+i;if(wb[k]<.99)continue;
   const c=(wb[k+1]>.5)+(wb[k-1]>.5)+(wb[k+N]>.5)+(wb[k-N]>.5)+(wb[k+N+1]>.5)+(wb[k-N-1]>.5)+(wb[k+N-1]>.5)+(wb[k-N+1]>.5);if(c<3)continue;
   const x=x0+(i+.5)*dx,z=z0+(j+.5)*dz;if(nodes.some(q=>Math.hypot(q.x-x,q.z-z)<.8))continue;nodes.push({x,z,t:time,die:-1,s:.14+.12*Math.random()})}}
  let mass=0;for(let k=0;k<n;k++)mass+=hb[k];return mass}
 // fractal fold: every touch echoes around the fold centre, k-fold, and down a 0.6 scale ladder
 function fold(x,z,k,depth){const c=world.foldC,out=[[x,z,1,1]];if(k<2&&depth<2)return out;const kk=Math.max(1,k);
  for(let d=0;d<Math.max(1,depth);d++){const s=Math.pow(.6,d);for(let j=0;j<kk;j++){if(d===0&&j===0)continue;const a=j/kk*Math.PI*2,ca=Math.cos(a),sa=Math.sin(a),px=(x-c[0])*s,pz=(z-c[2])*s;
   out.push([c[0]+px*ca-pz*sa,c[2]+px*sa+pz*ca,s,Math.pow(.72,d)*(j===0?1:.8)])}}return out}
 function writeSources(touches,foldK,foldD){let n=0;const s=1/goo.txl;
  for(const t of touches){for(const [x,z,sc,st] of fold(t.x,t.z,foldK,foldD)){if(n>=NSRC)break;const [tx,tz]=goo.toTex(x,z),a=goo.SRC.array[n],b=goo.SRC2.array[n];
   a.set(tx,tz,Math.max(1.5,t.r*sc*s),t.str*st);b.set(t.kind,t.vx*s*sc,t.vz*s*sc,0);n++}}
  for(;n<NSRC;n++)goo.SRC2.array[n].x=-1}
 function stats(){let reefN=0,gooN=0,mx=0,sum=0,all=0;for(let k=0;k<N*N;k++){all+=hb[k];if(wb[k]>.25)reefN++;if(hb[k]>.02){gooN++;sum+=hb[k]}mx=Math.max(mx,hb[k])}return {reefFrac:+(reefN/(N*N)).toFixed(4),cells:Math.round(reefN/4),gens:goo.gens,total:+(all+reefN*LIFE_Q).toFixed(1),gooFrac:+(gooN/(N*N)).toFixed(3),hMax:+mx.toFixed(2),hMean:+(sum/Math.max(gooN,1)).toFixed(3),flip}}
 return {stats,goo,surface,jelly,jmesh,eyeMesh,eyeLife:life,world,onReadback,placeEyes,writeSources,nodes,fold,flipKnown:()=>flip!==null,
  dispose(){goo.dispose();jelly.dataTex.dispose()}};
}
