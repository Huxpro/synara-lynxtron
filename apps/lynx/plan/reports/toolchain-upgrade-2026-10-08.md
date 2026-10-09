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

### Computer Use pass

Run `2026-10-09T03-08-14-702Z-99575`, launched with `--regular-app`, 1280×820 dark, Lynxtron PID 2775, driven in the background with Claude Desktop Computer Use. The app was never activated or raised by the harness.

How it got here: the default launch stages the app as an agent (`LSUIElement`), which Computer Use cannot find, and this Mac's Spotlight index is read-only. `--regular-app` makes it discoverable. The first approval request was denied; the second was approved.

Limits of this pass: Electron was not driven through Computer Use, so results are Native observations judged against expected behavior, not paired comparisons. Background input cannot switch input sources, so the IME candidate window was not exercised.

| Item                                | Result          | Notes                                                                                                                               |
| ----------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Composer typing (ASCII)             | pass            | 2 of 4 prompts lost characters; may be the synthetic input path ([#19](https://github.com/Huxpro/synara-lynxtron/issues/19))        |
| Chinese IME + candidate window      | not run         | Direct CJK insertion kept only the last character (#19)                                                                             |
| Cmd+A                               | not certifiable | Edit → Select All has no effect in the background in Electron either; needs a foreground check                                      |
| Backspace                           | pass            |                                                                                                                                     |
| Undo / redo                         | pass            | Edit → Undo and Edit → Redo                                                                                                         |
| Paste                               | not run         | Computer Use refuses Edit → Paste in background mode because it touches the system clipboard                                        |
| Caret placement while editing       | fail            | After a mid-text insert the caret jumps to the end; Shift+Left does not select (#19)                                                |
| Send a real turn                    | pass            | New thread in the fixture project                                                                                                   |
| Stop                                | pass            | Stopped during "Thinking"; thread settled                                                                                           |
| Resend                              | pass            | Follow-up turn answered                                                                                                             |
| Terminal → Composer focus           | pass            |                                                                                                                                     |
| Composer → Terminal focus           | fail            | Terminal showed no typed input, twice; also prints `undefined` on open ([#20](https://github.com/Huxpro/synara-lynxtron/issues/20)) |
| App menu → Settings                 | pass            | Menu items use the package name `@synara/lynx` (#20)                                                                                |
| Transcript wheel scroll             | pass            |                                                                                                                                     |
| Jump to latest                      | pass            |                                                                                                                                     |
| Diff dock                           | pass            | Split diff rendered                                                                                                                 |
| Explorer dock                       | pass            | Tree and file preview                                                                                                               |
| Theme light / dark                  | pass            |                                                                                                                                     |
| Density                             | pass            | Compact and back to Comfortable                                                                                                     |
| Automations create                  | pass            | Required checkbox is nearly invisible when unticked (#20)                                                                           |
| Automations edit                    | pass            | Repeats changed to Weekly                                                                                                           |
| Automations pause                   | pass            |                                                                                                                                     |
| Automations delete                  | pass            | Native confirmation sheet                                                                                                           |
| Kanban dialog                       | pass            | New task opens and closes with its close button                                                                                     |
| PR view and filter menu             | pass            | Empty list in the fixture; tabs and filter menu work. No PR dialog could be opened without a PR                                     |
| Menus / popovers open               | pass            | Add-panel, project picker, Repeats, PR filter                                                                                       |
| Menus / popovers dismiss by click   | pass            |                                                                                                                                     |
| Menus / dialogs dismiss with Escape | fail            | Add-panel menu and Kanban dialog stayed open (#20)                                                                                  |
| VoiceOver, microphone prompt        | not run         |                                                                                                                                     |

Also seen: a failed turn on the fixture thread (its Codex session is archived) shows the raw stack trace in a translucent banner over the transcript (#20).

### Paired Electron check

Run `2026-10-09T05-37-02-903Z-64827`, `--regular-app` (now stages Electron as a regular app too), Electron driven in the background through the same Computer Use input path. An earlier request for Electron access was denied; this one was approved. The detached DevTools window had to be closed first because it held the app's text cursor. Only the items that failed or were doubtful in Lynxtron were repeated.

| Check                               | Electron (authority)                | Lynxtron                         | Verdict                                                                   |
| ----------------------------------- | ----------------------------------- | -------------------------------- | ------------------------------------------------------------------------- |
| Type `hello acceptance 你好世界 YX` | All characters present              | Only `界` of the CJK run remains | Lynxtron bug ([#19](https://github.com/Huxpro/synara-lynxtron/issues/19)) |
| Left, Left, type `Z`, type `W`      | `…ZWYX`, caret after `W`            | `…ZYXW`, caret jumped to the end | Lynxtron bug (#19)                                                        |
| Edit → Select All, then Backspace   | No selection; one character deleted | Same                             | Harness limit in the background, not a Lynxtron bug                       |
| Escape on the dock add-panel menu   | Menu closes                         | Menu stays open                  | Lynxtron bug ([#20](https://github.com/Huxpro/synara-lynxtron/issues/20)) |
| Click the terminal, type a command  | Text reaches the terminal           | Nothing appears                  | Lynxtron bug (#20)                                                        |

What is still open after this pass, and why:

- **Full-list paired run: partial.** Electron was compared on the five checks above. The items that passed in Lynxtron were not repeated in Electron.
- **IME candidate window, paste: not run.** Background Computer Use cannot switch input sources and refuses clipboard menu items. Both need the app in the foreground, which this harness does not do.
- **VoiceOver, microphone prompt: not run.**
