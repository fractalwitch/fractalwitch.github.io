import{r as d,j as s,c as w,R as j}from"./client.js";function k(){const[o,f]=d.useState("inhale"),[l,g]=d.useState(0),[m,x]=d.useState([]),[u,b]=d.useState([]),y={inhale:5e3,hold:3e3,exhale:7e3,rest:2e3};d.useEffect(()=>{const e=Array.from({length:60},(i,r)=>({id:r,x:Math.random()*100,y:Math.random()*100,size:Math.random()*4+2,speed:Math.random()*.5+.2,opacity:Math.random()*.4+.2,hue:Math.random()*60+280}));x(e);const a=Array.from({length:8},(i,r)=>({id:r,radius:80+r*25,speed:20+r*8,offset:r*45,opacity:.15-r*.015}));b(a)},[]),d.useEffect(()=>{const e=["inhale","hold","exhale","rest"];let a=0,i=Date.now();const r=()=>{const h=Date.now()-i,c=e[a],p=y[c],v=Math.min(h/p,1);f(c),g(v),h>=p&&(a=(a+1)%e.length,i=Date.now()),requestAnimationFrame(r)},$=requestAnimationFrame(r);return()=>cancelAnimationFrame($)},[]);const n=(()=>{switch(o){case"inhale":return 1+l*.4;case"hold":return 1.4;case"exhale":return 1.4-l*.4;case"rest":return 1;default:return 1}})(),t=o==="hold"?1:o==="inhale"?.6+l*.4:o==="exhale"?1-l*.4:.6;return s.jsxs("div",{style:{width:"100vw",height:"100vh",background:"radial-gradient(ellipse at center, #1a0a2e 0%, #0d0515 50%, #050208 100%)",overflow:"hidden",position:"relative",display:"flex",alignItems:"center",justifyContent:"center"},children:[m.map(e=>{const a=o==="inhale"?-l*15:o==="exhale"?l*10:0,i=o==="hold"?1.3:1;return s.jsx("div",{style:{position:"absolute",left:`${e.x}%`,top:`${e.y}%`,width:e.size*i,height:e.size*i,borderRadius:"50%",background:`hsla(${e.hue}, 70%, 70%, ${e.opacity*t})`,boxShadow:`0 0 ${e.size*2}px hsla(${e.hue}, 80%, 60%, ${e.opacity*.5})`,transform:`translateY(${a}px)`,transition:"transform 2s ease-out, width 1s ease, height 1s ease",pointerEvents:"none"}},e.id)}),u.map(e=>s.jsx("div",{style:{position:"absolute",width:e.radius*2*n,height:e.radius*2*n,border:`1px solid rgba(200, 150, 255, ${e.opacity*t})`,borderRadius:"50%",animation:`spin ${e.speed}s linear infinite`,transform:`rotate(${e.offset}deg)`,pointerEvents:"none"}},e.id)),s.jsx("svg",{style:{position:"absolute",width:300*n,height:300*n,opacity:.15*t,animation:"spin 60s linear infinite reverse",pointerEvents:"none"},viewBox:"0 0 100 100",children:s.jsx("polygon",{points:"50,10 90,80 10,80",fill:"none",stroke:"rgba(255, 180, 220, 0.5)",strokeWidth:"0.5"})}),s.jsx("svg",{style:{position:"absolute",width:200*n,height:200*n,opacity:.12*t,animation:"spin 45s linear infinite",pointerEvents:"none"},viewBox:"0 0 100 100",children:s.jsx("polygon",{points:"50,85 10,20 90,20",fill:"none",stroke:"rgba(180, 150, 255, 0.5)",strokeWidth:"0.5"})}),s.jsx("svg",{style:{position:"absolute",width:250*n,height:250*n,opacity:.1*t,animation:"spin 90s linear infinite reverse",pointerEvents:"none"},viewBox:"0 0 100 100",children:s.jsx("polygon",{points:"50,5 93,27.5 93,72.5 50,95 7,72.5 7,27.5",fill:"none",stroke:"rgba(220, 180, 255, 0.4)",strokeWidth:"0.3"})}),s.jsx("div",{style:{width:120,height:120,borderRadius:"50%",background:`radial-gradient(circle at 40% 40%, 
            rgba(255, 200, 230, ${.4*t}) 0%, 
            rgba(200, 150, 220, ${.3*t}) 30%, 
            rgba(140, 100, 180, ${.2*t}) 60%, 
            rgba(80, 50, 120, ${.1*t}) 100%)`,boxShadow:`
            0 0 ${60*t}px rgba(255, 180, 220, ${.4*t}),
            0 0 ${120*t}px rgba(200, 150, 255, ${.3*t}),
            0 0 ${200*t}px rgba(150, 100, 200, ${.2*t}),
            inset 0 0 60px rgba(255, 220, 240, ${.2*t})
          `,transform:`scale(${n})`,transition:"transform 0.5s ease-out, box-shadow 0.5s ease-out",position:"relative",zIndex:10},children:s.jsx("div",{style:{position:"absolute",top:"20%",left:"20%",width:"40%",height:"40%",borderRadius:"50%",background:`radial-gradient(circle, 
              rgba(255, 240, 250, ${.6*t}) 0%, 
              transparent 70%)`}})}),[...Array(12)].map((e,a)=>s.jsx("div",{style:{position:"absolute",width:80+a*10,height:80+a*10,borderRadius:"50%",background:`radial-gradient(circle, 
              rgba(180, 140, 220, ${.03*t}) 0%, 
              transparent 70%)`,left:`${10+a*7%80}%`,top:`${5+a*11%85}%`,animation:`float${a%3} ${20+a*2}s ease-in-out infinite`,pointerEvents:"none"}},`drift-${a}`)),s.jsx("style",{children:`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes float0 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.1); }
          66% { transform: translate(-20px, 10px) scale(0.95); }
        }
        
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-25px, 15px) scale(1.05); }
          66% { transform: translate(15px, -25px) scale(0.9); }
        }
        
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(20px, 25px) scale(0.95); }
          66% { transform: translate(-30px, -15px) scale(1.1); }
        }
      `})]})}w.createRoot(document.getElementById("root")).render(s.jsx(j.StrictMode,{children:s.jsx(k,{})}));
