# Settings sidebar seam current-head fidelity

- Date: 2026-08-07
- Runtime: current Lynx-for-Web and exact-owned Native production bundles.
- Viewport: `1280x820`; Lynx-for-Web DPR `1`, Native DPR `2`.
- Theme/density: light / comfortable.

## Failure

Web Settings renders inside the same borderless `256px` outer sidebar shell as
the main thread navigation. Lynx instead painted `border-right: 1px` on its
private `.SettingsSidebar`.

That authored border reduced the Settings navigation rail by one pixel:

- Back/search/navigation rows used `243px` instead of Web's `244px`;
- the sidebar content box used `255px` instead of `256px`.

The difference had been registered as a separator boundary, but it shared the
same incorrect owner as the thread sidebar seam fixed immediately before this
slice.

## Fix

`.SettingsSidebar` no longer paints its own right border. The surrounding
`SidebarDisclosure` still owns the fixed `256px` column and the Settings page
continues at `x=256`.

## Geometry

Lynx-for-Web after a real Settings-row click:

- Settings sidebar/body/inner outer box: `256px`;
- Back button: `x=6`, width `244px`;
- Search region: `x=6`, width `244px`;
- search shell/input-control border: `x=10`, width `236px`;
- input-control content rail: `234px`;
- Settings page/content: `x=256`, width `1024px`;
- sidebar computed `border-right: 0`.

Exact-owned Native after supported touch on the real Settings footer row:

- Settings sidebar/body: `256px`;
- body inner border box: `256px`, content rail `244px`;
- Back button border: `x=6..250`, width `244px`;
- Search region border: `x=6..250`, width `244px`;
- search shell: `x=10..246`, width `236px`;
- Settings page/content: `x=256..1280`, width `1024px`;
- computed `border-right-width: 0px`;
- warning/error console is empty.

The Native run used isolated server `58128`, isolated
`SYNARA_LYNX_USER_DATA_DIR`, PID `73207`, and PID-derived
`localhost:8901/session 1`. Its session URL was the exact staged
`apps/lynx/dist/desktop/main.lynx.bundle`.

## Verification

- Desktop titlebar + Settings sidebar focused Rstest: `2 files / 8 tests`;
- Lynx-for-Web production build: pass;
- Native/Desktop production build: pass;
- browser page errors: empty;
- Native warning/error console: empty.

Artifacts:

- `lynx.json`, `lynx-search.json`, `lynx.png`;
- `native-boxes.json`, `native-search-boxes.json`;
- `native-sidebar-style.json`, `native-nodes.json`, `native-runtime.json`;
- `native-session.json`, `native.jpg`, `native-console.json`;
- `errors.txt`, `console.txt`, `bundle-hashes.txt`.
