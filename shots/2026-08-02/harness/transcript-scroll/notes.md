# Lynx-for-Web transcript scrolling slice

- Scope: Web-original ↔ Lynx-for-Web transcript behavior at `1280×820`, DPR 1,
  light theme, against the same isolated server/state. The isolated state was
  advanced only through canonical Composer sends; no database fixture was
  injected.
- Final state SHA-256 after validation:
  `c3878e2c483c2fc77ebf5455d66f4185879407ffb4f602c25df17edc01741ec0`.
- Web bundle SHA-256:
  `b8141d42b327171f052c365d56b1f8689c9873ddf60e108de0895e729aee60bf`.
- Desktop/Lynx bundle SHA-256:
  `65d4aa1ec31d5b62edc6c1e034b9e91b58cba4a2c0631d87abd556e51ae723f3`.

## Findings and fixes

1. The product passed `{ index, alignTo }` to Lynx list
   `scrollToPosition`; the real contract is `{ position, offset, smooth }`.
   The ignored call left the seed transcript at `scrollTop=0` while
   `max=123`.
2. Positioning the final row alone works only when the row is shorter than the
   viewport. A real 700-word assistant response stopped at its row start
   (`scrollTop=83`, `max=557`). The product now supplies a bounded positive
   end offset and lets the platform clamp to the true list end.
3. Native `bindscroll` retains its `eventSource=2` gate. Lynx for Web does not
   expose the same event shape, so the Web host provides a bounded read-only
   transcript scroll sample. The background reducer detaches only when the
   same list moves upward and reattaches at the live edge; route/list identity
   resets previous-position state.
4. The Scroll-to-bottom affordance now follows Web geometry and naming. Web is
   `x=752 y=669 32×32`; Lynx for Web is `x=760 y=669 32×32`, an allowed `+8px`
   horizontal delta with exact vertical anchor and size. Both are named
   `Scroll to bottom`.

## Runtime proof

- Persisted long response, initial load: Lynx `scrollTop=557`, `max=557`.
- PageUp: Lynx `scrollTop=0`, `max=557`, Scroll-to-bottom visible.
- Activate button: Lynx `scrollTop=557`, `max=557`, button removed.
- Final-code real streaming turn (`FINAL-SCROLL-OK`):
  - active frame: `Response started`, `scrollTop=681`, `max=681`;
  - completed frame: final text persisted, `scrollTop=1083`, `max=1083`, no
    jump affordance.
- The first attempt on the imported seed thread was correctly rejected as
  negative evidence: server logged `provider command skipped for quarantined
  thread`. It is not counted as a streaming pass. A newly created canonical
  thread produced the real 700-word and 300-word responses used above.
- Browser runtime errors were empty. The upstream Lynx-for-Web initialization
  deprecation remains the only warning.

## Evidence

- `web-pinned.png` / `lynx-pinned.png`: same persisted 700-word transcript at
  the live edge.
- `web-detached.png` / `lynx-detached.png`: reader detached at the top with
  matching 32 px scroll affordance.
- `lynx-streaming.png`: final-code live provider turn in progress.
- `lynx-complete.png`: the same final-code turn complete and still pinned.
- All PNGs are `1280×820`.

This slice certifies transcript follow/detach/reattach behavior and the
scroll-to-bottom affordance. It does not claim the entire Web and Lynx scroll
viewport rectangles are identical: Web owns a full-width `1024×683` viewport,
while the current Lynx platform list is the centered `736×651` content column.
That structural shell residual remains separate from the live-edge contract.

An explicit same-state `A -> B -> A` route-switch audit was added after this
slice. Lynx resets list identity and brings B and the reopened A to their own
live edges without leaking A's detached offset. Web original exposes a
cross-thread `isAtEnd` residual when leaving detached A, which is documented
instead of being copied. See `../transcript-switch/notes.md` and its eight
paired screenshots.

## Gates

- Focused tests: 1 file / 11 tests passed.
- Web production: `2478.3 kB` main bundle passed.
- Desktop production: `2380.8 kB` Lynx bundle / `2509.4 kB` total passed.
- `git diff --check` passed.
