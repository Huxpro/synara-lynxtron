# Current-head populated Profile plugin/agent proof

## Isolated canonical state

- Date: 2026-08-06.
- Owned server: `127.0.0.1:60465`.
- Trusted shared origin: `http://localhost:8921`.
- Retained Browser cell: `1440x900`, DPR 1, light / comfortable.
- Baseline SQLite main-file SHA-256:
  `cd3e1e9efe5d373efd3271338eb504f94f98f5aea24a7b3df43acbb9d5e06710`.
- Lynx-for-Web bundle SHA-256:
  `70d297299d041814dcee9d01707b2d7be17c4a88dc9dfcb2fb8664567ea8a023`.
- Native bundle SHA-256:
  `ff4f27e32235304e79446612bc0950dc583be926dd20524d7d23e71764956ca3`.

The server ran from a byte-cloned disposable home. One canonical thread and
three canonical user-originated turns were created:

- two turns with structured skill
  `{ name: "check-code", path: "/skills/check-code/SKILL.md" }`;
- one turn with structured mention
  `{ name: "reviewer-agent", path: "plugin://reviewer-agent" }`.

`stats.getProfileStats` returned:

- `$check-code`, kind `skill`, 2 runs;
- `@reviewer-agent`, kind `agent`, 1 run;
- 2 skills explored / 3 total uses.

The isolated environment had no executable Codex CLI. Provider delivery failed
after the canonical turn-start events were accepted. Profile statistics
correctly consume those durable user-originated events and structured
references; no SQLite fixture was written.

The entire mutated server clone and separate Native user-data clone were
deleted after capture. Normal SQLite/settings/KV/window hashes never changed.

## Finding and repair

The previous Profile batch had an empty Most used plugins column. Source
inspection and the real populated state exposed a visible icon-identity fork:

- Web uses the exact central `building-blocks` glyph for skills and `agent`
  graph glyph for agent mentions;
- Lynx rendered generic `S` and `A` letters.

Lynx now imports the exact central SVG assets through a dedicated central-icon
alias and theme-colorizes them inside the existing 20px muted shell. The glyph
slot is the Web authority's exact 12px square. No generic user or approximate
Tabler icon was substituted.

## Browser geometry

Both rows are exact between Web and Lynx-for-Web:

| Anchor | Web | Lynx-for-Web |
| --- | --- | --- |
| Row 1 | `872/574.546875/336/20` | `872/574.5/336/20` |
| Row 2 | `872/604.546875/336/20` | `872/604.5/336/20` |
| Row pitch | `30px` | exact |
| Icon shell | `20x20` | exact |
| Glyph | `12x12`, inset 4px | exact |
| Name origin | x `902` | exact |
| Count right edge | x `1208` | exact |
| Typography | `14/20` names and counts | exact |

Web sizes the left identity to intrinsic text, while Lynx lets the identity
flex through the remaining row width before the right-aligned count. The visible
icon/name origin, truncation owner, count edge, row size, and rhythm match.

Both Browser PNGs are exactly `1440x900`; both page-error files are empty.

## Native

- Exact-owned root PID: `44793`.
- PID-derived DevTool client: `localhost:8903`, session 1.
- Session URL:
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`.
- Native root: `1440x868`; raw PNG: `2880x1736`.
- First plugin row: `872/575/336/20`.
- Identity: `872/575/282/20`.
- Icon shell: `872/575/20/20`.
- Exact glyph: `876/579/12/12`.
- Name: x `902`, height `20`.
- Count: right edge x `1208`, height `20`.
- Warning/error console: empty.

`SettingsProfileList` is reused by both Profile columns, so the helper's generic
`list` role resolves the first list instance. It is not used as a plugin-list
claim. The plugin row, identity, icon, glyph, name, and count roles directly
lock the populated row.

## Cleanup and gates

- Disposable server and Native clones removed.
- Owned server, Native process, DevTool client, and named browser sessions
  exited.
- Main SQLite/settings/KV/window hashes remained byte-exact.
- Profile focused suite: 1 file, 3/3.
- Profile + Integrations regression set: 3 files, 11/11.
- Web production build: pass, 8,943 modules.
- Configured Lynx-for-Web production build: pass.
- Configured Native/Desktop production build: pass with only existing CSS and
  optional `ws` native-module warnings.
- Reuse baseline regenerated and strict check passed; Settings remains 53.91%.
- Style strict: pass, 98.07%.
- Native capture helper: 4/4.
- `git diff --check`: pass.
- `bun fmt`, `bun lint`, and `bun typecheck` were not run because the current
  conversation does not authorize those heavyweight checks.
