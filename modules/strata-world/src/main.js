// Strata World · Three.js WebGPU edition: renderer, lights, worlds, life, input, dev bench
import * as THREE from 'three/webgpu';
import {SEED_LIB,SEED_KEYS,WORLDS} from './recipes.js';
import {hueRot,clamp,norm,vsub,vadd,vscl,vdot} from './core.js';
import {U,applySeed} from './materials.js';
import {L} from './life.js';
import {buildWorld,makeEnv} from './world.js';
import {makePost} from './post.js';
import {bakeAtlas} from './atlas.js';

const QS=new URLSearchParams(location.search),coarse=matchMedia('(pointer: coarse)').matches,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const $=id=>document.getElementById(id),errBox=$('err');
const quality={shadows:!QS.has('noshadow'),transmission:!QS.has('notrans')&&!coarse,gtao:!QS.has('noao')&&!coarse,fxaa:true};
// ---------- recipes
const dm=(a,b)=>{const o=JSON.parse(JSON.stringify(a||{}));for(const k in b){const v=b[k];if(v&&typeof v==='object'&&!Array.isArray(v)&&o[k]&&typeof o[k]==='object'&&!Array.isArray(o[k]))o[k]=Object.assign({},o[k],JSON.parse(JSON.stringify(v)));else o[k]=JSON.parse(JSON.stringify(v))}return o};
function finish(o){const seeds={};for(const role in o.seeds){const v=o.seeds[role];seeds[role]=Object.assign(typeof v==='string'?Object.assign({name:v},SEED_LIB[v]):Object.assign({},v),(o.seedOver||{})[role]||{})}o.seeds=seeds;delete o.seedOver;delete o.base;return o}
function resolveWorld(k){const W=WORLDS[k];const o=W.base?dm(WORLDS[W.base],W):dm({},W);if(W.base)o.seeds=JSON.parse(JSON.stringify(W.seeds));return finish(o)}
let worldKey=WORLDS[QS.get('world')]?QS.get('world'):'reef',R=resolveWorld(worldKey);

// ---------- renderer
const renderer=new THREE.WebGPURenderer({antialias:false,forceWebGL:QS.has('gl')});
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
let scale=QS.has('scale')?+QS.get('scale'):(coarse?.7:1);
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2)*scale);renderer.setSize(innerWidth,innerHeight);
$('stagewrap').append(renderer.domElement);renderer.domElement.id='stage';renderer.domElement.tabIndex=0;
renderer.domElement.setAttribute('aria-label','A layered candy world full of eyes. Drag to look around, tap to poke an eye, pop a bubble or ripple the liquid, hold to melt it and blow bubbles, double-tap for the next world.');
try{await renderer.init()}catch(e){errBox.textContent='Could not start WebGPU or WebGL2: '+e.message;throw e}
const backend=renderer.backend.isWebGPUBackend?'WebGPU':'WebGL2';
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(50,innerWidth/innerHeight,.1,900);
const sun=new THREE.DirectionalLight(0xffffff,3),fill=new THREE.DirectionalLight(0xffffff,1),hemi=new THREE.HemisphereLight(0xffffff,0x000000,.4);
sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0004;sun.shadow.normalBias=.02;sun.shadow.radius=4;scene.add(sun,sun.target,fill,hemi);
const atlas=new THREE.CanvasTexture(bakeAtlas());atlas.colorSpace=THREE.SRGBColorSpace;atlas.generateMipmaps=true;atlas.minFilter=THREE.LinearMipmapLinearFilter;
let post=makePost(renderer,scene,camera,quality);

