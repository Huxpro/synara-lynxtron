# P7-I1 hover / active / focus / keyboard inventory

Status: in progress
Baseline: 2026-07-30 after P6-C6 completion

## Platform evidence

The ReactLynx PC type/runtime surface exposes:

- `bindmouseenter` / `bindmouseleave`;
- `bindmousedown` / `bindmouseup` and touch start/end/cancel;
- `focusable`, `focus-index`, `bindfocus` / `bindblur`;
- `bindkeydown` / `bindkeyup`, with `event.key`;
- `bindtap` for platform activation.

Therefore P7-I1 must not classify desktop pointer/focus/keyboard as globally
unavailable. Existing native product Elements overwhelmingly bind only `tap`;
the missing interaction states are an adapter/controller gap. The retained
composer textarea result is narrower: Lynxtron 0.0.7 swallowed Arrow /
Enter / Escape in that text kernel during P6-C3 and remains a registered
platform-specific exception.

## Core-screen inventory

| Surface                    | Web contract                                                                                                           | Current Lynx contract                                                                                                              | P7-I1 treatment                                                                                                                                                                                                            |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shell / Sidebar            | Hover surface, focus ring, Enter/Space activation, selected/active persistence, global new/search/navigation shortcuts | Tap navigation and persistent active selection; one search-result `:active`; no systematic hover/focus/key mapping                 | Add one native interaction-state adapter to shared sidebar Elements; verify mouse enter/leave, pressed state, focus traversal and Enter/Space. Audit Menu accelerator shortcuts separately from Web-only global listeners. |
| Thread / Transcript        | Hover-revealed message actions, disclosure hover/focus, selection-safe pointer capture, keyboard-edit controls         | `<list>` pointer scroll, tap disclosure/jump; no hover-revealed actions; native Markdown/list are kernels                          | First map disclosure/jump hover/focus/key. Do not expose Web-only copy/pin/diff actions until their native actions are real. Preserve list drag/stick behavior.                                                            |
| Composer                   | Focused editor ring, menu highlighted row, Arrow/Enter/Escape, send shortcut and button states                         | Real textarea focus ring and tap menus/send/stop; Arrow/Enter/Escape text-kernel probe failed; tap blur/focus recovery also failed | Keep the registered textarea key exception explicit. Add pointer/focus/pressed states to toolbar/menu/button hosts; use only keyboard events proven outside the text kernel.                                               |
| Settings                   | Hover/focus navigation, Back, search keyboard semantics, controls with disabled/active state                           | Tap navigation/Back/controls, active/disabled persistence; search unavailable; dangerous text input removed                        | Add hover/focus/key activation to Back, available nav rows and non-text controls. Disabled rows must never become focusable/activatable. Search remains unavailable, not a keyboard target.                                |
| Projects overview / Kanban | Hover/focus project/card/back/actions; Enter/Space activation; DnD pointer kernel                                      | Tap drill-down/back/cards; active/static states; native is read-only and DnD unavailable                                           | Map pointer/focus/key activation for real drill-down/back/card targets. Do not add drag affordance or focusable unavailable actions.                                                                                       |
| Pull Requests              | Hover/focus rows, pin, filters, tabs, close/check links; Enter/Space; selected/pressed/disabled semantics              | Tap row/pin/filter/tab/close; selected/active/disabled persistence; no systematic hover/focus/key state                            | First executable cut. Add reusable PC pointer/focus/pressed/key adapter to row, pin, filter, tab and close Elements; exact DOM/runtime proof on real PR data.                                                              |

## Keyboard taxonomy

- **Must map:** Enter and Space activation for focusable view-backed buttons;
  Escape for overlays once P7-I2 owns dismiss behavior; Tab/Shift+Tab focus
  traversal where Lynx PC provides focusable nodes.
- **Must preserve:** `aria-disabled`, `aria-expanded`, `aria-pressed` and active
  selection; disabled controls are absent from the focus/activation path.
- **Must not fake:** Web global shortcuts whose native equivalent does not
  exist. Existing application-menu accelerators are the native authority;
  text-editor shortcuts remain blocked until the Lynx textarea kernel emits
  them reliably.

## First cut

Pull Requests is selected first because P6-C5/C6 already provides:

- real list/detail/pin/filter/tab/close actions;
- exact shared compositions and narrow Lynx Elements adapters;
- real same-server PR data and deterministic DevTool DOM nodes;
- explicit disabled Timeline/Code semantics that can ratchet focusability.

The cut is complete only when hover enter/leave, pressed state, focus state,
Enter/Space activation and disabled exclusion are source-tested and production
runtime evidence is captured. A class existing in generated CSS is not proof
that a product node ever enters that state.

## First-cut result

PR pointer and disabled semantics are now runtime-proven:

- Reviewing entered and left `ui-hover`; All entered `ui-pressed` only while
  the primary pointer button was held.
