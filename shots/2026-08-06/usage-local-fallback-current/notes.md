# Current-head local Usage fallback proof

## Real source and root cause

- Date: 2026-08-06.
- Owned server: `127.0.0.1:60466`.
- Trusted shared origin: `http://localhost:8921`.
- Retained Browser cell: `1440x900`, DPR 1, light / comfortable.
- Baseline SQLite main-file SHA-256:
  `cd3e1e9efe5d373efd3271338eb504f94f98f5aea24a7b3df43acbb9d5e06710`.
- Lynx-for-Web bundle SHA-256:
  `c4cae9b8eb72864491f9ff94cacbd0268c8a19f07368b9a380c97a1f978bd4fa`.
- Native bundle SHA-256:
  `be3d2c08edc6237580e524a6c79a82014c01655d0064b026a23cfefce61839fd`.

No usage fixture was written. Canonical RPCs read the user's existing local CLI
archives:

- Codex:
  - one real limit with 96% used / 4% remaining;
  - 427M tokens / 1 session in 24h;
  - 5B tokens / 20 sessions in 7d;
  - 101B tokens / 409 sessions in 30d.
- Claude:
  - 180M tokens / 5 sessions in 24h;
  - 1B tokens / 18 sessions in 7d;
  - 2B tokens / 65 sessions in 30d.

The live Codex, Claude, and Cursor endpoints were unreachable. Before this
slice, the batch usage pipeline treated the live error as authoritative and
discarded all real local usage, so Settings could render only Unavailable.

## Behavior repair

The server now owns one live/local merge:

- a successful live snapshot remains authoritative and is supplemented with
  local fields that live omitted;
- when live fetch fails but a local snapshot contains limits or lines, the
  local snapshot is returned as last-good `status: ok` data with an explicit
  warning:
  `Showing the latest usage recorded by the local CLI.`;
- when no local usage exists, the live error remains unchanged.

This exposes real data without pretending the provider endpoint succeeded.
Cursor therefore remains Unavailable.

The local Codex archive contained a stale `window: 5h` label paired with a real
10,080-minute duration. Shared display logic now treats duration as the
authoritative identity and renders `Weekly` in both clients.

## Visual repair and Browser geometry

The first populated comparison exposed accumulated Lynx line-box drift. The
fixed owners are:

- warning copy: 12px / 19.5px;
- meter and usage-line labels/values: 12px / 16px;
- meter metadata and usage subtitles: 11px / 16.5px.

After assigning those values to their semantic owners, Web and Lynx-for-Web
content anchors are exact:

| Anchor            | Web                  | Lynx-for-Web |
| ----------------- | -------------------- | ------------ |
| Warning           | `573/209/.../19.5`   | exact        |
| Weekly label      | `553/242.5/.../16`   | exact        |
| Track             | `553/264.5/590/8`    | exact        |
| 4% fill           | width `23.59375`     | exact        |
| 4% left           | `553/278.5/.../16.5` | exact        |
| 24h line          | y `322`, 12/16       | exact        |
| 24h subtitle      | y `340`, 11/16.5     | exact        |
| 7d line/subtitle  | y `362.5` / `380.5`  | exact        |
| 30d line/subtitle | y `403` / `421`      | exact        |

Web's inner card is `622x302.5`; Lynx's bordered card is `624x304.5`.
Both retained Browser PNGs are exactly `1440x900`, and both page-error files
are empty.

The Web initial query displayed placeholders after a transient first request.
Its rendered Refresh button executed the canonical `{ forceRefresh: true }`
path and recovered the same real Codex/Claude data. That recovery is retained
as behavior evidence rather than hidden with a reload.

## Native

- Exact-owned root PID: `70562`.
- PID-derived DevTool client: `localhost:8904`, session 1.
- Session URL:
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`.
- Native root: `1440x868`; raw PNG: `2880x1736`.
- Usage content owner: `536/118/624/746`.
- Codex card: `536/150/624/307`.
- Warning: `553/209/590/20`.
- Weekly limit: `553/243/590/53`.
- Track: `553/265/590/8`.
- Fill: `24x8`.
- Usage lines: `553/310/590/130`.
- Warning/error console: empty.

Native integer rounding preserves the same semantic intervals and full visible
warning, meter, token-history rows, Claude local history, and Cursor error.

## Cleanup and gates

- Disposable server and Native clones removed.
- Owned server, Native process, DevTool client, and named browser sessions
  exited.
- Main SQLite/settings/KV/window hashes remained byte-exact.
- Server live/local merge: 1 file, 3/3.
- Shared usage display: 1 file, 6/6.
- Web usage summary/display regressions: 4 files, 15/15.
- Lynx Usage/Settings contracts: 1 file, 6/6.
- Web production build: pass, 8,943 modules.
- Configured Lynx-for-Web production build: pass.
- Configured Native/Desktop production build: pass with only existing CSS and
  optional `ws` native-module warnings.
- `git diff --check`: pass.
- `bun fmt`, `bun lint`, and `bun typecheck` were not run because the current
  conversation does not authorize those heavyweight checks.
