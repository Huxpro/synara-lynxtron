# P7-I2 overlays and context-actions inventory

Status: completed
Baseline: 2026-07-30 after P7-I1 completion

## Scope rule

P7-I2 only counts overlays that a routed core screen consumes. A primitive
demo, dormant Web branch, generated CSS selector, or component test is not
product evidence. Web-only actions that depend on an unavailable native
capability stay explicit gaps rather than becoming inert menu rows.

## Core-screen inventory

| Surface | Product-consumed overlay | Native state | P7-I2 treatment |
| --- | --- | --- | --- |
| Shell / Sidebar | Search Palette through the shared `CommandDialog`; Web thread/project context actions | Search Palette is routed and uses the native Dialog adapter. Thread rows now publish a real PC secondary-button path to a Lynxtron system menu and consume the physical-shared thread action-item policy | Dialog base and real thread context actions complete. Pin/copy/archive/delete are capability-backed; unavailable rename/mark-unread/handoff/terminal rows are omitted. Native no-result text entry remains the registered text-kernel gap |
| Thread / Composer | Physical-shared Extras and Runtime Mode menus; model picker popup | All three now consume the canonical native Menu viewport layer. The model picker retains its provider→model state and shared option compositions but no longer owns duplicate absolute positioning | Menu/model overlay contract closed: top/start and top/end anchors, outside/selection dismiss, loading and disabled states are covered |
| Settings | General select menus, Appearance select menus and Theme Pack code menus | All routed native callers import the canonical Menu adapter; General provider runtime is exact end-aligned with a 4px bottom gap and outside dismissal | Inherited Menu contract closed. Long-list scroll/density/theme coverage remains P7-I3/P7-I4 rather than a separate overlay kernel |
| Projects / Kanban | Web task-extras menu and mutation dialogs | Native Kanban remains intentionally read-only; those mutation overlays are not product-consumed | No dormant-branch credit. Verify the existing read-only/unavailable affordances under P7-I5 |
| Pull Requests | Routed project-filter menu; unavailable Timeline/Code actions | Project filter imports the canonical Menu adapter; real right-edge filter is exact end-aligned with a 4px gap, no overflow and item dismissal | Inherited Menu contract closed. Timeline/Code remain honestly unavailable and do not become menu targets |
| Generic Tooltip / Popover | Diagnostics page only on native | No routed six-core generic Tooltip or direct Popover consumer | Excluded from product progress. Revisit only when a real consumer exists |

## First-cut result: canonical native Menu

The retained platform kernel in `slice/src/components/ui/menu.lynx.tsx` now
owns:

- a fixed viewport layer and transparent full-screen dismissal backdrop;
- screen-relative trigger measurement through `getRectByRef(ref, true)`;
- top/bottom/left/right placement, start/center/end alignment and viewport
  clamping;
- hidden-until-measured rendering, avoiding a visible `(0, 0)` flash;
- `aria-haspopup`, `aria-expanded`, Escape dismissal and canonical
  pointer/focus/key activation;
- item selection dismissal and handler-free, unfocusable disabled
  trigger/item states.

The official `@lynx-js/lynx-ui` Popover attempt was removed. Its Presence path
waits on `delayFrames`, backed by `lynx.requestAnimationFrame`; the Lynxtron
0.0.7 PC host did not advance that chain, leaving the popup mounted with
`visibility:hidden` and no console error. A production build passing was not
treated as runtime support.

The native submenu remains an explicitly inline fallback. It preserves the
physical-shared Extras composition and selection behavior but does not claim
independent flyout positioning.

## Runtime evidence

Real `Reply MODEL-READY` Composer evidence:

- Extras trigger: `(407, 741)–(439, 769)`;
- Extras popup: `(407, 543)–(595, 737)`, exact start alignment and `4px`
  top-side gap;
- Runtime trigger: `(439, 741)–(530, 769)`;
- Runtime popup: `(439, 621)–(627, 737)`, exact start alignment and `4px`
  top-side gap;
- backdrop: `(0, 0)–(1280, 788)`;
- outside activation removed the popup and changed the trigger to
  `aria-expanded=false`;