- Row action, pin, filters and close expose the reusable event contract.
- Timeline and Code are `focusable=false`, `aria-disabled=true` and have no
  activation/focus handlers.
- Enter/Space handler semantics are source-tested, including exact
  `preventDefault` and non-consumption of unrelated keys.

Focus traversal and real key delivery remain open. Click, Tab and `DOM.focus`
did not produce `bindfocus`; PC `setFocus` fulfilled without a focus event while
an older macOS Lynxtron crash modal covered the application. Synthetic Fiber
events also did not cross the native publication boundary. None of these
negative probes is counted as keyboard success. Evidence and cleanup details
are in
`shots/2026-07-30/port/p7-i1/pr-interactions/notes.md`.

The second cut applies the same contract to Settings:

- Back, General, Appearance, reset and boolean switch hosts now expose the
  complete enabled event contract.
- Search and all 12 unavailable navigation rows are explicitly unfocusable and
  handler-free.
- DevTool press/release proved `ui-pressed` on a real switch, toggled its
  `aria-checked` state and reached the canonical renderer persistence key.
- Exact activation at disabled Profile left General selected.

Evidence and byte-exact preference restoration are in
`shots/2026-07-30/port/p7-i1/settings-interactions/notes.md`.

The third cut covers the shared shell/sidebar and Kanban view-backed targets:

- enabled Sidebar primary actions expose the complete event contract; the
  unavailable Automations row is unfocusable and handler-free;
- exact Kanban press/release opens the canonical two-task overview, then an
  exact project-header action opens the real project board;
- a real card enters `ui-pressed` and release opens its real transcript;
- project-board Back enters `ui-pressed` and returns to overview;
- native New task remains honestly unavailable, unfocusable and handler-free
  on both Kanban routes.

This closes pointer/action/disabled mapping for these targets, not the
host-level focus/key item. Evidence and cleanup details are in
`shots/2026-07-30/port/p7-i1/sidebar-kanban-interactions/notes.md`.

The fourth cut starts Thread/Transcript with the physical-shared collapsed-work
disclosure:

- three real transcript triggers expose the complete event contract;
- exact press enters `ui-pressed`; release changes Expand→Collapse,
  `aria-expanded=false→true` and renders the real panel;
- console remains clean.

The native list-controller Jump host is wired to the adapter, but is not
runtime-closed: DevTool touch drags and a fulfilled native scroll invoke did
not publish the user-scroll state required to make it visible. Its interaction
and the detach/reattach path remain open under P7-I3. Evidence is in
`shots/2026-07-30/port/p7-i1/transcript-interactions/notes.md`.

The fifth cut covers Composer controls outside the native text kernel:

- the reusable helper now lives at the canonical UI-host boundary, while the
  former adapter path is a compatibility re-export;
- Extras, Runtime, model, trait/Fast and primary action hosts expose the same
  enabled/disabled contract;
- disabled Send is unfocusable and handler-free; enabled model, menu and trait
  controls expose the full mouse/touch/focus/key/tap contract;
- exact model press remains closed and enters `ui-pressed`; release opens the
  real panel. Exact trait and Extras presses independently enter
  `ui-pressed`, and release reaches their real actions;
- sibling popup triggers use `bindtap`. The discarded `catchtap` attempt
  activated once on press and again on release under Desktop DevTool, closing
  the popup immediately.

This closes Composer non-text pointer/action/disabled mapping. It does not
change the registered textarea Arrow/Enter/Escape exception or claim host-level
Tab/focus/key delivery. Evidence is in
`shots/2026-07-30/port/p7-i1/composer-interactions/notes.md`.

The sixth cut closes the remaining ordinary Sidebar controls:

- both segmented-picker hosts expose full bindings and `aria-pressed`; exact
  Studio press/release changes the real surface and Projects restores it;
- project disclosure headers expose labels plus `aria-expanded`; exact
  press/release collapses and restores the real project;
- every pinned/studio/project/chat thread wrapper is one reusable native
  navigation host with full bindings and its real thread title as label;
- the real `Reply MODEL-READY` row enters `ui-pressed` and releases to its
  route;
- Chats disclosure exposes full bindings and exact false→true→false
  state/action proof. Pagination uses the same helper, but the one-thread
  snapshot did not render it, so its runtime action remains unclaimed.

This removes the last direct tap-only wrappers from the product Sidebar
component. Host-level Tab/focus/key delivery remains open. Evidence is in
`shots/2026-07-30/port/p7-i1/sidebar-controls-interactions/notes.md`.

The no-modal host focus retry is also negative. Computer Use raised the exact
Synara Lynxtron app, delivered real macOS Tab repeatedly, then clicked the Lynx
content so AX focus moved from the standard window to `container lynxtron`.
Another Tab still produced no product `.ui-focus` node and no segmented-state
change under a serialized DevTool observer. This proves the prior crash modal
was not the sole cause: Lynxtron 0.0.7 currently does not publish host Tab
traversal into these focusable views. Source key wiring remains retained, but
runtime focus/key stays a registered platform gap rather than an unbounded
retest loop. Evidence is in
`shots/2026-07-30/port/p7-i1/focus-key-host-negative/notes.md`.

