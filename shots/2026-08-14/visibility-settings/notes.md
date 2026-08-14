# Lynx visibility settings consumption

## Newly discovered scope

- Settings already exposed optional sidebar and Environment visibility
  switches, and persisted them through the shared app-settings projection.
- Lynx before consumed only `showWorkspaceSection` at the sidebar and route
  level.
- Ignored settings:
  - Sidebar: Chats and Studio.
  - Environment: Usage, Repository, Pull Request, Editor, Recap, Pinned,
    Markers, Project instructions, and Notepad.
- Result before: Settings appeared to save successfully, but the hidden
  sections remained rendered.

## Product behavior

- Sidebar now reads the same General settings projection as Web:
  - Studio is omitted from the segmented picker when disabled.
  - Workspace retains its existing optional behavior.
  - Chats trailing section is not mounted when disabled.
- Environment now applies all nine canonical section switches.
- The always-on Git block remains visible, matching Web:
  - Changes
  - branch/environment
  - Commit and Push
  - Local Servers
- Settings route navigation remounts the sidebar/thread surfaces, so returning
  from Settings reads the newly persisted projection without creating another
  settings store.

## Runtime evidence

- Isolated server: `ws://127.0.0.1:58090`.
- Isolated state: `.synara-fidelity-visibility/dev/state.sqlite`.
- Canonical project/thread created through `orchestration.dispatchCommand`:
  - project `project-visibility`
  - thread `thread-visibility`
  - workspace `/tmp/synara-visibility-fidelity`
- Viewport: `1280x820`, DPR 1, light.
- With every optional switch enabled, deterministic data-backed labels included:
  - Studio
  - Workspace
  - Editor view
  - Project instructions
  - Notepad
- With every optional switch disabled:
  - no optional sidebar/Environment labels remained;
  - a later stable probe still contained Changes, Commit and Push, and Local
    Servers.
- URL remained the initial Lynx-for-Web query URL.
- Retained frame:
  `lynx-for-web-all-hidden-light-1280x820.png`.

## Harness classification

- The first screenshot export was `1280x633` despite the requested matrix
  cell, so it was rejected and deleted.
- The retained screenshot was captured only after verifying runtime
  `1280x820`, DPR 1, and has matching PNG dimensions.
- The retained capture occurred before slower Git rows finished loading;
  optional-section absence is visible, while the stable later text probe is
  the authority for always-on base rows.
- Native exact-client certification remains blocked by the user-owned
  Lynxtron client on `localhost:8901`; no Native pass is claimed.

## Loss ledger

- `lynx-sidebar-visibility-settings-ignored`: P1 product behavior,
  contribution `1.00 -> 0.00`.
- `lynx-environment-visibility-settings-ignored`: P1 product behavior,
  contribution `1.00 -> 0.00`.
- `visibility-capture-height-mismatch`: harness loss,
  contribution `0.00` product loss.
- `native-visibility-devtool-fixed-port`: harness blocker,
  contribution `0.00` product loss.
