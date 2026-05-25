// EMOTIONAL TARGET: "discovering you have organs you didn't know about"

export async function detectWebGPU() {
  if (!navigator.gpu) return { supported: false, reason: 'navigator.gpu unavailable' }
  try {
    const adapter = await navigator.gpu.requestAdapter()
    if (!adapter) return { supported: false, reason: 'no adapter' }
    return { supported: true, adapter }
  } catch (e) {
    return { supported: false, reason: e.message }
  }
}

export function detectMobile() {
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent)
    || window.matchMedia('(max-width: 768px)').matches
}

export function targetFPS() {
  return detectMobile() ? 30 : 60
}
