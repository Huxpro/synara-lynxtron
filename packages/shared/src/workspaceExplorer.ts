const HIDDEN_WORKSPACE_DIRECTORY_NAMES = new Set([
  ".cache",
  ".next",
  ".nuxt",
  ".parcel-cache",
  ".pnpm-store",
  ".svelte-kit",
  ".turbo",
  ".vite",
  ".yarn",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "out",
  "target",
]);

export function shouldShowWorkspaceExplorerEntry(entry: {
  readonly kind: string;
  readonly name: string;
}): boolean {
  if (entry.kind !== "directory") {
    return true;
  }
  if (entry.name.startsWith(".synara")) {
    return false;
  }
  return !HIDDEN_WORKSPACE_DIRECTORY_NAMES.has(entry.name);
}
