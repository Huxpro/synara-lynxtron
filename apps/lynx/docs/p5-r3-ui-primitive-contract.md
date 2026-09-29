# P5-R3 — Same-API UI primitive contract

Date: 2026-07-27

## Result

Rspeedy now resolves the canonical Web imports below to Lynx platform
implementations. Callers do not add `.lynx`, change props, or import a parallel
API:

| Canonical import              | Shared exports covered                                                                             | Lynx renderer      |
| ----------------------------- | -------------------------------------------------------------------------------------------------- | ------------------ |
| `~/components/ui/button`      | `Button`, `buttonVariants`, dialog/header class constants                                          | lynx-ui Button     |
| `~/components/ui/input`       | `Input`, `InputProps`                                                                              | lynx-ui Input      |
| `~/components/ui/dialog`      | root/trigger/portal/close/backdrop/popup/header/footer/title/description/panel/viewport            | lynx-ui Dialog     |
| `~/components/ui/menu`        | root/portal/trigger/popup/group/item/checkbox/radio/label/separator/shortcut/submenu/create-handle | Lynx view fallback |
| `~/components/ui/tooltip`     | create-handle/provider/root/trigger/popup                                                          | Lynx view fallback |
| `~/components/ui/scroll-area` | `ScrollArea`, `ScrollBar`                                                                          | native scroll-view |
| `~/components/ui/collapsible` | root/trigger/panel/content                                                                         | Lynx state + view  |

The exact aliases precede the general `~` source alias, so platform leaves are
selected before ordinary feature/composition modules fall through to the Web
source tree.

## Event compatibility

The adapters preserve the event shapes used by current shared call sites:

- Input `onChange`, `onFocus`, and `onBlur` receive
  `{ target.value, currentTarget.value }`.
- Button `onClick` receives a small event façade with `preventDefault`,
  `defaultPrevented`, and `stopPropagation`.
- `type="button"` remains accepted by Button and CollapsibleTrigger but is
  renderer metadata on Lynx, not HTML form behavior.

`stopPropagation` is necessarily a no-op because the lynx-ui Button owns the
native tap listener and there is no DOM bubbling chain. Call sites that depend
on nested DOM bubbling must move that interaction into a platform event
adapter; simple defensive `event.stopPropagation()` calls compile and run.

## Representative unchanged Web call-site

`apps/web/src/components/settings/DebouncedSettingTextInput.tsx` is imported
directly from the main repository, unchanged. It continues to import
`~/components/ui/input`, and in the Lynx build that import resolves to
`input.lynx.tsx`. Its existing controlled value, `event.target.value`,
focus/blur, debounce, and commit composition compiled without a fork.

The production Lynxtron runtime rendered the shared component and its native
input. DevTool DOM evidence showed `bindfocus`/`bindblur` on the input, and the
console contained only the preload startup log.

- Runtime screenshot:
  `shots/2026-07-27/port/p5-r3/primitive-contract/lynx.png`
- Runtime notes:
  `shots/2026-07-27/port/p5-r3/primitive-contract/notes.md`

`PrimitivesPage.tsx` was also switched from slice-relative imports to all seven
canonical Web import paths. The production build therefore compiles the whole
adapter surface even though the unchanged Web settings input is the
representative runtime acceptance call-site.

## Verification

- `bun run --cwd apps/lynx build`: passed; Lynx 588.6 kB and desktop 703.2 kB total.
- `bun run --cwd apps/lynx audit:reuse:check`: passed, zero unresolved imports.
- Reuse audit now counts the unchanged `DebouncedSettingTextInput.tsx` as
  physical `SHARED` while correctly classifying `input.lynx.tsx` as `SPLIT`;
  Settings gate moved from 0.14% to 0.24%.
- Rstest: five files / 13 tests passed. The existing aggregate
  `src/app/__tests__/index.test.tsx` could not load Rstest's generated
  lynx-ui vendor chunk (`Invalid left-hand side in assignment`) under Node 26
  or Node 22; three retries reproduced the test-loader failure before any test
  ran. Production Rspeedy build and Lynxtron runtime both load the same
  primitives successfully.

This task establishes API and resolver compatibility, not final visual parity.
Menu/Tooltip positioning, scroll fade, pointer/keyboard behavior, and
disclosure motion remain explicitly staged for P5-R4/P6/P7.
