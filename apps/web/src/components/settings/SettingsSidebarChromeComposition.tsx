// FILE: SettingsSidebarChromeComposition.tsx
// Purpose: Physical-shared Settings sidebar Back/Search order, copy, and capability boundary.

import {
  SettingsSidebarBackButtonElement,
  SettingsSidebarBackIconElement,
  SettingsSidebarBackLabelElement,
  SettingsSidebarBackRegionElement,
  SettingsSidebarChromeRootElement,
  SettingsSidebarSearchElement,
  SettingsSidebarSearchRegionElement,
  SettingsSidebarSearchUnavailableElement,
} from "~/components/settings/SettingsSidebarChromeCompositionElements";

export type SettingsSidebarSearchCapability = "available" | "unavailable";

export function SettingsSidebarChromeComposition(props: {
  readonly onBack: () => void;
  readonly searchCapability: SettingsSidebarSearchCapability;
  readonly searchValue?: string | undefined;
  readonly onSearchValueChange?: ((value: string) => void) | undefined;
  readonly onSubmitSearch?: (() => void) | undefined;
  readonly onEscapeSearch?: (() => void) | undefined;
}) {
  return (
    <SettingsSidebarChromeRootElement>
      <SettingsSidebarBackRegionElement>
        <SettingsSidebarBackButtonElement onActivate={props.onBack}>
          <SettingsSidebarBackIconElement />
          <SettingsSidebarBackLabelElement>Back to app</SettingsSidebarBackLabelElement>
        </SettingsSidebarBackButtonElement>
      </SettingsSidebarBackRegionElement>

      <SettingsSidebarSearchRegionElement>
        {props.searchCapability === "available" ? (
          <SettingsSidebarSearchElement
            value={props.searchValue ?? ""}
            placeholder="Search settings..."
            accessibleLabel="Search settings"
            onValueChange={props.onSearchValueChange}
            onSubmit={props.onSubmitSearch}
            onEscape={props.onEscapeSearch}
          />
        ) : (
          <SettingsSidebarSearchUnavailableElement>
            Search unavailable in this runtime
          </SettingsSidebarSearchUnavailableElement>
        )}
      </SettingsSidebarSearchRegionElement>
    </SettingsSidebarChromeRootElement>
  );
}
