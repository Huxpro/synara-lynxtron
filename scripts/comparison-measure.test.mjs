import { describe, expect, it } from "vitest";

import {
  compareEdgePaint,
  edgePaint,
  nativeNodesMatchingClasses,
  parseCssColor,
  pickNode,
} from "./comparison-measure.mjs";

const box = { x: 664, y: 46, width: 415, height: 46 };

describe("comparison measurements", () => {
  it("parses every color serialization Chromium and Lynx emit", () => {
    expect(parseCssColor("rgba(252,252,252,0.0705882)")).toEqual([252, 252, 252, 0.0705882]);
    expect(parseCssColor("hsla(0,0%,99%,.042)")?.[3]).toBeCloseTo(0.042);
    expect(parseCssColor("color(srgb 0.988235 0.988235 0.988235 / 0.0423529)")?.[0]).toBeCloseTo(
      252,
      0,
    );
    const oklab = parseCssColor("oklab(0.991063 0.0000452101 0.0000197887 / 0.0458824)");
    expect(Math.round(oklab?.[0] ?? 0)).toBe(252);
    expect(oklab?.[3]).toBeCloseTo(0.0458824, 6);
    expect(parseCssColor("not-a-color")).toBeNull();
  });

  it("reduces a border edge and a layout-neutral gradient hairline to one record", () => {
    expect(
      edgePaint(
        {
          "border-bottom-width": "1px",
          "border-bottom-style": "solid",
          "border-bottom-color": "rgba(252,252,252,0.0705882)",
        },
        box,
        "bottom",
      ),
    ).toEqual({
      kind: "border",
      color: [252, 252, 252, 0.0705882],
      thickness: 1,
      occupiesLayout: true,
      line: { x: 664, y: 91, length: 415 },
    });
    expect(
      edgePaint(
        {
          "background-image": "linear-gradient( hsla(0,0%,99%,.042) , hsla(0,0%,99%,.042))",
          "background-size": "100% 1px",
          "background-position": "0 100%",
        },
        box,
        "bottom",
      ),
    ).toMatchObject({ kind: "gradient", occupiesLayout: false, line: { y: 91 } });
  });

  it("never reads an unrecognized border color as 'no divider'", () => {
    const paint = edgePaint(
      {
        "border-top-width": "1px",
        "border-top-style": "solid",
        "border-top-color": "lab(99 0 0 / 0.07)",
      },
      box,
      "top",
    );
    expect(paint.kind).toBe("unparsed");
    expect(compareEdgePaint(paint, paint).match).toBe(false);
  });

  it("applies the N2 tolerances: alpha within 1/255, edge within 1px, same box model", () => {
    const electron = {
      kind: "gradient",
      color: [252, 252, 252, 0.0423529],
      thickness: 1,
      occupiesLayout: false,
      line: { x: 664, y: 45, length: 415 },
    };
    expect(
      compareEdgePaint(electron, { ...electron, color: [252, 252, 252, 0.0431373] }).match,
    ).toBe(true);
    expect(
      compareEdgePaint(electron, { ...electron, color: [252, 252, 252, 0.0705882] }).problems,
    ).toEqual(["alpha 0.0706 vs Electron 0.0424"]);
    expect(
      compareEdgePaint(electron, { ...electron, kind: "border", occupiesLayout: true }).problems,
    ).toEqual(["occupies layout; Electron does not"]);
    expect(
      compareEdgePaint(electron, { ...electron, line: { x: 664, y: 57, length: 415 } }).problems,
    ).toEqual(["edge offset (0.0, 12.0)px"]);
  });

  it("selects Native nodes by class tokens and Electron nodes by proximity", () => {
    const root = {
      nodeId: 1,
      attributes: ["class", "SliceRoot SliceRoot--theme-dark"],
      children: [
        { nodeId: 2, attributes: ["class", "DockPaneHeader chat-surface-divider"], children: [] },
        { nodeId: 3, attributes: ["class", "DockPaneHeaderTitle"], children: [] },
      ],
    };
    expect(nativeNodesMatchingClasses(root, ".DockPaneHeader").map((node) => node.nodeId)).toEqual([
      2,
    ]);
    expect(
      nativeNodesMatchingClasses(root, ".DockPaneHeader.chat-surface-divider").map(
        (node) => node.nodeId,
      ),
    ).toEqual([2]);
    const nodes = [{ box: { x: 664, y: 0 } }, { box: { x: 664, y: 46 } }];
    expect(pickNode(nodes, { x: 660, y: 44 })).toBe(nodes[1]);
    expect(pickNode(nodes, undefined)).toBe(nodes[0]);
  });
});
