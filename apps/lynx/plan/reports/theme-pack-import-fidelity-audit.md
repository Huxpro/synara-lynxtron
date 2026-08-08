# Theme Pack Import fidelity audit

Status: Browser-complete, Native batch pending

Updated: 2026-08-09

## Objective

Continue the current-head fidelity sweep by closing the remaining actionable
Appearance Theme Pack import mismatch without regressing light or dark mode.

Concrete success criteria:

1. Treat the current Web source as authority, not the stale note that described
   this surface as Share/Edit.
2. Replace Lynx's direct `Import clipboard` action with the real editable
   Import dialog used by Web.
3. Preserve the shared theme parser and state mutation path.
4. Keep invalid input editable, display the exact parser error, and do not close
   the dialog.
5. Close and clear the dialog after a valid import.
6. Match the stable Web dialog geometry and light/dark material.
7. Verify focused tests, Lynx-for-Web production build, and Native/Desktop
   production build.
8. Do not claim Native textarea or IME certification from a browser run.

## Prompt-to-artifact checklist

| Requirement | Artifact or evidence | Result |
| --- | --- | --- |
| Current authority inspected | `apps/web/src/components/settings/ThemePackEditorCompositionElements.tsx` currently renders `Import` dialog plus `Copy` | PASS |
| Stale residual rejected | `shots/2026-08-08/settings-appearance-theme-icons-current/notes.md` says Share/Edit, but current source does not; implementation follows current source | PASS |
| Editable Import dialog | `ThemePackImportActionElement` owns open/value/error state and a native `<textarea>` | PASS |
| Shared parser retained | Submit still calls the composition-provided `onImport`, which is wired to `updateThemePackFromShareString` | PASS |
| Invalid value remains editable | Real Lynx-for-Web input `not-a-theme` kept the dialog open and rendered `Theme share string must start with codex-theme-v1:` | PASS |
| Valid value imports | A real `createThemeShareString("light", ...)` payload closed the dialog and persisted `synara:theme` | PASS |
| Button hierarchy and order | Header remains `Import`, `Copy`; dialog footer remains `Cancel`, `Import` | PASS |
| Web geometry authority | Dialog `448x242.5`; textarea `412x94`; Cancel `59.65625x28`; Import `58.265625x28` | PASS |
| Lynx light geometry | Exact same four stable boxes at `1280x820`, DPR 1 | PASS |
| Lynx dark geometry | Exact same four stable boxes at `1280x820`, DPR 1 | PASS |
| Close control anatomy | Web and Lynx root `28x28` at `827,297.75`, radius 10; icon `16x16` at `833,303.75` | PASS |
| Invalid-state geometry | Web and Lynx dialog `448x266.5`; error `414x16` at `433,462.25`; footer `446x52` at `417,490.25` | PASS |
| Error clearing | Editing the invalid value removes the error immediately and returns the dialog to `448x242.5` | PASS |
| Compact base dialog | At `320x640`, Web and Lynx use a bottom sheet `320x301.5`, textarea `286x94`, 32px full-width stacked actions, and a 32px close control | PASS |
| Compact invalid dialog | Web and Lynx use `320x341.5`; wrapped error `288x32`; footer stays pinned at `y=544` | PASS |
| Compact breakpoint | Both clients use the bottom sheet through 639px and switch to the centered 448px modal at exactly 640px | PASS |
| Very-short reachability | Lynx uses a real scroll owner at `320x200`; base max scroll 150 and invalid max scroll 190 expose both actions | PASS — INTENTIONAL CORRECTNESS DELTA |
| Light material | Dialog `rgb(255,255,255)`, ink `rgb(13,13,13)`, 7% semantic border, radius 22 | PASS |
| Dark material | Dialog `rgb(23,23,23)`, ink `rgb(252,252,252)`, 7% semantic border, radius 22 | PASS |
| Connection provenance | Three-client preflight resolved server instance `bec7ebc4-3a45-4cc3-9f91-bc5aab3f1064`, snapshot 0; relay had no transport/RPC error | PASS |
| Screenshot dimensions | Web and Lynx retained diagnostic frames were each measured as `1280x820` | PASS |
| Focused regression coverage | 3 files / 21 tests pass, including success and parser-error dialog behavior | PASS |
| Production builds | Lynx-for-Web and Native/Desktop builds pass; only existing encoder and optional `ws` warnings | PASS |
| React Doctor | Controlled-input and label findings were fixed; one remaining warning targets ReactLynx-only `accessibility-element`, which is required by the native AX contract | PASS WITH DOCUMENTED FALSE POSITIVE |
| Native textarea/IME | Browser evidence cannot certify native selection, paste, composition, or keyboard routing | PENDING NATIVE BATCH |

## Stable geometry

At `1280x820`, after the 200ms dialog entrance settled:

