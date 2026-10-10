import { describe, expect, it } from "vitest";

import {
  CHANNEL_THRESHOLD,
  channelDistance,
  compareColours,
  compareDefaultPackColourMix,
  compareSurface,
  compareTokens,
  deltaE,
  generatedColourMixTokens,
  gridDifference,
  groupFindings,
  inlineCustomProperties,
  nativeItems,
  over,
  pairByKey,
  regionColours,
  seenForeground,
  summaryMarkdown,
  svgPaint,
  tally,
  themeBlockDeclarations,
  translucentDistance,
  withOpacity,
} from "./comparison-colours.mjs";

/** A solid image with optional painted rectangles, in device pixels (scale 2). */
function image(width, height, fill, rects = [], channels = 4) {
  const data = new Uint8Array(width * height * channels);
  const paint = (x, y, colour) => {
    const offset = (y * width + x) * channels;
    for (let index = 0; index < channels; index += 1) data[offset + index] = colour[index] ?? 255;
  };
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) paint(x, y, fill);
  for (const rect of rects) {
    for (let y = rect.y; y < rect.y + rect.height; y += 1) {
      for (let x = rect.x; x < rect.x + rect.width; x += 1) paint(x, y, rect.colour);
    }
  }
  return { data, width, height, channels, scale: 2 };
}

describe("colour arithmetic", () => {
  it("composites a translucent colour over an opaque one", () => {
    expect(over([252, 252, 252, 0.5], [16, 16, 16])).toEqual([134, 134, 134]);
    expect(over([10, 20, 30, 1], [200, 200, 200])).toEqual([10, 20, 30]);
    expect(withOpacity([1, 2, 3, 0.5], 0.5)).toEqual([1, 2, 3, 0.25]);
  });

  it("measures the largest channel difference and a perceptual distance", () => {
    expect(channelDistance([10, 20, 30], [12, 14, 30])).toBe(6);
    expect(deltaE([0, 0, 0], [0, 0, 0])).toBe(0);
    expect(deltaE([255, 255, 255], [0, 0, 0])).toBeCloseTo(100, 0);
  });

  it("accepts a pair up to the threshold and rejects the next level", () => {
    expect(compareColours([100, 100, 100], [100 + CHANNEL_THRESHOLD, 100, 100]).within).toBe(true);
    expect(compareColours([100, 100, 100], [101 + CHANNEL_THRESHOLD, 100, 100]).within).toBe(false);
  });

  it("compares translucent colours over both extremes", () => {
    // Same over black, different over white: alpha matters.
    expect(translucentDistance([0, 0, 0, 0.5], [0, 0, 0, 1])).toBeCloseTo(127.5);
    expect(translucentDistance([10, 10, 10, 0.5], [10, 10, 10, 0.5])).toBe(0);
  });

  it("reads the paint an inline SVG carries, skipping none and currentColor", () => {
    expect(
      svgPaint('<svg fill="none"><path stroke="rgba(252, 252, 252, 0.58)" d="M0 0"/></svg>'),
    ).toEqual([252, 252, 252, 0.58]);
    expect(svgPaint('<svg fill="currentColor"><path fill="#00bc7d"/></svg>')).toEqual([
      0, 188, 125, 1,
    ]);
    expect(svgPaint('<svg fill="none"></svg>')).toBeNull();
  });
});

