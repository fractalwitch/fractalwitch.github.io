// EMOTIONAL TARGET: "the nervous system of a living weather system"

import { create } from 'zustand'

export const PresenceState = {
  DORMANT:    'DORMANT',
  LISTENING:  'LISTENING',
  WARMING:    'WARMING',
  RESONATING: 'RESONATING',
  OVERDRIVE:  'OVERDRIVE',
  DISSOLVING: 'DISSOLVING',
  SETTLING:   'SETTLING',
}

const defaults = {
  // renderer capability
  webgpuSupported: false,
  isMobile: false,

  // presence
  presenceState: PresenceState.DORMANT,
  presenceIntensity: 0,       // 0–1 smooth scalar
  scrollVelocity: 0,
  dwellTime: 0,
  cursorDrift: 0,
  idleSeconds: 0,

  // atmospheric outputs — downstream systems read these
  bloomIntensity: 0.4,
  particleCohesion: 0.5,      // 0 = dispersed, 1 = tightly clustered
  audioBrightness: 0.1,       // 0–1 maps to harmonic spectrum weight

  // memory field (session-level)
  visitCount: parseInt(sessionStorage.getItem('sr_visits') || '0'),
}

export const useAtmosphere = create((set, get) => ({
  ...defaults,

  setCapabilities: (webgpuSupported, isMobile) =>
    set({ webgpuSupported, isMobile }),

  setPresenceSignals: (signals) => {
    const { scrollVelocity, dwellTime, cursorDrift, idleSeconds } = { ...get(), ...signals }
    const state = derivePresenceState(scrollVelocity, dwellTime, cursorDrift, idleSeconds)
    const intensity = deriveIntensity(state)
    set({
      ...signals,
      presenceState: state,
      presenceIntensity: intensity,
      bloomIntensity:    lerp(0.2, 1.8, intensity),
      particleCohesion:  lerp(0.2, 0.9, intensity),
      audioBrightness:   lerp(0.02, 0.85, intensity),
    })
  },

  incrementVisit: () => {
    const n = get().visitCount + 1
    sessionStorage.setItem('sr_visits', n)
    set({ visitCount: n })
  },
}))

function derivePresenceState(scroll, dwell, drift, idle) {
  if (idle > 30)                        return PresenceState.DORMANT
  if (idle > 8)                         return PresenceState.SETTLING
  if (scroll > 800)                     return PresenceState.OVERDRIVE
  if (scroll > 400)                     return PresenceState.RESONATING
  if (dwell > 6 && drift < 20)          return PresenceState.DISSOLVING
  if (dwell > 2 || drift > 60)          return PresenceState.WARMING
  if (scroll > 0 || drift > 10)         return PresenceState.LISTENING
  return PresenceState.DORMANT
}

function deriveIntensity(state) {
  return {
    [PresenceState.DORMANT]:    0.0,
    [PresenceState.LISTENING]:  0.2,
    [PresenceState.WARMING]:    0.4,
    [PresenceState.RESONATING]: 0.65,
    [PresenceState.OVERDRIVE]:  1.0,
    [PresenceState.DISSOLVING]: 0.55,
    [PresenceState.SETTLING]:   0.15,
  }[state] ?? 0
}

function lerp(a, b, t) { return a + (b - a) * Math.min(1, Math.max(0, t)) }
