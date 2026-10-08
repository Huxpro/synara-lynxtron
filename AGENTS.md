# AGENTS.md

## Task Completion Requirements

- Do not run `bun fmt`, `bun lint`, or `bun typecheck` unless the user explicitly asks for them in the current conversation.
- All of `bun fmt`, `bun lint`, and `bun typecheck` must pass before considering tasks completed.
- Treat `bun fmt`, `bun lint`, and `bun typecheck` as heavyweight workspace checks: bundle them into one final verification pass per task whenever possible, and avoid rerunning the full set repeatedly during iteration.
- If a user asks for a small follow-up right after a recent full verification pass, prefer no rerun or the smallest reasonable re-check unless the user explicitly asks for full validation again.
- If the user asks to focus on code only, do not run `bun fmt`, `bun lint`, or `bun typecheck` automatically. In that mode, make the code changes first and only run verification if the user explicitly asks for it.
- NEVER run `bun test`. Always use `bun run test` (runs Vitest).

## Project Snapshot

Synara is a minimal web GUI for using coding agents like Codex and Claude.

This repository is a VERY EARLY WIP. Proposing sweeping changes that improve long-term maintainability is encouraged.

## Core Priorities

1. Performance first.
2. Reliability first.
3. Keep behavior predictable under load and during failures (session restarts, reconnects, partial streams).

If a tradeoff is required, choose correctness and robustness over short-term convenience.

## Model Selection

Rankings, higher = better. Cost reflects what I actually pay (OpenAI is near-free for me due to a deal), not list price. Intelligence is how hard a problem you can hand the model unsupervised. Taste covers UI/UX, code quality, API design, and copy.

| model       | cost | intelligence | taste |
| ----------- | ---- | ------------ | ----- |
| gpt-5.6-sol | 9    | 8            | 5     |
| sonnet-5    | 5    | 5            | 7     |
| opus-4.8    | 4    | 7            | 8     |
| fable-5     | 2    | 9            | 9     |

How to apply:

- These are defaults, not limits. You have standing permission to override them: if a cheaper model's output doesn't meet the bar, rerun or redo the work with a smarter model without asking. Judge the output, not the price tag. Escalating costs less than shipping mediocre work.
- Cost is a tie-breaker only; when axes conflict for anything that ships, intelligence > taste > cost.
- Don't let cost prevent you from using the right model for the job. Instead, take advantage of cheaper options to get more information and try things before moving the work to a more expensive option.
- Bulk/mechanical work (clear-spec implementation, data analysis, migrations): gpt-5.6-sol — it's effectively free.
- Anything user-facing (UI, copy, API design) needs taste ≥ 7.
- Reviews of plans/implementations: fable-5 or opus-4.8, optionally gpt-5.6-sol as an extra independent perspective.
- Never use Haiku.
- Mechanics: gpt-5.6-sol is only reachable through the Codex CLI — `codex exec` / `codex review` (my `~/.codex/config.toml` defaults to gpt-5.6-sol). Use the codex-implementation, codex-review, and codex-computer-use skills; for work they don't cover (investigation, data analysis), run `codex exec -s read-only` directly with a self-contained prompt.
- Claude models (sonnet-5, opus-4.8, fable-5) run via the Agent/Workflow model parameter.

Using gpt-5.5 inside workflows and subagents (the model parameter only takes Claude models, so use a wrapper):

- Spawn a thin Claude wrapper agent with `model: 'sonnet', effort: 'low'` whose prompt instructs it to write a self-contained codex prompt, run `codex exec` via Bash, and return the report (use `schema` on the wrapper to get structured output back).
- Always label these agents with a `gpt-5.6-sol:` prefix, e.g. `{label: 'gpt-5.6-sol:review-auth'}` — the workflow UI shows the wrapper's Claude model, so the label is the only indication the real worker is gpt-5.6-sol.
- Codex runs can exceed Bash's 10-minute timeout: pass an explicit timeout, or run in the background and poll for the report file.
- Parallel gpt-5.6-sol implementation agents must use `isolation: 'worktree'` so codex edits don't collide in the shared checkout.
- Workflow token budgets only count Claude tokens; codex work is free and invisible to `budget.spent()`.

