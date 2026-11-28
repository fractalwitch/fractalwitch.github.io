// Strata World core: pure typed-array generators and the two layouts (shared with the WebGL2 lab)
// ---------- math, noise, colour ----------
const TAU=Math.PI*2;
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x)), mix=(a,b,t)=>a+(b-a)*t;
const sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
const norm=v=>{const l=Math.hypot(v[0],v[1],v[2])||1;return [v[0]/l,v[1]/l,v[2]/l]};
const vadd=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]], vsub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]], vscl=(a,s)=>[a[0]*s,a[1]*s,a[2]*s];
const vdot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2], vcrs=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function rng(seed){let s=(seed*2654435761)>>>0||1;return()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296}}
function makeNoise(seed){
 const r=rng(seed),p=[...Array(256).keys()],perm=new Uint16Array(512),val=new Float32Array(256);
 for(let i=255;i>0;i--){const j=Math.floor(r()*(i+1));[p[i],p[j]]=[p[j],p[i]]}
 for(let i=0;i<512;i++)perm[i]=p[i&255];
 for(let i=0;i<256;i++)val[i]=r()*2-1;
 const n=(x,y)=>{const xi=Math.floor(x),yi=Math.floor(y),X=xi&255,Y=yi&255;let fx=x-xi,fy=y-yi;
  const a=val[perm[X+perm[Y]]],b=val[perm[X+1+perm[Y]]],c=val[perm[X+perm[Y+1]]],d=val[perm[X+1+perm[Y+1]]];
  fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy);return a+(b-a)*fx+(c-a)*fy+(a-b-c+d)*fx*fy};
 const fbm=(x,y,o=4)=>{let s=0,a=.5,f=1;for(let i=0;i<o;i++){s+=a*n(x*f+i*17.3,y*f-i*9.1);f*=2.03;a*=.5}return s};
 const ridge=(x,y,o=5)=>{let s=0,a=.5,f=1,w=1;for(let i=0;i<o;i++){let v=1-Math.abs(n(x*f+i*7.7,y*f+i*3.3));v*=v*w;w=clamp(v*1.6,0,1);s+=a*v;f*=2.1;a*=.5}return s};
 return {n,fbm,ridge,r};
}
function srgbToLin(c){return c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4)}
function linToSrgb(c){c=clamp(c,0,1);return c<=.0031308?c*12.92:1.055*Math.pow(c,1/2.4)-.055}
function hexLin(h){const n=parseInt(h.slice(1),16);return [(n>>16)&255,(n>>8)&255,n&255].map(v=>srgbToLin(v/255))}
function hexRgb(h){const n=parseInt(h.slice(1),16);return [(n>>16)&255,(n>>8)&255,n&255]}
function rgbHex(r,g,b){return '#'+[r,g,b].map(v=>clamp(Math.round(v),0,255).toString(16).padStart(2,'0')).join('')}
// rotate a hex colour's hue (degrees) in a simple HSL round trip; used by Mutate and remixes
function hueRot(hex,deg){let [r,g,b]=hexRgb(hex).map(v=>v/255);const mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2;let h=0,s=0;
 if(mx!==mn){const d=mx-mn;s=l>.5?d/(2-mx-mn):d/(mx+mn);h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;h/=6}
 h=((h*360+deg)%360+360)%360/360;const q=l<.5?l*(1+s):l+s-l*s,p=2*l-q,f=t=>{t=(t+1)%1;return t<1/6?p+(q-p)*6*t:t<.5?q:t<2/3?p+(q-p)*(2/3-t)*6:p};
 return rgbHex(f(h+1/3)*255,f(h)*255,f(h-1/3)*255)}
const choose=(r,a)=>a[Math.floor(r()*a.length)%a.length];
// jittered linear colour from a palette list
function palCol(r,list,j=.08){const c=hexLin(choose(r,list)),k=1+(r()-.5)*j*2;return [c[0]*k,c[1]*k,c[2]*k]}

