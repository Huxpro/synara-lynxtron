// Copyright 2026 The Lynxtron Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { defineConfig } from "@lynx-js/rspeedy";

import { pluginLynxConfig } from "@lynx-js/config-rsbuild-plugin";
import { pluginReactLynx } from "@lynx-js/react-rsbuild-plugin";
import { compilerOptionsKeys, configKeys } from "@lynx-js/type-config";
import type { CompilerOptions, Config } from "@lynx-js/type-config";
import { pluginTypeCheck } from "@rsbuild/plugin-type-check";
import { pluginRspeedyDevReady } from "@lynx-js/lynxtron-dev-plugins/rspeedy";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "url";
import path from "path";

// Lynx's template encoder (@lynx-js/tasm) and the Lynxtron runtime honor this page
// config, but @lynx-js/type-config does not declare it yet.
declare module "@lynx-js/config-rsbuild-plugin" {
  interface Config {
    alignMouseEventWithW3C?: boolean;
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const requireFromApp = createRequire(import.meta.url);
const rootPath = process.cwd();
const appVersion = String(
  (requireFromApp("./package.json") as { readonly version?: string }).version ?? "0.0.0",
);
const configuredSynaraWsUrl = process.env.SYNARA_WS_URL?.trim() ?? "";
const buildHostInputProbe = process.env.SYNARA_HOST_INPUT_PROBE === "1";

// `resolve.alias` only sees `~/…` specifiers. Upstream modules also import
// these files relatively (`./nativeApi`, `./wsTransport`, …), so the resolved
// resource path is rewritten after resolution to the same Lynx replacement the
// alias points at. Keep both tables in sync; `scripts/reuse-audit.mjs` mirrors
// them so the audit resolves like the bundle.
export const lynxResourceReplacements: ReadonlyArray<{
  readonly webSource: string;
  readonly lynxSource: string;
}> = [
  { webSource: "nativeApi.ts", lynxSource: "src/adapters/nativeApi.lynx.ts" },
  { webSource: "wsTransport.ts", lynxSource: "src/adapters/wsTransport.lynx.ts" },
  { webSource: "platform/events.ts", lynxSource: "src/platform/events.ts" },
  // Upstream's draft store persists under the same storage it would now reach
  // through the browser environment, and Lynx hydrates only its own facade. A
  // second, unhydrated store would overwrite saved drafts on its first write,
  // so no import path may reach the upstream module. Today upstream files
  // import it relatively for types only (erased); a value import the facade
  // lacks then fails the build as a missing export instead of loading it.
  { webSource: "composerDraftStore.ts", lynxSource: "src/adapters/composerDraftStore.lynx.ts" },
  {
    webSource: "confirmDialogFallback.ts",
    lynxSource: "src/adapters/confirmDialogFallback.lynx.ts",
  },
  {
    webSource: "contextMenuFallback.ts",
    lynxSource: "src/adapters/contextMenuFallback.lynx.ts",
  },
];
const webSourceRoot = path.resolve(__dirname, "../web/src");
const resourceReplacementByWebPath = new Map(
  lynxResourceReplacements.map((entry) => [
    path.join(webSourceRoot, entry.webSource),
    path.resolve(__dirname, entry.lynxSource),
  ]),
);
// Matches the resolved upstream file (`…/nativeApi.ts`) and the specifiers
// that can name it (`../nativeApi`, `./platform/events`).
const resourceReplacementPattern = new RegExp(
  `(${lynxResourceReplacements
    .map((entry) => entry.webSource.replace(/\.ts$/, "").replace(/[.*+?^${}()|[\]\\/]/g, "\\$&"))
    .join("|")})(\\.ts)?$`,
);
// Lynx injects `window` into every background bundle as a wrapper parameter
// with no value, so a member read on it throws. `wsNativeApi.ts` runs here
// verbatim and probes the Electron preload bridge (`window.desktopBridge`)
// while it builds the facade; there is no such bridge on Lynx, so the member is
// compiled to `undefined`. `typeof window` checks are untouched. Do not add
// called members here (`window.setTimeout(...)`): Rspack's DefinePlugin does not
// rewrite a member expression in callee position. The generated `EventRouter`
// gets its timers from `platform/windowTimers.ts` instead.
/**
 * Redirects upstream modules that are imported by a relative path
 * (`../nativeApi` from `lib/gitReactQuery.ts`) to their Lynx implementation,
 * after resolution, so they land on the same module the `~/…` aliases reach.
 * Shared with rstest.config.ts: tests must run one facade module, as the
 * bundle does.
 */
export function createLynxResourceReplacementPlugin(rspack: {
  NormalModuleReplacementPlugin: new (
    pattern: RegExp,
    replace: (result: unknown) => void,
  ) => unknown;
}): never {
  return new rspack.NormalModuleReplacementPlugin(resourceReplacementPattern, (result) => {
    const data = result as {
      context?: string;
      request?: string;
      createData?: { resource?: string; request?: string; userRequest?: string };
    };
    // Before resolution: a relative specifier from an upstream file that
    // points at a replaced module is rewritten to the Lynx file itself, so it
    // resolves exactly as the `~/…` alias does and both share one module
    // instance (rewriting the resolved resource instead produced a second
    // instance of `nativeApi.lynx.ts`).
    if (!data.createData) {
      const { context, request } = data;
      if (typeof context !== "string" || typeof request !== "string") return;
      if (!request.startsWith(".")) return;
      const target = path.resolve(context, request);
      const replacement =
        resourceReplacementByWebPath.get(target) ??
        resourceReplacementByWebPath.get(`${target}.ts`);
      if (replacement) data.request = replacement;
      return;
    }
    // After resolution: anything that still landed on the upstream file.
    const createData = data.createData;
    const resource = createData.resource;
    if (typeof resource !== "string") return;
    const replacement = resourceReplacementByWebPath.get(resource);
    if (!replacement) return;
    createData.resource = replacement;
    createData.request = replacement;
    createData.userRequest = replacement;
  }) as never;
}

/**
 * `@tanstack/query-core` runs in server mode without a `window` (no refetch
 * intervals, no stale timers). This rule gives its modules the Lynx client
 * environment; see `scripts/query-core-environment-loader.mjs`. Shared with
 * rstest.config.ts so tests run the query-core the bundle runs.
 */
export const lynxQueryCoreEnvironmentRule = {
  test: /[\\/]@tanstack[\\/]query-core[\\/]build[\\/]modern[\\/][^\\/]+\.js$/,
  enforce: "pre" as const,
  loader: path.resolve(__dirname, "scripts/query-core-environment-loader.mjs"),
  options: {
    environmentModule: path.resolve(__dirname, "src/platform/queryCoreEnvironment.lynx.ts"),
  },
};

export const lynxWindowMemberDefines: Readonly<Record<string, string>> = {
  "window.desktopBridge": "undefined",
};
// Upstream `apps/web/src` files use the browser globals directly (`window`,
// `document`, `navigator`, …). The loader binds the names a file uses to the
// Lynx browser environment (`src/platform/browserEnvironment.lynx.ts`), so the
// upstream file compiles unchanged on both threads. Scoped to the Web source
// tree on purpose: npm packages and Lynx-owned code keep the real runtime.
// Rstest mounts the same rule (rstest.config.ts).
export const lynxBrowserEnvironmentRule = {
  test: /\.[cm]?[jt]sx?$/,
  include: [webSourceRoot],
  enforce: "pre" as const,
  loader: path.resolve(__dirname, "scripts/browser-environment-loader.mjs"),
};
console.log("rootPath: ", path.resolve(rootPath, "./src/assets"));
export default defineConfig({
  server: {
    // 5971 to avoid colliding with other local rspeedy dev servers (5969/5970
    // were taken by a different project on this machine).
    port: 5971,
  },
  resolve: {
    extensions: [".lynx.tsx", ".lynx.ts", ".tsx", ".ts", ".jsx", ".js"],
    alias: {
      "~/components/AppShellFrameElements$": path.resolve(
        __dirname,
        "src/adapters/AppShellFrameElements.lynx.tsx",
      ),
      "~/components/CenteredEmptyLandingElements$": path.resolve(
        __dirname,
        "src/adapters/CenteredEmptyLandingElements.lynx.tsx",
      ),
      "~/components/CenteredEmptyLandingStackElements$": path.resolve(
        __dirname,
        "src/adapters/CenteredEmptyLandingStackElements.lynx.tsx",
      ),
      "~/components/SidebarListSectionHeaderElements$": path.resolve(
        __dirname,
        "src/adapters/SidebarListSectionHeaderElements.lynx.tsx",
      ),
      "~/components/SidebarProjectSummaryElements$": path.resolve(
        __dirname,
        "src/adapters/SidebarProjectSummaryElements.lynx.tsx",
      ),
      "~/components/SidebarProjectDisclosureElements$": path.resolve(
        __dirname,
        "src/adapters/SidebarProjectDisclosureElements.lynx.tsx",
      ),
      "~/components/SidebarThreadIdentityElements$": path.resolve(
        __dirname,
        "src/adapters/SidebarThreadIdentityElements.lynx.tsx",
      ),
      "~/components/SidebarThreadSubagentIdentityElements$": path.resolve(
        __dirname,
        "src/adapters/SidebarThreadSubagentIdentityElements.lynx.tsx",
      ),
      "~/components/SidebarThreadProviderIdentityElements$": path.resolve(
        __dirname,
        "src/adapters/SidebarThreadProviderIdentityElements.lynx.tsx",
      ),
      "~/components/SidebarThreadStatusIndicatorElements$": path.resolve(
        __dirname,
        "src/adapters/SidebarThreadStatusIndicatorElements.lynx.tsx",
      ),
      "~/components/SidebarThreadTrailingClusterElements$": path.resolve(
        __dirname,
        "src/adapters/SidebarThreadTrailingClusterElements.lynx.tsx",
      ),
      "~/components/SidebarChatsSectionElements$": path.resolve(
        __dirname,
        "src/adapters/SidebarChatsSectionElements.lynx.tsx",
      ),
      "~/components/SidebarStudioSectionElements$": path.resolve(
        __dirname,
        "src/adapters/SidebarStudioSectionElements.lynx.tsx",
      ),
      "~/components/SidebarPinnedSectionElements$": path.resolve(
        __dirname,
        "src/adapters/SidebarPinnedSectionElements.lynx.tsx",
      ),
      "~/components/SidebarSettingsEntryElements$": path.resolve(
        __dirname,
        "src/adapters/SidebarSettingsEntryElements.lynx.tsx",
      ),
      "~/components/SidebarSurfaceContentElements$": path.resolve(
        __dirname,
        "src/adapters/SidebarSurfaceContentElements.lynx.tsx",
      ),
      "~/components/SidebarFooterSectionElements$": path.resolve(
        __dirname,
        "src/adapters/SidebarFooterSectionElements.lynx.tsx",
      ),
      "~/components/SidebarDesktopHeaderElements$": path.resolve(
        __dirname,
        "src/adapters/SidebarDesktopHeaderElements.lynx.tsx",
      ),
      "~/components/SidebarProjectsSectionElements$": path.resolve(
        __dirname,
        "src/adapters/SidebarProjectsSectionElements.lynx.tsx",
      ),
      "~/components/SidebarSearchPaletteElements$": path.resolve(
        __dirname,
        "src/adapters/SidebarSearchPaletteElements.lynx.tsx",
      ),
      "~/components/chat/ChatSurfaceHeaderFrameElements$": path.resolve(
        __dirname,
        "src/adapters/ChatSurfaceHeaderFrameElements.lynx.tsx",
      ),
      "~/components/chat/ChatSurfaceHeaderIdentityElements$": path.resolve(
        __dirname,
        "src/adapters/ChatSurfaceHeaderIdentityElements.lynx.tsx",
      ),
      "~/components/chat/ComposerColumnFrameSurfaceElements$": path.resolve(
        __dirname,
        "src/adapters/ComposerColumnFrameSurfaceElements.lynx.tsx",
      ),
      "~/components/chat/ComposerInputCompositionElements$": path.resolve(
        __dirname,
        "src/adapters/ComposerInputCompositionElements.lynx.tsx",
      ),
      "~/components/chat/EditorRailAddMenuCompositionElements$": path.resolve(
        __dirname,
        "src/adapters/EditorRailAddMenuCompositionElements.lynx.tsx",
      ),
      "~/components/chat/ComposerLifecycleStatusElements$": path.resolve(
        __dirname,
        "src/adapters/ComposerLifecycleStatusElements.lynx.tsx",
      ),
      "~/components/chat/ComposerExtrasMenuCompositionElements$": path.resolve(
        __dirname,
        "src/adapters/ComposerExtrasMenuCompositionElements.lynx.tsx",
      ),
      "~/components/chat/ComposerRuntimeModeControlCompositionElements$": path.resolve(
        __dirname,
        "src/adapters/ComposerRuntimeModeControlCompositionElements.lynx.tsx",
      ),
      "~/components/chat/ComposerReferenceAttachmentsCompositionElements$": path.resolve(
        __dirname,
        "src/adapters/ComposerReferenceAttachmentsCompositionElements.lynx.tsx",
      ),
      "~/components/chat/ComposerModelTriggerCompositionElements$": path.resolve(
        __dirname,
        "src/adapters/ComposerModelTriggerCompositionElements.lynx.tsx",
      ),
      "~/components/chat/ProviderModelOptionGroupListCompositionElements$": path.resolve(
        __dirname,
        "src/adapters/ProviderModelOptionGroupListCompositionElements.lynx.tsx",
      ),
      "~/components/chat/ComposerTraitRadioSectionCompositionElements$": path.resolve(
        __dirname,
        "src/adapters/ComposerTraitRadioSectionCompositionElements.lynx.tsx",
      ),
      "~/components/chat/ComposerCommandMenuCompositionElements$": path.resolve(
        __dirname,
        "src/adapters/ComposerCommandMenuCompositionElements.lynx.tsx",
      ),
      "~/components/chat/ComposerProjectPickerCompositionElements$": path.resolve(
        __dirname,
        "src/adapters/ComposerProjectPickerCompositionElements.lynx.tsx",
      ),
      "~/components/chat/MessageRowCompositionElements$": path.resolve(
        __dirname,
        "src/adapters/MessageRowCompositionElements.lynx.tsx",
      ),
      "~/components/chat/TimelineStatusRowCompositionElements$": path.resolve(
        __dirname,
        "src/adapters/TimelineStatusRowCompositionElements.lynx.tsx",
      ),
      "~/components/chat/CollapsedWorkCompositionElements$": path.resolve(
        __dirname,
        "src/adapters/CollapsedWorkCompositionElements.lynx.tsx",
      ),
      "~/components/chat/ChatEmptyStateHeroElements$": path.resolve(
        __dirname,
        "src/adapters/ChatEmptyStateHeroElements.lynx.tsx",
      ),
      "~/components/chat/PanelStateMessageElements$": path.resolve(
        __dirname,
        "src/adapters/PanelStateMessageElements.lynx.tsx",
      ),
      "~/components/terminal/terminalRuntimeRegistry$": path.resolve(
        __dirname,
        "src/adapters/terminalRuntimeRegistry.lynx.ts",
      ),
      "~/components/SynaraLogo$": path.resolve(__dirname, "src/adapters/SynaraLogo.lynx.tsx"),
      "@assets": path.resolve(rootPath, "./src/assets"),
      // Phase 5 compiler-driven port: import the Web source tree by physical
      // identity. Platform suffixes still resolve Lynx-first.
      "@synara-web": path.resolve(rootPath, "../web/src"),
      "@synara/shared/model$": path.resolve(rootPath, "../../packages/shared/src/model.ts"),
      "@synara/shared/githubRepository$": path.resolve(
        rootPath,
        "../../packages/shared/src/githubRepository.ts",
      ),
      "@tanstack/react-query$": path.resolve(rootPath, "./node_modules/@tanstack/react-query"),
      // Only apps/web depends on the pacer (store.ts already runs it on Lynx,
      // resolved from there). Lynx-side generated upstream code imports it too
      // and must get that same copy.
      "@tanstack/react-pacer$": path.resolve(rootPath, "../web/node_modules/@tanstack/react-pacer"),
      "@synara-provider-icons": path.resolve(rootPath, "../web/public/central-icons-fill"),
      "@synara-central-icons": path.resolve(rootPath, "../web/public/central-icons-reversed"),
      "@synara-central-icons-fill": path.resolve(rootPath, "../web/public/central-icons-fill"),
      "~/components/settings/SettingsSectionElements$": path.resolve(
        rootPath,
        "./src/adapters/SettingsSectionElements.lynx.tsx",
      ),
      "~/components/settings/SettingsRowElements$": path.resolve(
        rootPath,
        "./src/adapters/SettingsRowElements.lynx.tsx",
      ),
      "~/components/SettingsNavigationCompositionElements$": path.resolve(
        rootPath,
        "./src/adapters/SettingsNavigationCompositionElements.lynx.tsx",
      ),
      "~/components/settings/SettingsSidebarChromeCompositionElements$": path.resolve(
        rootPath,
        "./src/adapters/SettingsSidebarChromeCompositionElements.lynx.tsx",
      ),
      "~/components/settings/SettingsPanelHeaderCompositionElements$": path.resolve(
        rootPath,
        "./src/adapters/SettingsPanelHeaderCompositionElements.lynx.tsx",
      ),
      "~/components/settings/SettingsGeneralCompositionElements$": path.resolve(
        rootPath,
        "./src/adapters/SettingsGeneralCompositionElements.lynx.tsx",
      ),
      "~/components/settings/SettingsGitWritingModelCompositionElements$": path.resolve(
        rootPath,
        "./src/adapters/SettingsGitWritingModelCompositionElements.lynx.tsx",
      ),
      "~/components/settings/SettingsProviderPickerCompositionElements$": path.resolve(
        rootPath,
        "./src/adapters/SettingsProviderPickerCompositionElements.lynx.tsx",
      ),
      "~/components/settings/SettingsAppearanceCompositionElements$": path.resolve(
        rootPath,
        "./src/adapters/SettingsAppearanceCompositionElements.lynx.tsx",
      ),
      "~/components/settings/KeyboardShortcutsSettingsCompositionElements$": path.resolve(
        rootPath,
        "./src/adapters/KeyboardShortcutsSettingsCompositionElements.lynx.tsx",
      ),
      "~/components/settings/ThemePackEditorCompositionElements$": path.resolve(
        rootPath,
        "./src/adapters/ThemePackEditorCompositionElements.lynx.tsx",
      ),
      "~/components/kanban/KanbanCardCompositionElements$": path.resolve(
        rootPath,
        "./src/adapters/KanbanCardCompositionElements.lynx.tsx",
      ),
      "~/components/kanban/KanbanOverviewCompositionElements$": path.resolve(
        rootPath,
        "./src/adapters/KanbanOverviewCompositionElements.lynx.tsx",
      ),
      "~/components/kanban/KanbanColumnCompositionElements$": path.resolve(
        rootPath,
        "./src/adapters/KanbanColumnCompositionElements.lynx.tsx",
      ),
      "~/components/kanban/KanbanRouteHeaderCompositionElements$": path.resolve(
        rootPath,
        "./src/adapters/KanbanRouteHeaderCompositionElements.lynx.tsx",
      ),
      "~/components/kanban/KanbanStateCompositionElements$": path.resolve(
        rootPath,
        "./src/adapters/KanbanStateCompositionElements.lynx.tsx",
      ),
      "~/components/pullRequest/PullRequestRowCompositionElements$": path.resolve(
        rootPath,
        "./src/adapters/PullRequestRowCompositionElements.lynx.tsx",
      ),
      "~/components/pullRequest/PullRequestListCompositionElements$": path.resolve(
        rootPath,
        "./src/adapters/PullRequestListCompositionElements.lynx.tsx",
      ),
      "~/components/pullRequest/PullRequestSummaryCompositionElements$": path.resolve(
        rootPath,
        "./src/adapters/PullRequestSummaryCompositionElements.lynx.tsx",
      ),
      "~/components/pullRequest/PullRequestDetailTabsCompositionElements$": path.resolve(
        rootPath,
        "./src/adapters/PullRequestDetailTabsCompositionElements.lynx.tsx",
      ),
      "~/components/pullRequest/PullRequestDetailCloseCompositionElements$": path.resolve(
        rootPath,
        "./src/adapters/PullRequestDetailCloseCompositionElements.lynx.tsx",
      ),
      "~/components/pullRequest/PullRequestCodeCompositionElements$": path.resolve(
        rootPath,
        "./src/adapters/PullRequestCodeCompositionElements.lynx.tsx",
      ),
      "~/components/WorkspaceFilePreviewErrorStateElements$": path.resolve(
        rootPath,
        "./src/adapters/WorkspaceFilePreviewErrorStateElements.lynx.tsx",
      ),
      "~/components/pullRequest/PullRequestTimelineCompositionElements$": path.resolve(
        rootPath,
        "./src/adapters/PullRequestTimelineCompositionElements.lynx.tsx",
      ),
      "~/components/SidebarPrimaryActionElements$": path.resolve(
        rootPath,
        "./src/adapters/SidebarPrimaryActionElements.lynx.tsx",
      ),
      "~/components/SidebarPrimaryNavigationElements$": path.resolve(
        rootPath,
        "./src/adapters/SidebarPrimaryNavigationElements.lynx.tsx",
      ),
      "~/platform/storage$": path.resolve(rootPath, "./src/platform/storage.ts"),
      "~/platform/env$": path.resolve(rootPath, "./src/platform/env.lynx.ts"),
      "~/platform/motion$": path.resolve(rootPath, "./src/platform/motion.lynx.ts"),
      "~/hooks/useTheme$": path.resolve(rootPath, "./src/adapters/useTheme.lynx.ts"),
      // Upstream's icon module inlines DOM `<svg>` JSX; shared Web modules get
      // the Lynx glyph set and the icon-name constants instead.
      "~/lib/icons$": path.resolve(rootPath, "./src/adapters/webIcons.lynx.ts"),
      "~/hooks/useViewportLayout$": path.resolve(rootPath, "./src/hooks/useViewportLayout.lynx.ts"),
      "~/nativeApi$": path.resolve(rootPath, "./src/adapters/nativeApi.lynx.ts"),
      // Shared state layer (plan/shared-state-architecture.md): the upstream
      // NativeApi facade runs on Lynx; only the transport and the DOM-bound
      // fallbacks below it are swapped. Relative imports of the same files
      // inside apps/web are redirected by `lynxResourceReplacements` below.
      "~/wsTransport$": path.resolve(rootPath, "./src/adapters/wsTransport.lynx.ts"),
      "~/platform/events$": path.resolve(rootPath, "./src/platform/events.ts"),
      "~/confirmDialogFallback$": path.resolve(
        rootPath,
        "./src/adapters/confirmDialogFallback.lynx.ts",
      ),
      "~/contextMenuFallback$": path.resolve(
        rootPath,
        "./src/adapters/contextMenuFallback.lynx.ts",
      ),
      // Session sync (generated `EventRouter`, plan Step 2) reaches these two
      // through `~/…`. The draft store is the Lynx facade (the Web store cannot
      // enter the Lynx bundle, plan decision P6-C1).
      "~/composerDraftStore$": path.resolve(rootPath, "./src/adapters/composerDraftStore.lynx.ts"),
      "~/components/ui/toast$": path.resolve(rootPath, "./src/components/ui/toast.lynx.ts"),
      "~/components/ui/button$": path.resolve(rootPath, "./src/components/ui/button.lynx.tsx"),
      "~/components/ui/input$": path.resolve(rootPath, "./src/components/ui/input.lynx.tsx"),
      "~/components/ui/command$": path.resolve(rootPath, "./src/components/ui/command.lynx.tsx"),
      "~/components/ui/kbd$": path.resolve(rootPath, "./src/components/ui/kbd.lynx.tsx"),
      "~/components/ui/shortcut-kbd$": path.resolve(
        rootPath,
        "../web/src/components/ui/shortcut-kbd.tsx",
      ),
      "~/components/ui/dialog$": path.resolve(rootPath, "./src/components/ui/dialog.lynx.tsx"),
      "~/components/ui/menu$": path.resolve(rootPath, "./src/components/ui/menu.lynx.tsx"),
      "~/components/ui/tooltip$": path.resolve(rootPath, "./src/components/ui/tooltip.lynx.tsx"),
      "~/components/ui/scroll-area$": path.resolve(
        rootPath,
        "./src/components/ui/scroll-area.lynx.tsx",
      ),
      "~/components/ui/collapsible$": path.resolve(
        rootPath,
        "./src/components/ui/collapsible.lynx.tsx",
      ),
      "~": path.resolve(rootPath, "../web/src"),
      // P2-V1 (plan 04 P-06): TanStack Router imports bare `react`; give it the
      // compat build plus shims for static link probes (React["use"] etc.).
      // (Verified: compat re-exports the same @lynx-js/react instance — no
      // runtime duplication.)
      react$: path.resolve(rootPath, "./src/react-compat-shim.ts"),
      // The router's component layer crashes on ReactLynx (P2-V1). Upstream
      // state-layer modules only use a few of its hooks; those run over the
      // Lynx memory history instead.
      "@tanstack/react-router$": path.resolve(rootPath, "./src/adapters/reactRouter.lynx.ts"),
      // Rspeedy's Lynx target selects the package's `browser` condition, whose
      // decoder creates a DOM element at module load. PrimJS has no document;
      // use the package's equivalent pure character-entities implementation.
      "decode-named-character-reference$": requireFromApp.resolve(
        "decode-named-character-reference",
      ),
    },
  },
  output: {
    filename: "[name].[platform].bundle",
  },
  tools: {
    rspack: (config, { rspack }) => {
      config.module ??= {};
      config.module.rules ??= [];
      config.module.rules.push(lynxQueryCoreEnvironmentRule);
      config.plugins ??= [];
      config.module ??= {};
      config.module.rules ??= [];
      config.module.rules.push(lynxBrowserEnvironmentRule);
      // Lynx has no `localStorage` (the wrapper injects the name with no
      // value). Upstream stores that persist through the bare global, and are
      // now reached by session sync (`workspacePathsStore.ts`), get the Lynx
      // storage port instead: the same synchronous getItem/setItem contract.
      // Web source files get the name from the browser-environment rule above;
      // this global provision remains for npm packages that default to the bare
      // `localStorage` (zustand's `persist`).
      config.plugins.push(
        new rspack.ProvidePlugin({
          localStorage: [path.resolve(__dirname, "src/platform/storage.ts"), "webStorage"],
        }),
      );
      config.plugins.push(createLynxResourceReplacementPlugin(rspack));
    },
  },
  environments: {
    web: {
      source: {
        preEntry: "./src/runtime-polyfills.ts",
        define: {
          ...lynxWindowMemberDefines,
          "process.env.SYNARA_WS_URL": JSON.stringify(configuredSynaraWsUrl),
          "process.env.SYNARA_APP_VERSION": JSON.stringify(appVersion),
          "process.env.SYNARA_LYNX_WEB_RELAY": JSON.stringify(buildHostInputProbe ? "0" : "1"),
          "process.env.SYNARA_HOST_INPUT_PROBE_RUNTIME": JSON.stringify(
            buildHostInputProbe ? "Lynx-for-Web" : "",
          ),
        },
        entry: {
          main: buildHostInputProbe
            ? "./src/app/host-input-probe-index.tsx"
            : "./src/app/index.tsx",
        },
      },
      output: {
        target: "web",
        distPath: {
          root: buildHostInputProbe ? "./output/probes/host-input/web" : "./output/bundle/web",
        },
      },
    },
    lynx: {
      source: {
        preEntry: "./src/runtime-polyfills.ts",
        // The Native bundle never embeds a backend endpoint: the Lynxtron host
        // passes the live one as `runtimeWsUrl` init data on every load (see
        // platform/runtimeEndpointSource.ts). Compiling a port in would let a
        // reused bundle talk to a different server than its host.
        define: {
          ...lynxWindowMemberDefines,
          "process.env.SYNARA_WS_URL": JSON.stringify(""),
          "process.env.SYNARA_APP_VERSION": JSON.stringify(appVersion),
          "process.env.SYNARA_LYNX_WEB_RELAY": JSON.stringify("0"),
          "process.env.SYNARA_HOST_INPUT_PROBE_RUNTIME": JSON.stringify(
            buildHostInputProbe ? "Lynxtron Native" : "",
          ),
        },
        entry: {
          main: buildHostInputProbe
            ? "./src/app/host-input-probe-index.tsx"
            : "./src/app/index.tsx",
        },
      },
      output: {
        assetPrefix: new URL("./dist/desktop/", pathToFileURL(__dirname + path.sep)).toString(),
        distPath: {
          root: "./output/bundle/lynx",
        },
      },
      tools: {
        rspack: {
          module: {
            rules: [
              {
                // Lynxtron cannot decode main-thread bytecode that holds a
                // zero BigInt constant; see the loader for details.
                test: /\.[cm]?[jt]sx?$/,
                issuerLayer: "react:main-thread",
                enforce: "post",
                loader: path.resolve(__dirname, "scripts/zero-bigint-literal-loader.mjs"),
              },
            ],
          },
        },
      },
    },
  },
  plugins: [
    pluginLynxConfig(
      {
        alignMouseEventWithW3C: true,
        enableCSSInheritance: true,
        // The root view carries upstream's theme variables in its `style`
        // (appTheme.logic). Lynx ignores custom properties set inline unless this is
        // on, which left an edited theme pack (and any default newer than the
        // generated stylesheet) unpainted. See plan/04-lynx-patterns.md P-45.
        enableCSSInlineVariables: true,
      },
      {
        configKeys: [...configKeys, "alignMouseEventWithW3C"],
        compilerOptionsKeys,
        validate: (input) =>
          input as Config &
            CompilerOptions & {
              alignMouseEventWithW3C: boolean;
            },
      },
    ),
    pluginReactLynx({
      enableCSSInheritance: true,
    }),
    pluginTypeCheck(),
    pluginRspeedyDevReady(),
  ],
});
