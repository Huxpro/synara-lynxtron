import { useState } from "@lynx-js/react";

function fileName(path: string): string {
  return path.replace(/\\/g, "/").split("/").pop() || path;
}

export function ExplorerImagePreview(props: {
  readonly path: string;
  readonly previewUrl: string;
}) {
  const [decodeFailed, setDecodeFailed] = useState(false);
  if (decodeFailed) {
    return (
      <text className="ExplorerDockState ExplorerDockState--error">Could not load this image.</text>
    );
  }
  return (
    <view className="ExplorerDockImageFrame">
      <image
        className="ExplorerDockImage"
        src={props.previewUrl}
        mode="aspectFit"
        accessibility-element={false}
        binderror={() => {
          "background only";
          setDecodeFailed(true);
        }}
      />
      <text className="ExplorerDockImageName">{fileName(props.path)}</text>
    </view>
  );
}