describe("screenshot regions", () => {
  it("separates the background from the dominant foreground", () => {
    const shot = image(
      40,
      40,
      [17, 17, 17, 255],
      [
        { x: 10, y: 10, width: 8, height: 8, colour: [252, 252, 252, 255] },
        // An anti-aliased fringe between the two is neither.
        { x: 18, y: 10, width: 2, height: 8, colour: [120, 120, 120, 255] },
      ],
    );
    const region = regionColours(shot, { x: 0, y: 0, width: 20, height: 20 }, [16, 16, 16]);
    expect(region.background).toEqual([17, 17, 17]);
    expect(region.foreground).toEqual([252, 252, 252]);
    expect(region.glass).toBe(0);
  });

  it("composites translucent pixels over the window backdrop", () => {
    const shot = image(8, 8, [14, 14, 14, 230]);
    const region = regionColours(shot, { x: 0, y: 0, width: 4, height: 4 }, [16, 16, 16]);
    expect(region.background).toEqual([14, 14, 14]);
    expect(region.glass).toBe(100);
  });

  it("reports no foreground on a flat region and nothing outside the image", () => {
    const shot = image(8, 8, [255, 255, 255, 255]);
    expect(regionColours(shot, { x: 0, y: 0, width: 4, height: 4 }, [0, 0, 0]).foreground).toBe(
      null,
    );
    expect(regionColours(shot, { x: 50, y: 50, width: 4, height: 4 }, [0, 0, 0])).toBeNull();
  });

  it("counts the grid cells whose colour differs", () => {
    const left = image(40, 40, [17, 17, 17, 255]);
    const right = image(
      40,
      40,
      [17, 17, 17, 255],
      [{ x: 0, y: 0, width: 20, height: 20, colour: [40, 40, 40, 255] }],
    );
    const grid = gridDifference(left, right, [16, 16, 16], { width: 20, height: 20 }, 10);
    expect(grid.cells).toBe(4);
    expect(grid.differing).toEqual([{ x: 0, y: 0, channel: 23 }]);
  });
});

describe("pairing", () => {
  const item = (key, x, y) => ({ key, box: { x, y, width: 10, height: 10 } });

  it("pairs unique keys and repeated keys in reading order", () => {
    const { pairs, unpaired } = pairByKey(
      [item("Copy", 0, 100), item("Copy", 0, 10), item("Only web", 0, 0), item("Twice", 0, 0)],
      [
        item("Copy", 5, 12),
        item("Copy", 5, 98),
        item("Only native", 0, 0),
        item("Twice", 0, 0),
        item("Twice", 9, 9),
      ],
    );
    expect(pairs.map((pair) => [pair.electron.box.y, pair.native.box.y])).toEqual([
      [10, 12],
      [100, 98],
    ]);
    expect(unpaired).toEqual({
      electronOnly: ["Only web"],
      nativeOnly: ["Only native"],
      countMismatch: ["Twice"],
    });
  });

  it("flattens a Lynx tree into text runs and labelled controls, clipped to scroll containers", () => {
    const box = (x, y, width, height) => ({
      border: [x, y, x + width, y, x + width, y + height, x, y + height],
      width,
      height,
    });
    const root = {
      nodeName: "VIEW",
      nodeId: 1,
      attributes: [],
      box_model: box(0, 0, 100, 100),
      children: [
        {
          nodeName: "SCROLL-VIEW",
          nodeId: 2,
          attributes: [],
          box_model: box(0, 0, 100, 50),
          children: [
            {
              nodeName: "TEXT",
              nodeId: 3,
              attributes: ["text", "Visible"],
              box_model: box(0, 10, 50, 10),
              children: [],
            },
            {
              nodeName: "TEXT",
              nodeId: 4,
              attributes: ["text", "Scrolled away"],
              box_model: box(0, 70, 50, 10),
              children: [],
            },
            {
              nodeName: "TEXT",
              nodeId: 5,
              attributes: [],
              box_model: box(0, 30, 80, 10),
              children: [
                { nodeName: "RAW-TEXT", nodeId: 6, attributes: ["text", "Use "], children: [] },
                {
                  nodeName: "TEXT",
                  nodeId: 7,
                  attributes: ["text", "const"],
                  box_model: box(0, 30, 0, 0),
                  children: [],
                },
              ],
            },
          ],
        },
        {
          nodeName: "VIEW",
          nodeId: 8,
          attributes: ["accessibility-label", "Send message"],
          box_model: box(60, 60, 20, 20),
          children: [
            {
              nodeName: "SVG",
              nodeId: 9,
              attributes: ["content", '<svg><path stroke="#fff"/></svg>'],
              box_model: box(62, 62, 16, 16),
              children: [],
            },
          ],
        },
      ],
    };
    const items = nativeItems(root, { x: 0, y: 0, width: 100, height: 100 });
    expect(items.texts.map((text) => [text.key, text.borrowedBox])).toEqual([
      ["Visible", false],
      ["Use", false],
      ["const", true],
    ]);
    expect(items.texts[2].box).toEqual({ x: 0, y: 30, width: 80, height: 10 });
    expect(items.controls.map((control) => [control.key, control.iconBox])).toEqual([
      ["Send message", { x: 62, y: 62, width: 16, height: 16 }],
    ]);
  });
});

