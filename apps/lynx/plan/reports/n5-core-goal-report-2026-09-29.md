# N5 — Packaged acceptance and core-goal report

Plan: [core-goal-review-and-next-phase-2026-09-29.md](core-goal-review-and-next-phase-2026-09-29.md) § N5.
Evidence: [n5-evidence/](n5-evidence/) (numbers and logs only, no screenshots).
Commit: `d38f58a8f` (package built from it). Addendum at `e9fb78298`: automation model picker, background comparison launches, matrix rerun (see [Addendum](#addendum-e9fb78298)).

## Status in two parts

| Part                                            | Status                                                                                                                                                                                                                                                                                                                                           |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Ordinary UI (Electron as the only standard)** | **Met for everything declared and measurable.** N2 dividers, N4 24/24 base cells and 24/24 state increments (both themes, both sizes, one build), N3/N4 workflows J3–J6 on the final build in both renderers. Named exemptions and registered residuals are listed below.                                                                        |
| **Overall usability**                           | **Not complete.** Native keyboard/IME, candidate window, clipboard editing, Terminal/Composer focus handoff, VoiceOver and audio permission still need physical acceptance on runtime 0.0.28. J1 (Native) and J2 fail on the final build at the first real turn (see Workflows). Interactive checks inside the packaged app could not be driven. |

## Packaged app (P8-Q3)

`bun run --cwd apps/lynx pack` produced the unsigned arm64 DMG from `d38f58a8f`:

- **Artifact:** `Synara-Lynx-v0.5.5-lynx.0-darwin-arm64.dmg`, 36,376,197 bytes, SHA-256
  `0a9bbb08358fa0155e1b8449abb0ba837aabe0f01c233d50462f5bd6bcfc0b82`.
- **Signing:** skipped, `identity: null`.

The app ran as `dist/mac-arm64/Synara Lynx.app` against an isolated backend (the comparison fixture server) with isolated user data. It loaded its packaged bundle: `NODE_ENV` was unset and nothing listened on the dev server port 5971.

| Launch                      | UI ready (host log)               | Route in the app    | Errors | Backend data                                                 | Quit        |
| --------------------------- | --------------------------------- | ------------------- | ------ | ------------------------------------------------------------ | ----------- |
| plain                       | `route=/`, 394 ms                 | `/`                 | 0      | fixture workspace loaded                                     | clean, ≤1 s |
| `synara://pull-requests`    | `route=/pull-requests`, 327 ms    | `/pull-requests`    | 0      | loaded                                                       | clean       |
| `synara://settings/general` | `route=/settings/general`, 311 ms | `/settings/general` | 0      | loaded                                                       | clean       |
| `synara://automations`      | `route=/automations`, 345 ms      | `/automations`      | 0      | loaded                                                       | clean       |
| `synara://plugins`          | `route=/plugins`, 317 ms          | `/plugins`          | 0      | loaded                                                       | clean       |
| `synara://update`           | `route=/update`, 315 ms           | `/update`           | 0      | —                                                            | clean       |
| plain relaunch              | `route=/`, 322 ms                 | `/`                 | 0      | loaded                                                       | clean       |
| plain, **no auth token**    | `route=/`, 383 ms                 | `/`                 | —      | every RPC 401; app reports offline and cools down reconnects | clean       |

Measurement notes:

- **Route evidence** is the app's own `shellRouteChanged` bridge call.
- **Backend data** means the renderer persisted the fixture workspace, which only the backend supplies.
- **No UI-ready timeouts** occurred in any launch, and no script errors appeared in the app output.

Not verified in the package:

- **In-app interaction.** Menu actions, in-app navigation, a provider turn and last-thread restore after relaunch need input. The release Lynxtron binary opens no DevTool inspector, and the request to control the app was declined. An earlier check in this phase that looked like a failure had inspected the harness's development app on the same DevTool port, not the package; that finding and the fix it prompted were withdrawn.
- **Auth screen content.** What the tokenless launch shows is not inspected, only that it stays up and reports offline.

The manual script at the end covers these.

## Table 1 — Source reuse

`reuse-audit.mjs` on the current tree, written to a new file (the user's baseline file was checksummed before and after and is unchanged). Gate = min(module %, LOC %) over web sources reachable from each screen's entry; target 70%.

| Screen                  | Gate 2026-09-10 | Gate now   | Module reuse | LOC reuse       |
| ----------------------- | --------------- | ---------- | ------------ | --------------- |
| Threads                 | 66.75%          | **68.77%** | 273 (68.77%) | 56,370 (71.02%) |
| Threads shell + Sidebar | 72.21%          | **75.33%** | 260 (75.80%) | 51,784 (75.33%) |
| Thread                  | 48.04%          | **49.71%** | 408 (54.77%) | 71,677 (49.71%) |
| Settings                | 63.03%          | **64.74%** | 303 (64.74%) | 59,345 (66.67%) |
| Projects / Kanban       | 63.35%          | **65.01%** | 327 (65.01%) | 62,927 (66.10%) |
| Pull Requests           | 68.64%          | **70.39%** | 347 (70.39%) | 64,550 (71.44%) |

Two screens meet the 70% target; Thread (the composer/transcript/terminal graph) is furthest from it. Since that baseline every gate rose by 1.7–3.1 points. This phase moved shared logic into existing modules (git quick-action glyphs, voice notes, dock pieces), but the audit does not attribute the gain to individual commits. It counts physical shared and declared patched sources only; it does not widen EXCLUSIVE.

## Table 2 — Visual state

| Area                     | Result                                                                                                                                                 | Report                                     |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ |
| Surface dividers         | Listed dividers match Electron role, strength and position (light/dark × both sizes)                                                                   | [N2](n2-divider-calibration-2026-09-29.md) |
| Six core surfaces        | 24/24 base cells: every paired control ≤2 px and every Electron-named control present, or named exemption                                              | [N4](n4-matrix-2026-09-29.md)              |
| State increments (J1–J6) | 28/28 at `e9fb78298`: landing dock, model menu, Add panel with Diff dock, Appearance, automation dialog, automation model menu, Kanban New task dialog | [N4](n4-matrix-2026-09-29.md)              |
| Page errors              | Electron 0 in all runs; Native not observable (DevTool console returns nothing on this build)                                                          | [N4](n4-matrix-2026-09-29.md)              |

Named exemptions:

- **Engine:** the scrollbar gutter, transcript trail tick hit rows, range slider track vs thumb row.
- **Coverage:** landmark and group names Lynx has no role for, the fixed-theme code highlighter, the inline hex colour editor, the right-edge panel rail.

Registered residuals:

- the 2D colour picker;
- Kanban "Send as draft" semantics.

Closed after the first report: the automation model picker (now Electron's provider/model picker, measured by the `automation-model-menu` increment), and `white-space: pre` outside the diff (verified unaffected: markdown code blocks sit in a horizontal scroll-view, the Explorer preview scrolls both ways, terminal lines are pre-sized).

Motion, hover, pressed and focus visuals are not part of the N4 matrix; they remain under the fidelity contract (P10 phase 4).

## Table 3 — Functional workflows

| Workflow                                                         | Earlier bundle (N3) | Final build, Electron | Final build, Native |
| ---------------------------------------------------------------- | ------------------- | --------------------- | ------------------- |
| J1 new thread → turn → picker → @ mention → stop/resend → reload | pass / pass         | **6/6**               | fails at first turn |
| J2 long transcript → follow → detach → Jump → tool rows → back   | pass / pass         | fails at first turn   | fails at first turn |
| J3 Explorer → search → preview → Diff → reopen → Retry           | pass / pass         | **6/6**               | **6/6**             |
| J4 Settings round trips → theme/density → persist → reload       | pass / pass         | **6/6**               | **6/6**             |
| J5 automation create → edit → pause/resume → list                | pass / pass         | **4/4**               | **4/4**             |
| J6 Kanban task with a real turn → open/return → reconnect → PRs  | pass / pass         | **5/5**               | **5/5**             |

The first-turn failures end with "The provider accepted this turn but produced no runtime events". That message comes from a 15-second first-event watchdog in uncommitted working-tree changes to `ProviderCommandReactor.ts`, which the harness runs. It is not the external stall that N3 recorded, and N3 has been corrected. The same session completed other real turns (J1 Electron, J6 both clients). Whether the silence is provider latency or that uncommitted change was not isolated, because doing so needs a server built without it.

## Table 4 — Native platform differences and hard islands

| Item                                   | Kind                    | State                                                                                 |
| -------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------- |
| No `color-mix()` in Lynx               | engine                  | Build-time projection (N2)                                                            |
| No inherited `pointer-events`          | engine                  | `user-interaction-enabled` on hidden overlays (N3)                                    |
| `white-space` only normal/nowrap       | engine                  | Diff fixed (N4); other `pre` uses registered                                          |
| Textarea sized by maxlines             | engine                  | Definite heights where the web box is fixed (N4)                                      |
| `aria-*` ignored by Lynx               | engine                  | `accessibility-label` / `accessibility-elements-hidden` where measured (N4)           |
| No landmark/group roles                | engine                  | Coverage exemptions (N4)                                                              |
| Classic 10 px scrollbar in Electron    | engine (reference side) | Named geometry exemption                                                              |
| Code themes                            | capability              | Hidden in Native: fixed GitHub highlighter (39d4601c3)                                |
| 2D colour picker                       | capability              | Inline hex editing in Native                                                          |
| Terminal                               | hard island (FC-013)    | PARTIAL: search, selection copy, resize/split/reload verified; input semantics remain |
| Browser / PDF                          | hard island (FC-019)    | Native PDF viewer with shared zoom policy; browser pane host-owned view               |
| DevTool console / inspector in release | tooling                 | Console capture unavailable; release binary has no inspector                          |

## Native acceptance checklist (physical input)

These are the latest FC dispositions. They were recorded on Lynxtron 0.0.16–0.0.21 and have **not been re-verified on 0.0.28**. Each needs a person at the keyboard:

| FC     | Area                                    | Latest disposition                                                                                   |
| ------ | --------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| FC-014 | Text selection / Select All / edit menu | PARTIAL; generic AppKit edit commands blocked on 0.0.21                                              |
| FC-025 | Terminal IME, candidate window          | PARTIAL; cursor tracking verified, Chinese/Japanese candidates uncertified                           |
| FC-026 | Composer ↔ Terminal focus               | OPEN; user reverification blocked by FC-039                                                          |
| FC-013 | Terminal input semantics                | PARTIAL (see Table 4)                                                                                |
| FC-022 | VoiceOver / desktop AX bridge           | PARTIAL; AX bridge blocked on 0.0.21                                                                 |
| FC-020 | Voice notes / microphone permission     | PARTIAL; rendered states verified, real recording needs the permission prompt                        |
| FC-032 | Project action text input               | PARTIAL; 0.0.16 text-input crash reproduced; this phase fixed the controlled-input crash (f959231e3) |

## Mapping

| Requirement                                                                | Where it stands                                                                                                                                  |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| P8-Q3 packaged-app regression                                              | DMG rebuilt; launch, bundle, deep links (incl. update), real data, auth failure smoke recorded; interactive menu/navigation pending physical run |
| P8-Q4 completion report                                                    | This report (four tables)                                                                                                                        |
| P10 deliverable 6 (three-client matrix, zero unregistered major residuals) | Met for Web vs Native in N4; Lynx-for-Web not part of this matrix                                                                                |
| P10 deliverables 4–5 (optical controls, temporal fidelity)                 | Not re-measured in this phase                                                                                                                    |
| P10 deliverable 7 (completion audit)                                       | This report and N1–N4; not a single-score verdict                                                                                                |
| AF (automations)                                                           | J5 and the automation-dialog increment pass on the final build                                                                                   |
| FC                                                                         | Dispositions above; not re-certified on 0.0.28                                                                                                   |
| DS                                                                         | Divider/surface items re-certified by N2 and N4                                                                                                  |

Workspace gates: `bun fmt`, `bun lint` and `bun typecheck` were **not run**, per the standing instruction to run them only when asked. Only changed files were formatted. The affected Lynx and web tests pass. The full Lynx suite has the same failures as HEAD, pre-existing rstest source assertions and chunk-loading failures.

## Manual acceptance script (packaged app)

1. Open `apps/lynx/dist/Synara-Lynx-v0.5.5-lynx.0-darwin-arm64.dmg` and start Synara Lynx against a running Synara server.
2. Open a project thread, type in the composer with a Chinese IME, and select a candidate.
3. Press Cmd+A, then Backspace. Also use Edit → Select All.
4. Send a message and watch it stream. Open the model menu, stop, and resend.
5. Open the Terminal panel, type in it, click back into the composer, and type again.
6. From the app menu, open Settings; quit and relaunch; confirm the last thread returns.
7. Record a voice note, and accept the microphone prompt when asked.
8. With VoiceOver on, move through the sidebar and composer controls.

## Addendum (`e9fb78298`)

- **Automation model picker.** Automation create/edit dialogs render Electron's provider/model picker: a start-aligned trigger with no reasoning-traits menu.
- **Matrix rerun on one build.** The run used `e9fb78298` with no concurrent load. Results: 24/24 base cells and 28/28 state increments (7 increments × light/dark × 1280×820/1440×900). The new `automation-model-menu` increment passes 6/6 with the popup ≤2 px in every configuration.
- **Background comparison launches.** Both harness apps are agent (LSUIElement) bundles, and Electron runs from a separate `(Background)` launcher bundle. Sampling `lsappinfo front` every 0.4–0.5 s through a full session launch gave these results:
  - The Lynxtron comparison app never became frontmost.
  - Electron became frontmost for about 1 s only when the launching app was frontmost; with the user in another app it never did.
  - No JS `show`/`focus` call was involved. The remaining activation is native, when Electron orders in its first window.
- **Launcher fix.** Node's `cpSync` had rewritten the Electron framework's relative symlinks into absolute links to the source bundle, so helpers failed with `icudtl.dat not found`. Bundles are now copied with `ditto`.
- **Packaged-app interaction.** Still not driven. Background computer-use control of `com.synara.lynx` was requested and declined, so the manual script above still stands.
