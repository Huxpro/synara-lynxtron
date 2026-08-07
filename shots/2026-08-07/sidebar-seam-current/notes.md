# Sidebar seam current-head fidelity

- Date: 2026-08-07
- Runtime: current Lynx-for-Web and exact-owned Native production bundles.
- Viewport: `1280x820`; Lynx-for-Web DPR `1`, Native DPR `2`.
- Theme/density: light / comfortable.

## Failure

Web deliberately leaves the thread sidebar surface borderless. Its outer
desktop shell owns the fixed `256px` layout width, while the chat content card
owns the visible seam.

Lynx painted `border-right: 1px` on `.AppSidebar` itself. With border-box
layout, that reduced every sidebar consumer by one pixel:

- sidebar content/footer: `255px`;
- New thread/Search rows: `243px`;
- Settings row: `239px`.

This had been registered as an engine boundary, but it was an authored
ownership mismatch rather than an engine limitation.

## Fix

`.AppSidebar` no longer paints a right border. The shared shell still owns the
fixed `256px` column and main content still starts at `x=256`; no layout width,
motion, or interaction ownership changed.

## Geometry

Lynx-for-Web:

- `.AppSidebar`: `256x820`, `border-right: 0`;
- `.AppSidebarFooter`: `256x44`;
- New thread/Search and other primary rows: `244x28`;
- Settings row: `240x28`;
- main column: `x=256`, width `1024`;
- pixels `x=253..259` are continuous with no blank seam.

Exact-owned Native:

- `.AppSidebar` border/content quad: `0..256`, width `256`;
- primary row border quad: `6..250`, width `244`;
- Settings row border quad: `8..248`, width `240`;
- `.AppMain`: `256..1280`, width `1024`;
- computed `border-right-width: 0px`;
- warning/error console is empty.

The Native run used isolated server `58127`, isolated
`SYNARA_LYNX_USER_DATA_DIR`, PID `49722`, and PID-derived
`localhost:8901/session 1`. Its session URL was the exact staged
`apps/lynx/dist/desktop/main.lynx.bundle`.

One initial DevTool target choice selected a concurrently launched t3code
client on `localhost:8902`. The session URL gate rejected it before any product
claim; no t3code artifact is retained and that unrelated process was not
stopped.

After the owned Synara process exited, a later t3code process reused
`localhost:8901`; its PID, launch time, and cwd identified it as unrelated, so
it was also left untouched. Owned server/static ports, browser session, and
isolated state were removed.

## Verification

- Sidebar primary navigation + disclosure focused Rstest: `2 files / 5 tests`;
- Lynx-for-Web production build: pass;
- Native/Desktop production build: pass;
- browser page errors: empty;
- Native warning/error console: empty.

Artifacts:

- `lynx.json`, `lynx.png`, `seam.json`;
- `native-boxes.json`, `native-sidebar-style.json`, `native-nodes.json`;
- `native-session.json`, `native.jpg`, `native-console.json`;
- `errors.txt`, `console.txt`, `bundle-hashes.txt`.
