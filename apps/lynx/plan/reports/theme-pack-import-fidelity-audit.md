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
