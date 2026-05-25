// EMOTIONAL TARGET: "memory bleeding through emulsion — light that remembers being touched"

import React from 'react'
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing'
import { BlendFunction, KernelSize } from 'postprocessing'
import { useAtmosphere } from '../state/atmosphereStore.js'

export default function PostChain() {
  const bloomIntensity = useAtmosphere(s => s.bloomIntensity)

  return (
    <EffectComposer multisampling={0}>
      {/* Selective bloom — only emissive surfaces bloom */}
      <Bloom
        intensity={bloomIntensity}
        luminanceThreshold={0.15}
        luminanceSmoothing={0.9}
        kernelSize={KernelSize.LARGE}
        mipmapBlur
      />
      {/* Film grain — organic texture layer */}
      <Noise
        blendFunction={BlendFunction.SOFT_LIGHT}
        opacity={0.08}
      />
      {/* Edge vignette — draws presence toward center */}
      <Vignette
        offset={0.3}
        darkness={0.7}
        eskil={false}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  )
}
