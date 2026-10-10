// FILE: AboutLynxDialog.lynx.tsx
// Purpose: Lynx-only About dialog (Help menu → "About Synara for Lynx"). The one place in the
//   main window that shows the Lynx and Lynxtron marks; everything else carries Synara's mark
//   like the Electron app.

import { advancedAppVersion } from "../../app/settingsAdvanced.logic";
import { Button } from "../ui/button";
import { Dialog, DialogFooter, DialogPopup, DialogTitle } from "../ui/dialog.lynx";
import { LynxBrandMarks } from "./LynxBrandMarks.lynx";

/** Lynx's own engine version global; absent outside a Lynx runtime. */
function lynxEngineVersion(): string | null {
  const version = typeof SystemInfo === "undefined" ? undefined : SystemInfo.engineVersion;
  return typeof version === "string" && version.length > 0 ? version : null;
}

/** Version facts the renderer already holds; a fact it cannot read is left out. */
export function aboutLynxVersionLine(
  appVersion: string = advancedAppVersion(),
  engineVersion: string | null = lynxEngineVersion(),
): string {
  return [`Synara ${appVersion}`, engineVersion ? `Lynx engine ${engineVersion}` : null]
    .filter(Boolean)
    .join(" · ");
}

export function AboutLynxDialog(props: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogPopup className="AboutLynxDialog" showCloseButton={false}>
        <view className="AboutLynxDialogBody">
          <LynxBrandMarks className="AboutLynxDialogMarks" />
          <DialogTitle>Synara for Lynx</DialogTitle>
          <text className="AboutLynxDialogTagline">Rendered with Lynx on Lynxtron</text>
          <text className="AboutLynxDialogVersions">{aboutLynxVersionLine()}</text>
        </view>
        <DialogFooter className="AboutLynxDialogFooter">
          <Button variant="outline" size="sm" onClick={() => props.onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
