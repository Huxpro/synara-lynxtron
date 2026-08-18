# Settings Search Route Persistence

## New Scope

- Settings sidebar search with query `terminal font`;
- ranked two-result state;
- Enter selects the top result;
- no-result state with `zzzx-no-setting`;
- section and target identity across the Lynx memory history and desktop shell;
- Native deep-link target positioning at `1250×896`, light theme;
- Lynx-for-Web Escape-key delivery boundary.

Web authority and Lynx-for-Web used the same server, settings projection,
theme, viewport, DPR, and initial General section.

## Discovery

Both renderers returned the same ranked results:

1. Appearance → Terminal font
2. Appearance → Terminal font size

Both rendered `No matching settings.` for the no-result query.

Web Enter changed the URL to:

`/settings?section=appearance&target=setting-terminal-font`

and cleared the query.

Lynx Enter changed the visible panel and cleared the query, but Settings used
component-local `setSection`. The memory history and desktop
`shellRouteChanged` mirror remained on the previous section. Cmd+R or renderer
restart could therefore reopen the old Settings section, and search targets
were not durable.

Native startup also discarded general Settings targets. The host accepted
only `environment-panel` and `provider-updates`, so
`target=setting-terminal-font` never reached the renderer. The existing
background-thread `scrollIntoView` call also ran before the target was stable
in the Native main-thread tree.

These were P1 navigation and interaction reliability losses.

## Fix

- Settings section selection and search selection now use one router callback.
- Settings locations use the canonical shape
  `/settings/<section>?target=<anchor>`.
- Memory-history subscriptions parse `location.href`, preserving search
  parameters.
- Desktop deep-link parsing preserves any non-empty Settings target in both
  init data and the initial route.
- The renderer accepts any non-empty Settings target instead of a two-value
  host whitelist.
- Native target positioning runs on the main thread after a bounded layout
  settle and repeats three times to absorb mount/layout timing.
- The Settings content scroll owner now has a stable id.

The route codec has executable round-trip tests; the change does not rely only
on source-string or screenshot proxies.

## Outcome

- Web and Lynx-for-Web result screenshots are both `1250×896`.
- Web Enter:
  - URL contains `section=appearance`;
  - URL contains `target=setting-terminal-font`;
  - search query is empty.
- Lynx-for-Web Enter:
  - search query is empty;
  - `setting-terminal-font` exists at `622×96 @ (442,669)`.
- Final Native deep link:
  `synara://settings/appearance?target=setting-terminal-font`.
- Final Native target:
  - border box `622×96 @ (505,669)`;
  - content box `598×76 @ (517,679)`;
  - visible inside the `896px` content viewport.
- Exact Native error/warning console: empty.

The first Native target probes correctly exposed that section navigation alone
was insufficient: the page remained at the top. Those diagnostic screenshots
stayed in `/tmp` and were not retained or counted as passing evidence.

## Harness Separation

`agent-browser press Escape` clears the Web input but the Lynx-for-Web native
input does not deliver `catchkeydown` for Escape. The product handler and
Native input contract use `event.key === 'Escape'`; this is retained as a
Lynx-for-Web input-delivery harness boundary, not counted as a Native product
loss.

An initial PID-directed synthetic Cmd+R did not activate the background app's
menu key equivalent. It was rejected as harness evidence. Native route
persistence instead uses the already-certified Cmd+R owner, exact shell route
mirroring, deep-link route round-trip tests, and final production restart.

## Verification

- focused Settings search/route/shell suite: `35/35`;
- Lynx-for-Web production build: passed;
- Native/Desktop production build: passed;
- staged Native bundle SHA-256:
  `81a8472eb56edb917d99bd571f419398df5cef9820c7cc48e100ba25016e7639`;
- staged desktop main SHA-256:
  `3bda3e635d0be05293ba2fe79d9f4182fb4c51ce3b83c9771c2e7d6c3182115e`;
- final exact-owned Native PID: `60980`;
- PID-derived DevTool client: `localhost:8902`, session `1`;
- local screenshot count: `100`;
- browser ownership gate: zero sessions and zero owned processes.

## Evidence

- `web/results-light-1250x896.png`
- `web/results.json`
- `web/enter.json`
- `web/empty.txt`
- `web/errors.json`
- `web/console.json`
- `lynx/results-light-1250x896.png`
- `lynx/results.json`
- `lynx/enter.json`
- `lynx/empty.json`
- `lynx/errors.json`
- `lynx/console.json`
- `native/sessions.json`
- `native/target-geometry.json`
- `native/target-row.json`
- `native/console.json`
- `loss.json`

The two historical Workspace compact Lynx PNGs were byte-identical and remain
represented by labeled remote assets in the screenshot manifest. Their local
duplicate bytes were removed to preserve the 100-image local cap without
dropping either historical matrix record.

## Ledger Outcome

- fidelity loss: `11.3023 → 11.2436`;
- loss delta: `-0.0587`;
- Web/Lynx visual parity: `99.6636%`;
- component contribution:
  - scope: `-0.0637`;
  - completeness: `+0.0050`;
  - visual: `0`;
  - reliability: `0`;
- visual rolling median remained `1.3917%`;
- no regression change was recorded.
