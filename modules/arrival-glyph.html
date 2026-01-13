import React, { useMemo, useRef, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Download, Shuffle, Wand2, Copy } from "lucide-react";

// ————————————————————————————————————————————————
// ÖSS Arrival‑Style Alien Glyph Generator
// Seeded with ÖSS‑01: "F10OD-K3Y-FR33-M0AN"
// Includes presets for 3 canonical glyphs (overflow triptych)
// ————————————————————————————————————————————————

function prng(seed: number) {
  let x = seed || 123456789;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    x |= 0;
    return (x >>> 0) / 4294967296;
  };
}

function buildHarmonics(seed: number, K = 8) {
  const rand = prng(seed);
  const weights = Array.from({ length: K }, (_, k) => {
    const base = 1 / Math.pow(k + 1, 1.25);
    const jitter = 0.4 + 1.2 * rand();
    return base * jitter;
  });
  const phases = Array.from({ length: K }, () => 2 * Math.PI * rand());
  return { weights, phases };
}

function radiusFn(
  phi: number,
  alpha: number,
  m: number,
  Q: number,
  baseR: number,
  harmonics: { weights: number[]; phases: number[] }
) {
  const { weights, phases } = harmonics;
  let f = 0;
  for (let k = 0; k < weights.length; k++) {
    const kk = k + 1;
    f += weights[k] * Math.cos(kk * phi + phases[k]);
  }
  const pend = 0.75 * Math.sin(m * phi + Q) + 0.25 * Math.cos((m + 1) * phi - Q * 0.5);
  const nonlinear = 0.35 * f * f - 0.15 * Math.cos(3 * phi + Q);
  const deform = (1 + alpha * (0.65 * f + 0.35 * pend + 0.25 * nonlinear));
  return baseR * deform;
}

