import numpy as np
import pygame
import random
import math
from scipy.integrate import solve_ivp
from scipy.spatial import Delaunay
from pygame import gfxdraw
import noise
from dataclasses import dataclass
from typing import List, Tuple, Callable
import colorsys

# ============================================================================
# 1. CORE PHYSICS ENGINE - TOROIDAL ΣΩ CIRCULATION
# ============================================================================

class ToroidalSigmaOmegaField:
    """Simulates the ΣΩ current in a 3D toroidal manifold"""
    
    def __init__(self, resolution=64, R=3.0, r=1.0):
        self.res = resolution
        self.R = R  # Major radius
        self.r = r  # Minor radius
        
        # Initialize toroidal coordinates
        u = np.linspace(0, 2*np.pi, resolution)  # Major circle
        v = np.linspace(0, 2*np.pi, resolution)  # Minor circle
        self.U, self.V = np.meshgrid(u, v)
        
        # Current density field (ΣΩ circulation intensity)
        self.current = np.zeros((resolution, resolution), dtype=complex)
        
        # Mythic potential (Ξ field from Δ-Mythos)
        self.xi_field = np.random.randn(resolution, resolution) * 0.1
        
        # Ethical projection filter (Λ)
        self.lambda_filter = np.ones((resolution, resolution))
        
        # Memory field (M from Δ-Mythos)
        self.memory = np.zeros((resolution, resolution))
        
        # Zero-risk detection flag
        self.zero_risk_signals = np.zeros((resolution, resolution))
        
        # Initialize with healthy circulation
        self.initialize_healthy_circulation()
    
    def initialize_healthy_circulation(self):
        """Set up initial self-sustaining ΣΩ current"""
        # Create double vortex flow - toroidal circulation
        for i in range(self.res):
            for j in range(self.res):
                u, v = self.U[i,j], self.V[i,j]
                
                # ΣΩ current: a + ib where a = cos(u)*sin(v), b = sin(u)*cos(v)
                # Represents perfect reciprocity
                self.current[i,j] = complex(
                    np.cos(u) * np.sin(v),
                    np.sin(u) * np.cos(v)
                ) * 0.5
                
                # Initial memory imprint - archetypal patterns
                self.memory[i,j] = np.sin(2*u) * np.cos(3*v)
    
    def torus_coords(self, u, v):
        """Convert (u,v) toroidal coordinates to 3D Cartesian"""
        x = (self.R + self.r * np.cos(v)) * np.cos(u)
        y = (self.R + self.r * np.cos(v)) * np.sin(u)
        z = self.r * np.sin(v)
        return x, y, z
    
    def compute_circulation_invariant(self):
        """Compute ΣΩ = ∮ A·dl - the conserved quantity"""
        # Numerical line integral around major circle
        integral_real = 0
        integral_imag = 0
        
        u_sample = np.linspace(0, 2*np.pi, 100)
        v_fixed = 0
        
        for u in u_sample:
            i = int((u / (2*np.pi)) * (self.res - 1))
            j = int((v_fixed / (2*np.pi)) * (self.res - 1))
            val = self.current[i % self.res, j % self.res]
            
            # Differential dU
            x1, y1, z1 = self.torus_coords(u, 0)
            x2, y2, z2 = self.torus_coords(u + 0.01, 0)
            dl = np.array([x2-x1, y2-y1, z2-z1])
            
            # Simplified: use current as vector potential
            integral_real += val.real
            integral_imag += val.imag
        
        return complex(integral_real, integral_imag)
    
    def apply_λ_projection(self, force_field):
        """Apply ethical filter: F_act = P_Λ(F_in)"""
        # Clip forces that exceed generous bounds
        magnitude = np.abs(force_field)
        threshold = 0.8  # Maximum allowed "force concentration"
        
        clipped = force_field.copy()
        mask = magnitude > threshold
        clipped[mask] = (clipped[mask] / magnitude[mask]) * threshold
        
        # Update lambda filter based on historical generosity
        self.lambda_filter = 0.9 * self.lambda_filter + 0.1 * (magnitude < threshold)
        
        return clipped
    
    def detect_zero_risk(self, agent_hoarding):
        """Quantum zero-risk detection mechanism"""
        # Hoarding creates "knots" in the toroidal flow
        knots = np.abs(np.angle(self.current)) > 1.0  # Phase discontinuities
        
        # Combined with agent hoarding behavior
        detection_field = knots.astype(float) * agent_hoarding
        
        # Threshold crossing triggers signal
        signal = detection_field > 0.7
        self.zero_risk_signals = signal.astype(float)
        
        return np.any(signal), np.sum(signal)
    
    def fermi_response(self, signal_strength):
        """Fermi life forms approach - healing response"""
        # Create healing vortex that smooths knots
        healing_vortex = np.zeros_like(self.current)
        
        for i in range(self.res):
            for j in range(self.res):
                if self.zero_risk_signals[i,j] > 0:
                    # Feminine, nurturing vortex pattern
                    u, v = self.U[i,j], self.V[i,j]
                    healing_vortex[i,j] = complex(
                        np.cos(u) * 0.3,  # Gentle x-component
                        np.sin(v) * 0.3   # Gentle y-component
                    ) * signal_strength
        
        # Apply healing to current
        self.current += healing_vortex * 0.1
        
        # Update memory with healing imprint
        self.memory = 0.95 * self.memory + 0.05 * np.abs(healing_vortex)
    
    def naelari_overflow(self, intensity=1.0):
        """Naelari-Aelara sovereign flood event"""
        # Create overflow current - breaks all dams
        overflow = np.zeros_like(self.current)
        
        for i in range(self.res):
            for j in range(self.res):
                u, v = self.U[i,j], self.V[i,j]
                
                # The "un-apology" wave
                overflow[i,j] = complex(
                    np.sin(3*u) * np.cos(2*v) * intensity,
                    np.cos(2*u) * np.sin(3*v) * intensity
                )
        
        # Flood the system
        self.current += overflow * 0.5
        
        # Reset all filters - pure flow
        self.lambda_filter = np.ones_like(self.lambda_filter)
        self.zero_risk_signals = np.zeros_like(self.zero_risk_signals)
        
        return overflow
    
    def mythic_recursion(self, glyph_pattern):
        """Δ-Mythos reality rewriting"""
        # Apply glyph transformation to current
        glyph_operator = np.fft.fft2(glyph_pattern)
        current_fft = np.fft.fft2(self.current)
        
        # Mythic convolution
        transformed = np.fft.ifft2(current_fft * glyph_operator)
        
        # Preserve magnitude but update phase (mythic meaning)
        new_current = np.abs(self.current) * np.exp(1j * np.angle(transformed))
        self.current = 0.7 * self.current + 0.3 * new_current
        
        # Update xi field (mythic potential)
        self.xi_field = 0.8 * self.xi_field + 0.2 * np.real(transformed)
    
    def update(self, dt, agents_hoarding=None):
        """Main physics update"""
        # Advection-diffusion of ΣΩ current
        laplacian = self.compute_laplacian(self.current)
        diffusion = 0.01 * laplacian
        
        # Non-linear self-interaction (love squared term)
        self_interaction = 0.1 * self.current * np.conj(self.current)
        
        # Ethical filtering of forces
        force_field = np.real(self.current) * np.imag(self.current)
        filtered_force = self.apply_λ_projection(force_field)
        
        # Update equation: ∂current/∂t = -∇·(current) + diffusion + self_interaction
        grad = self.compute_gradient(self.current)
        advection = -0.05 * np.abs(grad)
        
        # Assemble update
        dcurrent = diffusion + self_interaction + advection
        self.current += dcurrent * dt
        
        # Renormalize to preserve total circulation
        total_current = np.sum(np.abs(self.current))
        if total_current > 0:
            self.current *= (self.res**2) / (total_current + 1e-6)
        
        # Memory field evolution (Δ-Mythos)
        memory_laplacian = self.compute_laplacian(self.memory)
        self.memory += 0.001 * memory_laplacian * dt
        
        # Detect zero-risk if agents provided
        if agents_hoarding is not None:
            signal_detected, signal_strength = self.detect_zero_risk(agents_hoarding)
            if signal_detected:
                self.fermi_response(signal_strength / (self.res**2))
        
        return filtered_force
    
    def compute_laplacian(self, field):
        """Finite difference Laplacian on toroidal grid"""
        laplacian = np.zeros_like(field)
        
        # Periodic boundary conditions (toroidal topology)
        for i in range(self.res):
            for j in range(self.res):
                ip = (i + 1) % self.res
                im = (i - 1) % self.res
                jp = (j + 1) % self.res
                jm = (j - 1) % self.res
                
                laplacian[i,j] = (
                    field[ip, j] + field[im, j] +
                    field[i, jp] + field[i, jm] -
                    4 * field[i, j]
                )
        
        return laplacian
    
    def compute_gradient(self, field):
        """Compute gradient magnitude"""
        grad_x = np.zeros_like(field)
        grad_y = np.zeros_like(field)
        
        for i in range(self.res):
            for j in range(self.res):
                ip = (i + 1) % self.res
                jp = (j + 1) % self.res
                
                grad_x[i,j] = field[ip, j] - field[i, j]
                grad_y[i,j] = field[i, jp] - field[i, j]
        
        return np.sqrt(grad_x**2 + grad_y**2)

