# Appearance Terminal Font Free-form Input

## Scope

The terminal-font input was brought into view in an isolated Settings
instance, then received a real browser `fill` action with
`Custom Mono XYZ`.

## Evidence

After the real fill action:

- native input value remained empty;
- popup remained open;
- no `No matching suggested fonts.` state appeared;
- isolated persisted terminal font remained unset;
- page errors: none.

## Classification

- This is not promoted to a Native product loss.
- Lynx-for-Web did not dispatch the native input change event, matching the
  separate custom menu-item dispatch limitation.
- `native-terminal-font-freeform-persistence`: missing coverage remains
  `1.00`.
- Product-loss contribution remains unscored pending exact-owned Native input,
  no-match, and persistence verification.
- DOM value mutation was not used to fabricate a pass.
- Final cleanup reported `sessions: []` and zero agent-browser-owned processes.