## Long-running Codex Work

gpt-5.6-sol is exceptionally capable on long-running tasks. Give it substantial, multi-step work when it is the right model for the job; do not split work up merely because it is large.

- The quality of the result depends on the prompt. Provide a detailed, self-contained brief: goal, relevant context, constraints, files or systems in scope, expected deliverables, and how to verify completion.
- State important decisions and non-negotiable requirements explicitly. Do not assume the model will infer project-specific conventions or the desired tradeoffs from a short prompt.
- For long tasks, ask it to inspect the current state first, execute the work end to end, and report the changes, verification, and any remaining risks.
- If the work can safely run in parallel, keep each task's ownership and worktree boundaries explicit so agents do not overlap.

## Transcript Performance Guardrails

- Treat transcript auto-scroll as a live-output feature, not a generic "working" feature. Buffering, reconnecting, pending approvals, and tool-only activity must not be wired as if assistant text is actively streaming.
- When wiring scroll-follow logic, count real transcript messages only. Tool/work rows must not retrigger the same "new content arrived" auto-stick path.
- Prefer the simpler fork-style transcript path for the common case. Small and medium transcripts should avoid virtualization churn unless there is a clear measured need.
- If virtualization is used, never couple `rowVirtualizer.measure()` directly to another bottom-stick or height-follow cycle. Height-follow for live output should stay one-way to avoid measure/scroll feedback loops.
- Preserve these behaviors with focused transcript tests when changing chat scrolling, timeline measurement, or sidebar-driven transcript updates.

## Maintainability

Long term maintainability is a core priority. If you add new functionality, first check if there is shared logic that can be extracted to a separate module. Duplicate logic across multiple files is a code smell and should be avoided. Don't be afraid to change existing code. Don't take shortcuts by just adding local logic to solve a problem.

## UI Conventions

### Open/close (toggle) animations — single source

Any UI element with an open/close toggle (expand/collapse, show/hide, disclosure) MUST reuse the shared disclosure motion in `apps/web/src/lib/disclosureMotion.ts`. Never write bespoke height/opacity transitions or one-off `@keyframes` for a toggle — use the same logic and the same functions everywhere so every toggle feels identical (220ms `ease-out`, with `motion-reduce` fallbacks).

- Shell + content (used by open/close project, sidebar sections, composer suggestions): `disclosureShellClassName(open)` on the grid shell, `DISCLOSURE_INNER_CLASS` on the inner wrapper, `disclosureContentClassName(open)` on the content — or the ready-made `DisclosureRegion` component (`apps/web/src/components/ui/DisclosureRegion.tsx`).
- Base UI `<Collapsible>` panels: wrap with `CollapsiblePanel` (`apps/web/src/components/ui/collapsible.tsx`), which applies `DISCLOSURE_COLLAPSIBLE_PANEL_CLASS`.
- Rotating chevron affordance: `DisclosureChevron` / `disclosureChevronClassName(open)`.

Reference usage: opening/closing a project and the sidebar sections in `apps/web/src/components/Sidebar.tsx`. If you find a toggle that animates differently, migrate it to this module rather than duplicating logic.

## Package Roles

- `apps/server`: Node.js WebSocket server. Wraps Codex app-server (JSON-RPC over stdio), serves the React web app, and manages provider sessions.
- `apps/web`: React/Vite UI. Owns session UX, conversation/event rendering, and client-side state. Connects to the server via WebSocket.
- `packages/contracts`: Shared effect/Schema schemas and TypeScript contracts for provider events, WebSocket protocol, and model/session types. Keep this package schema-only — no runtime logic.
- `packages/shared`: Shared runtime utilities consumed by both server and web. Uses explicit subpath exports (e.g. `@synara/shared/git`) — no barrel index.

## Local Dev Instance Isolation

