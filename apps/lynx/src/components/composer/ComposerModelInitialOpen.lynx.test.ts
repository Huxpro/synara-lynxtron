import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("Native Composer model initial-open state", () => {
  it("mounts the landing popup with already-refreshed provider statuses", () => {
    const pickerSource = readFileSync(
      new URL("./ComposerModelPicker.lynx.tsx", import.meta.url),
      "utf8",
    );
    const composerSource = readFileSync(new URL("./Composer.lynx.tsx", import.meta.url), "utf8");
    const landingSource = readFileSync(
      new URL("./LandingComposer.lynx.tsx", import.meta.url),
      "utf8",
    );

    expect(pickerSource).toContain("props.initialOpen ?? false");
    expect(pickerSource).toContain(
      "props.initialOpen || initData.initialComposerModelMenuOpen === true",
    );
    expect(pickerSource).toContain("ComposerModelTriggerLynx--disabled");
    expect(composerSource).toContain(
      "providers={providerStatuses ?? serverConfig?.providers ?? []}",
    );
    expect(composerSource).toContain("isProviderKind(initData.initialComposerModelProvider)");
    expect(composerSource).toContain("initialOpen={Boolean(initialModelMenuProvider)}");
    expect(composerSource).toContain("EMPTY_ASSISTANT_SELECTIONS");
    expect(composerSource).toContain("EMPTY_NON_PERSISTED_IMAGE_IDS");
    expect(composerSource).not.toMatch(/assistantSelections\s*\?\?\s*\[\]/);
    expect(composerSource).not.toMatch(/nonPersistedImageIds\s*\?\?\s*\[\]/);
    expect(landingSource).toContain("providerStatuses={data.serverConfig.providers}");
  });
});
