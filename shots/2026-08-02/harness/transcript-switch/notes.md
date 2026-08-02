# Thread-switch transcript scroll proof

- Scope: explicit `A -> B -> A` route switching against the same isolated
  server snapshot, at `1280x820`, DPR 1, light theme.
- Thread A: `thread:1785617357970-wy83hd92` (`Draft seed task`, long
  transcript).
- Thread B: `thread:1785617358009-27qsurd4` (`In Progress seed task`, short
  transcript).
- The detached A state was created by moving the real transcript scroll node
  upward by 2400 px and dispatching its scroll event; all route changes used
  pointer activation on the rendered sidebar rows.

## Lynx-for-Web result

1. A initially loaded at the live edge: `scrollTop=28416`,
   `scrollHeight=29055`, `clientHeight=639`, distance to bottom `0`.
2. A detached at distance `2400`; the `Scroll to bottom` affordance rendered.
3. B finished loading at its own live edge: `scrollTop=421`,
   `scrollHeight=1060`, `clientHeight=639`, distance `0`.
4. Returning to A produced `scrollTop=28443`, `scrollHeight=29097`,
   `clientHeight=639`, distance `15`. This is inside the 30 px pinned
   tolerance and the jump affordance was absent.

The B route did not inherit A's 2400 px detached offset, and returning to A did
not land at the top or at a stale intermediate offset. The keyed thread page
creates a fresh transcript controller for each route and restores that
transcript to its live edge.

## Web-original comparison

1. A initially loaded at its live edge: `scrollTop=15927`,
   `scrollHeight=16610`, `clientHeight=683`, distance `0`.
2. A detached at distance `2400`; Web rendered its `Scroll to bottom`
   affordance.
3. B rendered at `scrollTop=0`, `scrollHeight=944`, `clientHeight=683`.
4. Returning to A rendered at its live edge again: `scrollTop=15927`,
   distance `0`.

Web's list controller keeps its `isAtEnd` state across the route transition,
so the first B frame after leaving detached A remains at B's top. Lynx does
not copy that cross-thread state leak: route/list identity resets the
controller and the newly selected transcript reaches its live edge. This is
an intentional correctness delta, not unexplained top/bottom drift.

## Evidence

- `web-a-bottom.png`, `web-a-detached.png`, `web-b-bottom.png`,
  `web-a-restored.png`
- `lynx-a-bottom.png`, `lynx-a-detached.png`, `lynx-b-bottom.png`,
  `lynx-a-restored.png`
- All PNGs are `1280x820`.