- Never start the default `bun run dev` while another Synara instance is running unless the user explicitly wants shared ports/state.
- Use an isolated home dir and non-default ports when running alongside the user's own Synara instance, for example: `env -u SYNARA_AUTH_TOKEN SYNARA_PORT_OFFSET=3158 SYNARA_NO_BROWSER=1 bun run dev -- --home-dir ./.synara-pr84 --port 58090`.
- Always dry-run first when avoiding conflicts: `env -u SYNARA_AUTH_TOKEN SYNARA_PORT_OFFSET=3158 bun run dev -- --home-dir ./.synara-pr84 --port 58090 --dry-run`.
- Unset `SYNARA_AUTH_TOKEN` for browser dev instances unless the web app is also configured to connect with that token. If auth is accidentally inherited, the browser WebSocket can be rejected and the UI will show no threads even though SQLite has projects/threads.
- Check both server and web ports with `lsof -nP -iTCP:<port> -sTCP:LISTEN`. A desktop app can bind `127.0.0.1:<port>` while the dev server binds IPv6 `*:<port>`, and `localhost` may still hit the wrong process.
- If the UI shows no threads, verify the server path before changing SQL: inspect the isolated `state.sqlite`, then probe `orchestration.getSnapshot` over WebSocket. A healthy snapshot with projects/threads means the issue is client connection/hydration, not empty history.

## Web and Lynx verification harness

Prove the harness before using it to judge the product. A screenshot does not prove a matrix cell unless its process, data source, viewport, theme, route, and output dimensions are recorded.

### Two-tier verification model

Use the harness in two distinct modes. Do not pay final-certification costs on every UI edit, and do not treat the fast loop as Native certification.

1. **Fast Lynx-for-Web loop** — the default for layout, composition, ordinary pointer/keyboard interaction, query state, transcript behavior, and rendered Markdown. Run Web original and Lynx-for-Web against one isolated server and one real snapshot. Iterate in named browser sessions, collect paired screenshots plus numeric geometry, and run focused tests. A complete production build is required at the validated slice boundary, not after every edit.
2. **Native batch / certification loop** — required for platform semantics and release evidence. Batch several Web-proven slices into one exact-owned Lynxtron run, then verify Native input, focus, accessibility, host integration, persistence, restart, and DevTool console. The full route × theme × size matrix and packaged-app checks belong here.

Browser ownership applies to loops that open `agent-browser`. Loops that never open one (Native-only runs through `compare:desktop`, server work, unit tests) skip it.

- Run every browser command through `bun run browser:run -- <command> [args...]`. The wrapper runs the cleanup preflight, traps exits and signals, and fails unless `session list --json` is empty and no agent-browser-owned process remains when it returns. Do not repeat those checks by hand around a wrapped command.
- Run `bun run browser:gate` yourself only when the wrapper could not finish: after a timeout, an interruption, or a killed shell. It must report `sessions: []` and zero agent-browser-owned daemon/browser processes before any retry.
- A remainder is a harness leak: stop, record it as a harness failure, and do not continue until the gate passes. Never infer cleanup from `agent-browser close` output alone, reuse a leaked session, or terminate unrelated Chrome, Playwright, remote-debugging, Lynxtron, Lynx Explorer, or other application processes.

The fast loop has been validated end to end: Composer, transcript follow/switching, Markdown code actions, and structured mention/skill rendering developed through Lynx-for-Web all passed a later real Lynxtron batch, including canonical send, provider response, restart persistence, scroll, wrap, copy, and a clean exact-client console. Keep the evidence under `shots/2026-08-02/harness/` and `shots/2026-08-02/native-regression/` as the reference run.

### Fast Lynx-for-Web loop

