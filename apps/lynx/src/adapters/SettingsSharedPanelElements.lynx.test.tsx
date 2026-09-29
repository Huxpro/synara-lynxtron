import { describe, expect, it } from "@rstest/core";
import { render } from "@lynx-js/react/testing-library";
import { readFileSync } from "node:fs";

import {
  SettingsCardElement,
  SettingsSectionElement,
  SettingsSectionTitleElement,
} from "./SettingsSectionElements.lynx";
import { SettingsRowRootElement, SettingsRowViewElement } from "./SettingsRowElements.lynx";

describe("Shared Settings panel elements", () => {
  it("matches section/card/row anatomy and suppresses each first divider", () => {
    const sectionStyles = readFileSync(
      new URL("./settings-section-elements.css", import.meta.url),
      "utf8",
    );
    const rowStyles = readFileSync(new URL("./settings-row-elements.css", import.meta.url), "utf8");

    render(
      <>
        <SettingsSectionElement className="section">
          <SettingsSectionTitleElement className="title">
            Runtime behavior
          </SettingsSectionTitleElement>
          <SettingsCardElement className="card">
            <SettingsRowRootElement id="setting-assistant-output">
              <text>Assistant output</text>
            </SettingsRowRootElement>
          </SettingsCardElement>
        </SettingsSectionElement>
        <SettingsSectionElement className="section">
          <SettingsSectionTitleElement className="title">
            Safety confirmations
          </SettingsSectionTitleElement>
          <SettingsCardElement className="card">
            <SettingsRowRootElement id="setting-delete-confirmation">
              <text>Delete confirmation</text>
            </SettingsRowRootElement>
          </SettingsCardElement>
        </SettingsSectionElement>
        <SettingsSectionElement className="section">
          <SettingsSectionTitleElement className="title">
            Activity alerts
          </SettingsSectionTitleElement>
          <SettingsCardElement className="card">
            <SettingsRowRootElement id="setting-activity-toasts">
              <text>Activity toasts</text>
            </SettingsRowRootElement>
            <SettingsRowViewElement className="pt-1 text-[11px] text-muted-foreground">
              Unavailable here
            </SettingsRowViewElement>
          </SettingsCardElement>
        </SettingsSectionElement>
      </>,
    );

    const firstRows = elementTree.root?.querySelectorAll(".SharedSettingsRow--first") ?? [];
    expect(firstRows).toHaveLength(3);
    expect(
      elementTree.root?.querySelector("#setting-activity-toasts")?.getAttribute("class"),
    ).toContain("SharedSettingsRow--first");
    expect(elementTree.root?.querySelector(".SharedSettingsRowStatusText")?.textContent).toBe(
      "Unavailable here",
    );
    expect(sectionStyles).toMatch(/\.SharedSettingsSection\s*\{[^}]*gap:\s*6px;/s);
    expect(sectionStyles).toMatch(
      /\.SharedSettingsSectionTitle\s*\{[^}]*font-size:\s*12px;[^}]*font-weight:\s*400;[^}]*line-height:\s*18px;[^}]*opacity:\s*0\.58;/s,
    );
    expect(sectionStyles).toMatch(
      /\.SharedSettingsCard\s*\{[^}]*border-width:\s*1px;[^}]*border-style:\s*solid;[^}]*border-left-color:\s*var\(--border\);[^}]*border-right-color:\s*var\(--border\);[^}]*border-top-color:\s*var\(--border\);[^}]*border-bottom-color:\s*var\(--border\);[^}]*border-radius:\s*10px;[^}]*background-color:\s*transparent;/s,
    );
    expect(rowStyles).toMatch(
      /\.SharedSettingsRow\s*\{[^}]*display:\s*flex;[^}]*flex-direction:\s*column;[^}]*padding:\s*var\(--app-density-settings-row-padding-y,\s*0\.625rem\) 12px;/s,
    );
    expect(rowStyles).toMatch(/\.SharedSettingsRowCopy\s*\{[^}]*gap:\s*2px;/s);
    expect(rowStyles).toMatch(
      /\.SharedSettingsRowTitleLine\s*\{[^}]*min-height:\s*20px;[^}]*gap:\s*6px;/s,
    );
    expect(rowStyles).toMatch(
      /\.SharedSettingsRowStatus\s*\{[^}]*width:\s*100%;[^}]*padding-top:\s*4px;/s,
    );
  });
});
