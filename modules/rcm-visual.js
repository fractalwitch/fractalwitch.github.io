import { r as reactExports, j as jsxRuntimeExports, c as client, R as React } from "./client.js";
import { S as Scene, C as Color, F as Fog, P as PerspectiveCamera, W as WebGLRenderer, A as AmbientLight, a as PointLight, T as TorusGeometry, M as MeshPhongMaterial, b as Mesh, c as CatmullRomCurve3, d as TubeGeometry, G as Group, E as EllipseCurve, e as Shape, f as ExtrudeGeometry, D as DoubleSide, g as CylinderGeometry, h as SphereGeometry, i as MeshBasicMaterial, L as LineBasicMaterial, B as BufferGeometry, j as Line, k as BufferAttribute, l as PointsMaterial, m as AdditiveBlending, n as Points, V as Vector3 } from "./three.module.js";
const HecateOSSLattice = () => {
  const mountRef = reactExports.useRef(null);
  const [activePhase, setActivePhase] = reactExports.useState("threshold");
  const [intensity, setIntensity] = reactExports.useState(0.7);
  const [isActivated, setIsActivated] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (!mountRef.current) return;
    const scene = new Scene();
    scene.background = new Color(657935);
    scene.fog = new Fog(657935, 50, 200);
    const camera = new PerspectiveCamera(
      50,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1e3
    );
    camera.position.set(0, 40, 100);
    camera.lookAt(0, 0, 0);
    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);
    const phaseColors = {
      threshold: { primary: 16755200, secondary: 1710618, glow: 16737792 },
      descent: { primary: 9109504, secondary: 4849664, glow: 16717636 },
      sovereignty: { primary: 4854924, secondary: 0, glow: 8146431 }
    };
    const ambientLight = new AmbientLight(2236996, 0.4);
    scene.add(ambientLight);
    const pointLight1 = new PointLight(phaseColors[activePhase].glow, 2, 100);
    pointLight1.position.set(30, 30, 30);
    scene.add(pointLight1);
    const pointLight2 = new PointLight(phaseColors[activePhase].primary, 1.5, 100);
    pointLight2.position.set(-30, 20, -30);
    scene.add(pointLight2);
    const outerTorusGeo = new TorusGeometry(25, 1.5, 32, 64);
    const outerTorusMat = new MeshPhongMaterial({
      color: phaseColors[activePhase].primary,
      emissive: phaseColors[activePhase].glow,
      emissiveIntensity: intensity * 0.3,
      transparent: true,
      opacity: 0.8,
      shininess: 100
    });
    const outerTorus = new Mesh(outerTorusGeo, outerTorusMat);
    scene.add(outerTorus);
    const innerTorusGeo = new TorusGeometry(10, 1, 16, 32);
    const innerTorusMat = new MeshPhongMaterial({
      color: phaseColors[activePhase].secondary,
      emissive: phaseColors[activePhase].primary,
      emissiveIntensity: intensity * 0.5,
      transparent: true,
      opacity: 0.9
    });
    const innerTorus = new Mesh(innerTorusGeo, innerTorusMat);
    innerTorus.position.z = 5;
    scene.add(innerTorus);
    const spiralPoints = [];
    const spiralTurns = 3;
    const spiralHeight = 20;
    const spiralRadius = 9;
    for (let i = 0; i <= 200; i++) {
      const t = i / 200 * spiralTurns * Math.PI * 2;
      const y = i / 200 * spiralHeight - spiralHeight / 2;
      spiralPoints.push(new Vector3(
        Math.cos(t) * spiralRadius,
        y,
        Math.sin(t) * spiralRadius
      ));
    }
    const spiralCurve = new CatmullRomCurve3(spiralPoints);
    const spiralTubeGeo = new TubeGeometry(spiralCurve, 200, 0.75, 8, false);
    const spiralMat = new MeshPhongMaterial({
      color: phaseColors[activePhase].glow,
      emissive: phaseColors[activePhase].glow,
      emissiveIntensity: intensity * 0.7,
      transparent: true,
      opacity: 0.85
    });
    const spiral = new Mesh(spiralTubeGeo, spiralMat);
    scene.add(spiral);
    const bloomGroup = new Group();
    for (let i = 0; i < 6; i++) {
      const angle = i / 6 * Math.PI * 2;
      const petalCurve = new EllipseCurve(
        0,
        0,
        20,
        15,
        0,
        Math.PI / 2,
        false,
        0
      );
      const points = petalCurve.getPoints(50);
      const petalShape = new Shape(points);
      const petalGeo = new ExtrudeGeometry(petalShape, {
        depth: 1,
        bevelEnabled: true,
        bevelThickness: 0.3,
        bevelSize: 0.3,
        bevelSegments: 3
      });
      const petalMat = new MeshPhongMaterial({
        color: phaseColors[activePhase].primary,
        emissive: phaseColors[activePhase].primary,
        emissiveIntensity: intensity * 0.2,
        transparent: true,
        opacity: 0.4,
        side: DoubleSide
      });
      const petal = new Mesh(petalGeo, petalMat);
      petal.rotation.z = angle;
      petal.position.x = Math.cos(angle) * 10;
      petal.position.y = Math.sin(angle) * 10;
      bloomGroup.add(petal);
    }
    scene.add(bloomGroup);
    const baseGeo = new CylinderGeometry(15, 15, 4, 6);
    const baseMat = new MeshPhongMaterial({
      color: 1710638,
      emissive: phaseColors[activePhase].secondary,
      emissiveIntensity: intensity * 0.2,
      transparent: true,
      opacity: 0.7
    });
    const base = new Mesh(baseGeo, baseMat);
    base.position.y = -12;
    scene.add(base);
    const nodeGeometry = new SphereGeometry(3, 32, 32);
    const nodes = [];
    const nodePositions = [
      { name: "threshold", angle: 0, radius: 35, height: 15 },
      { name: "descent", angle: 2 * Math.PI / 3, radius: 35, height: -10 },
      { name: "sovereignty", angle: 4 * Math.PI / 3, radius: 35, height: 15 }
    ];
    nodePositions.forEach((pos) => {
      const isActive = activePhase === pos.name;
      const nodeMat = new MeshPhongMaterial({
        color: phaseColors[pos.name].primary,
        emissive: phaseColors[pos.name].glow,
        emissiveIntensity: isActive ? intensity * 1.2 : intensity * 0.3,
        transparent: true,
        opacity: isActive ? 1 : 0.6
      });
      const node = new Mesh(nodeGeometry, nodeMat);
      node.position.set(
        Math.cos(pos.angle) * pos.radius,
        pos.height,
        Math.sin(pos.angle) * pos.radius
      );
      const glowGeo = new SphereGeometry(5, 16, 16);
      const glowMat = new MeshBasicMaterial({
        color: phaseColors[pos.name].glow,
        transparent: true,
        opacity: isActive ? intensity * 0.3 : 0.1
      });
      const glow = new Mesh(glowGeo, glowMat);
      node.add(glow);
      scene.add(node);
      nodes.push({ mesh: node, data: pos, glow });
    });
    const lineMaterial = new LineBasicMaterial({
      color: phaseColors[activePhase].primary,
      transparent: true,
      opacity: 0.5
    });
    const connectionLines = [];
    for (let i = 0; i < 3; i++) {
      const start = nodes[i].mesh.position;
      const end = nodes[(i + 1) % 3].mesh.position;
      const lineGeo = new BufferGeometry().setFromPoints([start, end]);
      const line = new Line(lineGeo, lineMaterial);
      scene.add(line);
      connectionLines.push(line);
    }
    const particleCount = 100;
    const particleGeo = new BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities = [];
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 10 + Math.random() * 20;
      const height = (Math.random() - 0.5) * 30;
      particlePositions[i * 3] = Math.cos(angle) * radius;
      particlePositions[i * 3 + 1] = height;
      particlePositions[i * 3 + 2] = Math.sin(angle) * radius;
      particleVelocities.push({
        vx: (Math.random() - 0.5) * 0.1,
        vy: (Math.random() - 0.5) * 0.1,
        vz: (Math.random() - 0.5) * 0.1
      });
    }
    particleGeo.setAttribute("position", new BufferAttribute(particlePositions, 3));
    const particleMat = new PointsMaterial({
      color: phaseColors[activePhase].glow,
      size: 0.5,
      transparent: true,
      opacity: 0.6,
      blending: AdditiveBlending
    });
    const particles = new Points(particleGeo, particleMat);
    scene.add(particles);
    let time = 0;
    const animate = () => {
      requestAnimationFrame(animate);
      time += 0.01;
      outerTorus.rotation.x = time * 0.3;
      outerTorus.rotation.y = time * 0.2;
      innerTorus.rotation.x = -time * 0.5;
      innerTorus.rotation.z = time * 0.4;
      spiral.rotation.y = time * 0.6;
      spiral.scale.setScalar(1 + Math.sin(time * 2) * 0.05);
      bloomGroup.rotation.z = time * 0.1;
      bloomGroup.children.forEach((petal, i) => {
        petal.position.x = Math.cos(i / 6 * Math.PI * 2) * (10 + Math.sin(time * 2 + i) * 2);
        petal.position.y = Math.sin(i / 6 * Math.PI * 2) * (10 + Math.sin(time * 2 + i) * 2);
      });
      nodes.forEach((node, i) => {
        const baseAngle = i * 2 * Math.PI / 3;
        const orbitAngle = baseAngle + time * 0.3;
        node.mesh.position.x = Math.cos(orbitAngle) * 35;
        node.mesh.position.z = Math.sin(orbitAngle) * 35;
        node.mesh.position.y = node.data.height + Math.sin(time * 2 + i) * 3;
        if (activePhase === node.data.name && isActivated) {
          node.glow.scale.setScalar(1 + Math.sin(time * 4) * 0.3);
        } else {
          node.glow.scale.setScalar(1);
        }
      });
      connectionLines.forEach((line, i) => {
        const start = nodes[i].mesh.position;
        const end = nodes[(i + 1) % 3].mesh.position;
        line.geometry.setFromPoints([start, end]);
      });
      const positions = particles.geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] += particleVelocities[i].vx;
        positions[i * 3 + 1] += particleVelocities[i].vy;
        positions[i * 3 + 2] += particleVelocities[i].vz;
        if (Math.abs(positions[i * 3]) > 40) particleVelocities[i].vx *= -1;
        if (Math.abs(positions[i * 3 + 1]) > 20) particleVelocities[i].vy *= -1;
        if (Math.abs(positions[i * 3 + 2]) > 40) particleVelocities[i].vz *= -1;
      }
      particles.geometry.attributes.position.needsUpdate = true;
      camera.position.x = Math.sin(time * 0.1) * 100;
      camera.position.z = Math.cos(time * 0.1) * 100;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };
    animate();
    return () => {
      var _a;
      (_a = mountRef.current) == null ? void 0 : _a.removeChild(renderer.domElement);
    };
  }, [activePhase, intensity, isActivated]);
  const phases = [
    { id: "threshold", label: "Threshold", desc: "torch-at-the-door", color: "text-amber-500" },
    { id: "descent", label: "Descent", desc: "seed-under-soil", color: "text-red-700" },
    { id: "sovereignty", label: "Sovereignty", desc: "teeth-of-light", color: "text-purple-600" }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full h-screen bg-black flex flex-col", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: mountRef, className: "flex-1" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-gradient-to-t from-black via-gray-900 to-transparent p-6 space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-light text-white tracking-wide", children: "HECATE_TRINE_RCM × ÖSS Vectorial Lattice" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => setIsActivated(!isActivated),
            className: `px-6 py-2 rounded-full font-medium transition-all ${isActivated ? "bg-amber-500 text-black shadow-lg shadow-amber-500/50" : "bg-gray-800 text-gray-400 border border-gray-700"}`,
            children: isActivated ? "❤️‍🔥 ACTIVATED" : "Activate"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-3", children: phases.map((phase) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => setActivePhase(phase.id),
          className: `p-4 rounded-lg border-2 transition-all ${activePhase === phase.id ? "border-white bg-white bg-opacity-10 shadow-lg" : "border-gray-700 bg-gray-900 hover:border-gray-600"}`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `text-lg font-medium ${phase.color}`, children: phase.label }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-400 italic", children: phase.desc })
          ]
        },
        phase.id
      )) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-sm text-gray-400", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Resonance Intensity" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-white", children: [
            (intensity * 100).toFixed(0),
            "%"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "range",
            min: "0",
            max: "1",
            step: "0.01",
            value: intensity,
            onChange: (e) => setIntensity(parseFloat(e.target.value)),
            className: "w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 text-center italic pt-2 border-t border-gray-800", children: '"Hecate, hold my edges in true fire; tune me across and back."' })
    ] })
  ] });
};
client.createRoot(document.getElementById("root")).render(
  /* @__PURE__ */ jsxRuntimeExports.jsx(React.StrictMode, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(HecateOSSLattice, {}) })
);
