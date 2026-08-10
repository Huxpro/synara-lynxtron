# Empty-thread null branch current-head evidence

- Shared isolated server: `ws://127.0.0.1:58970`.
- Shared origin: `http://127.0.0.1:10103`.
- Canonical product-RPC fixture: project `project-branch-current`, thread
  `thread-branch-current`, workspace
  `/private/tmp/synara-branch-current-workspace`.
- The retained thread snapshot explicitly reports `branch:null`.
- Named Web and Lynx-for-Web browser sessions used `1280x820`, DPR 1.
- Both retained PNGs are exactly `1280x820`; page-error buffers are empty.
- Web tray: `Branch Current / Local / Temporary`,
  `400/536.75/736x58`.
- Lynx tray: `Branch Current / Local / Temporary`,
  `400/497/736x58`.
- Both page projections contain no standalone `main` token.
- Lynx exposes exactly one `.EmptyThreadContextStatus`, `Local`; no branch
  status node is rendered for the null snapshot.
- The vertical coordinate differs because provider-health presentation differs
  between the two fresh sessions; tray width, height, content, and branch
  absence are the retained comparison.
- Lynx console contains only the named upstream Web Elements
  deprecated-initialization warning.

Rendered regressions separately prove that a real `feature/fidelity` snapshot
renders exactly that branch and that a null snapshot never invents `main`.
