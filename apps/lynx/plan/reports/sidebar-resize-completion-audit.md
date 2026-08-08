# Sidebar reload and resize completion audit

Status: complete for ordinary and Settings left sidebars, plus the distinct
Working Tree Diff and Pull Request Detail right-panel contracts.

## Prompt-to-artifact checklist

| Requirement | Artifact / evidence | Result |
| --- | --- | --- |
| Add Electron-like reload menu actions | `apps/lynx/src/main/desktop/main.ts` View menu contains adjacent `reload` and `forceReload`; `applicationMenu.lynx.test.ts` compares Electron source | PASS — commit `d367a32a` |
| Reuse monorepo resize behavior | `apps/web/src/components/sidebarResize.logic.ts` owns default/min/content bounds, storage key, clamp and left/right pointer math; Web `SidebarRail` and Lynx consume it | PASS |
| Reference Lynxtron drag behavior | Lynx sash follows `lynxtron-examples/lynxtron-go` mouse+touch, nontransparent hit surface, full-screen overlay and missed-mouseup pattern | PASS |
| Ordinary sidebar resizes | `SliceRouter` always wraps `Sidebar` in `SidebarDisclosure`; rendered Rstest drag changes 256→320 and persists | PASS |
| Settings sidebar resizes | `SettingsPage` uses the same `SidebarDisclosure`; both internal sidebars are width `100%` | PASS |
| Open/close remains correct | Existing 220ms disclosure remains; rendered close→open test restores persisted 320px | PASS |
| Desktop bounds protect content | Shared 208px sidebar minimum and 640px content minimum; 900px viewport resolves 260+640, 1024 resolves 384+640 | PASS |
| Compact behavior remains correct | 600px viewport resolves 588px offcanvas over a full 600px main surface and removes the resize sash | PASS |
| Different widths preserve fidelity | 1280px light/dark evidence at 208, 320 and 384; shell, inner sidebar and main widths agree; no horizontal sidebar overflow | PASS |
| Different scroll positions preserve fidelity | ordinary sidebar top/mid/bottom at 0/111/221 with fixed 46px titlebar and 44px footer; Settings 900×320 mid/bottom at 164/328 | PASS |
| Light and dark both verified | identical geometry; generated semantic theme tokens own sash focus and existing sidebar material | PASS |
| Tests cover behavior, not only source strings | Lynx rendered drag/overlay/persistence/open-close test; pure pointer/bounds tests; Web shared math and existing Sidebar tests | PASS |
| Production builds | `build:web` and Native/Desktop `build` pass with existing known warnings | PASS |
| Native evidence is not overstated | exact-owned Native bundle/client/console verified; current SDK did not expose DOM/screencast and injected drag did not persist, so Native pointer drag is not claimed | RECORDED LIMIT |
| Cleanup | canonical fixture cleanup snapshot 215: live projects 0, live threads 0; owned sessions/processes/harness removed | PASS |
| PR Detail right-panel resize | shared right-panel primitive; real 1440 default/drag/min/max and 900 single-surface matrix | PASS |
| Working Tree Diff resize | shared primitive, 320–720 bounds and synchronized ThreadPage padding | PASS — runtime content cell limited by current loading thread |

## Coverage notes

- The resize verifier covers both left-sidebar consumers because both now use
  the same `SidebarDisclosure` owner.
- Environment is a popover, not a sidebar. Diff Dock and Pull Request Detail
  use their own right-panel rules rather than the 208/640 left-sidebar contract.
- The active thread goal remains broader than this slice: future fidelity work
  may add dedicated right-panel resizing without changing the completed
  left-sidebar contract.