// ---------- mesh generators (all return typed arrays) ----------
function geoSphere(sx,sy){const P=[],I=[];for(let i=0;i<=sy;i++){const ph=i/sy*Math.PI;for(let j=0;j<=sx;j++){const th=j/sx*TAU;P.push(Math.sin(ph)*Math.cos(th),Math.cos(ph),Math.sin(ph)*Math.sin(th))}}
 for(let i=0;i<sy;i++)for(let j=0;j<sx;j++){const a=i*(sx+1)+j,b=a+1,c=a+sx+1,d=c+1;I.push(a,b,c,b,d,c)}return {P:new Float32Array(P),I:new Uint32Array(I)}}
// faceted gem heart: apex, inner ring, outline, inner ring, apex
function geoHeart(){
 const N=28,P=[],Nn=[],A=[],I=[],pts=[];
 for(let i=0;i<N;i++){const t=i/N*TAU,s=Math.sin(t);pts.push([16*s*s*s/17,(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))/17+.12])}
 const push=(x,y,z,part)=>{P.push(x,y,z);const n=norm([x,y*.8,z*2.2]);Nn.push(...n);A.push(part);return P.length/3-1};
 const fA=push(0,.06,.34,0),bA=push(0,.06,-.34,0),r1=[],o=[],r2=[];
 for(const [x,y] of pts){r1.push(push(x*.62,y*.62+.02,.25,0))}
 for(const [x,y] of pts){o.push(push(x,y,0,1))}
 for(const [x,y] of pts){r2.push(push(x*.62,y*.62+.02,-.25,0))}
 for(let i=0;i<N;i++){const j=(i+1)%N;
  I.push(fA,r1[j],r1[i]);I.push(r1[i],r1[j],o[i],r1[j],o[j],o[i]);
  I.push(o[i],o[j],r2[i],o[j],r2[j],r2[i]);I.push(bA,r2[i],r2[j]);}
 return {P:new Float32Array(P),N:new Float32Array(Nn),A:new Float32Array(A),I:new Uint32Array(I)};
}
function latheInto(o,prof,seg,partFn){
 const b=o.P.length/3;
 for(let i=0;i<prof.length;i++){const pr=prof[Math.max(i-1,0)],nx=prof[Math.min(i+1,prof.length-1)],dr=nx[0]-pr[0],dy=nx[1]-pr[1],l=Math.hypot(dr,dy)||1;
  for(let j=0;j<seg;j++){const a=j/seg*TAU,c=Math.cos(a),s=Math.sin(a);o.P.push(prof[i][0]*c,prof[i][1],prof[i][0]*s);o.N.push(dy/l*c,-dr/l,dy/l*s);o.A.push(partFn(i,prof[i]))}}
 for(let i=0;i<prof.length-1;i++)for(let j=0;j<seg;j++){const a=b+i*seg+j,bb=b+i*seg+(j+1)%seg;o.I.push(a,bb,a+seg,bb,bb+seg,a+seg)}
}
// a filigree palace spire, unit height
function geoSpire(){
 const o={P:[],N:[],A:[],I:[]};
 const prof=[[.001,0],[.24,0],[.24,.05],[.17,.07],[.13,.09],[.12,.16],[.155,.18],[.12,.2],[.105,.36],[.14,.38],[.15,.4],[.12,.42],[.095,.55],
  [.16,.6],[.2,.65],[.2,.69],[.16,.74],[.1,.78],[.06,.8],[.075,.82],[.05,.84],[.035,.9],[.02,.96],[.001,1]];
 latheInto(o,prof,18,(i,p)=>((p[1]>.15&&p[1]<.21)||(p[1]>.36&&p[1]<.43)||(p[1]>.58&&p[1]<.8)||p[1]>.83)?1:0);
 return {P:new Float32Array(o.P),N:new Float32Array(o.N),A:new Float32Array(o.A),I:new Uint32Array(o.I)};
}
// tube along a polyline with parallel-transported frames
function tubeInto(o,pts,rad,sides,part){
 const b=o.P.length/3;let up=[0,0,1];
 for(let i=0;i<pts.length;i++){const p=pts[i],q=pts[Math.min(i+1,pts.length-1)],pp=pts[Math.max(i-1,0)];const t=norm(vsub(q,pp));
  let u=vcrs(up,t);if(Math.hypot(...u)<1e-4)u=vcrs([1,0,0],t);u=norm(u);const v=vcrs(t,u);up=v;
  for(let j=0;j<sides;j++){const a=j/sides*TAU,n=vadd(vscl(u,Math.cos(a)),vscl(v,Math.sin(a)));o.P.push(...vadd(p,vscl(n,rad[i])));o.N.push(...n);o.A.push(part)}}
 for(let i=0;i<pts.length-1;i++)for(let j=0;j<sides;j++){const a=b+i*sides+j,bb=b+i*sides+(j+1)%sides;o.I.push(a,a+sides,bb,bb,a+sides,bb+sides)}
}
// filigree arch: beaded outer arc, thin inner arc, rings between, two columns
function geoArch(){
 const o={P:[],N:[],A:[],I:[]},S=120;
 let pts=[],rad=[];for(let i=0;i<=S;i++){const a=i/S*Math.PI;pts.push([Math.cos(a),Math.sin(a),0]);rad.push(.07*(1+.55*Math.pow(Math.max(0,Math.sin(a*30)),6)))}tubeInto(o,pts,rad,8,1);
 pts=[];rad=[];for(let i=0;i<=60;i++){const a=i/60*Math.PI;pts.push([.78*Math.cos(a),.78*Math.sin(a),0]);rad.push(.032)}tubeInto(o,pts,rad,6,0);
 for(let k=0;k<7;k++){const a=(k+.5)/7*Math.PI,c=[.89*Math.cos(a),.89*Math.sin(a),0];pts=[];rad=[];for(let i=0;i<=16;i++){const b=i/16*TAU;pts.push([c[0]+.075*Math.cos(b),c[1]+.075*Math.sin(b),0]);rad.push(.018)}tubeInto(o,pts,rad,5,1)}
 for(const sx of [-1,1]){pts=[];rad=[];for(let i=0;i<=12;i++){const y=-i/12*1.8;pts.push([sx,y,0]);rad.push(.075*(1+.3*Math.pow(Math.max(0,Math.sin(i*1.3)),4)))}tubeInto(o,pts,rad,8,0)}
 return {P:new Float32Array(o.P),N:new Float32Array(o.N),A:new Float32Array(o.A),I:new Uint32Array(o.I)};
}
// goo strand: rings along s in [0,1] plus hemispherical caps; attribute = (s, e, angle)
function geoStrand(){
 const R=[],sides=8,body=20;for(let k=3;k>=1;k--){const f=k/3*Math.PI/2;R.push([0,-Math.sin(f),Math.cos(f)])}
 for(let k=0;k<=body;k++)R.push([k/body,0,1]);for(let k=1;k<=3;k++){const f=k/3*Math.PI/2;R.push([1,Math.sin(f),Math.cos(f)])}
 const A=[],I=[];for(const [s,e,r] of R)for(let j=0;j<sides;j++)A.push(s,e,j/sides*TAU,r);
 for(let i=0;i<R.length-1;i++)for(let j=0;j<sides;j++){const a=i*sides+j,b=i*sides+(j+1)%sides;I.push(a,a+sides,b,b,a+sides,b+sides)}
 return {A:new Float32Array(A),I:new Uint32Array(I)};
}
function geoPolarGrid(rmax,K,S,pw){const P=[0,0],I=[];for(let k=1;k<=K;k++){const r=rmax*Math.pow(k/K,pw);for(let j=0;j<S;j++){const a=j/S*TAU;P.push(Math.cos(a)*r,Math.sin(a)*r)}}
 for(let j=0;j<S;j++)I.push(0,1+(j+1)%S,1+j);
 for(let k=1;k<K;k++)for(let j=0;j<S;j++){const a=1+(k-1)*S+j,b=1+(k-1)*S+(j+1)%S,c=a+S,d=b+S;I.push(a,b,c,b,d,c)}
 return {P:new Float32Array(P),I:new Uint32Array(I)}}

