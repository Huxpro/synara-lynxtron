#!/usr/bin/env bun

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { COMPONENT_LAB_STORIES, summarizeComponentLabCoverage } from "@synara/shared/componentLab";

type Renderer = "electron" | "lynx";

interface IdentityOverride {
  readonly labSymbol?: string;
  readonly productPattern?: string;
}

interface ManyToOneOverride {
  readonly electronIdentities: readonly string[];
  readonly evidence: string;
  readonly rationale: string;
}

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(scriptDirectory, "../../..");
const webRoot = path.join(workspaceRoot, "apps/web/src");
const lynxRoot = path.join(workspaceRoot, "apps/lynx/src");
const labFiles: Record<Renderer, string> = {
  electron: path.join(webRoot, "components/ComponentsLabStoryRenderer.tsx"),
  lynx: path.join(lynxRoot, "app/ComponentsLabStoryRenderer.lynx.tsx"),
};

// Each exception documents a production wrapper or a design-system contract.
// Anything not listed here must use its declared component name literally.
const overrides: Readonly<Record<string, Partial<Record<Renderer, IdentityOverride>>>> = {
  "project-actions/add-editor": {
    lynx: { productPattern: "ProjectActionEditor" },
  },
  "sidebar/command-palette": {
    lynx: { labSymbol: "SidebarSearchPalette", productPattern: "SidebarSearchPaletteLynx" },
  },
  "sidebar/project-row": {
    electron: { labSymbol: "SidebarProjectRowSpecimen", productPattern: "SidebarProjectSummary" },
    lynx: { labSymbol: "SidebarProjectRowSpecimen", productPattern: "SidebarNavigationRow" },
  },
  "sidebar/thread-row": {
    electron: { labSymbol: "SidebarThreadRowSpecimen", productPattern: "SidebarThreadRow" },
    lynx: { labSymbol: "SidebarThreadRowSpecimen", productPattern: "SidebarNavigationRow" },
  },
  "system/semantic-icon-tones": {
    electron: { productPattern: "--color-icon-secondary" },
    lynx: { productPattern: "iconSecondary" },
  },
  "notifications/provider-update": {
    electron: { labSymbol: "ToastSurfaceFixture", productPattern: "ToastSurface" },
  },
};

// Native may intentionally share a structural shell only when the distinct
// Electron product identities and the reason for the convergence are explicit.
const manyToOneOverrides: Readonly<Record<string, ManyToOneOverride>> = {
  "apps/lynx/src/components/sidebar/Sidebar.lynx.tsx#SidebarNavigationRow": {
    electronIdentities: [
      "apps/web/src/components/Sidebar.tsx#SidebarProjectSummary",
      "apps/web/src/components/Sidebar.tsx#SidebarThreadRow",
    ],
    evidence: "SidebarProjectRowSpecimen and SidebarThreadRowSpecimen",
    rationale:
      "Native shares the interactive row shell while each specimen keeps independent project/thread content and action anatomy.",
  },
};

const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx"]);

function sourceFiles(root: string): readonly string[] {
  const files: string[] = [];
  const visit = (directory: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (sourceExtensions.has(path.extname(entry.name))) files.push(absolute);
    }
  };
  visit(root);
  return files;
}

function contains(source: string, symbol: string): boolean {
  return source.includes(symbol);
}

function occurrenceCount(source: string, symbol: string): number {
  if (!symbol) return 0;
  let count = 0;
  let offset = 0;
  while ((offset = source.indexOf(symbol, offset)) >= 0) {
    count += 1;
    offset += symbol.length;
  }
  return count;
}

function storyRendererBranch(sourceText: string, storyId: string): string | null {
  const starts = [
    sourceText.indexOf(`props.storyId === \"${storyId}\"`),
    sourceText.indexOf(`props.storyId === '${storyId}'`),
  ].filter((index) => index >= 0);
  if (starts.length === 0) return null;
  const start = Math.min(...starts);
  const next = sourceText.indexOf("if (props.storyId ===", start + 20);
  return sourceText.slice(start, next < 0 ? sourceText.length : next);
}

const sourceByRenderer: Record<Renderer, readonly string[]> = {
  electron: sourceFiles(webRoot),
  lynx: sourceFiles(lynxRoot),
};
const sourceCache = new Map<string, string>();
function source(file: string): string {
  const cached = sourceCache.get(file);
  if (cached !== undefined) return cached;
  const value = readFileSync(file, "utf8");
  sourceCache.set(file, value);
  return value;
}
const failures: string[] = [];
const rows: Array<{
  story: string;
  renderer: Renderer;
  authority: string;
  lab: string;
  productHits: number;
}> = [];
const counterpartByElectronIdentity = new Map<string, string>();
const electronIdentitiesByLynxIdentity = new Map<string, Set<string>>();
const storiesByCounterpartPair = new Map<string, string[]>();

