import { useEffect, useState } from "@lynx-js/react";
import {
  APP_SNAP_WELCOME_STORAGE_KEY,
  readAppSnapWelcomeStorage,
  writeAppSnapWelcomeStorage,
} from "@synara-web/components/AppSnapWelcomeDialog.logic";
import screenCaptureSvg from "@synara-central-icons/screen-capture.svg?raw";

import { useTheme } from "../adapters/useTheme.lynx";
import { colorizeLynxSvg } from "../lib/themedSvg.lynx";
import { appSnap } from "../platform/appSnap";
import { webStorage } from "../platform/storage";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "../components/ui/dialog.lynx";

export function AppSnapWelcomeDialogLynx(props: { readonly onOpenSettings: () => void }) {
  const { semanticIconColor } = useTheme();
  const [open, setOpen] = useState(false);
  const acknowledged = readAppSnapWelcomeStorage(
    webStorage.getItem(APP_SNAP_WELCOME_STORAGE_KEY),
  ).acknowledged;

  useEffect(() => {
    "background only";
    if (acknowledged) return;
    let active = true;
    void appSnap
      .getState()
      .then((state) => {
        if (active && state.supported) setOpen(true);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [acknowledged]);

  const acknowledge = () => {
    "background only";
    webStorage.setItem(
      APP_SNAP_WELCOME_STORAGE_KEY,
      writeAppSnapWelcomeStorage({ acknowledged: true }),
    );
    setOpen(false);
  };

  return (
    <Dialog
      open={open && !acknowledged}
      onOpenChange={(next) => {
        if (!next) acknowledge();
      }}
    >
      <DialogPopup showCloseButton={false} className="AppSnapWelcomeDialog">
        <view className="AppSnapWelcomeBody">
          <view className="AppSnapWelcomeHero" aria-hidden="true">
            <svg
              className="AppSnapWelcomeHeroIcon"
              content={colorizeLynxSvg(screenCaptureSvg, semanticIconColor("primary"))}
            />
          </view>
          <DialogHeader className="AppSnapWelcomeHeader">
            <DialogTitle className="AppSnapWelcomeTitle">Synara AppSnaps are live!</DialogTitle>
            <DialogDescription className="AppSnapWelcomeDescription">
              Press both Option keys (⌥ ⌥) to snap any app&apos;s window into the task you&apos;re
              working in.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="AppSnapWelcomeFooter">
            <Button variant="ghost" onClick={acknowledge}>
              Not now
            </Button>
            <Button
              onClick={() => {
                acknowledge();
                props.onOpenSettings();
              }}
            >
              Set up AppSnap
            </Button>
          </DialogFooter>
        </view>
      </DialogPopup>
    </Dialog>
  );
}