// ---------- LAYOUT A: Eyebloom Reef ----------
function buildReef(R){
 const r=rng(R.seed),nz=makeNoise(R.seed),C=[0,2.55,0],E=[3.5,2.45,2.1],P=R.palette,cnt=R.counts;
 const bulbs=[],nubs=[],tubes=[],hearts=[],mounds=[];
 // sizes: biggest first so they claim the front
 const sizes=[];for(let i=0;i<cnt.bulbs;i++)sizes.push(mix(.2,.78,Math.pow(r(),2.4)));sizes.sort((a,b)=>b-a);
 for(const s of sizes){
  for(let t=0;t<220;t++){
   const d=norm([r()*2-1,r()*2-1,r()*2-1]),k=Math.pow(r(),.3),p=[C[0]+d[0]*E[0]*k,C[1]+d[1]*E[1]*k,C[2]+d[2]*E[2]*k];
   if(s>.45&&d[2]<-.2)continue;
   if(bulbs.some(b=>Math.hypot(b.p[0]-p[0],b.p[1]-p[1],b.p[2]-p[2])<(b.s+s)*.86))continue;
   const sock=norm([d[0]*.4+(r()-.5)*.2,d[1]*.3+.05+(r()-.5)*.15,d[2]*.3+1]);
   const depth=k;bulbs.push({p,s,d,sock,ao:clamp(.38+.62*sstep(.25,.95,depth)+.15*d[2],.3,1),kind:r()<.88?1:0,drip:(.5+.9*r())*(1+.8*sstep(0,-1,d[1])),
    col:palCol(r,P.bulb),eye:.66+.08*r(),iris:(r()-.5)*.5});break;
  }
 }
 // antenna nubs on stalks
 for(const b of bulbs){if(b.s<.32)continue;const n=2+Math.floor(r()*4);
  for(let i=0;i<n;i++){let d=norm([r()*2-1,r()*1.6-.35,r()*2-1+.4]);const ns=b.s*(.12+.08*r()),c=vadd(b.p,vscl(d,b.s*(1.28+.3*r())));
   const sa=vadd(b.p,vscl(d,b.s*.8));tubes.push({a:sa,ra:ns*.42,b:c,rb:ns*.38,taper:1,phase:r()*TAU,flow:.2,sag:0,col:b.col});
   nubs.push({p:c,s:ns,d,sock:norm(vadd(d,[0,0,.6])),ao:b.ao,kind:r()<.35?1:0,drip:.25,col:b.col,eye:.8,iris:(r()-.5)*.6});}
 }
 // golden filigree coral threading the cluster
 const coral={P:[],N:[],A:[],I:[]},tips=[];
 const branch=(p,dir,len,rad,depth)=>{const pts=[p],rr=[rad];let q=p,d=dir;const steps=5;
  for(let i=1;i<=steps;i++){d=norm(vadd(d,[ (r()-.5)*.55,(r()-.5)*.45+.02,(r()-.5)*.55]));q=vadd(q,vscl(d,len/steps));pts.push(q);rr.push(rad*(1-.55*i/steps))}
  tubeInto(coral,pts,rr,depth<2?6:depth<3?4:3,depth);
  if(depth<4){const kids=depth===0?3:2;for(let k=0;k<kids;k++){const at=pts[2+Math.floor(r()*(steps-1))];branch(at,norm(vadd(d,[(r()-.5)*1.6,(r()-.5)*1.2+.2,(r()-.5)*1.6])),len*.56,Math.max(rad*.62,.009),depth+1)}}
  else tips.push({p:q,d});};
 for(let i=0;i<cnt.coral;i++){const a=i/cnt.coral*TAU+r()*.4;const dir=norm([Math.cos(a),(r()-.45)*.9,Math.sin(a)*.8+.3]);branch(vadd(C,[(r()-.5)*.6,(r()-.5)*.6,(r()-.5)*.4]),dir,1.7+r()*1.1,.06,0)}
 const ap=coral.P.length/3,AO=new Float32Array(ap*4);for(let v=0;v<ap;v++){const p=[coral.P[v*3],coral.P[v*3+1],coral.P[v*3+2]];const k=Math.hypot((p[0]-C[0])/E[0],(p[1]-C[1])/E[1],(p[2]-C[2])/E[2]);AO[v*4]=clamp(.25+.75*sstep(.4,1.1,k),.2,1);AO[v*4+3]=coral.A[v]}
 for(const t of tips){if(r()<.42)hearts.push({p:vadd(t.p,vscl(t.d,.06)),s:.07+.07*r(),yaw:r()*TAU,ys:1,spin:.6+r(),ph:r()*TAU,col:palCol(r,P.heart),col2:hexLin(P.glow)})}
 // long drips to the pool and short hanging drips
 const low=bulbs.filter(b=>b.d[1]<-.15&&b.s>.3).sort((a,b)=>a.p[1]-b.p[1]);
 for(let i=0;i<Math.min(cnt.strands,low.length);i++){const b=low[i],a=vadd(b.p,[0,-b.s*.85,0]);
  if(i%2===0&&a[1]<2.6){tubes.push({a,ra:b.s*.11,b:[a[0]+(r()-.5)*.2,.02,a[2]+(r()-.5)*.2],rb:b.s*.2,taper:2.5,phase:r()*TAU,flow:1,sag:0,col:r()<.25?hexLin(P.cyan):b.col});mounds.push([a[0],a[2],b.s*1.1,.12])}
  else tubes.push({a,ra:b.s*.1,b:vadd(a,[0,-(.4+r()*1.1),0]),rb:b.s*.18,taper:6,phase:r()*TAU,flow:.7,sag:0,col:b.col});}
 // eyes half-sunk in the iridescent pool
 const pool=[];for(let i=0;i<cnt.poolEyes;i++){for(let t=0;t<80;t++){const a=Math.PI*(.05+.9*r())-0,rad=3.2+r()*6,p=[Math.cos(a)*rad*1.25,.02,Math.sin(a)*rad*.9+.6];
   const s=.32+.5*Math.pow(r(),1.5);if(pool.some(q=>Math.hypot(q.p[0]-p[0],q.p[2]-p[2])<(q.s+s)*1.5))continue;
   pool.push({p,s,d:[0,1,0],sock:norm([-p[0]*.05,.55,1]),ao:1,kind:2,drip:0,col:palCol(r,P.bulb),eye:.82,iris:(r()-.5)*.6,squash:.5});mounds.push([p[0],p[2],s*1.9,.16]);break}}
 {const cc=[.4,.02,3.3],cy=hexLin(P.cyan);bulbs.push({p:vadd(cc,[0,.1,0]),s:.55,d:[0,-1,0],sock:[0,0,1],ao:1,kind:0,drip:0,col:cy,eye:.5,iris:0,squash:.45});
  for(let k=0;k<20;k++){const a=k/20*TAU+r()*.3,o=[Math.cos(a)*.48,0,Math.sin(a)*.36],up=.12+r()*.5,f=1.6+r()*1.1;tubes.push({a:vadd(cc,o),ra:.05,b:vadd(cc,[o[0]*f,up,o[2]*f]),rb:.045+.025*r(),taper:.4,phase:r()*TAU,flow:.2,sag:-.9,col:cy})}
  pool.push({p:[-.9,.02,4.6],s:.95,d:[0,1,0],sock:norm([.05,.5,1]),ao:1,kind:2,drip:0,col:palCol(r,P.bulb),eye:.82,iris:0,squash:.5});mounds.push([-.9,4.6,1.9,.2]);}
 const fronds=[];for(let i=0;i<cnt.fronds;i++){const side=i%2?1:-1,k=Math.floor(i/2);fronds.push({p:[side*(6.5+k*3+r()*2),4+r()*5,-5-k*3-r()*3],s:6.5+r()*4,rect:k%2?4:0,aspect:1,mode:0,alpha:.55,col:hexLin(choose(r,P.frond))})}
 return {kind:'reef',C,E,bulbs,nubs,pool,tubes,hearts,mounds,coral:{P:new Float32Array(coral.P),N:new Float32Array(coral.N),X:AO,I:new Uint32Array(coral.I)},cardsAdd:fronds,cardsAlpha:[],spires:[],arches:[]};
}

