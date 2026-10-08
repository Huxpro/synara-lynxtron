// P0-S4: <list> scroll-follow semantics spike — minimal transcript model.
//
// Validates (per plan/01-roadmap.md P0-S4 exit criteria):
//   1. 流式追加 + 底部吸附 + 用户上滚脱离 (stream-append / bottom-pin / detach)
//   2. 子组件 JS 提前实例化 (JS instances created eagerly, UI attached lazily)
//   3. ref/useEffect ≠ 可见 (effects fire for off-screen items)
//   4. scroll 事件节流 (scroll-event-throttle) + eventSource 语义
//
// Findings are POSTed to the sidecar (/report -> spikes/p0-s4/results.jsonl)
// and mirrored on screen.

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from '@lynx-js/react';

// ---- module-scope instrumentation: JS instance / effect tracking ----------
let instanceSeq = 0;
const instanceFirstIdx: number[] = []; // index each JS instance was FIRST rendered for
const effectIdx: number[] = []; // indices whose useEffect fired

function TranscriptItem(props: { index: number; text: string }) {
  const idRef = useRef<number | null>(null);
  if (idRef.current === null) {
    idRef.current = ++instanceSeq;
    instanceFirstIdx.push(props.index);
  }
  useEffect(() => {
    effectIdx.push(props.index);
  }, []);
  return (
    <view className="MsgRow">
      <text className="MsgIndex">#{props.index}</text>
      <text className="MsgText">{props.text}</text>
    </view>
  );
}

const INITIAL = 30;
const STREAM_TOTAL = 120;
const STREAM_INTERVAL = 120;
const BOTTOM_EPS = 30; // px tolerance for "at bottom"

const SRC = { DIFF: 0, LAYOUT: 1, SCROLL: 2 } as const;

