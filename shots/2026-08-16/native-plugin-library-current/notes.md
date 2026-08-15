# Native plugin and skill library

## New scope and discovered loss

The ReactLynx renderer already implemented `/plugins`, but the desktop shell
did not map `synara://plugins` into memory history and the Native sidebar has no
Plugins entry. The screen was therefore implemented but unreachable through
the standard Native cold-start/deep-link product path.

- `native-plugin-library-deep-link-reachability`: P1 contribution
  `1.00 -> 0.00`.

The desktop parser now maps `synara://plugins` to `/plugins`, covered by the
shell route regression test.

## Exact-owned validation

- Isolated canonical server: `127.0.0.1:58090`
- Exact-owned `@lynx-js/lynxtron@0.0.9-dev` diagnostic host
- PID-derived DevTool client: `localhost:8901`, session `1`
- Session URL:
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`
- Startup deep link: `synara://plugins`
- Viewport/theme: `1280x820`, light

The deep link opened `PluginLibraryPage` directly:

- page `1024x820` at `x=256`;
- header `1024x46`;
- content rail `860px` at `x=338`;
- title rail `812px` at `(362,86)`, `28px/36px`;
- skill rows form the canonical two-column grid; first row starts at
  `(362,212)` with a `405x70` outer cell.

## Provider and tab interaction

Codex Plugins initially produced a real environment error:
`Codex CLI version check failed. Error: codex not found in PATH`. That is a
missing CLI in this server process, not a Native UI regression.

Real Native touches then exercised:

1. Claude provider:
   - title changed to `Make Claude work your way`;
   - Plugins rendered the canonical
     `Plugins are unavailable for Claude.` unsupported state.
2. Skills tab:
   - Claude discovery returned 118 real skill rows;
   - no unsupported/error state remained;
   - the two-column row geometry matched the prior Web authority.

The exact-client warning/error console stayed empty. No plugin, skill, provider,
or settings mutation was performed.

## Verification

- Shell route focused test: `14/14`.
- Explicit Native/Desktop production build: passed.
- Exact-owned startup route and PID/session identity: passed.
- Claude Plugins unsupported state: passed.
- Claude Skills populated state: 118 rows.
- Product-loss contribution after reachability fix: `0.00`.
- No screenshot was added because the repository remains at the 100-image cap.

## Dark 1440 Claude Skills continuation

The exact-owned Native matrix was extended to dark theme at `1440x900` using
an isolated user directory whose only product KV override was
`synara:theme=dark`.

- root: `SliceRoot--theme-dark SliceRoot--viewport-wide`, `1440x900`;
- page/header/scroller: `(256,0,1184x900)`, `(256,0,1184x46)`,
  `(256,46,1184x854)`;
- centered content/title rails: `(418,46,860x4468)` and
  `(442,86,812x36)`;
- canvas/title tokens: `rgb(16,16,16)` and
  `rgb(252,252,252)`, title `28px/36px/600`;
- search surface: `(512,146,672x42)`, `rgb(19,19,19)`;
- Skills rows: 118 actual `PluginLibraryRow` nodes in the canonical two-column
  grid; first row `(442,212,405x70)`;
- first-row title/description/status:
  `(508,229,278x17)`, `(508,248,278x17)`, `(798,241,37x13)`;
  title `14px/500 rgb(252,252,252)`, description
  `12px/17px rgba(252,252,252,0.576471)`, enabled status
  `11px rgb(16,185,129)`.

Real rendered controls switched Codex -> Claude and Plugins -> Skills through
`Input.emulateTouchFromMouseEvent`. Desktop LynxView does not implement
`Input.dispatchTouchEvent`; that rejected probe was a harness API mismatch and
did not change product state. The final exact-client warning/error console was
empty.

`native-plugin-library-claude-skills-dark-1440`: missing coverage
`1.00 -> 0.00`; product-loss contribution remains `0.00 -> 0.00`. No new
P0/P1/P2 product loss was found.

The per-loop browser lifecycle gate passed before cleanup:
`bun run browser:cleanup` reported zero owned browser processes and
`agent-browser session list --json` reported `sessions: []`.
