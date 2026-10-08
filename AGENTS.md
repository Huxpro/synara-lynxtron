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

Electron is the design and behavior authority. Lynxtron (Native) is verified against it on the same backend and data. Prove the harness before judging the product: a harness failure is never a product regression.

### The path

1. **Iterate in Lynx-for-Web** for layout, composition, ordinary pointer and keyboard interaction, and rendered content. Run Web original and Lynx-for-Web against one isolated server (see Local Dev Instance Isolation) in named `agent-browser` sessions, always through `bun run browser:run -- <command>`. The wrapper owns browser cleanup; run `bun run browser:gate` yourself only after a timeout or interruption.
2. **Launch the Native session** with `bun run compare:desktop [--width 1280 --height 820] [--theme dark|light] [--route /path] [--skip-build]`. It builds, clones the canonical fixture into an isolated home, starts one backend with Electron and Lynxtron as background apps, certifies that both show the same thread, writes a run manifest under `.synara-desktop-comparison/runs/`, and cleans up on exit. Do not redo its checks by hand. If it does not print `Run manifest`, fix that first.
3. **Measure** with `node scripts/comparison-cells.mjs`: paired control geometry (≤2 px) on the six main surfaces plus the declared state increments, with page errors from both renderers. A full matrix is four launches (two themes × 1280×820 and 1440×900); only the first builds, the rest use `--skip-build`.
4. **Exercise the workflows** with `node scripts/comparison-workflow-run.mjs <J1…J6> --renderer electron|native|both`. They drive real controls and check every step against the backend. Run them after the cells: they leave state behind, and a cell measured on top of it is a harness failure.
5. **Explore and accept** what the scripts do not cover, using the input path your environment has (next section).
6. **Stop the launcher** (Ctrl-C or SIGINT) and confirm it printed `Cleanup verified`.

### Input: with and without Computer Use

Both environments run steps 1–4 and 6 unchanged. They differ only in step 5.

- **With Computer Use** (Claude Desktop, TraeX, interactive Codex): operate `Synara Comparison Lynxtron` in the background, identified by the PID in the run manifest. Never activate or raise it. Lynx content is not exposed to macOS accessibility, so work from screenshots and coordinates. This is the only automated path that exercises the AppKit input pipeline, so use it for the physical-input list below. If the harness asks the user to approve the app and control is refused, stop and say so; do not work around the approval.
- **Without Computer Use** (CLI, CI, a refused approval): drive the app through the Lynx DevTool, as the workflow driver does (`openNativeDriver` in `scripts/comparison-workflow.mjs`: tap, drag-scroll, text insertion, reload), and inspect with `take-screenshot` and `get-console`. This proves product logic and layout. It does not prove physical input, so report those items as pending and never as passed.

Physical-input list, certifiable only with Computer Use or by a person: IME and candidate window, selection, paste, undo and redo, keyboard routing and focus handoff (Composer ↔ Terminal), system menus, secondary click, dialogs and permission prompts, VoiceOver, real wheel and gesture scrolling.

### Rules that hold everywhere

- Stop only processes you started. Never terminate unrelated Chrome, Lynxtron, Lynx Explorer, or other apps; other projects run Lynxtron on adjacent DevTool ports.
- Never bring an app forward to drive it: no `open -a`, AppleScript activation, `show()`/`focus()` menu commands, or deep links used only as a harness shortcut.
- Take the Lynx DevTool port from the run manifest or from the owned PID with `lsof`, never from memory or list order.
- Create product state through the product (UI or RPC). Never write fixtures into SQLite; read it only to verify.
- The DevTool gives the console backlog to the first `get-console` of an app session and nothing afterwards. Read it once, after the interactions; an empty later read means unknown, not clean.
- Evidence counts only from a certified run on the current bundle, with zero runtime errors, and with the route, theme, size, and data identity recorded. Unrun cells are unknown, not passed.
- Two identical harness failures in a row mean diagnose, not retry.
- Fix a small product defect at its source and rerun the workflow or cell that found it. File an issue for anything larger, with the run id and the failing step.

### Outside the launcher

A packaged app or a Web-only loop has no launcher to certify it, so establish the same facts yourself and record them: the production build and bundle hash, the isolated server's state directory and PIDs, one shared snapshot for both clients, the requested viewport and resulting image size, and the owned process and DevTool client. For a standalone Native run, `bun run build` in `apps/lynx` (plain `rspeedy build` does not stage `dist/desktop`), then launch with `NODE_ENV=production SYNARA_ENABLE_DEVTOOL=1`. A request to a dev asset server (`127.0.0.1:3000`, `localhost:5971`) from a production run is a harness failure.

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
