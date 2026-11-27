// Material seeds: a look (the 16 numbers of the surface model) plus a behaviour. Every asset in every world is drawn from one of these.
const SEED_LIB={
 eyegoo:  {a:'#9b2fe6',b:'#e6c8ff',sss:'#b040ff',gloss:.9, metal:0,pore:0, film:420,filmK:.18,emit:.02,coat:1},
 gold:    {a:'#f6c050',b:'#fff0b0',sss:'#000000',gloss:.88,metal:1,pore:0, film:0,  filmK:0,  emit:.35,coat:0},
 crystal: {a:'#ff4fa8',b:'#ffffff',sss:'#ff9fd8',gloss:1,  metal:0,pore:0, film:0,  filmK:0,  emit:.55,coat:1},
 oil:     {a:'#24083e',b:'#ff8a3a',sss:'#000000',gloss:.94,metal:0,pore:0, film:0,  filmK:.9, emit:.28,coat:1},
 slime:   {a:'#9b2cff',b:'#ffffff',sss:'#7a20d8',gloss:.95,metal:0,pore:0, film:380,filmK:.12,emit:.03,coat:1},
 lime:    {a:'#b4ec34',b:'#2e5a0c',sss:'#5a8a10',gloss:.35, metal:0,pore:1, film:0,  filmK:0,  emit:0,  coat:0},
 foam:    {a:'#f4f2ff',b:'#3040b0',sss:'#c8d8ff',gloss:.4, metal:0,pore:.6,film:0,  filmK:0,  emit:.05,coat:0},
 pearl:   {a:'#fbe6f0',b:'#ff9fd0',sss:'#ffc8e0',gloss:.72,metal:0,pore:0, film:360,filmK:.3, emit:.45,coat:.5},
 sea:     {a:'#0a8a9a',b:'#62e6d6',sss:'#0fb0a8',gloss:.96,metal:0,pore:0, film:0,  filmK:0,  emit:0,  coat:1},
 soap:    {a:'#ffffff',b:'#ffffff',sss:'#000000',gloss:1,  metal:0,pore:0, film:520,filmK:1,  emit:0,  coat:1},
 obsidian:{a:'#170a22',b:'#ff3f8f',sss:'#40104a',gloss:.97,metal:0,pore:0, film:620,filmK:.28,emit:.02,coat:1},
 chrome:  {a:'#e8e0ff',b:'#ffffff',sss:'#000000',gloss:.9, metal:1,pore:0, film:300,filmK:.35,emit:0,  coat:0}
};
const SEED_KEYS=[['a','colour','color'],['b','accent','color'],['sss','glow-through','color'],['gloss','gloss',0,1,.01],['metal','metal',0,1,.01],['pore','pores',0,1,.01],['film','film nm',0,900,10],['filmK','film mix',0,1.2,.01],['emit','emissive',0,1.5,.01],['coat','coat',0,1,.01]];
const WORLDS={
 reef:{name:'Eyebloom Reef',layout:'reef',seed:7,
  seeds:{skin:'eyegoo',nub:'eyegoo',coral:'gold',heart:'crystal',drip:'eyegoo',pool:'oil',bubble:'soap'},
  palette:{bulb:['#7a22c8','#8a2ad6','#6c1cb8','#9230e0','#7e26cc'],heart:['#ff4fa8','#3fe6ff','#ffd04a','#ff7ad9','#c070ff'],glow:'#ff9ae8',cyan:'#30cfee',frond:['#c8a8ff','#a8c8ff','#d0a0ff'],
   irisA:'#b45cff',irisB:'#32d0ff',sclera:'#d2bff2',hole:'#1b2a8a',poolSkin:'#7a1fc0',bubble:['#c070ff','#ffffff','#70e0ff'],
   skyA:'#030108',skyB:'#0e0420',skyC:'#4a1478',sun:'#ffe8ff',fill:'#46c8ff',amb0:'#2c1248',amb1:'#0c0416',fog:'#090314',spA:'#ffc8ff',spB:'#a6ecff',pulse:'#ff6ff0'},
  light:{sun:[-.45,.6,.66],key:1.6,fill:[.62,.4,-.68],fillK:.75},
  counts:{bulbs:84,coral:26,strands:20,poolEyes:13,fronds:8,sparkles:460,bubbles:9},
  post:{bloom:.6,thresh:1.6,ca:.4,expo:1,vig:.5,grain:.03,sat:1.18,rays:0},
  motion:{drip:1,wobble:1,flow:1,stare:1,glit:1},atmos:{fogD:.012,fogH:.08},
  camera:{target:[0,2.6,.4],dist:8,yaw:0,pitch:.04,fov:.9},spark:{c:[0,3.6,-.5],s:[24,11,15]}},
 coast:{name:'Heart Coast',layout:'coast',seed:11,
  seeds:{rock:'lime',goo:'slime',blob:'slime',ball:'slime',heart:'crystal',foam:'foam',eyeskin:'foam',spire:'pearl',arch:'pearl',drip:'slime',sea:'sea',bubble:'soap'},
  palette:{goo:['#9b2cff','#2ad0dc','#b8e636'],blob:['#8a1ef0','#7a18d8','#9a2cff','#8420e6','#24c4d0'],ball:['#2ad4dc','#a43cff','#ff5ab4','#45e0c0'],heart:['#a43cff','#ff3f8f','#ff6fb0','#2ad4dc','#c85cff'],bigHeart:['#ff2f6a','#ff4f8f','#e8205a'],
   spire:'#fbe8f2',bridge:'#ffa6d6',foam:'#f6f4ff',cloud:['#ff5a9a','#ff7a7a','#f04aa0','#ff8ab0'],glow:'#ffd0e8',sand:'#f2d4a0',bubble:['#b060ff','#40e0ff','#ffffff'],
   irisA:'#ff6ad0',irisB:'#3a86ff',sclera:'#f8f2ff',hole:'#2a3a9a',
   skyA:'#ff8a2a',skyB:'#ff3f86',skyC:'#a0186e',sun:'#fff0c8',fill:'#fff0f6',amb0:'#6a5a8a',amb1:'#2a1438',fog:'#ff7aa6',spA:'#ffffff',spB:'#ffd6f0',pulse:'#ff8fe0'},
  light:{sun:[.26,.27,-.93],key:1.3,fill:[-.38,.55,.74],fillK:.95},
  counts:{gooBlobs:16,drape:30,strands:90,foam:70,foamEyes:34,spires:7,arches:7,palaces:6,clouds:13,sparkles:520,bubbles:13},
  post:{bloom:.6,thresh:1.5,ca:.45,expo:.95,vig:.35,grain:.03,sat:1.28,rays:.7},
  motion:{drip:1,wobble:1,flow:1,stare:1,glit:1},atmos:{fogD:.0024,fogH:.05},
  camera:{target:[-1,2.4,-6],dist:16,yaw:-.06,pitch:.1,fov:.86},spark:{c:[3,9,-16],s:[52,22,42]}},
 jelly:{name:'Jelly Abyss',layout:'reef',seed:42,base:'reef',
  seeds:{skin:'slime',nub:'slime',coral:'chrome',heart:'crystal',drip:'slime',pool:'oil',bubble:'soap'},
  palette:{bulb:['#16c8d8','#22a6e8','#14d6b8','#3a7cf0'],heart:['#ffd04a','#ff4fa8','#ffffff'],glow:'#9ffcff',cyan:'#ff5ab4',frond:['#9ffcff','#ffffff'],
   irisA:'#ffd04a',irisB:'#ff3fa0',sclera:'#eafcff',hole:'#08305a',poolSkin:'#0a6a8a',bubble:['#70f0ff','#ffffff'],
   skyA:'#01060c',skyB:'#021a2c',skyC:'#0a5a78',sun:'#e8fbff',fill:'#ff6ad0',amb0:'#0d4a60',amb1:'#020a12',fog:'#020c16',spA:'#c8fcff',spB:'#ffc8f0',pulse:'#5affef'},
  seedOver:{pool:{a:'#04263a',filmK:.75},skin:{sss:'#20e0ff'}}},
 valentine:{name:'Obsidian Valentine',layout:'coast',seed:23,base:'coast',
  seeds:{rock:'lime',goo:'obsidian',blob:'obsidian',ball:'obsidian',heart:'crystal',foam:'foam',eyeskin:'foam',spire:'chrome',arch:'pearl',drip:'obsidian',sea:'sea',bubble:'soap'},
  palette:{goo:['#1a0a24','#ff2f7a','#3a0f50'],blob:['#1a0a24','#2a0f3a','#14081c','#ff2f7a'],ball:['#ffd04a','#ff2f7a','#1a0a24'],heart:['#ffd04a','#ff2f7a','#ff5ab4'],bigHeart:['#ff1f5a','#ffd04a'],
   spire:'#2a1a34',bridge:'#ffd04a',foam:'#ffe8f0',cloud:['#ff4f6a','#ff7a5a','#c8306a'],glow:'#ffd08a',sand:'#4a2030',bubble:['#ff4f8f','#ffd04a'],
   irisA:'#ffd04a',irisB:'#ff1f5a',sclera:'#fff4f0',hole:'#3a0a20',
   skyA:'#ff6a3a',skyB:'#d8285a',skyC:'#4a0a3a',sun:'#ffe0a0',fill:'#ff9ab8',amb0:'#c04a7a',amb1:'#2a0a2a',fog:'#c84a6a',spA:'#ffe8b0',spB:'#ff8fb0',pulse:'#ffd04a'},
  seedOver:{rock:{a:'#b0284f',b:'#2a0618',sss:'#300010'},sea:{a:'#3a0a5a',b:'#c03a8a',sss:'#6a1a7a'},spire:{a:'#2a1a34'}},
  post:{bloom:.9,thresh:1.1,ca:.7,expo:1.05,vig:.4,grain:.035,sat:1.1,rays:.9}}
};
// knobs: [group,key,label,min,max,step,rebuild]
const KNOBS=[
 ['post','bloom','Bloom',0,2.5,.01],['post','thresh','Bloom threshold',.3,3,.01],['post','ca','Chromatic aberration',0,3,.01],['post','expo','Exposure',.4,2,.01],
 ['post','sat','Saturation',0,1.8,.01],['post','vig','Vignette',0,1,.01],['post','grain','Grain',0,.12,.005],['post','rays','God rays',0,2,.01],
 ['motion','drip','Drip length',0,2.5,.01],['motion','wobble','Goo wobble',0,2.5,.01],['motion','flow','Liquid flow',0,3,.01],['motion','stare','Stare at viewer',0,1,.01],['motion','glit','Glitter',0,3,.01],
 ['atmos','fogD','Fog density',0,.05,.0005],['atmos','fogH','Fog height falloff',0,.3,.005],
 ['light','key','Key light',0,3,.01],['light','fillK','Fill light',0,3,.01],
 ['camera','dist','Camera distance',6,40,.1],['camera','fov','Field of view',.4,1.4,.01],
 ['counts','sparkles','Sparkles',0,600,10],['counts','bubbles','Bubbles',0,40,1],
 ['counts','bulbs','Eye-bulbs',10,160,1,1],['counts','poolEyes','Pool eyes',0,16,1,1],['counts','strands','Drips',0,140,1,1]
];
export {SEED_LIB,SEED_KEYS,WORLDS};
