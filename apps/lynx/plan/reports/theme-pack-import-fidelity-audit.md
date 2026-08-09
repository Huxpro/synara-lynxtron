# Theme Pack Import fidelity audit

Status: Browser-complete, Native dialog and dismiss interaction verified

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
| Focus restoration | Shared `DialogTrigger` registers one exact selector; success, Cancel, Close, and Escape all invoke native `setFocus` on dismissal | PASS |
| Dialog elevation | Light uses 34% and dark uses 70% `0 16px 50px -12px` shadow, matching Web | PASS |
| Light material | Dialog `rgb(255,255,255)`, ink `rgb(13,13,13)`, 7% semantic border, radius 22 | PASS |
| Dark material | Dialog `rgb(23,23,23)`, ink `rgb(252,252,252)`, 7% semantic border, radius 22 | PASS |
| Dialog border and shadow ownership | Popup uses Web's `--color-border-light` (6% light / 4.7% dark) and visible overflow so the matching lift shadow is not clipped | PASS |
| Placeholder tone | Web and Lynx internal textarea placeholders resolve to foreground/50: light `rgba(13,13,13,.5)`, dark `rgba(252,252,252,.5)` | PASS |
| Focus border optics | Web control and Lynx textarea resolve to foreground/30 in both themes instead of the blue `--ring`; textarea geometry remains `412x94` | PASS |
| Textarea border ownership | Lynx now mirrors Web's `414x96` bordered control around a borderless `412x94` textarea; focus/blur projects the 30% border onto the outer owner | PASS |
| Textarea runtime typography | Native host uses Web's `12px/18px` system UI and `8px 10px` padding; Lynx-for-Web uses official `injectStyleRules` to prevent Web Elements from applying the host padding twice | PASS |
| Header typography and code anatomy | Lynx title now resolves foreground/600; description resolves muted foreground; inline `codex-theme-v1:` chip matches Web at `116x20`, `2px 4px`, radius 4, code font | PASS |
| Close icon tone | Generated Lynx X icon now receives the real muted color prop plus Web's 0.8 SVG opacity instead of relying on a dead CSS `color` declaration | PASS |
| Disabled Import paint | Empty-value submit uses Web's local disabled opacity `0.64` instead of the generic Lynx `0.48`; button geometry remains exact | PASS |
| Footer action typography | Cancel and Import labels use Web dialog actions' weight `400` instead of generic Lynx Button weight `500` | PASS |
| Footer action radius | Cancel and Import use Web Dialog's local `rounded-md` / `6px` radius instead of generic Lynx Button `10px` | PASS |
| Connection provenance | Three-client preflight resolved server instance `bec7ebc4-3a45-4cc3-9f91-bc5aab3f1064`, snapshot 0; relay had no transport/RPC error | PASS |
| Screenshot dimensions | Web and Lynx retained diagnostic frames were each measured as `1280x820` | PASS |
| Focused regression coverage | 3 files / 21 tests pass, including success and parser-error dialog behavior | PASS |
| Production builds | Lynx-for-Web and Native/Desktop builds pass; only existing encoder and optional `ws` warnings | PASS |
| React Doctor | Controlled-input and label findings were fixed; one remaining warning targets ReactLynx-only `accessibility-element`, which is required by the native AX contract | PASS WITH DOCUMENTED FALSE POSITIVE |
| Native dialog anatomy and dismissal | Lynxtron `0.0.9-dev`, the current staged bundle, startup deep link `synara://settings/appearance`, and PID-derived DevTool evidence now cover light/dark dialog geometry and real trigger/Cancel/Close paths. The first `0.0.9` run exposed a real z-order defect: the visible Close center hit the title text. `z-index: 1` restores the Close subtree as the hit target and a real exact-client click unmounts the dialog | PASS — `shots/2026-08-09/theme-pack-import-native/` |
| Native textarea/IME | The current Native dialog and textarea now render, but the background-owned window is not the frontmost macOS text client. Programmatic `setValue` would bypass `bindinput` and is not accepted as input evidence. Ordinary typing, selection, paste, composition, and undo/redo therefore remain uncertified rather than being inferred from Browser tests | PARTIAL — HOST TEXT-CLIENT BOUNDARY |

