# Current-head Advanced disclosure proof

## Residual

Advanced used custom rows that placed keybindings/recovery metadata inside the
main copy column. Buttons were centered against the entire metadata/disclosure
stack, generic Lynx xs chrome rendered at 25px instead of Web's 24px, and the
recovery trigger/details used 20px/18px line boxes instead of Web's 16px.

## Repair

Both rows now follow the shared Settings ownership:

- `SettingsAdvancedMain`: title/description plus action;
- `SettingsAdvancedMetadata`: keybindings path/status or recovery status;
- recovery disclosure after metadata;
- 24px xs actions with 10/15 labels;
- 16px trigger and chevron;
- inset details copy at 12/16.

Closed-state geometry is exact:

- Keybindings row `457/151/622/102`;
- Keybindings main `469/161/598/40`;
- Open file `1006.56/169/60.44/24`;
- Recovery row `457/253/622/139.5`;
- Recovery main `469/263/598/58`;
- Repair state `991.73/280/75.27/24`;
- Status `469/321/598/20.5`;
- Disclosure `469/353.5/598/29`;
- Trigger `469/366.5/598/16`.

## Interaction proof

- Rendered `What this does` changed `aria-expanded` to true.
- Chevron rotated 90 degrees.
- Open details used `LynxDisclosureEnter` and matched Web at
  `469/394.5/598/42`, padding 12, radius 10, copy 12/16.
- After rendered close, details stayed mounted with closed motion and
  `aria-hidden=true` during the 220ms exit, then unmounted.

## Evidence and gates

- Web closed/open and Lynx before/final closed/open frames are retained here.
- All PNGs are exactly `1280x820`; page errors were empty.
- Focused Advanced suite: 1 file, 3/3 passed.
- Lynx-for-Web and Native/Desktop builds passed.
- Final bundles: Lynx-for-Web `66c60353…`; Native `9464303d…`.
- `bun fmt`, `bun lint`, and `bun typecheck` remain unauthorized.
