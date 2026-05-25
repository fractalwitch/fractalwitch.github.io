// EMOTIONAL TARGET: "arriving somewhere you have always been"

import React, { useEffect } from 'react'
import Scene from './renderer/Scene.jsx'
import PresenceEngine from './presence/PresenceEngine.jsx'
import HarmonicEngine from './audio/HarmonicEngine.jsx'
import { useAtmosphere, PresenceState } from './state/atmosphereStore.js'

// Minimal overlay — state debug in dev, presence hint in prod
function Overlay() {
  const state   = useAtmosphere(s => s.presenceState)
  const webgpu  = useAtmosphere(s => s.webgpuSupported)
  const isDev   = import.meta.env.DEV

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      left: '50%',
      transform: 'translateX(-50%)',
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      letterSpacing: '0.15em',
      color: 'rgba(255,255,255,0.18)',
      pointerEvents: 'none',
      userSelect: 'none',
      zIndex: 10,
      textAlign: 'center',
    }}>
      {isDev
        ? `${state} · ${webgpu ? 'WebGPU' : 'WebGL2'}`
        : state === PresenceState.DORMANT ? 'move through / touch / breathe' : ''
      }
    </div>
  )
}

export default function Superradiance() {
  // Prevent body scroll — canvas is the world
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <>
      {/* Behavior layers — no DOM output */}
      <PresenceEngine />
      <HarmonicEngine />

      {/* Visual layer */}
      <Scene />

      {/* Minimal presence hint */}
      <Overlay />
    </>
  )
}