## Resolved Native preflight blocker

The original 2026-08-09 Native batch was attempted rather than inferred from
browser evidence:

- exact-owned current-head process PID `29047`, then pushed-baseline PID
  `49010`;
- DevTool client `localhost:8903`, App `@synara/lynx`, session URL
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`;
- owned CoreGraphics window `1280×820`;
- staged/output current-head bundle hash
  `16ea76029c27f34ee6c35b8f7e21982caf2cfc24ab59fa47cde111bd8f1068c7`;
- isolated server `58190` and isolated Lynx user-data state;
- empty DevTool error/warning console except the expected preload message.

Both current-head and the clean pushed baseline reached the same Lynxtron
0.0.7 host failure before ReactLynx initialized:

```text
An error occurred when parse json: The data couldn’t be read because it isn’t in the correct format.
```

The owned window remained a blank white LynxView, `DOM.getDocument` returned
`{}`, DevTool screenshot capture timed out, and ReactLynx exposed no component
frames. Because the baseline reproduces the failure, no product regression is
claimed; because the Theme Import UI never rendered, no Native textarea/IME
pass is claimed either.

### Root-cause isolation

The blocker was subsequently narrowed beyond the original baseline check:

- the 2026-08-04 certified Native source head `52ec3f62` rebuilt to the
  recorded `2583.5 kB` bundle and initialized successfully on the same
  Lynxtron 0.0.7 executable;
- an automated `git bisect` from `52ec3f62` to `02cfa0b7` identified
  `e25a8f7c` (`Add Environment pinned checklist`) as the first bundle that the
  host rejected;
- the last good bundle contained 748 unique ReactLynx snapshot templates; the
  first bad bundle contained 756, and current head contains more than 800;
- replacing the newly added row with `null` restored Native startup, while
  retaining any rendered row shape reproduced the parser failure. This rules
  out the pinned-message RPC/data path and points to the legacy snapshot
  template payload handled by the host;
- removing Native `loadFile` init data, changing cache keys, disabling source
  maps/UI source maps, moving debug info, enabling bundle-size optimization,
  and splitting source files did not fix the host parser;
- Lynxtron 0.0.8 reproduced the same failure. Lynxtron 0.0.9 did not provide a
  usable renderer/DevTool session in this environment and therefore was not
  accepted as a passing upgrade;
- ReactLynx standalone/automatic lazy bundles allow the main bundle to start,
  but Lynxtron 0.0.7 rejects the dynamic bundle through both QueryComponent and
  FetchBundle paths. Element Template compilation removes snapshot pressure,
  but the current `@lynx-js/lynx-ui` dependency is not compatible with that
  runtime entry.

The actionable prerequisite is therefore a Lynxtron/Lynx SDK combination that
successfully loads the current ReactLynx snapshot bundle, or supports Element
Template together with LynxUI. Reducing or hiding product UI only to stay below
the legacy parser boundary is not treated as an acceptable fidelity fix.

That prerequisite was resolved by `b7b06ac7`: pure pinned/marker label helpers
now live in `packages/shared`, so the Lynx bundle no longer pulls Web dispatch,
Effect RPC, and `wsTransport` into the PrimJS context. The Lynxtron toolchain is
now `0.0.9`. Current exact-owned runs render the Appearance page and Import
dialog in both themes.

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

## Focus restoration

The original Lynx action manually toggled Dialog state from a sibling Button,
so the shared Dialog never registered a trigger selector and could not restore
keyboard focus after dismissal. The action now renders the exact same button
inside `DialogTrigger`; it does not call the focus bridge directly.

Focused tests verify all four dismissal paths:

- valid Import submit;
- Cancel;
- the 16px Close control;
- Escape.

Each path selects the generated `.LxDialogTrigger--N` and invokes
`setFocus({ focus: true })`. A first attempt used `DialogTrigger render=...`,
which dropped Button text and shrank the header action to 18px in the
Lynx-for-Web runtime; that variant was rejected. The final children-based
composition preserves the prior exact `56.265625x25` Import geometry and text.

## Elevation

The shared backdrop already matched Web at 60% black, but the Lynx Import popup
had no elevation. The popup now uses the current Web authority directly:

- light: `0 16px 50px -12px rgba(0,0,0,0.34)`;
- dark: `0 16px 50px -12px rgba(0,0,0,0.7)`.

Both values were verified from resolved runtime styles after real Appearance
theme changes. Compact sheets retain the same nominal shadow, as Web does, but
their bottom/full-width placement clips it naturally; `320x640` geometry
remains `0,338.5,320x301.5`.

The first Lynx capture measured the dialog at 98% scale because it sampled the
entrance transition. It was rejected; the stable post-transition frame above
is the retained geometry.

The final current-head material audit found two generic-dialog inheritances:
Lynx used the stronger 7% `--border`, while Web uses
`--color-border-light`; Lynx also clipped the matching shadow with
`overflow:hidden`. The Theme Pack popup now resolves to Web's 6% light and
4.7% dark border values and visible overflow. In a `480x290` popup-plus-shadow
crop, changed pixels fell from `8.92%` to `8.31%` in light and from `8.88%` to
`8.25%` in dark. The connected bottom-shadow cluster fell from 900 to 490
pixels in light and from an `818x2` band to a `412x1` band in dark.

## Textarea optics

The remaining focused-state mismatch was inside the Import textarea rather
than the dialog shell:

- Web renders placeholder text at `foreground/50`; Lynx inherited full-strength
  foreground because the native `placeholder-color` contract was not supplied.
- Web focuses the textarea control with `foreground/30`; Lynx used the semantic
  blue `--ring`.

The Lynx adapter now publishes
`placeholder-color="var(--theme-pack-import-placeholder)"`. Theme-scoped values
are attached directly to the `x-textarea` host so the Web Elements shadow
textarea consumes them through its internal `--placeholder-color` bridge:

- light placeholder `rgba(13,13,13,.5)`;
- dark placeholder `rgba(252,252,252,.5)`.

Focused borders use matching theme-scoped 30% foreground values. Resolved
runtime evidence in
`shots/2026-08-09/theme-pack-import-optics/resolved-optics.json` confirms:

- Web placeholder `foreground/50` and outer control border `foreground/30`;
- Lynx shadow `<textarea>::placeholder` exact 50% foreground;
- Lynx focused host border exact 30% foreground;
- unchanged `434,371.25,412x94` textarea geometry in light and dark;
- one relay connection, no pending requests, and no transport or RPC errors.

All four retained frames are exactly `1280x820`.

The final structure also matches Web's paint ownership rather than only its
color. A `414x96` `SharedThemePackImportTextareaControl` owns the border and
radius, while the inner textarea is `412x94`, borderless, and uses the Web
inner padding `7px 9px`. Native `bindfocus` / `bindblur` project the focused
class to the outer control. The exact textarea-region changed ratio fell from
`9.95%` to `9.32%` in light and from `9.96%` to `9.35%` in dark; mean
max-channel difference fell from `6.57` to `6.07` and from `6.72` to `6.17`.

Runtime inspection also corrected a misleading source-level assumption. Web's
`font-chat-code text-[11px]` class is attached to the Textarea control wrapper,
while the inner textarea resolves to `12px/18px`, the system UI stack, and
`8px 10px` padding. The Lynx host now owns those same values.

Lynx-for-Web's `x-textarea` inherits the host padding into its shadow textarea,
which otherwise applies the padding twice. The Web host uses LynxView's
official `injectStyleRules` hook to inject one narrowly scoped
`.SharedThemePackImportTextarea::part(textarea)` normalization into the
LynxView shadow root. The Desktop/Lynx bundle does not contain this Web-only
rule. The final textarea-region changed ratio fell from `6.74%` to `4.99%` in
light and from `6.77%` to `4.97%` in dark; mean max-channel difference fell
from `4.19` to `2.39` and from `4.41` to `2.53`.

Artifact inspection confirms the selector is present in `web-host.js`, absent
from both `dist/desktop/main.js` and `main.lynx.bundle`, and the restored
default Web bundle contains only the product endpoint `58090`.

## Header typography

A pixel-region audit after the textarea fix found the next high-signal
residual in the dialog header. The Lynx adapter used raw `<text>` nodes instead
of `DialogTitle` / Web paragraph primitives, but had not re-declared their
typography:

- the title painted with the engine default black and no explicit semibold
  weight;
- the description inherited full-strength foreground instead of muted
  foreground;
- `codex-theme-v1:` was plain text instead of Web's inline code chip.

The adapter now owns the equivalent source-level contract:

- title `foreground`, `18px/22.5px`, weight `600`;
- description `muted-foreground`, `12px/16px`;
- nested inline code text with `2px 4px` padding, radius `4px`, `--muted`
  background, and the shared code font.

The final code chip is exact at `477.734375,332.25,116x20`; dialog, description,
and textarea geometry remain unchanged. Stable region comparison reduced the
full header mean max-channel difference from `18.86` to `6.87` in light mode
and from `13.03` to `8.02` in dark mode. Title-only light difference fell from
`18.85` to `1.93`. The remaining pixels are dominated by cross-engine text
rasterization rather than an uncovered token or geometry owner.

## Disabled action

The next connected diff cluster covered the complete disabled Import button.
Web's shared Button contract uses `disabled:opacity-64`, while the generic Lynx
primitive uses `0.48`. Changing the global primitive would affect unrelated
controls, so the Import submit owns a local `0.64` disabled override.

Resolved light and dark runtime styles both report `opacity: 0.64` with the
unchanged `788.734375,490.25,58.265625x28` button box. In the exact button
region, changed pixels fell from `86.34%` to `31.83%` in light and `31.72%` in
dark. Mean max-channel difference fell from `50.18` to `31.54` in light and
from `46.37` to `28.27` in dark.

Both footer action labels now also match Web's `font-normal` dialog override.
Resolved Cancel and Import weights are `400` in both themes. Cancel mean
max-channel difference fell from `30.94` to `28.99` in light and from `32.62`
to `30.32` in dark. The disabled Import region, including the prior opacity
repair, fell from `86.34%` changed pixels to `30.70%` in light and `30.65%` in
dark.

The same Web dialog override applies `rounded-md`; both Lynx actions now
resolve to `6px` without changing their established `59.65625x28` and
`58.265625x28` boxes. The final whole-dialog changed ratio is `11.41%` in
light and `11.30%` in dark. Remaining connected components are concentrated in
cross-element border rasterization and text glyphs; no unresolved action
radius, size, placement, weight, opacity, or semantic-color owner remains.

## Close icon tone

The close glyph shape and `16x16` box were already exact, but its generated
SVG ignored the adapter's CSS `color` declaration. `createLynxIcon` resolves
only its `color` prop before embedding SVG content, so the glyph painted at full
foreground.

The action now passes `color="var(--muted-foreground)"` and the Web Button SVG
opacity `0.8` directly to the icon. Runtime SVG content resolves to
`rgba(13,13,13,.6)` in light and `rgba(252,252,252,.6)` in dark, with outer
opacity `0.8`. The close crop changed ratio fell from `16.05%` to `0%` in light
and to `4.94%` in dark; neither final crop has any channel difference above
16.

## Residuals and disposition

- Native textarea, IME, selection, paste, undo/redo, and keyboard routing remain
  a required Native batch boundary. The bundle/parser blocker no longer applies;
  the remaining prerequisite is a visible, frontmost exact-owned macOS text
  client.
- Current exact-owned Native evidence proves the real `synara://settings/appearance`
  route, light/dark dialog pixels and geometry, trigger activation, Cancel, and
  the repaired Close hit target with empty warning/error consoles.
- Lynx-for-Web did not publish `mouseenter` to the custom `DialogClose` root.
  No dead hover CSS is retained; pointer-hover publication remains part of the
  known host mouse-event boundary.
- The current React Doctor warning for `accessibility-element` is a DOM-rule
  false positive. Removing it would regress Lynx native accessibility.
- This slice closes one concrete current-head residual. It does not establish
  that the open-ended whole-product fidelity objective has no remaining work.
