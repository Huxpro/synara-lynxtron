# ReactLynx toolchain upgrade and re-verification (2026-10-08)

Branch: `huxcc/lynx-toolchain-upgrade`. Evidence: [upgrade-evidence-2026-10-08/](upgrade-evidence-2026-10-08/) (numbers only, no screenshots).

## What changed

Lynxtron was already at its latest release, `0.0.28`. The ReactLynx build toolchain moved to the latest releases:

| Package                                       | From            | To               |
| --------------------------------------------- | --------------- | ---------------- |
| `@lynx-js/react`                              | 0.123.1         | 0.126.2          |
| `preact` (`@lynx-js/internal-preact`)         | 10.29.1         | 11.0.0-rc.1      |
| `@lynx-js/rspeedy`                            | 0.16.1          | 0.18.0           |
| `@lynx-js/react-rsbuild-plugin`               | 0.18.1          | 0.20.3           |
| `@lynx-js/types` / `@lynx-js/type-config`     | 4.1.0 / 4.1.1   | 4.3.0 / 4.2.0    |
| `@lynx-js/web-core` / `@lynx-js/web-elements` | 0.23.0 / 0.12.7 | 0.26.2 / 0.12.12 |
| `@lynx-js/lynx-ui`, `tailwind-preset`, others | —               | latest           |

Two things broke and were fixed:

- **Vendor patch.** Bun applied the 0.123.1 ReactLynx patch at its old line numbers and corrupted `spread.js`. The patch was regenerated against 0.126.2.
- **Zero BigInt constant.** The first build failed with `Decode error: Context construct failed`, then with a main-thread `TypeError` once the literal was rewritten to a bare `BigInt(0)` (Effect's Schema module binds its own `BigInt`). `scripts/zero-bigint-literal-loader.mjs` now rewrites `0n` to `globalThis.BigInt(0)` on the main-thread layer. Tracked in [#9](https://github.com/Huxpro/synara-lynxtron/issues/9).

## Verification on the upgraded build

| Check                                        | Result                                                                                                            |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `compare:desktop` certification              | Both renderers certified on the fixture thread, same backend, in all four configurations                          |
| Cell matrix, dark/light × 1280×820/1440×900  | **24/24 base cells, 28/28 state increments**; Electron page errors 0                                              |
| Native console during a cell run             | 0 errors, with both run probes captured (`cells-dark-1280-console.json`)                                          |
| J3 Explorer / Diff                           | 6/6 Electron, 6/6 Native                                                                                          |
| J4 Settings                                  | 6/6, 6/6                                                                                                          |
| J5 Automations                               | 4/4, 4/4                                                                                                          |
| J6 Kanban / PR                               | 5/5 Native; Electron 5/5 on rerun (first run timed out waiting for Codex `thread/start` under load)               |
| J1 new thread and real turns                 | Electron 6/6; **Native fails at its first real turn**                                                             |
| J2 long transcript                           | **Fails in both renderers** at its first real turn                                                                |
| Lynx Rstest suite                            | Same failures before and after the upgrade (26 files; [#10](https://github.com/Huxpro/synara-lynxtron/issues/10)) |
| Workspace `typecheck`, `lint`, `fmt --check` | Pass                                                                                                              |

J1 (Native) and J2 are not caused by the upgrade or by Lynx. After J1 finishes in Electron, the server stops appending provider runtime events for every thread, in both renderers; see [#8](https://github.com/Huxpro/synara-lynxtron/issues/8). This is the stall the N5 report recorded.

One increment (`add-panel-menu`) failed once with `The operation was aborted` in a later session and passed in the four matrix runs and four reruns.

## Computer Use

A background Computer Use pass was attempted and blocked before any interaction: the harness refused control of the comparison app without an interactive approval. Nothing took focus. The physical-input acceptance list is unchanged; see [#12](https://github.com/Huxpro/synara-lynxtron/issues/12).

## Harness fixes made along the way

- `comparison-cells.mjs` could never observe Native console errors: it parsed `get-console` output as JSON, and the DevTool gives the console backlog to the first reader only. It now reads once, between two probe errors, and reports "unavailable" unless both probes came back.
- Rstest no longer collects the `node:test` suites under `scripts/`; `bun run test:scripts` runs them (3 retained-evidence tests fail, [#11](https://github.com/Huxpro/synara-lynxtron/issues/11)).
- The workspace typecheck and lint pass again.
- `AGENTS.md` now describes the launcher-based loop instead of the manual preflight.
