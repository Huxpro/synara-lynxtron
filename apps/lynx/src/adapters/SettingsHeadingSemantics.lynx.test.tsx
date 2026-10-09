import { describe, expect, it } from "@rstest/core";
import { render } from "@lynx-js/react/testing-library";

import {
  SettingsAppearanceRowElement,
  SettingsAppearanceSectionElement,
} from "./SettingsAppearanceCompositionElements.lynx";
import {
  SettingsGeneralRowElement,
  SettingsGeneralSectionElement,
} from "./SettingsGeneralCompositionElements.lynx";
import {
  SettingsGitWritingModelRowElement,
  SettingsGitWritingModelSectionElement,
} from "./SettingsGitWritingModelCompositionElements.lynx";
import { SettingsPanelHeaderTitleElement } from "./SettingsPanelHeaderCompositionElements.lynx";
import { SettingsProviderPickerElement } from "./SettingsProviderPickerCompositionElements.lynx";
import { SettingsRowTitleElement } from "./SettingsRowElements.lynx";
import { SettingsSectionTitleElement } from "./SettingsSectionElements.lynx";

function expectNativeHeading(selector: string) {
  const headings = Array.from(elementTree.root?.querySelectorAll(selector) ?? []);
  expect(headings.length).toBeGreaterThan(0);
  for (const heading of headings) {
    expect(heading.getAttribute("accessibility-element")).toBe("true");
    expect(heading.getAttribute("accessibility-heading")).toBe("true");
    expect(heading.getAttribute("accessibility-trait")).toBe("header");
  }
}

describe("Settings heading semantics", () => {
  it("maps Web h1, h2, and h3 owners to Native header semantics", () => {
    render(
      <view>
        <SettingsPanelHeaderTitleElement>General</SettingsPanelHeaderTitleElement>
        <SettingsSectionTitleElement className="section">Core defaults</SettingsSectionTitleElement>
        <SettingsRowTitleElement>Default provider</SettingsRowTitleElement>
      </view>,
    );

    for (const selector of [
      ".SharedSettingsPanelHeaderTitle",
      ".SharedSettingsSectionTitle",
      ".SharedSettingsRowTitle",
    ]) {
      expectNativeHeading(selector);
    }
  });

  it("preserves header semantics in private Settings section and row layouts", () => {
    render(
      <view>
        <SettingsAppearanceSectionElement title="Theme and typography">
          <SettingsAppearanceRowElement
            title="Theme"
            description="Choose the interface theme."
            resetLabel="theme"
            changed={false}
            onReset={() => {}}
          />
        </SettingsAppearanceSectionElement>
        <SettingsGeneralSectionElement title="Defaults">
          <SettingsGeneralRowElement
            title="Default provider"
            description="Choose the provider used for new threads."
            resetLabel="default provider"
            changed={false}
            onReset={() => {}}
          />
        </SettingsGeneralSectionElement>
        <SettingsGitWritingModelSectionElement title="Git">
          <SettingsGitWritingModelRowElement
            title="Writing model"
            description="Choose the model used for Git copy."
            changed={false}
            onReset={() => {}}
          />
        </SettingsGitWritingModelSectionElement>
        <SettingsProviderPickerElement
          sectionTitle="Provider picker"
          title="Visible providers"
          description="Choose providers shown in the picker."
          status="One provider"
          changed={false}
          items={[]}
          onReset={() => {}}
          onHiddenChange={() => {}}
          onMove={() => {}}
          onReorder={() => {}}
        />
      </view>,
    );

    for (const selector of [
      ".SharedSettingsAppearanceSectionTitle",
      ".SharedSettingsAppearanceRowTitle",
      ".SharedSettingsGeneralSectionTitle",
      ".SharedSettingsGeneralRowTitle",
      ".SharedSettingsProviderPickerSectionTitle",
      ".SharedSettingsProviderPickerTitle",
    ]) {
      expectNativeHeading(selector);
    }
  });
});