// ---------- world lifecycle
let W=null,envRT=null,lastBuild=0;
function dispose(o){o.traverse(x=>{if(x.geometry)x.geometry.dispose();if(x.material)x.material.dispose()})}
function applyPalette(){const P=R.palette,Lt=R.light;
 U.irisA.value.set(P.irisA);U.irisB.value.set(P.irisB);U.sclera.value.set(P.sclera);U.hole.value.set(P.hole);U.pulseCol.value.set(P.pulse);
 U.sun.value.set(...norm(Lt.sun));U.drip.value=R.motion.drip;U.wob.value=R.motion.wobble*(reduced?.4:1);U.flow.value=R.motion.flow;U.glit.value=R.motion.glit;L.stare.value=R.motion.stare;
 const su=W.sky.material.userData.u;su.a.value.set(P.skyA);su.b.value.set(P.skyB);su.c.value.set(P.skyC);su.sunC.value.set(P.sun);su.fill.value.set(P.fill);su.world.value=R.layout==='coast'?1:0;su.stars.value=R.layout==='coast'?0:1;
 const reef=R.layout==='reef',ctr=reef?new THREE.Vector3(0,2,0):new THREE.Vector3(-2,0,-12),ext=reef?9:34;
 sun.color.set(P.sun);sun.intensity=Lt.key*(reef?2.2:2.4);sun.target.position.copy(ctr);sun.position.copy(ctr).add(new THREE.Vector3(...norm(Lt.sun)).multiplyScalar(60));
 Object.assign(sun.shadow.camera,{left:-ext,right:ext,top:ext,bottom:-ext,near:1,far:140});sun.shadow.camera.updateProjectionMatrix();
 fill.color.set(P.fill);fill.intensity=Lt.fillK*(reef?1.1:1.6);fill.position.copy(ctr).add(new THREE.Vector3(...norm(Lt.fill)).multiplyScalar(40));fill.target.position.copy(ctr);
 hemi.color.set(P.amb0);hemi.groundColor.set(P.amb1);hemi.intensity=reef?.6:.5;
 scene.fog=null;renderer.toneMappingExposure=R.post.expo;
 post.K.bloom.value=R.post.bloom;post.K.ca.value=R.post.ca*.6;post.K.vig.value=R.post.vig;post.K.grain.value=R.post.grain;post.bloomNode.threshold.value=R.post.thresh*.9;post.K.sat.value=R.post.sat;post.bloomNode.radius.value=.5;
 if(envRT)envRT.dispose();envRT=makeEnv(renderer,W.sky.material,R);scene.environment=envRT.texture;scene.environmentIntensity=reef?.75:.55}
function build(){const t0=performance.now();if(W){scene.remove(W.root);dispose(W.root)}
 W=buildWorld(R,{quality,atlas});scene.add(W.root);applyPalette();resetCam();lastBuild=performance.now()-t0;LAYERS.forEach((v,i)=>W.strata[i].visible=!!v);bubPos=null}