- Keep the Web relay a compile-time Web-only capability. The Web bundle may contain `synaraRpc`, browser storage, and the `0.5.5-lynx-web` build id; the Desktop/Lynx bundle must compile with relay disabled and must not contain those Web-only markers. Never hardcode a certification port into product code.
- Start one isolated Synara server with an empty inherited auth token and a temporary home. Point Web original and Lynx-for-Web at that server; use the same snapshot, route, theme, viewport, DPR, and product state.
- Use separate named `agent-browser` sessions. A useful default cell is `1280×820`, DPR 1, light. Verify runtime dimensions before capture and PNG dimensions after capture.
- Run every shell workflow that opens `agent-browser` through `bun run browser:run -- <command> [args...]`. For a multi-command flow, pass one script or `bash -c` invocation to that wrapper. It performs a cleanup preflight, installs normal and signal exit traps, and requires a final zero-session/zero-owned-process cleanup before returning. Do not call `agent-browser` from an unguarded shell. A successful `agent-browser close` or `close --all` message is not sufficient: the cleanup gate polls until `session list --json` is empty and no agent-browser daemon or agent-browser-owned remote-debugging process remains. Never fail or terminate an unrelated browser merely because it uses `--remote-debugging-port`.
- Create required states through canonical product RPC/mutations. Never write fixtures directly into SQLite. Read SQLite only to verify projections such as structured skills, mentions, messages, or persistence.
- Use Web original as the design and composition authority, not an infallible behavior oracle. If Web leaks state or violates the intended contract, preserve the correct product behavior in Lynx and record the intentional delta instead of copying the bug.
- Measure before patching. Record relevant bounding boxes, font sizes, scrollTop/scrollHeight/clientHeight, accessible names, action order, and console output. Screenshots establish visual structure; numeric probes make iteration fast and falsifiable.
- Exercise real rendered controls for retained evidence. Programmatic state changes are acceptable for setting up a precise scroll or fixture condition, but route changes, menu selections, sends, copy/wrap actions, and other claimed interactions must use the product path.
- Keep fresh-console checks separate from long-lived development sessions, whose logs may contain expected reconnect noise from server-origin switches. A retained cell fails on page errors; known upstream initialization warnings must be named.
- At each coherent slice boundary: save paired evidence and residuals, run focused tests, run Web/Lynx/Desktop production builds in proportion to the change, run relevant audits, then commit the slice independently.

### What the fast loop cannot certify

Always escalate these to the Native batch:

- Native textarea behavior, IME, selection, paste, undo/redo, keyboard routing, and focus.
- macOS Accessibility, system menus, secondary click/long press, clipboard/dialog semantics, deep links, application lock, window lifecycle, and background presentation.
- Native `<list>` event shape, real wheel/gesture behavior, DevTool element/console identity, cold start, disk persistence, and packaged bundle loading.
- CSS or element behavior whose Lynx-for-Web custom-element implementation can differ from the native Lynx engine.

Use one exact-owned isolated app instance for the batch: the one `bun run compare:desktop` launches (see below). It runs in the background, so operate it there with Computer Use or the scripted drivers, never `Raise` it, keep it alive across states, and restart only for an explicit cold-start/persistence cell, a new window size or theme, or a newly staged bundle. A Web pass plus a focused test is not permission to skip this Native boundary.

### Comparison launcher (default Native entry point)

`bun run compare:desktop` is the preflight. Do not rebuild its checks by hand. One command:

- builds Web, Electron, and the Lynx bundle, and refuses a stale Native bundle on `--skip-build`;
- checks its ports, clones the canonical fixture into an isolated home, and verifies the fixture entities;
- starts one isolated backend, Electron, and Lynxtron against it, sized and themed by `--width`, `--height`, `--theme`, `--route`, `--thread`, `--dock`, and `--terminal`;
- launches both apps as background agent bundles: Lynxtron never becomes frontmost, and Electron can flash frontmost for about a second only when the launching app is frontmost;
- resolves the Lynx DevTool port from the owned Lynxtron PID and certifies that both renderers show the same thread on the same backend;
- writes a run manifest under `.synara-desktop-comparison/runs/` with the PIDs, ports, bundle hashes, and backend identity;
- stops every owned process and proves none survived when it exits or is interrupted.

Leave it running and drive the certified session with:

- `node scripts/comparison-workflow-run.mjs <J1…J6> --renderer electron|native|both` for the six task workflows, checked against the backend;
- `node scripts/comparison-cells.mjs` for paired control geometry across the six main surfaces and the declared state increments;
- Computer Use for exploratory checks and anything that needs real keyboard, pointer, or menu input.