// ---------- LAYOUT B: Heart Coast ----------
function coastField(R){
 const nz=makeNoise(R.seed),nz2=makeNoise(R.seed*3+1);
 const stacks=[[22,-52,4.5,10],[29,-60,3.4,7],[16,-66,2.8,6],[35,-46,2.4,5]];
 const H=(x,z)=>{const sh=1.2-z*.13+3*nz.n(z*.05,1.7),d=sh-x,land=sstep(-1.5,4,d);
  const rid=nz.ridge(x*.075+5,z*.075,5);
  let h=-2.6+land*(3.1+19*Math.pow(rid,1.5)*sstep(3,-16,z)*sstep(-1,9,d)+1.6*nz.fbm(x*.28,z*.28));
  h=Math.min(h,-2.6+land*30);
  for(const [sx,sz,sr,sh2] of stacks){const q=Math.hypot(x-sx,(z-sz)*.8);h=Math.max(h,-2.6+(sh2+2.6)*sstep(sr,sr*.25,q)*(.75+.5*nz.ridge(x*.3,z*.3,3)))}
  return h};
 const goo=(x,z,h,slope)=>{const g=nz2.fbm(x*.16,z*.16+h*.05)+.35*sstep(1,10,h)-.1+.45*sstep(4,-1,x+z*.1)*sstep(2,8,z+4)*0;
  const streak=sstep(.25,.55,nz2.n(x*1.3+z*1.1,h*.25))*sstep(.6,1.4,slope)*.55;return clamp((g+streak-.18)*3,0,1)};
 const sel=(x,z)=>nz2.n(x*.07+20,z*.07-11)*.5+.5;
 return {H,goo,sel,nz,nz2};
}
function buildCoast(R){
 const r=rng(R.seed*7+3),F=coastField(R),P=R.palette,cnt=R.counts,H=F.H;
 // terrain grid: heights sampled once, then normals, horizon AO and the goo mask read from the grid
 const X0=-32,X1=40,Z0=-78,Z1=14,NX=230,NZ=220,P3=[],N3=[],X=[],I=[],dx=(X1-X0)/NX,dz=(Z1-Z0)/NZ,HG=new Float32Array((NX+1)*(NZ+1));
 for(let j=0;j<=NZ;j++)for(let i=0;i<=NX;i++)HG[j*(NX+1)+i]=H(X0+i*dx,Z0+j*dz);
 const hg=(i,j)=>HG[clamp(j,0,NZ)*(NX+1)+clamp(i,0,NX)];
 for(let j=0;j<=NZ;j++)for(let i=0;i<=NX;i++){const x=X0+i*dx,z=Z0+j*dz,y=hg(i,j);
  const gx=(hg(i+1,j)-hg(i-1,j))/(2*dx),gz=(hg(i,j+1)-hg(i,j-1))/(2*dz),n=norm([-gx,1,-gz]),slope=Math.hypot(gx,gz);
  let occ=0;for(let k=0;k<8;k++){const a=k/8*TAU,ca=Math.cos(a),sa=Math.sin(a);let m=0;for(const d of [2,6,14]){const s2=(hg(i+Math.round(ca*d),j+Math.round(sa*d))-y)/(d*dx);if(s2>m)m=s2}occ+=Math.min(m,1.6)}
  P3.push(x,y,z);N3.push(...n);X.push(clamp(1-occ/8*.5,.35,1),y>-.4?F.goo(x,z,y,slope):0,F.sel(x,z),slope)}
 for(let j=0;j<NZ;j++)for(let i=0;i<NX;i++){const a=j*(NX+1)+i,b=a+1,c=a+NX+1,d=c+1;I.push(a,c,b,b,c,d)}
 // height texture for the ocean (shore foam, shallows)
 const HT=128,htex=new Float32Array(HT*HT);for(let j=0;j<HT;j++)for(let i=0;i<HT;i++)htex[j*HT+i]=H(mix(X0,X1,(i+.5)/HT),mix(Z0,Z1,(j+.5)/HT));
 const bulbs=[],nubs=[],pool=[],tubes=[],hearts=[],spires=[],arches=[];
 // foreground goo masses (bottom left) with embedded hearts and candy balls
 for(let i=0;i<cnt.gooBlobs;i++){const x=-10+r()*8.5,z=-2+r()*12,s=.7+r()*1.5,y=Math.max(H(x,z),-.2)+s*.12;
  bulbs.push({p:[x,y,z],s,d:[0,1,0],sock:[0,0,1],ao:.85,kind:0,drip:1.8+r()*1.2,col:palCol(r,P.blob||P.goo),eye:.5,iris:0,squash:.38+.22*r()});
  for(let k=0;k<3;k++){const d=norm([r()*2-1,.3+r(),r()*.8+.4]);hearts.push({p:vadd([x,y,z],[d[0]*s*.8,d[1]*s*.45,d[2]*s*.8]),s:.18+.22*r(),yaw:(r()-.5)*.8,ys:1,spin:0,ph:r()*TAU,col:palCol(r,P.heart),col2:hexLin(P.glow)})}
  for(let k=0;k<2;k++){const d=norm([r()*2-1,.2+r(),r()*2-1]);nubs.push({p:vadd([x,y,z],[d[0]*s*.95,d[1]*s*.5,d[2]*s*.95]),s:.1+.18*r(),d,sock:[0,0,1],ao:1,kind:0,drip:.3,col:palCol(r,P.ball),eye:.5,iris:0})}}
 // goo draped over the cliff tops
 let tries=0;while(bulbs.length<cnt.gooBlobs+cnt.drape&&tries++<4000){const x=-26+r()*30,z=-34+r()*36,y=H(x,z);if(y<1)continue;const e=.2,sl=Math.hypot(H(x+e,z)-H(x-e,z),H(x,z+e)-H(x,z-e))/(2*e);
  if(F.goo(x,z,y,sl)<.5)continue;const s=.5+r()*1.1;bulbs.push({p:[x,y+s*.3,z],s,d:[0,1,0],sock:[0,0,1],ao:.8,kind:0,drip:1.5+r()*1.2,col:palCol(r,P.goo),eye:.5,iris:0,squash:.35+.2*r()})}
 // goo drips on steep goo faces
 tries=0;while(tubes.length<cnt.strands&&tries++<12000){const x=-24+r()*30,z=-30+Math.pow(r(),.6)*42,y=H(x,z);if(y<.8)continue;const e=.2,gx=(H(x+e,z)-H(x-e,z))/(2*e),gz=(H(x,z+e)-H(x,z-e))/(2*e),sl=Math.hypot(gx,gz);
  if(sl<.9||F.goo(x,z,y,sl)<.45)continue;const out=norm([-gx,0,-gz]),a=[x+out[0]*.15,y-.05,z+out[2]*.15],L=.5+r()*2.2,s=F.sel(x,z);
  tubes.push({a,ra:.09+.08*r(),b:vadd(a,[out[0]*.12,-L,out[2]*.12]),rb:.17+.12*r(),taper:5,phase:r()*TAU,flow:.8,sag:0,col:s<.36?hexLin(P.goo[1]||P.goo[0]):s>.62?hexLin(P.goo[2]||P.goo[0]):hexLin(P.goo[0])})}
 // white eye foam on the shore (bottom right)
 const foam=[];for(let i=0;i<cnt.foam;i++){const z=-1+r()*9,x=mix(.6,7.5,Math.pow(r(),.8))+(8-z)*.15,s=.3+Math.pow(r(),1.6)*1.1;foam.push({p:[x,.05+s*.12,z],s,d:[0,1,0],sock:[0,0,1],ao:1,kind:0,drip:0,col:hexLin(P.foam),eye:.5,iris:0,squash:.45+.2*r()})}
 for(let i=0;i<cnt.foamEyes;i++){const f=foam[Math.floor(r()*foam.length)];const d=norm([(r()-.5)*1.4,.5+r()*.5,.7+r()*.5]);const s=f.s*(.32+.26*r());
  pool.push({p:vadd(f.p,[d[0]*f.s*.92,d[1]*f.s*f.squash*.95,d[2]*f.s*.92]),s,d,sock:norm([d[0]*.4,.35,1]),ao:1,kind:2,drip:0,col:hexLin(P.foam),eye:.66,iris:(r()-.5)*.8,squash:.62})}
 // palace spires with crystal hearts on top
 for(let i=0;i<cnt.spires;i++){const x=-12+r()*28,z=-17-r()*20,base=Math.max(H(x,z),-.3)-.3,hs=6+r()*7,rs=1.8+r()*1.5;
  spires.push({p:[x,base,z],s:rs*1.7,yaw:r()*TAU,ys:hs/(rs*1.7),spin:0,ph:r()*TAU,col:hexLin(P.spire),col2:palCol(r,P.heart)});
  hearts.push({p:[x,base+hs+rs*.7,z],s:rs*.9,yaw:0,ys:1,spin:.25,ph:r()*TAU,col:palCol(r,P.bigHeart),col2:hexLin(P.glow)});
  for(let k=0;k<2;k++)hearts.push({p:[x+Math.cos(k*3.1)*rs*.32,base+hs*.65,z+Math.sin(k*3.1)*rs*.32],s:rs*.16,yaw:k*3.1,ys:1,spin:.5,ph:r()*TAU,col:palCol(r,P.heart),col2:hexLin(P.glow)})}
 // filigree bridge of arches over the water
 const b0=[2,-17],b1=[30,-27],nA=cnt.arches,yaw=-Math.atan2(b1[1]-b0[1],b1[0]-b0[0]);
 for(let i=0;i<nA;i++){const t=(i+.5)/nA,x=mix(b0[0],b1[0],t),z=mix(b0[1],b1[1],t),y=2.6+1.2*Math.sin(t*Math.PI);
  arches.push({p:[x,y,z],s:2.1,yaw,ys:1,spin:0,ph:i,col:hexLin(P.spire),col2:hexLin(P.bridge)});
  if(i%2===0)hearts.push({p:[x,y+2.35,z],s:.55,yaw:-yaw,ys:1,spin:0,ph:r()*TAU,col:palCol(r,P.heart),col2:hexLin(P.glow)})}
 // impostor palaces and cloud cards far away
 const cardsAlpha=[];for(let i=0;i<cnt.palaces;i++)cardsAlpha.push({p:[-34+i*68/(cnt.palaces-1)+(r()-.5)*6,-1.5,-66-r()*12],s:14+r()*9,rect:3,aspect:1,mode:1,alpha:1,col:hexLin(P.spire)});
 for(let i=0;i<cnt.clouds;i++){let a=(r()-.5)*2.6;if(Math.abs(a-.27)<.32)a+=a>.27?.4:-.4;const d=100+r()*40;cardsAlpha.push({p:[Math.sin(a)*d,10+r()*46,-Math.cos(a)*d],s:20+r()*26,rect:r()<.5?1:2,aspect:2,mode:0,alpha:.95,col:palCol(r,P.cloud,.1)})}
 return {kind:'coast',C:[4,3,-14],E:[30,10,30],H,htex,HT,hb:[X0,Z0,X1,Z1],bulbs,nubs,pool,foam,tubes,hearts,spires,arches,mounds:[],
  terrain:{P:new Float32Array(P3),N:new Float32Array(N3),X:new Float32Array(X),I:new Uint32Array(I)},cardsAdd:[],cardsAlpha};
}
export {TAU,clamp,mix,sstep,norm,vadd,vsub,vscl,vdot,vcrs,rng,makeNoise,srgbToLin,hexLin,hexRgb,rgbHex,hueRot,palCol,geoSphere,geoHeart,geoSpire,geoArch,geoStrand,geoPolarGrid,buildReef,buildCoast,coastField};
