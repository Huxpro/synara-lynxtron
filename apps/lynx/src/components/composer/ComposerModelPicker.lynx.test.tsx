import { fireEvent, render, waitFor } from "@lynx-js/react/testing-library";
import { beforeEach, describe, expect, it, rs } from "@rstest/core";

import type {
  ModelSelection,
  ProviderModelDescriptor,
  ServerProviderStatus,
} from "@synara/contracts";
import { STARRED_MODELS_STORAGE_KEY } from "@synara-web/lib/starredModels";

import { webStorage } from "../../platform/storage";
import { ComposerModelPicker, type ComposerModelPickerProps } from "./ComposerModelPicker.lynx";

const CODEX_READY = {
  provider: "codex",
  available: true,
  authStatus: "authenticated",
} as unknown as ServerProviderStatus;

const LUNA_LOW: ModelSelection = {
  provider: "codex",
  model: "gpt-5.6-luna",
  options: { reasoningEffort: "low" },
} as ModelSelection;

// Codex's effort ladder comes from runtime discovery, as it does for Electron.
const CODEX_RUNTIME_MODELS = ["gpt-5.6-sol", "gpt-5.6-terra", "gpt-5.6-luna"].map((slug) => ({
  slug,
  name: slug,
  supportedReasoningEfforts: ["low", "medium", "high", "xhigh"].map((value) => ({ value })),
  defaultReasoningEffort: "medium",
  supportsFastMode: true,
})) as unknown as ReadonlyArray<ProviderModelDescriptor>;

function renderPicker(overrides: Partial<ComposerModelPickerProps> = {}) {
  const props: ComposerModelPickerProps = {
    modelSelection: LUNA_LOW,
    lockedProvider: "codex",
    catalogProvider: "codex",
    runtimeModels: CODEX_RUNTIME_MODELS,
    modelsLoading: false,
    providers: [CODEX_READY],
    onCatalogProviderChange: rs.fn(),
    onModelSelectionChange: rs.fn(),
    ...overrides,
  };
  render(<ComposerModelPicker {...props} />);
  return props;
}

function all(selector: string): Element[] {
  return Array.from(elementTree.root?.querySelectorAll(selector) ?? []);
}

function query(selector: string): Element {
  const element = elementTree.root?.querySelector(selector);
  if (!element) throw new Error(`expected ${selector}`);
  return element;
}

async function openPicker() {
  const trigger = query(".ComposerModelTriggerLynx");
  expect(trigger.getAttribute("aria-label")).toBe("Change model and reasoning");
  fireEvent.tap(trigger);
  return waitFor(() => {
    const rows = all(".ComposerModelPickerRowLynx");
    if (rows.length === 0) throw new Error("expected an open model picker");
    return rows;
  });
}

function rowNamed(name: string): Element {
  const row = all(".ComposerModelPickerRowLynx").find(
    (candidate) => candidate.querySelector(".ComposerModelPickerRowNameLynx")?.textContent === name,
  );
  if (!row) throw new Error(`expected a ${name} row`);
  return row;
}

