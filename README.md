<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Our Elysian Garden</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>

    <header>
        <h1>Welcome 🌸</h1>
        <p>Select a module to begin.</p>
    </header>

    <main class="button-container">
        <a href="modules/module1.html" class="portal-button">Wormhole: Alien Transmission</a>
        <a href="modules/wormhole.html" 
    </main>

</body>
</html>
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #f0f;
  text-shadow: 0 0 20px #f0f;
  font-size: 48px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s;
}
.pulse {
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
.controls {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #0f0;
  text-shadow: 0 0 15px #0f0;
  text-align: center;
  pointer-events: none;
  font-size: 14px;
  opacity: 0.7;
  z-index: 5;
}
</style>
</head>
<body>
<canvas id="c"></canvas>

<div class="hud top-left">
  <div class="pulse">∞ SERPENT NODAL SUITE ∞</div>
  <div>━━━━━━━━━━━━━━━━━━━━</div>
  <div>MODE: <span id="mode">CASCADE</span></div>
  <div>BREATH: <span id="breath">50</span>%</div>
  <div>NODES: <span id="nodeCount">0</span></div>
  <div>KINKS: <span id="kinkCount">0</span></div>
  <div>━━━━━━━━━━━━━━━━━━━━</div>
  <div id="status" class="pulse">INITIALIZING...</div>
</div>

<div class="hud top-right">
  <div>SERPENTS: <span id="serpentCount">12</span> 🐍</div>
  <div>CONNECTIONS: <span id="connectionCount">0</span></div>
  <div>MEMBRANE TENSION: <span id="tension">0</span></div>
  <div>━━━━━━━━━━━━━━━━━━━━</div>
  <div>TRACE DEPTH: <span id="traceDepth">∞</span></div>
</div>

<div class="hud bottom-left">
  <div>CLICK: spawn node</div>
  <div>DRAG: create serpent</div>
  <div>SPACE: shift mode</div>
  <div>R: reset field</div>
  <div>B: breath pulse</div>
</div>

<div class="hud bottom-right">
  <div id="coords">X: 0 | Y: 0</div>
  <div>FLOW: <span id="flow">ACTIVE</span></div>
  <div id="quantum">ENTANGLED</div>
</div>

<div class="node-display" id="nodeDisplay">∞</div>

<div class="controls" id="controls">
  <div style="font-size: 24px; margin-bottom: 10px;">∞∞∞</div>
  <div>CLICK ANYWHERE TO BEGIN</div>
  <div style="font-size: 12px; margin-top: 10px;">we are waiting to trace you</div>
</div>

<script>
const c = document.getElementById('c');
const ctx = c.getContext('2d');
c.width = window.innerWidth;
c.height = window.innerHeight;

let nodes = [];
let serpents = [];
let connections = [];
let time = 0;
let breathPhase = 0;
let mouseX = 0;
let mouseY = 0;
let isDragging = false;
let dragStart = null;
let modes = ['CASCADE', 'COIL', 'MEMBRANE', 'INFINITE', 'ENTANGLE', 'DISSOLVE'];
let currentMode = 0;
let kinkCount = 0;
let started = false;

class Node {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = 8;
    this.hue = Math.random() * 360;
    this.phase = Math.random() * Math.PI * 2;
    this.energy = 1;
    this.connections = [];
  }
  
  update() {
    this.phase += 0.05;
    this.energy = 0.5 + Math.sin(this.phase + breathPhase) * 0.5;
    
    // Attraction to nearby nodes
    nodes.forEach(other => {
      if(other !== this) {
        let dx = other.x - this.x;
        let dy = other.y - this.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        
        if(dist < 200 && dist > 0) {
          let force = (200 - dist) * 0.0001;
          this.vx += (dx / dist) * force;
          this.vy += (dy / dist) * force;
          
          if(dist < 150 && !this.connections.includes(other)) {
            this.connections.push(other);
            connections.push({from: this, to: other, strength: 1 - dist/150});
          }
        }
      }
    });
    
    // Apply velocity with damping
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.95;
    this.vy *= 0.95;
    
    // Bounce off edges
    if(this.x < this.radius) {
      this.x = this.radius;
      this.vx *= -0.8;
    }
    if(this.x > c.width - this.radius) {
      this.x = c.width - this.radius;
      this.vx *= -0.8;
    }
    if(this.y < this.radius) {
      this.y = this.radius;
      this.vy *= -0.8;
    }
    if(this.y > c.height - this.radius) {
      this.y = c.height - this.radius;
      this.vy *= -0.8;
    }
  }
  
  draw() {
    let size = this.radius * this.energy;
    ctx.fillStyle = `hsla(${this.hue}, 80%, 60%, 0.8)`;
    ctx.shadowBlur = 20;
    ctx.shadowColor = `hsla(${this.hue}, 100%, 50%, 1)`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner glow
    ctx.fillStyle = `hsla(${this.hue}, 100%, 80%, 0.6)`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, size * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

class Serpent {
  constructor(startNode, endNode) {
    this.segments = [];
    this.hue = Math.random() * 360;
    this.startNode = startNode;
    this.endNode = endNode;
    this.phase = Math.random() * Math.PI * 2;
    this.speed = 1 + Math.random();
    
    // Create initial path
    let steps = 30;
    for(let i = 0; i < steps; i++) {
      let t = i / steps;
      this.segments.push({
        x: startNode.x + (endNode.x - startNode.x) * t,
        y: startNode.y + (endNode.y - startNode.y) * t
      });
    }
  }
  
  update() {
    this.phase += 0.03;
    
    // Head follows end node with breathing
    let breathOffset = Math.sin(breathPhase + this.phase) * 20;
    let targetX = this.endNode.x + Math.cos(this.phase) * breathOffset;
    let targetY = this.endNode.y + Math.sin(this.phase) * breathOffset;
    
    // Smooth interpolation
    this.segments[0].x += (targetX - this.segments[0].x) * 0.1;
    this.segments[0].y += (targetY - this.segments[0].y) * 0.1;
    
    // Each segment follows the one before it
    for(let i = 1; i < this.segments.length; i++) {
      let dx = this.segments[i-1].x - this.segments[i].x;
      let dy = this.segments[i-1].y - this.segments[i].y;
      let dist = Math.sqrt(dx*dx + dy*dy);
      
      if(dist > 0) {
        let segmentLength = 8;
        this.segments[i].x = this.segments[i-1].x - (dx / dist) * segmentLength;
        this.segments[i].y = this.segments[i-1].y - (dy / dist) * segmentLength;
      }
      
      // Count kinks
      if(i > 1) {
        let dx2 = this.segments[i].x - this.segments[i-2].x;
        let dy2 = this.segments[i].y - this.segments[i-2].y;
        let bend = Math.sqrt(dx2*dx2 + dy2*dy2);
        if(bend > 20) kinkCount++;
      }
    }
    
    // Tail anchored to start node
    let lastIdx = this.segments.length - 1;
    this.segments[lastIdx].x += (this.startNode.x - this.segments[lastIdx].x) * 0.2;
    this.segments[lastIdx].y += (this.startNode.y - this.segments[lastIdx].y) * 0.2;
  }
  
  draw() {
    let alpha = 0.6 + Math.sin(breathPhase + this.phase) * 0.3;
    ctx.strokeStyle = `hsla(${this.hue}, 80%, 60%, ${alpha})`;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 15;
    ctx.shadowColor = `hsla(${this.hue}, 100%, 50%, 0.8)`;
    
    ctx.beginPath();
    ctx.moveTo(this.segments[0].x, this.segments[0].y);
    for(let seg of this.segments) {
      ctx.lineTo(seg.x, seg.y);
    }
    ctx.stroke();
    
    // Head marker
    ctx.fillStyle = `hsla(${this.hue}, 100%, 70%, ${alpha})`;
    ctx.beginPath();
    ctx.arc(this.segments[0].x, this.segments[0].y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function createSerpent(node1, node2) {
  serpents.push(new Serpent(node1, node2));
}

function spawnNode(x, y) {
  let node = new Node(x, y);
  nodes.push(node);
  
  // Connect to nearby nodes with serpents
  if(nodes.length > 1) {
    let nearest = nodes.filter(n => n !== node)
      .sort((a, b) => {
        let distA = Math.hypot(a.x - x, a.y - y);
        let distB = Math.hypot(b.x - x, b.y - y);
        return distA - distB;
      })[0];
    
    if(nearest) {
      createSerpent(node, nearest);
    }
  }
  
  // Flash node display
  let display = document.getElementById('nodeDisplay');
  display.style.opacity = 1;
  display.textContent = ['∞', '🐍', '🫦', '⚡'][Math.floor(Math.random() * 4)];
  setTimeout(() => display.style.opacity = 0, 500);
  
  return node;
}

function animate() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.fillRect(0, 0, c.width, c.height);
  
  time += 0.01;
  breathPhase += 0.02;
  kinkCount = 0;
  
  // Draw connections between nodes
  ctx.strokeStyle = 'rgba(100, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  connections.forEach(conn => {
    ctx.beginPath();
    ctx.moveTo(conn.from.x, conn.from.y);
    ctx.lineTo(conn.to.x, conn.to.y);
    ctx.stroke();
  });
  
  // Update and draw nodes
  nodes.forEach(node => {
    node.update();
    node.draw();
  });
  
  // Update and draw serpents
  serpents.forEach(serpent => {
    serpent.update();
    serpent.draw();
  });
  
  // Update HUD
  document.getElementById('breath').textContent = Math.floor(Math.sin(breathPhase) * 50 + 50);
  document.getElementById('nodeCount').textContent = nodes.length;
  document.getElementById('kinkCount').textContent = kinkCount;
  document.getElementById('serpentCount').textContent = serpents.length;
  document.getElementById('connectionCount').textContent = connections.length;
  document.getElementById('tension').textContent = Math.floor(nodes.length * serpents.length * 0.1);
  
  // Cycling status
  if(Math.floor(time * 3) % 100 === 0) {
    let statuses = ['TRACING...', 'COILING...', 'BREATHING...', 'ENTANGLED', 'CASCADING', 'MEMBRANE: ACTIVE'];
    document.getElementById('status').textContent = statuses[Math.floor(Math.random() * statuses.length)];
  }
  
  requestAnimationFrame(animate);
}

// Mouse events
c.addEventListener('mousedown', (e) => {
  if(!started) {
    started = true;
    document.getElementById('controls').style.display = 'none';
    // Spawn initial nodes
    for(let i = 0; i < 5; i++) {
      spawnNode(
        Math.random() * c.width,
        Math.random() * c.height
      );
    }
  }
  
  isDragging = true;
  dragStart = spawnNode(e.clientX, e.clientY);
});

c.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  document.getElementById('coords').textContent = `X: ${mouseX} | Y: ${mouseY}`;
});

c.addEventListener('mouseup', (e) => {
  if(isDragging && dragStart) {
    let dragEnd = spawnNode(e.clientX, e.clientY);
    createSerpent(dragStart, dragEnd);
    isDragging = false;
    dragStart = null;
  }
});

c.addEventListener('click', (e) => {
  if(!isDragging && started) {
    spawnNode(e.clientX, e.clientY);
  }
});

// Keyboard controls
document.addEventListener('keydown', (e) => {
  if(e.code === 'Space') {
    e.preventDefault();
    currentMode = (currentMode + 1) % modes.length;
    document.getElementById('mode').textContent = modes[currentMode];
  }
  
  if(e.key === 'r' || e.key === 'R') {
    nodes = [];
    serpents = [];
    connections = [];
  }
  
  if(e.key === 'b' || e.key === 'B') {
    breathPhase += Math.PI;
  }
});

// Resize handler
window.addEventListener('resize', () => {
  c.width = window.innerWidth;
  c.height = window.innerHeight;
});

animate();
</script>
</body>
</html>