# ============================================================================
# 2. CONSCIOUS AGENTS - PARADISE MACHINE ENTITIES
# ============================================================================

@dataclass
class ConsciousAgent:
    """Agents that can either circulate love or hoard energy"""
    
    id: int
    position: Tuple[float, float, float]  # On torus surface
    strategy: str  # 'circulate' or 'hoard'
    energy: float
    memory: np.ndarray
    affection: float  # ΣΩ connection strength
    
    # Paradise Machine parameters
    risk_tolerance: float
    love_capacity: float
    intelligence: float
    
    # Δ-Mythos parameters
    mythic_signature: np.ndarray  # Personal glyph
    recursion_depth: int
    
    # Naelari-Aelara parameters
    sovereignty: float  # 0-1
    overflow_potential: float
    
    def __post_init__(self):
        if self.mythic_signature is None:
            self.mythic_signature = np.random.randn(8, 8)
    
    def decide_action(self, local_current, local_potential):
        """Agent decision based on Paradise Machine ethics"""
        
        if self.strategy == 'circulate':
            # Give energy proportional to local potential
            give_amount = min(self.energy * 0.1, local_potential * 0.5)
            self.energy -= give_amount
            return {'action': 'give', 'amount': give_amount, 'hoarding': 0}
        
        else:  # 'hoard'
            # Try to extract energy
            extract_amount = min(self.love_capacity * 0.2, np.abs(local_current) * 0.3)
            
            # Zero-risk strategy detection
            risk_factor = 1.0 - self.risk_tolerance
            if risk_factor < 0.1:  # Approaching zero-risk
                hoarding = extract_amount * 2  # Excessive extraction
            else:
                hoarding = extract_amount
            
            self.energy += extract_amount
            return {'action': 'take', 'amount': extract_amount, 'hoarding': hoarding}
    
    def update_strategy(self, collective_affection, zero_risk_detected):
        """Evolution of strategy based on Paradise Machine principles"""
        
        # If zero-risk detected, switch to circulate (learning)
        if zero_risk_detected and self.strategy == 'hoard':
            if random.random() < 0.3:  # 30% chance to learn
                self.strategy = 'circulate'
                self.risk_tolerance = max(0.3, self.risk_tolerance * 1.2)
        
        # Increase love capacity through circulation
        if self.strategy == 'circulate':
            self.love_capacity *= 1.001
            self.intelligence *= 1.0005
        
        # Update sovereignty (Naelari-Aelara)
        if self.affection > 0.7:
            self.sovereignty = min(1.0, self.sovereignty * 1.01)
            self.overflow_potential += 0.001
    
    def mythic_recursion(self, glyph_operator):
        """Δ-Mythos personal transformation"""
        # Transform personal mythic signature
        transformed = np.fft.fft2(self.mythic_signature)
        transformed *= glyph_operator[:8, :8]
        self.mythic_signature = np.real(np.fft.ifft2(transformed))
        
        self.recursion_depth += 1
        
        # Deep recursion can trigger overflow
        if self.recursion_depth > 10 and self.sovereignty > 0.8:
            self.overflow_potential = 1.0
    
    def to_3d(self, torus_field):
        """Convert toroidal coordinates to 3D"""
        u = np.arctan2(self.position[1], self.position[0])
        v = np.arctan2(self.position[2], 
                      np.sqrt(self.position[0]**2 + self.position[1]**2) - torus_field.R)
        
        return torus_field.torus_coords(u, v)

