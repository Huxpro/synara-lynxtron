import "@lynx-js/web-core/client";
import { setupSymmetricHost } from "@lynx-js/lynxtron/web-host";

interface ProbeMatrixPayload {
  readonly matrix?: unknown;
}

declare global {
  interface Window {
    __SYNARA_HOST_INPUT_PROBE__?: unknown;
  }
}

const webDocument = globalThis.document;
const bundleUrl = "./main.web.bundle";

webDocument.body.innerHTML = `
<lynx-view
  id="host-input-probe-root"
  style="height:100vh; width:100vw;"
  url="${bundleUrl}">
</lynx-view>`;

const lynxView = webDocument.getElementById("host-input-probe-root") as HTMLElement & {
  sendGlobalEvent?: (eventName: string, params: unknown[]) => void;
};

setupSymmetricHost(lynxView, {
  bridge: {
    call(method: string, params: ProbeMatrixPayload) {
      if (method !== "hostInputProbePublish") return null;
      globalThis.__SYNARA_HOST_INPUT_PROBE__ = params.matrix;
      webDocument.body.dataset.probeRevision = String(
        Number(webDocument.body.dataset.probeRevision ?? "0") + 1,
      );
      return null;
    },
  },
});

globalThis.addEventListener("focus", () => {
  lynxView.sendGlobalEvent?.("host-input-probe:window-focus", []);
});
globalThis.addEventListener("blur", () => {
  lynxView.sendGlobalEvent?.("host-input-probe:window-blur", []);
});