for (const story of COMPONENT_LAB_STORIES) {
  const electronIdentity = `${story.renderers.electron.module}#${story.renderers.electron.component}`;
  const lynxIdentity = `${story.renderers.lynx.module}#${story.renderers.lynx.component}`;
  const existingCounterpart = counterpartByElectronIdentity.get(electronIdentity);
  if (existingCounterpart && existingCounterpart !== lynxIdentity) {
    failures.push(
      `${story.id}: ${electronIdentity} maps to both ${existingCounterpart} and ${lynxIdentity}`,
    );
  } else {
    counterpartByElectronIdentity.set(electronIdentity, lynxIdentity);
  }
  const electronIdentities =
    electronIdentitiesByLynxIdentity.get(lynxIdentity) ?? new Set<string>();
  electronIdentities.add(electronIdentity);
  electronIdentitiesByLynxIdentity.set(lynxIdentity, electronIdentities);
  const counterpartPair = `${electronIdentity} -> ${lynxIdentity}`;
  const pairStories = storiesByCounterpartPair.get(counterpartPair) ?? [];
  pairStories.push(story.id);
  storiesByCounterpartPair.set(counterpartPair, pairStories);
  for (const renderer of ["electron", "lynx"] as const) {
    const entry = story.renderers[renderer];
    const override = overrides[story.id]?.[renderer];
    const authorityFile = path.join(workspaceRoot, entry.module);
    const labSource = source(labFiles[renderer]);
    const labSymbol = override?.labSymbol ?? entry.component;
    const productPattern = override?.productPattern ?? entry.component;

    if (!existsSync(authorityFile)) {
      failures.push(`${story.id}/${renderer}: missing authority module ${entry.module}`);
      continue;
    }
    const authoritySource = source(authorityFile);
    if (!contains(authoritySource, entry.component)) {
      failures.push(`${story.id}/${renderer}: ${entry.module} lacks ${entry.component}`);
    }
    if (!contains(labSource, labSymbol)) {
      failures.push(`${story.id}/${renderer}: Lab does not mount ${labSymbol}`);
    }
    if (story.variants.length > 1) {
      const branch = storyRendererBranch(labSource, story.id);
      if (branch === null) {
        failures.push(`${story.id}/${renderer}: missing story renderer branch`);
      } else if (!branch.includes("props.variant")) {
        failures.push(`${story.id}/${renderer}: renderer ignores declared variants`);
      }
    }
    if (story.states.length > 1) {
      const branch = storyRendererBranch(labSource, story.id);
      if (branch === null) {
        failures.push(`${story.id}/${renderer}: missing story renderer branch`);
      } else if (!branch.includes("props.state")) {
        failures.push(`${story.id}/${renderer}: renderer ignores declared states`);
      }
    }

    const productHits = sourceByRenderer[renderer].filter((file) => {
      if (
        file === labFiles[renderer] ||
        file === authorityFile ||
        file.includes(".test.") ||
        file.includes(".spec.")
      )
        return false;
      return contains(source(file), productPattern);
    });
    const authorityProductUse = occurrenceCount(authoritySource, productPattern) > 1;
    const productConsumerCount = productHits.length + (authorityProductUse ? 1 : 0);
    if (productConsumerCount === 0) {
      failures.push(`${story.id}/${renderer}: no product consumer contains ${productPattern}`);
    }
    rows.push({
      story: story.id,
      renderer,
      authority: entry.module,
      lab: labSymbol,
      productHits: productConsumerCount,
    });
  }
}

for (const [lynxIdentity, electronIdentities] of electronIdentitiesByLynxIdentity) {
  if (electronIdentities.size <= 1) continue;
  const override = manyToOneOverrides[lynxIdentity];
  const actual = [...electronIdentities].sort();
  const expected = override ? [...override.electronIdentities].sort() : [];
  if (!override || JSON.stringify(actual) !== JSON.stringify(expected)) {
    failures.push(
      `${lynxIdentity}: maps from multiple Electron identities without an exact many-to-one override: ${actual.join(", ")}`,
    );
  }
}

const counterpartGroups = [...storiesByCounterpartPair].map(([pair, stories]) => {
  const [electron, lynx] = pair.split(" -> ");
  return { electron, lynx, stories };
});
const manyToOneGroups = [...electronIdentitiesByLynxIdentity]
  .filter(([, identities]) => identities.size > 1)
  .map(([lynx, identities]) => ({
    lynx,
    electron: [...identities].sort(),
    stories: COMPONENT_LAB_STORIES.filter(
      (story) => `${story.renderers.lynx.module}#${story.renderers.lynx.component}` === lynx,
    ).map((story) => story.id),
    rationale: manyToOneOverrides[lynx]?.rationale ?? null,
    evidence: manyToOneOverrides[lynx]?.evidence ?? null,
  }));

console.log(
  JSON.stringify(
    {
      coverage: summarizeComponentLabCoverage(COMPONENT_LAB_STORIES),
      checks: rows.length,
      counterpartGroups,
      manyToOneGroups,
      rows,
    },
    null,
    2,
  ),
);
if (failures.length > 0) {
  console.error(
    `component identity audit failed (${failures.length}):\n${failures.map((failure) => `- ${failure}`).join("\n")}`,
  );
  process.exit(1);
}
console.log(
  `component identity audit passed: ${rows.length} renderer mappings across ${COMPONENT_LAB_STORIES.length} stories`,
);
