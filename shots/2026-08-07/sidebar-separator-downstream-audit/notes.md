# Sidebar separator downstream closure

- Date: 2026-08-07
- Runtime: current Lynx-for-Web and exact-owned Native production bundles.
- Viewport: `1280x820`.

## Purpose

Historical current-head reports retained two one-pixel differences as a
"registered sidebar separator boundary":

- primary navigation rows were one pixel narrower than Web;
- the Project Sort popup was one pixel left of Electron.

The shared sidebar seam fix removed the authored border that caused both
differences. This audit verifies the downstream consumers rather than adding
another local offset.

## Results

Lynx-for-Web:

- sidebar: `256px`;
- primary rows: `x=6`, width `244px`;
- Settings row: `x=8`, width `240px`;
- Sort anchor: `x=198`, width `20px`;
- Sort popup: `x=42`, width `176px`, height `192px`.

Exact-owned Native:

- Sort anchor: `x=198..218`;
- supported touch opened the real popup;
- popup border: `x=42..218`, `y=282..474`, exactly `176x192`;
- warning/error console is empty.

The previous Native popup was `x=41`; Electron authority is `x=42`. The
current popup now matches without any popup-specific correction. The primary
row width similarly matches Web through the shared shell owner.

The Native run used PID `83655`, PID-derived `localhost:8901/session 1`, and
the exact staged `apps/lynx/dist/desktop/main.lynx.bundle`. No sort preference
was changed.

## Integrity

- Lynx-for-Web pointer click did not publish the custom Menu activation event,
  so it was rejected as interaction proof. A rendered-element click was used
  only to set up the geometry diagnostic; real Native touch remains the
  interaction evidence.
- browser errors are empty;
- Native warning/error console is empty;
- owned browser/server/static/Native processes and isolated state were removed.

Artifacts:

- `lynx.json`, `lynx.png`, `errors.txt`, `console.txt`;
- `native-popup.json`, `native-runtime.json`, `native.jpg`,
  `native-console.json`.
