# Pull Requests Special Empty at Constrained Compact Height

## Newly discovered scope

This loop combined a state that had not been exercised as one product story:

`two repositories × React project × Reviewing × Merged × dark × 320x320`

The interaction used rendered controls in this order:

1. All projects + Open;
2. React project;
3. Reviewing involvement;
4. Merged state;
5. return to Open while retaining Reviewing + React;
6. return to All involvement.

## Shared snapshot and prerequisite

Both projects were created through canonical
`orchestration.dispatchCommand`; SQLite was never edited:

- `Synara Project` -> `Emanuele-web04/synara`;
- `React Project` -> `facebook/react`.

The retained post-fix run used:

- server instance:
  `7c711f79-06ce-457c-baa9-d74187744ca4`;
- snapshot sequence: `2`;
- one shared origin: `http://localhost:8891`;
- separate Web original and Lynx-for-Web named sessions;
- dark theme;
- `320x320`, DPR 1;
- Web and Lynx temporary PNGs exactly `320x320`, deleted after validation.

Before browser interaction, canonical `pullRequests.list` proved 50 real,
zero-error `facebook/react` entries in both Open and Merged. The special empty
state therefore came from the product's Reviewing/non-Open contract, not from
missing repository data.

## Product loss

Before the fix, both renderers retained the correct project, involvement,
state, copy, and accessibility values, but the special empty anatomy was not
usable at `320x320`.

### Before

| Metric | Web original | Lynx-for-Web |
|---|---:|---:|
| Empty shell | `280x256 @ y=182..438` | `264x256 @ y=226..482` |
| Title | `y=246..330`, 84px / 3 lines | `y=290..374`, 84px / 3 lines |
| Description | `y=334..374` | `y=378..418` |
| Visible viewport bottom | `320` | `320` |
| Scroller `scrollTop` after real wheel | `0` | `0` |

Web clipped the final 10px of the title and all description copy. Lynx exposed
only the first 30px of the 84px title and none of the description. A real
`agent-browser mouse wheel 120` over each scroller did not move either
`scrollTop`.

Classification:

- `pull-requests-special-empty-compact-unreachable`:
  P1 product contribution `1.00`;
- the 44px Web/Lynx vertical offset remained the already registered compact
  titlebar platform delta, but it did not explain the shared oversized empty
  anatomy.

## Root cause and fix

The shared Pull Requests empty state inherited desktop spacing:

- `64px` vertical padding;
- `24px` horizontal padding;
- `180px` minimum height.

At constrained compact height, the long special title wrapped to three lines
and the fixed spacing moved the status copy beyond the initial viewport.

The fix:

- adds a named `480px` constrained-height breakpoint without changing the
  existing `<320px` short-height contract;
- projects `SliceRoot--viewport-constrained-height` for Lynx;
- applies the compact empty correction only when width is compact and height
  is constrained;
- removes the empty minimum height and padding and compensates the parent
  `8px` gap;
- keeps the same title/description typography and semantic announcement.

Web uses the equivalent
`(max-width: 480px) and (max-height: 480px)` rule. Normal compact tall
viewports are unaffected.

## After

At `320x320`:

| Metric | Web original | Lynx-for-Web |
|---|---:|---:|
| Empty shell | `280x100 @ y=174..274` | `264x100 @ y=218..318` |
| Title | `y=174..230`, 56px / 2 lines | `y=218..274`, 56px / 2 lines |
| Description | `y=234..274` | `y=278..318` |
| Root height class | Web media contract | `SliceRoot--viewport-constrained-height` |

The title and description are now fully visible at `scrollTop=0` in both
renderers. Real wheel input remains a no-op because no recovery scroll is
needed.

The full interaction contract also passed:

- React project trigger remained selected;
- Reviewing and Merged both published `aria-pressed=true`;
- Web URL retained
  `involvement=reviewing&state=merged&projectId=project-react`;
- returning to Open retained Reviewing and React in both clients;
- returning to All restored real React rows.

At `390x844`, the non-regression cell proved:

- Lynx root did not contain the constrained-height class;
- original 64px vertical empty padding remained;
- Web empty remained `350x228`;
- Lynx empty remained `334x228`;
- all copy stayed fully visible;
- both page-error surfaces remained empty.

Classification after:

- `pull-requests-special-empty-compact-unreachable`:
  P1 product contribution `1.00 -> 0.00`;
- new combined interaction scope:
  missing coverage `1.00 -> 0.00`;
- 44px compact titlebar offset:
  intentional platform delta.

## Console and harness classification

Lynx-for-Web reported only the named upstream deprecated initialization
warning.

The Web Vite development client intermittently logged a TanStack Router
`_nonReactive` TypeError in some long-lived runs. It was absent in other fresh
runs of the same full interaction, did not produce a page error, and did not
change URL, state, rows, or geometry. It remains explicitly recorded as
non-deterministic development-harness noise and a residual risk; it is not
used to claim a console-clean cell or hidden as a product pass.

Rejected harness work included:

- attempting to restore the temporary harness from the wrong JSONL payload
  shape;
- a truncated shell-function source check;
- escaped selector and multiline/base64 transport defects inherited from an
  initial temporary script;
- an over-broad live data probe interrupted after excessive latency;
- current React Closed returning no canonical rows.

Every failed script, failed probe, interruption, and tool failure was followed
by `bun run browser:gate` before the next browser command. All gates reported
`sessions: []` and zero agent-browser-owned processes.

## Verification

- focused Web tests:
  `4 files / 17 tests` passed;
- focused Lynx tests:
  `4 files / 18 tests` passed;
- Web production build:
  passed, `8,953` modules;
- Lynx-for-Web production build:
  passed;
- Native/Desktop production build and staging:
  passed;
- React Doctor changed-lines scan against parent commit
  `e023f65229be92b4f0bff09fbe1b56b98fe2cf1d`:
  `4 files`, `0 errors`, `0 warnings`, complete;
- Lynx-for-Web bundle:
  `be72834c744321ddb9a657180736dedf620bb6ac2726aea2bc70348c74f6a686`;
- Native source/staged bundle:
  `c82671de96a9a907701b06741e3069386a8c9158b89d518fa08ed7b2ca157578`.

Native runtime interaction remains harness missing coverage under the existing
exact-owned DevTool registration blocker. A successful Native build is not
presented as Native certification.

All isolated repositories/state and temporary PNGs were removed, ports
`58090` and `8891` were free, and repository screenshot count remained `100`.
