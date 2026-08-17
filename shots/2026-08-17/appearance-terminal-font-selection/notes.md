# Appearance Terminal Font Selection

## Scope

The real terminal-font popup was opened in an isolated Settings instance and
the browser-published `JetBrains Mono` menu item received real pointer
activation.

## Evidence

- popup rows were published as browser menuitem refs:
  - `JetBrains Mono` (`@e7`);
  - `Fira Code` (`@e8`);
  - remaining suggestions through `Consolas`.
- Coordinate activation at the measured first-row center did not change state.
- Direct ref activation of `@e7` also left:
  - popup open;
  - terminal-font input empty;
  - isolated persisted terminal font unset.

## Classification

- This is not promoted to a Native product loss.
- Lynx-for-Web has repeatedly failed to dispatch dynamic custom-item events
  that are supported by the Native runtime; DOM event dispatch was not used to
  fabricate a pass.
- `native-terminal-font-suggestion-selection`: missing coverage remains
  `1.00`.
- Product-loss contribution remains unscored pending exact-owned Native input
  and persistence verification.
- A role/name click failed even though the item was published; the fresh direct
  ref click produced the retained evidence. Every failure was followed by the
  double-zero browser gate.
- Final cleanup reported `sessions: []` and zero agent-browser-owned processes.
