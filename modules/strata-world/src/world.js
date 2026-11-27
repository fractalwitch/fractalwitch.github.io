// Strata World · scene assembly. The same pure layouts as the WebGL2 lab become Three.js meshes in five strata groups.
import * as THREE from 'three/webgpu';
import {geoSphere,geoHeart,geoSpire,geoArch,geoStrand,geoPolarGrid,buildReef,buildCoast,hexLin,vadd,vsub,rng,palCol} from './core.js';
import {U,bulbMaterial,strandMaterial,heartMaterial,pearlMaterial,coralMaterial,terrainMaterial,poolMaterial,seaMaterial,bubbleMaterial,cardMaterial,sparkMaterial,skyMaterial} from './materials.js';
import {eyeLife,bubbleLife,L} from './life.js';

const MESH={sphHi:geoSphere(40,28),sphLo:geoSphere(16,12),heart:geoHeart(),spire:geoSpire(),arch:geoArch(),strand:geoStrand(),bub:geoSphere(28,18),
 pool:geoPolarGrid(60,120,192,1.75),ocean:geoPolarGrid(320,128,208,2.3)};
const ibg=(P,I,extra={})=>{const g=new THREE.InstancedBufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(P,3));if(extra.N)g.setAttribute('normal',new THREE.BufferAttribute(extra.N,3));else g.setAttribute('normal',new THREE.BufferAttribute(P,3));g.setIndex(new THREE.BufferAttribute(I,1));return g};
const inst=(g,name,arr,size)=>g.setAttribute(name,new THREE.InstancedBufferAttribute(arr,size));
const pack=(list,f,size)=>{const a=new Float32Array(list.length*size);list.forEach((x,i)=>a.set(f(x,i),i*size));return a};

