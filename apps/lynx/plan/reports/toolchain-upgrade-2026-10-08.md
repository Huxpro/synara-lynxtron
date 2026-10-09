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

A background Computer Use pass was attempted and blocked before any interaction: the harness refused control of the comparison app without an interactive approval. Nothing took focus. The physical-input acceptance list is unchanged; see [#12](https://github.com/Huxpro/synara-lynxtron/issues/12). A second attempt from Claude Desktop is recorded under "Acceptance follow-up" below.

## Harness fixes made along the way

- `comparison-cells.mjs` could never observe Native console errors: it parsed `get-console` output as JSON, and the DevTool gives the console backlog to the first reader only. It now reads once, between two probe errors, and reports "unavailable" unless both probes came back.
- Rstest no longer collects the `node:test` suites under `scripts/`; `bun run test:scripts` runs them (3 retained-evidence tests fail, [#11](https://github.com/Huxpro/synara-lynxtron/issues/11)).
- The workspace typecheck and lint pass again.
- `AGENTS.md` now describes the launcher-based loop instead of the manual preflight.

## Acceptance follow-up (2026-10-09 UTC)

Branch: `huxcc/provider-event-stall-fix`. Certified runs: `2026-10-09T00-02-29-426Z-56424` and `2026-10-09T00-08-11-403Z-86776` (reproduction, provider event logging on), `2026-10-09T00-13-47-778Z-9024` (fixed build). All at 1280×820, dark, fixture thread `comparison-fixture-transcript-v2`.

### Issue #8 is fixed

Provider turns stalled because the server's Codex event producer had died, not because Codex stopped talking.

- Codex sends a `configWarning` when a session opens in an untrusted folder (here the discovery session for `/Users/bytedance`, which starts after J1 deletes its thread). Its summary ends in a newline.
- `CodexAdapter` forwarded the summary untrimmed. The `config.warning` contract requires a trimmed string, so journal encoding failed.
- `ProviderService` persisted with `Effect.orDie` inside the one stream that carries every Codex thread. The defect ended that stream with no log line, so every later event for every thread was dropped.

Two fixes, each with a regression test that fails without it:

- `CodexAdapter` trims `configWarning` and `deprecationNotice` text.
- `ProviderService` drops an event it cannot process and logs `provider.runtime_event.dropped`, so one bad event can no longer stop a provider.

On the fixed build the same `config.warning` is persisted (sequence 920) and the stream keeps going.

### Scripted results on the fixed build

| Check                        | Result                                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------------------ |
| `compare:desktop`            | Certified                                                                                              |
| Cell matrix, dark 1280×820   | 6/6 cells; 7/7 increments on the second run. First run: `settings-appearance` timed out on Native once |
| J1 new thread and real turns | **6/6 Electron, 6/6 Native**, Native run directly after a full Electron pass (the #8 repro)            |
| J2 long transcript           | **6/6 Native**; Electron 6/6 on rerun (first run: no model output arrived in the 2.5 s detach window)  |
| J3 Explorer / Diff           | 6/6, 6/6                                                                                               |
| J4 Settings                  | 6/6, 6/6                                                                                               |
| J5 Automations               | 4/4, 4/4                                                                                               |
| J6 Kanban / PR               | 5/5, 5/5                                                                                               |

Only the dark 1280×820 configuration was run this time; the other three matrix configurations are unknown for this build.

New bug found while reproducing: Stop pressed early in a turn is sometimes lost (`turn/interrupt failed: no active turn to interrupt`), 2 of 4 Electron J1 runs. Filed as [#16](https://github.com/Huxpro/synara-lynxtron/issues/16).

### Computer Use: not run

Computer Use could not take control of `Synara Comparison Lynxtron`, so nothing below was verified through physical input. This time it was not a refused approval: the approval dialog was never shown, because Computer Use could not find the app.

- The launcher stages the app as an agent (`LSUIElement`), so it never appears in the running-application list Computer Use resolves against.
- Computer Use otherwise finds apps through Spotlight, and this Mac's index is read-only (`mdutil -s /` reports "Index is read-only"), so a bundle under `.synara-desktop-comparison/` or anywhere else cannot be indexed.
- Requests by bundle id (`com.lynxjs.SynaraComparisonLynxtron`), display name, and path all returned "not installed". Nothing was activated or raised.

| Item                                            | Computer Use | Scripted substitute (DevTool input, not physical)   |
| ----------------------------------------------- | ------------ | --------------------------------------------------- |
| Composer typing, Chinese IME + candidate window | not run      | none                                                |
| Cmd+A / Backspace / undo / redo / paste         | not run      | none                                                |
| Send a real turn, stop, resend                  | not run      | J1 pass, both renderers                             |
| Composer ↔ Terminal focus handoff               | not run      | none                                                |
| App menu → Settings                             | not run      | J4 pass (in-app navigation, not the system menu)    |
| Transcript wheel scroll + jump                  | not run      | J2 pass (drag-scroll, not a real wheel)             |
| Explorer / Diff dock                            | not run      | J3 pass                                             |
| Theme and density                               | not run      | J4 pass                                             |
| Automations create / edit / pause / delete      | not run      | J5 pass                                             |
| Kanban and PR dialogs                           | not run      | J6 pass                                             |
| Every menu / popover opens and dismisses        | not run      | Cell increments pass (model, add-panel, automation) |

Follow-up in the same session: the launcher gained an opt-in `--regular-app` flag that stages Lynxtron as a regular application. On run `2026-10-09T01-46-33-760Z-76990` Computer Use then found the app and showed the approval dialog, and the request was denied (`user_denied`). Control was refused, so the pass stopped there and every item above stays **not run**. To run it, launch with `--regular-app` and approve the app when asked.