// ---------- camera: snowglobe orbit with inertia, idle sway, front clamp, portrait widening
const cam={yaw:0,pitch:.1,dist:12,gy:0,gp:.1,vy:0,vp:0,t:[0,2,0],tiltY:0,tiltP:0};
function resetCam(){const C=R.camera;cam.gy=cam.yaw=C.yaw;cam.gp=cam.pitch=C.pitch;cam.dist=C.dist;cam.t=C.target.slice()}
function camEye(){const portrait=wrap.clientWidth/Math.max(1,wrap.clientHeight)<.8,Y=cam.yaw+cam.tiltY,Pt=clamp(cam.pitch+cam.tiltP,-.05,1.2),d=cam.dist*(portrait?1.18:1);return [cam.t[0]+d*Math.cos(Pt)*Math.sin(Y),cam.t[1]+d*Math.sin(Pt),cam.t[2]+d*Math.cos(Pt)*Math.cos(Y)]}
// ---------- life on the CPU side: moods, look target, pulses, ripples (the per-eye work runs in compute)
let time=0,mood='CURIOUS',lastTouch=0,lastPoke=-9,lastPop=-9,melt=0,holding=null,ptrSeen=-9,ptrTarget=[0,0,0],sacc=[0,0,0],nextSacc=1,lookT=[0,2,12],pulseI=0,ripI=0,burstI=0,bubPos=null,bubReading=false;
const moodLid={CURIOUS:1,STARTLED:1.15,DELIGHTED:.55,MELTING:.85,DREAMING:.42};
function setMood(m){if(m!==mood){mood=m;$('mood').textContent='MOOD · '+m}}
function pulseAt(p){U.pulses.array[pulseI].set(...p,time);pulseI=(pulseI+1)%6}
function burstAt(p){const s=sparks();if(s){s.material.userData.u.bursts.array[burstI].set(...p,time);burstI=(burstI+1)%4}}
function rippleAt(p,a=.18){U.rips.array[ripI].set(p[0],p[2],a,time);ripI=(ripI+1)%8}
const sparks=()=>W&&W.strata[4].children.find(m=>m.userData.sparks),bubMesh=()=>W&&W.strata[4].children.find(m=>m.userData.bubbles);
function poke(b,hit){lastPoke=time;U.poke.value.set(...b.p,time);pulseAt(hit||b.p);burstAt(hit||b.p)}
function popBubble(i,p){L.popI.value=i;setTimeout(()=>{L.popI.value=-1},60);burstAt(p);pulseAt(p);lastPop=time;U.pop.value=time}
function rayAt(px,py){const r=renderer.domElement.getBoundingClientRect(),v=new THREE.Vector3((px-r.left)/r.width*2-1,1-(py-r.top)/r.height*2,.5).unproject(camera);return norm([v.x-camera.position.x,v.y-camera.position.y,v.z-camera.position.z])}
function hitSphere(o,d,c,r){const oc=vsub(o,c),b=vdot(oc,d),q=vdot(oc,oc)-r*r,h=b*b-q;if(h<0)return 1e9;const t=-b-Math.sqrt(h);return t>0?t:1e9}
function pick(px,py){const o=camera.position.toArray(),d=rayAt(px,py);let best={t:1e9};
 if(bubPos)for(let i=0;i<W.nb;i++){const t=hitSphere(o,d,[bubPos[i*4],bubPos[i*4+1],bubPos[i*4+2]],bubPos[i*4+3]*1.2+.05);if(t<best.t)best={t,type:'bubble',i}}
 for(const b of W.bodies){const t=hitSphere(o,d,b.p,b.s);if(t<best.t)best={t,type:'body',b}}
 for(const h of W.S.hearts){const t=hitSphere(o,d,h.p,h.s*1.3);if(t<best.t)best={t,type:'heart',h}}
 if(d[1]<-1e-3){const t=-o[1]/d[1];if(t<best.t&&t<200)best={t,type:'water'}}
 best.d=d;best.p=vadd(o,vscl(d,Math.min(best.t,60)));return best}
function tap(px,py){const h=pick(px,py);
 if(h.type==='bubble')popBubble(h.i,h.p);else if(h.type==='body')poke(h.b,h.p);else if(h.type==='heart'){pulseAt(h.h.p);burstAt(h.h.p);lastPop=time;U.pop.value=time}
 else if(h.type==='water'){rippleAt(h.p);pulseAt(h.p);burstAt(vadd(h.p,[0,.2,0]))}else pulseAt(W.S.C)}
// ---------- input
const cv=renderer.domElement,ptrs=new Map();let lastTap=0,pinch=null;
cv.addEventListener('pointerdown',e=>{cv.focus({preventScroll:true});try{cv.setPointerCapture(e.pointerId)}catch(_){}
 ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY,x0:e.clientX,y0:e.clientY,t0:performance.now(),moved:false});lastTouch=time;ptrSeen=time;ptrTarget=pick(e.clientX,e.clientY).p;
 holding=ptrs.size===1?{id:e.pointerId,t0:time,on:false,at:null}:null;
 if(ptrs.size===2){const [a,b]=[...ptrs.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y),mx:(a.x+b.x)/2,my:(a.y+b.y)/2}}});
