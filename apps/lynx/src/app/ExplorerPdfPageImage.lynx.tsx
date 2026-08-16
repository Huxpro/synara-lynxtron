import { useState } from '@lynx-js/react';

export function ExplorerPdfPageImage(props: {
  readonly accessibilityLabel: string;
  readonly pageUrl: string;
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
      mode="aspectFit"
      accessibility-element={true}
      accessibility-label={props.accessibilityLabel}
      binderror={() => {
        'background only';
        setRenderFailed(true);
      }}
    />
  );
}
