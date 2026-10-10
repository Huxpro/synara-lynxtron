import { fireEvent, render, waitFor } from "@lynx-js/react/testing-library";
import { describe, expect, it } from "@rstest/core";
import type { ModelSelection } from "@synara/contracts";
import type { ProviderHandoffInfo } from "@synara-web/workLog";

import {
  ProviderHandoffDivider,
  providerModelLabel,
  resolveProviderHandoffDividerLabel,
} from "./ProviderHandoffDivider.lynx";

const SOURCE = {
  provider: "codex",
  model: "gpt-5.6-luna",
  options: { reasoningEffort: "low" },
} as ModelSelection;
const TARGET = { provider: "claudeAgent", model: "claude-sonnet-5-5" } as ModelSelection;

function info(overrides: Partial<ProviderHandoffInfo> = {}): ProviderHandoffInfo {
  return {
    status: "completed",
    sourceProvider: "codex",
    sourceModel: SOURCE.model,
    targetProvider: "claudeAgent",
    targetModel: TARGET.model,
    sourceModelSelection: SOURCE,
    targetModelSelection: TARGET,
    contextText: "User: the code word is PLUM",
    failureDetail: null,
    ...overrides,
  };
}

const texts = (selector: string) =>
  Array.from(elementTree.root?.querySelectorAll(selector) ?? [], (node) => node.textContent);
const query = (selector: string) => {
  const element = elementTree.root?.querySelector(selector);
  if (!element) throw new Error(`expected ${selector}`);
  return element;
};

describe("Lynx provider handoff boundary", () => {
  it("names both sides as upstream's divider button does and opens on the transferred context", async () => {
    render(<ProviderHandoffDivider info={info()} />);
    expect(query(".ProviderHandoffDividerTitle").textContent).toBe("Context handoff");
    expect(texts(".ProviderHandoffEndpointModel")).toEqual(["GPT-5.6 Luna", "Claude Sonnet 5.5"]);
    const button = query(".ProviderHandoffDividerButton");
    expect(button.getAttribute("accessibility-label")).toBe(
      resolveProviderHandoffDividerLabel(info()),
    );
    expect(button.getAttribute("accessibility-label")).toMatch(
      /^Context handoff GPT-5\.6 Luna .*Claude Sonnet 5\.5/,
    );
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(elementTree.root?.querySelector(".ProviderHandoffDetails")).toBeNull();

    fireEvent.tap(button);
    await waitFor(() => query(".ProviderHandoffDetails"));
    expect(texts(".ProviderHandoffDetailsTerm")).toEqual(["From", "To", "Context"]);
    expect(texts(".ProviderHandoffDetailsValue")).toEqual([
      providerModelLabel(SOURCE),
      providerModelLabel(TARGET),
      "27 characters",
    ]);
    expect(query(".ProviderHandoffContextTitle").textContent).toBe("Transferred context");
    expect(query(".ProviderHandoffContextText").textContent).toBe("User: the code word is PLUM");
    expect(query(".ProviderHandoffContextNote").textContent).toBe(
      "Sent ahead of your next message so the new model can continue this thread.",
    );
  });

  it("shows a failed handoff with its error and no context", async () => {
    render(
      <ProviderHandoffDivider
        info={info({ status: "failed", contextText: null, failureDetail: "claude is signed out" })}
      />,
    );
    expect(query(".ProviderHandoffDividerTitle").textContent).toBe("Handoff failed");
    expect(query(".ProviderHandoffDividerButton").getAttribute("class")).toContain(
      "ProviderHandoffDividerButton--failed",
    );
    // The target that never started reads struck through.
    expect(texts(".ProviderHandoffEndpoint--struck .ProviderHandoffEndpointModel")).toEqual([
      "Claude Sonnet 5.5",
    ]);
    fireEvent.tap(query(".ProviderHandoffDividerButton"));
    await waitFor(() => query(".ProviderHandoffDetails"));
    expect(texts(".ProviderHandoffDetailsTerm")).toEqual(["From", "To", "Error"]);
    expect(texts(".ProviderHandoffDetailsValue").at(-1)).toBe("claude is signed out");
    expect(elementTree.root?.querySelector(".ProviderHandoffContextSection")).toBeNull();
  });

  it("labels a side as provider · model, like upstream's details block", () => {
    // Codex's effort ladder comes from runtime discovery; a stored selection has none.
    expect(providerModelLabel(SOURCE)).toBe("Codex · GPT-5.6 Luna");
    expect(providerModelLabel({ provider: "codex", model: "" } as ModelSelection)).toBe("Codex · ");
  });
});
