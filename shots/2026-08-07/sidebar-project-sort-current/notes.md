# Sidebar Projects sort current-head fidelity

Status: retained Lynx-for-Web structure/focus evidence and exact-owned Native
interaction/persistence evidence

- Source base: `562889d2`.
- Lynx previously omitted the Web Projects sort action and hard-coded manual
  project order plus updated-at thread order in `deriveSidebarSections`.
- Sidebar sorting now reads the canonical `synara:app-settings:v1` projection,
  passes project/thread orders into the shared section sorter, and persists
  changes with `writeSidebarSortProjection()` without rewriting unrelated
  settings.
- Project options match Web: Recent activity, Date added, Manual. Thread options
  match Web: Recent activity, Date created. The same side-effect-free option
  catalog feeds Web and Lynx platform menu elements.
- Lynx Projects header now exposes both 20x20 Sort and Add actions. Fresh
  Lynx-for-Web evidence proves the Sort trigger is keyboard focusable and uses
  the shared hover/focus reveal. The Web host does not synthesize Native Menu
  Enter/tap events, so an empty Browser popup is not used as interaction proof.
- Canonical storage projection tests pass 6/6. Lynx sidebar projection and
  action suites pass 15/15, including persisted project/thread ordering, two
  radio groups, and the canonical settings writer.
- Web, Lynx-for-Web, and Native/Desktop production builds pass with only the
  existing chunk-size, encoder, and optional `ws` warnings.
- Exact-owned Native bundle
  `faec6515a282709cfb4ba3cfb7c855298a9189a3b3f4cb1823ec9b23f0d723e5`
  ran from `apps/lynx/dist/desktop/main.lynx.bundle`. The owned child PID was
  resolved dynamically to `localhost:8901/session 1`.
- Supported Native touch emulation opened the real popup. Native DOM retained
  two group labels and all five radio items. Touching Date added wrote
  `sidebarProjectSortOrder:"created_at"` under the canonical key and reopening
  the menu showed its check indicator.
- Touching Manual restored `sidebarProjectSortOrder:"manual"` while preserving
  `sidebarThreadSortOrder:"updated_at"` and every unrelated app-setting field.
  The exact storage transitions are retained in `native-storage-transitions.txt`.
- Native menu frame is `2560x1576`; warning/error console is empty.
- Cleanup: the exact-owned root and child exited, and the sort preference was
  restored before shutdown. Unrelated Lynxtron instances were not touched.