cv.addEventListener('pointermove',e=>{const h=pick(e.clientX,e.clientY);ptrTarget=vadd(camera.position.toArray(),vscl(h.d,Math.min(h.t,Math.hypot(...vsub(W.S.C,camera.position.toArray()))*.9)));ptrSeen=time;
 const p=ptrs.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;lastTouch=time;
 if(Math.hypot(p.x-p.x0,p.y-p.y0)>9){p.moved=true;if(holding&&!holding.on)holding=null}
 if(ptrs.size>=2&&pinch){const [a,b]=[...ptrs.values()],d=Math.hypot(a.x-b.x,a.y-b.y),mx=(a.x+b.x)/2,my=(a.y+b.y)/2;cam.gy-=(mx-pinch.mx)*.004;cam.gp=clamp(cam.gp+(my-pinch.my)*.003,-.02,.8);R.camera.dist=clamp(R.camera.dist*pinch.d/Math.max(d,1),5,45);pinch={d,mx,my};return}
 if(p.moved){cam.vy=-dx*.0045;cam.vp=dy*.0032;cam.gy+=cam.vy;cam.gp=clamp(cam.gp+cam.vp,-.02,.8)}
 if(holding&&holding.on)holding.at=h.p});
function endPtr(e){const p=ptrs.get(e.pointerId);if(!p)return;ptrs.delete(e.pointerId);if(ptrs.size<2)pinch=null;
 if(!p.moved&&e.type==='pointerup'){if(holding&&holding.on){lastPop=time;U.pop.value=time}else if(performance.now()-p.t0<350){const now=performance.now();if(now-lastTap<330){nextWorld();lastTap=0}else{tap(e.clientX,e.clientY);lastTap=now}}}
 holding=null}
