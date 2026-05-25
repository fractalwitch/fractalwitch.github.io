// EMOTIONAL TARGET: "weather sensing — the room knows you arrived without asking why"

import { useEffect, useRef } from 'react'
import { useAtmosphere } from '../state/atmosphereStore.js'

// Exponential moving average
function ema(prev, next, alpha = 0.15) {
  return prev + alpha * (next - prev)
}

export default function PresenceEngine() {
  const setPresenceSignals = useAtmosphere(s => s.setPresenceSignals)

  const state = useRef({
    lastScrollY:    0,
    lastScrollTime: performance.now(),
    scrollVelocity: 0,
    dwellStart:     performance.now(),
    dwellTime:      0,
    lastMoveTime:   performance.now(),
    cursorDrift:    0,
    lastCursorX:    -1,
    lastCursorY:    -1,
    idleTimer:      0,
    idleStart:      performance.now(),
  })

  useEffect(() => {
    const s = state.current

    function onScroll() {
      const now = performance.now()
      const dt = (now - s.lastScrollTime) / 1000 + 0.001
      const dy = Math.abs(window.scrollY - s.lastScrollY)
      s.scrollVelocity = ema(s.scrollVelocity, dy / dt, 0.25)
      s.lastScrollY    = window.scrollY
      s.lastScrollTime = now
      s.idleStart      = now
    }

    function onMouseMove(e) {
      const now = performance.now()
      if (s.lastCursorX >= 0) {
        const dx = e.clientX - s.lastCursorX
        const dy = e.clientY - s.lastCursorY
        const dist = Math.sqrt(dx*dx + dy*dy)
        s.cursorDrift = ema(s.cursorDrift, dist, 0.2)
      }
      s.lastCursorX = e.clientX
      s.lastCursorY = e.clientY
      s.lastMoveTime = now
      s.idleStart = now
    }

    function onTouch(e) {
      if (e.touches.length > 0) {
        const t = e.touches[0]
        if (s.lastCursorX >= 0) {
          const dx = t.clientX - s.lastCursorX
          const dy = t.clientY - s.lastCursorY
          s.cursorDrift = ema(s.cursorDrift, Math.sqrt(dx*dx+dy*dy), 0.2)
        }
        s.lastCursorX = t.clientX
        s.lastCursorY = t.clientY
        s.idleStart = performance.now()
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('mousemove', onMouseMove, { passive: true })
    window.addEventListener('touchmove', onTouch, { passive: true })

    // Tick: push signals to store every 200ms
    const interval = setInterval(() => {
      const now = performance.now()
      s.dwellTime      = (now - s.dwellStart) / 1000
      s.idleTimer      = (now - s.idleStart) / 1000
      // Natural decay when not moving
      s.scrollVelocity = ema(s.scrollVelocity, 0, 0.08)
      s.cursorDrift    = ema(s.cursorDrift, 0, 0.06)

      setPresenceSignals({
        scrollVelocity: s.scrollVelocity,
        dwellTime:      s.dwellTime,
        cursorDrift:    s.cursorDrift,
        idleSeconds:    s.idleTimer,
      })
    }, 200)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('touchmove', onTouch)
      clearInterval(interval)
    }
  }, [])

  return null  // pure behavior, no DOM
}