describe("what a renderer shows", () => {
  const region = { background: [17, 17, 17], foreground: [226, 226, 226] };

  it("uses the computed colour when the pixels agree with it", () => {
    const seen = seenForeground([252, 252, 252, 0.89], 1, region);
    expect(seen.method).toBe("style");
    expect(Math.round(seen.seen[0])).toBe(226);
  });

  it("believes the pixels when the computed colour is unset or far from them", () => {
    expect(seenForeground([0, 0, 0, 1], 1, region)).toEqual({
      seen: [226, 226, 226],
      method: "pixel",
    });
    expect(seenForeground([252, 252, 252, 0.3], 1, region).method).toBe("pixel");
  });

  it("cannot arbitrate an inline run measured over its paragraph", () => {
    expect(seenForeground([0, 0, 0, 1], 1, region, { borrowedBox: true })).toBeNull();
    expect(seenForeground([254, 133, 73, 1], 1, region, { borrowedBox: true }).method).toBe(
      "style",
    );
  });

  it("builds text, background, border and icon records for one surface", () => {
    const shot = (text, icon) =>
      image(
        200,
        100,
        [17, 17, 17, 255],
        [
          { x: 4, y: 4, width: 30, height: 12, colour: text },
          { x: 124, y: 44, width: 12, height: 12, colour: icon },
        ],
      );
    const side = (text, icon, border) => ({
      image: shot([...text, 255], [...icon, 255]),
      texts: [
        {
          key: "Hello",
          box: { x: 0, y: 0, width: 40, height: 10 },
          colour: [...text, 1],
          opacity: 1,
        },
      ],
      controls: [
        {
          key: "Close",
          box: { x: 55, y: 15, width: 20, height: 20 },
          opacity: 1,
          border,
          icon: [...icon, 1],
          iconOpacity: 1,
          iconBox: { x: 60, y: 20, width: 10, height: 10 },
        },
      ],
    });
    const { records, unpaired } = compareSurface(
      "thread",
      side([252, 252, 252], [150, 150, 150], [40, 40, 40, 1]),
      side([252, 252, 252], [95, 95, 95], null),
      [16, 16, 16],
    );
    const byKind = Object.fromEntries(records.map((record) => [record.kind, record]));
    expect(Object.keys(byKind).toSorted()).toEqual([
      "background",
      "border",
      "control",
      "icon",
      "text",
    ]);
    expect(byKind.text.within).toBe(true);
    expect(byKind.background.within).toBe(true);
    // A border only one side declares is compared with the other side's background.
    expect(byKind.border).toMatchObject({ within: false, channel: 23 });
    expect(byKind.icon).toMatchObject({ within: false, channel: 55 });
    expect(unpaired.texts.electronOnly).toEqual([]);
    expect(tally(records).total).toEqual({ compared: 5, within: 3 });
    const findings = groupFindings(records);
    expect(findings.map((finding) => finding.kind)).toEqual(["icon", "border"]);
    expect(findings[0]).toMatchObject({ electron: "#969696", native: "#5f5f5f", count: 1 });
  });
});

