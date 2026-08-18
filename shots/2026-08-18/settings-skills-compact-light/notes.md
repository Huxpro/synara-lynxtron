# Settings Skills Compact Light

## Classification

- New scope: Settings Skills × real populated catalog × provider update prompt
  × light × `375x700` × compact responsive layout.
- P2 product loss:
  `settings-skills-compact-populated-layout`, `1.00 -> 0.00`.
- P2 product loss:
  `provider-update-prompt-compact-actions`, `1.00 -> 0.00`.
- Intentional Native platform delta:
  `native-compact-window-minimum`, `1.00 -> 1.00`.

No loss weight, sample filter, or scope reduction changed.

## Harness Identity

Web authority and Lynx-for-Web used:

- server:
  `ws://127.0.0.1:58090`;
- server instance:
  `cbfdb4e0-74c1-4df4-9d6f-7d6f358c6de1`;
- route:
  Settings Skills;
- real catalog:
  `116` grouped skills;
- light theme;
- viewport:
  `375x700`, DPR `1`;
- initial/final `adapt` state:
  enabled.

Both runtime and visual viewport dimensions matched the requested cell. Page
errors were empty.

## Discovery

The earlier responsive Settings audit covered section reachability and
horizontal overflow, but its isolated snapshot did not contain populated
Skills rows or the later global provider prompt.

The new real-data cell exposed three related compact losses.

### Provider Prompt

Web authority used:

- host:
  `343x126 @ (16,16)`;
- actions:
  `28px` high.

Lynx retained the wide layout:

- host:
  `343x122 @ (16,16)`;
- actions:
  `24px` high.

### Shared Settings Header

Web authority used a `16px` gap between header copy and Restore defaults.
Restore was `121.8125x28`; the copy column was `189.1875px`, so the section
description wrapped to three lines and the header resolved to `327x94`.

Lynx had no gap and a `72.75x24` Restore action. Its copy column was
`254.25px`, the description used only two lines, and all content started 20px
too early.

### Populated Skills Rows

Web compact Skills rows stack copy then control:

- row:
  `325x175.5`;
- main:
  `301x93`, column;
- switch:
  `40x24`, left aligned;
- metadata:
  full `301px` width.

Lynx retained the wide horizontal owner:

- row:
  `325x141.5`;
- copy:
  only `259px` wide;
- switch:
  `32x20`, right aligned.

The portable summary also kept its count beside the copy and forced the
portable path into one line, while Web stacks the count and allows the path to
wrap.

## Fix

The fixes stay with their actual owners:

- shared compact Settings header:
  `16px` copy/action gap and `121.8125x28` Restore action;
- compact provider prompt:
  `126px` surface and `28px` action row/buttons;
- populated Skills main/control modifiers:
  column layout, full-width copy/control, left-aligned `40x24` switch with a
  `20px` thumb;
- portable Skills modifier:
  stacked count and two-line path.

Wide layout selectors remain unchanged.

## Final Lynx-for-Web

Final geometry matched Web authority:

- header:
  `327x94 @ (24,32)`;
- Portable skills label:
  `327x26 @ (24,158)`;
- portable row:
  `325x177 @ (25,191)`;
- portable path:
  `301x33`, two lines;
- Shared skills label:
  `327x26 @ (24,401)`;
- `adapt` row:
  `325x175.5 @ (25,434)`;
- `adapt` switch:
  `40x24`, left aligned;
- provider prompt:
  `343x126 @ (16,16)`;
- prompt actions:
  `28px` high.

Relay diagnostics showed one connection attempt, socket state `1`,
`connect-attempt -> feature-open -> connect-success -> socket-owned`, zero
pending requests, no transport/RPC error, and the correct
`/settings/skills` renderer-ready route.

## Native Boundary And Regression

The Native shell creates `LynxWindow` with:

- `minWidth: 900`;
- `minHeight: 650`.

A `375px` Native window is therefore not a supported product state. The
compact cell is certified through Lynx-for-Web, while Native receives a
minimum-supported-width regression check rather than a fabricated undersized
window.

Final exact-owned Native regression:

- PID:
  `25909`;
- DevTool:
  `localhost:8902`, session `1`;
- bundle SHA-256:
  `326a6b750ec9c5cd1d042c5046e6ede2962f390c2a19a5db8d18166a8eb110aa`;
- route:
  `/settings/skills`;
- real `adapt` switch:
  `aria-checked=true`, accessible value `On`;
- expanded provider prompt:
  complete icon/copy/actions/dismiss anatomy;
- warning/error console:
  empty;
- server socket:
  established to `127.0.0.1:58090`.

## Verification

- focused Lynx tests:
  `3 files / 10 tests`;
- final Lynx-for-Web production build passed;
- final Lynx/Desktop production build and Sharp staging passed;
- compact Web/Lynx-for-Web geometry, screenshot, page-error, and relay checks
  passed;
- exact-owned Native minimum-width DOM/console/socket regression passed;
- no screenshots added; repository count remained `100`;
- temporary captures were deleted before commit;
- every failed or interrupted browser/probe command was followed by
  `browser:gate`.
