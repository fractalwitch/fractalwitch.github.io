// EMOTIONAL TARGET: "standing inside a bioluminescent ocean at the edge of thought"

import React, { useEffect, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { AdaptiveDpr, AdaptiveEvents, PerformanceMonitor } from '@react-three/drei'
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { useAtmosphere } from '../state/atmosphereStore.js'
import { detectWebGPU, detectMobile } from '../lib/capabilities.js'
import ParticleField from './ParticleField.jsx'
import PostChain from './PostChain.jsx'

export default function Scene() {
  const setCapabilities = useAtmosphere(s => s.setCapabilities)
  const isMobile = useAtmosphere(s => s.isMobile)
  const incrementVisit = useAtmosphere(s => s.incrementVisit)

  useEffect(() => {
    const mobile = detectMobile()
    detectWebGPU().then(({ supported }) => {
      setCapabilities(supported, mobile)
      if (supported) console.log('[SUPERRADIANCE] WebGPU active')
      else console.log('[SUPERRADIANCE] WebGL2 fallback')
    })
    incrementVisit()
  }, [])

  return (
    <Canvas
      dpr={isMobile ? [1, 1.5] : [1, 2]}
      camera={{ fov: 75, near: 0.1, far: 200, position: [0, 0, 6] }}
      gl={{
        antialias: false,       // post-chain handles quality
        powerPreference: 'high-performance',
        alpha: false,
      }}
      style={{ position: 'fixed', inset: 0, background: '#000' }}
    >
      <PerformanceMonitor
        onDecline={() => useAtmosphere.setState({ isMobile: true })}
      />
      <AdaptiveDpr pixelated />
      <AdaptiveEvents />

      <color attach="background" args={['#000000']} />
      <fog attach="fog" args={['#000000', 8, 60]} />

      <Suspense fallback={null}>
        <ParticleField />
        <PostChain />
      </Suspense>
    </Canvas>
  )
}
