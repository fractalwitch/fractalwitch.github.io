// impostor atlas baked once with canvas 2D: Barnsley fern fronds, clouds, palace skyline
import {TAU,rng,mix,hexRgb} from './core.js';
function blurInto(src,dst,k){const s=document.createElement('canvas');s.width=Math.max(1,src.width/k|0);s.height=Math.max(1,src.height/k|0);const sx=s.getContext('2d');sx.drawImage(src,0,0,s.width,s.height);
 const s2=document.createElement('canvas');s2.width=Math.max(1,s.width/2|0);s2.height=Math.max(1,s.height/2|0);s2.getContext('2d').drawImage(s,0,0,s2.width,s2.height);
 dst.save();dst.globalCompositeOperation='lighter';dst.drawImage(s2,0,0,src.width,src.height);dst.drawImage(s,0,0,src.width,src.height);dst.restore()}
function bakeAtlas(){
 const A=document.createElement('canvas');A.width=A.height=1024;const ax=A.getContext('2d');const R=rng(1234);
 const cell=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
 // fern frond: recursive pinnae, cyan core, magenta halo
 // Barnsley fern IFS with a curl, accumulated as density then tone-mapped: the feathery fractal fronds
 const fernIFS=(x0,y0,curl,seed,cA,cB,cC)=>{const S=512,D=new Float32Array(S*S),T=new Float32Array(S*S),r=rng(seed),ca=Math.cos(curl),sa=Math.sin(curl);let x=0,y=0;
  for(let i=0;i<260000;i++){const q=r();let nx,ny;if(q<.01){nx=0;ny=.16*y}else if(q<.86){const tx=.85*x+.04*y,ty=-.04*x+.85*y+1.6;nx=tx*ca-(ty-1.6)*sa;ny=tx*sa+(ty-1.6)*ca+1.6}
   else if(q<.93){nx=.2*x-.26*y;ny=.23*x+.22*y+1.6}else{nx=-.15*x+.28*y;ny=.26*x+.24*y+.44}x=nx;y=ny;if(i<20)continue;
   const px=Math.round(256+x*42),py=Math.round(500-y*46);if(px<0||py<0||px>=S||py>=S)continue;const k=py*S+px;D[k]+=1;T[k]+=Math.min(1,Math.abs(x)/2.2)}
  const c=cell(S,S),g=c.getContext('2d'),im=g.createImageData(S,S),A=hexRgb(cA),B=hexRgb(cB),C=hexRgb(cC);
  for(let k=0;k<S*S;k++){if(!D[k])continue;const t=T[k]/D[k],v=1-Math.exp(-D[k]*.09),w=Math.min(1,D[k]/60);const col=[0,1,2].map(j=>mix(mix(A[j],B[j],t),255,w*.6)*(t>.6?mix(1,C[j]/Math.max(1,B[j]),(t-.6)*2.5):1));
   im.data[k*4]=col[0];im.data[k*4+1]=col[1];im.data[k*4+2]=col[2];im.data[k*4+3]=255*v}
  g.putImageData(im,0,0);const o=cell(S,S),og=o.getContext('2d');og.drawImage(c,0,0);blurInto(c,og,7);ax.drawImage(o,x0,y0)};
 fernIFS(0,0,.035,3,'#58e8ff','#a060ff','#ff50d0');
 // clouds: stacked shaded puffs
 const cloud=(x0,y0,w,h,seed)=>{const c=cell(w,h),g=c.getContext('2d'),r=rng(seed);const puffs=[];for(let i=0;i<46;i++){const t=r(),px=w*(.12+.76*t),top=h*(.32+.2*Math.sin(t*Math.PI*2.3+seed))*(1-.5*Math.sin(t*Math.PI)),py=mix(top,h*.78,r()*.6),pr=h*(.1+.16*r())*(.6+.6*Math.sin(t*Math.PI));puffs.push([px,py,pr])}
  puffs.sort((a,b)=>a[1]-b[1]);for(const [px,py,pr] of puffs){const gr=g.createRadialGradient(px-pr*.35,py-pr*.45,pr*.1,px,py,pr);gr.addColorStop(0,'rgba(255,248,240,1)');gr.addColorStop(.55,'rgba(255,205,220,1)');gr.addColorStop(1,'rgba(220,120,175,0)');g.fillStyle=gr;g.beginPath();g.arc(px,py,pr,0,TAU);g.fill()}
  ax.drawImage(c,x0,y0)};
 cloud(512,0,512,256,3);cloud(512,256,512,256,8);
 // palace skyline: spires with hearts and arcades
 {const c=cell(512,512),g=c.getContext('2d'),r=rng(77);const base=500;
  const heart=(x,y,s,col)=>{g.fillStyle=col;g.beginPath();g.moveTo(x,y+s*.9);g.bezierCurveTo(x-s*1.4,y-s*.2,x-s*.6,y-s*1.1,x,y-s*.35);g.bezierCurveTo(x+s*.6,y-s*1.1,x+s*1.4,y-s*.2,x,y+s*.9);g.fill()};
  g.fillStyle='rgba(255,236,246,.95)';g.fillRect(40,base-120,432,120);
  for(let i=0;i<9;i++){const x=60+i*49;g.fillStyle='rgba(255,200,226,.9)';g.beginPath();g.arc(x+20,base-120,18,Math.PI,0);g.fill();g.fillStyle='rgba(120,40,90,.35)';g.beginPath();g.arc(x+20,base-60,14,Math.PI,0);g.lineTo(x+34,base);g.lineTo(x+6,base);g.fill()}
  for(let i=0;i<7;i++){const x=50+i*68+r()*20,h=180+r()*240,w=18+r()*14;const gr=g.createLinearGradient(x-w,0,x+w,0);gr.addColorStop(0,'rgba(255,214,234,.98)');gr.addColorStop(.5,'rgba(255,250,252,1)');gr.addColorStop(1,'rgba(240,170,210,.98)');g.fillStyle=gr;
   g.fillRect(x-w/2,base-h,w,h);g.beginPath();g.ellipse(x,base-h,w*.9,w*1.1,0,0,TAU);g.fill();g.beginPath();g.moveTo(x-w*.3,base-h-w);g.lineTo(x,base-h-w*3);g.lineTo(x+w*.3,base-h-w);g.fill();
   for(let k=0;k<4;k++){g.fillStyle='rgba(255,170,215,.9)';g.fillRect(x-w*.65,base-h+40+k*(h-60)/4,w*1.3,5)}
   heart(x,base-h-w*3.6,w*.9,'rgba(255,40,110,1)')}
  const o=cell(512,512),og=o.getContext('2d');og.drawImage(c,0,0);ax.drawImage(o,0,512)}
 fernIFS(512,512,-.05,9,'#ff70e0','#7a50ff','#40d8ff');
 return A;
}
export {bakeAtlas};
