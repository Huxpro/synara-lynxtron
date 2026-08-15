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

## 2026-08-16 exact-owned Native continuation

The former fixed-port boundary is no longer current. A fresh isolated Native
run opened `synara://settings/general` with a temporary diagnostic host and
exercised the real Workspace visibility switch.

- initial state: `aria-checked=false`, accessibility value `Off`;
- switch center: `(1051,679)`;
- real touch sequence: `off -> on -> off -> on`;
- each transition updated `aria-checked`, accessibility value, visual `--on`
  class, and `synara:app-settings:v1`;
- final persisted projection retained `showWorkspaceSection:true` without
  changing Chats or Studio visibility.

The Native app was then restarted with the same isolated user-data directory
but ordinary `synara://threads` startup. The sidebar rendered exactly one
Workspace segmented button, proving consumer-side restart persistence rather
than only the Settings control state.

The exact-client warning/error console stayed empty. All runtime, user data,
and server state were removed afterward.

`native-workspace-visibility-roundtrip-restart`: missing coverage
`1.00 -> 0.00`; product-loss contribution remains `0.00 -> 0.00`.

Native Studio/Chats visibility roundtrips and Environment section switches
remain unverified.

## Native Studio and Chats continuation

A second isolated exact-owned run covered the two remaining optional sidebar
consumers:

- `Show the Chats section in the sidebar`: on -> off;
- `Show the Studio section in the sidebar`: on -> off.

Both real switches updated checked/value/class state and persisted
`showChatsSection:false` / `showStudioSection:false` while Workspace remained
off.

After restarting Native with the same isolated user-data directory:

- no Studio segmented button mounted;
- no Chats section mounted;
- the single remaining Threads/Projects surface omitted the now-redundant
  segmented picker entirely;
- New thread, Search, Settings, and the ordinary landing remained functional.

The exact-client warning/error console stayed empty.

`native-sidebar-studio-chats-visibility-restart`: missing coverage
`1.00 -> 0.00`; product-loss contribution remains `0.00 -> 0.00`.

Native optional sidebar visibility is now covered. Environment section
roundtrips remain open.

## Native Environment switch harness boundary

An isolated exact-owned Native run located all nine Environment switches and
proved they initially rendered checked:

- Usage, Repository, Pull request, Editor, Recap;
- Pinned messages, Text markers, Project instructions, Notepad.

All controls were below the current `820px` Settings viewport. Three supported
DevTool positioning paths were tested without mutating product state:

1. pointer drag on `SettingsContent`;
2. `DOM.scrollIntoViewIfNeeded`;
3. `Input.emulateTouchFromMouseEvent` with `mouseWheel` / `deltaY`.

Every command reported success, but switch box coordinates remained
`y=876..1418`, and viewport hit-testing continued to resolve the earlier
Settings rows. No switch was touched and no setting changed.

This is `native-settings-scroll-devtool-noop`, a harness loss with
`0.00` product contribution. It blocks retained exact-owned Environment switch
interaction evidence; it is not a product pass or regression.