cv.addEventListener('pointerup',endPtr);cv.addEventListener('pointercancel',endPtr);cv.addEventListener('pointerleave',()=>{ptrSeen=-9});cv.addEventListener('contextmenu',e=>e.preventDefault());
cv.addEventListener('wheel',e=>{e.preventDefault();R.camera.dist=clamp(R.camera.dist*Math.exp(e.deltaY*.0012),5,45)},{passive:false});
addEventListener('keydown',e=>{if(e.target.closest&&e.target.closest('#bench'))return;const k=e.key.toLowerCase();if(k==='n')nextWorld();if(k==='m')mutate()});
const wrap=$('stagewrap');const fit=()=>{renderer.setSize(Math.max(2,wrap.clientWidth),Math.max(2,wrap.clientHeight))};addEventListener('resize',fit);new ResizeObserver(fit).observe(wrap);
// ---------- transitions
let fade=0,fadeDir=0,pending=null;
function nextWorld(){const ks=Object.keys(WORLDS);goWorld(ks[(ks.indexOf(worldKey)+1)%ks.length])}
function goWorld(k){pending=()=>{worldKey=k;R=resolveWorld(k);build();buildBench()};fadeDir=1}
function applyRecipe(o){pending=()=>{R=finish(o);build();buildBench()};fadeDir=1}
function rebuildQuality(){post=makePost(renderer,scene,camera,quality);build();buildBench()}
// ---------- frame
let LAYERS=[1,1,1,1,1],last=performance.now(),ema=16,govT=0,frameN=0;
async function frame(){
 const now=performance.now(),dt=Math.min(.05,(now-last)/1000);last=now;time+=dt*(reduced?.5:1);frameN++;ema+=(dt*1000-ema)*.05;govT+=dt;
 if(!QS.has('scale')&&govT>1){govT=0;let ns=scale;if(ema>28&&scale>.5)ns=Math.max(.5,scale-.1);else if(ema<15&&scale<1)ns=Math.min(1,scale+.05);if(ns!==scale){scale=ns;renderer.setPixelRatio(Math.min(devicePixelRatio||1,2)*scale)}}
 if(fadeDir){fade=clamp(fade+fadeDir*dt/(fadeDir>0?.3:.6),0,1);if(fade>=1&&pending){pending();pending=null;fadeDir=-1}if(fade<=0&&fadeDir<0)fadeDir=0}
 if(!ptrs.size){cam.gy+=cam.vy;cam.gp=clamp(cam.gp+cam.vp,-.02,.8);cam.vy*=.92;cam.vp*=.92}
 const lim=R.layout==='reef'?1.25:.95;cam.gy=clamp(cam.gy,R.camera.yaw-lim,R.camera.yaw+lim);
 const idle=time-lastTouch,sway=idle>5&&!reduced?Math.sin(time*.07)*.16*Math.min(1,(idle-5)/4):0;
 cam.yaw+=(cam.gy+sway-cam.yaw)*(1-Math.exp(-dt*5));cam.pitch+=(cam.gp-cam.pitch)*(1-Math.exp(-dt*5));cam.dist+=(R.camera.dist-cam.dist)*(1-Math.exp(-dt*4));
 const asp=wrap.clientWidth/Math.max(1,wrap.clientHeight),fovR=Math.min(1.3,Math.max(R.camera.fov,asp<.8?2*Math.atan(Math.tan(R.camera.fov/2)*1.05/asp)*.82:0));
 camera.fov=fovR*180/Math.PI;camera.aspect=asp;camera.position.set(...camEye());camera.lookAt(...cam.t);camera.updateProjectionMatrix();
 // moods and the shared look target
 if(holding&&!holding.on&&time-holding.t0>.45){holding.on=true;holding.at=ptrTarget}
 if(holding&&holding.on)setMood('MELTING');else if(time-lastPoke<1.2)setMood('STARTLED');else if(time-lastPop<2.2)setMood('DELIGHTED');else if(idle>14)setMood('DREAMING');else setMood('CURIOUS');
 melt=holding&&holding.on?Math.min(1,melt+dt/1.5):Math.max(0,melt-dt*.5);
 if(time>nextSacc){nextSacc=time+1.4+Math.random()*2.4;const k=(1-R.motion.stare)*4+.6;sacc=[(Math.random()-.5)*k*2,(Math.random()-.5)*k,(Math.random()-.5)*k]}
 let T=time-ptrSeen<2.5?ptrTarget:vadd(camera.position.toArray(),sacc);if(mood==='DREAMING')T=vadd(W.S.C,[Math.sin(time*.2)*8,9,6]);
 for(let k=0;k<3;k++)lookT[k]+=(T[k]-lookT[k])*Math.min(1,dt*6);
 U.t.value=time;U.look.value.set(...lookT);U.melt.value=melt;U.startle.value=Math.max(0,1-(time-lastPoke)/1.2);L.dt.value=dt;L.moodLid.value=moodLid[mood];
 L.hold.value.set(...(holding&&holding.on&&holding.at?holding.at:[0,0,0]),holding&&holding.on?1:0);
 const bm=bubMesh();if(bm)bm.geometry.instanceCount=W.nb=Math.min(40,R.counts.bubbles|0);
 const sp=sparks();if(sp){const u=sp.material.userData.u,Rw=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0),Uw=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,1);u.camR.value.copy(Rw);u.camU.value.copy(Uw);u.count.value=Math.min(600,R.counts.sparkles|0);sp.geometry.instanceCount=128+(R.counts.sparkles|0)}
 for(const m of W.strata[1].children)if(m.material&&m.material.userData.cam){const c=m.material.userData.cam;c.camR.value.setFromMatrixColumn(camera.matrixWorld,0);c.camU.value.setFromMatrixColumn(camera.matrixWorld,1)}
 renderer.toneMappingExposure=R.post.expo*(1+fade*1.5);
 renderer.compute(W.computes);
 post.pp.render();
 if(!bubReading&&frameN%20===0){bubReading=true;renderer.getArrayBufferAsync(W.bubbleLife.buf.value).then(b=>{bubPos=new Float32Array(b)}).catch(()=>{}).finally(()=>{bubReading=false})}
 if(frameN%15===0&&document.documentElement.dataset.mode==='dev'){const inf=renderer.info.render;
  $('hud').textContent=`${(1000/ema).toFixed(0)} fps · ${ema.toFixed(1)} ms · ${backend} · scale ${scale.toFixed(2)}\n${inf.drawCalls} draws · ${(inf.triangles/1000).toFixed(0)}k tris · ${W.computes.length} compute passes · ${W.bodies.filter(b=>b.kind>0).length} eyes on GPU\nshadows ${quality.shadows?'on':'off'} · transmission ${quality.transmission?'on':'off'} · GTAO ${quality.gtao?'on':'off'} · build ${lastBuild.toFixed(0)} ms · ${mood}`}
}
// ---------- dev bench
const bench=$('bench'),devBtn=$('devbtn');
function setMode(dev){document.documentElement.dataset.mode=dev?'dev':'toy';devBtn.setAttribute('aria-pressed',String(dev));devBtn.textContent=dev?'DEV MODE · ON':'DEV MODE';requestAnimationFrame(()=>dispatchEvent(new Event('resize')))}
devBtn.onclick=()=>setMode(document.documentElement.dataset.mode!=='dev');setMode(location.hash==='#dev'||QS.has('dev'));
function h(tag,attrs,...kids){const e=document.createElement(tag);for(const k in attrs||{}){if(k.startsWith('on'))e[k]=attrs[k];else e.setAttribute(k,attrs[k])}for(const c of kids)e.append(c);return e}
function slider(id,label,min,max,step,val,on){const o=h('output',{for:id},(+val).toFixed(step<.01?3:2)),i=h('input',{type:'range',id,min,max,step,value:val});i.oninput=()=>{o.textContent=(+i.value).toFixed(step<.01?3:2);on(+i.value)};return h('div',{class:'row'},h('label',{for:id},label),o,i)}
function colour(id,label,val,on){const i=h('input',{type:'color',id,value:val});i.oninput=()=>on(i.value);return h('div',{class:'row'},h('label',{for:id},label),i)}
const tog=(label,checked,on)=>{const c=h('input',{type:'checkbox'});c.checked=checked;c.onchange=()=>on(c.checked);return h('label',{class:'tog'},c,label)};
let seedRole=null;
const KN=[['post','bloom','Bloom',0,2.5,.01,v=>post.K.bloom.value=v],['post','thresh','Bloom threshold',.3,3,.01,v=>post.bloomNode.threshold.value=v*.9],['post','sat','Saturation',0,1.8,.01,v=>post.K.sat.value=v],['post','ca','Chromatic aberration',0,3,.01,v=>post.K.ca.value=v*.6],
 ['post','expo','Exposure',.4,2,.01],['post','vig','Vignette',0,1,.01,v=>post.K.vig.value=v],['post','grain','Grain',0,.12,.005,v=>post.K.grain.value=v],
 ['motion','drip','Drip length',0,2.5,.01,v=>U.drip.value=v],['motion','wobble','Goo wobble',0,2.5,.01,v=>U.wob.value=v],['motion','flow','Liquid flow',0,3,.01,v=>U.flow.value=v],['motion','stare','Stare at viewer',0,1,.01,v=>L.stare.value=v],['motion','glit','Glitter',0,3,.01,v=>U.glit.value=v],
 ['light','key','Sun',0,3,.01,v=>sun.intensity=v*2.3],['light','fillK','Fill',0,3,.01,v=>fill.intensity=v*1.3],
 ['camera','dist','Camera distance',5,45,.1],['camera','fov','Field of view',.4,1.4,.01],['counts','sparkles','Sparkles',0,600,10],['counts','bubbles','Bubbles',0,40,1],['counts','bulbs','Eye-bulbs (rebuild)',10,200,1,null,1]];
