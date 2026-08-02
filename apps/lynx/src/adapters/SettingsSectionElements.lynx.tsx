import type { ReactNode } from 'react';

import './settings-section-elements.css';

type ElementProps = {
  readonly className: string;
  readonly children: ReactNode;
};

export function SettingsSectionElement({ className, children }: ElementProps) {
  return <view className={`SharedSettingsSection ${className}`}>{children}</view>;
}

export function SettingsSectionTitleElement({ className, children }: ElementProps) {
  return <text className={`SharedSettingsSectionTitle ${className}`}>{children}</text>;
}

export function SettingsCardElement({ className, children }: ElementProps) {
  return <view className={`SharedSettingsCard ${className}`}>{children}</view>;
}

export function SettingsPanelStackElement({ className, children }: ElementProps) {
  return <view className={`SharedSettingsPanelStack ${className}`}>{children}</view>;
}
