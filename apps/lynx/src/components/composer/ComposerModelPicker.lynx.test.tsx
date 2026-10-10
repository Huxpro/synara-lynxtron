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

const CLAUDE_READY = {
  provider: "claudeAgent",
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
    // One capsule per row, named by its chord like Electron's ShortcutKbd.
    expect(
      rows.map((row) =>
        row.querySelector(".ComposerModelPickerKbdLynx")?.getAttribute("accessibility-label"),
      ),
    ).toEqual(rows.map((_, index) => `⌘${index + 1}`));
    expect(
      rows.map((row) =>
        Array.from(
          row.querySelectorAll(".ComposerModelPickerKbdTextLynx"),
          (part) => part.textContent,
        ).join(""),
      ),
    ).toEqual(rows.map((_, index) => `⌘${index + 1}`));
    expect(rowNamed("GPT-5.6 Luna").getAttribute("class")).toContain(
      "ComposerModelPickerRowLynx--selected",
    );
    expect(query(".ComposerEffortSliderCardLabelLynx").textContent).toBe("Low");
    // The thumb carries the slider's name and value, as Electron's thumb input does.
    const thumb = query(".ComposerEffortSliderThumbLynx");
    expect(thumb.getAttribute("accessibility-label")).toBe("Reasoning effort");
    expect(thumb.getAttribute("accessibility-value")).toBe("Low");
    expect(query(".ComposerModelPickerTabStripLynx").getAttribute("accessibility-label")).toBe(
      "Model sources",
    );
  });

  // Upstream's in-thread handoff: a started thread's picker is not locked, so the other
  // providers' models are listed and can be picked; sending then hands the thread off.
  it("lists and selects another provider's models in a started thread", async () => {
    const props = renderPicker({
      lockedProvider: null,
      providers: [CODEX_READY, CLAUDE_READY],
    });
    await openPicker();

    expect(all(".ComposerModelPickerTabLynx").map((tab) => tab.getAttribute("aria-label"))).toEqual(
      ["Starred", "Codex", "Claude"],
    );
    const claude = all(".ComposerModelPickerTabLynx").find(
      (tab) => tab.getAttribute("aria-label") === "Claude",
    );
    if (!claude) throw new Error("expected the Claude tab");
    fireEvent.tap(claude);
    // The tab reads that provider's catalog, as it does on a new thread.
    expect(props.onCatalogProviderChange).toHaveBeenCalledWith("claudeAgent");
    const rows = await waitFor(() => {
      const claudeRows = all(".ComposerModelPickerRowLynx");
      if (claudeRows.length === 0) throw new Error("expected Claude's models");
      return claudeRows;
    });
    // No row of the handoff target is the current model, and none carries a handoff mark:
    // upstream lists them exactly as on a new thread.
    expect(
      rows.some((row) =>
        (row.getAttribute("class") ?? "").includes("ComposerModelPickerRowLynx--selected"),
      ),
    ).toBe(false);
    expect(elementTree.root?.textContent ?? "").not.toMatch(/cannot take over|Native app yet/);

    fireEvent.tap(rows[0]!);
    expect(props.onModelSelectionChange).toHaveBeenCalledTimes(1);
    expect(props.onModelSelectionChange).toHaveBeenCalledWith(
      expect.objectContaining({ provider: "claudeAgent" }),
    );
  });

  it("shows the pending handoff target on the trigger once it is the composer's selection", () => {
    renderPicker({
      lockedProvider: null,
      modelSelection: { provider: "claudeAgent", model: "claude-opus-4-8" } as ModelSelection,
      catalogProvider: "claudeAgent",
      runtimeModels: [],
      providers: [CODEX_READY, CLAUDE_READY],
    });
    // The thread's own provider no longer overrides what the trigger shows.
    expect(query(".ComposerModelTriggerLabelLynx").textContent).toMatch(/Opus/);
  });

  it("offers only its own provider when locked, as upstream's locked picker does", async () => {
    const onOpenProviderSettings = rs.fn();
    renderPicker({
      lockedProvider: "codex",
      providers: [CODEX_READY, CLAUDE_READY],
      onOpenProviderSettings,
    });
    await openPicker();
    expect(all(".ComposerModelPickerTabLynx").map((tab) => tab.getAttribute("aria-label"))).toEqual(
      ["Starred", "Codex"],
    );
  });

  it("offers Add providers on a new and on a started thread", async () => {
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
