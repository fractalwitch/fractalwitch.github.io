import networkx as nx
import qutip as qt
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from scipy.fft import fftn, ifftn, fftfreq

# Optimized for larger grids: Increased to 8x8x8 lattice (512 sites), N=32 for PDE (patch_size=4)
# Optimizations: Reduced time steps (num_steps=50), fewer quantum times (50), fewer training samples (20)
# Vectorized operations where possible; no GPU but numpy/scipy efficient for this size
dims = 8
G = nx.grid_graph([dims, dims, dims])
num_sites = len(G.nodes())
node_to_idx = {node: idx for idx, node in enumerate(G.nodes())}

# Neighbor function padded to 6
def get_neighbor_features(G, node_to_idx):
    neighbor_lists = []
    for node in G.nodes():
        neighbors = list(G.neighbors(node))
        padded = neighbors[:6] + [None] * (6 - len(neighbors))
        idxs = [node_to_idx[n] if n is not None else -1 for n in padded]
        neighbor_lists.append(idxs)
    return np.array(neighbor_lists)

neighbors = get_neighbor_features(G, node_to_idx)

# Quantum setup
A = nx.adjacency_matrix(G).todense()
H_hop = -np.array(A)
np.random.seed(42)
V = np.diag(np.random.uniform(-1, 1, num_sites))
H = qt.Qobj(H_hop + V)

# Initial state: Center (3,3,3) idx = 3 + 3*dims + 3*dims**2
center_node = (3, 3, 3)
center_idx = center_node[0] + center_node[1]*dims + center_node[2]*dims**2
psi0 = qt.basis(num_sites, center_idx)

times = np.linspace(0, 10, 50)  # Reduced for optimization
projectors = [qt.basis(num_sites, i).proj() for i in range(num_sites)]
result = qt.mesolve(H, psi0, times, [], projectors)
per_site_pops = np.array(result.expect).T

quantum_avg_pops = np.mean(per_site_pops, axis=0)
quantum_sensations = np.var(per_site_pops, axis=0)

# 3D PDE Simulation optimized: Smaller T=0.25, dt=0.005, num_steps=50
N = dims * 4  # 32 for dims=8
L = 2 * np.pi
nu = 0.01
dt = 0.005
T = 0.25
num_steps = int(T / dt)
Lambda_fixed = 1.0

# Precompute wavenumbers
k = 2 * np.pi * fftfreq(N, d=L/N)
KX, KY, KZ = np.meshgrid(k, k, k, indexing='ij')
K2 = KX**2 + KY**2 + KZ**2
K2[K2 == 0] = 1e-10

# Optimized get_u_from_omega
def get_u_from_omega(omega_hat):
    k_cross_ox = 1j * (KY * omega_hat[2] - KZ * omega_hat[1])
    k_cross_oy = 1j * (KZ * omega_hat[0] - KX * omega_hat[2])
    k_cross_oz = 1j * (KX * omega_hat[1] - KY * omega_hat[0])
    ux_hat = -k_cross_ox / K2
    uy_hat = -k_cross_oy / K2
    uz_hat = -k_cross_oz / K2
    ux = np.real(ifftn(ux_hat))
    uy = np.real(ifftn(uy_hat))
    uz = np.real(ifftn(uz_hat))
    return np.array([ux, uy, uz])

# Optimized compute_gradient using precomputed K
def compute_gradient(v, K_dir):
    v_hat = fftn(v)
    return np.real(ifftn(1j * K_dir * v_hat))

# Optimized dot_grad
def dot_grad(vec, field):
    result = np.zeros_like(field)
    result[0] = (vec[0] * compute_gradient(field[0], KX) +
                 vec[1] * compute_gradient(field[0], KY) +
                 vec[2] * compute_gradient(field[0], KZ))
    result[1] = (vec[0] * compute_gradient(field[1], KX) +
                 vec[1] * compute_gradient(field[1], KY) +
                 vec[2] * compute_gradient(field[1], KZ))
    result[2] = (vec[0] * compute_gradient(field[2], KX) +
                 vec[1] * compute_gradient(field[2], KY) +
                 vec[2] * compute_gradient(field[2], KZ))
    return result

# Saturate stretching
def saturate_stretching(stretching, Lambda):
    norm = np.sqrt(np.sum(stretching**2, axis=0))
    mask = norm > Lambda
    scaling = np.ones_like(norm)
    scaling[mask] = Lambda / norm[mask]
    return stretching * scaling[np.newaxis, :, :, :]

# RHS optimized
def rhs(omega):
    omega_hat = np.array([fftn(omega[i]) for i in range(3)])
    u = get_u_from_omega(omega_hat)
    omega_grad_u = dot_grad(omega, u)
    u_grad_omega = dot_grad(u, omega)
    S_Lambda = saturate_stretching(omega_grad_u, Lambda_fixed)
    diff_hat = -nu * K2 * omega_hat
    diff = np.array([np.real(ifftn(diff_hat[i])) for i in range(3)])
    return S_Lambda - u_grad_omega + diff

