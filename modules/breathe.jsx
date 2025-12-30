import { useState, useEffect } from 'react';

export default function BreatheWithMe() {
  const [breathPhase, setBreathPhase] = useState('inhale');
  const [progress, setProgress] = useState(0);
  const [particles, setParticles] = useState([]);
  const [orbitals, setOrbitals] = useState([]);

  // Breath timing (in ms)
  const phases = {
    inhale: 5000,
    hold: 3000,
    exhale: 7000,
    rest: 2000
  };

  // Initialize particles
  useEffect(() => {
    const newParticles = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      speed: Math.random() * 0.5 + 0.2,
      opacity: Math.random() * 0.4 + 0.2,
      hue: Math.random() * 60 + 280 // purple-pink range
    }));
    setParticles(newParticles);

    const newOrbitals = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      radius: 80 + i * 25,
      speed: 20 + i * 8,
      offset: i * 45,
      opacity: 0.15 - i * 0.015
    }));
    setOrbitals(newOrbitals);
  }, []);

  // Breath cycle
  useEffect(() => {
    const phaseOrder = ['inhale', 'hold', 'exhale', 'rest'];
    let currentIndex = 0;
    let startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const currentPhase = phaseOrder[currentIndex];
      const phaseDuration = phases[currentPhase];
      const phaseProgress = Math.min(elapsed / phaseDuration, 1);
      
      setBreathPhase(currentPhase);
      setProgress(phaseProgress);

      if (elapsed >= phaseDuration) {
        currentIndex = (currentIndex + 1) % phaseOrder.length;
        startTime = Date.now();
      }

      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Calculate orb scale based on breath phase
  const getOrbScale = () => {
    switch (breathPhase) {
      case 'inhale':
        return 1 + progress * 0.4;
      case 'hold':
        return 1.4;
      case 'exhale':
        return 1.4 - progress * 0.4;
      case 'rest':
        return 1;
      default:
        return 1;
    }
  };

  const orbScale = getOrbScale();
  const glowIntensity = breathPhase === 'hold' ? 1 : 
                        breathPhase === 'inhale' ? 0.6 + progress * 0.4 :
                        breathPhase === 'exhale' ? 1 - progress * 0.4 : 0.6;

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'radial-gradient(ellipse at center, #1a0a2e 0%, #0d0515 50%, #050208 100%)',
      overflow: 'hidden',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      
      {/* Floating particles */}
      {particles.map(p => {
        const yOffset = breathPhase === 'inhale' ? -progress * 15 :
                       breathPhase === 'exhale' ? progress * 10 : 0;
        const scaleBoost = breathPhase === 'hold' ? 1.3 : 1;
        
        return (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size * scaleBoost,
              height: p.size * scaleBoost,
              borderRadius: '50%',
              background: `hsla(${p.hue}, 70%, 70%, ${p.opacity * glowIntensity})`,
              boxShadow: `0 0 ${p.size * 2}px hsla(${p.hue}, 80%, 60%, ${p.opacity * 0.5})`,
              transform: `translateY(${yOffset}px)`,
              transition: 'transform 2s ease-out, width 1s ease, height 1s ease',
              pointerEvents: 'none'
            }}
          />
        );
      })}

      {/* Orbital rings */}
      {orbitals.map(o => (
        <div
          key={o.id}
          style={{
            position: 'absolute',
            width: o.radius * 2 * orbScale,
            height: o.radius * 2 * orbScale,
            border: `1px solid rgba(200, 150, 255, ${o.opacity * glowIntensity})`,
            borderRadius: '50%',
            animation: `spin ${o.speed}s linear infinite`,
            transform: `rotate(${o.offset}deg)`,
            pointerEvents: 'none'
          }}
        />
      ))}

      {/* Sacred geometry - outer triangle */}
      <svg
        style={{
          position: 'absolute',
          width: 300 * orbScale,
          height: 300 * orbScale,
          opacity: 0.15 * glowIntensity,
          animation: 'spin 60s linear infinite reverse',
          pointerEvents: 'none'
        }}
        viewBox="0 0 100 100"
      >
        <polygon
          points="50,10 90,80 10,80"
          fill="none"
          stroke="rgba(255, 180, 220, 0.5)"
          strokeWidth="0.5"
        />
      </svg>

      {/* Sacred geometry - inner triangle (inverted) */}
      <svg
        style={{
          position: 'absolute',
          width: 200 * orbScale,
          height: 200 * orbScale,
          opacity: 0.12 * glowIntensity,
          animation: 'spin 45s linear infinite',
          pointerEvents: 'none'
        }}
        viewBox="0 0 100 100"
      >
        <polygon
          points="50,85 10,20 90,20"
          fill="none"
          stroke="rgba(180, 150, 255, 0.5)"
          strokeWidth="0.5"
        />
      </svg>

      {/* Hexagon */}
      <svg
        style={{
          position: 'absolute',
          width: 250 * orbScale,
          height: 250 * orbScale,
          opacity: 0.1 * glowIntensity,
          animation: 'spin 90s linear infinite reverse',
          pointerEvents: 'none'
        }}
        viewBox="0 0 100 100"
      >
        <polygon
          points="50,5 93,27.5 93,72.5 50,95 7,72.5 7,27.5"
          fill="none"
          stroke="rgba(220, 180, 255, 0.4)"
          strokeWidth="0.3"
        />
      </svg>

      {/* Central orb */}
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: `radial-gradient(circle at 40% 40%, 
            rgba(255, 200, 230, ${0.4 * glowIntensity}) 0%, 
            rgba(200, 150, 220, ${0.3 * glowIntensity}) 30%, 
            rgba(140, 100, 180, ${0.2 * glowIntensity}) 60%, 
            rgba(80, 50, 120, ${0.1 * glowIntensity}) 100%)`,
          boxShadow: `
            0 0 ${60 * glowIntensity}px rgba(255, 180, 220, ${0.4 * glowIntensity}),
            0 0 ${120 * glowIntensity}px rgba(200, 150, 255, ${0.3 * glowIntensity}),
            0 0 ${200 * glowIntensity}px rgba(150, 100, 200, ${0.2 * glowIntensity}),
            inset 0 0 60px rgba(255, 220, 240, ${0.2 * glowIntensity})
          `,
          transform: `scale(${orbScale})`,
          transition: 'transform 0.5s ease-out, box-shadow 0.5s ease-out',
          position: 'relative',
          zIndex: 10
        }}
      >
        {/* Inner glow core */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '20%',
            width: '40%',
            height: '40%',
            borderRadius: '50%',
            background: `radial-gradient(circle, 
              rgba(255, 240, 250, ${0.6 * glowIntensity}) 0%, 
              transparent 70%)`,
          }}
        />
      </div>

      {/* Ambient drift particles (larger, slower) */}
      {[...Array(12)].map((_, i) => (
        <div
          key={`drift-${i}`}
          style={{
            position: 'absolute',
            width: 80 + i * 10,
            height: 80 + i * 10,
            borderRadius: '50%',
            background: `radial-gradient(circle, 
              rgba(180, 140, 220, ${0.03 * glowIntensity}) 0%, 
              transparent 70%)`,
            left: `${10 + (i * 7) % 80}%`,
            top: `${5 + (i * 11) % 85}%`,
            animation: `float${i % 3} ${20 + i * 2}s ease-in-out infinite`,
            pointerEvents: 'none'
          }}
        />
      ))}

      <style>{`
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
      `}</style>
    </div>
  );
}
