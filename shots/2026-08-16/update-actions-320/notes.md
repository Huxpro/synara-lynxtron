# Update actions at 320px

## Scope and authority

`/update` is a Lynxtron-only surface, so there is no Web authority parity cell.
This loop uses:

- Lynx-for-Web at `320x568`, DPR `1`, dark, as a compact layout preflight;
- exact-owned Native at the supported `900x650` minimum as the host behavior
  and interaction boundary.

The preflight host does not implement the desktop updater bridge result, so it
remained on the safe idle status. The action geometry is independent of the
release result and is comparable across idle/available/error states.

## P1 product loss

Before the fix, the `178px` compact action rail kept two buttons in one row:

- Check for updates: `80.41x61`;
- Open download page: `88.59x61`;
- action group: `178x61`.

The controls became narrow, unusually tall multiline buttons instead of the
canonical 32px actions.

`lynx-update-320-action-compression`: P1 component contribution
`1.00 -> 0.00`.

## Root fix

The canonical wide action row is unchanged. Under
`SliceRoot--viewport-compact`, Update actions now:

- stack vertically;
- use the full available width;
- preserve canonical button height.

## After evidence

At the same `320x568` dark cell:

- card remained fully contained at `248x400 @ (36,84)`;
- action rail became `178x73`;
- Check for updates became `178x32`;
- Open download page became `178x32`;
- gap remained `9px`;
- no page error occurred.

The Update title still wraps in the narrow card. That is accepted responsive
copy wrapping and is not used to score the action loss.

## Native regression boundary

Exact-owned Native used:

- PID `56113`;
- PID-derived `localhost:8902/session 1`;
- exact staged production bundle;
- `900x650`, medium viewport.

The ordinary medium action row remained horizontal:

- group `290x32`;
- Check action `132x32`;
- Open action `149x32`.

A real exact-client touch on Check for updates issued a second
`bridge.updaterCheck`. Warning/error console was empty.

## Verification and cleanup

- Focused Update suite: `1` file / `4` tests.
- Lynx-for-Web production build: passed.
- Native/Desktop production build: passed with registered warnings only.
- Output/staged Native bundle SHA-256:
  `ca86d22a1236c459352d723eac73ba99ef4bfe204707de56c5bdb25cb530c50d`.
- Browser entry/exit cleanup passed.
- Exit returned `sessions: []` and zero agent-browser-owned processes.
- No screenshot was retained; local count remained `100`.
- Owned server/Web/Native processes and temporary state/stage were removed.