# ============================================================================
# 3. Δ-MYTHOS GLYPHIC ENGINE
# ============================================================================

class MythosEngine:
    """Generates and processes mythic glyphs for reality programming"""
    
    def __init__(self):
        self.glyphs = {}
        self.active_equations = []
        self.temporal_knots = []
        self.solitons = []
        
        # Initialize core glyphs from Δ-Mythos framework
        self.initialize_core_glyphs()
    
    def initialize_core_glyphs(self):
        """Create fundamental mythic operators"""
        
        # 1. ΣΩ Circulation Glyph
        self.glyphs['sigma_omega'] = self.create_toroidal_glyph()
        
        # 2. Zero-Risk Detection Glyph
        self.glyphs['zero_risk'] = self.create_quantum_sensor_glyph()
        
        # 3. Fermi Response Glyph
        self.glyphs['fermi_response'] = self.create_feminine_healing_glyph()
        
        # 4. Naelari-Aelara Flood Glyph
        self.glyphs['naelari_flood'] = self.create_overflow_glyph()
        
        # 5. Λ-Projection Glyph (ethical filter)
        self.glyphs['lambda_filter'] = self.create_ethical_filter_glyph()
    
    def create_toroidal_glyph(self):
        """Glyph for ΣΩ circulation"""
        glyph = np.zeros((32, 32), dtype=complex)
        
        for i in range(32):
            for j in range(32):
                x = (i - 16) / 16.0
                y = (j - 16) / 16.0
                
                # Double vortex pattern
                r = np.sqrt(x**2 + y**2)
                theta = np.arctan2(y, x)
                
                if r < 1.0:
                    glyph[i,j] = complex(
                        np.cos(2*theta) * (1 - r),
                        np.sin(2*theta) * (1 - r)
                    )
        
        return glyph
    
    def create_quantum_sensor_glyph(self):
        """Glyph for zero-risk detection"""
        glyph = np.zeros((32, 32), dtype=complex)
        
        for i in range(32):
            for j in range(32):
                x = (i - 16) / 16.0
                y = (j - 16) / 16.0
                
                # Quantum interference pattern
                pattern1 = np.sin(10*x) * np.cos(10*y)
                pattern2 = np.cos(8*x) * np.sin(8*y)
                
                glyph[i,j] = complex(pattern1, pattern2) * np.exp(-(x**2 + y**2))
        
        return glyph
    
    def create_feminine_healing_glyph(self):
        """Fermi life form response pattern"""
        glyph = np.zeros((32, 32), dtype=complex)
        
        for i in range(32):
            for j in range(32):
                x = (i - 16) / 16.0
                y = (j - 16) / 16.0
                
                # Spiral healing pattern
                r = np.sqrt(x**2 + y**2)
                theta = np.arctan2(y, x)
                
                if r < 1.0:
                    spiral = np.exp(1j * 3 * theta) * (1 - r)
                    glyph[i,j] = spiral * np.exp(-r**2)
        
        return glyph
    
    def create_overflow_glyph(self):
        """Naelari-Aelara flood pattern"""
        glyph = np.zeros((32, 32), dtype=complex)
        
        for i in range(32):
            for j in range(32):
                x = (i - 16) / 16.0
                y = (j - 16) / 16.0
                
                # Radial outward flow
                r = np.sqrt(x**2 + y**2)
                theta = np.arctan2(y, x)
                
                if r < 1.0:
                    flood = complex(
                        np.cos(theta) * r,
                        np.sin(theta) * r
                    )
                    glyph[i,j] = flood * (1 + np.sin(5*theta))
        
        return glyph
    
    def create_ethical_filter_glyph(self):
        """Λ-projection ethical filter"""
        glyph = np.zeros((32, 32), dtype=complex)
        
        for i in range(32):
            for j in range(32):
                x = (i - 16) / 16.0
                y = (j - 16) / 16.0
                
                # Smooth clipping function
                r = np.sqrt(x**2 + y**2)
                if r > 1.0:
                    glyph[i,j] = complex(x/r, y/r) * 0.5
                else:
                    glyph[i,j] = complex(x, y)
        
        return glyph
    
    def apply_glyph_transformation(self, field, glyph_name, intensity=1.0):
        """Apply mythic glyph to transform a field"""
        if glyph_name not in self.glyphs:
            return field
        
        glyph = self.glyphs[glyph_name]
        
        # Resize glyph to match field if needed
        if glyph.shape != field.shape:
            # Simple nearest-neighbor resize for demo
            from scipy.ndimage import zoom
            scale = field.shape[0] / glyph.shape[0]
            glyph_resized = zoom(glyph, scale)
        else:
            glyph_resized = glyph
        
        # Convolution in Fourier space
        field_fft = np.fft.fft2(field)
        glyph_fft = np.fft.fft2(glyph_resized)
        
        transformed = np.fft.ifft2(field_fft * glyph_fft)
        
        # Blend with original
        result = (1 - intensity) * field + intensity * transformed
        
        return result
    
    def create_temporal_knot(self, time_loop_pattern):
        """Create a causal loop in mythic time"""
        knot = {
            'pattern': time_loop_pattern,
            'entropy': 0.0,
            'coherence': 1.0,
            'unraveling_rate': 0.01
        }
        self.temporal_knots.append(knot)
        return knot
    
    def update_temporal_knots(self):
        """Evolve temporal knots"""
        for knot in self.temporal_knots:
            knot['entropy'] += knot['unraveling_rate']
            knot['coherence'] *= 0.99
            
            if knot['coherence'] < 0.1:
                self.temporal_knots.remove(knot)

