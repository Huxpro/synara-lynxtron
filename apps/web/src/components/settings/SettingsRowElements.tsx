// FILE: SettingsRowElements.tsx
// Purpose: Browser elements beneath the shared SettingsRow composition.
// Layer: Settings UI platform primitive

import type { ReactNode } from "react";

type ElementProps = {
  readonly className?: string | undefined;
  readonly children?: ReactNode | undefined;
};

export function SettingsRowRootElement({
  id,
  className,
  children,
}: ElementProps & { readonly id?: string | undefined }) {
  return (
    <div id={id} className={className} data-slot="settings-row">
      {children}
    </div>
  );
}

export function SettingsRowLayoutElement({
  className,
  children,
  onClick,
}: ElementProps & { readonly onClick?: (() => void) | undefined }) {
  return (
    <div className={className} onClick={onClick}>
      {children}
    </div>
  );
}

export function SettingsRowViewElement({ className, children }: ElementProps) {
  return <div className={className}>{children}</div>;
}

export function SettingsRowTitleElement({ className, children }: ElementProps) {
  return <h3 className={className}>{children}</h3>;
}

export function SettingsRowDescriptionElement({ className, children }: ElementProps) {
  return <p className={className}>{children}</p>;
}

export function SettingsRowInlineElement({ className, children }: ElementProps) {
  return <span className={className}>{children}</span>;
}
