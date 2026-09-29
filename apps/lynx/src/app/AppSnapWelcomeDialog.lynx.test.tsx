import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

import {
  APP_SNAP_WELCOME_STORAGE_KEY,
  readAppSnapWelcomeStorage,
  writeAppSnapWelcomeStorage,
} from "@synara-web/components/AppSnapWelcomeDialog.logic";

describe("Native AppSnap welcome parity", () => {
  it("shares the durable acknowledgement contract with Electron", () => {
    expect(APP_SNAP_WELCOME_STORAGE_KEY).toBe("synara:appsnap-welcome:v1");
    expect(readAppSnapWelcomeStorage(null)).toEqual({ acknowledged: false });
    expect(readAppSnapWelcomeStorage('{"acknowledged":true}')).toEqual({
      acknowledged: true,
    });
    expect(readAppSnapWelcomeStorage('{"acknowledged":"yes"}')).toEqual({
      acknowledged: false,
    });
    expect(writeAppSnapWelcomeStorage({ acknowledged: true })).toBe('{"acknowledged":true}');
  });

  it("matches the Electron copy, capability gate, and settings path", () => {
    const source = readFileSync(
      new URL("./AppSnapWelcomeDialog.lynx.tsx", import.meta.url),
      "utf8",
    );
    const styles = readFileSync(new URL("./App.css", import.meta.url), "utf8");

    expect(source).toContain("void appSnap");
    expect(source).toContain(".getState()");
    expect(source).toContain("state.supported");
    expect(source).toContain("Synara AppSnaps are live!");
    expect(source).toContain("Press both Option keys (⌥ ⌥)");
    expect(source).toContain("Not now");
    expect(source).toContain("Set up AppSnap");
    expect(source).toContain('from "@synara-central-icons/screen-capture.svg?raw"');
    expect(source).toContain("colorizeLynxSvg(screenCaptureSvg");
    const routerSource = readFileSync(new URL("./router.tsx", import.meta.url), "utf8");
    expect(routerSource).toContain('onOpenSettings={() => history.push("/settings/appsnap")}');
    expect(routerSource.match(/{appSnapWelcomeDialog}/g)).toHaveLength(2);
    const popupStyles = styles.slice(
      styles.indexOf(".LxDialogPopup.AppSnapWelcomeDialog"),
      styles.indexOf(".AppSnapWelcomeBody"),
    );
    expect(popupStyles).toContain("width: 420px;");
    expect(popupStyles).toContain("border-radius: 20px;");
    const heroStyles = styles.slice(
      styles.indexOf(".AppSnapWelcomeHero"),
      styles.indexOf(".AppSnapWelcomeHeader"),
    );
    expect(heroStyles).toContain("width: 64px;");
    expect(heroStyles).toContain("height: 64px;");
  });
});
