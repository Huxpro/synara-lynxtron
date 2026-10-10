/**
 * Props of the `<scroll-view>` that selectable markdown text is wrapped in.
 *
 * The desktop engine reveals the moving end of a text selection on every drag update:
 * `TextView::BringIntoView` (lynx-family/lynx, `clay/ui/component/text/text_view.cc`, called
 * from `PerformMoveSelection`) finds the nearest scroll-view ancestor of the `<text>` and
 * scrolls it to the selection end's top. That top is measured inside the text element, but
 * is used as an offset in the scroller's content. A paragraph deep in a long transcript
 * therefore sends the transcript `<list>` (a scroll-view to the engine) to an offset of a
 * few pixels: the top of the thread. Neither `<text>` nor `<list>` has a switch for it.
 *
 * A scroll-view of its own around the selectable text becomes that nearest ancestor. It is
 * as tall as its content, so the engine clamps the reveal to its only offset, 0, and the
 * list is never asked to move. Nothing is restored after the fact and no scroll position is
 * read, so this cannot fight a reader's own scrolling or the transcript's follow logic.
 *
 * `enable-scroll={false}` keeps the scope out of pan and wheel handling: the engine skips a
 * disabled scroller when it routes wheel events, and passes a drag on to the outer scroller.
 * Remove the scope when the engine converts the selection end into the scroller's content
 * coordinates.
 */
export const TEXT_SELECTION_SCROLL_SCOPE_PROPS = {
  "scroll-orientation": "vertical",
  "enable-scroll": false,
  "scroll-bar-enable": false,
} as const;
