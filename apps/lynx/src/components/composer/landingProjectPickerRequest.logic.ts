// FILE: landingProjectPickerRequest.logic.ts
// Purpose: Lets the landing heading's project name open the landing composer's project
//          picker. Upstream renders a second ProjectPicker inside the heading; the Lynx
//          landing has one picker (the context tray's), so the heading asks for that one.
// Layer: Lynx composer logic

/** Upstream ChatView's `aria-label` for the project landing heading. */
export function landingProjectHeadingLabel(projectName: string): string {
  return `What should we do in ${projectName}?`;
}

type LandingProjectPickerOpener = () => void;

const openers: LandingProjectPickerOpener[] = [];

/** Registers the mounted landing composer's picker; returns the unregister function. */
export function registerLandingProjectPickerOpener(opener: LandingProjectPickerOpener): () => void {
  openers.push(opener);
  return () => {
    const index = openers.lastIndexOf(opener);
    if (index >= 0) openers.splice(index, 1);
  };
}

/** Opens the most recently mounted landing project picker. False when none is mounted. */
export function requestLandingProjectPicker(): boolean {
  const opener = openers.at(-1);
  if (!opener) return false;
  opener();
  return true;
}
