import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

const kanbanStyles = [
  new URL("./kanban-card-composition-elements.css", import.meta.url),
  new URL("./kanban-route-header-composition-elements.css", import.meta.url),
  new URL("./kanban-overview-composition-elements.css", import.meta.url),
  new URL("./kanban-column-composition-elements.css", import.meta.url),
];

describe("Kanban pressed feedback", () => {
  it("keeps cards, headers, and actions at full opacity", () => {
    for (const styleUrl of kanbanStyles) {
      const styles = readFileSync(styleUrl, "utf8");
      expect(styles).not.toMatch(/\.ui-pressed[^{]*\{[^}]*opacity:/s);
    }
  });
});
