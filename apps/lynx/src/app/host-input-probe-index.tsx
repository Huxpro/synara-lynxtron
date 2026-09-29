import { root } from "@lynx-js/react";

import { HostInputProbe } from "./HostInputProbe";

root.render(<HostInputProbe />);

// @ts-ignore
if (import.meta.webpackHot) {
  // @ts-ignore
  import.meta.webpackHot.accept();
}
