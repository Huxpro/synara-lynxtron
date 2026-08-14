# Lynx Environment default-open preference

## Newly discovered scope

- Settings exposes `environmentPanelDefaultOpen` and describes the same Web
  behavior: normal threads open Environment automatically; centered empty
  landings and constrained surfaces stay closed.
- Lynx before ignored the setting entirely and only opened Environment when
  the verification URL supplied `environment=open`.
- Lynx after reuses Web's `resolveDefaultEnvironmentPanelOpen` policy and
  persists explicit header toggles through the canonical General settings
  projection.

## Product behavior

- Default-open applies only when:
  - a real thread is available;
  - the thread is not the centered empty landing;
  - the surface is not terminal-primary or constrained.
- An explicit user toggle overrides the setting for the current thread and
  persists the new default.
- Opening Files, Changes, Editor, or Settings closes Environment only for the
  current surface; it does not overwrite the persisted default.
- The deterministic `environment=open` verification state remains an explicit
  override.

## Runtime evidence

- Isolated server: `ws://127.0.0.1:58090`.
- Isolated state:
  `.synara-fidelity-environment-default/dev/state.sqlite`.
- Canonical project and two empty threads were created through
  `orchestration.dispatchCommand`.
- Settings mirror contained `environmentPanelDefaultOpen: true`.
- Empty thread without an explicit override:
  - Environment overlay existed but did not have
    `EnvironmentOverlay--open`;
  - this preserves Web's centered-empty exclusion.
- The same thread with `environment=open`:
  - overlay resolved to
    `EnvironmentOverlay EnvironmentOverlay--open`;
  - real Git status, branches, local servers, repository, editor,
    instructions, and notepad paths loaded.
- Focused tests also exercise the shared resolver's normal-thread
  `settingsDefaultOpen: true -> true` policy and its empty/constrained
  exclusions.
- Retained frame:
  `empty-thread-closed-light-1280x820.png`, verified at `1280x820`, DPR 1.

## Harness classification

- The public client command schema correctly rejected
  `thread.messages.import`; it is an internal orchestration command and was not
  used to manufacture a populated fixture.
- Starting a real provider turn solely to create a non-empty fixture would
  have external provider side effects and was also unavailable because Codex
  is not installed in the isolated environment.
- Therefore runtime evidence covers the empty exclusion and explicit override;
  the normal populated-thread branch is covered by the exact shared Web
  resolver and its existing focused tests.
- Native exact-client certification remains blocked by the user-owned
  Lynxtron client on `localhost:8901`; no Native pass is claimed.

## Loss ledger

- `lynx-environment-default-open-ignored`: P1 product behavior,
  contribution `1.00 -> 0.00`.
- `environment-populated-fixture-command-rejected`: harness/fixture boundary,
  contribution `0.00` product loss.
- `native-environment-default-devtool-fixed-port`: harness blocker,
  contribution `0.00` product loss.
