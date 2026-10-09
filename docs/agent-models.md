# Agent model selection

Operator preferences for this fork.

## Roles

- **Opus 5.5 is the default and does the main work itself:** architecture and design, writing code, merges, and the primary Computer Use pass. Claude subagents inherit it; do not pick a different Claude model without a reason. Never use Haiku.
- **Codex (gpt-6.1-sol) is the helper.** Good uses: an independent code review, verification runs, a second Computer Use pass, and well-separated bulk work in parallel. It is optional: use it when it adds a second opinion or saves wall-clock time, not by default.
- The session that owns a piece of work stays responsible for it. Review what a helper produced before committing it, and resolve merges yourself or review every resolution.

## Mechanics

- Codex runs through the CLI: `codex exec -m <model> … < /dev/null` or `codex review`. Pass the model explicitly and close stdin, or a background run waits forever. Use `-s read-only` for review and investigation.
- As of 2026-10-09 the API rejects `gpt-6.1-sol` for this ChatGPT account ("not supported when using Codex with a ChatGPT account"). Until that changes, use `-m gpt-5.6-sol`. Retry `gpt-6.1-sol` first when starting a new piece of helper work.
- Codex Computer Use from `codex exec` needs the operator's interactive per-app approval and cannot reach the Lynx DevTool port from its sandbox; plan for that before relying on it.
- Codex runs can exceed a 10-minute shell timeout: run in the background and wait for a report file.
- Parallel Codex implementation runs need separate worktrees.
- Inside workflows the `model` parameter takes only Claude models, so wrap Codex in a thin low-effort agent that writes the prompt, runs `codex exec`, and returns the report. Label it with the Codex model name; the UI otherwise shows the wrapper's model.

## Briefing a Codex task

The result depends on the brief: state the goal, context, constraints, files in scope, deliverables, non-negotiable decisions, and how to verify. Ask it to inspect the current state first, finish end to end, and report changes, verification, and remaining risks. Do not split work only because it is large.
