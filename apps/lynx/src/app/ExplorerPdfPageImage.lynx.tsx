import { useState } from '@lynx-js/react';

export function ExplorerPdfPageImage(props: {
  readonly accessibilityLabel: string;
  readonly height: number;
  readonly pageUrl: string;
  readonly width: number;
}) {
  const [renderFailed, setRenderFailed] = useState(false);
  if (renderFailed) {
    return (
      <view className="ExplorerDockPdfError">
        <text className="ExplorerDockPdfStatus ExplorerDockState--error">
          Could not render this PDF.
        </text>
      </view>
    );
  }
  return (
    <image
      className="ExplorerDockPdfPageImage"
      src={props.pageUrl}
      mode="scaleToFill"
      style={{ width: `${props.width}px`, height: `${props.height}px` }}
      accessibility-element={true}
      accessibility-label={props.accessibilityLabel}
      binderror={() => {
        'background only';
        setRenderFailed(true);
      }}
    />
  );
}
