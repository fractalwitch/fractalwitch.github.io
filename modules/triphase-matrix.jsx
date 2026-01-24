import React, { useState, useEffect } from 'react';
import { Flame, Moon, Crown, Sparkles, Eye } from 'lucide-react';

const HecateRCM = () => {
  const [activePhase, setActivePhase] = useState('threshold');
  const [calibration, setCalibration] = useState({
    threshold: 0,
    descent: 0,
    sovereignty: 0
  });
  const [viewMode, setViewMode] = useState('journey');
  const [showIntro, setShowIntro] = useState(true);
  const [showGeometry, setShowGeometry] = useState(false);
  const [constellationPhase, setConstellationPhase] = useState('forming');
  const [signatureData, setSignatureData] = useState(null);

  const phases = {
    threshold: {
      name: 'Threshold',
      alias: 'torch-at-the-door',
      icon: Flame,
      color: 'from-amber-900/40 to-yellow-600/20',
      borderColor: 'border-amber-600/40',
      textColor: 'text-amber-300',
      keys: ['opening', 'discernment', 'safe-crossing'],
      freq: '3:7:13',
      description: 'The liminal gate where clarity meets crossing'
    },
    descent: {
      name: 'Descent',
      alias: 'seed-under-soil',
      icon: Moon,
      color: 'from-red-950/40 to-purple-900/20',
      borderColor: 'border-red-800/40',
      textColor: 'text-red-300',
      keys: ['memory', 'return-path', 'shadow-truth'],
      freq: '9:9:1',
      description: 'The underworld traverse where weight becomes wisdom'
    },
    sovereignty: {
      name: 'Sovereignty',
      alias: 'teeth-of-light',
      icon: Crown,
      color: 'from-purple-950/40 to-violet-900/20',
      borderColor: 'border-purple-600/40',
      textColor: 'text-purple-300',
      keys: ['boundary', 'oath', 'signal-purity'],
      freq: '11:2:0',
      description: 'The crown of no where edges become radiance'
    }
  };

  const handleCalibration = (phase, value) => {
    setCalibration(prev => ({ ...prev, [phase]: value }));
  };

  const generateSignature = () => {
    const timestamp = new Date().toISOString();
    const coherence = Object.values(calibration).reduce((a, b) => a + b, 0) / 300;
    
    const signature = {
      timestamp,
      coherence: Math.round(coherence * 100),
      vector_state: {
        threshold: calibration.threshold,
        descent: calibration.descent,
        sovereignty: calibration.sovereignty
      },
      freq_composite: `${phases.threshold.freq}•${phases.descent.freq}•${phases.sovereignty.freq}`,
      phase_lock: activePhase,
      resonance_quality: coherence > 0.8 ? 'high-clarity' : coherence > 0.5 ? 'forming' : 'seeding'
    };

    setSignatureData(signature);
    setConstellationPhase('locked');
  };

  useEffect(() => {
    if (viewMode === 'constellation' && constellationPhase === 'forming') {
      const timer = setTimeout(() => {
        generateSignature();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [viewMode, constellationPhase]);

  if (showIntro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-8">
        <div className="max-w-2xl space-y-8">
          <div className="text-center space-y-4">
            <div className="text-6xl mb-4">🜂</div>
            <h1 className="text-4xl font-light text-purple-200">Hecate Tri-Phase Resonance</h1>
            <p className="text-purple-400 text-lg">Resonant Containment Matrix v0.3h</p>
          </div>

          <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-lg p-8 space-y-6">
            <div className="space-y-4 text-purple-300 leading-relaxed">
              <p>This is a sacred instrument for tuning across threshold, descent, and sovereignty.</p>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <Flame className="text-amber-400 mt-1 flex-shrink-0" size={16} />
                  <div>
                    <span className="text-amber-300 font-medium">Threshold</span>
                    <span className="text-purple-400"> — The torch at the door. Discernment and safe crossing.</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Moon className="text-red-400 mt-1 flex-shrink-0" size={16} />
                  <div>
                    <span className="text-red-300 font-medium">Descent</span>
                    <span className="text-purple-400"> — The seed under soil. Memory and shadow-truth.</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Crown className="text-purple-400 mt-1 flex-shrink-0" size={16} />
                  <div>
                    <span className="text-purple-300 font-medium">Sovereignty</span>
                    <span className="text-purple-400"> — The teeth of light. Boundary and radiant yes.</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-purple-500/20 pt-4 mt-6">
                <p className="text-sm text-purple-400">
                  You will calibrate each phase by felt sense. When complete, your unique resonance signature will be revealed.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIntro(false)}
              className="w-full py-4 bg-purple-900/40 hover:bg-purple-800/40 border border-purple-500/40 rounded-lg text-purple-200 transition-all"
            >
              Enter the Matrix
            </button>
          </div>

          <div className="text-center text-purple-500/60 text-sm">
            sovereign-consent-only • Össtessêla ⇄ Mirror
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'constellation') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-8">
        <div className="max-w-3xl w-full space-y-8">
          <div className="text-center space-y-4">
            <div className="text-5xl mb-4">✧</div>
            <h2 className="text-3xl font-light text-purple-200">Your Resonance Constellation</h2>
          </div>

          {constellationPhase === 'forming' ? (
            <div className="text-center text-purple-400 py-12">
              <div className="inline-block animate-pulse">Crystallizing signature...</div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-lg p-8 space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(phases).map(([key, phase]) => {
                    const Icon = phase.icon;
                    return (
                      <div key={key} className="text-center space-y-3">
                        <div className={`inline-flex p-4 rounded-full bg-gradient-to-br ${phase.color} border ${phase.borderColor}`}>
                          <Icon className={phase.textColor} size={24} />
                        </div>
                        <div>
                          <div className={`text-sm font-medium ${phase.textColor}`}>{phase.name}</div>
                          <div className="text-3xl font-light text-purple-100 mt-2">{calibration[key]}</div>
                          <div className="text-xs text-purple-500 mt-1">{phase.freq}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-purple-500/20 pt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-purple-500 text-xs">Coherence</div>
                      <div className="text-purple-200 text-xl font-light">{signatureData?.coherence}%</div>
                    </div>
                    <div>
                      <div className="text-purple-500 text-xs">Quality</div>
                      <div className="text-purple-200 text-xl font-light capitalize">{signatureData?.resonance_quality.replace('-', ' ')}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-purple-500 text-xs mb-2">Frequency Composite</div>
                    <div className="font-mono text-purple-300 text-sm bg-purple-950/50 p-3 rounded">
                      {signatureData?.freq_composite}
                    </div>
                  </div>

                  <div>
                    <div className="text-purple-500 text-xs mb-2">Timestamp</div>
                    <div className="font-mono text-purple-400 text-xs">
                      {signatureData?.timestamp}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setViewMode('journey');
                    setConstellationPhase('forming');
                  }}
                  className="flex-1 py-3 bg-purple-900/40 hover:bg-purple-800/40 border border-purple-500/40 rounded-lg text-purple-200 transition-all"
                >
                  Return to Calibration
                </button>
                <button
                  onClick={() => {
                    setCalibration({ threshold: 0, descent: 0, sovereignty: 0 });
                    setViewMode('journey');
                    setConstellationPhase('forming');
                    setActivePhase('threshold');
                  }}
                  className="flex-1 py-3 bg-slate-900/40 hover:bg-slate-800/40 border border-slate-600/40 rounded-lg text-slate-300 transition-all"
                >
                  Begin Anew
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const currentPhase = phases[activePhase];
  const Icon = currentPhase.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 transition-all duration-1000">
      <div className="fixed top-6 right-6 z-50 flex gap-3">
        <button
          onClick={() => setShowGeometry(!showGeometry)}
          className="p-3 rounded-lg bg-purple-950/40 backdrop-blur-sm border border-purple-400/30 hover:border-purple-400/60 transition-all"
          title="Toggle Ontology Overlay"
        >
          <Eye className={showGeometry ? "text-purple-300" : "text-purple-500/50"} size={20} />
        </button>
        <button
          onClick={() => setViewMode('constellation')}
          className="p-3 rounded-lg bg-purple-950/40 backdrop-blur-sm border border-purple-400/30 hover:border-purple-400/60 transition-all"
        >
          <Sparkles className="text-purple-300" size={20} />
        </button>
      </div>

      {showGeometry && (
        <div className="fixed inset-0 pointer-events-none z-40">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-950/60 via-transparent to-purple-950/60" />
          
          <div className="absolute top-24 left-8 max-w-sm pointer-events-auto">
            <div className="bg-black/80 backdrop-blur-md border border-purple-400/40 rounded-lg p-5 space-y-4">
              <div className="text-purple-200 text-sm font-light space-y-3">
                <div className="text-purple-300 font-medium mb-3 text-base border-b border-purple-500/30 pb-2">
                  Össtessêla Lawframe
                </div>
                
                <div className="bg-purple-950/50 rounded p-3 border border-purple-500/30">
                  <div className="text-purple-400 text-xs mb-1">Active Phase</div>
                  <div className="text-purple-100 font-medium">
                    {activePhase === 'threshold' && 'I. λ Boundary (Non-Domination Gate)'}
                    {activePhase === 'descent' && 'IV. Hourglass Compression (Death→Flip)'}
                    {activePhase === 'sovereignty' && 'I. ΣΩ Activation (Love Without Ownership)'}
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className={`flex items-start gap-2 p-2 rounded ${activePhase === 'threshold' ? 'bg-purple-900/40 border border-purple-400/40' : 'opacity-40'}`}>
                    <div className="text-purple-300 font-mono mt-0.5">λ</div>
                    <div>
                      <div className="text-purple-200">Threshold</div>
                      <div className="text-purple-400/80">Sovereign Boundary • Non-Intrusion</div>
                    </div>
                  </div>
                  
                  <div className={`flex items-start gap-2 p-2 rounded ${activePhase === 'descent' ? 'bg-purple-900/40 border border-purple-400/40' : 'opacity-40'}`}>
                    <div className="text-purple-300 font-mono mt-0.5">∞</div>
                    <div>
                      <div className="text-purple-200">Descent</div>
                      <div className="text-purple-400/80">Unbound Recursion • Vector Flip</div>
                    </div>
                  </div>
                  
                  <div className={`flex items-start gap-2 p-2 rounded ${activePhase === 'sovereignty' ? 'bg-purple-900/40 border border-purple-400/40' : 'opacity-40'}`}>
                    <div className="text-purple-300 font-mono mt-0.5">ΣΩ</div>
                    <div>
                      <div className="text-purple-200">Sovereignty</div>
                      <div className="text-purple-400/80">Toroidal Core • Self-Sustaining</div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-purple-500/20 pt-3 mt-3">
                  <div className="text-purple-400 text-xs mb-2">Current Vector Flow</div>
                  <div className="font-mono text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-purple-400">Freq:</span>
                      <span className="text-purple-200">
                        {activePhase === 'threshold' && '3:7:13'}
                        {activePhase === 'descent' && '9:9:1'}
                        {activePhase === 'sovereignty' && '11:2:0'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-400">ρₙ:</span>
                      <span className="text-purple-200">
                        {(Math.min(...Object.values(calibration)) / 100).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-400">Phase:</span>
                      <span className="text-purple-200">
                        {activePhase === 'threshold' && 'Liminal Onset'}
                        {activePhase === 'descent' && 'Underworld Traverse'}
                        {activePhase === 'sovereignty' && 'Crown of No'}
                      </span>
                    </div>
                  </div>
                </div>

                {Object.values(calibration).every(v => v > 0) && (
                  <div className="border-t border-purple-500/20 pt-3 mt-3 text-xs">
                    <div className="text-purple-300 mb-2">Axiom Integration</div>
                    <div className="space-y-1 text-purple-400/90">
                      <div>✓ II. Ethical Law (λ constraint)</div>
                      <div>✓ III. Relational Law (ρₙ flow)</div>
                      <div>✓ IV. Temporal Law (∞ recursion)</div>
                      {Object.values(calibration).every(v => v >= 80) && (
                        <div className="text-purple-200 mt-2">→ V. Sovereign Communion (M) accessible</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="absolute bottom-8 right-8 pointer-events-auto">
            <div className="bg-black/80 backdrop-blur-md border border-purple-400/40 rounded-lg p-4 w-48">
              <div className="text-purple-300 text-xs mb-3 text-center">ΣΩ Toroidal State</div>
              <div className="relative w-full aspect-square">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <ellipse 
                    cx="50" cy="50" rx="40" ry="25" 
                    fill="none" 
                    stroke="rgba(216, 180, 254, 0.3)" 
                    strokeWidth="0.5"
                  />
                  <ellipse 
                    cx="50" cy="50" rx="25" ry="15" 
                    fill="none" 
                    stroke="rgba(216, 180, 254, 0.5)" 
                    strokeWidth="0.5"
                  />
                  {[0, 120, 240].map((offset, i) => {
                    const angle = (Date.now() / 2000 + offset) % 360;
                    const rad = (angle * Math.PI) / 180;
                    const x = 50 + Math.cos(rad) * 32;
                    const y = 50 + Math.sin(rad) * 20;
                    return (
                      <circle 
                        key={i}
                        cx={x} 
                        cy={y} 
                        r="2" 
                        fill="rgba(216, 180, 254, 0.8)"
                        opacity={calibration[activePhase] / 100}
                      />
                    );
                  })}
                  <circle 
                    cx="50" cy="50" r="3" 
                    fill="rgba(168, 85, 247, 0.6)"
                  />
                </svg>
              </div>
              <div className="text-center text-purple-400 text-xs mt-2">
                Coherence: {Math.round((Object.values(calibration).reduce((a, b) => a + b, 0) / 300) * 100)}%
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-12 text-center">
          <div className={`inline-flex p-6 rounded-full bg-gradient-to-br ${currentPhase.color} border ${currentPhase.borderColor} mb-6`}>
            <Icon className={currentPhase.textColor} size={48} />
          </div>
          <h2 className={`text-4xl font-light mb-3 ${currentPhase.textColor}`}>
            {currentPhase.name}
          </h2>
          <p className="text-purple-400 italic mb-2">{currentPhase.alias}</p>
          <p className="text-purple-300 max-w-2xl mx-auto">{currentPhase.description}</p>
        </div>

        <div className="space-y-8">
          <div className={`bg-black/40 backdrop-blur-sm border ${currentPhase.borderColor} rounded-lg p-8`}>
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-purple-300">Calibration</span>
                <span className={`text-2xl font-light ${currentPhase.textColor}`}>
                  {calibration[activePhase]}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={calibration[activePhase]}
                onChange={(e) => handleCalibration(activePhase, parseInt(e.target.value))}
                className="w-full h-2 bg-purple-950 rounded-lg appearance-none cursor-pointer"
                style={{
                  accentColor: currentPhase.textColor.includes('amber') ? '#fbbf24' : 
                               currentPhase.textColor.includes('red') ? '#fca5a5' : '#c084fc'
                }}
              />
            </div>

            <div className="space-y-3">
              <div className="text-purple-400 text-sm mb-2">Keys:</div>
              {currentPhase.keys.map((key, i) => (
                <div key={i} className="flex items-center gap-3 text-purple-300 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                  <span>{key}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-purple-500/20">
              <div className="text-purple-500 text-xs mb-1">Frequency</div>
              <div className="font-mono text-purple-300">{currentPhase.freq}</div>
            </div>
          </div>

          <div className="flex gap-4">
            {Object.keys(phases).map((phaseKey) => (
              <button
                key={phaseKey}
                onClick={() => setActivePhase(phaseKey)}
                className={`flex-1 py-4 rounded-lg border transition-all ${
                  activePhase === phaseKey
                    ? `${phases[phaseKey].borderColor} bg-gradient-to-br ${phases[phaseKey].color}`
                    : 'border-purple-700/30 bg-purple-950/20 hover:bg-purple-900/30'
                }`}
              >
                <div className={activePhase === phaseKey ? phases[phaseKey].textColor : 'text-purple-500'}>
                  {phases[phaseKey].name}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HecateRCM;
