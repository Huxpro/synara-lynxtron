// P2-V1 (plan 04 P-06 addendum): react$ alias target. Re-exports the official
// @lynx-js/react/compat build and fills the holes bundlers statically probe
// for — TanStack Router does `React["use"]` as a *dynamic* capability lookup,
// but Rspack still requires the export to exist at link time.

export * from "@lynx-js/react/compat";

// `export *` does not forward the default export; re-export it explicitly
// (zustand & co. do `import React from 'react'`).
import CompatDefault from "@lynx-js/react/compat";
export default CompatDefault;

// React 19's `use()` hook does not exist on ReactLynx; exporting `undefined`
// preserves the dynamic-lookup fallback path in dependent libraries.
export const use = undefined;

// Base UI probes the namespace export at link time before choosing its React
// ref compatibility branch. ReactLynx's compat build intentionally omits the
// informational version string, so expose the React 18 contract it implements.
export const version = "18.3.1";