The seventh cut covers Composer overlay item hosts:

- command rows, provider rows/Back, model group disclosures, model options and
  nested favourite controls all use the canonical interaction helper;
- disabled providers are unfocusable and handler-free;
- enabled provider/Back/model rows enter `ui-pressed` and release into their
  real navigation/selection actions;
- favourite uses a nested lifecycle variant: star press enters
  `ui-pressed` while the parent model row remains unchanged; release toggles
  checked state, preserves the popup and does not select the model.

Command rows have source/helper tests and production integration but no runtime
action claim because invoking that menu would re-enter the registered native
textarea input exception. The original Codex Terra/high selection, renderer KV
and window state were restored exactly after a temporary short-catalog OpenCode
fixture. Desktop DevTool could not publish native popup scrolling, so that
offscreen automation limitation is recorded without declaring a product scroll
failure. Evidence is in
`shots/2026-07-30/port/p7-i1/composer-overlay-items/notes.md`.

The eighth cut closes the product-consumed shared Command primitive:

- `SidebarSearchPalette` reaches the canonical native `CommandItem`, so this is
  core-screen product evidence rather than the diagnostics-only primitives page;
- every real item now has hover/pressed/focus, Enter/Space and tap wiring;
- hover/focus continue to publish shared highlight values and `onMouseDown`
  remains compatible with the shared call site;
- disabled items are unfocusable and handler-free;
- real Search press opens five items, Settings press keeps the dialog open and
  enters `ui-pressed`, and release closes the dialog into the real Settings
  screen.

Host keyboard delivery remains the registered P-110 gap. Generic Collapsible
is not counted because the current core-screen disclosures use their narrower
physical-shared Elements adapters. Tooltip trigger state and tooltip popup
open/close/positioning are separated at the P7-I1/P7-I2 boundary rather than
being claimed from the diagnostics page. Evidence is in
`shots/2026-07-30/port/p7-i1/command-primitive/notes.md`.

The ninth cut closes the physical-shared PR Summary disclosure host:

- Description, Checks and Comments use the canonical interaction helper rather
  than tap-only headers;
- all three publish the full enabled handler set, focusability,
  `aria-expanded` and explicit expanded/collapsed accessible labels;
- on real PR #478, visible Description press enters `ui-pressed` without
  toggling, release collapses the body and ARIA state, and the next activation
  restores the expanded state;
- the generic Tooltip and Collapsible files are not counted: production has no
  six-core generic Tooltip consumer, and narrower physical-shared Elements
  adapters own the real disclosure hosts.

The attempted direct component test failed during Rstest vendor generation
before any assertion was collected; helper tests, dual production builds and
the exact production runtime chain are retained instead. Evidence is in
`shots/2026-07-30/port/p7-i1/pr-summary-disclosure/notes.md`.

The tenth cut closes the product-consumed pasted-text reference actions:

- the physical-shared composition continues to own real category
  visibility/order; only the native Elements action hosts change;
- “Show in text field” and nested remove publish the canonical hover, pressed,
  focus, Enter/Space and tap contract with explicit accessible labels;
- the nested remove maps the full mouse/touch/tap lifecycle to `catch*`;
- exact production show press enters `ui-pressed`, release removes the card and
  moves all 25 lines into the textarea;
- a clean fixture restart proves exact remove deletes the card while the
  textarea remains empty.

Native still supplies empty assistant-selection, file-comment, file and image
collections. The dormant image preview/remove component test proves nested
containment but is not counted as product runtime progress. Evidence is in
`shots/2026-07-30/port/p7-i1/composer-reference-attachments/notes.md`.

The eleventh cut closes the real Theme Pack boolean control:

- the physical-shared editor continues to own Light/Dark slot order, labels
  and `opaqueWindows` inversion;
- both “Translucent sidebar” controls publish canonical hover, pressed, focus,
  Enter/Space and tap state plus distinct accessible labels and
  `aria-checked`;
- exact Light press enters `ui-pressed`; release changes
  `aria-checked=true→false` and only the Light theme slot.

The closing production-source direct tap scan leaves five source locations:

- `SettingsRowLayoutElement`: a TypeScript AST audit of all 35 shared
  `SettingsRow` calls finds zero row-level `onClick` props;
- `FidelityReferencePage` and `PortsPage`: unrouted diagnostics;
- generic Tooltip and Collapsible: only consumed by unrouted
  `PrimitivesPage`.

Therefore the product-consumed P7-I1 inventory is closed. The registered
Lynxtron host Tab gap is retained without claiming keyboard runtime success;
Jump detach/reattach stays in P7-I3. Evidence is in
`shots/2026-07-30/port/p7-i1/theme-pack-switch/notes.md`.
