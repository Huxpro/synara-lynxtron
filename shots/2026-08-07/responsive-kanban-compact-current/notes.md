# Responsive compact Kanban evidence

- Date: 2026-08-07
- Runtime: current Lynx-for-Web production bundle under a same-origin isolated
  Synara harness.
- Data: one real project and one real thread were created through canonical
  orchestration commands; no SQLite writes or renderer fixture.
- Theme/density: light / comfortable.
- Device pixel ratio: `1`.

## Web authority

The Web project board keeps three minimum-width columns inside a horizontal
scroll viewport:

- board container: `overflow-x-auto`;
- each column: `min-w-64` (`256px`).

The previous Lynx 900px fix intentionally let all three columns shrink because
they still measured 196px each. Extending that rule to compact windows,
however, would produce columns near 98px once the fixed sidebar leaves only a
344px main viewport.

## Fix

`KanbanScroller` is now the route's horizontal scroll owner. Compact windows
use a fixed 824px columns rail:

- 3 × 256px columns;
- two 12px gaps;
- 32px inline padding.

Medium and wide windows keep the existing equal-width, no-horizontal-scroll
layout.

## Geometry

At `600x820`:

- route viewport/client width: `344px`;
- horizontal scroll width: `824px`;
- max scroll offset: `480px`;
- each column: `256px`;
- populated card: `248px`;
- beginning and end screenshots prove all three columns are reachable.

At `900x820`:

- route viewport/client width: `644px`;
- scroll width equals client width (`644px`);
- all three columns remain simultaneously visible at `196px`;
- no horizontal scroll is introduced.

Artifacts:

- `compact-600.json`, `compact-600.png`, `compact-600-end.png`;
- `medium-900.json`, `medium-900.png`;
- `errors.txt`, `console.txt`, `bundle-hashes.txt`.

PNG dimensions match the requested viewports. Page errors are empty. Console
output contains only host setup logs and the registered upstream
`@lynx-js/web-core` deprecated-initialization warning.

## Verification

- Kanban responsive + list logic focused Rstest: `11/11`;
- Lynx-for-Web production build: pass;
- Native/Desktop production build: pass;
- React Doctor findings are the same six pre-existing `FeatureListsPage.tsx`
  findings; none points to the new scroll-view or compact CSS.

The named browser sessions, `58125/9004` harness, staged `/lynx` assets, and
temporary isolated home were removed after capture.
