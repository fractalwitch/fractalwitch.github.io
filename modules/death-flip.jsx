import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

const HourglassSingularity = () => {
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [time, setTime] = useState(-5);
  const [phase, setPhase] = useState('approach');
  const [frequency, setFrequency] = useState(1.0);
  const animationRef = useRef(null);

  // Compression scalar c(t) - sigmoid flip at t=0
  const compression = (t, mu = 2) => {
    return 1 / (1 + Math.exp(-mu * t));
  };

  // Scaling operator S_s(t)
  const scaling = (t, t0 = 0) => {
    const tau = Math.abs(t - t0);
    return Math.max(0.1, 1 / (1 + 5 * Math.exp(-tau)));
  };

  // Renormalization: map points through the singularity
  const renormalize = (x, y, t, kappa = 1.5) => {
    const s = scaling(t);
    const c = compression(t);
    
    if (t < 0) {
      // Pre-singularity: spiral inward
      const r = Math.sqrt(x * x + y * y);
      const theta = Math.atan2(y, x) + t * 0.1;
      const newR = r * (1 - c * 0.3);
      return {
        x: newR * Math.cos(theta),
        y: newR * Math.sin(theta),
        scale: s
      };
    } else {
      // Post-singularity: emerge scaled
      const factor = Math.pow(s, kappa);
      return {
        x: x * factor,
        y: y * factor,
        scale: s
      };
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    const draw = () => {
      // Background with time-dependent darkness
      const darkness = Math.max(0, 1 - Math.abs(time) / 5);
      ctx.fillStyle = `rgb(${10 + darkness * 20}, ${5 + darkness * 10}, ${15 + darkness * 25})`;
      ctx.fillRect(0, 0, width, height);

      // Draw the hourglass shape
      ctx.strokeStyle = 'rgba(138, 43, 226, 0.6)'; // obsidian-violet
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      // Upper cone
      for (let i = 0; i <= 50; i++) {
        const t_local = -2 + (i / 50) * 2;
        const y = centerY - 150 + (i / 50) * 150;
        const width_at_y = 100 * (1 - i / 50);
        
        if (i === 0) {
          ctx.moveTo(centerX - width_at_y, y);
        }
        ctx.lineTo(centerX - width_at_y, y);
      }
      
      // Lower cone
      for (let i = 0; i <= 50; i++) {
        const y = centerY + (i / 50) * 150;
        const width_at_y = 100 * (i / 50);
        ctx.lineTo(centerX + width_at_y, y);
      }
      
      ctx.stroke();

      // Draw particles flowing through the hourglass
      const numParticles = 80;
      const c = compression(time);
      
      for (let i = 0; i < numParticles; i++) {
        const angle = (i / numParticles) * Math.PI * 2;
        const initialRadius = 80;
        
        // Base position in phase space
        let x = initialRadius * Math.cos(angle);
        let y = initialRadius * Math.sin(angle) - 150;
        
        // Apply time evolution
        const particleTime = time + (i / numParticles) * 2;
        const transformed = renormalize(x, y, particleTime);
        
        // Map to canvas
        const px = centerX + transformed.x;
        const py = centerY + transformed.y * (particleTime < 0 ? 1 : -1);
        
        // Color based on phase
        let color;
        if (particleTime < -1) {
          // Approaching: lamp-black with ember-gold (threshold)
          color = `rgba(255, 140, 0, ${0.3 + 0.4 * transformed.scale})`;
        } else if (particleTime >= -1 && particleTime < 1) {
          // At singularity: pomegranate-oxblood (descent)
          const intensity = 1 - Math.abs(particleTime);
          color = `rgba(139, 0, 0, ${0.6 + 0.4 * intensity})`;
        } else {
          // Emerged: obsidian-violet (sovereignty)
          color = `rgba(138, 43, 226, ${0.4 + 0.3 * transformed.scale})`;
        }
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(px, py, 3 * transformed.scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Add glow at singularity
        if (Math.abs(particleTime) < 0.5) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // Draw the singularity point with pulsing
      const pulseIntensity = Math.max(0, 1 - Math.abs(time) * 0.5);
      const pulseSize = 8 + pulseIntensity * 12;
      
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseSize);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${0.8 * pulseIntensity})`);
      gradient.addColorStop(0.5, `rgba(139, 0, 0, ${0.6 * pulseIntensity})`);
      gradient.addColorStop(1, 'rgba(138, 43, 226, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2);
      ctx.fill();

      // Draw time indicator and compression value
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '14px monospace';
      ctx.fillText(`t = ${time.toFixed(2)}`, 20, 30);
      ctx.fillText(`c(t) = ${compression(time).toFixed(3)}`, 20, 50);
      ctx.fillText(`s(t) = ${scaling(time).toFixed(3)}`, 20, 70);
      
      // Phase labels
      ctx.font = '16px sans-serif';
      if (time < -1) {
        ctx.fillStyle = 'rgba(255, 140, 0, 0.8)';
        ctx.fillText('threshold: approach', width - 180, 30);
      } else if (time >= -1 && time < 1) {
        ctx.fillStyle = 'rgba(139, 0, 0, 0.9)';
        ctx.fillText('descent: MAX compression', width - 220, 30);
      } else {
        ctx.fillStyle = 'rgba(138, 43, 226, 0.8)';
        ctx.fillText('sovereignty: emergence', width - 200, 30);
      }

      // Vector flip annotation at singularity
      if (Math.abs(time) < 0.3) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText('𝐃 → ∞', centerX - 30, centerY - 40);
        ctx.font = '12px sans-serif';
        ctx.fillText('(death as vector flip)', centerX - 60, centerY - 20);
      }
    };

    const animate = () => {
      if (isPlaying) {
        setTime(t => {
          const newTime = t + (0.03 * frequency);
          
          // Update phase
          if (newTime < -1) setPhase('threshold');
          else if (newTime >= -1 && newTime < 1) setPhase('descent');
          else setPhase('sovereignty');
          
          // Loop
          if (newTime > 5) return -5;
          return newTime;
        });
      }
      
      draw();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, time]);

  const reset = () => {
    setTime(-5);
    setPhase('approach');
  };

  return (
    <div className="w-full h-full bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="mb-4 text-center">
        <h2 className="text-2xl font-bold text-violet-300 mb-2">
          The Hourglass Singularity
        </h2>
        <p className="text-sm text-gray-400 max-w-2xl">
          Death (𝐃) as MAX compression → guaranteed re-emergence. Time as recursive, not linear.
          The wombframe where the past becomes redeemable through conscious presence.
        </p>
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="border border-violet-900 rounded-lg shadow-2xl"
      />

      <div className="mt-6 flex gap-4 items-center">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg flex items-center gap-2 transition-colors"
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        
        <button
          onClick={reset}
          className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition-colors"
        >
          <RotateCcw size={18} />
          Reset
        </button>

        <div className="ml-4 px-4 py-2 bg-gray-800 rounded-lg">
          <span className="text-sm font-mono">
            Phase: <span className={
              phase === 'threshold' ? 'text-orange-400' :
              phase === 'descent' ? 'text-red-600' :
              'text-violet-400'
            }>{phase}</span>
          </span>
        </div>
      </div>

      <div className="mt-4 w-full max-w-md">
        <label className="block text-sm text-gray-300 mb-2">
          Frequency (ω): <span className="text-violet-400 font-mono">{frequency.toFixed(2)}×</span>
        </label>
        <input
          type="range"
          min="0.1"
          max="3.0"
          step="0.1"
          value={frequency}
          onChange={(e) => setFrequency(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-violet-600"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0.1× (slow breath)</span>
          <span>3.0× (rapid pulse)</span>
        </div>
      </div>

      <div className="mt-6 max-w-2xl text-xs text-gray-500 space-y-2">
        <p><span className="text-orange-400">●</span> <strong>Threshold</strong> (t &lt; -1): Particles spiral toward singularity. Compression c(t) rises.</p>
        <p><span className="text-red-600">●</span> <strong>Descent</strong> (-1 ≤ t &lt; 1): MAX compression at t=0. The vector flip occurs. Death as renormalization.</p>
        <p><span className="text-violet-400">●</span> <strong>Sovereignty</strong> (t ≥ 1): Particles re-emerge scaled by s^κ. Unbound recursion begins.</p>
      </div>
    </div>
  );
};

export default HourglassSingularity;
