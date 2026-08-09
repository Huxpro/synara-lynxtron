// Copyright 2026 The Lynxtron Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { defineConfig } from '@lynx-js/rspeedy';

import { pluginLynxConfig } from '@lynx-js/config-rsbuild-plugin';
import { pluginReactLynx } from '@lynx-js/react-rsbuild-plugin';
import { compilerOptionsKeys, configKeys } from '@lynx-js/type-config';
import type { CompilerOptions, Config } from '@lynx-js/type-config';
import { pluginTypeCheck } from '@rsbuild/plugin-type-check';
import { pluginRspeedyDevReady } from '@lynx-js/lynxtron-dev-plugins/rspeedy';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const requireFromApp = createRequire(import.meta.url);
const rootPath = process.cwd();
const appVersion = String(
  (requireFromApp('./package.json') as { readonly version?: string }).version ??
    '0.0.0'
);
const configuredSynaraWsUrl = process.env.SYNARA_WS_URL?.trim() ?? '';
const buildHostInputProbe = process.env.SYNARA_HOST_INPUT_PROBE === '1';
console.log('rootPath: ', path.resolve(rootPath, './src/assets'));
export default defineConfig({
  server: {
    // 5971 to avoid colliding with other local rspeedy dev servers (5969/5970
    // were taken by a different project on this machine).
    port: 5971,
  },
  resolve: {
    extensions: ['.lynx.tsx', '.lynx.ts', '.tsx', '.ts', '.jsx', '.js'],
    alias: {
      '~/components/AppShellFrameElements$':
        path.resolve(__dirname, 'src/adapters/AppShellFrameElements.lynx.tsx'),
      '~/components/CenteredEmptyLandingElements$':
        path.resolve(__dirname, 'src/adapters/CenteredEmptyLandingElements.lynx.tsx'),
      '~/components/CenteredEmptyLandingStackElements$':
        path.resolve(
          __dirname,
          'src/adapters/CenteredEmptyLandingStackElements.lynx.tsx'
        ),
      '~/components/SidebarSegmentedPickerElements$':
        path.resolve(__dirname, 'src/adapters/SidebarSegmentedPickerElements.lynx.tsx'),
      '~/components/SidebarListSectionHeaderElements$':
        path.resolve(__dirname, 'src/adapters/SidebarListSectionHeaderElements.lynx.tsx'),
      '~/components/SidebarProjectSummaryElements$':
        path.resolve(__dirname, 'src/adapters/SidebarProjectSummaryElements.lynx.tsx'),
      '~/components/SidebarProjectDisclosureElements$':
        path.resolve(
          __dirname,
          'src/adapters/SidebarProjectDisclosureElements.lynx.tsx'
        ),
      '~/components/SidebarThreadIdentityElements$':
        path.resolve(__dirname, 'src/adapters/SidebarThreadIdentityElements.lynx.tsx'),
      '~/components/SidebarThreadSubagentIdentityElements$':
        path.resolve(
          __dirname,
          'src/adapters/SidebarThreadSubagentIdentityElements.lynx.tsx'
        ),
      '~/components/SidebarThreadProviderIdentityElements$':
        path.resolve(
          __dirname,
          'src/adapters/SidebarThreadProviderIdentityElements.lynx.tsx'
        ),
      '~/components/SidebarThreadStatusIndicatorElements$':
        path.resolve(
          __dirname,
          'src/adapters/SidebarThreadStatusIndicatorElements.lynx.tsx'
        ),
      '~/components/SidebarThreadTrailingClusterElements$':
        path.resolve(
          __dirname,
          'src/adapters/SidebarThreadTrailingClusterElements.lynx.tsx'
        ),
      '~/components/SidebarChatsSectionElements$':
        path.resolve(__dirname, 'src/adapters/SidebarChatsSectionElements.lynx.tsx'),
      '~/components/SidebarStudioSectionElements$':
        path.resolve(__dirname, 'src/adapters/SidebarStudioSectionElements.lynx.tsx'),
      '~/components/SidebarPinnedSectionElements$':
        path.resolve(__dirname, 'src/adapters/SidebarPinnedSectionElements.lynx.tsx'),
      '~/components/SidebarSettingsEntryElements$':
        path.resolve(__dirname, 'src/adapters/SidebarSettingsEntryElements.lynx.tsx'),
      '~/components/SidebarSurfaceContentElements$':
        path.resolve(
          __dirname,
          'src/adapters/SidebarSurfaceContentElements.lynx.tsx'
        ),
      '~/components/SidebarFooterSectionElements$':
        path.resolve(
          __dirname,
          'src/adapters/SidebarFooterSectionElements.lynx.tsx'
        ),
      '~/components/SidebarDesktopHeaderElements$':
        path.resolve(__dirname, 'src/adapters/SidebarDesktopHeaderElements.lynx.tsx'),
      '~/components/SidebarProjectsSectionElements$':
        path.resolve(__dirname, 'src/adapters/SidebarProjectsSectionElements.lynx.tsx'),
      '~/components/SidebarSearchPaletteElements$':
        path.resolve(__dirname, 'src/adapters/SidebarSearchPaletteElements.lynx.tsx'),
      '~/components/chat/ChatSurfaceHeaderFrameElements$':
        path.resolve(
          __dirname,
          'src/adapters/ChatSurfaceHeaderFrameElements.lynx.tsx'
        ),
      '~/components/chat/ChatSurfaceHeaderIdentityElements$':
        path.resolve(
          __dirname,
          'src/adapters/ChatSurfaceHeaderIdentityElements.lynx.tsx'
        ),
      '~/components/chat/ComposerColumnFrameSurfaceElements$':
        path.resolve(
          __dirname,
          'src/adapters/ComposerColumnFrameSurfaceElements.lynx.tsx'
        ),
      '~/components/chat/ComposerInputCompositionElements$':
        path.resolve(
          __dirname,
          'src/adapters/ComposerInputCompositionElements.lynx.tsx'
        ),
      '~/components/chat/ComposerLifecycleStatusElements$':
        path.resolve(
          __dirname,
          'src/adapters/ComposerLifecycleStatusElements.lynx.tsx'
        ),
      '~/components/chat/ComposerExtrasMenuCompositionElements$':
        path.resolve(
          __dirname,
          'src/adapters/ComposerExtrasMenuCompositionElements.lynx.tsx'
        ),
      '~/components/chat/ComposerRuntimeModeControlCompositionElements$':
        path.resolve(
          __dirname,
          'src/adapters/ComposerRuntimeModeControlCompositionElements.lynx.tsx'
        ),
      '~/components/chat/ComposerReferenceAttachmentsCompositionElements$':
        path.resolve(
          __dirname,
          'src/adapters/ComposerReferenceAttachmentsCompositionElements.lynx.tsx'
        ),
      '~/components/chat/ComposerModelTriggerCompositionElements$':
        path.resolve(
          __dirname,
          'src/adapters/ComposerModelTriggerCompositionElements.lynx.tsx'
        ),
      '~/components/chat/ProviderModelOptionGroupListCompositionElements$':
        path.resolve(
          __dirname,
          'src/adapters/ProviderModelOptionGroupListCompositionElements.lynx.tsx'
        ),
      '~/components/chat/ComposerTraitRadioSectionCompositionElements$':
        path.resolve(
          __dirname,
          'src/adapters/ComposerTraitRadioSectionCompositionElements.lynx.tsx'
        ),
      '~/components/chat/ComposerCommandMenuCompositionElements$':
        path.resolve(
          __dirname,
          'src/adapters/ComposerCommandMenuCompositionElements.lynx.tsx'
        ),
      '~/components/chat/ComposerProjectPickerCompositionElements$':
        path.resolve(
          __dirname,
          'src/adapters/ComposerProjectPickerCompositionElements.lynx.tsx'
        ),
      '~/components/chat/MessageRowCompositionElements$':
        path.resolve(
          __dirname,
          'src/adapters/MessageRowCompositionElements.lynx.tsx'
        ),
      '~/components/chat/TimelineStatusRowCompositionElements$':
        path.resolve(
          __dirname,
          'src/adapters/TimelineStatusRowCompositionElements.lynx.tsx'
        ),
      '~/components/chat/CollapsedWorkCompositionElements$':
        path.resolve(
          __dirname,
          'src/adapters/CollapsedWorkCompositionElements.lynx.tsx'
        ),
      '~/components/chat/ChatEmptyStateHeroElements$':
        path.resolve(
          __dirname,
          'src/adapters/ChatEmptyStateHeroElements.lynx.tsx'
        ),
      '~/components/chat/PanelStateMessageElements$':
        path.resolve(
          __dirname,
          'src/adapters/PanelStateMessageElements.lynx.tsx'
        ),
      '~/components/terminal/terminalRuntimeRegistry$':
        path.resolve(__dirname, 'src/adapters/terminalRuntimeRegistry.lynx.ts'),
      '~/components/SynaraLogo$':
        path.resolve(__dirname, 'src/adapters/SynaraLogo.lynx.tsx'),
      '@assets': path.resolve(rootPath, './src/assets'),
      // Phase 5 compiler-driven port: import the Web source tree by physical
      // identity. Platform suffixes still resolve Lynx-first.
      '@synara-web': path.resolve(rootPath, '../web/src'),
      '@synara/shared/model$': path.resolve(
        rootPath,
        '../../packages/shared/src/model.ts'
      ),
      '@synara/shared/githubRepository$': path.resolve(
        rootPath,
        '../../packages/shared/src/githubRepository.ts'
      ),
      '@tanstack/react-query$': path.resolve(
        rootPath,
        './node_modules/@tanstack/react-query'
      ),
      '@synara-provider-icons': path.resolve(
        rootPath,
        '../web/public/central-icons-fill'
      ),
      '@synara-central-icons': path.resolve(
        rootPath,
        '../web/public/central-icons-reversed'
      ),
      '@synara-central-icons-fill': path.resolve(
        rootPath,
        '../web/public/central-icons-fill'
      ),
      '~/components/settings/SettingsSectionElements$': path.resolve(
        rootPath,
        './src/adapters/SettingsSectionElements.lynx.tsx'
      ),
      '~/components/settings/SettingsRowElements$': path.resolve(
        rootPath,
        './src/adapters/SettingsRowElements.lynx.tsx'
      ),
      '~/components/SettingsNavigationCompositionElements$': path.resolve(
        rootPath,
        './src/adapters/SettingsNavigationCompositionElements.lynx.tsx'
      ),
      '~/components/settings/SettingsSidebarChromeCompositionElements$': path.resolve(
        rootPath,
        './src/adapters/SettingsSidebarChromeCompositionElements.lynx.tsx'
      ),
      '~/components/settings/SettingsPanelHeaderCompositionElements$': path.resolve(
        rootPath,
        './src/adapters/SettingsPanelHeaderCompositionElements.lynx.tsx'
      ),
      '~/components/settings/SettingsGeneralCompositionElements$': path.resolve(
        rootPath,
        './src/adapters/SettingsGeneralCompositionElements.lynx.tsx'
      ),
      '~/components/settings/SettingsGitWritingModelCompositionElements$': path.resolve(
        rootPath,
        './src/adapters/SettingsGitWritingModelCompositionElements.lynx.tsx'
      ),
      '~/components/settings/SettingsProviderPickerCompositionElements$': path.resolve(
        rootPath,
        './src/adapters/SettingsProviderPickerCompositionElements.lynx.tsx'
      ),
      '~/components/settings/SettingsAppearanceCompositionElements$': path.resolve(
        rootPath,
        './src/adapters/SettingsAppearanceCompositionElements.lynx.tsx'
      ),
      '~/components/settings/KeyboardShortcutsSettingsCompositionElements$':
        path.resolve(
          rootPath,
          './src/adapters/KeyboardShortcutsSettingsCompositionElements.lynx.tsx'
        ),
      '~/components/settings/ThemePackEditorCompositionElements$': path.resolve(
        rootPath,
        './src/adapters/ThemePackEditorCompositionElements.lynx.tsx'
      ),
      '~/components/kanban/KanbanCardCompositionElements$': path.resolve(
        rootPath,
        './src/adapters/KanbanCardCompositionElements.lynx.tsx'
      ),
      '~/components/kanban/KanbanOverviewCompositionElements$': path.resolve(
        rootPath,
        './src/adapters/KanbanOverviewCompositionElements.lynx.tsx'
      ),
      '~/components/kanban/KanbanColumnCompositionElements$': path.resolve(
        rootPath,
        './src/adapters/KanbanColumnCompositionElements.lynx.tsx'
      ),
      '~/components/kanban/KanbanRouteHeaderCompositionElements$': path.resolve(
        rootPath,
        './src/adapters/KanbanRouteHeaderCompositionElements.lynx.tsx'
      ),
      '~/components/kanban/KanbanStateCompositionElements$': path.resolve(
        rootPath,
        './src/adapters/KanbanStateCompositionElements.lynx.tsx'
      ),
      '~/components/pullRequest/PullRequestRowCompositionElements$': path.resolve(
        rootPath,
        './src/adapters/PullRequestRowCompositionElements.lynx.tsx'
      ),
      '~/components/pullRequest/PullRequestListCompositionElements$': path.resolve(
        rootPath,
        './src/adapters/PullRequestListCompositionElements.lynx.tsx'
      ),
      '~/components/pullRequest/PullRequestRouteControlsCompositionElements$':
        path.resolve(
          rootPath,
          './src/adapters/PullRequestRouteControlsCompositionElements.lynx.tsx'
        ),
      '~/components/pullRequest/PullRequestSummaryCompositionElements$':
        path.resolve(
          rootPath,
          './src/adapters/PullRequestSummaryCompositionElements.lynx.tsx'
        ),
      '~/components/pullRequest/PullRequestDetailTabsCompositionElements$':
        path.resolve(
          rootPath,
          './src/adapters/PullRequestDetailTabsCompositionElements.lynx.tsx'
        ),
      '~/components/pullRequest/PullRequestDetailCloseCompositionElements$':
        path.resolve(
          rootPath,
          './src/adapters/PullRequestDetailCloseCompositionElements.lynx.tsx'
        ),
      '~/components/pullRequest/PullRequestCodeCompositionElements$':
        path.resolve(
          rootPath,
          './src/adapters/PullRequestCodeCompositionElements.lynx.tsx'
        ),
      '~/components/pullRequest/PullRequestTimelineCompositionElements$':
        path.resolve(
          rootPath,
          './src/adapters/PullRequestTimelineCompositionElements.lynx.tsx'
        ),
      '~/components/SidebarPrimaryActionElements$': path.resolve(
        rootPath,
        './src/adapters/SidebarPrimaryActionElements.lynx.tsx'
      ),
      '~/components/SidebarPrimaryNavigationElements$': path.resolve(
        rootPath,
        './src/adapters/SidebarPrimaryNavigationElements.lynx.tsx'
      ),
      '~/platform/storage$': path.resolve(
        rootPath,
        './src/platform/storage.ts'
      ),
      '~/platform/env$': path.resolve(
        rootPath,
        './src/platform/env.lynx.ts'
      ),
      '~/platform/motion$': path.resolve(
        rootPath,
        './src/platform/motion.lynx.ts'
      ),
      '~/hooks/useTheme$': path.resolve(
        rootPath,
        './src/adapters/useTheme.lynx.ts'
      ),
      '~/hooks/useViewportLayout$': path.resolve(
        rootPath,
        './src/hooks/useViewportLayout.lynx.ts'
      ),
      '~/nativeApi$': path.resolve(
        rootPath,
        './src/adapters/nativeApi.lynx.ts'
      ),
      '~/components/ui/button$': path.resolve(
        rootPath,
        './src/components/ui/button.lynx.tsx'
      ),
      '~/components/ui/input$': path.resolve(
        rootPath,
        './src/components/ui/input.lynx.tsx'
      ),
      '~/components/ui/command$': path.resolve(
        rootPath,
        './src/components/ui/command.lynx.tsx'
      ),
      '~/components/ui/kbd$': path.resolve(
        rootPath,
        './src/components/ui/kbd.lynx.tsx'
      ),
      '~/components/ui/shortcut-kbd$': path.resolve(
        rootPath,
        '../web/src/components/ui/shortcut-kbd.tsx'
      ),
      '~/components/ui/dialog$': path.resolve(
        rootPath,
        './src/components/ui/dialog.lynx.tsx'
      ),
      '~/components/ui/menu$': path.resolve(
        rootPath,
        './src/components/ui/menu.lynx.tsx'
      ),
      '~/components/ui/tooltip$': path.resolve(
        rootPath,
        './src/components/ui/tooltip.lynx.tsx'
      ),
      '~/components/ui/scroll-area$': path.resolve(
        rootPath,
        './src/components/ui/scroll-area.lynx.tsx'
      ),
      '~/components/ui/collapsible$': path.resolve(
        rootPath,
        './src/components/ui/collapsible.lynx.tsx'
      ),
      '~': path.resolve(rootPath, '../web/src'),
      // P2-V1 (plan 04 P-06): TanStack Router imports bare `react`; give it the
      // compat build plus shims for static link probes (React["use"] etc.).
      // (Verified: compat re-exports the same @lynx-js/react instance — no
      // runtime duplication.)
      react$: path.resolve(rootPath, './src/react-compat-shim.ts'),
      // Rspeedy's Lynx target selects the package's `browser` condition, whose
      // decoder creates a DOM element at module load. PrimJS has no document;
      // use the package's equivalent pure character-entities implementation.
      'decode-named-character-reference$': requireFromApp.resolve(
        'decode-named-character-reference'
      ),
    },
  },
  output: {
    filename: '[name].[platform].bundle',
  },
  environments: {
    web: {
      source: {
        define: {
          'process.env.SYNARA_WS_URL': JSON.stringify(configuredSynaraWsUrl),
          'process.env.SYNARA_APP_VERSION': JSON.stringify(appVersion),
          'process.env.SYNARA_LYNX_WEB_RELAY': JSON.stringify(
            buildHostInputProbe ? '0' : '1'
          ),
          'process.env.SYNARA_HOST_INPUT_PROBE_RUNTIME': JSON.stringify(
            buildHostInputProbe ? 'Lynx-for-Web' : ''
          ),
        },
        entry: {
          main: buildHostInputProbe
            ? './src/app/host-input-probe-index.tsx'
            : './src/app/index.tsx',
        },
      },
      output: {
        target: 'web',
        distPath: {
          root: buildHostInputProbe
            ? './output/probes/host-input/web'
            : './output/bundle/web',
        },
      },
    },
    lynx: {
      source: {
        // Rspeedy background bundles do not inherit the desktop host process
        // environment at runtime. Make an explicitly supplied certification /
        // packaged endpoint part of the bundle; an empty value preserves the
        // product default in runtimeEndpoint.logic.
        define: {
          'process.env.SYNARA_WS_URL': JSON.stringify(configuredSynaraWsUrl),
          'process.env.SYNARA_APP_VERSION': JSON.stringify(appVersion),
          'process.env.SYNARA_LYNX_WEB_RELAY': JSON.stringify('0'),
          'process.env.SYNARA_HOST_INPUT_PROBE_RUNTIME': JSON.stringify(
            buildHostInputProbe ? 'Lynxtron Native' : ''
          ),
        },
        entry: {
          main: buildHostInputProbe
            ? './src/app/host-input-probe-index.tsx'
            : './src/app/index.tsx',
        },
      },
      output: {
        assetPrefix: new URL(
          './dist/desktop/',
          pathToFileURL(__dirname + path.sep)
        ).toString(),
        distPath: {
          root: './output/bundle/lynx',
        },
      },
    },
  },
  plugins: [
    pluginLynxConfig(
      {
        alignMouseEventWithW3C: true,
        enableCSSInheritance: true,
      },
      {
        configKeys: [...configKeys, 'alignMouseEventWithW3C'],
        compilerOptionsKeys,
        validate: (input) =>
          input as Config &
            CompilerOptions & {
              alignMouseEventWithW3C: boolean;
            },
      }
    ),
    pluginReactLynx({
      enableCSSInheritance: true,
    }),
    pluginTypeCheck(),
    pluginRspeedyDevReady(),
  ],
});
