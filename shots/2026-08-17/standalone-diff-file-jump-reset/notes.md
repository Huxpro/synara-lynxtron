# Standalone Changes File Jump Reset

## Newly discovered scope

The new file-jump overlay was exercised at `320x200` with a canonical two-file
diff:

- input: `no-such-file`;
- state: zero matching rows;
- close/reopen intent: search state must not leak between picker sessions.

## Runtime evidence

- no-match copy: `No matching files.`;
- copy geometry: `y=87..127`;
- overlay remained fully contained in the compact viewport.

## State fix

All picker close paths now reuse `closeFileJump()`:

- Escape;
- backdrop;
- explicit Close;
- successful file selection.

The helper closes the overlay and clears the query atomically, preventing a
stale no-match state on the next open.

## Verification and boundaries

- DiffDock Rstest: `3/3` passed.
- Lynx-for-Web production build passed: `4580.4 kB`.
- Web bundle SHA-256:
  `ae09b9b8f16a248fedb5886e0ac57ac5c898e0f17b089b9cccdaa6ebcaca3c9b`.
- Native/Desktop production build passed: `4286.3 kB`.
- Staged Native bundle SHA-256:
  `dbdd041a62f89e6776252caa90df52c8043c65e9f3a30b8383bc0a7c7f478b7d`.
- Lynx-for-Web did not publish the custom Close button in its browser
  accessibility tree, and coordinate Close plus Escape did not dispatch the
  native custom events. Native close/reopen interaction therefore remains
  platform certification coverage rather than a claimed browser pass.
- The shared close helper and focused source contract prove state cleanup
  without using DOM event dispatch.
- Final cleanup reported `sessions: []`, zero agent-browser-owned processes,
  removed states/workspaces, and repository screenshot count `100`.
