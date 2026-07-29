// FILE: SettingsSectionElements.tsx
// Purpose: Browser elements beneath the shared SettingsSection composition.
// Layer: Settings UI platform primitive

import type { ReactNode } from "react";

type ElementProps = {
  readonly className: string;
  readonly children: ReactNode;
};

export function SettingsSectionElement({ className, children }: ElementProps) {
  return <section className={className}>{children}</section>;
}

export function SettingsSectionTitleElement({ className, children }: ElementProps) {
  return <h2 className={className}>{children}</h2>;
}

export function SettingsCardElement({ className, children }: ElementProps) {
  return <div className={className}>{children}</div>;
}

export function SettingsPanelStackElement({ className, children }: ElementProps) {
  return <div className={className}>{children}</div>;
}