| Element | Web | Lynx-for-Web |
| --- | --- | --- |
| Dialog | `416,288.75,448x242.5` | `416,288.75,448x242.5` |
| Header | `417,289.75,446x80.5` | `417,289.75,446x80.5` |
| Title | `433,305.75,414x22.5` | `433,305.75,414x22.5` |
| Description | `433,334.25,414x32` | `433,334.25,414x32` |
| Panel | `433,370.25,414x96` | `433,370.25,414x96` |
| Textarea | `434,371.25,412x94` | `434,371.25,412x94` |
| Footer | `417,478.25,446x52` | `417,478.25,446x52` |
| Cancel | `721.078125,490.25,59.65625x28` | exact |
| Import | `788.734375,490.25,58.265625x28` | exact |
| Close | `827,297.75,28x28` | exact |
| Close icon | `833,303.75,16x16` | exact |

## Invalid state

Submitting `not-a-theme` through each rendered textarea produces the shared
parser error `Theme share string must start with codex-theme-v1:`. The first
Lynx implementation used an 18px line box while Web uses 16px, making the
dialog two pixels too tall and shifting its centered top by one pixel. The
error owner now uses `12px/16px`; no dialog-level offset or fixed error-state
height was added.

At `1280x820`, both clients now resolve:

- dialog `416,276.75,448x266.5`;
- textarea `434,359.25,412x94`;
- error `433,462.25,414x16`;
- footer `417,490.25,446x52`.

Changing the textarea after the error removes the error node and restores the
stable base dialog to `416,288.75,448x242.5`. The same geometry and
`rgb(224,46,42)` destructive tone were verified after a real switch to dark.

## Compact layout

The desktop modal cannot simply shrink at compact widths. Web switches to a
bottom sheet with a 48px top budget, square edges, a vertically reversed footer,
and full-width 32px actions. Lynx now owns the same behavior through the
explicit `SharedThemePackImportViewport` class rather than copying Web's
`:has()` selector into the Lynx CSS subset.

At `320x640`, both clients resolve the base state to:

- dialog `0,338.5,320x301.5`;
- description `16,384,288x48`;
- textarea `17,437,286x94`;
- footer `0,544,320x96`;
- Import `16,556,288x32`;
- Cancel `16,596,288x32`;
- Close `280,347.5,32x32`.

The wrapped invalid state is also exact: dialog `0,298.5,320x341.5`, error
`16,500,288x32`, and the footer remains pinned at `0,544,320x96`. A real dark
switch retained the same geometry with `rgb(23,23,23)` surface, 7% semantic
border, and the shared destructive error tone.

Web's `max-sm` contract ends below 640px, while Lynx's broader
`viewport-compact` band continues to 767px. Applying the sheet solely from the
compact band incorrectly produced a full-width bottom sheet at 700px. The
explicit `SliceRoot--viewport-sm-up` override now restores the desktop modal
without changing global viewport classification:

- 639px: both dialogs `0,354.5,639x285.5` bottom sheets;
- 640px: both dialogs `96,198.75,448x242.5` centered modals;
- 700px: both dialogs `126,198.75,448x242.5` centered modals.

The matrix was exercised through live viewport changes while the dialog stayed
open, covering the responsive transition rather than only cold-start classes.

### Very-short boundary

At `320x200`, the 48px mobile top budget leaves a 152px popup viewport. Web
keeps its 96.5px header and 96px footer but exposes no functioning scroll
owner: content extends below the viewport and `scrollTop` remains zero, leaving
Cancel unreachable. This is an authority bug and is not copied.

Lynx wraps the complete header/panel/footer stack in
`SharedThemePackImportScroll`, while the Close control remains fixed above it:

- base content `301px`, viewport `151px`, max scroll `150`;
- invalid content `341px`, max scroll `190`;
- at max scroll, Submit is `y=115.5..147.5` and Cancel is
  `y=155.5..187.5`;
- invalid error remains visible at `y=59.5..91.5`.

The scroll wrapper has max scroll zero at `320x640` and `1280x820`; all prior
base geometry remains exact at both sizes. The very-short divergence is
therefore a bounded reachability improvement, not a general layout fork.

The first Lynx capture measured the dialog at 98% scale because it sampled the
entrance transition. It was rejected; the stable post-transition frame above
is the retained geometry.

## Residuals and disposition

- Native textarea, IME, selection, paste, undo/redo, and keyboard routing remain
  a required Native batch boundary.
- A fresh exact-owned Native attempt identified PID `34313`, PID-derived
  `localhost:8902/session 1`, the current staged bundle URL, and an empty
  warning/error console. `DOM.getDocument` still returned `{}` and DevTool
  screencast timed out, so Native dialog pixels/input remain harness-blocked
  rather than being promoted from Browser evidence.
- Lynx-for-Web did not publish `mouseenter` to the custom `DialogClose` root.
  No dead hover CSS is retained; pointer-hover publication remains part of the
  known host mouse-event boundary.
- The current React Doctor warning for `accessibility-element` is a DOM-rule
  false positive. Removing it would regress Lynx native accessibility.
- This slice closes one concrete current-head residual. It does not establish
  that the open-ended whole-product fidelity objective has no remaining work.
