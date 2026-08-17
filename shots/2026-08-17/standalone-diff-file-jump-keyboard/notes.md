# Standalone Changes File Jump Keyboard Confirm

## Newly discovered scope

The searchable Changes file picker was exercised through keyboard confirmation
at `320x200`, DPR 1, dark:

- canonical files: `a.ts`, `target.ts`;
- query: `target`;
- action: real Enter key on the native search input.

## P1 product loss

The native search input supported a confirm event, but the file picker did not
handle it. Keyboard and IME search submission could not select the unique
result without a pointer.

`lynx-diff-file-jump-confirm-missing`: P1 component contribution
`1.00 -> 0.00`.

## Root fix

- Pointer rows and keyboard confirmation now share `jumpToFile`.
- Confirm selects only when the filtered result set contains exactly one file.
- Ambiguous and empty searches remain open for refinement.

## Runtime evidence

After real query input and Enter:

- overlay: closed;
- `a.ts`: remained collapsed at `34px`;
- `target.ts`: expanded from `34px` to `94px`;
- expanded patch contained `before` and `after target`;
- pending requests: `0`.

## Validation

- DiffDock Rstest: `3/3` passed.
- Lynx-for-Web production build passed: `4580.5 kB`.
- Web bundle SHA-256:
  `c60ced0c031cdf8668d89d20b76f6e83651edb68228b754f541eea6c4dc9c899`.
- Native/Desktop production build passed: `4286.5 kB`.
- Staged Native bundle SHA-256:
  `6a1397fde840bb0ff43ee93c050f6ae661a1e36a1e854892163d35eafc15036e`.
- Final cleanup reported `sessions: []`, zero agent-browser-owned processes,
  removed state/workspace, and repository screenshot count `100`.
