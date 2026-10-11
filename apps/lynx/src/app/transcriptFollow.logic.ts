import type { ThreadTranscriptRow } from "./queries";
import { transcriptRowVersion } from "./transcriptRows.logic";

/**
 * What the transcript's end-follow watches: everything the latest turn draws.
 *
 * While a turn streams, the reply is not the last row (the "Working…" indicator sits under
 * it), and it grows in place without the row count changing. A follow keyed on the last
 * row alone therefore sees nothing until the turn settles. This covers every row from the
 * newest user message to the end, so text growing inside a row, work entries arriving or
 * changing state, a row being added or removed and the settled layout each give a new value,
 * while a render that changes none of them gives the same one.
 */
export function transcriptFollowVersion(rows: readonly ThreadTranscriptRow[]): string {
  let start = rows.length - 1;
  while (start > 0) {
    const row = rows[start];
    if (row?.kind === "message" && row.message.role === "user") break;
    start -= 1;
  }
  const versions: string[] = [String(rows.length)];
  for (let index = Math.max(0, start); index < rows.length; index += 1) {
    const row = rows[index];
    versions.push(`${row?.id ?? ""}=${transcriptRowVersion(row)}`);
  }
  return versions.join("\u0001");
}

/**
 * How long the followed content has to stay unchanged before the settle pass runs. Measured
 * on the desktop engine at 300ms; the pass is one scroll, so a longer quiet time only delays it.
 */
export const TRANSCRIPT_FOLLOW_SETTLE_DELAY_MS = 300;

export interface TranscriptFollowDeps<TimerHandle> {
  /** Whether the reader is at the end. Only the reader's own scrolling, the jump button and
   *  entering a thread change it; nothing in here does. */
  readonly isFollowing: () => boolean;
  readonly scrollToEnd: (options: { readonly smooth: boolean }) => void;
  readonly setTimer: (callback: () => void, delayMs: number) => TimerHandle;
  readonly clearTimer: (handle: TimerHandle) => void;
}

export interface TranscriptFollowController {
  /** The followed content changed (see transcriptFollowVersion). */
  readonly contentChanged: () => void;
  /** Drops a pending settle pass (unmount). */
  readonly cancel: () => void;
}

/**
 * Keeps the end of the transcript in view while the reader is there.
 *
 * The Lynx <list> has no "stay at end" of its own, no synchronous scroll read or write, and
 * `scrollBy` does nothing on the desktop engine, so following is one `scrollToPosition` to
 * the end per content change. It is driven by content, never by a scroll or layout
 * measurement, so it cannot feed itself.
 *
 * The settle pass covers the layout that comes after the last change. When a turn settles
 * its work rows are removed and the content gets shorter; the desktop engine, when that
 * happens at the end of the list, leaves the rows drawn 29–43px short of the end while it
 * reports the list as being at the end, and an immediate (non-animated) scroll to the end
 * is then a no-op. One animated scroll to the end, once the content has been quiet, puts
 * what is drawn back at the real end. It is the order upstream's
 * `scrollTranscriptToSettledEnd` uses for the same reason, reversed: there the animated
 * request lands on estimated sizes and the plain one corrects it.
 *
 * A reader who has scrolled away is never moved: both the immediate scroll and the settle
 * pass ask `isFollowing` when they run, not when they were scheduled.
 */
export function createTranscriptFollowController<TimerHandle>(
  deps: TranscriptFollowDeps<TimerHandle>,
): TranscriptFollowController {
  let settleTimer: TimerHandle | null = null;
  const cancel = () => {
    if (settleTimer === null) return;
    deps.clearTimer(settleTimer);
    settleTimer = null;
  };
  return {
    contentChanged() {
      cancel();
      if (!deps.isFollowing()) return;
      deps.scrollToEnd({ smooth: false });
      settleTimer = deps.setTimer(() => {
        settleTimer = null;
        if (deps.isFollowing()) deps.scrollToEnd({ smooth: true });
      }, TRANSCRIPT_FOLLOW_SETTLE_DELAY_MS);
    },
    cancel,
  };
}
