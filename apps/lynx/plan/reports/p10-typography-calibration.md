# P10 typography calibration

Status: Phase 1 in progress; Settings General Browser slice retained

Updated: 2026-08-04

## Contract

Product typography is expressed as semantic visual roles in
`apps/web/src/tokens.css`. Web and Lynx adapters consume the same explicit size,
line-height, and letter-spacing values so neither engine can fall back to
`normal` for a retained role.

Current roles cover:

1. UI row;
2. UI supporting text;
3. UI meta text;
4. Composer body and placeholder;
5. picker group label;
6. picker row title;
7. picker description;
8. picker trailing meta;
9. Settings panel header title and description;
10. Settings section label and row title/description.

The remaining P10 role inventory still needs retained evidence for route/page
titles, transcript body/status/work rows, buttons, and selected chips/tokens.

## Settings General measurement

Retained cell:

- semantic route: `settings-general`;
- clients: Web and Lynx-for-Web;
- theme: light;
- density: comfortable;
- viewport: `1280×820`;
- DPR: `1`;
- online-backup snapshot:
  `cbbbc86e25eb95ef23c456c9b8cf81a1caf667100f139999c91e0405383f2b0c`;
- Web build graph:
  `47343fc6d5d12b5c990a88948055cefa7293ba0867cd0beb66542fd8e3cf161a`;
- Lynx-for-Web bundle:
  `7790c0881f2319a61a7a62006231de54804ce1dfbc7ee332dec1b37fc9cf74f9`.

The product state was reached through the real Settings navigation. The light
theme was selected through the real Appearance control. The isolated project
was created through the real Create project dialog; SQLite was read only for
online-backup identity and projection verification.

### Closed residuals

| Role | Before | After |
| --- | --- | --- |
| Settings row title | Lynx `13px/500/18px`; Web `12px/500/18px` | both `12px/500/18px` |
| Settings row description | Lynx `12px/400/17px`; Web `12px/400/18px` | both `12px/400/18px` |
| Settings section label | Lynx `12px/500/18px` at full muted color | both `12px/400/18px`; Lynx uses the canonical `0.58` opacity |
| Settings header title | Lynx omitted tracking | both `20px/500/28px/-0.5px` |
| Settings shell rail | Lynx sidebar `250px`, content anchors `x=453` | sidebar `256px`; header/section/card/row anchors match Web at `x=456/457/469` |

No local text margin was added. The fixes live in semantic tokens, shared
Settings adapters, and the Settings shell owner.

### Material and control closure

- The shared General select now matches Web at `176×32`, radius `10px`, opaque
  control background, 1px 7% border, `12px/18px` label, and a `12×12` chevron
  at the same coordinates and 50% opacity.
- Git writing-model selects reuse the same material/anatomy with their
  intentional `208px` width.
- Physical-shared composition marks the terminal row explicitly. Lynx removes
  its divider and uses the Web-authority `60px` terminal-row height, so the
  two-row card is exactly `624×123` in both clients.

## Evidence

`shots/2026-08-04/p10-perceptual-fidelity/browser/settings-general/` contains,
for both Browser clients:

- `raw.png` (`1280×820`);
- `comparison.png` (`1280×788`);
- `geometry.json`;
- `styles.json`;
- empty fresh page-error `console.txt`.

The residual manifest now supports a state-specific snapshot hash while still
requiring every retained client in that state to match it. Verifier regression
tests cover both a valid later capture and client drift within that capture.

## Remaining Phase 1 work

Phase 1 is not complete until:

- Project Picker and filtered skill-menu typography are retained from
  like-for-like states;
- route/thread/transcript/status/button/chip roles are measured;
- light/dark and both target sizes are covered;
- Native font fallback, weight mapping, baseline, wrapping, and truncation are
  certified;
- no open P0/P1 typography residual remains.
