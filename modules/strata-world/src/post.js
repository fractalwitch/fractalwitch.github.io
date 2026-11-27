// Strata World · node post pipeline: MRT normals → GTAO, mip-chain bloom, chromatic aberration, vignette, ACES, FXAA, grain
import * as THREE from 'three/webgpu';
import {saturation,pass,mrt,output,normalView,packNormalToRGB,unpackRGBToNormal,sample,uniform,mix,float,vec2,vec4,uv,length,smoothstep,oneMinus,renderOutput,hash,screenCoordinate} from 'three/tsl';
import {bloom} from 'three/addons/tsl/display/BloomNode.js';
import {ao} from 'three/addons/tsl/display/GTAONode.js';
import {chromaticAberration} from 'three/addons/tsl/display/ChromaticAberrationNode.js';
import {fxaa} from 'three/addons/tsl/display/FXAANode.js';
import {U} from './materials.js';
export function makePost(renderer,scene,camera,quality){
 const K={sat:uniform(1.15),bloom:uniform(.6),aoK:uniform(1),ca:uniform(.4),vig:uniform(.45),grain:uniform(.03)};
 const pp=new THREE.RenderPipeline(renderer),sp=pass(scene,camera);let col,aoNode=null;
 if(quality.gtao){// normals reconstructed from depth: no MRT pass, and batched or displaced meshes can't feed it wrong normals
  aoNode=ao(sp.getTextureNode('depth'),null,camera);aoNode.resolutionScale=.5;aoNode.radius.value=.6;col=sp.getTextureNode('output').mul(mix(float(1),aoNode.getTextureNode().r,K.aoK))}
 else col=sp.getTextureNode('output');
 const bl=bloom(col.min(vec4(5,5,5,1)),1,.5,1.2); /* clamp first: a tiny sun glint at 100x would bloom the whole frame */
 let c=col.add(bl.mul(K.bloom));
 c=chromaticAberration(c,K.ca,vec2(.5,.5),1.02);
 const d=uv().sub(.5);c=c.mul(oneMinus(smoothstep(.25,.95,length(d.mul(vec2(1,.8))).mul(1.4)).mul(K.vig)));
 c=vec4(saturation(c.rgb,K.sat),1);let out=renderOutput(c);if(quality.fxaa)out=fxaa(out);
 pp.outputColorTransform=false;pp.outputNode=out.add(hash(screenCoordinate.x.add(screenCoordinate.y.mul(1931)).add(U.t.mul(60).floor().mul(7919))).sub(.5).mul(K.grain));
 return {pp,K,bloomNode:bl,aoNode};
}
