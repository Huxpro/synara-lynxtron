# Synara agent instructions

Synara is a multi-provider GUI for coding agents (web, server, desktop). This fork adds a second renderer, `apps/lynx` (ReactLynx on Lynxtron), verified against the Electron app. Prioritize correctness, reliability, and predictable behavior during streaming, reconnects, and failures over short-term convenience.

## Packages

- `apps/server`: Node.js WebSocket server; runs provider sessions and serves the web app.
- `apps/web`: React/Vite UI, hosted in Electron by `apps/desktop`. Upstream owns it.
- `apps/lynx`: the fork's ReactLynx renderer. It compiles `apps/web` source directly and swaps platform pieces by alias. See [apps/lynx/AGENTS.md](apps/lynx/AGENTS.md).
- `packages/contracts`: schemas and protocol types only, no runtime logic.
- `packages/shared`: runtime utilities with explicit subpath exports, no barrel index.

## Upstream and the Lynx renderer

- Upstream (`Emanuele-web04/synara`) is read-only for this fork. Do not reshape upstream-owned files in `apps/web`; absorb platform differences on the Lynx side (aliases, platform ports, generated sources). Allowed edits there: `window.x` → `~/platform/x`, and `data-*` test hooks.
- Lynx-only code lives in `apps/lynx/src/{adapters,platform,main,data}` or `*.lynx.*` files.
- Layering, invariants, and the migration plan: [shared-state-architecture.md](apps/lynx/plan/shared-state-architecture.md).
- Verifying Lynx against Electron (`bun run compare:desktop`, cells, workflows, Computer Use): [verification-harness.md](apps/lynx/docs/verification-harness.md). Read it before running the harness. The short version: stop only processes you started, never bring an app forward, and a harness failure is not a product regression.

## Transcript and UI safeguards

- Auto-scroll follows live assistant output only. Buffering, reconnecting, pending approvals, and tool-only rows must not retrigger "new content arrived" stick-to-bottom.
- Keep the common transcript path simple. Add virtualization only with measured need, and never couple virtualizer measurement to a bottom-stick or height-follow cycle. Cover scrolling changes with focused transcript tests.
- Every open/close toggle reuses [disclosureMotion.ts](apps/web/src/lib/disclosureMotion.ts) and its components (`DisclosureRegion`, `CollapsiblePanel`, `DisclosureChevron`). No bespoke toggle animations.
- Reuse before you build. Extract shared logic instead of duplicating it across files.

## Local instance isolation

Use a separate home directory and unused ports when another Synara instance is running, and dry-run first:

`env -u SYNARA_AUTH_TOKEN SYNARA_PORT_OFFSET=3158 SYNARA_NO_BROWSER=1 bun run dev -- --home-dir ./.synara-pr84 --port 58090 [--dry-run]`

An inherited `SYNARA_AUTH_TOKEN` makes the browser WebSocket fail unless the web app uses the same token. Check listeners on both IPv4 and IPv6 (`lsof -nP -iTCP:<port> -sTCP:LISTEN`). An empty UI with a healthy `orchestration.getSnapshot` is a connection or hydration problem, not a reason to edit SQLite.

## Verification and completion

- Use the smallest relevant checks while iterating. Finish code changes with one pass of `bun fmt --check`, `bun lint`, and `bun typecheck`; all three must pass. If the user asks for code only, skip them and say so.
- Never run unscoped `bun fmt` (it rewrites the whole repository); format the files you changed with `bunx oxfmt <files>`.
- Never run `bun test`. Use `bun run test` (Vitest).
- Report actual checks, failures, and anything left unverified. A build that compiles is not proof that it runs.

## Models

Opus 5.5 is the default and does the main work itself: design, code, merges, and the primary Computer Use pass. Codex (gpt-6.1-sol, through `codex exec`) is an optional helper for independent review, verification, a second Computer Use pass, and parallel bulk work. Never use Haiku. Details and CLI mechanics: [docs/agent-models.md](docs/agent-models.md).
