// FILE: app/useDiffDockVisibleFilePath.lynx.ts
// Purpose: Upstream's `useVisibleDiffFilePath` for the Lynx diff dock: the file
//   under the top of the patch viewport, re-read when the patch is laid out again
//   and while it scrolls. Upstream reads DOM anchors on scroll and resize; Lynx
//   asks for the rectangles and gets them a frame later.
// Layer: Lynx diff dock UI

import { useEffect, useRef, useState } from "@lynx-js/react";

import { measureLynxElementsById } from "../components/ui/measure.lynx";
import { resolveVisibleDiffDockFilePath } from "./diffDockVisibleFile.logic";

const SCROLL_MEASURE_DELAY_MS = 60;

export function useDiffDockVisibleFilePath(input: {
  readonly viewportId: string;
  readonly files: readonly { readonly path: string; readonly elementId: string }[];
  /** Changes whenever the content was laid out again. */
  readonly layoutRevision: number;
}): { readonly visibleFilePath: string | null; readonly handleScroll: () => void } {
  const [visibleFilePath, setVisibleFilePath] = useState<string | null>(null);
  const filesKey = JSON.stringify(input.files);
  const measureRef = useRef<() => void>(() => {});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const files = JSON.parse(filesKey) as typeof input.files;
    let cancelled = false;
    const measure = () => {
      "background only";
      if (files.length === 0) {
        setVisibleFilePath(null);
        return;
      }
      void measureLynxElementsById([input.viewportId, ...files.map((file) => file.elementId)]).then(
        ([viewport, ...rects]) => {
          if (cancelled || !viewport || viewport.height === 0) return;
          const next = resolveVisibleDiffDockFilePath({
            viewportTop: viewport.top,
            files: files.map((file, index) => ({
              path: file.path,
              top: rects[index]?.top ?? null,
            })),
          });
          setVisibleFilePath((previous) => (previous === next ? previous : next));
        },
      );
    };
    measureRef.current = measure;
    measure();
    return () => {
      cancelled = true;
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [filesKey, input.layoutRevision, input.viewportId]);

  const handleScroll = () => {
    "background only";
    // One trailing read per burst: the rectangles arrive asynchronously, so a read
    // per scroll event would only queue stale answers.
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      measureRef.current();
    }, SCROLL_MEASURE_DELAY_MS);
  };

  return { visibleFilePath, handleScroll };
}
