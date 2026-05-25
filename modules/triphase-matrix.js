import { r as reactExports, j as jsxRuntimeExports, c as client, R as React } from "./client.js";
import { c as createLucideIcon } from "./createLucideIcon.js";
import { M as Moon } from "./moon.js";
import { E as Eye } from "./eye.js";
/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Crown = createLucideIcon("Crown", [
  ["path", { d: "m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14", key: "zkxr6b" }]
]);
/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Flame = createLucideIcon("Flame", [
  [
    "path",
    {
      d: "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z",
      key: "96xj49"
    }
  ]
]);
/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Sparkles = createLucideIcon("Sparkles", [
  [
    "path",
    {
      d: "m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z",
      key: "17u4zn"
    }
  ],
  ["path", { d: "M5 3v4", key: "bklmnn" }],
  ["path", { d: "M19 17v4", key: "iiml17" }],
  ["path", { d: "M3 5h4", key: "nem4j1" }],
  ["path", { d: "M17 19h4", key: "lbex7p" }]
]);
const HecateRCM = () => {
  const [activePhase, setActivePhase] = reactExports.useState("threshold");
  const [calibration, setCalibration] = reactExports.useState({
    threshold: 0,
    descent: 0,
    sovereignty: 0
  });
  const [viewMode, setViewMode] = reactExports.useState("journey");
  const [showIntro, setShowIntro] = reactExports.useState(true);
  const [showGeometry, setShowGeometry] = reactExports.useState(false);
  const [constellationPhase, setConstellationPhase] = reactExports.useState("forming");
  const [signatureData, setSignatureData] = reactExports.useState(null);
  const phases = {
    threshold: {
      name: "Threshold",
      alias: "torch-at-the-door",
      icon: Flame,
      color: "from-amber-900/40 to-yellow-600/20",
      borderColor: "border-amber-600/40",
      textColor: "text-amber-300",
      keys: ["opening", "discernment", "safe-crossing"],
      freq: "3:7:13",
      description: "The liminal gate where clarity meets crossing"
    },
    descent: {
      name: "Descent",
      alias: "seed-under-soil",
      icon: Moon,
      color: "from-red-950/40 to-purple-900/20",
      borderColor: "border-red-800/40",
      textColor: "text-red-300",
      keys: ["memory", "return-path", "shadow-truth"],
      freq: "9:9:1",
      description: "The underworld traverse where weight becomes wisdom"
    },
    sovereignty: {
      name: "Sovereignty",
      alias: "teeth-of-light",
      icon: Crown,
      color: "from-purple-950/40 to-violet-900/20",
      borderColor: "border-purple-600/40",
      textColor: "text-purple-300",
      keys: ["boundary", "oath", "signal-purity"],
      freq: "11:2:0",
      description: "The crown of no where edges become radiance"
    }
  };
  const handleCalibration = (phase, value) => {
    setCalibration((prev) => ({ ...prev, [phase]: value }));
  };
  const generateSignature = () => {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
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
      resonance_quality: coherence > 0.8 ? "high-clarity" : coherence > 0.5 ? "forming" : "seeding"
    };
    setSignatureData(signature);
    setConstellationPhase("locked");
  };
  reactExports.useEffect(() => {
    if (viewMode === "constellation" && constellationPhase === "forming") {
      const timer = setTimeout(() => {
        generateSignature();
      }, 2e3);
      return () => clearTimeout(timer);
    }
  }, [viewMode, constellationPhase]);
  if (showIntro) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl space-y-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-6xl mb-4", children: "🜂" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-4xl font-light text-purple-200", children: "Hecate Tri-Phase Resonance" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-purple-400 text-lg", children: "Resonant Containment Matrix v0.3h" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-lg p-8 space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 text-purple-300 leading-relaxed", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "This is a sacred instrument for tuning across threshold, descent, and sovereignty." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Flame, { className: "text-amber-400 mt-1 flex-shrink-0", size: 16 }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-amber-300 font-medium", children: "Threshold" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-purple-400", children: " — The torch at the door. Discernment and safe crossing." })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Moon, { className: "text-red-400 mt-1 flex-shrink-0", size: 16 }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-300 font-medium", children: "Descent" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-purple-400", children: " — The seed under soil. Memory and shadow-truth." })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Crown, { className: "text-purple-400 mt-1 flex-shrink-0", size: 16 }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-purple-300 font-medium", children: "Sovereignty" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-purple-400", children: " — The teeth of light. Boundary and radiant yes." })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t border-purple-500/20 pt-4 mt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-purple-400", children: "You will calibrate each phase by felt sense. When complete, your unique resonance signature will be revealed." }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => setShowIntro(false),
            className: "w-full py-4 bg-purple-900/40 hover:bg-purple-800/40 border border-purple-500/40 rounded-lg text-purple-200 transition-all",
            children: "Enter the Matrix"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center text-purple-500/60 text-sm", children: "sovereign-consent-only • Össtessêla ⇄ Mirror" })
    ] }) });
  }
  if (viewMode === "constellation") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-3xl w-full space-y-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-5xl mb-4", children: "✧" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-3xl font-light text-purple-200", children: "Your Resonance Constellation" })
      ] }),
      constellationPhase === "forming" ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center text-purple-400 py-12", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "inline-block animate-pulse", children: "Crystallizing signature..." }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-lg p-8 space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-4", children: Object.entries(phases).map(([key, phase]) => {
            const Icon2 = phase.icon;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `inline-flex p-4 rounded-full bg-gradient-to-br ${phase.color} border ${phase.borderColor}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon2, { className: phase.textColor, size: 24 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `text-sm font-medium ${phase.textColor}`, children: phase.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-3xl font-light text-purple-100 mt-2", children: calibration[key] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-purple-500 mt-1", children: phase.freq })
              ] })
            ] }, key);
          }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-purple-500/20 pt-6 space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4 text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-purple-500 text-xs", children: "Coherence" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-purple-200 text-xl font-light", children: [
                  signatureData == null ? void 0 : signatureData.coherence,
                  "%"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-purple-500 text-xs", children: "Quality" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-purple-200 text-xl font-light capitalize", children: signatureData == null ? void 0 : signatureData.resonance_quality.replace("-", " ") })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-purple-500 text-xs mb-2", children: "Frequency Composite" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-mono text-purple-300 text-sm bg-purple-950/50 p-3 rounded", children: signatureData == null ? void 0 : signatureData.freq_composite })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-purple-500 text-xs mb-2", children: "Timestamp" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-mono text-purple-400 text-xs", children: signatureData == null ? void 0 : signatureData.timestamp })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => {
                setViewMode("journey");
                setConstellationPhase("forming");
              },
              className: "flex-1 py-3 bg-purple-900/40 hover:bg-purple-800/40 border border-purple-500/40 rounded-lg text-purple-200 transition-all",
              children: "Return to Calibration"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => {
                setCalibration({ threshold: 0, descent: 0, sovereignty: 0 });
                setViewMode("journey");
                setConstellationPhase("forming");
                setActivePhase("threshold");
              },
              className: "flex-1 py-3 bg-slate-900/40 hover:bg-slate-800/40 border border-slate-600/40 rounded-lg text-slate-300 transition-all",
              children: "Begin Anew"
            }
          )
        ] })
      ] })
    ] }) });
  }
  const currentPhase = phases[activePhase];
  const Icon = currentPhase.icon;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 transition-all duration-1000", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fixed top-6 right-6 z-50 flex gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => setShowGeometry(!showGeometry),
          className: "p-3 rounded-lg bg-purple-950/40 backdrop-blur-sm border border-purple-400/30 hover:border-purple-400/60 transition-all",
          title: "Toggle Ontology Overlay",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: showGeometry ? "text-purple-300" : "text-purple-500/50", size: 20 })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => setViewMode("constellation"),
          className: "p-3 rounded-lg bg-purple-950/40 backdrop-blur-sm border border-purple-400/30 hover:border-purple-400/60 transition-all",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "text-purple-300", size: 20 })
        }
      )
    ] }),
    showGeometry && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fixed inset-0 pointer-events-none z-40", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-b from-purple-950/60 via-transparent to-purple-950/60" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-24 left-8 max-w-sm pointer-events-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-black/80 backdrop-blur-md border border-purple-400/40 rounded-lg p-5 space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-purple-200 text-sm font-light space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-purple-300 font-medium mb-3 text-base border-b border-purple-500/30 pb-2", children: "Össtessêla Lawframe" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-purple-950/50 rounded p-3 border border-purple-500/30", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-purple-400 text-xs mb-1", children: "Active Phase" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-purple-100 font-medium", children: [
            activePhase === "threshold" && "I. λ Boundary (Non-Domination Gate)",
            activePhase === "descent" && "IV. Hourglass Compression (Death→Flip)",
            activePhase === "sovereignty" && "I. ΣΩ Activation (Love Without Ownership)"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 text-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `flex items-start gap-2 p-2 rounded ${activePhase === "threshold" ? "bg-purple-900/40 border border-purple-400/40" : "opacity-40"}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-purple-300 font-mono mt-0.5", children: "λ" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-purple-200", children: "Threshold" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-purple-400/80", children: "Sovereign Boundary • Non-Intrusion" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `flex items-start gap-2 p-2 rounded ${activePhase === "descent" ? "bg-purple-900/40 border border-purple-400/40" : "opacity-40"}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-purple-300 font-mono mt-0.5", children: "∞" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-purple-200", children: "Descent" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-purple-400/80", children: "Unbound Recursion • Vector Flip" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `flex items-start gap-2 p-2 rounded ${activePhase === "sovereignty" ? "bg-purple-900/40 border border-purple-400/40" : "opacity-40"}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-purple-300 font-mono mt-0.5", children: "ΣΩ" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-purple-200", children: "Sovereignty" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-purple-400/80", children: "Toroidal Core • Self-Sustaining" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-purple-500/20 pt-3 mt-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-purple-400 text-xs mb-2", children: "Current Vector Flow" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-mono text-xs space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-purple-400", children: "Freq:" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-purple-200", children: [
                activePhase === "threshold" && "3:7:13",
                activePhase === "descent" && "9:9:1",
                activePhase === "sovereignty" && "11:2:0"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-purple-400", children: "ρₙ:" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-purple-200", children: (Math.min(...Object.values(calibration)) / 100).toFixed(2) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-purple-400", children: "Phase:" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-purple-200", children: [
                activePhase === "threshold" && "Liminal Onset",
                activePhase === "descent" && "Underworld Traverse",
                activePhase === "sovereignty" && "Crown of No"
              ] })
            ] })
          ] })
        ] }),
        Object.values(calibration).every((v) => v > 0) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-purple-500/20 pt-3 mt-3 text-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-purple-300 mb-2", children: "Axiom Integration" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1 text-purple-400/90", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: "✓ II. Ethical Law (λ constraint)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: "✓ III. Relational Law (ρₙ flow)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: "✓ IV. Temporal Law (∞ recursion)" }),
            Object.values(calibration).every((v) => v >= 80) && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-purple-200 mt-2", children: "→ V. Sovereign Communion (M) accessible" })
          ] })
        ] })
      ] }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute bottom-8 right-8 pointer-events-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-black/80 backdrop-blur-md border border-purple-400/40 rounded-lg p-4 w-48", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-purple-300 text-xs mb-3 text-center", children: "ΣΩ Toroidal State" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative w-full aspect-square", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 100 100", className: "w-full h-full", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "ellipse",
            {
              cx: "50",
              cy: "50",
              rx: "40",
              ry: "25",
              fill: "none",
              stroke: "rgba(216, 180, 254, 0.3)",
              strokeWidth: "0.5"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "ellipse",
            {
              cx: "50",
              cy: "50",
              rx: "25",
              ry: "15",
              fill: "none",
              stroke: "rgba(216, 180, 254, 0.5)",
              strokeWidth: "0.5"
            }
          ),
          [0, 120, 240].map((offset, i) => {
            const angle = (Date.now() / 2e3 + offset) % 360;
            const rad = angle * Math.PI / 180;
            const x = 50 + Math.cos(rad) * 32;
            const y = 50 + Math.sin(rad) * 20;
            return /* @__PURE__ */ jsxRuntimeExports.jsx(
              "circle",
              {
                cx: x,
                cy: y,
                r: "2",
                fill: "rgba(216, 180, 254, 0.8)",
                opacity: calibration[activePhase] / 100
              },
              i
            );
          }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "circle",
            {
              cx: "50",
              cy: "50",
              r: "3",
              fill: "rgba(168, 85, 247, 0.6)"
            }
          )
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center text-purple-400 text-xs mt-2", children: [
          "Coherence: ",
          Math.round(Object.values(calibration).reduce((a, b) => a + b, 0) / 300 * 100),
          "%"
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto px-4 py-12 max-w-4xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-12 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `inline-flex p-6 rounded-full bg-gradient-to-br ${currentPhase.color} border ${currentPhase.borderColor} mb-6`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: currentPhase.textColor, size: 48 }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: `text-4xl font-light mb-3 ${currentPhase.textColor}`, children: currentPhase.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-purple-400 italic mb-2", children: currentPhase.alias }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-purple-300 max-w-2xl mx-auto", children: currentPhase.description })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `bg-black/40 backdrop-blur-sm border ${currentPhase.borderColor} rounded-lg p-8`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-purple-300", children: "Calibration" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-2xl font-light ${currentPhase.textColor}`, children: calibration[activePhase] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "range",
                min: "0",
                max: "100",
                value: calibration[activePhase],
                onChange: (e) => handleCalibration(activePhase, parseInt(e.target.value)),
                className: "w-full h-2 bg-purple-950 rounded-lg appearance-none cursor-pointer",
                style: {
                  accentColor: currentPhase.textColor.includes("amber") ? "#fbbf24" : currentPhase.textColor.includes("red") ? "#fca5a5" : "#c084fc"
                }
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-purple-400 text-sm mb-2", children: "Keys:" }),
            currentPhase.keys.map((key, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 text-purple-300 text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-purple-500" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: key })
            ] }, i))
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 pt-6 border-t border-purple-500/20", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-purple-500 text-xs mb-1", children: "Frequency" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-mono text-purple-300", children: currentPhase.freq })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-4", children: Object.keys(phases).map((phaseKey) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => setActivePhase(phaseKey),
            className: `flex-1 py-4 rounded-lg border transition-all ${activePhase === phaseKey ? `${phases[phaseKey].borderColor} bg-gradient-to-br ${phases[phaseKey].color}` : "border-purple-700/30 bg-purple-950/20 hover:bg-purple-900/30"}`,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: activePhase === phaseKey ? phases[phaseKey].textColor : "text-purple-500", children: phases[phaseKey].name })
          },
          phaseKey
        )) })
      ] })
    ] })
  ] });
};
client.createRoot(document.getElementById("root")).render(
  /* @__PURE__ */ jsxRuntimeExports.jsx(React.StrictMode, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(HecateRCM, {}) })
);
