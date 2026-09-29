// FILE: SettingsPanelHeaderComposition.tsx
// Purpose: Physical-shared settings panel title, description, and restore action.

import type { SettingsSectionId } from "../../settingsNavigation";
import { resolveSettingsPanelHeader } from "./SettingsPanelHeaderComposition.logic";
import {
  SettingsPanelHeaderCopyElement,
  SettingsPanelHeaderDescriptionElement,
  SettingsPanelHeaderRestoreElement,
  SettingsPanelHeaderRootElement,
  SettingsPanelHeaderTitleElement,
} from "~/components/settings/SettingsPanelHeaderCompositionElements";

export function SettingsPanelHeaderComposition(props: {
  readonly section: SettingsSectionId;
  readonly restoreDisabled: boolean;
  readonly onRestore: () => void;
}) {
  const copy = resolveSettingsPanelHeader(props.section);

  return (
    <SettingsPanelHeaderRootElement>
      <SettingsPanelHeaderCopyElement>
        <SettingsPanelHeaderTitleElement>{copy.title}</SettingsPanelHeaderTitleElement>
        <SettingsPanelHeaderDescriptionElement>
          {copy.description}
        </SettingsPanelHeaderDescriptionElement>
      </SettingsPanelHeaderCopyElement>
      <SettingsPanelHeaderRestoreElement
        disabled={props.restoreDisabled}
        onRestore={props.onRestore}
      />
    </SettingsPanelHeaderRootElement>
  );
}