let rebuildTimer=0;
function buildBench(){bench.innerHTML='';
 bench.append(h('h1',{},'Strata World · WebGPU'),h('p',{},`Study 11, rebuilt in Three.js r186 with TSL node materials, GPU compute life, real shadows, transmission, GTAO and node post. ${R.name}. Running on ${backend}.`));
 bench.append(h('h2',{},'Worlds'));const wc=h('div',{class:'chips'});for(const k in WORLDS)wc.append(h('button',{class:'chip',type:'button','aria-pressed':String(k===worldKey&&R.name===WORLDS[k].name),onclick:()=>goWorld(k)},WORLDS[k].name));
 wc.append(h('button',{class:'chip',type:'button',onclick:()=>mutate()},'Mutate'));bench.append(wc);
 bench.append(h('h2',{},'Strata'));['L0 sky','L1 macro + impostors','L2 liquid ground','L3 hero motifs','L4 bubbles + sparkles'].forEach((n,i)=>bench.append(tog(n,!!LAYERS[i],v=>{LAYERS[i]=v?1:0;W.strata[i].visible=v})));
 bench.append(h('h2',{},'Quality'),h('p',{},'These rebuild the world. Phones start with transmission and GTAO off.'));
 bench.append(tog('Real shadows (sun shadow map)',quality.shadows,v=>{quality.shadows=v;rebuildQuality()}),tog('Transmission (refracting hearts and bubbles)',quality.transmission,v=>{quality.transmission=v;rebuildQuality()}),tog('GTAO contact occlusion',quality.gtao,v=>{quality.gtao=v;rebuildQuality()}),tog('FXAA',quality.fxaa,v=>{quality.fxaa=v;rebuildQuality()}));
 bench.append(slider('k-ao','GTAO strength',0,1.5,.01,post.K.aoK.value,v=>post.K.aoK.value=v));
 bench.append(h('h2',{},'Material seeds'),h('p',{},'Each seed maps onto MeshPhysicalNodeMaterial (roughness = 1 − gloss, metalness, clearcoat, iridescence from film) plus node terms for glow-through, emissive and pores. Edits apply live.'));
 const roles=Object.keys(R.seeds);if(!roles.includes(seedRole))seedRole=roles[0];const sel=h('select',{id:'seedRole'});for(const r of roles){const o=h('option',{value:r},`${r} · ${R.seeds[r].name||'custom'}`);if(r===seedRole)o.selected=true;sel.append(o)}
 const box=h('div',{});const relive=s=>W.mats.forEach(m=>{if(m.userData.seed===s)applySeed(m,s)});
 const fillSeed=()=>{box.innerHTML='';const s=R.seeds[seedRole];for(const [k,label,a,b,st] of SEED_KEYS){if(a==='color')box.append(colour(`s-${k}`,label,s[k],v=>{s[k]=v;relive(s)}));else box.append(slider(`s-${k}`,label,a,b,st,s[k],v=>{s[k]=v;relive(s)}))}};
 sel.onchange=()=>{seedRole=sel.value;fillSeed()};bench.append(sel,box);fillSeed();
 let grp='';for(const [g,k,label,a,b,st,on,reb] of KN){if(!R[g]||R[g][k]===undefined)continue;if(g!==grp){grp=g;bench.append(h('h2',{},g))}
  bench.append(slider(`k-${g}-${k}`,label,a,b,st,R[g][k],v=>{R[g][k]=v;if(on)on(v);if(reb){clearTimeout(rebuildTimer);rebuildTimer=setTimeout(build,250)}}))}
 bench.append(h('h2',{},'Recipe'));const ta=h('textarea',{id:'recipe',spellcheck:'false'});ta.value=JSON.stringify(R);
 const cp=h('button',{class:'chip',type:'button',onclick:()=>{ta.value=JSON.stringify(R,null,1);ta.select();try{navigator.clipboard.writeText(ta.value)}catch(_){}cp.textContent='Copied'}},'Copy');
 const ld=h('button',{class:'chip',type:'button',onclick:()=>{try{const o=JSON.parse(ta.value);applyRecipe(dm(resolveWorld(o.layout==='coast'?'coast':'reef'),o))}catch(e){ld.textContent='Bad JSON'}}},'Load');
 bench.append(ta,h('div',{class:'chips'},cp,ld));
 bench.append(h('h2',{},'What changed from the WebGL2 lab'));const ul=h('ul',{class:'anat'});
 [['Renderer','WebGPURenderer with automatic WebGL2 fallback; the same files run on both.'],
  ['Materials','every seed is a MeshPhysicalNodeMaterial; drips are a positionNode, the eye map a colorNode/emissiveNode, so eyes take real light, shadows and environment reflections.'],
  ['Life on the GPU','gaze smoothing, lids, blink schedules and poke waves for every eye run in TSL compute over storage buffers; bubbles rise, wrap, pop and blow from your finger in compute too.'],
  ['Real light','a sun shadow map (drips and bulbs shadow each other), an environment cube rendered from the sky plus softbox panels, GTAO in the crevices.'],
  ['Refraction','crystal hearts and soap bubbles use transmission, so they bend the world behind them; hearts add dispersion.'],
  ['One draw for the palaces','spires and arches share one BatchedMesh with per-instance colour and culling.'],
  ['Post as nodes','MRT normals → GTAO, mip-chain bloom, chromatic aberration, vignette, ACES, FXAA, grain.']].forEach(([b,t])=>ul.append(h('li',{},h('b',{},b+'. '),t)));bench.append(ul)}
