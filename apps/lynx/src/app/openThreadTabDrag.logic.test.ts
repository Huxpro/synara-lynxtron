import { describe, expect, it } from "@rstest/core";

import {
  createOpenThreadTabDragSession,
  moveOpenThreadTabDrag,
  OPEN_THREAD_TAB_DRAG_ACTIVATION_PX,
  resolveOpenThreadTabSlot,
  resolveOpenThreadTabWidth,
} from "./openThreadTabDrag.logic";

const metrics = { basisPx: 216, floorPx: 108, gapPx: 4 };
const keys = ["a", "b", "c"];
// Three 216px tabs in a 900px row that starts at x=300: slots at 300, 520, 740.
const geometry = { listLeft: 300, listWidth: 900 };

describe("open thread tab width", () => {
  it("is the basis while the row has room, then shrinks evenly to the floor", () => {
    expect(resolveOpenThreadTabWidth(900, 3, metrics)).toBe(216);
    expect(resolveOpenThreadTabWidth(500, 3, metrics)).toBe((500 - 8) / 3);
    expect(resolveOpenThreadTabWidth(200, 3, metrics)).toBe(108);
  });
});

describe("resolveOpenThreadTabSlot", () => {
  const slot = (pointerX: number, row = geometry) =>
    resolveOpenThreadTabSlot({ pointerX, tabCount: 3, geometry: row, metrics });

  it("picks the tab whose centre is closest, splitting the gap", () => {
    expect(slot(300)).toBe(0);
    expect(slot(517)).toBe(0);
    expect(slot(518)).toBe(1);
    expect(slot(737)).toBe(1);
    expect(slot(738)).toBe(2);
  });

  it("holds the first and last slot past either end", () => {
    expect(slot(0)).toBe(0);
    expect(slot(5000)).toBe(2);
  });

  it("follows the row when the strip is scrolled and the tabs have shrunk", () => {
    // 3 tabs at the 108px floor, the row scrolled 100px to the left of the strip at x=300.
    const scrolled = { listLeft: 200, listWidth: 332 };
    expect(slot(300, scrolled)).toBe(0);
    expect(slot(311, scrolled)).toBe(1);
    expect(slot(425, scrolled)).toBe(2);
  });
});

describe("moveOpenThreadTabDrag", () => {
  const session = createOpenThreadTabDragSession("a", { x: 400, y: 16 });
  const move = (
    point: { x: number; y: number } | null,
    overrides: Partial<Parameters<typeof moveOpenThreadTabDrag<string>>[0]> = {},
  ) => moveOpenThreadTabDrag({ session, point, buttons: 1, keys, geometry, metrics, ...overrides });

  it("stays a click until the press has travelled upstream's 6px", () => {
    expect(OPEN_THREAD_TAB_DRAG_ACTIVATION_PX).toBe(6);
    expect(move({ x: 405, y: 16 })).toEqual({ kind: "pending" });
    expect(move({ x: 403, y: 20 })).toEqual({ kind: "pending" });
    const result = move({ x: 406, y: 16 });
    expect(result.kind).toBe("dragging");
    if (result.kind === "dragging") {
      expect(result.session.activated).toBe(true);
      expect(result.overKey).toBeNull();
    }
  });

  it("names the tab whose slot the pointer entered, and nothing over its own slot", () => {
    const over = (x: number) => {
      const result = move({ x, y: 16 });
      return result.kind === "dragging" ? result.overKey : result.kind;
    };
    expect(over(500)).toBeNull();
    expect(over(600)).toBe("b");
    expect(over(900)).toBe("c");
    expect(over(2000)).toBe("c");
  });

  it("moves nothing before the row is measured or after the tab is gone", () => {
    const unmeasured = move({ x: 900, y: 16 }, { geometry: null });
    expect(unmeasured.kind === "dragging" && unmeasured.overKey).toBe(null);
    const closed = move({ x: 900, y: 16 }, { keys: ["b", "c"] });
    expect(closed.kind === "dragging" && closed.overKey).toBe(null);
  });

  it("ends when a move reports no pressed button", () => {
    expect(move({ x: 900, y: 16 }, { buttons: 0 })).toEqual({ kind: "ended" });
    // Hosts that report no bitfield (touch) keep the drag.
    expect(move({ x: 900, y: 16 }, { buttons: null }).kind).toBe("dragging");
  });

  it("keeps an active drag through a move without coordinates", () => {
    const active = { ...session, activated: true };
    expect(move(null, { session: active })).toEqual({
      kind: "dragging",
      session: active,
      overKey: null,
    });
    expect(move(null)).toEqual({ kind: "pending" });
  });
});
