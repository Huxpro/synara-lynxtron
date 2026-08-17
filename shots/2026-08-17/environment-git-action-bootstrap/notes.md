# Environment Git Action Bootstrap

## Newly discovered scope

The previous Git-action dialog gap was revisited with two real local
repositories:

- a changed repository without a remote;
- a changed repository with a local bare `origin` and tracked `main`.

Both used canonical project/thread records and `environment=open`.

## P1 product loss

Before the fix, `Commit and Push` remained
`EnvironmentGitActionTrigger--disabled` even when:

- the repository had a branch;
- working-tree changes existed;
- `origin` and upstream were healthy.

Root cause:

- Environment bootstrap supplied only `GitStatusLocalResult`;
- `EnvironmentPanel` initialized parent `gitStatus` to `null`;
- `bootstrapOnly` prevented `EnvironmentChanges` from fetching the full
  `GitStatusResult`;
- Git-action menu derivation therefore never received status and remained
  disabled for the lifetime of the mounted page.

`lynx-environment-bootstrap-git-actions-disabled`: P1 component contribution
`1.00 -> 0.00`.

## Root fix

`EnvironmentChanges` now performs the full status refresh whenever the
Environment panel is open, including bootstrap-mounted pages. Other
bootstrap-only queries remain suppressed.

The lightweight bootstrap result still provides immediate Changes content;
the full result then synchronizes parent Git-action availability.

## Runtime evidence

With a real local bare `origin`, tracked `main`, and a working-tree change:

- before:
  `LxMenuTrigger EnvironmentGitActionTrigger EnvironmentGitActionTrigger--disabled`;
- after:
  `LxMenuTrigger EnvironmentGitActionTrigger`;
- label remained `Commit and Push`;
- trigger geometry remained `274x26`, center `(164,192)`;
- page errors: none.

## Validation and boundary

- Environment Rstest: `8/8` passed.
- Lynx-for-Web production build passed: `4581.7 kB`.
- Web bundle SHA-256:
  `7e28ceced264e5ae1862937b864ba16f40e346971753d7710a6543de03dfa801`.
- Native/Desktop production build passed: `4287.2 kB`.
- Staged Native bundle SHA-256:
  `2b4f228c44ccbe3e181f8cf548ad68a38051cc5832dad735a20596e91696a471`.
- Lynx-for-Web did not publish the enabled custom trigger in its browser
  accessibility tree, and coordinate activation did not dispatch its Menu
  event. The Git-action popup and dialog remain Native interaction coverage;
  no disabled state was bypassed and no Git action ran.
- Several fixture retries reused stale command receipts before the final
  self-contained `x7` run. Every failure was followed by the double-zero gate.
- Final cleanup reported `sessions: []`, zero agent-browser-owned processes,
  and removed local repositories/state.
