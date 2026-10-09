# Agent model selection

Operator preferences for this fork. Rankings, higher = better. Cost reflects what the operator actually pays (OpenAI is near-free), not list price. Intelligence is how hard a problem the model can take unsupervised. Taste covers UI/UX, code quality, API design, and copy.

| model       | cost | intelligence | taste |
| ----------- | ---- | ------------ | ----- |
| gpt-5.6-sol | 9    | 8            | 5     |
| sonnet-5    | 5    | 5            | 7     |
| opus-4.8    | 4    | 7            | 8     |
| fable-5     | 2    | 9            | 9     |

## How to apply

- These are defaults, not limits. If a cheaper model's output does not meet the bar, redo the work with a smarter model without asking. Judge the output, not the price.
- For anything that ships: intelligence > taste > cost. Cost is a tie-breaker.
- Use cheaper models to gather information and try things before moving work to an expensive one.
- Bulk or mechanical work with a clear spec (implementation, data analysis, migrations): gpt-5.6-sol is a good fit and effectively free, but optional. Use it when it buys parallelism or time.
- Merges and conflict resolution are judgment work: the session that owns the merge resolves it or reviews every resolution. Codex may help in parallel on well-separated parts.
- Anything user-facing (UI, copy, API design) needs taste ≥ 7.
- Reviews of plans and implementations: fable-5 or opus-4.8, optionally gpt-5.6-sol as an independent second view.
- Never use Haiku.

## Mechanics

- Claude models run through the Agent/Workflow `model` parameter.
- gpt-5.6-sol is reachable only through the Codex CLI: `codex exec -m gpt-5.6-sol … < /dev/null` or `codex review`. Pass the model explicitly (`gpt-6.1-sol` is rejected for this account) and close stdin, or a background run waits forever. Use `-s read-only` for investigation.
- Codex runs can exceed a 10-minute shell timeout: run in the background and wait for a report file.
- Inside workflows the `model` parameter takes only Claude models, so wrap Codex in a thin `sonnet` agent at low effort that writes the prompt, runs `codex exec`, and returns the report. Label it `gpt-5.6-sol:<task>`; the UI otherwise shows the wrapper's model.
- Parallel Codex implementation agents need separate worktrees.

## Briefing a long Codex task

gpt-5.6-sol handles large multi-step tasks well; do not split work only because it is large. The result depends on the brief: state the goal, context, constraints, files in scope, deliverables, non-negotiable decisions, and how to verify. Ask it to inspect the current state first, finish end to end, and report changes, verification, and remaining risks.
