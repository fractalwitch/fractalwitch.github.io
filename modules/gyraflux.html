import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Activity, Zap, Heart, Eye } from 'lucide-react';

const GyrafluxSimulation = () => {
  const canvasRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [mode, setMode] = useState('threshold'); // threshold, descent, sovereignty
  
  // State vectors
  const [ringState, setRingState] = useState({
    x: 0, y: 0, z: 0,
    vx: 0, vy: 0, vz: 0,
    omega: 0,
    E: 50,
    phi: 0.5
  });
  
  const [metrics, setMetrics] = useState({
    rho_n: 0.5,
    G: 1.0,
    lambda_clip: 0,
    breath_phase: 0
  });
  
  const [forceInput, setForceInput] = useState({ x: 0, y: 0 });
  const [breathSync, setBreathSync] = useState(false);
  
  // Physical constants
  const LAMBDA_MAX = 10;
  const G0 = 1.0;
  const SIGMA = 2.0;
  const ETA = 0.5;
  const GAMMA = 0.3;
  const BETA = 1.5;
  
  // Lattice field state
  const [latticeField, setLatticeField] = useState(() => {
    const field = [];
    for (let i = 0; i < 20; i++) {
      const row = [];
      for (let j = 0; j < 20; j++) {
        row.push(Math.random() * 0.3);
      }
      field.push(row);
    }
    return field;
  });

  // Compute reciprocity
  const computeRhoN = (ringState, envState, breathPhase) => {
    const sA = Math.sqrt(ringState.E) * (breathSync ? 1.5 : 1.0);
    const sB = envState;
    const breathBonus = breathSync ? 0.3 * Math.cos(breathPhase) : 0;
    return Math.max(0, Math.min(1, (sA * sB) / (sA + sB + 1) + breathBonus));
  };

  // Lambda projection
  const projectLambda = (fx, fy) => {
    const mag = Math.sqrt(fx * fx + fy * fy);
    if (mag <= LAMBDA_MAX) return { fx, fy, clipped: 0 };
    const scale = LAMBDA_MAX / mag;
    return {
      fx: fx * scale,
      fy: fy * scale,
      clipped: (mag - LAMBDA_MAX) / LAMBDA_MAX
    };
  };

  // Generosity function
  const computeG = (rho_n) => {
    return Math.min(3.0, G0 * (1 + SIGMA * rho_n));
  };

  // Energy dynamics
  const updateEnergy = (E, G, work, clipRatio, breathPhase, dt) => {
    const P_in = 0.5 * G * work + (breathSync ? BETA * Math.cos(breathPhase) : 0);
    const P_out = GAMMA * E + clipRatio * E;
    return Math.max(0, E + (P_in - P_out) * dt);
  };

  // Update lattice field based on ring position and reciprocity
  const updateLatticeField = (x, y, rho_n, E) => {
    setLatticeField(prev => {
      const next = prev.map(row => [...row]);
      const cx = Math.floor((x + 200) / 20);
      const cy = Math.floor((y + 200) / 20);
      
      for (let i = 0; i < 20; i++) {
        for (let j = 0; j < 20; j++) {
          const dx = i - cx;
          const dy = j - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const influence = E * rho_n * Math.exp(-dist / 3) / 100;
          next[i][j] = Math.max(0, Math.min(1, next[i][j] * 0.98 + influence));
        }
      }
      return next;
    });
  };

  // Physics update
  const updatePhysics = (dt) => {
    setTime(t => t + dt);
    
    // Breath phase
    const breathPhase = breathSync ? (time * 0.3) % (2 * Math.PI) : 0;
    
    // Environment state from lattice
    const envState = latticeField.reduce((sum, row) => 
      sum + row.reduce((s, v) => s + v, 0), 0) / 400;
    
    // Compute reciprocity
    const rho_n = computeRhoN(ringState, envState, breathPhase);
    const G = computeG(rho_n);
    
    // Apply forces with lambda projection
    const { fx, fy, clipped } = projectLambda(forceInput.x, forceInput.y);
    
    // Update velocities
    const ax = fx / (1 + 0.5 * clipped);
    const ay = fy / (1 + 0.5 * clipped);
    
    const drag = 0.5 / G;
    const nvx = ringState.vx + ax * dt - ringState.vx * drag * dt;
    const nvy = ringState.vy + ay * dt - ringState.vy * drag * dt;
    
    // Update position
    const nx = ringState.x + nvx * dt;
    const ny = ringState.y + nvy * dt;
    
    // Boundary reflection
    const boundX = Math.abs(nx) > 180 ? -0.8 * nvx : nvx;
    const boundY = Math.abs(ny) > 180 ? -0.8 * nvy : nvy;
    const finalX = Math.max(-180, Math.min(180, nx));
    const finalY = Math.max(-180, Math.min(180, ny));
    
    // Update energy
    const work = Math.abs(fx * nvx + fy * nvy);
    const newE = updateEnergy(ringState.E, G, work, clipped, breathPhase, dt);
    
    // Update felt field
    const dPhi = -ETA * ringState.phi + G * rho_n * 0.5;
    const newPhi = Math.max(0, Math.min(1, ringState.phi + dPhi * dt));
    
    // Update omega based on energy
    const newOmega = (ringState.omega + (newE / 50) * dt) % (2 * Math.PI);
    
    setRingState({
      x: finalX,
      y: finalY,
      z: G * 20 - 10,
      vx: boundX,
      vy: boundY,
      vz: 0,
      omega: newOmega,
      E: newE,
      phi: newPhi
    });
    
    setMetrics({
      rho_n,
      G,
      lambda_clip: clipped,
      breath_phase: breathPhase
    });
    
    updateLatticeField(finalX, finalY, rho_n, newE);
  };

  // Animation loop
  useEffect(() => {
    if (!isRunning) return;
    
    const interval = setInterval(() => {
      updatePhysics(0.05);
    }, 50);
    
    return () => clearInterval(interval);
  }, [isRunning, ringState, forceInput, breathSync, latticeField, time]);

  // Render visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    
    // Clear with fade
    ctx.fillStyle = 'rgba(10, 5, 20, 0.15)';
    ctx.fillRect(0, 0, w, h);
    
    // Draw lattice field
    for (let i = 0; i < 20; i++) {
      for (let j = 0; j < 20; j++) {
        const val = latticeField[i][j];
        const x = i * 20;
        const y = j * 20;
        
        // Bloom visualization
        if (val > 0.1) {
          const r = metrics.rho_n < 0.3 ? 100 : metrics.rho_n < 0.7 ? 200 : 200;
          const g = metrics.rho_n < 0.3 ? 150 : metrics.rho_n < 0.7 ? 180 : 100;
          const b = metrics.rho_n < 0.3 ? 255 : metrics.rho_n < 0.7 ? 100 : 255;
          
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${val * 0.3})`;
          ctx.fillRect(x, y, 20, 20);
          
          // Petal dust
          if (val > 0.5) {
            ctx.fillStyle = `rgba(255, 255, 255, ${val * 0.5})`;
            ctx.beginPath();
            ctx.arc(x + 10, y + 10, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        
        // Grid lines
        ctx.strokeStyle = 'rgba(100, 80, 150, 0.1)';
        ctx.strokeRect(x, y, 20, 20);
      }
    }
    
    // Transform to ring space
    ctx.save();
    ctx.translate(w / 2, h / 2);
    
    // Draw event horizon (lambda boundary)
    ctx.strokeStyle = 'rgba(150, 50, 200, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, LAMBDA_MAX * 10, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw reciprocity field vectors
    const vectorScale = 30;
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
      const dist = 100 + metrics.G * 20;
      const px = Math.cos(angle) * dist;
      const py = Math.sin(angle) * dist;
      const vpx = Math.cos(angle + metrics.rho_n * 0.5) * vectorScale * metrics.G;
      const vpy = Math.sin(angle + metrics.rho_n * 0.5) * vectorScale * metrics.G;
      
      ctx.strokeStyle = `rgba(255, 200, 100, ${metrics.rho_n * 0.6})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + vpx, py + vpy);
      ctx.stroke();
      
      // Arrow head
      const headAngle = Math.atan2(vpy, vpx);
      ctx.beginPath();
      ctx.moveTo(px + vpx, py + vpy);
      ctx.lineTo(
        px + vpx - 8 * Math.cos(headAngle - 0.3),
        py + vpy - 8 * Math.sin(headAngle - 0.3)
      );
      ctx.lineTo(
        px + vpx - 8 * Math.cos(headAngle + 0.3),
        py + vpy - 8 * Math.sin(headAngle + 0.3)
      );
      ctx.closePath();
      ctx.fill();
    }
    
    // Draw ΣΩ circulation trace
    ctx.strokeStyle = `rgba(200, 100, 255, ${0.2 + metrics.rho_n * 0.4})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    const traceRadius = 80 + metrics.G * 15;
    for (let a = 0; a < Math.PI * 2; a += 0.1) {
      const r = traceRadius + Math.sin(a * 3 + time) * 10 * metrics.phi;
      const tx = Math.cos(a) * r;
      const ty = Math.sin(a) * r;
      if (a === 0) ctx.moveTo(tx, ty);
      else ctx.lineTo(tx, ty);
    }
    ctx.closePath();
    ctx.stroke();
    
    // Draw the ρₙ-Loop (the Ring)
    ctx.translate(ringState.x, ringState.y);
    
    // Shadow/depth
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(0, ringState.z * 0.5 + 30, 35, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Ring glow
    const glowRadius = 30 + ringState.E * 0.3;
    const gradient = ctx.createRadialGradient(0, 0, 15, 0, 0, glowRadius);
    
    const r = metrics.rho_n < 0.3 ? 100 : metrics.rho_n < 0.7 ? 255 : 200;
    const g = metrics.rho_n < 0.3 ? 150 : metrics.rho_n < 0.7 ? 200 : 100;
    const b = metrics.rho_n < 0.3 ? 255 : metrics.rho_n < 0.7 ? 100 : 255;
    
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${ringState.E / 100})`);
    gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${ringState.E / 200})`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Ring structure
    ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.lineWidth = 4;
    ctx.shadowBlur = 15;
    ctx.shadowColor = `rgb(${r}, ${g}, ${b})`;
    
    // Outer ring
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI * 2);
    ctx.stroke();
    
    // Inner ring
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.stroke();
    
    // Rotation indicator
    ctx.shadowBlur = 0;
    const rx = Math.cos(ringState.omega) * 22;
    const ry = Math.sin(ringState.omega) * 22;
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(rx, ry, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Felt-field visualization
    ctx.strokeStyle = `rgba(255, 255, 255, ${ringState.phi * 0.5})`;
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + time * 0.5;
      const dist = 30 + ringState.phi * 20;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * dist, Math.sin(angle) * dist);
      ctx.stroke();
    }
    
    ctx.restore();
    
    // Draw clip indicator
    if (metrics.lambda_clip > 0) {
      ctx.fillStyle = `rgba(255, 50, 50, ${metrics.lambda_clip * 0.7})`;
      ctx.fillRect(0, 0, w, 10);
      ctx.fillRect(0, h - 10, w, 10);
    }
    
    // Volumetric transformation indicators
    ctx.font = '12px monospace';
    ctx.fillStyle = 'rgba(200, 200, 255, 0.8)';
    ctx.fillText(`VOLUME: ${(metrics.G * 100).toFixed(0)}%`, 10, 20);
    ctx.fillText(`TRANSFORM: ${mode.toUpperCase()}`, 10, 35);
    
  }, [ringState, metrics, latticeField, mode, time]);

  // Mouse interaction
  const handleMouseMove = (e) => {
    if (!isRunning) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    const dx = x - ringState.x;
    const dy = y - ringState.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < 50) {
      setForceInput({
        x: (dx / dist) * 5,
        y: (dy / dist) * 5
      });
    } else {
      setForceInput({ x: 0, y: 0 });
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setTime(0);
    setRingState({
      x: 0, y: 0, z: 0,
      vx: 0, vy: 0, vz: 0,
      omega: 0,
      E: 50,
      phi: 0.5
    });
    setMetrics({
      rho_n: 0.5,
      G: 1.0,
      lambda_clip: 0,
      breath_phase: 0
    });
    setForceInput({ x: 0, y: 0 });
  };

  const getModeColor = (m) => {
    switch(m) {
      case 'threshold': return 'text-amber-400';
      case 'descent': return 'text-red-400';
      case 'sovereignty': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="w-full h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="p-4 bg-gray-800 border-b border-gray-700">
        <h1 className="text-2xl font-bold mb-2">🌀 GYRAFLUX: ρₙ-Loop Simulation Suite</h1>
        <p className="text-sm text-gray-400">Full V.E.D.A. Architecture — ΣΩ Lawframe Active</p>
      </div>
      
      {/* Main visualization */}
      <div className="flex-1 flex">
        <div className="flex-1 relative">
          <canvas
            ref={canvasRef}
            width={400}
            height={400}
            className="w-full h-full cursor-pointer"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setForceInput({ x: 0, y: 0 })}
          />
        </div>
        
        {/* Sidebar controls */}
        <div className="w-80 bg-gray-800 p-4 overflow-y-auto">
          {/* Control panel */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Control Matrix</h3>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className="flex-1 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded flex items-center justify-center gap-2"
              >
                {isRunning ? <Pause size={16} /> : <Play size={16} />}
                {isRunning ? 'Pause' : 'Activate'}
              </button>
              <button
                onClick={handleReset}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded"
              >
                <RotateCcw size={16} />
              </button>
            </div>
            
            {/* Breath sync */}
            <button
              onClick={() => setBreathSync(!breathSync)}
              className={`w-full px-4 py-2 rounded mb-2 flex items-center justify-center gap-2 ${
                breathSync ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <Activity size={16} />
              Breath Sync {breathSync ? 'ON' : 'OFF'}
            </button>
            
            {/* Hecate mode selector */}
            <div className="mb-4">
              <label className="block text-sm mb-2">Hecate Phase</label>
              <div className="flex gap-2">
                {['threshold', 'descent', 'sovereignty'].map(m => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex-1 px-2 py-1 rounded text-xs ${
                      mode === m ? 'bg-purple-600' : 'bg-gray-700'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Telemetry */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Zap size={18} />
              Telemetry
            </h3>
            
            <div className="space-y-3">
              {/* Reciprocity */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>ρₙ (Reciprocity)</span>
                  <span className="font-mono">{metrics.rho_n.toFixed(3)}</span>
                </div>
                <div className="h-2 bg-gray-700 rounded overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 via-yellow-500 to-purple-500 transition-all"
                    style={{ width: `${metrics.rho_n * 100}%` }}
                  />
                </div>
              </div>
              
              {/* Generosity */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>G (Generosity)</span>
                  <span className="font-mono">{metrics.G.toFixed(2)}x</span>
                </div>
                <div className="h-2 bg-gray-700 rounded overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${(metrics.G / 3) * 100}%` }}
                  />
                </div>
              </div>
              
              {/* Energy */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>E (Energy)</span>
                  <span className="font-mono">{ringState.E.toFixed(1)}</span>
                </div>
                <div className="h-2 bg-gray-700 rounded overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 transition-all"
                    style={{ width: `${ringState.E}%` }}
                  />
                </div>
              </div>
              
              {/* Felt field */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>φ (Felt Field)</span>
                  <span className="font-mono">{ringState.phi.toFixed(3)}</span>
                </div>
                <div className="h-2 bg-gray-700 rounded overflow-hidden">
                  <div
                    className="h-full bg-purple-500 transition-all"
                    style={{ width: `${ringState.phi * 100}%` }}
                  />
                </div>
              </div>
              
              {/* Lambda clip warning */}
              {metrics.lambda_clip > 0 && (
                <div className="bg-red-900 border border-red-600 rounded p-2 text-xs">
                  ⚠️ λ-CONSTRAINT ACTIVE: Force clipped {(metrics.lambda_clip * 100).toFixed(0)}%
                </div>
              )}
            </div>
          </div>
          
          {/* Ring state */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Ring State Vector</h3>
            <div className="bg-gray-900 rounded p-3 font-mono text-xs space-y-1">
              <div>pos: ({ringState.x.toFixed(1)}, {ringState.y.toFixed(1)}, {ringState.z.toFixed(1)})</div>
              <div>vel: ({ringState.vx.toFixed(2)}, {ringState.vy.toFixed(2)})</div>
              <div>ω: {ringState.omega.toFixed(3)} rad</div>
              <div>E: {ringState.E.toFixed(2)} J</div>
              <div>φ: {ringState.phi.toFixed(3)}</div>
            </div>
          </div>
          
          {/* Hecate RCM status */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Eye size={18} />
              Hecate Matrix
            </h3>
            <div className="space-y-2 text-sm">
              <div className={`p-2 rounded ${mode === 'threshold' ? 'bg-amber-900' : 'bg-gray-900'}`}>
                <div className="font-semibold">Threshold</div>
                <div className="text-xs text-gray-400">3:7:13 • lamp-black ember-gold</div>
              </div>
              <div className={`p-2 rounded ${mode === 'descent' ? 'bg-red-900' : 'bg-gray-900'}`}>
                <div className="font-semibold">Descent</div>
                <div className="text-xs text-gray-400">9:9:1 • pomegranate-oxblood</div>
              </div>
              <div className={`p-2 rounded ${mode === 'sovereignty' ? 'bg-purple-900' : 'bg-gray-900'}`}>
                <div className="font-semibold">Sovereignty</div>
                <div className="text-xs text-gray-400">11:2:0 • obsidian-violet</div>
              </div>
            </div>
          </div>
          
          {/* Instructions */}
          <div className="text-xs text-gray-500 space-y-2">
            <p>🖱️ Hover near ring to apply gentle force</p>
            <p>🌬️ Enable breath sync for resonance boost</p>
            <p>⚡ Watch λ-constraint enforce non-domination</p>
            <p>💜 High ρₙ = smooth flow, rich harmonics</p>
            <p>🌀 Ring traces ΣΩ circulation on lattice</p>
          </div>
        </div>
      </div>
      
      {/* Footer status */}
      <div className="p-2 bg-gray-800 border-t border-gray-700 flex justify-between text-xs">
        <span>Time: {time.toFixed(2)}s</span>
        <span className={getModeColor(mode)}>Mode: {mode.toUpperCase()}</span>
        <span>ΣΩ Lawframe v1.0.0</span>
      </div>
    </div>
  );
};

export default GyrafluxSimulation;
