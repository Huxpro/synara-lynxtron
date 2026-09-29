#!/usr/bin/env bun

import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { COMPONENT_LAB_STORIES } from "@synara/shared/componentLab";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(scriptDirectory, "../../..");
const webDirectory = path.join(workspaceRoot, "apps/web/src/components/ui");
const lynxDirectory = path.join(workspaceRoot, "apps/lynx/src/components/ui");

function moduleNames(directory: string, suffix: RegExp): readonly string[] {
  return readdirSync(directory)
    .filter((name) => suffix.test(name) && !name.includes(".test.") && !name.includes(".browser."))
    .map((name) => name.replace(suffix, ""))
    .sort();
}

const webModules = moduleNames(webDirectory, /\.tsx$/);
const lynxModules = new Set(moduleNames(lynxDirectory, /\.lynx\.tsx$/));
const directlyCoveredWebModules = new Set(
  COMPONENT_LAB_STORIES.map((story) => story.renderers.electron.module)
    .filter((module) => module.startsWith("apps/web/src/components/ui/"))
    .map((module) => path.basename(module, ".tsx")),
);
const mappedAdapters: Readonly<
  Record<string, { readonly evidence: string; readonly rationale: string }>
> = {
  DisclosureChevron: {
    evidence: "apps/lynx/src/platform/motion.lynx.ts",
    rationale: "shared disclosure motion contract with a Native class adapter",
  },
  DisclosureRegion: {
    evidence: "apps/lynx/src/platform/motion.lynx.ts",
    rationale: "shared disclosure presence and content classes",
  },
  "alert-dialog": {
    evidence: "apps/lynx/src/components/ui/dialog.lynx.tsx",
    rationale: "confirmation dialogs reuse the shared Native Dialog contract",
  },
  autocomplete: {
    evidence: "apps/lynx/src/components/ui/command.lynx.tsx",
    rationale: "Native command collection owns filtering and highlighted-item behavior",
  },
  combobox: {
    evidence: "apps/lynx/src/components/ui/menu.lynx.tsx",
    rationale: "Native picker compositions use Menu plus Input instead of a DOM combobox",
  },
  empty: {
    evidence: "apps/lynx/src/adapters/CenteredEmptyLandingElements.lynx.tsx",
    rationale: "empty-state anatomy is shared through product compositions and element adapters",
  },
  "input-group": {
    evidence: "apps/lynx/src/components/ui/input.lynx.tsx",
    rationale: "Native Input owns the control shell and addons are composed by consumers",
  },
  label: {
    evidence: "apps/lynx/src/adapters/SettingsHeadingElement.lynx.tsx",
    rationale: "Native text semantics use element adapters instead of a DOM label primitive",
  },
  popover: {
    evidence: "apps/lynx/src/components/ui/menu.lynx.tsx",
    rationale: "anchored Native popovers use the shared measured overlay/menu foundation",
  },
  "preview-card": {
    evidence: "apps/lynx/src/components/sidebar/Sidebar.lynx.tsx",
    rationale: "preview cards are product-owned hover/tap surfaces on Native",
  },
  "search-input": {
    evidence: "apps/lynx/src/components/ui/input.lynx.tsx",
    rationale: "Native search fields reuse Input with explicit search semantics",
  },
  select: {
    evidence: "apps/lynx/src/components/ui/menu.lynx.tsx",
    rationale: "Native selects use MenuRadioGroup and MenuRadioItem",
  },
  sheet: {
    evidence: "apps/lynx/src/components/ui/dialog.lynx.tsx",
    rationale: "Native Dialog owns compact bottom-sheet behavior",
  },
  "shortcut-kbd": {
    evidence: "apps/lynx/src/components/ui/kbd.lynx.tsx",
    rationale: "Native Kbd is the shortcut-key renderer",
  },
  sidebar: {
    evidence: "apps/lynx/src/components/sidebar/Sidebar.lynx.tsx",
    rationale:
      "application sidebar is a renderer-specific product shell, not a portable DOM primitive",
  },
  toggle: {
    evidence: "apps/lynx/src/components/ui/button.lynx.tsx",
    rationale: "Native toggles compose Button with pressed state",
  },
};

const rows = webModules.map((module) => {
  const hasLynxCounterpart = lynxModules.has(module);
  const directlyCovered = directlyCoveredWebModules.has(module);
  const mappedAdapter = mappedAdapters[module];
  if (mappedAdapter && !existsSync(path.join(workspaceRoot, mappedAdapter.evidence))) {
    throw new Error(`${module}: mapped adapter evidence does not exist: ${mappedAdapter.evidence}`);
  }
  return {
    module,
    status: directlyCovered
      ? "covered"
      : hasLynxCounterpart
        ? "counterpart-not-in-lab"
        : mappedAdapter
          ? "mapped-adapter"
          : "missing-lynx-counterpart",
    ...(mappedAdapter ?? {}),
  };
});
const summary = {
  webPrimitives: rows.length,
  lynxPrimitives: lynxModules.size,
  covered: rows.filter((row) => row.status === "covered").length,
  counterpartNotInLab: rows.filter((row) => row.status === "counterpart-not-in-lab").length,
  mappedAdapter: rows.filter((row) => row.status === "mapped-adapter").length,
  missingLynxCounterpart: rows.filter((row) => row.status === "missing-lynx-counterpart").length,
};

console.log(JSON.stringify({ summary, rows }, null, 2));