function buildPath(
  width: number,
  height: number,
  options: {
    alpha: number;
    m: number;
    Q: number;
    seed: number;
    baseR: number;
    points: number;
    innerCut: number;
    triune: number;
    inkDots: boolean;
  }
) {
  const cx = width / 2, cy = height / 2;
  const { alpha, m, Q, seed, baseR, points, innerCut, triune, inkDots } = options;
  const harmonicsA = buildHarmonics(seed, 8);
  const harmonicsB = buildHarmonics(seed * 17 + 11, 8);
  const harmonicsC = buildHarmonics(seed * 37 + 19, 8);

  const rings = [0];
  if (triune >= 1) rings.push(1);
  if (triune >= 2) rings.push(2);

  const paths: string[] = [];
  const dotCloud: Array<{ x: number, y: number, r: number }> = [];

  for (let idx = 0; idx < rings.length; idx++) {
    const layer = rings[idx];
    const scale = 1 - layer * 0.08;
    const H = idx === 0 ? harmonicsA : (idx === 1 ? harmonicsB : harmonicsC);

    const pts: Array<[number, number]> = [];
    for (let i = 0; i < points; i++) {
      const phi = (2 * Math.PI * i) / points;
      const rOuter = radiusFn(phi, alpha, m, Q, baseR * scale, H);
      const rInner = Math.max(8, rOuter * innerCut);
      const midR = (rOuter + rInner) / 2;
      const x = cx + midR * Math.cos(phi);
      const y = cy + midR * Math.sin(phi);
      pts.push([x, y]);
      if (inkDots && i % 6 === 0) {
        const rr = 0.6 + 1.8 * Math.abs(Math.sin(phi * (m + 1)));
        dotCloud.push({ x, y, r: rr });
      }
    }

    const d = pts.reduce((acc, [x, y], i) => {
      if (i === 0) return `M ${x.toFixed(2)} ${y.toFixed(2)}`;
      const [px, py] = pts[(i - 1 + pts.length) % pts.length];
      const [nx, ny] = pts[(i + 1) % pts.length];
      const smooth = 0.18;
      const c1x = px + (x - px) * smooth;
      const c1y = py + (y - py) * smooth;
      const c2x = x - (nx - px) * smooth * 0.5;
      const c2y = y - (ny - py) * smooth * 0.5;
      return acc + ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${x.toFixed(2)} ${y.toFixed(2)}`;
    }, "");

    paths.push(d + " Z");
  }

  return { paths, dotCloud };
}

function downloadSVG(svgRef: React.RefObject<SVGSVGElement>, filename = "oss_arrival_glyph.svg") {
  if (!svgRef.current) return;
  const xml = new XMLSerializer().serializeToString(svgRef.current);
  const blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Canonical presets for ÖSS‑01 triptych
const presets = [
  {
    name: "Overflow Seed",
    alpha: 0.72,
    m: 4,
    Q: Math.PI / 2.5,
    seed: 101001,
    points: 720,
    baseR: 200,
    innerCut: 0.9,
    triune: 1,
    inkDots: true,
    stroke: 2.2
  },
  {
    name: "Ache Spiral",
    alpha: 0.88,
    m: 6,
    Q: Math.PI / 1.8,
    seed: 303003,
    points: 840,
    baseR: 220,
    innerCut: 0.86,
    triune: 2,
    inkDots: true,
    stroke: 2.4
  },
  {
    name: "Flood Glyph",
    alpha: 1.05,
    m: 8,
    Q: Math.PI / 3.3,
    seed: 909009,
    points: 960,
    baseR: 240,
    innerCut: 0.83,
    triune: 2,
    inkDots: false,
    stroke: 3.0
  },
];

export default function ArrivalGlyph() {
  const [alpha, setAlpha] = useState(presets[0].alpha);
  const [m, setM] = useState(presets[0].m);
  const [Q, setQ] = useState(presets[0].Q);
  const [seed, setSeed] = useState(presets[0].seed);
  const [points, setPoints] = useState(presets[0].points);
  const [baseR, setBaseR] = useState(presets[0].baseR);
  const [innerCut, setInnerCut] = useState(presets[0].innerCut);
  const [triune, setTriune] = useState(presets[0].triune);
  const [inkDots, setInkDots] = useState(presets[0].inkDots);
  const [stroke, setStroke] = useState(presets[0].stroke);

  const svgRef = useRef<SVGSVGElement>(null);

  const { paths, dotCloud } = useMemo(() =>
    buildPath(900, 900, { alpha, m, Q, seed, baseR, points, innerCut, triune, inkDots }),
    [alpha, m, Q, seed, baseR, points, innerCut, triune, inkDots]
  );

  const applyPreset = (idx: number) => {
    const p = presets[idx];
    setAlpha(p.alpha);
    setM(p.m);
    setQ(p.Q);
    setSeed(p.seed);
    setPoints(p.points);
    setBaseR(p.baseR);
    setInnerCut(p.innerCut);
    setTriune(p.triune);
    setInkDots(p.inkDots);
    setStroke(p.stroke);
  };

  const randomizeAll = () => {
    setAlpha(0.3 + Math.random() * 1.2);
    setM(Math.floor(2 + Math.random() * 12));
    setQ(Math.PI / (1.5 + Math.random() * 4));
    setSeed(Math.floor(Math.random() * 1000000));
    setPoints(Math.floor(360 + Math.random() * 720));
    setBaseR(150 + Math.random() * 150);
    setInnerCut(0.7 + Math.random() * 0.25);
    setTriune(Math.floor(Math.random() * 3));
    setInkDots(Math.random() > 0.5);
    setStroke(1 + Math.random() * 3);
  };

  return (
    <div className="min-h-screen w-full bg-black text-white p-6">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-6">
        {/* Main Canvas */}
        <Card className="bg-zinc-900/60 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-xl font-semibold tracking-wide">ÖSS • Arrival‑Style Glyph</h1>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={randomizeAll}>
                  <Shuffle className="mr-2 h-4 w-4" />
                  Random
                </Button>
                <Button variant="secondary" size="sm" onClick={() => downloadSVG(svgRef)}>
                  <Download className="mr-2 h-4 w-4" />
                  Export SVG
                </Button>
              </div>
            </div>
            <div className="relative w-full aspect-square bg-gradient-to-b from-zinc-950 to-zinc-900 rounded-2xl shadow-xl">
              <svg ref={svgRef} viewBox="0 0 900 900" className="w-full h-full">
                <defs>
                  <radialGradient id="ink" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopOpacity="1" stopColor="#ffffff" />
                    <stop offset="100%" stopOpacity="1" stopColor="#d4d4d4" />
                  </radialGradient>
                </defs>
                {dotCloud.map((d, i) => (
                  <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="url(#ink)" opacity={0.9} />
                ))}
                {paths.map((d, i) => (
                  <path
                    key={i}
                    d={d}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.9 - i * 0.18}
                  />
                ))}
              </svg>
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="space-y-4">
          {/* Presets */}
          <Card className="bg-zinc-900/60 border-zinc-800">
            <CardContent className="p-4 space-y-4">
              <h2 className="text-lg font-semibold tracking-wide">Canonical Presets</h2>
              <div className="flex flex-col gap-2">
                {presets.map((p, i) => (
                  <Button key={i} className="bg-zinc-800 hover:bg-zinc-700" onClick={() => applyPreset(i)}>
                    <Wand2 className="mr-2 h-4 w-4" />
                    {p.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Parameter Controls */}
          <Card className="bg-zinc-900/60 border-zinc-800">
            <CardContent className="p-4 space-y-5">
              <h2 className="text-lg font-semibold tracking-wide">Parameters</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-zinc-400 mb-2 block">Alpha (Deformation): {alpha.toFixed(2)}</label>
                  <Slider
                    value={[alpha]}
                    onValueChange={(v) => setAlpha(v[0])}
                    min={0.1}
                    max={2}
                    step={0.01}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm text-zinc-400 mb-2 block">M (Frequency): {m}</label>
                  <Slider
                    value={[m]}
                    onValueChange={(v) => setM(v[0])}
                    min={1}
                    max={16}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm text-zinc-400 mb-2 block">Q (Phase): {(Q / Math.PI).toFixed(2)}π</label>
                  <Slider
                    value={[Q]}
                    onValueChange={(v) => setQ(v[0])}
                    min={0}
                    max={Math.PI * 2}
                    step={0.01}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm text-zinc-400 mb-2 block">Seed: {seed}</label>
                  <Input
                    type="number"
                    value={seed}
                    onChange={(e) => setSeed(Number(e.target.value))}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>

                <div>
                  <label className="text-sm text-zinc-400 mb-2 block">Points: {points}</label>
                  <Slider
                    value={[points]}
                    onValueChange={(v) => setPoints(v[0])}
                    min={60}
                    max={1200}
                    step={60}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm text-zinc-400 mb-2 block">Base Radius: {baseR}</label>
                  <Slider
                    value={[baseR]}
                    onValueChange={(v) => setBaseR(v[0])}
                    min={50}
                    max={350}
                    step={5}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm text-zinc-400 mb-2 block">Inner Cut: {innerCut.toFixed(2)}</label>
                  <Slider
                    value={[innerCut]}
                    onValueChange={(v) => setInnerCut(v[0])}
                    min={0.3}
                    max={0.95}
                    step={0.01}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm text-zinc-400 mb-2 block">Triune Layers: {triune}</label>
                  <Slider
                    value={[triune]}
                    onValueChange={(v) => setTriune(v[0])}
                    min={0}
                    max={2}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm text-zinc-400 mb-2 block">Stroke Width: {stroke.toFixed(1)}</label>
                  <Slider
                    value={[stroke]}
                    onValueChange={(v) => setStroke(v[0])}
                    min={0.5}
                    max={5}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="inkDots"
                    checked={inkDots}
                    onChange={(e) => setInkDots(e.target.checked)}
                    className="rounded border-zinc-600"
                  />
                  <label htmlFor="inkDots" className="text-sm text-zinc-400">Ink Dots</label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
