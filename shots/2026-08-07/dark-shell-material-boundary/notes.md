# Dark shell material boundary

- Date: 2026-08-07
- Purpose: classify the remaining large-area dark shell color difference after
  seam/highlight ownership was corrected.

## Measurement

Current Electron authority at DPR 2:

- sidebar body: RGB `6`;
- main body: RGB `7`;
- sidebar top highlight: RGB `8`.

Current exact-owned Native at DPR 2:

- sidebar body: RGB `17` (`#111111`);
- sidebar top highlight: RGB `23`.

The difference is real and large-area, but it is not an isolated authored hex
bug.

## Contract

The canonical Codex dark theme pack surface is `#111111`. Web macOS uses the
translucent material branch:

- transparent shell;
- 72% sidebar surface mixed over the vibrancy/backdrop;
- blur/saturation supplied by Electron/macOS.

Lynxtron does not expose that backdrop/vibrancy contract. Its generated Native
theme sheet intentionally uses the opaque branch:

- shell `#101010`;
- sidebar/theme surface `#111111`;
- no backdrop filter.

Changing the canonical Codex surface to the Electron screenshot's `#060606`
would alter exported/shared theme semantics and every host, including custom
theme editing. It would not reproduce the variable desktop backdrop; it would
only hardcode one captured environment.

## Disposition

Keep this as an intentional host material delta until Lynxtron exposes a real
vibrancy/backdrop surface or the product explicitly chooses a separate Native
opaque theme calibration policy.

The safe fidelity work around this boundary is complete:

- duplicate sidebar borders removed;
- raised content-card seam restored;
- dark edge calibrated to the current painted Electron relative lift;
- ordinary/Settings top highlights restored with direct light/dark values.

`measurements.json` contains the sampled values. The generated Native theme
sheet identifies `scripts/generate-native-theme-css.ts` as its source, but that
generator is not present in the current tree; hand-editing the generated sheet
would also create an unauditable source-of-truth fork.
