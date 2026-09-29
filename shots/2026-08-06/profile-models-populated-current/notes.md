# Current-head populated Profile model-usage proof

## Honest isolated state

- Date: 2026-08-06.
- Web authority and Lynx-for-Web shared trusted
  `http://localhost:8921` origin.
- Owned server: `127.0.0.1:60463`.
- The server home was a byte-clone of `.p10-view`; the baseline SQLite main
  file SHA-256 was
  `cd3e1e9efe5d373efd3271338eb504f94f98f5aea24a7b3df43acbb9d5e06710`.
- Lynx-for-Web bundle SHA-256:
  `323648d93f01f34ea53b9fec07f0d05b1dbf9fb0eeba9d4a9dbf71bfc239b492`.
- Native bundle SHA-256:
  `2b0aac943e3f3ccda326d97d0b13138d238c4cda57f4eb316fb8df695db0ab14`.

The populated state was generated through canonical product commands:

1. one `thread.create`;
2. two `thread.turn.start` commands using `gpt-5.6-sol`;
3. one `thread.turn.start` command using `gpt-5.5`.

`stats.getProfileStats` returned the real model rows:

- `gpt-5.6-sol`: 2 turns / 66.7%;
- `gpt-5.5`: 1 turn / 33.3%.

The isolated environment intentionally had no executable Codex CLI. Provider
delivery failed after the turn-start events were durably accepted, and later
turns were quarantined from provider delivery. This does not invalidate the
Profile state: the Profile contract counts canonical user-originated
`thread.turn-start-requested` events, and the stats RPC returned the expected
2:1 rows. No data was inserted directly into SQLite.

The entire mutated server clone and its separate Native user-data clone were
deleted after capture. The normal `.p10-view` SQLite/settings and
`.p10-view-native` KV/window hashes remained byte-exact throughout.

## Retained matrix cell

The initial 1280x820 diagnostic frame placed Model usage below the viewport and
was rejected as visual evidence. The retained cell is the standard natural
`1440x900`, DPR 1, light / comfortable matrix coordinate. Both Browser clients
have `scrollTop=0`; no scrolling or hidden state injection is required.

- Web and Lynx-for-Web PNGs: exactly `1440x900`.
- Native outer window: `1440x900`.
- Native logical root: `1440x868`.
- Native PNG: exactly `2880x1736`.
- Browser page-error files: empty.
- Native warning/error console: empty.

## Geometry

The two-column owner is exact between Web and Lynx-for-Web:

| Anchor                 | Web                     | Lynx-for-Web       |
| ---------------------- | ----------------------- | ------------------ |
| First model item       | `488/834.546875/336/30` | `488/834.5/336/30` |
| Second model item      | `872/834.546875/336/30` | `872/834.5/336/30` |
| Line                   | `336x20`                | exact              |
| Provider icon          | `14x14`, y `837.546875` | `14x14`, y `837.5` |
| Track                  | `336x4`, y `860.546875` | `336x4`, y `860.5` |
| Column gap             | `48px`                  | exact              |
| Item line-to-track gap | `6px`                   | exact              |

Web sizes identity content to its text. Lynx lets the identity flex through the
available line before the right-aligned percentage. Both preserve the same
icon/name origin, right edge, percentage owner, truncation contract, and track
geometry. The small percentage-text width difference is font rasterization,
not a layout residual.

Exact-owned Native:

- root PID `5771`;
- PID-derived `localhost:8904`, session 1;
- session URL:
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`;
- section `488/803/720/62`;
- models owner `488/835/720/30`;
- first model `488/835/336/30`;
- line `336x20`;
- name starts at x `510`;
- percentage right edge x `824`;
- track `488/861/336/4`;
- console message count `0`.

The retained screenshots visibly include both model names, both percentages,
and both progress tracks.

## Disposition

No product patch was needed. The current owner already matches Web's two-column
grid, 14px provider icon, 8px icon/name gap, 14/20 model and percentage copy,
6px line/track rhythm, and 4px track.

This evidence replaces the previous source-only populated-model claim without
creating CSS churn.

## Gates

- Web production build: pass, 8,943 modules.
- Configured Lynx-for-Web production build: pass.
- Configured Native/Desktop production build: pass with only the existing
  unsupported CSS and optional `ws` native-module warnings.
- `git diff --check`: pass.
- `bun fmt`, `bun lint`, and `bun typecheck` were not run because the current
  conversation does not authorize those heavyweight checks.
