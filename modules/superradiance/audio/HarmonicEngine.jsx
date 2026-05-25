// EMOTIONAL TARGET: "the sound a nervous system makes when it stops bracing"

import { useEffect, useRef, useState } from 'react'
import * as Tone from 'tone'
import { useAtmosphere } from '../state/atmosphereStore.js'

// Drone layer: three detuned oscillators forming a pad
function buildDroneLayer() {
  const reverb = new Tone.Reverb({ decay: 8, wet: 0.7 }).toDestination()
  const chorus = new Tone.Chorus(0.3, 2, 0.4).connect(reverb).start()
  const filter = new Tone.Filter(400, 'lowpass').connect(chorus)
  const vol    = new Tone.Volume(-24).connect(filter)

  const freqs = [55, 55.3, 82.4, 110.1]  // sub + fifths, slightly detuned
  const oscs = freqs.map(f => {
    const o = new Tone.Oscillator(f, 'sine').connect(vol)
    return o
  })

  return {
    start() { oscs.forEach(o => o.start()) },
    stop()  { oscs.forEach(o => o.stop()) },
    setBrightness(b) {
      // brightness 0–1: open filter, raise volume
      filter.frequency.rampTo(200 + b * 2200, 1.5)
      vol.volume.rampTo(-24 + b * 16, 1.5)
      // detune drifts with intensity — organic instability
      oscs.forEach((o, i) => {
        o.detune.rampTo((i - 1.5) * (4 + b * 12), 2)
      })
    },
    dispose() { oscs.forEach(o => o.dispose()); vol.dispose(); filter.dispose() }
  }
}

// Granular noise bed
function buildNoiseBed() {
  const reverb = new Tone.Reverb({ decay: 12, wet: 0.85 }).toDestination()
  const filter = new Tone.Filter(120, 'bandpass').connect(reverb)
  const vol    = new Tone.Volume(-36).connect(filter)
  const noise  = new Tone.Noise('brown').connect(vol)

  return {
    start() { noise.start() },
    stop()  { noise.stop() },
    setBrightness(b) {
      filter.frequency.rampTo(80 + b * 300, 2)
      vol.volume.rampTo(-36 + b * 14, 2)
    },
    dispose() { noise.dispose(); vol.dispose(); filter.dispose() }
  }
}

// Pulse layer — system heartbeat
function buildPulseLayer() {
  const reverb = new Tone.Reverb({ decay: 3, wet: 0.5 }).toDestination()
  const vol    = new Tone.Volume(-38).connect(reverb)
  const env    = new Tone.AmplitudeEnvelope({ attack: 0.01, decay: 0.3, sustain: 0, release: 0.5 }).connect(vol)
  const osc    = new Tone.Oscillator(55, 'sine').connect(env)

  const loop = new Tone.Loop(time => {
    env.triggerAttackRelease('8n', time)
  }, '4n')

  return {
    start() { osc.start(); loop.start(0) },
    stop()  { loop.stop(); osc.stop() },
    setBrightness(b) {
      vol.volume.rampTo(-38 + b * 20, 1)
      loop.interval = b > 0.6 ? '8n' : b > 0.3 ? '4n' : '2n'
    },
    dispose() { osc.dispose(); env.dispose(); vol.dispose(); loop.dispose() }
  }
}

export default function HarmonicEngine() {
  const audioBrightness = useAtmosphere(s => s.audioBrightness)
  const [started, setStarted] = useState(false)
  const layers = useRef(null)
  const brightnessRef = useRef(audioBrightness)

  // Start audio on first user gesture (browser autoplay policy)
  useEffect(() => {
    async function startAudio() {
      if (started) return
      await Tone.start()
      Tone.getTransport().start()

      const drone = buildDroneLayer()
      const noise = buildNoiseBed()
      const pulse = buildPulseLayer()

      drone.start(); noise.start(); pulse.start()
      layers.current = { drone, noise, pulse }
      setStarted(true)
    }

    window.addEventListener('pointerdown', startAudio, { once: true })
    window.addEventListener('keydown', startAudio, { once: true })
    return () => {
      window.removeEventListener('pointerdown', startAudio)
      window.removeEventListener('keydown', startAudio)
    }
  }, [started])

  // Push brightness to all layers
  useEffect(() => {
    if (!layers.current) return
    const b = audioBrightness
    brightnessRef.current = b
    layers.current.drone.setBrightness(b)
    layers.current.noise.setBrightness(b)
    layers.current.pulse.setBrightness(b)
  }, [audioBrightness])

  // Cleanup
  useEffect(() => {
    return () => {
      if (layers.current) {
        layers.current.drone.dispose()
        layers.current.noise.dispose()
        layers.current.pulse.dispose()
      }
    }
  }, [])

  return null  // pure behavior
}
