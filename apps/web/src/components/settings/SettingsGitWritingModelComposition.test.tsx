import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { SettingsGitWritingModelComposition } from "./SettingsGitWritingModelComposition";
import {
  DEFAULT_SETTINGS_GIT_WRITING_MODEL_VALUES,
  buildSettingsGitWritingModelOptions,
  parseSettingsGitWritingModelValue,
  readSettingsGitWritingModelValues,
} from "./SettingsGitWritingModelComposition.logic";

describe("SettingsGitWritingModelComposition", () => {
  it("projects normalized server settings and configured custom models", () => {
    const selected = readSettingsGitWritingModelValues({
      textGenerationModelSelection: { provider: "opencode", model: "custom/model" },
    });
    const options = buildSettingsGitWritingModelOptions({
      selected,
      settings: {
        providers: {
          codex: { customModels: [] },
          cursor: { customModels: [] },
          droid: { customModels: [] },
          opencode: { customModels: ["custom/model"] },
        },
      } as never,
    });
    expect(selected).toEqual({ provider: "opencode", model: "custom/model" });
    expect(options).toContainEqual({
      provider: "opencode",
      model: "custom/model",
      label: "OpenCode / custom/model",
    });
    expect(parseSettingsGitWritingModelValue("opencode:custom/model", options)).toEqual(selected);
  });

  it("owns canonical copy and changed reset availability", () => {
    const values = { provider: "droid" as const, model: "droid/auto" };
    const markup = renderToStaticMarkup(
      <SettingsGitWritingModelComposition
        values={values}
        defaults={DEFAULT_SETTINGS_GIT_WRITING_MODEL_VALUES}
        options={[{ ...values, label: "Droid / Auto" }]}
        onChange={vi.fn()}
      />,
    );
    expect(markup).toContain("Generation defaults");
    expect(markup).toContain("Used for generated commit messages, PR titles, and branch names.");
    expect(markup).toContain("Reset git writing model to default");
  });
});