describe("Lynx composer model picker", () => {
  beforeEach(() => {
    webStorage.removeItem(STARRED_MODELS_STORAGE_KEY);
  });

  it("labels the trigger with the model and effort, then covers it while open", async () => {
    renderPicker();
    expect(query(".ComposerModelTriggerLabelLynx").textContent).toBe("GPT-5.6 Luna");
    expect(query(".ComposerModelTriggerMetaLynx").textContent).toBe("Low");
    expect(elementTree.root?.querySelector(".ComposerModelTriggerPlaceholderLynx")).toBeNull();

    await openPicker();
    expect(query(".ComposerModelTriggerPlaceholderLynx").textContent).toBe("Select effort");
    expect(query(".ComposerModelTriggerLabelGroupLynx").getAttribute("class")).toContain(
      "ComposerModelTriggerLabelGroupLynx--covered",
    );
  });

  it("opens a locked thread on its provider tab with shortcut hints and the effort slider", async () => {
    renderPicker();
    const rows = await openPicker();

    expect(all(".ComposerModelPickerTabLynx").map((tab) => tab.getAttribute("aria-label"))).toEqual(
      ["Starred", "Codex"],
    );
    expect(query(".ComposerModelPickerTabLynx--active").getAttribute("aria-label")).toBe("Codex");
    expect(
      rows.map((row) => row.querySelector(".ComposerModelPickerKbdTextLynx")?.textContent),
    ).toEqual(rows.map((_, index) => `⌘${index + 1}`));
    expect(rowNamed("GPT-5.6 Luna").getAttribute("class")).toContain(
      "ComposerModelPickerRowLynx--selected",
    );
    expect(query(".ComposerEffortSliderCardLabelLynx").textContent).toBe("Low");
    expect(query(".ComposerEffortSliderLynx").getAttribute("accessibility-value")).toBe("Low");
  });

  it("offers Add providers only while the provider can still change", async () => {
    const onOpenProviderSettings = rs.fn();
    renderPicker({ lockedProvider: null, onOpenProviderSettings });
    await openPicker();
    const add = all(".ComposerModelPickerTabLynx").find(
      (tab) => tab.getAttribute("aria-label") === "Add providers",
    );
    if (!add) throw new Error("expected the Add providers tab");
    fireEvent.tap(add);
    expect(onOpenProviderSettings).toHaveBeenCalledTimes(1);
  });

  it("keeps the panel open after switching to a model with an effort ladder", async () => {
    const props = renderPicker();
    await openPicker();
    fireEvent.tap(rowNamed("GPT-5.6 Sol"));

    expect(props.onModelSelectionChange).toHaveBeenCalledWith(
      expect.objectContaining({ provider: "codex", model: "gpt-5.6-sol" }),
    );
    expect(all(".ComposerModelPickerRowLynx").length).toBeGreaterThan(0);
  });

  it("closes when the current model is picked again", async () => {
    const props = renderPicker();
    await openPicker();
    fireEvent.tap(rowNamed("GPT-5.6 Luna"));

    expect(props.onModelSelectionChange).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      if (all(".ComposerModelPickerRowLynx").length > 0)
        throw new Error("expected a closed picker");
    });
  });

  it("stars a model with its current traits and reopens on the Starred tab", async () => {
    renderPicker();
    await openPicker();
    const star = rowNamed("GPT-5.6 Luna").querySelector(".ComposerModelPickerStarLynx");
    if (!star) throw new Error("expected a star toggle");
    expect(star.getAttribute("aria-label")).toBe(
      "Star GPT-5.6 Luna with its current effort and speed",
    );
    fireEvent(star, new Event("catchEvent:tap", { bubbles: true }));

    expect(JSON.parse(webStorage.getItem(STARRED_MODELS_STORAGE_KEY) ?? "[]")).toEqual([
      expect.objectContaining({ provider: "codex", model: "gpt-5.6-luna", effort: "low" }),
    ]);

    fireEvent.tap(query(".ComposerModelTriggerLynx"));
    await waitFor(() => {
      if (all(".ComposerModelPickerRowLynx").length > 0)
        throw new Error("expected a closed picker");
    });
    await openPicker();
    expect(query(".ComposerModelPickerTabLynx--active").getAttribute("aria-label")).toBe("Starred");
    expect(all(".ComposerModelPickerRowNameLynx").map((node) => node.textContent)).toEqual([
      "GPT-5.6 Luna",
    ]);
    expect(query(".ComposerModelPickerRowDetailLynx").textContent).toBe("Low");
  });

  it("commits a new effort from the slider", async () => {
    const props = renderPicker();
    await openPicker();
    const stops = all(".ComposerEffortSliderHitLynx");
    expect(stops.length).toBeGreaterThan(2);
    fireEvent(stops[2]!, new Event("bindEvent:mousedown", { bubbles: true }));

    expect(props.onModelSelectionChange).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-5.6-luna",
        options: expect.objectContaining({ reasoningEffort: expect.any(String) }),
      }),
    );
  });
});
