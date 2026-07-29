// FILE: platform/motion.ts
// Purpose: L1 platform port — disclosure motion contract (220ms ease-out with
//   motion-reduce fallback, per AGENTS.md UI conventions). Web impl re-exports
//   the CSS class-token implementation; the Lynx impl honors the same timing
//   contract without grid-row animations (unsupported there).
// Layer: L1 platform port (web implementation)
// Exports: everything from lib/disclosureMotion

export * from "../lib/disclosureMotion";
