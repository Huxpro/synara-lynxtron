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
  `c83ec3f6d45b242a5c58c875034fc621d62f9869dfffb78b6a49c43c275cff86`;
- Web build graph:
  `e8ee84e5973c1c4ad1a2c77d3282fa25b9db525506f65e56171d252c77f50c11`;
- Lynx-for-Web bundle:
  `3f3920f9a70af1c44c55adbed5d2a4c14cca00ca238913e25f6d178157298fb4`.

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

### Open residuals

- `settings-general-select-control-optics` (`P1`): Lynx select trigger remains
  narrower, more transparent, and less rounded than Web. This belongs to the
  surface/material and optical-control phases.
- `settings-general-card-terminal-divider` (`P2`): Lynx gives the final row a
  bottom divider, making a two-row card one pixel taller. This needs an explicit
  terminal-row separator contract rather than a fragile structural selector.

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
