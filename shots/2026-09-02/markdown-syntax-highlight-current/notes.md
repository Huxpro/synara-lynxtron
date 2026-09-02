# Markdown syntax-highlighting verification

Status: retained diagnostic Electron and Lynx-for-Web fast-loop evidence for the
commit-bounded fenced-code syntax-highlighting slice. This is functional
evidence for the highlighting change, not a replacement for the current whole
Markdown-surface fidelity pair.

## Identity

- Product commit: `356e765cf` (`fix(markdown): highlight fenced code`).
- Backend: `ws://127.0.0.1:56114/?token=synara-local-desktop-comparison`;
  server instance `30994021-afb1-4003-830b-654586051274`.
- Thread: `fidelity-markdown-highlight-20260902`, created through canonical
  `thread.handoff.create` from project
  `7853cb49-7a94-4541-ac06-7fd877f3f871` and deleted through canonical
  `thread.delete` after capture.
- Route: Electron `#/fidelity-markdown-highlight-20260902`; Lynx-for-Web
  `/lynx/index.html?route=%2Fthread%2Ffidelity-markdown-highlight-20260902`.
- Exported viewport: `1280x820`; all retained PNGs are exactly `1280x820`.
- Endpoint-pinned Lynx-for-Web bundle SHA-256:
  `9f441dddbfb7308f08dc117218096259ffad8a8a9bac408e7d8f8fedea3deaa6`.
- State: same canonical user/assistant messages, sidebar open, dock closed, and
  provider-update overlays dismissed through rendered controls before the
  retained captures.

## Fixture

The canonical transcript contains the user message `Show a concise JavaScript
example.` and an assistant response with a level-two heading, two unordered-list
items, a fenced JavaScript `greet` example, and an MDN link. No provider turn or
direct SQLite fixture write was used.

## Results

- Light: `1.7447387364498645%` RGB MAE.
- Dark: `1.5702392694882832%` RGB MAE.
- Both Lynx cells report `syntaxHighlightCallCount > 0` and a successful
  `lastSyntaxHighlightResult` with language `javascript`, path `snippet.js`,
  theme `light+dark`, and `error: null`.
- Both relay connections opened on their first attempt, reached socket state 1,
  identified the expected renderer-ready thread route, and reported no
  transport or RPC error. The retained Lynx page-error buffers are empty.

The screenshots are diagnostic rather than ledger-authoritative: Electron's
runtime reported DPR 2 while Lynx-for-Web reported DPR 1. The equal-size PNGs
therefore prove the product path and visual result but do not satisfy the strict
matched-DPR requirement for a scored replacement pair.

The code tokens now use the same visible syntax-color families as Electron. The
remaining dominant product residual is the narrower Lynx Markdown content rail
and fenced-code block. Because the new whole-frame MAE does not improve the
existing current Markdown pair (`1.2959141608879323%` light and
`1.4813689373106964%` dark), this evidence must not supersede that pair in the
fidelity-loss ledger.

## Harness notes

- An initial detached-worktree Electron launch failed before runtime identity
  because its generated app wrapper lacked Electron ICU resources. No frame
  from that launch was retained. The successful run used the same workspace's
  complete Electron 40.10.6 runtime with the detached worktree's staged app
  bundle, isolated home, user-data directory, CDP port, and backend.
- Failed dark attempts with incomplete transcript hydration, pre-relay capture,
  a theme mismatch, or an open overlay were discarded.
- Browser cleanup entry, retry, and exit gates all reported zero sessions and
  zero agent-browser-owned processes. Owned Vite, Electron, and backend
  processes were stopped, and ports 56530, 56531, and 56114 were released.