# RK4
def rk4_step(omega):
    k1 = rhs(omega)
    k2 = rhs(omega + 0.5 * dt * k1)
    k3 = rhs(omega + 0.5 * dt * k2)
    k4 = rhs(omega + dt * k3)
    return omega + (dt / 6) * (k1 + 2*k2 + 2*k3 + k4)

# Initial omega
np.random.seed(42)
omega = np.random.randn(3, N, N, N) * 0.1

# Run PDE, store only enstrophy series per patch to save memory
pde_per_patch_series = np.zeros((num_steps + 1, dims, dims, dims))

enst_series = []
enst = 0.5 * np.sum(omega**2, axis=0)
enst_series.append(enst.copy())

for step in range(num_steps):
    omega = rk4_step(omega)
    enst = 0.5 * np.sum(omega**2, axis=0)
    enst_series.append(enst.copy())

# Compute avg per patch
patch_size = N // dims  # 4
for t in range(num_steps + 1):
    for i in range(dims):
        for j in range(dims):
            for k in range(dims):
                patch = enst_series[t][i*patch_size:(i+1)*patch_size,
                                       j*patch_size:(j+1)*patch_size,
                                       k*patch_size:(k+1)*patch_size]
                pde_per_patch_series[t, i, j, k] = np.mean(patch)

pde_per_site_series = pde_per_patch_series.reshape((num_steps + 1, num_sites))

pde_avg_pops = np.mean(pde_per_site_series, axis=0)
pde_sensations = np.var(pde_per_site_series, axis=0)

# NN: Input local +6 neigh + sensation =8
class LambdaAdapter(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc = nn.Sequential(
            nn.Linear(8, 16),
            nn.ReLU(),
            nn.Linear(16, 1),
            nn.ReLU()
        )

    def forward(self, x):
        return self.fc(x)

# Target lambda
def target_lambda(local_energy, neighbor_energies, sensation, lambda_inf=1.0, eps2=0.3):
    valid_neigh = [e for e in neighbor_energies if e > 0]
    avg_neighbor = np.mean(valid_neigh) if valid_neigh else 0
    energy = local_energy + avg_neighbor + sensation
    return max(lambda_inf + (energy - lambda_inf) * np.exp(-eps2), 0)

# Synthetic dataset reduced to 20 samples for speed
num_samples = 20
dataset_inputs = []
dataset_targets = []

for sample in range(num_samples):
    np.random.seed(sample)
    synth_pops = np.random.uniform(0, 1, num_sites)
    synth_sensations = np.random.uniform(0, 0.5, num_sites)

    for i in range(num_sites):
        local = synth_pops[i]
        neigh_idxs = neighbors[i]
        neigh_pops = [synth_pops[j] if j >= 0 else 0.0 for j in neigh_idxs]
        sensation = synth_sensations[i]
        input_vec = np.array([local] + neigh_pops + [sensation])
        dataset_inputs.append(input_vec)

        target = target_lambda(local, neigh_pops, sensation)
        dataset_targets.append(target)

inputs = torch.tensor(dataset_inputs, dtype=torch.float32)
targets = torch.tensor(dataset_targets, dtype=torch.float32).unsqueeze(1)

# Training
model = LambdaAdapter()
optimizer = optim.Adam(model.parameters(), lr=0.01)
loss_fn = nn.MSELoss()

epochs = 200
losses = []
for epoch in range(epochs):
    optimizer.zero_grad()
    preds = model(inputs)
    loss = loss_fn(preds, targets)
    loss.backward()
    optimizer.step()
    losses.append(loss.item())

print("Training complete. Final loss:", losses[-1])

# Get adapted lambdas
def get_adapted_lambdas(avg_pops, sensations):
    real_inputs = []
    for i in range(num_sites):
        local = avg_pops[i]
        neigh_idxs = neighbors[i]
        neigh_pops = [avg_pops[j] if j >= 0 else 0.0 for j in neigh_idxs]
        sensation = sensations[i]
        input_vec = np.array([local] + neigh_pops + [sensation])
        real_inputs.append(input_vec)

    real_inputs = torch.tensor(real_inputs, dtype=torch.float32)
    with torch.no_grad():
        return model(real_inputs).squeeze().numpy()

quantum_adapted_lambdas = get_adapted_lambdas(quantum_avg_pops, quantum_sensations)
pde_adapted_lambdas = get_adapted_lambdas(pde_avg_pops, pde_sensations)

# Sample outputs (first 10)
print("Sample Quantum avg_pops (first 10):", quantum_avg_pops[:10])
print("Sample Quantum sensations (first 10):", quantum_sensations[:10])
print("Sample Quantum adapted Lambdas (first 10):", quantum_adapted_lambdas[:10])

print("Sample PDE avg_pops (first 10):", pde_avg_pops[:10])
print("Sample PDE sensations (first 10):", pde_sensations[:10])
print("Sample PDE adapted Lambdas (first 10):", pde_adapted_lambdas[:10])
