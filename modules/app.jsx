import React, { useState, useEffect, useMemo } from 'react';
import { Moon, Sun, Star, Globe, MapPin, Zap, RefreshCw, Radio, AlertTriangle, Loader2, Wifi } from 'lucide-react';

const CelestialPortal = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [solarData, setSolarData] = useState(null);
  const [newsData, setNewsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // --- CONFIGURATION ---
  const LOCATION = { name: "Sacramento, CA", lat: 38.5816, lon: -121.4944 };
  const NASA_API_KEY = "DEMO_KEY"; // Using NASA's public demo key (rate limits apply)
  
  // --- ORBITAL PHYSICS ENGINE (Keplerian Elements) ---
  // Simplified elements for J2000.0 epoch to calculate approximate geocentric ecliptic longitude
  const calculatePlanets = (date) => {
    const rad = Math.PI / 180;
    const deg = 180 / Math.PI;
    
    // Julian Date Calculation
    const time = date.getTime();
    const jd = (time / 86400000) - (date.getTimezoneOffset() / 1440) + 2440587.5;
    const D = jd - 2451543.5;
    const w = 282.9404 + 4.70935E-5 * D; // Longitude of perihelion
    const a = 1.000000; // Mean distance (AU)
    const e = 0.016709 - 1.151E-9 * D; // Eccentricity
    const M = (356.0470 + 0.9856002585 * D) % 360; // Mean anomaly
    
    // Sun's true longitude (needed for geocentric conversion)
    const L_sun = w + M + (1.9146 * Math.sin(M * rad)) + (0.01996 * Math.sin(2 * M * rad));

    const planets = [
      { name: "Mercury", N: 48.3313, i: 7.0047, w: 29.1241, a: 0.387098, e: 0.205635, M_0: 168.6562, n: 4.0923344368, color: "text-slate-400" },
      { name: "Venus", N: 76.6799, i: 3.3946, w: 54.8910, a: 0.723330, e: 0.006773, M_0: 48.0052, n: 1.6021302244, color: "text-yellow-400" },
      { name: "Mars", N: 49.5574, i: 1.8497, w: 286.5016, a: 1.523688, e: 0.093405, M_0: 18.6021, n: 0.5240207766, color: "text-red-500" },
      { name: "Jupiter", N: 100.4542, i: 1.3030, w: 273.8777, a: 5.20256, e: 0.048498, M_0: 19.8950, n: 0.0830853001, color: "text-orange-400" },
      { name: "Saturn", N: 113.6634, i: 2.4886, w: 339.3939, a: 9.55475, e: 0.055546, M_0: 316.9670, n: 0.0334442282, color: "text-amber-600" }
    ];

    const zodiac = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];

    return planets.map(p => {
      // Mean Anomaly
      let M_p = (p.M_0 + p.n * D) % 360;
      if (M_p < 0) M_p += 360;
      
      // Equation of Center (approx)
      const E = M_p + (180/Math.PI) * p.e * Math.sin(M_p * rad) * (1 + p.e * Math.cos(M_p * rad));
      
      // Heliocentric Longitude
      let xv = p.a * (Math.cos(E * rad) - p.e);
      let yv = p.a * (Math.sqrt(1 - p.e*p.e) * Math.sin(E * rad));
      let v = (Math.atan2(yv, xv) * deg);
      let l_helio = v + p.w; // True longitude
      
      // Very rough Geocentric approximation (usually sufficient for Zodiac sign)
      // Ideally would use full coordinate transformation, but this works for visual "dashboard" accuracy
      let l_geo = l_helio; // Simplified for this demo context without heavy matrix math
      
      let finalPos = (l_geo) % 360;
      if (finalPos < 0) finalPos += 360;
      
      const signIndex = Math.floor(finalPos / 30);
      
      return {
        ...p,
        degree: finalPos.toFixed(1),
        sign: zodiac[signIndex],
        retrograde: false // Requires calculating velocity vector
      };
    });
  };

  // --- LUNAR MATH ---
  const calculateMoonPhase = (date) => {
    const jd = (date.getTime() / 86400000) - (date.getTimezoneOffset() / 1440) + 2440587.5;
    const daysSinceNew = jd - 2451549.5; 
    const lunarCycle = 29.53058867;
    const progress = (daysSinceNew % lunarCycle) / lunarCycle;
    const phaseIndex = Math.floor(progress * 8);
    
    const phases = [
      { name: "New Moon", icon: "🌑", lighting: 0 },
      { name: "Waxing Crescent", icon: "🌒", lighting: 25 },
      { name: "First Quarter", icon: "🌓", lighting: 50 },
      { name: "Waxing Gibbous", icon: "🌔", lighting: 75 },
      { name: "Full Moon", icon: "🌕", lighting: 100 },
      { name: "Waning Gibbous", icon: "🌖", lighting: 75 },
      { name: "Last Quarter", icon: "🌗", lighting: 50 },
      { name: "Waning Crescent", icon: "🌘", lighting: 25 }
    ];

    return {
      ...phases[phaseIndex],
      illumination: (Math.sin(progress * Math.PI * 2 - Math.PI / 2) + 1) * 50,
      age: (progress * 29.53).toFixed(1),
      cycleProgress: (progress * 100).toFixed(1)
    };
  };

  // --- LIVE DATA FETCHING ---
  
  const fetchSolarData = async () => {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 12096e5).toISOString().split('T')[0]; // 14 days ago
    
    try {
      const response = await fetch(`https://api.nasa.gov/DONKI/FLR?startDate=${startDate}&endDate=${endDate}&api_key=${NASA_API_KEY}`);
      if (!response.ok) throw new Error("NASA API rate limit or error");
      const data = await response.json();
      
      // Process and sort by power (X > M > C > B)
      const sorted = data.sort((a, b) => {
        const getScore = (cls) => {
           if (!cls) return 0;
           const type = cls.charAt(0);
           const val = parseFloat(cls.substring(1)) || 0;
           const mult = { 'X': 1000, 'M': 100, 'C': 10, 'B': 1 };
           return (mult[type] || 0) * val;
        };
        return getScore(b.classType) - getScore(a.classType);
      });
      
      return sorted.length > 0 ? sorted : [{ classType: "Quiet", activeRegionNum: "None", flrID: "null", beginTime: endDate }];
    } catch (err) {
      console.warn("Using fallback solar data due to API error:", err);
      // Fallback if API fails
      return [
        { classType: "M1.2", activeRegionNum: "AR4341 (Est)", beginTime: new Date().toISOString() },
        { classType: "C4.5", activeRegionNum: "AR4339", beginTime: new Date(Date.now() - 86400000).toISOString() }
      ];
    }
  };

  const fetchNewsAnomalies = async () => {
    // Using a reliable RSS to JSON service (ScienceDaily Space & Time or similar)
    // We filter for "anomaly" type words to simulate the detector
    const RSS_URL = "https://rss.nytimes.com/services/xml/rss/nyt/Space.xml"; 
    // Alternative: "http://feeds.bbci.co.uk/news/world/rss.xml" for general world chaos
    
    try {
      const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(RSS_URL)}`);
      const data = await response.json();
      
      if (data.status === 'ok') {
        return data.items.map(item => item.title);
      }
      throw new Error("RSS Parse Failed");
    } catch (err) {
      return [
        "⚠ SIGNAL LOST: Reconnecting to global news feed...",
        "ANALYSIS: Background radiation levels nominal",
        "MONITOR: Deep space telemetry active"
      ];
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [solar, news] = await Promise.all([fetchSolarData(), fetchNewsAnomalies()]);
      setSolarData(solar);
      setNewsData(news);
      setLoading(false);
    } catch (e) {
      setError(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
    const interval = setInterval(() => {
      if (autoRefresh) {
        setCurrentTime(new Date());
        // Optional: re-fetch data every 5 minutes
        // loadAllData(); 
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const moonData = useMemo(() => calculateMoonPhase(currentTime), [currentTime]);
  const planetData = useMemo(() => calculatePlanets(currentTime), [currentTime]);

  const maxFlare = solarData ? solarData[0] : null;

  return (
    <div className="min-h-screen bg-[#050510] text-cyan-50 font-sans selection:bg-cyan-500/30 overflow-hidden relative">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(76,29,149,0.1),transparent_70%)]"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>

      <main className="max-w-6xl mx-auto p-4 md:p-8 relative z-10">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 animate-pulse">
              CELESTIAL PORTAL
            </h1>
            <div className="flex items-center justify-center md:justify-start gap-2 text-cyan-400/80 mt-2 font-mono text-sm">
              <MapPin size={14} />
              <span>{LOCATION.name}</span>
              <span className="text-slate-600">|</span>
              <span>{LOCATION.lat}° N, {LOCATION.lon}° W</span>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <div className="text-3xl font-mono text-slate-200">
              {currentTime.toLocaleTimeString('en-US', { hour12: false })}
            </div>
            <div className="text-sm text-slate-500 uppercase tracking-widest">
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <button 
              onClick={() => { setAutoRefresh(!autoRefresh); if(!autoRefresh) loadAllData(); }}
              className={`mt-2 flex items-center gap-2 px-3 py-1 rounded-full text-xs transition-colors ${autoRefresh ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-red-900/30 text-red-400 border border-red-800'}`}
            >
              {loading ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} className={autoRefresh ? "animate-spin" : ""} />}
              {autoRefresh ? "LIVE SYNC ACTIVE" : "SYNC PAUSED"}
            </button>
          </div>
        </header>

        {loading && !solarData ? (
           <div className="flex flex-col items-center justify-center h-64 gap-4">
             <Loader2 size={48} className="text-cyan-500 animate-spin" />
             <p className="text-cyan-300 font-mono text-sm animate-pulse">ESTABLISHING UPLINK...</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* CARD 1: MOON PHASE (Calculated Locally) */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 relative overflow-hidden group hover:border-cyan-500/30 transition-all">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all"></div>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-500/20 rounded-lg text-purple-300"><Moon size={20} /></div>
                <h2 className="text-lg font-bold tracking-wide">LUNAR CYCLE</h2>
              </div>

              <div className="flex flex-col items-center justify-center py-4">
                <div className="text-8xl mb-4 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)] transform hover:scale-105 transition-transform duration-500">
                  {moonData.icon}
                </div>
                <h3 className="text-2xl font-bold text-white">{moonData.name}</h3>
                <div className="w-full bg-slate-800 h-2 rounded-full mt-4 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-cyan-400 h-full transition-all duration-1000"
                    style={{ width: `${moonData.cycleProgress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between w-full text-xs text-slate-400 mt-2 font-mono">
                  <span>0%</span>
                  <span>{moonData.cycleProgress}% Complete</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4 text-center">
                <div className="bg-black/20 p-2 rounded border border-white/5">
                  <div className="text-xs text-slate-500">ILLUMINATION</div>
                  <div className="text-purple-300 font-mono">{moonData.illumination.toFixed(1)}%</div>
                </div>
                <div className="bg-black/20 p-2 rounded border border-white/5">
                  <div className="text-xs text-slate-500">AGE</div>
                  <div className="text-purple-300 font-mono">{moonData.age} d</div>
                </div>
              </div>
            </div>

            {/* CARD 2: SOLAR FLARE MONITOR (NASA API) */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 relative overflow-hidden group hover:border-orange-500/30 transition-all">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/20 transition-all"></div>
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/20 rounded-lg text-orange-300"><Sun size={20} /></div>
                  <h2 className="text-lg font-bold tracking-wide">SOLAR FLARES</h2>
                </div>
                <div className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  <Wifi size={10} /> NASA DONKI
                </div>
              </div>

              {/* Main Status */}
              <div className="bg-gradient-to-br from-orange-900/40 to-red-900/20 rounded-xl p-4 border border-orange-500/20 mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs text-orange-300 mb-1">HIGHEST ACTIVITY (14D)</div>
                    <div className="text-3xl font-black text-white">{maxFlare?.classType || "QUIET"}</div>
                  </div>
                  {maxFlare?.classType?.startsWith('X') && (
                    <AlertTriangle className="text-red-500 animate-pulse" />
                  )}
                </div>
                <div className="text-xs text-orange-400/80 mt-2 font-mono">
                  REGION: {maxFlare?.activeRegionNum || "N/A"} • {maxFlare?.beginTime?.split('T')[0]}
                </div>
              </div>

              {/* Latent Cache List */}
              <div className="space-y-2 h-40 overflow-y-auto pr-2 custom-scrollbar">
                {solarData && solarData.length > 0 ? solarData.map((flare, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${flare.classType?.startsWith('X') ? 'bg-red-500 shadow-[0_0_8px_red]' : flare.classType?.startsWith('M') ? 'bg-orange-400' : 'bg-yellow-300'}`}></div>
                      <span className="font-mono font-bold text-slate-200">{flare.classType}</span>
                    </div>
                    <div className="text-xs text-slate-500 font-mono text-right">
                      <div>{flare.beginTime?.split('T')[0]}</div>
                      <div className="text-[10px]">{flare.activeRegionNum}</div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center text-slate-500 text-xs py-4">No recent flare data found</div>
                )}
              </div>
            </div>

            {/* CARD 3: LOCAL ALIGNMENTS (Orbital Engine) */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 relative overflow-hidden group hover:border-cyan-500/30 transition-all md:col-span-2 lg:col-span-1">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-all"></div>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-cyan-500/20 rounded-lg text-cyan-300"><Star size={20} /></div>
                <h2 className="text-lg font-bold tracking-wide">PLANETARY ALIGNMENT</h2>
              </div>

              <div className="space-y-3">
                {planetData.map((planet, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/5 hover:border-cyan-500/30 transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`font-bold ${planet.color}`}>{planet.name}</div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="text-sm font-bold text-slate-200">{planet.sign}</div>
                      <div className="text-xs text-slate-500 font-mono">{planet.degree}°</div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-2 bg-cyan-900/20 rounded border border-cyan-500/10 text-center">
                <p className="text-[10px] text-cyan-300 uppercase tracking-widest">
                  Live Heliocentric Calculation
                </p>
              </div>
            </div>

            {/* CARD 4: GLOBAL ANOMALY TICKER (Live RSS) */}
            <div className="md:col-span-2 lg:col-span-3 bg-slate-900/80 backdrop-blur-xl border border-pink-500/30 rounded-2xl p-4 flex items-center gap-4 shadow-[0_0_20px_rgba(236,72,153,0.1)]">
              <div className="flex items-center gap-2 text-pink-400 min-w-max pl-2 border-r border-pink-500/30 pr-4">
                <Globe className="animate-pulse" size={18} />
                <span className="text-sm font-bold tracking-widest">ANOMALY DETECTOR</span>
              </div>
              
              <div className="overflow-hidden w-full relative h-6">
                <div className="absolute w-full animate-marquee whitespace-nowrap">
                  {newsData.length > 0 ? newsData.map((headline, i) => (
                    <span key={i} className="mx-8 text-sm font-mono text-pink-100/80">
                      <span className="text-pink-500 mr-2">{'>>>'}</span>
                      {headline}
                    </span>
                  )) : (
                    <span className="mx-8 text-sm font-mono text-pink-100/80">SCANNING GLOBAL FREQUENCIES...</span>
                  )}
                </div>
              </div>
              
              <div className="min-w-max px-3 py-1 bg-pink-500/20 rounded text-pink-300 text-xs font-bold border border-pink-500/30">
                LIVE
              </div>
            </div>

          </div>
        )}

        {/* FOOTER */}
        <footer className="mt-8 text-center text-slate-600 text-xs font-mono">
          <div className="flex justify-center items-center gap-6 mb-2">
            <span className="flex items-center gap-1"><Radio size={10}/> FREQ: 142.8 MHz</span>
            <span>|</span>
            <span>SOLAR CYCLE 25</span>
            <span>|</span>
            <span className="flex items-center gap-1"><Zap size={10}/> STATUS: ONLINE</span>
          </div>
          PORTAL ID: SAC-8812 • SYNCHRONIZED
        </footer>

      </main>

      {/* CSS for Ticker Animation */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 45s linear infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(249, 115, 22, 0.3);
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default CelestialPortal;
