# P10 typography calibration

Status: complete

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

| Role                     | Before                                        | After                                                                         |
| ------------------------ | --------------------------------------------- | ----------------------------------------------------------------------------- |
| Settings row title       | Lynx `13px/500/18px`; Web `12px/500/18px`     | both `12px/500/18px`                                                          |
| Settings row description | Lynx `12px/400/17px`; Web `12px/400/18px`     | both `12px/400/18px`                                                          |
| Settings section label   | Lynx `12px/500/18px` at full muted color      | both `12px/400/18px`; Lynx uses the canonical `0.58` opacity                  |
| Settings header title    | Lynx omitted tracking                         | both `20px/500/28px/-0.5px`                                                   |
| Settings shell rail      | Lynx sidebar `250px`, content anchors `x=453` | sidebar `256px`; header/section/card/row anchors match Web at `x=456/457/469` |

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

## Final route-wide certification

The post-fix final matrix retains Landing, Thread, Settings General, project
Kanban, and Pull Requests in light/dark at 1280×820 and 1440×900. Project
Picker, Extras, Command K, filtered skill, and filtered mention menus use the
same two-theme/two-size matrix.

This closes the remaining role inventory:

- route/page title and body/transcript roles are measured on Thread, Kanban,
  and Pull Requests;
- status/meta and loading/error roles are current-build tested and represented
  by the system-state specimen contract;
- button/control labels are retained on Settings, route actions, menus, and
  command rows;
- semantic chip/token typography is retained in the P10 specimen atlas:
  Native 142×24 and Lynx-for-Web 143.84×23 inside the unchanged 708×39 editor
  rail;
- Native font fallback, weight mapping, baseline, wrapping, and truncation are
  represented in current-build Native evidence.

Strict verification reports **44 states / 0 incomplete / 0 blocking** and
**15 controls / 12 temporal surfaces / 0 incomplete**. No open P0/P1
typography residual remains.

## Project Picker measurement

The unselected New Chat Project Picker now has retained Web and Lynx-for-Web
evidence at light/comfortable `1280×820`, DPR 1. The capture uses the same
directory list, open state, and online-backup snapshot
`391f0871debfa1bc5493fd40d22f792036f219ef7e86db7c28a613727c1c7469`.

Closed root causes:

- Landing Lynx omitted the explicit top placement used by Web.
- The Lynx tray omitted the Web 8px content inset.
- The Lynx panel filled the 286px popup interior instead of the 278px inset
  panel rail.
- Option text used an implicit 11px/13px line box instead of 12px/18px.
- Generated SVG inline size kept icons at 16px despite smaller CSS boxes.
- Project options bypassed shared Menu registration, so the first enabled item
  did not receive the default keyboard highlight.

Post-fix popup, panel, search, group, option, footer, and action geometry is
exact. The option title rail differs by 1px, within the baseline contract.
Project options now reuse `MenuItem`, preserving visual order, default
highlight, activation, and Escape behavior without entering Native shortcut or
general keyboard repair.

The Browser custom-element inner `x-input` still reports a zero-sized box. Its
visible search shell is measurable and aligned; actual input metrics remain a
Native certification item.

## Filtered skill-menu measurement

The `$review-agent` state was created through the rendered Composer editors.
The Lynx-for-Web harness required one `$` keyboard event followed by one text
input event because rapid per-key automation drops events in the custom
textarea. The retained value was verified as exactly `$review-agent` before
capture; no DOM value was assigned.

Both clients return exactly:

1. `review-agent`;
2. `review-bugbot`;
3. `review-security`;
4. `review`.

The 726×122 surface, 716×28 active row, 16px icon slot, 14px painted icon, and
title/description/meta rails now match in X and size. Their common Y delta is
the already measured landing offset of `-0.75px`. Typography resolves to:

- title `11.5px/500/16px`;
- description `11px/400/16px`;
- meta `10.5px/400/15px`.

The frame uses the Web-authority 14px radius and no elevated shadow. Muted
description/meta opacity and active icon opacity are state-specific and live in
the command-menu primitive rather than feature call sites.

## Native default calibration

The first exact-owned Native batch exposed two engine-specific P1 residuals
that were invisible in Lynx-for-Web:

- generated Native theme variables resolved semantic UI and Composer roles to
  the theme's 14px base, so project labels and the textarea were too large;
- Lynxtron did not honor the Browser system-font fallback for the 30px landing
  heading, producing a 351px glyph box instead of Web's 320.36px.

The corrections are named and centralized:

- `.SliceRoot` pins Native semantic product roles to 12/11/10px while Browser
  Web keeps the configurable app-font token path;
- the landing heading uses a Native `-1.8px` metric correction in a stable
  `321px` text box;
- the Lynx-for-Web host explicitly restores Web's `-0.45px` tracking.

Final retained metrics:

- Web hero: `320.359×34.5`;
- Lynx-for-Web hero: `321×35`, one line;
- Native hero: `321×35`;
- project label: `12px/400/18px`;
- Composer textarea: `12px/19.5px`.

The default landing/sidebar/composer cells were captured from one frozen
isolated snapshot,
`11f29ffcbed5d33ead21bb95e8d58ff9e1fd68932622cafb81598308af4da08e`.
The owned server was briefly `SIGSTOP`'d only during the three-client capture
window and immediately resumed, preventing background operational writes from
invalidating snapshot identity.

## Native filtered skill-menu certification

The final filtered menu extends the Browser typography calibration to
exact-owned Native:

- title `11.5px/500/16px`;
- description `11px/400/16px`;
- meta `10.5px/400/15px`;
- Native textarea `12px/19.5px`;
- 16px icon slot with 14px painted icon bounds.

Native engine glyph widths differ slightly from Browser system-font metrics
(`review-agent` 77px Native versus 73.52px Web), but the row, icon rail,
description rail, meta rail, and 726×122/716×28 frame anatomy remain stable.
This is measured engine text rasterization, not a layout-owner split. No local
text margin or feature-level optical offset was added.

The retained state uses snapshot `c3703ba8…`, Native bundle `ac5bff5b…`, and
empty fresh consoles on all three clients.
