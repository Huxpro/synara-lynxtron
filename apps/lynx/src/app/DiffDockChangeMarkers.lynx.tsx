// FILE: app/DiffDockChangeMarkers.lynx.tsx
// Purpose: Upstream's change-marker strip (DiffPanelChangeMarkers.tsx) on the
//   right edge of the diff dock: one tick per changed file at its position in
//   the whole patch, which jumps to that file.
// Layer: Lynx diff dock UI
// Upstream's component measures DOM anchors with ResizeObserver; this one asks
// Lynx for the same rectangles. The positions are upstream's
// `resolveDiffChangeMarkers`, the names and colors upstream's own tables
// (generated extract).

import { useEffect, useState } from "@lynx-js/react";
import {
  DIFF_CHANGE_MARKER_HEIGHT_PX,
  resolveDiffChangeMarkers,
  type DiffChangeMarker,
  type DiffChangeMarkerSource,
} from "@synara-web/components/DiffPanel.logic";

import { useLynxInteractiveState } from "../adapters/useLynxInteractiveState";
import { measureLynxElementsById } from "../components/ui/measure.lynx";
import {
  CHANGE_MARKER_COLOR_BY_KIND,
  CHANGE_MARKER_LABEL_BY_KIND,
} from "../generated/diffChangeMarkers.generated";

export interface DiffDockChangeMarkerFile {
  readonly path: string;
  readonly elementId: string;
  readonly changeType: DiffChangeMarkerSource["changeType"];
}

function ChangeMarker(props: {
  readonly marker: DiffChangeMarker;
  readonly onSelectFilePath: (filePath: string) => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: "DiffDockChangeMarker",
    accessibleLabel: `${CHANGE_MARKER_LABEL_BY_KIND[props.marker.kind]}: ${props.marker.path}`,
    onActivate: () => props.onSelectFilePath(props.marker.path),
  });
  return (
    <view
      className={interaction.className}
      style={{
        top: `${props.marker.top}px`,
        height: `${DIFF_CHANGE_MARKER_HEIGHT_PX}px`,
        backgroundColor: CHANGE_MARKER_COLOR_BY_KIND[props.marker.kind],
      }}
      {...interaction.eventProps}
    />
  );
}

export function DiffDockChangeMarkers(props: {
  /** The scroll viewport: its height is the strip's. */
  readonly viewportId: string;
  /** The scroll-view's only child, so its box is the whole scrollable content. */
  readonly contentId: string;
  readonly files: readonly DiffDockChangeMarkerFile[];
  /** Changes whenever the content was laid out again. */
  readonly layoutRevision: number;
  readonly onSelectFilePath: (filePath: string) => void;
}) {
  const { contentId, layoutRevision, viewportId } = props;
  const [markers, setMarkers] = useState<readonly DiffChangeMarker[]>([]);
  // The caller rebuilds `files` on every render; its serialized form is what
  // the measurement depends on.
  const filesKey = JSON.stringify(props.files);

  useEffect(() => {
    const files = JSON.parse(filesKey) as readonly DiffDockChangeMarkerFile[];
    if (files.length === 0) {
      setMarkers([]);
      return;
    }
    let cancelled = false;
    void measureLynxElementsById([
      viewportId,
      contentId,
      ...files.map((file) => file.elementId),
    ]).then(([viewport, content, ...fileRects]) => {
      if (cancelled) return;
      if (!viewport || !content) {
        setMarkers([]);
        return;
      }
      setMarkers(
        resolveDiffChangeMarkers({
          files: files.flatMap((file, index) => {
            const rect = fileRects[index];
            // The content box scrolls with the files, so the difference is the
            // file's offset in the scrolled content wherever the reader is.
            return rect
              ? [
                  {
                    path: file.path,
                    offsetTop: rect.top - content.top,
                    changeType: file.changeType,
                  },
                ]
              : [];
          }),
          scrollHeight: Math.max(content.height, viewport.height),
          stripHeight: viewport.height,
        }),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [contentId, filesKey, layoutRevision, viewportId]);

  if (markers.length === 0) return null;

  // Upstream's strip is `pointer-events-none` with `pointer-events-auto` ticks. On Lynx a
  // view takes the tap for its whole box whatever its `pointer-events`, and
  // `user-interaction-enabled={false}` switches off its children too, so the labeled strip
  // refuses touch and the ticks are its siblings, laid over the same 6px column.
  return (
    <>
      <view
        className="DiffDockChangeMarkers"
        user-interaction-enabled={false}
        accessibility-element={true}
        accessibility-label="Change markers"
        accessibility-trait="none"
      />
      {markers.map((marker) => (
        <ChangeMarker key={marker.path} marker={marker} onSelectFilePath={props.onSelectFilePath} />
      ))}
    </>
  );
}
