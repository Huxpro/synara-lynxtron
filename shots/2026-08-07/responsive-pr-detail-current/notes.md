# Responsive Pull Request detail evidence

- Date: 2026-08-07
- Real repository: `/Users/bytedance/github/synara`
- Real pull request: `Emanuele-web04/synara#529`
- Native data setup: canonical Web `project.create` product flow against the
  same isolated server later used by Native; no SQLite writes or synthetic
  pull-request fixtures.
- Native service: isolated unauthenticated server at
  `ws://127.0.0.1:58120`.
- Native bundle:
  `apps/lynx/dist/desktop/main.lynx.bundle`
- Bundle SHA-256:
  `a9713487d64cf862af6c7e95e9b7121b835260d91af399158d1539a33bc52ce3`
- Exact-owned final Native PID/client/session:
  `77370` / `localhost:8903` / `1`.
- Fresh Native warning/error console: empty.

## Web authority

The existing Electron reference opened the same real PR through the rendered
list row on its own existing real service. It is the product composition
authority, not a same-snapshot paired cell. At its `1313x852` content viewport:

- main/list surface: `x=256..784`, width `528`;
- right dock: `x=785..1313`, width `528`;
- the open layout is an exact 50/50 split;
- Summary, Timeline, and Code remain visible in the dock header.

Artifacts:

- `electron-1313x852.png`
- `electron-layout.json`

## Native before

At the Desktop minimum `900x650`, the open route body has only `644px` after
the fixed `256px` sidebar. The old split produced:

- list scroller: `x=256..540`, width `284`;
- selected row: `x=272..524`, width `252`;
- detail dock: `x=540..900`, width `360`.

The dock's `360px` minimum therefore squeezed the list below a useful
master-list width. The list and dock still had separate scroll owners, but the
horizontal composition was not usable.

Artifacts:

- `before/native-900x650.png`
- `before/layout.json`
- `open-before/native-900x650.png`
- `open-before/layout.json`

## Native after

The real selected PR now projects `SharedPrRouteBody--detail-open`.

At `900x650` (`SliceRoot--viewport-medium`):

- the list scroll viewport resolves to `0x0`;
- the detail dock owns the full remaining `644x604` route body;
- the detail scroller owns `644x506`;
- the real Close action restores the list scroller to `644x604` and unmounts
  the detail dock.

At `1440x900` (`SliceRoot--viewport-wide`), the Web-authority split remains:

- list scroller: width `592`;
- detail dock: width `591` plus its 1px divider;
- detail scroller: width `591`.

Artifacts:

- `after-900/native-900x650.png`
- `after-900/layout.json`
- `after-1440/native-1440x900.png`
- `after-1440/layout.json`

## Verification

- Focused Rstest:
  `src/app/PullRequestResponsiveLayout.lynx.test.ts` — `3/3`.
- Native/Desktop production build passed with the usual unsupported Lynx CSS
  and optional `ws` native-addon warnings.
- React Doctor scanned the changed component. Its six findings are pre-existing
  giant-component, Native-property, async-loop, and chained-iteration findings;
  no diagnostic points to the new detail-open projection.
- The exact-owned Native process, isolated server/Web ports, named browser
  session, and temporary home were removed. The temporary Electron-reference
  project was removed through canonical `project.delete`; its projection keeps
  the expected tombstone event rather than claiming byte-exact state restore.

This slice closes the Pull Request list/detail responsive decision. It does not
certify the thread Environment panel, diff/browser docks, or selection-action
overlays.