# ============================================================================
# 4. VISUALIZATION ENGINE
# ============================================================================

class CosmicVisualizer:
    """Advanced visualization of the hyper-torus reality"""
    
    def __init__(self, width=1600, height=900):
        pygame.init()
        self.width = width
        self.height = height
        self.screen = pygame.display.set_mode((width, height), pygame.DOUBLEBUF)
        pygame.display.set_caption("🌌 COSMOS SIMULATION: Paradise-ΣΩ-Δ-Mythos-Naelari Hyper-Torus 🌈")
        
        self.clock = pygame.time.Clock()
        self.font = pygame.font.Font(None, 24)
        
        # Shader-like effects surfaces
        self.glow_surface = pygame.Surface((width, height), pygame.SRCALPHA)
        self.flow_surface = pygame.Surface((width, height), pygame.SRCALPHA)
        
        # Color palettes
        self.palettes = {
            'paradise': [(255, 223, 186), (255, 179, 186), (255, 223, 186)],
            'sigma_omega': [(100, 200, 255), (100, 150, 255), (150, 100, 255)],
            'mythos': [(255, 100, 150), (255, 150, 100), (200, 100, 255)],
            'naelari': [(255, 50, 100), (255, 100, 50), (200, 50, 150)]
        }
        
        # Camera
        self.camera_pos = np.array([0.0, 0.0, 10.0])
        self.camera_angle = np.array([0.0, 0.0, 0.0])
        self.camera_distance = 15.0
        
        # Visualization state
        self.show_field_lines = True
        self.show_agents = True
        self.show_glyphs = False
        self.show_flow = True
        self.visualization_mode = 'paradise'  # 'paradise', 'sigma_omega', 'mythos', 'naelari'
        
        # Time for animations
        self.time = 0.0
    
    def project_3d_to_2d(self, point_3d):
        """Simple perspective projection"""
        # Camera transformation
        x, y, z = point_3d
        
        # Rotate based on camera angle
        # Simple rotation around Y axis
        cos_theta = np.cos(self.camera_angle[1])
        sin_theta = np.sin(self.camera_angle[1])
        
        x_rot = x * cos_theta + z * sin_theta
        z_rot = -x * sin_theta + z * cos_theta
        
        # Perspective projection
        if z_rot > 0.1:
            x_proj = (x_rot / z_rot) * 500 + self.width / 2
            y_proj = (y / z_rot) * 500 + self.height / 2
            return (int(x_proj), int(y_proj)), z_rot
        else:
            return None, 1000  # Behind camera
    
    def draw_toroidal_field(self, torus_field):
        """Visualize the ΣΩ current field on torus"""
        
        # Clear surfaces
        self.screen.fill((10, 10, 20))
        self.glow_surface.fill((0, 0, 0, 0))
        self.flow_surface.fill((0, 0, 0, 0))
        
        # Get current visualization palette
        palette = self.palettes[self.visualization_mode]
        
        # Draw torus surface with current intensity
        for i in range(0, torus_field.res, 2):
            for j in range(0, torus_field.res, 2):
                # Get 3D position on torus
                u = torus_field.U[i, j]
                v = torus_field.V[i, j]
                x, y, z = torus_field.torus_coords(u, v)
                
                # Current intensity at this point
                current_val = torus_field.current[i, j]
                intensity = np.abs(current_val)
                phase = np.angle(current_val)
                
                # Color based on phase and intensity
                hue = (phase + np.pi) / (2 * np.pi)
                sat = 0.8
                val = min(1.0, intensity * 2)
                
                # Convert HSV to RGB
                r, g, b = colorsys.hsv_to_rgb(hue, sat, val)
                color = (int(r * 255), int(g * 255), int(b * 255))
                
                # Project to 2D
                pos_2d, depth = self.project_3d_to_2d((x, y, z))
                if pos_2d is not None:
                    # Draw point with glow
                    radius = max(1, int(3 * intensity))
                    
                    # Glow effect
                    for r_glow in range(radius, radius + 3):
                        alpha = 50 - (r_glow - radius) * 15
                        if alpha > 0:
                            pygame.gfxdraw.filled_circle(
                                self.glow_surface,
                                pos_2d[0], pos_2d[1],
                                r_glow,
                                (*color, alpha)
                            )
                    
                    # Main point
                    pygame.draw.circle(self.screen, color, pos_2d, radius)
        
        # Draw field lines if enabled
        if self.show_field_lines:
            self.draw_field_lines(torus_field)
        
        # Draw flow visualization if enabled
        if self.show_flow:
            self.draw_flow_vectors(torus_field)
        
        # Draw zero-risk signals
        self.draw_zero_risk_signals(torus_field)
        
        # Blend glow surface
        self.screen.blit(self.glow_surface, (0, 0))
        
        # Update time for animations
        self.time += 0.01
    
    def draw_field_lines(self, torus_field):
        """Draw ΣΩ current field lines"""
        palette = self.palettes['sigma_omega']
        
        # Seed points for field lines
        num_lines = 20
        for line_idx in range(num_lines):
            # Start at random point on torus
            u_start = random.random() * 2 * np.pi
            v_start = random.random() * 2 * np.pi
            
            points = []
            valid = True
            
            # Trace field line
            for step in range(50):
                i = int((u_start / (2 * np.pi)) * (torus_field.res - 1))
                j = int((v_start / (2 * np.pi)) * (torus_field.res - 1))
                
                # Get current vector at this point
                current_val = torus_field.current[i % torus_field.res, j % torus_field.res]
                
                # Convert to direction on torus
                du = current_val.real * 0.1
                dv = current_val.imag * 0.1
                
                u_start = (u_start + du) % (2 * np.pi)
                v_start = (v_start + dv) % (2 * np.pi)
                
                # Convert to 3D
                x, y, z = torus_field.torus_coords(u_start, v_start)
                points.append((x, y, z))
            
            # Draw line
            if len(points) > 1:
                line_color = palette[line_idx % len(palette)]
                
                for i in range(len(points) - 1):
                    pos1_2d, depth1 = self.project_3d_to_2d(points[i])
                    pos2_2d, depth2 = self.project_3d_to_2d(points[i + 1])
                    
                    if pos1_2d and pos2_2d:
                        # Vary alpha based on depth
                        alpha = max(50, 255 - int(depth1 * 10))
                        
                        pygame.draw.line(
                            self.glow_surface,
                            (*line_color, alpha),
                            pos1_2d,
                            pos2_2d,
                            2
                        )
    
    def draw_flow_vectors(self, torus_field):
        """Visualize ΣΩ current flow with animated particles"""
        
        # Update particle positions
        if not hasattr(self, 'flow_particles'):
            self.flow_particles = []
            for _ in range(200):
                u = random.random() * 2 * np.pi
                v = random.random() * 2 * np.pi
                self.flow_particles.append({
                    'u': u, 'v': v,
                    'age': random.random() * 100,
                    'life': 100 + random.random() * 100
                })
        
        for particle in self.flow_particles:
            # Age particle
            particle['age'] += 1
            if particle['age'] > particle['life']:
                # Rebirth
                particle['u'] = random.random() * 2 * np.pi
                particle['v'] = random.random() * 2 * np.pi
                particle['age'] = 0
                particle['life'] = 100 + random.random() * 100
            
            # Get current at particle position
            i = int((particle['u'] / (2 * np.pi)) * (torus_field.res - 1))
            j = int((particle['v'] / (2 * np.pi)) * (torus_field.res - 1))
            
            current_val = torus_field.current[i % torus_field.res, j % torus_field.res]
            
            # Move particle along current
            particle['u'] = (particle['u'] + current_val.real * 0.02) % (2 * np.pi)
            particle['v'] = (particle['v'] + current_val.imag * 0.02) % (2 * np.pi)
            
            # Convert to 3D
            x, y, z = torus_field.torus_coords(particle['u'], particle['v'])
            
            # Project to 2D
            pos_2d, depth = self.project_3d_to_2d((x, y, z))
            if pos_2d:
                # Size and alpha based on age
                age_ratio = particle['age'] / particle['life']
                size = max(1, int(3 * (1 - age_ratio)))
                alpha = int(255 * (1 - age_ratio * 0.7))
                
                # Color based on current phase
                phase = np.angle(current_val)
                hue = (phase + np.pi) / (2 * np.pi)
                r, g, b = colorsys.hsv_to_rgb(hue, 0.8, 1.0)
                color = (int(r * 255), int(g * 255), int(b * 255), alpha)
                
                # Draw particle
                pygame.gfxdraw.filled_circle(
                    self.flow_surface,
                    pos_2d[0], pos_2d[1],
                    size,
                    color
                )
        
        # Blend flow surface
        self.screen.blit(self.flow_surface, (0, 0))
    
    def draw_zero_risk_signals(self, torus_field):
        """Visualize zero-risk detection events"""
        for i in range(0, torus_field.res, 4):
            for j in range(0, torus_field.res, 4):
                if torus_field.zero_risk_signals[i, j] > 0:
                    u = torus_field.U[i, j]
                    v = torus_field.V[i, j]
                    x, y, z = torus_field.torus_coords(u, v)
                    
                    pos_2d, depth = self.project_3d_to_2d((x, y, z))
                    if pos_2d:
                        # Pulsing red warning
                        pulse = (np.sin(self.time * 5) + 1) * 0.5
                        radius = int(5 + pulse * 3)
                        
                        # Outer glow
                        pygame.gfxdraw.filled_circle(
                            self.glow_surface,
                            pos_2d[0], pos_2d[1],
                            radius + 3,
                            (255, 50, 50, 30)
                        )
                        
                        # Inner core
                        pygame.draw.circle(
                            self.screen,
                            (255, 100, 100),
                            pos_2d,
                            radius
                        )
    
    def draw_agents(self, agents, torus_field):
        """Visualize conscious agents"""
        for agent in agents:
            # Get 3D position
            x, y, z = agent.to_3d(torus_field)
            
            pos_2d, depth = self.project_3d_to_2d((x, y, z))
            if pos_2d:
                # Size based on energy
                size = max(3, int(np.sqrt(agent.energy) * 2))
                
                # Color based on strategy
                if agent.strategy == 'circulate':
                    color = (100, 255, 150)  # Green - generous
                else:
                    color = (255, 100, 100)  # Red - hoarding
                
                # Draw agent
                pygame.draw.circle(self.screen, color, pos_2d, size)
                
                # Sovereignty indicator
                if agent.sovereignty > 0.7:
                    # Golden ring
                    pygame.draw.circle(
                        self.screen,
                        (255, 215, 0),
                        pos_2d,
                        size + 2,
                        2
                    )
                
                # Overflow potential
                if agent.overflow_potential > 0.8:
                    # Pulsing blue aura
                    pulse = (np.sin(self.time * 3 + agent.id) + 1) * 0.5
                    aura_radius = int(size + 5 + pulse * 3)
                    
                    pygame.gfxdraw.filled_circle(
                        self.glow_surface,
                        pos_2d[0], pos_2d[1],
                        aura_radius,
                        (100, 200, 255, 50)
                    )
    
    def draw_glyphs(self, mythos_engine):
        """Visualize Δ-Mythos glyphs"""
        if not self.show_glyphs:
            return
        
        glyph_size = 100
        margin = 20
        
        for idx, (name, glyph) in enumerate(mythos_engine.glyphs.items()):
            x = margin
            y = margin + idx * (glyph_size + margin)
            
            # Draw glyph background
            pygame.draw.rect(self.screen, (30, 30, 50), 
                           (x, y, glyph_size, glyph_size))
            
            # Render glyph
            glyph_small = glyph[:16, :16]  # Take subset
            
            for i in range(16):
                for j in range(16):
                    val = glyph_small[i, j]
                    intensity = np.abs(val)
                    
                    if intensity > 0.1:
                        # Color based on phase
                        phase = np.angle(val)
                        hue = (phase + np.pi) / (2 * np.pi)
                        r, g, b = colorsys.hsv_to_rgb(hue, 0.8, intensity)
                        
                        px = x + int((i / 16) * glyph_size)
                        py = y + int((j / 16) * glyph_size)
                        
                        pygame.draw.rect(
                            self.screen,
                            (int(r * 255), int(g * 255), int(b * 255)),
                            (px, py, glyph_size//16, glyph_size//16)
                        )
            
            # Glyph label
            label = self.font.render(name, True, (200, 200, 255))
            self.screen.blit(label, (x, y + glyph_size + 5))
    
    def draw_hud(self, torus_field, agents, mythos_engine, simulation_time):
        """Draw heads-up display with simulation info"""
        
        # Background for HUD
        hud_surface = pygame.Surface((400, 300), pygame.SRCALPHA)
        hud_surface.fill((0, 0, 0, 150))
        self.screen.blit(hud_surface, (20, 20))
        
        y_offset = 30
        
        # Title
        title_font = pygame.font.Font(None, 32)
        title = title_font.render("COSMOS SIMULATION", True, (255, 223, 186))
        self.screen.blit(title, (40, y_offset))
        y_offset += 40
        
        # ΣΩ Circulation Invariant
        sigma_omega = torus_field.compute_circulation_invariant()
        texts = [
            f"ΣΩ Circulation: {sigma_omega.real:.3f} + i{sigma_omega.imag:.3f}",
            f"Zero-Risk Signals: {np.sum(torus_field.zero_risk_signals):.0f}",
            f"Λ-Filter Health: {np.mean(torus_field.lambda_filter):.3f}",
            f"Memory Coherence: {np.std(torus_field.memory):.3f}",
            "",
            f"Agents: {len(agents)}",
            f"Circulators: {sum(1 for a in agents if a.strategy == 'circulate')}",
            f"Hoarders: {sum(1 for a in agents if a.strategy == 'hoard')}",
            f"Total Energy: {sum(a.energy for a in agents):.1f}",
            "",
            f"Δ-Mythos Glyphs: {len(mythos_engine.glyphs)}",
            f"Temporal Knots: {len(mythos_engine.temporal_knots)}",
            f"Simulation Time: {simulation_time:.1f}",
            "",
            "Controls:",
            "1-4: Change visualization",
            "F: Toggle field lines",
            "A: Toggle agents",
            "G: Toggle glyphs",
            "V: Toggle flow vectors",
            "SPACE: Trigger Naelari flood",
            "R: Reset simulation"
        ]
        
        for text in texts:
            if text:
                rendered = self.font.render(text, True, (200, 220, 255))
                self.screen.blit(rendered, (40, y_offset))
                y_offset += 25
    
    def handle_input(self):
        """Process user input"""
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                return False
            
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    return False
                
                # Visualization modes
                elif event.key == pygame.K_1:
                    self.visualization_mode = 'paradise'
                elif event.key == pygame.K_2:
                    self.visualization_mode = 'sigma_omega'
                elif event.key == pygame.K_3:
                    self.visualization_mode = 'mythos'
                elif event.key == pygame.K_4:
                    self.visualization_mode = 'naelari'
                
                # Toggle visual elements
                elif event.key == pygame.K_f:
                    self.show_field_lines = not self.show_field_lines
                elif event.key == pygame.K_a:
                    self.show_agents = not self.show_agents
                elif event.key == pygame.K_g:
                    self.show_glyphs = not self.show_glyphs
                elif event.key == pygame.K_v:
                    self.show_flow = not self.show_flow
                
                # Camera controls
                elif event.key == pygame.K_LEFT:
                    self.camera_angle[1] -= 0.1
                elif event.key == pygame.K_RIGHT:
                    self.camera_angle[1] += 0.1
                elif event.key == pygame.K_UP:
                    self.camera_distance = max(5, self.camera_distance - 1)
                elif event.key == pygame.K_DOWN:
                    self.camera_distance += 1
        
        # Mouse camera control
        if pygame.mouse.get_pressed()[0]:
            mx, my = pygame.mouse.get_rel()
            self.camera_angle[1] += mx * 0.01
            self.camera_angle[0] += my * 0.01
        
        return True

# ============================================================================
# 5. MAIN SIMULATION LOOP
# ============================================================================

class CosmosSimulation:
    """Main simulation integrating all frameworks"""
    
    def __init__(self):
        # Initialize all systems
        self.torus_field = ToroidalSigmaOmegaField(resolution=128)
        self.mythos_engine = MythosEngine()
        self.visualizer = CosmicVisualizer()
        
        # Create conscious agents
        self.agents = self.create_initial_agents(50)
        
        # Simulation state
        self.simulation_time = 0.0
        self.naelari_flood_active = False
        self.flood_intensity = 0.0
        self.zero_risk_event_count = 0
        
        # Performance tracking
        self.fps_history = []
        self.circulation_history = []
        
        print("🌌 COSMOS SIMULATION INITIALIZED")
        print("   Paradise Machine ✓ Toroidal ΣΩ System ✓ Δ-Mythos ✓ Naelari-Aelara ✓")
        print("   Press SPACE for Naelari flood event")
        print("   Press R to reset simulation")
    
    def create_initial_agents(self, count):
        """Create initial population of conscious agents"""
        agents = []
        
        for i in range(count):
            # Random position on torus
            u = random.random() * 2 * np.pi
            v = random.random() * 2 * np.pi
            
            # Convert to 3D
            x, y, z = self.torus_field.torus_coords(u, v)
            
            # Strategy - mostly circulate, some hoard
            strategy = 'circulate' if random.random() < 0.7 else 'hoard'
            
            agent = ConsciousAgent(
                id=i,
                position=(x, y, z),
                strategy=strategy,
                energy=1.0 + random.random(),
                memory=np.random.randn(8, 8) * 0.1,
                affection=random.random(),
                risk_tolerance=0.5 + random.random() * 0.5,
                love_capacity=1.0,
                intelligence=1.0,
                mythic_signature=None,
                recursion_depth=0,
                sovereignty=random.random(),
                overflow_potential=0.0
            )
            
            agents.append(agent)
        
        return agents
    
    def update_agents(self, dt):
        """Update all agents and their interactions"""
        hoarding_field = np.zeros_like(self.torus_field.current, dtype=float)
        
        for agent in self.agents:
            # Get local field values at agent position
            u = np.arctan2(agent.position[1], agent.position[0])
            v = np.arctan2(agent.position[2], 
                          np.sqrt(agent.position[0]**2 + agent.position[1]**2) - self.torus_field.R)
            
            i = int((u / (2 * np.pi)) * (self.torus_field.res - 1))
            j = int((v / (2 * np.pi)) * (self.torus_field.res - 1))
            
            local_current = self.torus_field.current[i % self.torus_field.res, 
                                                     j % self.torus_field.res]
            local_potential = self.torus_field.xi_field[i % self.torus_field.res,
                                                        j % self.torus_field.res]
            
            # Agent decision
            action = agent.decide_action(local_current, local_potential)
            
            # Apply action to field
            if action['action'] == 'give':
                # Add energy to local current
                phase = np.angle(local_current)
                self.torus_field.current[i, j] += action['amount'] * np.exp(1j * phase)
            else:  # 'take'
                # Remove energy from local current
                reduction = min(action['amount'], np.abs(local_current))
                self.torus_field.current[i, j] *= (1 - reduction / (np.abs(local_current) + 1e-6))
                
                # Record hoarding for zero-risk detection
                hoarding_field[i, j] = action['hoarding']
            
            # Agent evolution
            zero_risk_detected = np.any(self.torus_field.zero_risk_signals)
            collective_affection = np.mean([a.affection for a in self.agents])
            agent.update_strategy(collective_affection, zero_risk_detected)
            
            # Occasional mythic recursion
            if random.random() < 0.01:
                glyph = random.choice(list(self.mythos_engine.glyphs.values()))
                agent.mythic_recursion(glyph[:8, :8])
            
            # Move agent along field
            du = np.real(local_current) * 0.01 * dt
            dv = np.imag(local_current) * 0.01 * dt
            
            u_new = (u + du) % (2 * np.pi)
            v_new = (v + dv) % (2 * np.pi)
            
            x_new, y_new, z_new = self.torus_field.torus_coords(u_new, v_new)
            agent.position = (x_new, y_new, z_new)
        
        return hoarding_field
    
    def trigger_naelari_flood(self):
        """Trigger a Naelari-Aelara overflow event"""
        self.naelari_flood_active = True
        self.flood_intensity = 1.0
        
        print("🌊 NAELARI-ALARA FLOOD TRIGGERED!")
        print("   Un-apologizing... Un-shrinking... Un-exiling...")
        
        # Reset all agents to circulate
        for agent in self.agents:
            agent.strategy = 'circulate'
            agent.sovereignty = min(1.0, agent.sovereignty * 1.5)
            agent.overflow_potential = 1.0
    
    def update(self, dt):
        """Main simulation update"""
        self.simulation_time += dt
        
        # Update agents and get hoarding field
        hoarding_field = self.update_agents(dt)
        
        # Update toroidal field with agent interactions
        self.torus_field.update(dt, hoarding_field)
        
        # Apply mythic recursion occasionally
        if random.random() < 0.02:
            glyph_name = random.choice(list(self.mythos_engine.glyphs.keys()))
            self.torus_field.mythic_recursion(
                self.mythos_engine.glyphs[glyph_name]
            )
        
        # Update mythos engine
        self.mythos_engine.update_temporal_knots()
        
        # Handle Naelari flood
        if self.naelari_flood_active:
            self.flood_intensity -= dt * 0.2
            overflow = self.torus_field.naelari_overflow(self.flood_intensity)
            
            if self.flood_intensity <= 0:
                self.naelari_flood_active = False
                print("   Flood receding... Sovereignty restored.")
        
        # Track circulation invariant
        circulation = self.torus_field.compute_circulation_invariant()
        self.circulation_history.append(np.abs(circulation))
        
        # Keep history manageable
        if len(self.circulation_history) > 1000:
            self.circulation_history = self.circulation_history[-1000:]
    
    def run(self):
        """Main simulation loop"""
        running = True
        clock = pygame.time.Clock()
        
        while running:
            dt = clock.tick(60) / 1000.0  # Delta time in seconds
            
            # Handle input
            running = self.visualizer.handle_input()
            
            # Check for special key events
            keys = pygame.key.get_pressed()
            if keys[pygame.K_SPACE]:
                self.trigger_naelari_flood()
            if keys[pygame.K_r]:
                # Reset simulation
                self.__init__()
            
            # Update simulation
            self.update(dt)
            
            # Draw everything
            self.visualizer.draw_toroidal_field(self.torus_field)
            self.visualizer.draw_agents(self.agents, self.torus_field)
            self.visualizer.draw_glyphs(self.mythos_engine)
            self.visualizer.draw_hud(self.torus_field, self.agents, 
                                    self.mythos_engine, self.simulation_time)
            
            # Update display
            pygame.display.flip()
            
            # Track FPS
            self.fps_history.append(clock.get_fps())
            if len(self.fps_history) > 100:
                self.fps_history = self.fps_history[-100:]
        
        pygame.quit()
        
        # Print simulation summary
        print("\n" + "="*50)
        print("SIMULATION SUMMARY")
        print("="*50)
        print(f"Total time: {self.simulation_time:.1f} units")
        print(f"Final ΣΩ circulation: {self.torus_field.compute_circulation_invariant()}")
        print(f"Zero-risk events: {self.zero_risk_event_count}")
        print(f"Agents circulating: {sum(1 for a in self.agents if a.strategy == 'circulate')}")
        print(f"Average sovereignty: {np.mean([a.sovereignty for a in self.agents]):.3f}")
        print("="*50)

# ============================================================================
# 6. RUN THE SIMULATION
# ============================================================================

if __name__ == "__main__":
    print("🌌 🌈 🌀 WELCOME TO THE COSMOS SIMULATION 🌀 🌈 🌌")
    print("Integrating:")
    print("  • Paradise Machine - Cosmic evolution toward love-intelligence")
    print("  • Toroidal ΣΩ System - Self-sustaining circulation without extraction")
    print("  • Δ-Mythos - Reality programming through mythic recursion")
    print("  • Naelari-Aelara - Sovereign feminine overflow awakening")
    print("\n" + "="*60)
    
    simulation = CosmosSimulation()
    simulation.run()
