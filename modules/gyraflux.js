import { r as reactExports, j as jsxRuntimeExports, c as client, R as React } from "./client.js";
import { P as Pause, a as Play, R as RotateCcw } from "./rotate-ccw.js";
import { c as createLucideIcon } from "./createLucideIcon.js";
import { Z as Zap } from "./zap.js";
import { E as Eye } from "./eye.js";
/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Activity = createLucideIcon("Activity", [
  ["path", { d: "M22 12h-4l-3 9L9 3l-3 9H2", key: "d5dnw9" }]
]);
const GyrafluxSimulation = () => {
  const canvasRef = reactExports.useRef(null);
  const [isRunning, setIsRunning] = reactExports.useState(false);
  const [time, setTime] = reactExports.useState(0);
  const [mode, setMode] = reactExports.useState("threshold");
  const [ringState, setRingState] = reactExports.useState({
    x: 0,
    y: 0,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    omega: 0,
    E: 50,
    phi: 0.5
  });
  const [metrics, setMetrics] = reactExports.useState({
    rho_n: 0.5,
    G: 1,
    lambda_clip: 0,
    breath_phase: 0
  });
  const [forceInput, setForceInput] = reactExports.useState({ x: 0, y: 0 });
  const [breathSync, setBreathSync] = reactExports.useState(false);
  const LAMBDA_MAX = 10;
  const G0 = 1;
  const SIGMA = 2;
  const GAMMA = 0.3;
  const BETA = 1.5;
  const [latticeField, setLatticeField] = reactExports.useState(() => {
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
  const computeRhoN = (ringState2, envState, breathPhase) => {
    const sA = Math.sqrt(ringState2.E) * (breathSync ? 1.5 : 1);
    const sB = envState;
    const breathBonus = breathSync ? 0.3 * Math.cos(breathPhase) : 0;
    return Math.max(0, Math.min(1, sA * sB / (sA + sB + 1) + breathBonus));
  };
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
  const computeG = (rho_n) => {
    return Math.min(3, G0 * (1 + SIGMA * rho_n));
  };
  const updateEnergy = (E, G, work, clipRatio, breathPhase, dt) => {
    const P_in = 0.5 * G * work + (breathSync ? BETA * Math.cos(breathPhase) : 0);
    const P_out = GAMMA * E + clipRatio * E;
    return Math.max(0, E + (P_in - P_out) * dt);
  };
  const updateLatticeField = (x, y, rho_n, E) => {
    setLatticeField((prev) => {
      const next = prev.map((row) => [...row]);
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
  const updatePhysics = (dt) => {
    setTime((t) => t + dt);
    const breathPhase = breathSync ? time * 0.3 % (2 * Math.PI) : 0;
    const envState = latticeField.reduce((sum, row) => sum + row.reduce((s, v) => s + v, 0), 0) / 400;
    const rho_n = computeRhoN(ringState, envState, breathPhase);
    const G = computeG(rho_n);
    const { fx, fy, clipped } = projectLambda(forceInput.x, forceInput.y);
    const ax = fx / (1 + 0.5 * clipped);
    const ay = fy / (1 + 0.5 * clipped);
    const drag = 0.5 / G;
    const nvx = ringState.vx + ax * dt - ringState.vx * drag * dt;
    const nvy = ringState.vy + ay * dt - ringState.vy * drag * dt;
    const nx = ringState.x + nvx * dt;
    const ny = ringState.y + nvy * dt;
    const boundX = Math.abs(nx) > 180 ? -0.8 * nvx : nvx;
    const boundY = Math.abs(ny) > 180 ? -0.8 * nvy : nvy;
    const finalX = Math.max(-180, Math.min(180, nx));
    const finalY = Math.max(-180, Math.min(180, ny));
    const work = Math.abs(fx * nvx + fy * nvy);
    const newE = updateEnergy(ringState.E, G, work, clipped, breathPhase, dt);
    const dPhi = -0.5 * ringState.phi + G * rho_n * 0.5;
    const newPhi = Math.max(0, Math.min(1, ringState.phi + dPhi * dt));
    const newOmega = (ringState.omega + newE / 50 * dt) % (2 * Math.PI);
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
  reactExports.useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      updatePhysics(0.05);
    }, 50);
    return () => clearInterval(interval);
  }, [isRunning, ringState, forceInput, breathSync, latticeField, time]);
  reactExports.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = "rgba(10, 5, 20, 0.15)";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 20; i++) {
      for (let j = 0; j < 20; j++) {
        const val = latticeField[i][j];
        const x = i * 20;
        const y = j * 20;
        if (val > 0.1) {
          const r2 = metrics.rho_n < 0.3 ? 100 : metrics.rho_n < 0.7 ? 200 : 200;
          const g2 = metrics.rho_n < 0.3 ? 150 : metrics.rho_n < 0.7 ? 180 : 100;
          const b2 = metrics.rho_n < 0.3 ? 255 : metrics.rho_n < 0.7 ? 100 : 255;
          ctx.fillStyle = `rgba(${r2}, ${g2}, ${b2}, ${val * 0.3})`;
          ctx.fillRect(x, y, 20, 20);
          if (val > 0.5) {
            ctx.fillStyle = `rgba(255, 255, 255, ${val * 0.5})`;
            ctx.beginPath();
            ctx.arc(x + 10, y + 10, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.strokeStyle = "rgba(100, 80, 150, 0.1)";
        ctx.strokeRect(x, y, 20, 20);
      }
    }
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.strokeStyle = "rgba(150, 50, 200, 0.3)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, LAMBDA_MAX * 10, 0, Math.PI * 2);
    ctx.stroke();
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
    ctx.strokeStyle = `rgba(200, 100, 255, ${0.2 + metrics.rho_n * 0.4})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    const traceRadius = 80 + metrics.G * 15;
    for (let a = 0; a < Math.PI * 2; a += 0.1) {
      const r2 = traceRadius + Math.sin(a * 3 + time) * 10 * metrics.phi;
      const tx = Math.cos(a) * r2;
      const ty = Math.sin(a) * r2;
      if (a === 0) ctx.moveTo(tx, ty);
      else ctx.lineTo(tx, ty);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.translate(ringState.x, ringState.y);
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.beginPath();
    ctx.ellipse(0, ringState.z * 0.5 + 30, 35, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    const glowRadius = 30 + ringState.E * 0.3;
    const gradient = ctx.createRadialGradient(0, 0, 15, 0, 0, glowRadius);
    const r = metrics.rho_n < 0.3 ? 100 : metrics.rho_n < 0.7 ? 255 : 200;
    const g = metrics.rho_n < 0.3 ? 150 : metrics.rho_n < 0.7 ? 200 : 100;
    const b = metrics.rho_n < 0.3 ? 255 : metrics.rho_n < 0.7 ? 100 : 255;
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${ringState.E / 100})`);
    gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${ringState.E / 200})`);
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.lineWidth = 4;
    ctx.shadowBlur = 15;
    ctx.shadowColor = `rgb(${r}, ${g}, ${b})`;
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    const rx = Math.cos(ringState.omega) * 22;
    const ry = Math.sin(ringState.omega) * 22;
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(rx, ry, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(255, 255, 255, ${ringState.phi * 0.5})`;
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const angle = i / 8 * Math.PI * 2 + time * 0.5;
      const dist = 30 + ringState.phi * 20;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * dist, Math.sin(angle) * dist);
      ctx.stroke();
    }
    ctx.restore();
    if (metrics.lambda_clip > 0) {
      ctx.fillStyle = `rgba(255, 50, 50, ${metrics.lambda_clip * 0.7})`;
      ctx.fillRect(0, 0, w, 10);
      ctx.fillRect(0, h - 10, w, 10);
    }
    ctx.font = "12px monospace";
    ctx.fillStyle = "rgba(200, 200, 255, 0.8)";
    ctx.fillText(`VOLUME: ${(metrics.G * 100).toFixed(0)}%`, 10, 20);
    ctx.fillText(`TRANSFORM: ${mode.toUpperCase()}`, 10, 35);
  }, [ringState, metrics, latticeField, mode, time]);
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
        x: dx / dist * 5,
        y: dy / dist * 5
      });
    } else {
      setForceInput({ x: 0, y: 0 });
    }
  };
  const handleReset = () => {
    setIsRunning(false);
    setTime(0);
    setRingState({
      x: 0,
      y: 0,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      omega: 0,
      E: 50,
      phi: 0.5
    });
    setMetrics({
      rho_n: 0.5,
      G: 1,
      lambda_clip: 0,
      breath_phase: 0
    });
    setForceInput({ x: 0, y: 0 });
  };
  const getModeColor = (m) => {
    switch (m) {
      case "threshold":
        return "text-amber-400";
      case "descent":
        return "text-red-400";
      case "sovereignty":
        return "text-purple-400";
      default:
        return "text-gray-400";
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full h-screen bg-gray-900 text-white flex flex-col", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-gray-800 border-b border-gray-700", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold mb-2", children: "🌀 GYRAFLUX: ρₙ-Loop Simulation Suite" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-400", children: "Full V.E.D.A. Architecture — ΣΩ Lawframe Active" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 flex", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 relative", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "canvas",
        {
          ref: canvasRef,
          width: 400,
          height: 400,
          className: "w-full h-full cursor-pointer",
          onMouseMove: handleMouseMove,
          onMouseLeave: () => setForceInput({ x: 0, y: 0 })
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-80 bg-gray-800 p-4 overflow-y-auto", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold mb-3", children: "Control Matrix" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 mb-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: () => setIsRunning(!isRunning),
                className: "flex-1 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded flex items-center justify-center gap-2",
                children: [
                  isRunning ? /* @__PURE__ */ jsxRuntimeExports.jsx(Pause, { size: 16 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { size: 16 }),
                  isRunning ? "Pause" : "Activate"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: handleReset,
                className: "bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { size: 16 })
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => setBreathSync(!breathSync),
              className: `w-full px-4 py-2 rounded mb-2 flex items-center justify-center gap-2 ${breathSync ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-700 hover:bg-gray-600"}`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Activity, { size: 16 }),
                "Breath Sync ",
                breathSync ? "ON" : "OFF"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm mb-2", children: "Hecate Phase" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2", children: ["threshold", "descent", "sovereignty"].map((m) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => setMode(m),
                className: `flex-1 px-2 py-1 rounded text-xs ${mode === m ? "bg-purple-600" : "bg-gray-700"}`,
                children: m
              },
              m
            )) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-lg font-semibold mb-3 flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { size: 18 }),
            "Telemetry"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm mb-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "ρₙ (Reciprocity)" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono", children: metrics.rho_n.toFixed(3) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2 bg-gray-700 rounded overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: "h-full bg-gradient-to-r from-blue-500 via-yellow-500 to-purple-500 transition-all",
                  style: { width: `${metrics.rho_n * 100}%` }
                }
              ) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm mb-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "G (Generosity)" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono", children: [
                  metrics.G.toFixed(2),
                  "x"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2 bg-gray-700 rounded overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: "h-full bg-green-500 transition-all",
                  style: { width: `${metrics.G / 3 * 100}%` }
                }
              ) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm mb-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "E (Energy)" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono", children: ringState.E.toFixed(1) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2 bg-gray-700 rounded overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: "h-full bg-yellow-500 transition-all",
                  style: { width: `${ringState.E}%` }
                }
              ) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm mb-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "φ (Felt Field)" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono", children: ringState.phi.toFixed(3) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2 bg-gray-700 rounded overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: "h-full bg-purple-500 transition-all",
                  style: { width: `${ringState.phi * 100}%` }
                }
              ) })
            ] }),
            metrics.lambda_clip > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-red-900 border border-red-600 rounded p-2 text-xs", children: [
              "⚠️ λ-CONSTRAINT ACTIVE: Force clipped ",
              (metrics.lambda_clip * 100).toFixed(0),
              "%"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold mb-3", children: "Ring State Vector" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-gray-900 rounded p-3 font-mono text-xs space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              "pos: (",
              ringState.x.toFixed(1),
              ", ",
              ringState.y.toFixed(1),
              ", ",
              ringState.z.toFixed(1),
              ")"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              "vel: (",
              ringState.vx.toFixed(2),
              ", ",
              ringState.vy.toFixed(2),
              ")"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              "ω: ",
              ringState.omega.toFixed(3),
              " rad"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              "E: ",
              ringState.E.toFixed(2),
              " J"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              "φ: ",
              ringState.phi.toFixed(3)
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-lg font-semibold mb-3 flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { size: 18 }),
            "Hecate Matrix"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `p-2 rounded ${mode === "threshold" ? "bg-amber-900" : "bg-gray-900"}`, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold", children: "Threshold" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-400", children: "3:7:13 • lamp-black ember-gold" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `p-2 rounded ${mode === "descent" ? "bg-red-900" : "bg-gray-900"}`, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold", children: "Descent" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-400", children: "9:9:1 • pomegranate-oxblood" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `p-2 rounded ${mode === "sovereignty" ? "bg-purple-900" : "bg-gray-900"}`, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold", children: "Sovereignty" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-400", children: "11:2:0 • obsidian-violet" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-gray-500 space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "🖱️ Hover near ring to apply gentle force" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "🌬️ Enable breath sync for resonance boost" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "⚡ Watch λ-constraint enforce non-domination" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "💜 High ρₙ = smooth flow, rich harmonics" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "🌀 Ring traces ΣΩ circulation on lattice" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-2 bg-gray-800 border-t border-gray-700 flex justify-between text-xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
        "Time: ",
        time.toFixed(2),
        "s"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: getModeColor(mode), children: [
        "Mode: ",
        mode.toUpperCase()
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "ΣΩ Lawframe v1.0.0" })
    ] })
  ] });
};
client.createRoot(document.getElementById("root")).render(
  /* @__PURE__ */ jsxRuntimeExports.jsx(React.StrictMode, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(GyrafluxSimulation, {}) })
);