export function Transcript(props: { report: (line: string) => void }) {
  const { report } = props;
  const [items, setItems] = useState<string[]>(() =>
    Array.from({ length: INITIAL }, (_, i) => `initial message ${i} — lorem ipsum dolor sit amet`)
  );
  const [pinned, setPinned] = useState(true);
  const [throttle, setThrottle] = useState(200);
  const [status, setStatus] = useState('running…');

  const listRef = useRef<any>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const pinnedRef = useRef(true);
  const scrollEventCount = useRef(0);
  const lastScroll = useRef<any>(null);
  const eventSourcesSeen = useRef<Record<string, number>>({});
  const streamingRef = useRef(true);

  const say = (phase: string, obj: any) => {
    const line = `[P0-S4] ${phase} ${JSON.stringify(obj)}`;
    console.log(line);
    report(line);
  };

  const scrollToIdx = (index: number, smooth = false) => {
    listRef.current?.invoke({
      method: 'scrollToPosition',
      params: { index, alignTo: 'bottom', smooth },
      fail: (r: any) => say('invoke_fail', { method: 'scrollToPosition', r }),
    }).exec();
  };
  const getScrollInfo = (cb: (info: any) => void) => {
    listRef.current?.invoke({
      method: 'getScrollInfo',
      success: (res: any) => cb(res),
      fail: (r: any) => say('invoke_fail', { method: 'getScrollInfo', r }),
    }).exec();
  };

  // --- scroll event handling: pin/detach state machine ---------------------
  const onScroll = (e: any) => {
    const d = e.detail ?? {};
    scrollEventCount.current += 1;
    lastScroll.current = {
      scrollTop: d.scrollTop,
      scrollHeight: d.scrollHeight,
      listHeight: d.listHeight,
      eventSource: d.eventSource,
      attachedCells: Array.isArray(d.attachedCells) ? d.attachedCells.length : -1,
    };
    const srcName = String(d.eventSource);
    eventSourcesSeen.current[srcName] = (eventSourcesSeen.current[srcName] ?? 0) + 1;

    const atBottom = d.scrollTop + d.listHeight >= d.scrollHeight - BOTTOM_EPS;
    // eventSource: 0=DIFF, 1=LAYOUT, 2=SCROLL (user/gesture or programmatic?)
    if (d.eventSource === SRC.SCROLL) {
      if (!atBottom && pinnedRef.current) {
        pinnedRef.current = false;
        setPinned(false);
        say('pin', { event: 'detach', scrollTop: d.scrollTop, scrollHeight: d.scrollHeight });
      } else if (atBottom && !pinnedRef.current) {
        pinnedRef.current = true;
        setPinned(true);
        say('pin', { event: 'reattach', scrollTop: d.scrollTop, scrollHeight: d.scrollHeight });
      }
    }
  };

  // --- auto-pin: after every append while pinned, snap to bottom -----------
  useEffect(() => {
    if (pinnedRef.current && items.length > 0) {
      scrollToIdx(items.length - 1);
    }
  }, [items]);

  // --- automated timeline ----------------------------------------------------
  useEffect(() => {
    const timers: Array<ReturnType<typeof setTimeout>> = [];
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));

    // P1: eager-instantiation & effect-vs-visible (before streaming)
    at(1000, () => {
      getScrollInfo((info) => {
        say('p1_eager_vs_visible', {
          jsInstances: instanceSeq,
          effectsFired: effectIdx.length,
          itemCount: itemsRef.current.length,
          lastScroll: lastScroll.current,
          scrollInfo: info,
          note: 'instances/effects ≈ itemCount proves eager JS creation; attachedCells ≈ viewport proves UI windowing',
        });
      });
    });

    // P2: start streaming appends
    at(1200, () => {
      let n = 0;
      const timer = setInterval(() => {
        n += 1;
        const seq = n;
        setItems((prev) =>
          prev.length >= INITIAL + STREAM_TOTAL
            ? prev
            : [...prev, `streamed chunk ${seq} — consectetur adipiscing elit ${'x'.repeat((seq * 7) % 40)}`]
        );
        if (n >= STREAM_TOTAL) clearInterval(timer);
      }, STREAM_INTERVAL);
    });

    // P3: mid-stream, simulate "user scrolled up" (programmatic), then verify detach
    at(5000, () => {
      scrollToIdx(5);
      at(0, () => {}); // noop keep ordering clear
      setTimeout(() => {
        // If the scroll handler did NOT detach (e.g. programmatic scrolls don't
        // carry eventSource=SCROLL), force detach and record which path was taken.
        if (pinnedRef.current) {
          pinnedRef.current = false;
          setPinned(false);
          say('pin', { event: 'detach-forced', reason: 'no SCROLL-source event observed from programmatic scroll' });
        }
        const before = { ...lastScroll.current };
        getScrollInfo((infoBefore) => {
          setTimeout(() => {
            getScrollInfo((infoAfter) => {
              say('p3_detach_during_stream', {
                before,
                infoBefore,
                infoAfter,
                pinned: pinnedRef.current,
                pass:
                  !pinnedRef.current &&
                  (infoAfter?.scrollY ?? -1) - (infoBefore?.scrollY ?? -1) <= BOTTOM_EPS &&
                  (infoAfter?.maxScrollOffset ?? 0) > (infoBefore?.maxScrollOffset ?? 0),
                note: 'pass=scrollTop stays while maxScrollOffset grows (no auto-pin while detached)',
              });
            });
          }, 2500);
        });
      }, 600);
    });

    // P4: jump to bottom -> reattach -> verify pinning resumes
    at(9500, () => {
      pinnedRef.current = true;
      setPinned(true);
      scrollToIdx(itemsRef.current.length - 1);
      setTimeout(() => {
        getScrollInfo((info) => {
          say('p4_reattach', {
            info,
            pinned: pinnedRef.current,
            pass: pinnedRef.current && Math.abs((info?.scrollY ?? 0) - (info?.maxScrollOffset ?? -9999)) <= BOTTOM_EPS + 40,
          });
        });
      }, 1500);
    });

    // P5: scroll-event throttle measurement (default 200ms vs 16ms)
    at(12000, () => {
      scrollEventCount.current = 0;
      scrollToIdx(0, true); // smooth scroll up over ~1-2s
      setTimeout(() => {
        const slow = scrollEventCount.current;
        setThrottle(16);
        setTimeout(() => {
          scrollEventCount.current = 0;
          scrollToIdx(itemsRef.current.length - 1, true);
          setTimeout(() => {
            say('p5_throttle', {
              throttle200ms_events: slow,
              throttle16ms_events: scrollEventCount.current,
              eventSourcesSeen: eventSourcesSeen.current,
              note: 'more events at 16ms proves throttle works; sources: 0=DIFF 1=LAYOUT 2=SCROLL',
            });
          }, 2500);
        }, 300);
      }, 2500);
    });

    // P6: wrap up
    at(16500, () => {
      streamingRef.current = false;
      say('summary', {
        jsInstances: instanceSeq,
        effectsFired: effectIdx.length,
        itemCount: itemsRef.current.length,
        firstInstanceIdx: instanceFirstIdx.slice(0, 12),
        pinned: pinnedRef.current,
        lastScroll: lastScroll.current,
      });
      report('[P0-S4] SUITE_DONE');
      setStatus('SUITE_DONE (see results.jsonl)');
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <view className="TWrap">
      <view className="THeader">
        <text className="TTitle">P0-S4 transcript ({pinned ? 'PINNED' : 'detached'}) thr={throttle}</text>
        <text className="TStatus">{status}</text>
      </view>
      <list
        ref={listRef}
        className="TList"
        scroll-orientation="vertical"
        need-visible-item-info={true}
        scroll-event-throttle={throttle}
        bindscroll={onScroll}
      >
        {items.map((text, i) => (
          <list-item item-key={`m${i}`} key={`m${i}`} estimated-main-axis-size-px={56}>
            <TranscriptItem index={i} text={text} />
          </list-item>
        ))}
      </list>
    </view>
  );
}
