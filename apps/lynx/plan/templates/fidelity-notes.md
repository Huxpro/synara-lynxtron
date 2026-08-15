# <screen> — fidelity certification

## Browser lifecycle gate

Complete this checklist for every fast or Native loop, including loops that do
not intend to open a browser:

- Entry `bun run browser:cleanup`: `pass | fail`
- All browser commands wrapped by `bun run browser:run -- ...`: `yes | n/a`
- Exit `bun run browser:cleanup`: `pass | fail`
- Final `agent-browser session list --json`: `sessions: [] | fail`
- Final agent-browser-owned daemon/browser process count: `0 | fail`

Any nonzero session or owned process is a harness leak. Stop the loop, clean it
up, record the harness failure, and do not retain evidence, commit, push, or
start the next loop until both final values are zero. Never terminate unrelated
Chrome or remote-debugging processes.

## Run identity

- Task:
- Date:
- Web commit/worktree state:
- Lynx commit/worktree state:
- Synara server URL:
- Snapshot/thread/project identity:
- Theme: `light | dark`
- Viewport: `1280×820 | 1440×900`
- Web screenshot:
- Lynx screenshot:
- Metrics artifact:

## Source reuse

- Web entries:
- Eligible modules / LOC:
- Reused modules / LOC:
- Module reuse:
- LOC reuse:
- Gate = min(module %, LOC %):
- Target ≥70%: `pass | fail`
- EXCLUSIVE modules:

## Fidelity checklist

| Area | Web evidence | Lynx evidence | Result |
|---|---|---|---|
| shell/sidebar anchors ≤8px | | | |
| header/content anchors ≤8px | | | |
| cards/rows/columns anchors ≤8px | | | |
| typography size delta ≤2px | | | |
| weight/line-height hierarchy | | | |
| semantic background/foreground | | | |
| border/selected/elevated/focus tokens | | | |
| content/order/counts | | | |
| empty/loading/error state | | | |
| scoped interaction state | | | |

## Difference budget

Every accepted difference needs one entry. “Lynx limitation” without API/runtime evidence is not
an exemption.

| Exemption ID | Region (x,y,w,h) | Classification | Evidence | User impact | Fallback | Owner/expiry |
|---|---|---|---|---|---|---|
| | | `🔧 / 🔀 / ⬆️` | | | | |

Mask rules:

- Only anti-aliasing, native caret/selection/scrollbar or another small platform-drawn region may
  be masked.
- Record exact pixel bounds and why comparison is meaningless there.
- Never mask a whole panel, component, text block or layout boundary.
- Masked area must be reported as a percentage of the viewport.

## Interaction evidence

| State/action | Web | Lynx | Result/notes |
|---|---|---|---|
| default | | | |
| hover/active | | | |
| focus/keyboard | | | |
| scroll/resize | | | |
| overlay/dismiss | | | |

## Verdict

- Unregistered major differences: `0 required`
- Reuse gate:
- Fidelity gate:
- Follow-ups:
