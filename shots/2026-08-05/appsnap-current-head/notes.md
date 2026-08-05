# Current-head AppSnap capability-row proof

AppSnap remains honestly unavailable in Lynxtron because the screen-capture,
permission, and global-shortcut host bridges do not exist. This slice preserves
that boundary while aligning the shared row anatomy.

## Residual

`Unavailable in this runtime` lived inside the Enable copy column, making the
disabled switch center against the status block (`y=337`) instead of Web's
common title/description layout (`y=325`). All Capture rows also used fixed
minimum heights and following-row top dividers.

## Repair

- Enable uses `SettingsAppSnapMain` for title/description + disabled switch.
- Supplemental unavailable status follows in metadata at 11/16.5.
- Every row uses a 20px title line.
- Rows are content-driven.
- Separators belong to the preceding row's bottom, matching Web `divide-y`.

Final Enable anchors match Web exactly:

- row `457/305/622/81.5`;
- main `469/315/598/40`;
- title `469/316`, 12/18/500;
- description `469/337`, 12/18/400;
- disabled switch `1035/325/32/20`;
- status `469/359/598/16.5`.

Shortcut, Destination, and Capture sound rows also retain their Web bounds
through content rather than hard-coded minima.

## Evidence and gates

- Web authority, Lynx before, and Lynx final frames are retained here.
- All PNGs are exactly `1280x820`; page errors were empty.
- Focused AppSnap suite: 1 file, 2/2 passed.
- Lynx-for-Web and Native/Desktop builds passed.
- Bundles: Lynx-for-Web `526cf88a…`; Native `0528a538…`.
- `bun fmt`, `bun lint`, and `bun typecheck` remain unauthorized.