- selecting the current Runtime item removed the popup;
- disabled “Add image — unavailable” published `focusable=false`,
  `aria-disabled=true`, `role=menuitem`, and no activation/focus handlers;
- console `error,warning` was empty.

Frames and the exact cleanup record are in
`shots/2026-07-30/port/p7-i2/composer-menu-overlay/notes.md`.

## Second-cut result: routed Search Palette Dialog

The native Dialog wrapper now owns one open-state path for controlled and
uncontrolled callers. Backdrop, close button and Escape converge on
`onOpenChange(false)`. Content publishes `role=dialog`, `aria-modal=true` and
one bubbling Escape handler.

In the real routed Search Palette:

- popup `(430,204)–(850,584)` was centered over a full
  `(0,0)–(1280,788)` backdrop;
- five command rows came from the real sequence-178 snapshot;
- outside activation removed the popup;
- the real Settings command removed the popup and rendered `.SettingsPage`;
- console `error,warning` was empty.

Host physical Escape remains the P-110 keyboard-publication gap; component
tests prove the retained callback path without claiming a runtime key pass.
Evidence:
`shots/2026-07-30/port/p7-i2/search-dialog/notes.md`.

## Third-cut result: Settings and PR Menu inheritance

The same retained Menu kernel was exercised on two different routed callers:

- Settings provider trigger `(916,163)–(1060,195)` and popup
  `(840,199)–(1060,501)`;
- PR filter trigger `(1160,99)–(1256,131)` and popup
  `(1000,135)–(1256,251)`.

Both have exact end alignment and a `4px` bottom-side gap. The PR case proves
right-edge behavior without overflow. Outside dismissal preserved the Settings
selection; activating the already-selected real PR filter removed the popup
without a state mutation. Console remained clean. Evidence:
`shots/2026-07-30/port/p7-i2/settings-pr-menu/notes.md`.

## Fourth-cut result: Composer model popup convergence

The model picker no longer maintains a separate `position:absolute` popup.
Its physical-shared trigger, trait section and model-group composition now run
inside the canonical fixed Menu layer while the native control keeps only its
provider→model panel state.

- trigger `(943,741)–(1093,769)`;
- popup `(833,425)–(1093,735)`;
- exact end alignment and `6px` top-side gap;
- full `(0,0)–(1280,788)` backdrop;
- outside and current-trait selection each changed popup count `1→0`;
- unavailable provider rows were unfocusable and handler-free;
- pending provider navigation resolves to a dedicated loading status rather
  than stale fallback options;
- console remained clean and sequence stayed `178`.

Evidence:
`shots/2026-07-30/port/p7-i2/composer-model-popup/notes.md`.

## Fifth-cut result: real Sidebar context actions

The audit found that the platform boundary was available but unconnected:
Lynx PC publishes secondary-button mouse events and Lynxtron 0.0.7 exposes
`Menu.popup`. A new native context-menu port now bridges the two, while Web and
Lynx physically share `buildThreadContextMenuItems`.

The routed Native Sidebar publishes only capability-backed actions:

- Pin/Unpin dispatches `thread.meta.update` and reconciles the shared persisted
  pin store;
- Copy Path and Copy Thread ID use the existing native clipboard port;
- Archive/Delete use the existing orchestration commands and native
  confirmation dialog;
- running threads omit Archive/Delete;
- Rename, Mark unread, Handoff and Open Path in Terminal remain absent rather
  than appearing as inert rows.

Real macOS secondary-click evidence showed five exact rows, Escape dismissal,
and a server-backed Pin→Unpin round trip. The first attempt also exposed local
pointer coordinates; the retained implementation adds the row's measured
screen rect and the host receives `(86,337)` instead of the incorrect
`(58,11)`. Evidence:
`shots/2026-07-30/port/p7-i2/sidebar-context-actions/notes.md`.

P7-I2 is complete. Search no-result native text entry remains an explicit
text-kernel gap; generic Tooltip/Popover still have no routed core consumer,
and Kanban mutation menus remain outside the intentionally read-only native
board. Those boundaries are explicit rather than silently missing.