function mutate(){const r=Math.random,rot=(r()-.5)*320,o=JSON.parse(JSON.stringify(R));o.seed=1+Math.floor(r()*999);o.name='Mutant '+o.seed;
 for(const k in o.palette){const v=o.palette[k];o.palette[k]=Array.isArray(v)?v.map(c=>hueRot(c,rot+(r()-.5)*30)):hueRot(v,rot)}
 for(const role in o.seeds){const s=o.seeds[role];s.a=hueRot(s.a,rot);s.b=hueRot(s.b,rot);s.sss=hueRot(s.sss,rot);s.gloss=clamp(s.gloss+(r()-.5)*.15,.2,1);if(s.film>0)s.film=200+r()*650}
 o.motion.drip=.5+r()*1.6;o.motion.wobble=.4+r()*1.5;o.post.bloom=.5+r()*.6;if(o.layout==='reef')o.counts.bulbs=50+Math.floor(r()*80);applyRecipe(o)}
// ---------- boot
build();buildBench();
renderer.setAnimationLoop(frame);
window.__sw={sun,fill,hemi,scene,post,get R(){return R},get W(){return W},backend,poke:(i=5)=>{const b=W.bodies.filter(x=>x.kind>0)[i];poke(b,b.p)},popBubble,tap,goWorld,pick,cam,quality,
 setHold(on,at){holding=on?{id:-1,t0:time-1,on:true,at}:null},layers(a){LAYERS=a;a.forEach((v,i)=>W.strata[i].visible=!!v)},
 bub:()=>bubPos&&Array.from(bubPos.slice(0,8)).map(v=>+v.toFixed(2)),async gaze(){const m=W.strata[3].children.find(x=>x.userData.role);const a=new Float32Array(await renderer.getArrayBufferAsync(m.material.userData.gazeAttr));return Array.from(a.slice(0,8)).map(v=>+v.toFixed(3))},
 stats:()=>({backend,draws:renderer.info.render.drawCalls,tris:renderer.info.render.triangles,build:lastBuild,eyes:W.bodies.filter(b=>b.kind>0).length,mood,scale}),
 async snapGPU(){renderer.setAnimationLoop(null);const w=renderer.domElement.width,h=renderer.domElement.height,rt=new THREE.RenderTarget(w,h);await frame();renderer.setRenderTarget(rt);post.pp.render();renderer.setRenderTarget(null);
  const px=await renderer.readRenderTargetPixelsAsync(rt,0,0,w,h),stride=backend==='WebGPU'?Math.ceil(w*4/256)*256:w*4,c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d'),im=g.createImageData(w,h);
  for(let y=0;y<h;y++)for(let x=0;x<w*4;x++)im.data[(backend==='WebGPU'?y:h-1-y)*w*4+x]=px[y*stride+x];g.putImageData(im,0,0);c.style='position:fixed;inset:0;width:100%;height:100%;z-index:3;pointer-events:none';document.body.append(c);return [w,h,stride]},
 async snap(){renderer.setAnimationLoop(null);await frame();const u=renderer.domElement.toDataURL('image/png');const im=new Image();im.src=u;im.style='position:fixed;inset:0;width:100%;height:100%;z-index:3;pointer-events:none';document.body.append(im);return u.length}};