Run workflows and exploratory input after the cells. They leave state behind (an open dock, extra threads), and a base cell measured on top of that is a harness failure, not a product one.

### Certification preflight gate

Do not retain matrix evidence unless the launcher reported `certified` for that run. When a cell cannot use the launcher (a packaged app, a Web-only loop), establish the same facts yourself before capturing:

- The complete production build ran; record the staged bundle path and hash.
- The isolated server's state directory, ports, and owned PIDs are recorded.
- Both clients use one snapshot, with missing project or thread data created through the real product API.
- The browser session's viewport, visual viewport, device pixel ratio, and PNG dimensions match the cell.
- The Native process, workspace executable, staged bundle, root theme class, and PID-derived DevTool client are verified.
- The original bytes and hashes of every persisted state file the run will change are saved.

If preflight fails, fix the harness before collecting product evidence. Do not accumulate diagnostic screenshots in the certification matrix.

### Separate harness failures from product failures

Invalidate the evidence when the harness has any of these failures:

- The exported image dimensions differ from the requested viewport.
- DevTool connects to the wrong client or a remembered port.
- Lynxtron loads a stale bundle or requests a development asset server.
- Web and Native use different snapshots, routes, themes, or product states.
- A persisted state file changes outside the owned run.
- Runtime errors appear during capture.

Classify rendering, content, layout, token, and interaction differences as product failures only after preflight passes. Never report a harness failure as a product regression.

### Shared data and process ownership

- Connect Web and Lynx to the same isolated Synara server, snapshot, route, and product state. Record the server PID, Web PID, Lynxtron PID, ports, and state directory before capture.
- Check every port with `lsof` before launch. Stop only PIDs created for the current verification run.
- Do not hardcode renderer data. If an isolated snapshot lacks a required project or thread, create temporary records through the real workspace RPC or product API. Use the resulting server snapshot on both clients. Back up the snapshot first and remove or restore the temporary clone after capture.
- Treat a missing data state as incomplete only when the harness cannot create it through the real product path. Never use historical screenshots or an empty state to certify a populated screen.

### Web capture

- Use a named, isolated `agent-browser` session. Do not attach to the user's Chrome profile or rely on a shared preview screenshot exporter.
- Set the viewport and scale explicitly for each cell, such as `agent-browser --session p8q2-web-evidence set viewport 1280 820 1`.
- Before capture, read `innerWidth`, `innerHeight`, `visualViewport.width`, `visualViewport.height`, and `devicePixelRatio` from that same session. After capture, inspect the PNG pixel dimensions. Reject the image if either check differs from the requested matrix cell.
- Reuse the same named session for navigation and capture. Close it explicitly inside the `browser:run` workflow; do not consider the browser cell complete unless the wrapper's final cleanup gate passes. Do not close unrelated user browser sessions.

### Native production capture

- Computer Use is the default way to operate the running app. Current harnesses (TraeX built-in, Codex Computer Use) drive a window in the background without activating it, so there is no reason to bring the app forward or to fall back to shell-driven UI automation, Midscene, AppleScript, or synthetic `CGEvent` input first.
- Start each interaction turn with Computer Use app-state inspection, target the launcher's owned app (`Synara Comparison Lynxtron`, PID from the run manifest), and prefer accessibility element IDs over coordinates when exposed. Lynxtron does not expose Lynx content to macOS accessibility yet, so expect coordinates there.
- Computer Use attaches to a running app; it does not launch the workspace build. Let the launcher start it, and do not let an implicit launch select an installed or stale app with the same display name.
- Some harnesses ask the user to approve each app before Computer Use may control it, and a non-interactive run cannot grant that. If control is refused, record the refusal and use the scripted workflows and DevTool instead. Do not work around the approval.
- If Computer Use is genuinely unavailable or cannot address a specific Native surface, record the exact limitation before using a fallback. A fallback interaction is not equivalent evidence unless delivery into the owned Lynx input pipeline is independently proven.
- Keep one certified instance alive across route, scroll, and interaction cells. Use Computer Use for those state changes, and use DevTool for exact LynxView screenshots, component inspection, and console capture.
- Do not call `open -a`, AppleScript activation, menu commands that call `show()` or `focus()`, or deep links only to drive the harness. These paths can raise the app over the user's windows.
- If the owned app exits twice with the same error, stop the restart loop and diagnose the runtime. Do not keep reopening a window over the user's desktop.
- Outside the launcher (for example a single Native smoke run), run `bun run build` in `apps/lynx` first: `rspeedy build` updates `output/bundle` but does not stage the Lynx bundle in `dist/desktop`. Launch with `NODE_ENV=production` and `SYNARA_ENABLE_DEVTOOL=1`, resolve the DevTool client from the owned PID with `lsof`, and never select a client by a remembered port or by list order.
- Treat any production request to `127.0.0.1:3000`, `localhost:5971`, or another dev asset server as a harness failure. Do not start an arbitrary server to mask it. Stop the owned process, check `NODE_ENV`, process arguments, staged bundle contents, and the active Lynxtron executable, then rebuild.

