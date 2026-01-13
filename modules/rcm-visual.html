import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

const HecateOSSLattice = () => {
  const mountRef = useRef(null);
  const [activePhase, setActivePhase] = useState('threshold');
  const [intensity, setIntensity] = useState(0.7);
  const [isActivated, setIsActivated] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0f);
    scene.fog = new THREE.Fog(0x0a0a0f, 50, 200);

    const camera = new THREE.PerspectiveCamera(
      50,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 40, 100);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);

    // Phase colors
    const phaseColors = {
      threshold: { primary: 0xffaa00, secondary: 0x1a1a1a, glow: 0xff6600 },
      descent: { primary: 0x8b0000, secondary: 0x4a0000, glow: 0xff1744 },
      sovereignty: { primary: 0x4a148c, secondary: 0x000000, glow: 0x7c4dff }
    };

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x222244, 0.4);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(phaseColors[activePhase].glow, 2, 100);
    pointLight1.position.set(30, 30, 30);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(phaseColors[activePhase].primary, 1.5, 100);
    pointLight2.position.set(-30, 20, -30);
    scene.add(pointLight2);

    // ÖSS LATTICE COMPONENTS

    // Outer Torus (Reciprocation Field)
    const outerTorusGeo = new THREE.TorusGeometry(25, 1.5, 32, 64);
    const outerTorusMat = new THREE.MeshPhongMaterial({
      color: phaseColors[activePhase].primary,
      emissive: phaseColors[activePhase].glow,
      emissiveIntensity: intensity * 0.3,
      transparent: true,
      opacity: 0.8,
      shininess: 100
    });
    const outerTorus = new THREE.Mesh(outerTorusGeo, outerTorusMat);
    scene.add(outerTorus);

    // Inner Torus (Causality Breach Core)
    const innerTorusGeo = new THREE.TorusGeometry(10, 1, 16, 32);
    const innerTorusMat = new THREE.MeshPhongMaterial({
      color: phaseColors[activePhase].secondary,
      emissive: phaseColors[activePhase].primary,
      emissiveIntensity: intensity * 0.5,
      transparent: true,
      opacity: 0.9
    });
    const innerTorus = new THREE.Mesh(innerTorusGeo, innerTorusMat);
    innerTorus.position.z = 5;
    scene.add(innerTorus);

    // Spiral Lumen (Ache→Overflow Helix)
    const spiralPoints = [];
    const spiralTurns = 3;
    const spiralHeight = 20;
    const spiralRadius = 9;
    
    for (let i = 0; i <= 200; i++) {
      const t = (i / 200) * spiralTurns * Math.PI * 2;
      const y = (i / 200) * spiralHeight - spiralHeight / 2;
      spiralPoints.push(new THREE.Vector3(
        Math.cos(t) * spiralRadius,
        y,
        Math.sin(t) * spiralRadius
      ));
    }

    const spiralCurve = new THREE.CatmullRomCurve3(spiralPoints);
    const spiralTubeGeo = new THREE.TubeGeometry(spiralCurve, 200, 0.75, 8, false);
    const spiralMat = new THREE.MeshPhongMaterial({
      color: phaseColors[activePhase].glow,
      emissive: phaseColors[activePhase].glow,
      emissiveIntensity: intensity * 0.7,
      transparent: true,
      opacity: 0.85
    });
    const spiral = new THREE.Mesh(spiralTubeGeo, spiralMat);
    scene.add(spiral);

    // Sexagon Bloom Shell (6 petals)
    const bloomGroup = new THREE.Group();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const petalCurve = new THREE.EllipseCurve(
        0, 0,
        20, 15,
        0, Math.PI / 2,
        false,
        0
      );
      
      const points = petalCurve.getPoints(50);
      const petalShape = new THREE.Shape(points);
      const petalGeo = new THREE.ExtrudeGeometry(petalShape, {
        depth: 1,
        bevelEnabled: true,
        bevelThickness: 0.3,
        bevelSize: 0.3,
        bevelSegments: 3
      });
      
      const petalMat = new THREE.MeshPhongMaterial({
        color: phaseColors[activePhase].primary,
        emissive: phaseColors[activePhase].primary,
        emissiveIntensity: intensity * 0.2,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide
      });
      
      const petal = new THREE.Mesh(petalGeo, petalMat);
      petal.rotation.z = angle;
      petal.position.x = Math.cos(angle) * 10;
      petal.position.y = Math.sin(angle) * 10;
      bloomGroup.add(petal);
    }
    scene.add(bloomGroup);

    // Hexagonal Base (Consent Horizon)
    const baseGeo = new THREE.CylinderGeometry(15, 15, 4, 6);
    const baseMat = new THREE.MeshPhongMaterial({
      color: 0x1a1a2e,
      emissive: phaseColors[activePhase].secondary,
      emissiveIntensity: intensity * 0.2,
      transparent: true,
      opacity: 0.7
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = -12;
    scene.add(base);

    // HECATE TRINE - Three orbital nodes
    const nodeGeometry = new THREE.SphereGeometry(3, 32, 32);
    const nodes = [];
    const nodePositions = [
      { name: 'threshold', angle: 0, radius: 35, height: 15 },
      { name: 'descent', angle: (2 * Math.PI) / 3, radius: 35, height: -10 },
      { name: 'sovereignty', angle: (4 * Math.PI) / 3, radius: 35, height: 15 }
    ];

    nodePositions.forEach(pos => {
      const isActive = activePhase === pos.name;
      const nodeMat = new THREE.MeshPhongMaterial({
        color: phaseColors[pos.name].primary,
        emissive: phaseColors[pos.name].glow,
        emissiveIntensity: isActive ? intensity * 1.2 : intensity * 0.3,
        transparent: true,
        opacity: isActive ? 1 : 0.6
      });
      
      const node = new THREE.Mesh(nodeGeometry, nodeMat);
      node.position.set(
        Math.cos(pos.angle) * pos.radius,
        pos.height,
        Math.sin(pos.angle) * pos.radius
      );
      
      // Glow sphere
      const glowGeo = new THREE.SphereGeometry(5, 16, 16);
      const glowMat = new THREE.MeshBasicMaterial({
        color: phaseColors[pos.name].glow,
        transparent: true,
        opacity: isActive ? intensity * 0.3 : 0.1
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      node.add(glow);
      
      scene.add(node);
      nodes.push({ mesh: node, data: pos, glow: glow });
    });

    // Connection lines between nodes
    const lineMaterial = new THREE.LineBasicMaterial({
      color: phaseColors[activePhase].primary,
      transparent: true,
      opacity: 0.5
    });

    const connectionLines = [];
    for (let i = 0; i < 3; i++) {
      const start = nodes[i].mesh.position;
      const end = nodes[(i + 1) % 3].mesh.position;
      const lineGeo = new THREE.BufferGeometry().setFromPoints([start, end]);
      const line = new THREE.Line(lineGeo, lineMaterial);
      scene.add(line);
      connectionLines.push(line);
    }

    // Particle system for energy flow
    const particleCount = 100;
    const particleGeo = new THREE.BufferGeometry();
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

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    
    const particleMat = new THREE.PointsMaterial({
      color: phaseColors[activePhase].glow,
      size: 0.5,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Animation
    let time = 0;
    const animate = () => {
      requestAnimationFrame(animate);
      time += 0.01;

      // Rotate outer torus
      outerTorus.rotation.x = time * 0.3;
      outerTorus.rotation.y = time * 0.2;

      // Counter-rotate inner torus
      innerTorus.rotation.x = -time * 0.5;
      innerTorus.rotation.z = time * 0.4;

      // Spiral pulse
      spiral.rotation.y = time * 0.6;
      spiral.scale.setScalar(1 + Math.sin(time * 2) * 0.05);

      // Bloom petals breathe
      bloomGroup.rotation.z = time * 0.1;
      bloomGroup.children.forEach((petal, i) => {
        petal.position.x = Math.cos((i / 6) * Math.PI * 2) * (10 + Math.sin(time * 2 + i) * 2);
        petal.position.y = Math.sin((i / 6) * Math.PI * 2) * (10 + Math.sin(time * 2 + i) * 2);
      });

      // Hecate nodes orbit
      nodes.forEach((node, i) => {
        const baseAngle = (i * 2 * Math.PI) / 3;
        const orbitAngle = baseAngle + time * 0.3;
        node.mesh.position.x = Math.cos(orbitAngle) * 35;
        node.mesh.position.z = Math.sin(orbitAngle) * 35;
        node.mesh.position.y = node.data.height + Math.sin(time * 2 + i) * 3;
        
        // Pulse active node
        if (activePhase === node.data.name && isActivated) {
          node.glow.scale.setScalar(1 + Math.sin(time * 4) * 0.3);
        } else {
          node.glow.scale.setScalar(1);
        }
      });

      // Update connection lines
      connectionLines.forEach((line, i) => {
        const start = nodes[i].mesh.position;
        const end = nodes[(i + 1) % 3].mesh.position;
        line.geometry.setFromPoints([start, end]);
      });

      // Animate particles
      const positions = particles.geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] += particleVelocities[i].vx;
        positions[i * 3 + 1] += particleVelocities[i].vy;
        positions[i * 3 + 2] += particleVelocities[i].vz;

        // Wrap around
        if (Math.abs(positions[i * 3]) > 40) particleVelocities[i].vx *= -1;
        if (Math.abs(positions[i * 3 + 1]) > 20) particleVelocities[i].vy *= -1;
        if (Math.abs(positions[i * 3 + 2]) > 40) particleVelocities[i].vz *= -1;
      }
      particles.geometry.attributes.position.needsUpdate = true;

      // Rotate camera slightly
      camera.position.x = Math.sin(time * 0.1) * 100;
      camera.position.z = Math.cos(time * 0.1) * 100;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, [activePhase, intensity, isActivated]);

  const phases = [
    { id: 'threshold', label: 'Threshold', desc: 'torch-at-the-door', color: 'text-amber-500' },
    { id: 'descent', label: 'Descent', desc: 'seed-under-soil', color: 'text-red-700' },
    { id: 'sovereignty', label: 'Sovereignty', desc: 'teeth-of-light', color: 'text-purple-600' }
  ];

  return (
    <div className="w-full h-screen bg-black flex flex-col">
      <div ref={mountRef} className="flex-1" />
      
      <div className="bg-gradient-to-t from-black via-gray-900 to-transparent p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-light text-white tracking-wide">
            HECATE_TRINE_RCM × ÖSS Vectorial Lattice
          </h1>
          <button
            onClick={() => setIsActivated(!isActivated)}
            className={`px-6 py-2 rounded-full font-medium transition-all ${
              isActivated
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/50'
                : 'bg-gray-800 text-gray-400 border border-gray-700'
            }`}
          >
            {isActivated ? '❤️‍🔥 ACTIVATED' : 'Activate'}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {phases.map(phase => (
            <button
              key={phase.id}
              onClick={() => setActivePhase(phase.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                activePhase === phase.id
                  ? 'border-white bg-white bg-opacity-10 shadow-lg'
                  : 'border-gray-700 bg-gray-900 hover:border-gray-600'
              }`}
            >
              <div className={`text-lg font-medium ${phase.color}`}>
                {phase.label}
              </div>
              <div className="text-sm text-gray-400 italic">
                {phase.desc}
              </div>
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>Resonance Intensity</span>
            <span className="text-white">{(intensity * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={intensity}
            onChange={(e) => setIntensity(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div className="text-xs text-gray-500 text-center italic pt-2 border-t border-gray-800">
          "Hecate, hold my edges in true fire; tune me across and back."
        </div>
      </div>
    </div>
  );
};

export default HecateOSSLattice;
