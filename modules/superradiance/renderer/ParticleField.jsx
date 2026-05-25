// EMOTIONAL TARGET: "ten thousand souls in toroidal migration — alive, forgetting, returning"

import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAtmosphere } from '../state/atmosphereStore.js'

const PARTICLE_COUNT_DESKTOP = 18000
const PARTICLE_COUNT_MOBILE  = 6000

// Simplex-like noise via sine layers (no import needed, runs on CPU init only)
function noise3(x, y, z) {
  return (
    Math.sin(x * 1.3 + y * 2.7) * 0.5 +
    Math.sin(y * 2.1 + z * 1.7) * 0.3 +
    Math.sin(z * 3.1 + x * 1.1) * 0.2
  )
}

// Toroidal position: distribute particles on/around a torus
function toroidalInit(i, count, R = 2.2, r = 1.0) {
  const u = (i / count) * Math.PI * 2
  const v = Math.random() * Math.PI * 2
  const scatter = (Math.random() - 0.5) * r * 1.4
  const x = (R + Math.cos(v) * r + scatter * Math.cos(v)) * Math.cos(u)
  const y = (Math.sin(v) * r + scatter * Math.sin(v))
  const z = (R + Math.cos(v) * r + scatter * Math.cos(v)) * Math.sin(u)
  return [x, y, z]
}

export default function ParticleField() {
  const meshRef = useRef()
  const isMobile = useAtmosphere(s => s.isMobile)
  const particleCohesion = useAtmosphere(s => s.particleCohesion)
  const presenceIntensity = useAtmosphere(s => s.presenceIntensity)

  const count = isMobile ? PARTICLE_COUNT_MOBILE : PARTICLE_COUNT_DESKTOP

  // Per-particle state stored in Float32Arrays (CPU sim — GPU compute in Phase III)
  const state = useMemo(() => {
    const pos      = new Float32Array(count * 3)
    const vel      = new Float32Array(count * 3)
    const age      = new Float32Array(count)
    const resonance= new Float32Array(count)
    const hue      = new Float32Array(count)
    const cluster  = new Float32Array(count)   // clusterAffinity 0–1

    for (let i = 0; i < count; i++) {
      const [x, y, z] = toroidalInit(i, count)
      pos[i*3]   = x; pos[i*3+1] = y; pos[i*3+2] = z

      // Velocity: tangent to torus + small random
      vel[i*3]   = (Math.random() - 0.5) * 0.01
      vel[i*3+1] = (Math.random() - 0.5) * 0.008
      vel[i*3+2] = (Math.random() - 0.5) * 0.01

      age[i]      = Math.random() * 100
      resonance[i]= Math.random()
      hue[i]      = Math.random()
      cluster[i]  = Math.random()
    }
    return { pos, vel, age, resonance, hue, cluster }
  }, [count])

  // Build BufferGeometry
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(state.pos, 3))
    g.setAttribute('aAge',      new THREE.BufferAttribute(state.age, 1))
    g.setAttribute('aResonance',new THREE.BufferAttribute(state.resonance, 1))
    g.setAttribute('aHue',      new THREE.BufferAttribute(state.hue, 1))
    return g
  }, [state])

  // Shader material — vertex colors driven by age + resonance + hue
  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: /* glsl */`
      attribute float aAge;
      attribute float aResonance;
      attribute float aHue;

      uniform float uTime;
      uniform float uCohesion;
      uniform float uIntensity;

      varying float vResonance;
      varying float vHue;
      varying float vAge;

      void main() {
        vResonance = aResonance;
        vHue = aHue;
        vAge = mod(aAge, 1.0);

        // Slight positional shimmer based on age + noise
        vec3 pos = position;
        float shimmer = sin(aAge * 3.14159 + uTime * 0.3) * 0.02 * uIntensity;
        pos += normalize(pos) * shimmer;

        vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
        // Size: larger when resonating, smaller when dormant
        float sz = mix(0.8, 3.0, aResonance * uIntensity);
        gl_PointSize = sz * (300.0 / -mvPos.z);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: /* glsl */`
      varying float vResonance;
      varying float vHue;
      varying float vAge;

      uniform float uTime;
      uniform float uIntensity;

      // HSL to RGB — inline for GLSL
      vec3 hsl2rgb(float h, float s, float l) {
        vec3 rgb = clamp(abs(mod(h*6.0+vec3(0,4,2),6.0)-3.0)-1.0,0.0,1.0);
        return l + s*(rgb-0.5)*(1.0-abs(2.0*l-1.0));
      }

      void main() {
        // Soft circle
        vec2 uv = gl_PointCoord * 2.0 - 1.0;
        float r = dot(uv, uv);
        if (r > 1.0) discard;
        float alpha = (1.0 - r) * mix(0.3, 0.9, vResonance);

        // Palette drift: void-black → violet → rose → cyan → teal → gold
        // hue 0=rose, 0.25=gold, 0.5=cyan/teal, 0.75=violet
        float h = mod(vHue + uTime * 0.003, 1.0);
        float sat = mix(0.5, 1.0, vResonance * uIntensity);
        float lit = mix(0.25, 0.65, vResonance * uIntensity);
        vec3 col = hsl2rgb(h, sat, lit);

        gl_FragColor = vec4(col * (0.6 + uIntensity * 0.8), alpha);
      }
    `,
    uniforms: {
      uTime:      { value: 0 },
      uCohesion:  { value: 0.5 },
      uIntensity: { value: 0.1 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), [])

  // Simulation loop
  useFrame(({ clock }, delta) => {
    if (!meshRef.current) return
    const t = clock.elapsedTime
    const dt = Math.min(delta, 0.05)   // clamp to avoid spiral on tab restore
    const cohesion = particleCohesion
    const intensity = presenceIntensity
    const { pos, vel, age } = state

    // Update uniforms
    material.uniforms.uTime.value      = t
    material.uniforms.uCohesion.value  = cohesion
    material.uniforms.uIntensity.value = intensity

    // Toroidal center attraction + noise turbulence
    const R = 2.2
    for (let i = 0; i < count; i++) {
      const ix = i*3, iy = i*3+1, iz = i*3+2
      const x = pos[ix], y = pos[iy], z = pos[iz]

      // Toroidal drift: attract toward torus ring
      const len = Math.sqrt(x*x + z*z) + 0.001
      const torusX = (R / len) * x
      const torusZ = (R / len) * z
      const dx = torusX - x
      const dz = torusZ - z
      const dy = -y

      const attract = 0.0004 * cohesion

      // Noise-driven turbulence — organic instability
      const nx = noise3(x * 0.3, y * 0.3, t * 0.1) * 0.003 * (1 - cohesion * 0.7)
      const ny = noise3(y * 0.3, z * 0.3, t * 0.1 + 1.0) * 0.003 * (1 - cohesion * 0.7)
      const nz = noise3(z * 0.3, x * 0.3, t * 0.1 + 2.0) * 0.003 * (1 - cohesion * 0.7)

      vel[ix] += dx * attract + nx
      vel[iy] += dy * attract * 0.5 + ny
      vel[iz] += dz * attract + nz

      // Atmospheric decay — velocity bleeds off
      const decay = 0.985
      vel[ix] *= decay; vel[iy] *= decay; vel[iz] *= decay

      pos[ix] += vel[ix]; pos[iy] += vel[iy]; pos[iz] += vel[iz]

      // Age — particles don't loop, they drift and return organically
      age[i] += dt * 0.4
    }

    geometry.attributes.position.needsUpdate = true
    geometry.attributes.aAge.needsUpdate = true
  })

  return (
    <points ref={meshRef} geometry={geometry} material={material} />
  )
}