### Native window size and persisted state

- Set the size with the launcher: `bun run compare:desktop --width 1280 --height 820`. It writes the window state for both apps inside its own isolated profile, so no user file is touched and nothing needs restoring.
- A size change needs a relaunch. Verify the outer bounds with CoreGraphics and the content frame with DevTool. A `1280×820` macOS window maps to `1280×788` logical content, or `2560×1576` physical pixels at device pixel ratio 2, because the native title bar consumes 32 logical pixels.
- Only when a run must use a non-isolated profile: close the owned process first, save the original `window-state.json` bytes and hash, write the temporary state, and restore the original only after the app exits and the file still matches what this run wrote. If it changed unexpectedly, do not overwrite it; keep the backup and report both hashes.

### Execute the matrix by restart cost

Put the most expensive state change in the outer loop:

1. Launch the first configuration without `--skip-build`; it builds once.
2. Run `node scripts/comparison-cells.mjs` against it, then stop the launcher.
3. Relaunch each remaining theme and size with `--skip-build` and repeat. The launcher refuses the reuse if a bundle source changed in between.
4. Run workflows and exploratory Computer Use last, on one configuration.

Route, scroll, and interaction changes never need a restart. A full matrix is four launches (two themes × two sizes) on one build.

### Evidence and cleanup gate

- Capture DevTool errors and warnings with every retained Native frame. A successful screenshot with runtime errors is not passing evidence.
- The Lynx DevTool gives the console backlog to the first `get-console` of an app session and nothing to later calls. Read it once, after the interactions, and treat an empty later read as unknown, not clean. `comparison-cells.mjs` brackets its run with probe errors for this reason.
- Record the Web geometry, PNG dimensions, Native outer/content dimensions, bundle path, client port, server snapshot identity, theme, route, and cleanup result in the cell's `notes.md`.
- Close the named browser session and stop owned Web, server, Lynxtron, and DevTool processes. Confirm owned ports are free and byte-exact state restoration succeeded before declaring the harness clean.

## Codex App Server (Important)

Synara is currently Codex-first. The server starts `codex app-server` (JSON-RPC over stdio) per provider session, then streams structured events to the browser through WebSocket push messages.

How we use it in this codebase:

- Session startup/resume and turn lifecycle are brokered in `apps/server/src/codexAppServerManager.ts`.
- Provider dispatch and thread event logging are coordinated in `apps/server/src/providerManager.ts`.
- WebSocket server routes NativeApi methods in `apps/server/src/wsServer.ts`.
- Web app consumes orchestration domain events via WebSocket push on channel `orchestration.domainEvent` (provider runtime activity is projected into orchestration events server-side).

Docs:

- Codex App Server docs: https://developers.openai.com/codex/sdk/#app-server

## Reference Repos

- Open-source Codex repo: https://github.com/openai/codex
- Codex-Monitor (Tauri, feature-complete, strong reference implementation): https://github.com/Dimillian/CodexMonitor

Use these as implementation references when designing protocol handling, UX flows, and operational safeguards.
