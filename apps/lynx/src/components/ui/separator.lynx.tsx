import { cx } from "./shared.lynx";
import "./primitives.css";

export function Separator(props: {
  readonly className?: string;
  readonly orientation?: "horizontal" | "vertical";
}) {
  const orientation = props.orientation ?? "horizontal";
  return (
    <view
      accessibility-element={false}
      aria-hidden="true"
      className={cx("LxSeparator", `LxSeparator--${orientation}`, props.className)}
    />
  );
}
