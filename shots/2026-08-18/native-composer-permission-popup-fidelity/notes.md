# Native Composer Permission Popup Fidelity

## Before

The runtime permission popup reused generic Native menu anatomy:

- popup: `188x116`;
- generic row minimum: `32px`;
- labels: bare text only;
- Full access and Default permissions omitted the Web leading icons.

The trigger itself had already been calibrated, but the popup read like an
oversized modal and did not match the Web permission control.

## Fix

- Keep the existing shared Full access -> Default permissions order and radio
  state.
- Render the exact Central `shield-access` icon for Full access.
- Render the exact `HiOutlineHandRaised` path used by Web for Default
  permissions.
- Use scoped `196px` popup width, content-sized height, and `5px` padding.
- Use `26px` rows with `3px 8px` padding.
- Use `16px` leading icons, `12px/18px/400` labels, and the existing `12px`
  selected check with an `8px` separation.

The `196px` width is the smallest verified Native width that keeps the longer
Default permissions label on one line while its selected indicator is present.
The font was not reduced to hide the overflow.

## Exact Native result

- final bundle SHA-256:
  `702e461054512b9d9b071864c0ae44244e8a357eb5d7ff0ba18034eef16ff638`;
- exact-owned PID: `72099`;
- PID-derived DevTool client: `localhost:8903`, session `1`;
- trigger remained `118x28`;
- popup: `196x64` border box, `184x52` content box;
- Full access label row: `18px` high;
- Default permissions label row: `18px` high while selected;
- row rhythm: `26px`;
- both exact Web icon paths were present;
- one selected radio indicator was present;
- real Full access -> Default permissions interaction succeeded;
- Native warning/error console was empty.

## Verification and cleanup

- Focused Composer test: `1 file / 4 tests`.
- Native/Desktop production build: passed with existing registered warnings.
- Default `kv.json` and `window-state.json` restored byte-exact after every
  owned Native run.
- No screenshot was retained; repository screenshot count remained `100`.
- Entry/failure/exit `browser:gate` returned `sessions: []` and zero
  agent-browser-owned processes.
