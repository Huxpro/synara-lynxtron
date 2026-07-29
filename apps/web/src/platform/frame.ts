// FILE: platform/frame.ts
// Purpose: L1 platform port — frame scheduling. Web impl = global rAF; the
//   Lynx impl maps to lynx.requestAnimationFrame (available there, but only
//   namespaced, not as a bare global).
// Layer: L1 platform port (web implementation)
// Exports: raf, cancelRaf

export function raf(callback: (time: number) => void): number {
  return requestAnimationFrame(callback);
}

export function cancelRaf(handle: number): void {
  cancelAnimationFrame(handle);
}
