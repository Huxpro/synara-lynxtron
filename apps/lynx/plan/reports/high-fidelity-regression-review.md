# High-fidelity regression review

## Scope

This review covers the high-fidelity work from August 2 through August 11,
with a full-file review of the current Native flicker path:

- viewport publication and hydration;
- responsive root state;
- left and right panel consumers;
- titlebar drag regions and controls;
- retained Native flicker frame sequences;
- already documented runtime regressions found during current-head
  certification.

The complete period contains hundreds of source files and thousands of
evidence files. This is not represented as an exhaustive line-by-line review
of every fidelity commit. The findings below distinguish confirmed regressions,
current high-confidence risks, and boundaries that still need a fresh runtime
reproduction.

## Findings

### P2 · Stale viewport hydration can overwrite a newer resize event

Location: `apps/lynx/src/hooks/useViewportLayout.lynx.ts:44`

Each hook instance starts `platformWindow.getViewportSize()` and independently
subscribes to `platformWindow.onViewportResize()`. The promise completion only
checks whether the component is still mounted. If a real resize event arrives
first, a slower initial query can still resolve afterward and write an older
size back into state.

This can temporarily switch `SliceRoot--viewport-*` classes and every responsive
consumer back to the previous layout. It is most visible during startup,
restore, maximize, or interactive resizing near a breakpoint.

Recommended fix:

- centralize viewport state into one external store/provider;
- subscribe before resolving initial state;
- assign a monotonically increasing revision to live events and ignore an
  initial query result after any newer event has been observed.

Confidence: high. The race exists in the current code independently of whether
it explains every reported flash.

### P2 · Three consumers duplicate two viewport event sources

Locations:

- `apps/lynx/src/app/App.tsx:160`
- `apps/lynx/src/app/SidebarDisclosure.lynx.tsx:48`
- `apps/lynx/src/app/ResizableRightPanel.lynx.tsx:42`
- `apps/lynx/src/hooks/useViewportLayout.lynx.ts:42`

The root, left sidebar, and right panel each call `useViewportLayout()`. Every
call registers the Lynx built-in `onWindowResize` listener and the host
`viewport:resize` listener, and starts its own bridge query. A single Native
window resize therefore fans out through six listeners plus three initial
queries.

The per-instance equality guard avoids repeated writes only when both sources
deliver exactly equal dimensions in the same order. It does not prevent
duplicate scheduling, cross-source ordering differences, or the stale query
race above. Under live resizing this creates avoidable background/main-thread
work and lets responsive root, sidebar, and panel state settle independently.

Recommended fix:

- maintain one canonical viewport snapshot;
- expose it to all consumers through `useSyncExternalStore` or one root-owned
  context;
- choose one Native event source as authoritative and keep the other only as a
  measured fallback;
- coalesce resize publication to one animation frame where the host permits.

Confidence: high for duplicated work and independently settling state; medium
for it being the sole cause of the user-visible continuous flicker.

## Confirmed regressions already found and fixed

The certification work did uncover functional regressions. They were not only
cosmetic differences:

1. Native startup crash after Explorer image preview work. Commit `7165953d`
   constructed a regex with top-level `Array.map` and `String.replaceAll`,
   which failed in the ReactLynx main thread. The retained bisect identified
   `7165953d` as first bad and `99e2b46c` as good; the initializer was replaced
   with an equivalent static regex.
2. Native Pull Requests route crashes. The list projection dropped
   `repositoryBatches`, then `errors`, while the route still consumed both.
   Commit `22971aa73` preserves the complete typed RPC metadata and adds focused
   coverage.
3. Titlebar controls participated in the drag region. Focusable controls inside
   `.AppWindowDragRegion` could initiate window dragging instead of remaining
   interaction owners. Commit `3b9e343cc` adds the `no-drag` boundary and a
   focused contract test.
4. Web development asset ownership routed static CSS/Wasm through the wrong
   server. Commit `d5f5d35d0` corrected the routing.
5. Landing/Composer functionality regressed while fidelity work changed
   bootstrap paths: provider health status disappeared, the send SVG lost its
   paint, provider activation was missing in Lynx-for-Web, and the initial model
   catalog was stale. Commits `c041b0430`, `94cd71edd`, `bc4a1b295`, and
   `6c6392f1e` restore those paths.

These examples answer the regression question directly: yes, functional
regressions were introduced during the high-fidelity run. Several were found
and fixed by the verification process itself.

## Flicker evidence assessment

The retained August 10 evidence is useful but must be interpreted carefully:

- pure hover sequences have very small frame deltas and no large-delta frames;
- resize and window-drag sequences change more substantially;
- the titlebar drag-region follow-up proves controls no longer move the window
  while blank header space still does;
- the 100-frame post-fix sequence reports no suspected blank frames;
- CoreGraphics window-drag captures also move the sampled screen region, so a
  large whole-frame delta is not by itself proof of a renderer blank.

The evidence therefore supports:

1. blanket hover paint was not the primary old failure;
2. one application-layer drag-region regression was real and is fixed;
3. current viewport state has two code-level race/fan-out risks that can still
   cause transient responsive-layout changes;
4. a fresh exact-owned runtime reproduction is still required before claiming
   the current app's continuous flicker is fully diagnosed.

Per the user's request, new screenshot certification remains paused. The next
runtime investigation should instrument viewport event source, dimensions,
revision, root layout band, window bounds, and frame timestamps in one trace
rather than collecting another undifferentiated screenshot burst.

## Review conclusion

The current app cannot yet be declared free of functional regression. The
known crashes and interaction regressions listed above are fixed, but viewport
hydration and duplicate resize subscriptions remain credible P2 risks. They
should be corrected before resuming the final Native certification matrix.