describe("theme tokens", () => {
  const sheet = `/* header */
.SliceRoot--theme-light {
  /* defined-by-name: color-mix(in srgb, var(--popover) 55%, transparent) */
  --app-overlay-surface: rgba(255, 255, 255, 0.55);
  /* color-mix(in srgb, var(--background) 88%, var(--success)) */
  --color-mix-90cb3b30d2: rgba(224, 244, 232, 1);
}

.SliceRoot--theme-dark {
  /* color-mix(in srgb, var(--background) 88%, var(--success)) */
  --color-mix-90cb3b30d2: rgba(14, 34, 22, 1);
}
`;

  it("reads inline custom properties, including quoted values with semicolons", () => {
    expect(
      inlineCustomProperties('--font: "A;B", mono;--warning:#f5b44a;--empty:;color:red'),
    ).toEqual({ "--font": '"A;B", mono', "--warning": "#f5b44a", "--empty": "" });
  });

  it("reads one theme block of a generated stylesheet", () => {
    expect(generatedColourMixTokens(sheet, "dark")).toEqual([
      {
        name: "--color-mix-90cb3b30d2",
        expression: "color-mix(in srgb, var(--background) 88%, var(--success))",
        value: "rgba(14, 34, 22, 1)",
      },
    ]);
    expect(generatedColourMixTokens(sheet, "light")).toHaveLength(2);
    expect(themeBlockDeclarations(sheet, "light")).toEqual({
      "--app-overlay-surface": "rgba(255, 255, 255, 0.55)",
      "--color-mix-90cb3b30d2": "rgba(224, 244, 232, 1)",
    });
  });

  it("compares inline, stylesheet-kept and derived tokens with what Electron resolves", () => {
    const records = compareTokens(
      { "--ring": "rgba(51, 134, 214, 0.63)", "--app-shell-background": "#101010", "--font": "x" },
      generatedColourMixTokens(sheet, "light"),
      {
        names: {
          "--ring": "rgba(51, 134, 214, 0.63)",
          "--app-shell-background": "rgba(0, 0, 0, 0)",
          "--app-overlay-surface": "rgba(255, 255, 255, 0.55)",
        },
        expressions: {
          "color-mix(in srgb, var(--background) 88%, var(--success))": "rgb(200, 244, 232)",
        },
      },
    );
    expect(records.map((record) => [record.kind, record.name, record.within])).toEqual([
      ["inline", "--ring", true],
      ["inline", "--app-shell-background", false],
      ["stylesheet", "--app-overlay-surface", true],
      ["colour-mix", "--color-mix-90cb3b30d2", false],
    ]);
    expect(records[1].material).toBe(true);
    expect(records[3].channel).toBe(24);
  });

  it("checks the generated tokens against the browser for the default pack", () => {
    const [record] = compareDefaultPackColourMix(generatedColourMixTokens(sheet, "dark"), {
      "color-mix(in srgb, var(--background) 88%, var(--success))": "rgb(14, 34, 22)",
    });
    expect(record).toMatchObject({ kind: "default-pack-colour-mix", within: true, channel: 0 });
  });
});

describe("summary", () => {
  it("lists every surface, the totals, and the grouped differences", () => {
    const markdown = summaryMarkdown([
      {
        theme: "dark",
        runId: "run-1",
        viewport: { width: 1280, height: 820 },
        threshold: 4,
        backdrop: [16, 16, 16],
        surfaces: {
          thread: {
            ok: true,
            tally: { total: { compared: 10, within: 9 } },
            grid: { share: 1.5 },
          },
          kanban: { ok: false, error: "timed out" },
        },
        tally: {
          total: { compared: 10, within: 9 },
          byKind: { text: { compared: 10, within: 9 } },
        },
        findings: [
          {
            kind: "icon",
            electron: "#5d5d5d",
            native: "#999999",
            channel: 60,
            deltaE: 24.1,
            count: 3,
            surfaces: ["thread"],
            examples: ["Inbox | x"],
          },
        ],
      },
    ]);
    expect(markdown).toContain("## dark (1280×820, run run-1)");
    expect(markdown).toContain("| thread | 10 | 9 | 1 | 1.5% |");
    expect(markdown).toContain("| kanban | not measured: timed out |");
    expect(markdown).toContain(
      "| icon | #5d5d5d | #999999 | 60 | 24.1 | 3 | thread | Inbox \\| x |",
    );
  });
});