export function buildWorld(R,ctx){
 const {quality}=ctx,S=R.layout==='coast'?buildCoast(R):buildReef(R),P=R.palette,SD=R.seeds;
 const root=new THREE.Group(),strata=[0,1,2,3,4].map(()=>new THREE.Group());strata.forEach(g=>root.add(g));
 const mats=[],computes=[],bodies=[];let triCount=0;
 const add=(layer,mesh,{cast=true,recv=true}={})=>{mesh.castShadow=cast&&quality.shadows;mesh.receiveShadow=recv&&quality.shadows;mesh.frustumCulled=false;strata[layer].add(mesh);if(mesh.material)mats.push(mesh.material);return mesh};
 // ---- L0 sky
 const sky=new THREE.Mesh(new THREE.SphereGeometry(450,48,24),skyMaterial(P));sky.renderOrder=-10;add(0,sky,{cast:false,recv:false});
 // ---- L3 bulbs: one InstancedBufferGeometry per group, gaze from the life compute buffer
 const r=rng(R.seed*13+1);
 const bulbGroup=(list,role,hi,opts={})=>{if(!list.length)return;const m=hi?MESH.sphHi:MESH.sphLo,g=ibg(m.P,m.I);
  list.forEach(b=>{b.lag=r();b.off=[(r()-.5)*2,(r()-.5)*2,(r()-.5)*2]});
  inst(g,'aB0',pack(list,b=>[...b.p,b.s],4),4);inst(g,'aB1',pack(list,b=>[...b.sock,b.kind],4),4);inst(g,'aB2',pack(list,b=>[r()*10,b.drip,b.ao,b.squash||1],4),4);
  inst(g,'aB3',pack(list,b=>[b.eye,b.kind===2?1:0,b.iris,0],4),4);inst(g,'aCol',pack(list,b=>b.col,3),3);g.instanceCount=list.length;
  const life=eyeLife(list);computes.push(life.compute);
  const mesh=add(3,new THREE.Mesh(g,bulbMaterial(SD[role],life.gaze,opts)));mesh.userData.role=role;triCount+=m.I.length/3*list.length;
  list.forEach(b=>bodies.push({p:b.p,s:b.s*(b.squash?Math.max(.7,b.squash):1),kind:b.kind}))};
 if(S.kind==='reef'){bulbGroup(S.bulbs,'skin',1);bulbGroup(S.pool,'skin',1);bulbGroup(S.nubs,'nub',0)}
 else{bulbGroup(S.bulbs,'blob',1);bulbGroup(S.foam,'foam',1,{pores:true});bulbGroup(S.pool,'eyeskin',1,{pores:true});bulbGroup(S.nubs,'ball',0)}
 // ---- L3 strands
 if(S.tubes.length){const st=MESH.strand,n=st.A.length/4,g=new THREE.InstancedBufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(n*3),3));g.setAttribute('normal',new THREE.BufferAttribute(new Float32Array(n*3).fill(1),3));
  g.setAttribute('aProf',new THREE.BufferAttribute(st.A,4));g.setIndex(new THREE.BufferAttribute(st.I,1));
  inst(g,'aT0',pack(S.tubes,t=>[...t.a,t.ra],4),4);inst(g,'aT1',pack(S.tubes,t=>[...t.b,t.rb],4),4);inst(g,'aT2',pack(S.tubes,t=>[t.taper,t.phase,t.flow,t.sag],4),4);inst(g,'aCol',pack(S.tubes,t=>t.col,3),3);
  g.instanceCount=S.tubes.length;add(3,new THREE.Mesh(g,strandMaterial(SD.drip)));triCount+=st.I.length/3*S.tubes.length}
 // ---- L3 crystal hearts (transmission when quality allows)
 if(S.hearts.length){const h=MESH.heart,g=ibg(h.P,h.I,{N:h.N});inst(g,'aI0',pack(S.hearts,x=>[...x.p,x.s],4),4);inst(g,'aI1',pack(S.hearts,x=>[x.yaw,x.ys,x.spin,x.ph],4),4);inst(g,'aCol',pack(S.hearts,x=>x.col,3),3);
  g.instanceCount=S.hearts.length;add(3,new THREE.Mesh(g,heartMaterial(SD.heart,{transmission:quality.transmission})),{cast:true,recv:false});triCount+=h.I.length/3*S.hearts.length}
 // ---- L3 spires and arches packed into one BatchedMesh (one draw, per-instance culling and colour)
 if(S.spires.length||S.arches.length){const geo=m=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(m.P,3));g.setAttribute('normal',new THREE.BufferAttribute(m.N,3));g.setAttribute('part',new THREE.BufferAttribute(m.A,1));g.setIndex(new THREE.BufferAttribute(m.I,1));return g};
  const gs=geo(MESH.spire),ga=geo(MESH.arch),n=S.spires.length+S.arches.length;
  const bm=new THREE.BatchedMesh(n,gs.attributes.position.count+ga.attributes.position.count,gs.index.count+ga.index.count,pearlMaterial(SD.spire));
  const ids=bm.addGeometry(gs),ida=bm.addGeometry(ga),M=new THREE.Matrix4(),Q=new THREE.Quaternion(),Y=new THREE.Vector3(0,1,0),c=new THREE.Color();
  const put=(gid,x)=>{const k=bm.addInstance(gid);M.compose(new THREE.Vector3(...x.p),Q.setFromAxisAngle(Y,x.yaw),new THREE.Vector3(x.s,x.s*x.ys,x.s));bm.setMatrixAt(k,M);bm.setColorAt(k,c.setRGB(...x.col,THREE.LinearSRGBColorSpace))};
  S.spires.forEach(x=>put(ids,x));S.arches.forEach(x=>put(ida,x));add(3,bm);triCount+=S.spires.length*MESH.spire.I.length/3+S.arches.length*MESH.arch.I.length/3}
 // ---- L3 coral or L1 terrain
 if(S.kind==='reef'){const c=S.coral,g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(c.P,3));g.setAttribute('normal',new THREE.BufferAttribute(c.N,3));g.setAttribute('aX',new THREE.BufferAttribute(c.X,4));g.setIndex(new THREE.BufferAttribute(c.I,1));
  add(3,new THREE.Mesh(g,coralMaterial(SD.coral)));triCount+=c.I.length/3}
 else{const t=S.terrain,g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(t.P,3));g.setAttribute('normal',new THREE.BufferAttribute(t.N,3));g.setAttribute('aX',new THREE.BufferAttribute(t.X,4));g.setIndex(new THREE.BufferAttribute(t.I,1));
  add(1,new THREE.Mesh(g,terrainMaterial(SD.rock,SD.goo,[0,1,2].map(i=>P.goo[i%P.goo.length]),P.sand)));triCount+=t.I.length/3}
 // ---- L2 liquid ground
 {const wg=S.kind==='reef'?MESH.pool:MESH.ocean,n=wg.P.length/2,pos=new Float32Array(n*3),nor=new Float32Array(n*3);for(let i=0;i<n;i++){pos[i*3]=wg.P[i*2];pos[i*3+2]=wg.P[i*2+1];nor[i*3+1]=1}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('normal',new THREE.BufferAttribute(nor,3));g.setIndex(new THREE.BufferAttribute(wg.I,1));
  let mat;if(S.kind==='reef')mat=poolMaterial(SD.pool,P.poolSkin||'#7a1fc0');else{const ht=new THREE.DataTexture(S.htex,S.HT,S.HT,THREE.RedFormat,THREE.FloatType);ht.magFilter=ht.minFilter=THREE.LinearFilter;ht.needsUpdate=true;mat=seaMaterial(SD.sea,ht,S.hb)}
  add(2,new THREE.Mesh(g,mat),{cast:false});triCount+=wg.I.length/3}
 for(let i=0;i<16;i++)U.mounds.array[i].set(...(S.mounds[i]||[0,0,0,0]));
 // ---- L1 impostor cards from the canvas atlas
 const camP=vadd(R.camera.target,[0,0,R.camera.dist]);
 const cards=(list,additive)=>{if(!list.length)return;list=list.slice().sort((a,b)=>Math.hypot(...vsub(b.p,camP))-Math.hypot(...vsub(a.p,camP)));
  const pl=new THREE.PlaneGeometry(1,1,1,1),g=new THREE.InstancedBufferGeometry();g.index=pl.index;g.setAttribute('position',pl.attributes.position);g.setAttribute('uv',pl.attributes.uv);g.setAttribute('normal',pl.attributes.normal);
  inst(g,'aC0',pack(list,c=>[...c.p,c.s],4),4);inst(g,'aC1',pack(list,c=>[c.rect,c.aspect,c.mode,c.alpha],4),4);inst(g,'aCol',pack(list,c=>c.col,3),3);g.instanceCount=list.length;
  const m=add(1,new THREE.Mesh(g,cardMaterial(ctx.atlas,additive)),{cast:false,recv:false});m.renderOrder=additive?2:1};
 cards(S.cardsAlpha,false);cards(S.cardsAdd,true);
 // ---- L4 bubbles (compute) and sparkles
 const nb=Math.min(40,R.counts.bubbles|0),bl=bubbleLife(40,(P.bubble||['#ffffff']).map(h=>new THREE.Color(h)));computes.push(bl.compute);
 {const b=MESH.bub,g=ibg(b.P,b.I);g.instanceCount=nb;const m=add(4,new THREE.Mesh(g,bubbleMaterial(SD.bubble,bl.buf,bl.col,{transmission:quality.transmission})),{cast:false,recv:false});m.renderOrder=3;m.userData.bubbles=true}
 {const reef=S.kind==='reef';L.areaC.value.set(...(reef?[0,0,1.5]:[2,0,-6]));L.areaS.value.set(...(reef?[11,7,5]:[24,9,16]));L.top.value=reef?8.5:11;L.rMin.value=reef?.18:.25;L.rMax.value=reef?.5:.75}
 {const N=128+600,pl=new THREE.PlaneGeometry(1,1),g=new THREE.InstancedBufferGeometry();g.index=pl.index;g.setAttribute('position',pl.attributes.position);g.setAttribute('uv',pl.attributes.uv);g.setAttribute('normal',pl.attributes.normal);
  const sr=rng(99),s=new Float32Array(N*4);for(let i=0;i<s.length;i++)s[i]=sr();inst(g,'aSeed',s,4);g.instanceCount=128+Math.min(600,R.counts.sparkles|0);
  const m=add(4,new THREE.Mesh(g,sparkMaterial(N)),{cast:false,recv:false});m.renderOrder=4;m.userData.sparks=true;const u=m.material.userData.u;
  u.boxC.value.set(...R.spark.c);u.boxS.value.set(...R.spark.s);u.count.value=Math.min(600,R.counts.sparkles|0);u.cA.value.set(P.spA).multiplyScalar(1);u.cB.value.set(P.spB)}
 return {S,root,strata,mats,computes,bodies,bubbleLife:bl,nb,triCount,sky};
}

// environment cube: the sky plus two softbox panels, so physical reflections read as candy
export function makeEnv(renderer,skyMat,R){
 const envScene=new THREE.Scene(),sky=new THREE.Mesh(new THREE.SphereGeometry(100,48,24),skyMat);envScene.add(sky);
 const L=R.light,P=R.palette,reef=R.layout==='reef';
 const box=(dir,w,h,col,k)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicNodeMaterial({color:new THREE.Color(col).multiplyScalar(k),side:THREE.DoubleSide}));const d=new THREE.Vector3(...dir).normalize();m.position.copy(d.multiplyScalar(60));m.lookAt(0,0,0);envScene.add(m)};
 if(reef)box(L.sun,38,24,P.sun,2.6*L.key);box(L.fill,46,30,P.fill,1.4*L.fillK);
 const rt=new THREE.CubeRenderTarget(256,{type:THREE.HalfFloatType,generateMipmaps:true,minFilter:THREE.LinearMipmapLinearFilter});
 const cc=new THREE.CubeCamera(.5,500,rt);envScene.add(cc);cc.update(renderer,envScene);
 return rt;
}
