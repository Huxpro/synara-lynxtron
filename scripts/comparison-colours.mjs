// usage: node scripts/comparison-colours.mjs [--surfaces a,b] [--out <dir>] [--images <dir>]
//        node scripts/comparison-colours.mjs --summarise <dir>
//
// Colour comparison of the two renderers of the latest certified comparison run
// (one theme × one window size). For each surface it reaches the same state in
// both renderers, captures one screenshot each (Electron: CDP
// Page.captureScreenshot; Native: the Lynx DevTool screencast, PNG), and pairs
// what both show:
//   - every visible text run (by its text): the resolved text colour, read from
//     computed style on both sides, as seen over the pixels behind it;
//   - the background behind every paired text and control, from the screenshots;
//   - every control with the same accessible label: its border and icon paint.
// A pair is within threshold when no channel differs by more than
// CHANNEL_THRESHOLD after alpha compositing. Electron's window is translucent
// (macOS vibrancy); its pixels are composited over the theme's opaque window
// colour (the value Native paints, since Lynxtron has no vibrancy).
//
// Writes <out>/colours-<theme>.json and 1280-wide JPEGs per surface and renderer;
// --summarise merges the per-theme JSON files of a directory into SUMMARY.md.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { parseCssColor } from "./comparison-measure.mjs";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const defaultLynxDevtoolConnector =
  "/Users/bytedance/.agents/skills/lynx-devtool/scripts/connector.mjs";
const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));

/** Largest per-channel difference (0–255) still counted as the same colour. */
export const CHANNEL_THRESHOLD = 4;
/** What Electron's translucent window is composited over: upstream's opaque window colour. */
export const WINDOW_BACKDROP = Object.freeze({ dark: [16, 16, 16], light: [255, 255, 255] });

// ---------------------------------------------------------------------------
// Pure colour arithmetic
// ---------------------------------------------------------------------------

/** `[r, g, b, a]` composited over an opaque `[r, g, b]`. */
export function over(top, bottom) {
  const alpha = top[3] ?? 1;
  return [0, 1, 2].map((index) => top[index] * alpha + bottom[index] * (1 - alpha));
}

export function withOpacity(colour, opacity) {
  return [colour[0], colour[1], colour[2], (colour[3] ?? 1) * opacity];
}

export function channelDistance(left, right) {
  return Math.max(...[0, 1, 2].map((index) => Math.abs(left[index] - right[index])));
}

function srgbToLab([r, g, b]) {
  const linear = [r, g, b].map((value) => {
    const unit = value / 255;
    return unit <= 0.04045 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4;
  });
  const x = (0.4124 * linear[0] + 0.3576 * linear[1] + 0.1805 * linear[2]) / 0.95047;
  const y = 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  const z = (0.0193 * linear[0] + 0.1192 * linear[1] + 0.9505 * linear[2]) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

/** CIE76 ΔE between two opaque sRGB colours. */
export function deltaE(left, right) {
  const a = srgbToLab(left);
  const b = srgbToLab(right);
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

const round1 = (value) => Math.round(value * 10) / 10;
const round2 = (value) => Math.round(value * 100) / 100;
export const roundColour = (colour) => colour.map((value) => Math.round(value));
export const hex = (colour) =>
  `#${roundColour(colour)
    .slice(0, 3)
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`;

/** Compares two opaque colours as seen. */
export function compareColours(electron, native, threshold = CHANNEL_THRESHOLD) {
  const channel = channelDistance(electron, native);
  return {
    channel: round1(channel),
    deltaE: round1(deltaE(electron, native)),
    // Half a level of slack: both sides round to 8 bits independently.
    within: channel <= threshold + 0.5,
  };
}

/** The paint an inline SVG carries: its first stroke or fill that is a colour. */
export function svgPaint(content) {
  const matches = String(content ?? "").matchAll(/\b(stroke|fill)="([^"]+)"/g);
  for (const [, , value] of matches) {
    if (value === "none" || value === "currentColor") continue;
    const colour = parseCssColor(value);
    if (colour && colour[3] > 0) return colour;
  }
  return null;
}

/**
 * The colours of a window-space box in a decoded screenshot: `background` is the
 * most frequent colour, `foreground` the most frequent among the pixels that
 * stand well apart from it (glyph and icon cores; anti-aliased edges fall
 * between). `glass` is the share of sampled pixels that were not opaque.
 * `image`: { data, width, height, channels, scale }.
 */
export function regionColours(image, box, backdrop, { inset = 0, maxSamples = 12_000 } = {}) {
  const scale = image.scale;
  const left = Math.max(0, Math.round((box.x + inset) * scale));
  const top = Math.max(0, Math.round((box.y + inset) * scale));
  const right = Math.min(image.width, Math.round((box.x + box.width - inset) * scale));
  const bottom = Math.min(image.height, Math.round((box.y + box.height - inset) * scale));
  if (right <= left || bottom <= top) return null;
  const stride = Math.max(1, Math.ceil(Math.sqrt(((right - left) * (bottom - top)) / maxSamples)));
  const counts = new Map();
  let samples = 0;
  let translucent = 0;
  for (let y = top; y < bottom; y += stride) {
    for (let x = left; x < right; x += stride) {
      const offset = (y * image.width + x) * image.channels;
      const alpha = image.channels === 4 ? image.data[offset + 3] / 255 : 1;
      if (alpha < 0.995) translucent += 1;
      const colour =
        alpha < 0.995
          ? over(
              [image.data[offset], image.data[offset + 1], image.data[offset + 2], alpha],
              backdrop,
            )
          : [image.data[offset], image.data[offset + 1], image.data[offset + 2]];
      const key =
        (Math.round(colour[0]) << 16) | (Math.round(colour[1]) << 8) | Math.round(colour[2]);
      counts.set(key, (counts.get(key) ?? 0) + 1);
      samples += 1;
    }
  }
  const unpack = (key) => [(key >> 16) & 255, (key >> 8) & 255, key & 255];
  let backgroundKey = 0;
  let backgroundCount = -1;
  for (const [key, count] of counts) {
    if (count > backgroundCount) [backgroundKey, backgroundCount] = [key, count];
  }
  const background = unpack(backgroundKey);
  let farthest = 0;
  for (const key of counts.keys())
    farthest = Math.max(farthest, channelDistance(unpack(key), background));
  let foreground = null;
  if (farthest >= 24) {
    let foregroundCount = -1;
    for (const [key, count] of counts) {
      const colour = unpack(key);
      if (channelDistance(colour, background) < farthest * 0.7) continue;
      if (count > foregroundCount) [foreground, foregroundCount] = [colour, count];
    }
  }
  return {
    background,
    foreground,
    backgroundShare: round1((backgroundCount / samples) * 100),
    glass: round1((translucent / samples) * 100),
    samples,
  };
}

/**
 * Pairs items of both renderers by key. A key pairs when it occurs equally often
 * on both sides; repeated keys are paired in reading order (rows, then columns).
 */
export function pairByKey(electronItems, nativeItems) {
  const group = (items) => {
    const byKey = new Map();
    for (const item of items) {
      if (!byKey.has(item.key)) byKey.set(item.key, []);
      byKey.get(item.key).push(item);
    }
    return byKey;
  };
  const reading = (left, right) =>
    Math.abs(left.box.y - right.box.y) > 4 ? left.box.y - right.box.y : left.box.x - right.box.x;
  const electron = group(electronItems);
  const native = group(nativeItems);
  const pairs = [];
  const unpaired = { electronOnly: [], nativeOnly: [], countMismatch: [] };
  for (const [key, electronGroup] of electron) {
    const nativeGroup = native.get(key);
    if (!nativeGroup) unpaired.electronOnly.push(key);
    else if (nativeGroup.length !== electronGroup.length) unpaired.countMismatch.push(key);
    else {
      const left = electronGroup.toSorted(reading);
      const right = nativeGroup.toSorted(reading);
      left.forEach((item, index) => pairs.push({ key, electron: item, native: right[index] }));
    }
  }
  for (const key of native.keys()) if (!electron.has(key)) unpaired.nativeOnly.push(key);
  return { pairs, unpaired };
}

/** Findings that are one colour pair seen many times collapse into one group. */
export function groupFindings(records) {
  const groups = new Map();
  for (const record of records) {
    if (record.within) continue;
    const id = `${record.kind}|${hex(record.electron.seen)}|${hex(record.native.seen)}`;
    if (!groups.has(id)) {
      groups.set(id, {
        kind: record.kind,
        electron: hex(record.electron.seen),
        native: hex(record.native.seen),
        channel: record.channel,
        deltaE: record.deltaE,
        count: 0,
        surfaces: new Set(),
        examples: [],
      });
    }
    const entry = groups.get(id);
    entry.count += 1;
    entry.surfaces.add(record.surface);
    if (entry.examples.length < 4 && !entry.examples.includes(record.key))
      entry.examples.push(record.key);
  }
  return [...groups.values()]
    .map((entry) => ({ ...entry, surfaces: [...entry.surfaces] }))
    .toSorted((left, right) => right.channel - left.channel || right.count - left.count);
}

export function tally(records) {
  const byKind = {};
  const total = { compared: 0, within: 0 };
  for (const record of records) {
    byKind[record.kind] ??= { compared: 0, within: 0 };
    for (const entry of [byKind[record.kind], total]) {
      entry.compared += 1;
      if (record.within) entry.within += 1;
    }
  }
  return { total, byKind };
}

/** How far a side's computed colour may sit from its own pixels before the pixels are believed. */
export const STYLE_PIXEL_AGREEMENT = 24;
const ICON_BUTTON_MAX = 64;

/**
 * The foreground colour one renderer shows for an item: its computed colour as
 * seen over the pixels behind it, unless that renderer's own screenshot says
 * otherwise (Lynx reports an inherited text colour as unset black; an icon's
 * first shape is not always the one that carries its tone), in which case the
 * pixels win. `borrowedBox` marks an inline run measured over its paragraph,
 * where the pixels belong to the whole paragraph and cannot arbitrate.
 */
export function seenForeground(declared, opacity, region, { borrowedBox = false } = {}) {
  const unset =
    !declared || (declared[0] === 0 && declared[1] === 0 && declared[2] === 0 && declared[3] === 1);
  const style = declared ? over(withOpacity(declared, opacity), region.background) : null;
  const pixel = region.foreground;
  if (borrowedBox) return unset ? null : { seen: style, method: "style" };
  if (style && pixel && (unset || channelDistance(style, pixel) > STYLE_PIXEL_AGREEMENT)) {
    return { seen: pixel, method: "pixel" };
  }
  if (style && !unset) return { seen: style, method: "style" };
  return pixel ? { seen: pixel, method: "pixel" } : null;
}

/**
 * Builds the comparison records of one surface from both inventories and both
 * screenshots. Inventories: { texts, controls }, each item { key, box, … } with
 * colours already parsed to [r, g, b, a].
 */
export function compareSurface(surface, electron, native, backdrop) {
  const records = [];
  const push = (kind, pair, electronSide, nativeSide) => {
    records.push({
      surface,
      kind,
      key: pair.key.slice(0, 80),
      ...compareColours(electronSide.seen, nativeSide.seen),
      electron: { ...electronSide, seen: roundColour(electronSide.seen), box: pair.electron.box },
      native: { ...nativeSide, seen: roundColour(nativeSide.seen), box: pair.native.box },
    });
  };
  const region = (side, box, options) => regionColours(side.image, box, backdrop, options);
  const foreground = (kind, pair, eRegion, nRegion, eItem, nItem) => {
    const e = seenForeground(eItem.colour, eItem.opacity, eRegion, eItem);
    const n = seenForeground(nItem.colour, nItem.opacity, nRegion, nItem);
    if (!e || !n) return;
    push(
      kind,
      pair,
      { ...e, declared: eItem.colour, opacity: round2(eItem.opacity), pixel: eRegion.foreground },
      { ...n, declared: nItem.colour, opacity: round2(nItem.opacity), pixel: nRegion.foreground },
    );
  };

  const texts = pairByKey(electron.texts, native.texts);
  for (const pair of texts.pairs) {
    const e = region(electron, pair.electron.box);
    const n = region(native, pair.native.box);
    if (!e || !n) continue;
    // An inline run is measured over its paragraph, whose most frequent colour is
    // the page behind it, not the run's own chip.
    if (!pair.native.borrowedBox && !pair.native.inlineRun) {
      push(
        "background",
        pair,
        { seen: e.background, method: "pixel" },
        { seen: n.background, method: "pixel" },
      );
    }
    foreground("text", pair, e, n, pair.electron, pair.native);
  }
  const controls = pairByKey(electron.controls, native.controls);
  for (const pair of controls.pairs) {
    const e = region(electron, pair.electron.box, { inset: 2 });
    const n = region(native, pair.native.box, { inset: 2 });
    if (!e || !n) continue;
    push(
      "control",
      pair,
      { seen: e.background, method: "pixel" },
      { seen: n.background, method: "pixel" },
    );
    const eBorder = pair.electron.border;
    const nBorder = pair.native.border;
    if (eBorder || nBorder) {
      // A border only one side declares still has to look the same, so it is
      // compared with the other side's background.
      push(
        "border",
        pair,
        {
          seen: eBorder
            ? over(withOpacity(eBorder, pair.electron.opacity), e.background)
            : e.background,
          method: "style",
          declared: eBorder ?? null,
        },
        {
          seen: nBorder
            ? over(withOpacity(nBorder, pair.native.opacity), n.background)
            : n.background,
          method: "style",
          declared: nBorder ?? null,
        },
      );
    }
    // Icon buttons only: a larger labelled region (a nav, a row) has several
    // icons and its first one need not be the same on both sides.
    const iconButton = (box) => box.width <= ICON_BUTTON_MAX && box.height <= ICON_BUTTON_MAX;
    if (
      pair.electron.iconBox &&
      pair.native.iconBox &&
      iconButton(pair.electron.box) &&
      iconButton(pair.native.box)
    ) {
      const eIcon = region(electron, pair.electron.iconBox);
      const nIcon = region(native, pair.native.iconBox);
      if (eIcon && nIcon) {
        foreground(
          "icon",
          pair,
          eIcon,
          nIcon,
          { colour: pair.electron.icon, opacity: pair.electron.iconOpacity },
          { colour: pair.native.icon, opacity: pair.native.iconOpacity },
        );
      }
    }
  }
  return {
    records,
    unpaired: {
      texts: texts.unpaired,
      controls: controls.unpaired,
    },
  };
}

/**
 * Coarse whole-window check: the most frequent colour of every `cell`×`cell`
 * CSS-pixel square in both screenshots. Catches what no paired element anchors
 * (a missing tint, an unpainted band). Returns the differing cells.
 */
export function gridDifference(electronImage, nativeImage, backdrop, size, cell = 10) {
  const differing = [];
  let cells = 0;
  for (let y = 0; y + cell <= size.height; y += cell) {
    for (let x = 0; x + cell <= size.width; x += cell) {
      const box = { x, y, width: cell, height: cell };
      const e = regionColours(electronImage, box, backdrop, { maxSamples: 100 });
      const n = regionColours(nativeImage, box, backdrop, { maxSamples: 100 });
      if (!e || !n) continue;
      cells += 1;
      const channel = channelDistance(e.background, n.background);
      if (channel > CHANNEL_THRESHOLD + 0.5) differing.push({ x, y, channel: Math.round(channel) });
    }
  }
  return { cells, differing };
}

// ---------------------------------------------------------------------------
// Reading the renderers
// ---------------------------------------------------------------------------

const ELECTRON_INVENTORY = `(() => {
  const closedOverlay = '[role="dialog"][data-closed], [role="alertdialog"][data-closed], [role="menu"][data-closed], [data-slot$="popup"][data-closed]';
  const opacityCache = new WeakMap();
  const opacityOf = (element) => {
    if (!element || element.nodeType !== 1) return 1;
    if (opacityCache.has(element)) return opacityCache.get(element);
    const style = getComputedStyle(element);
    const own = style.visibility === "hidden" ? 0 : parseFloat(style.opacity || "1");
    const value = own * opacityOf(element.parentElement);
    opacityCache.set(element, value);
    return value;
  };
  const visibleBox = (element, r) => {
    if (r.width <= 0 || r.height <= 0) return null;
    let left = Math.max(0, r.left), top = Math.max(0, r.top), right = Math.min(innerWidth, r.right), bottom = Math.min(innerHeight, r.bottom);
    for (let parent = element; parent; parent = parent.parentElement) {
      const style = getComputedStyle(parent);
      if (style.display === "none") return null;
      if (parent === element) continue;
      const clipsX = style.overflowX !== "visible" || /paint|strict|content/.test(style.contain);
      const clipsY = style.overflowY !== "visible" || /paint|strict|content/.test(style.contain);
      if (!clipsX && !clipsY) continue;
      const p = parent.getBoundingClientRect();
      if (clipsX) { left = Math.max(left, p.left); right = Math.min(right, p.right); }
      if (clipsY) { top = Math.max(top, p.top); bottom = Math.min(bottom, p.bottom); }
    }
    if (right - left < 1 || bottom - top < 1) return null;
    return { x: left, y: top, width: right - left, height: bottom - top };
  };
  const texts = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const key = node.textContent.replace(/\\s+/g, " ").trim();
    const parent = node.parentElement;
    if (!key || !parent || /^(SCRIPT|STYLE|NOSCRIPT|TITLE)$/.test(parent.tagName)) continue;
    if (parent.closest(closedOverlay) || parent.closest("svg")) continue;
    range.selectNodeContents(node);
    const box = visibleBox(parent, range.getBoundingClientRect());
    if (!box) continue;
    const opacity = opacityOf(parent);
    if (opacity <= 0.01) continue;
    const style = getComputedStyle(parent);
    texts.push({ key, box, colour: style.webkitTextFillColor || style.color, opacity });
  }
  const controls = [];
  for (const element of document.querySelectorAll("[aria-label]")) {
    if (element.closest(closedOverlay) || element.closest('[aria-hidden="true"]')) continue;
    const box = visibleBox(element, element.getBoundingClientRect());
    if (!box) continue;
    const opacity = opacityOf(element);
    if (opacity <= 0.01) continue;
    const style = getComputedStyle(element);
    let border = null;
    for (const edge of ["top", "bottom", "left", "right"]) {
      if (parseFloat(style["border-" + edge + "-width"]) > 0 && style["border-" + edge + "-style"] !== "none") { border = style["border-" + edge + "-color"]; break; }
    }
    const svg = element.matches("svg") ? element : element.querySelector("svg");
    let icon = null, iconOpacity = 1, iconBox = null;
    if (svg && svg.getBoundingClientRect().width > 0) {
      const shape = svg.querySelector("path, circle, rect, line, polyline, polygon, ellipse") ?? svg;
      const shapeStyle = getComputedStyle(shape);
      icon = shapeStyle.stroke && shapeStyle.stroke !== "none" ? shapeStyle.stroke : shapeStyle.fill;
      iconOpacity = opacityOf(shape);
      iconBox = visibleBox(svg, svg.getBoundingClientRect());
    }
    controls.push({ key: element.getAttribute("aria-label"), box, opacity, border, icon, iconOpacity, iconBox, background: style.backgroundColor });
  }
  return { texts, controls, width: innerWidth, height: innerHeight };
})()`;

const colourOrNull = (value) => {
  const colour = value ? parseCssColor(value) : null;
  return colour && colour[3] > 0 ? colour : null;
};

async function electronInventory(driver) {
  const raw = await driver.evaluate(ELECTRON_INVENTORY);
  return {
    texts: raw.texts.map((item) => ({ ...item, colour: colourOrNull(item.colour) })),
    controls: raw.controls.map((item) => ({
      ...item,
      border: colourOrNull(item.border),
      icon: colourOrNull(item.icon),
    })),
  };
}

function attributesOf(node) {
  const map = {};
  const attributes = node?.attributes ?? [];
  for (let index = 0; index + 1 < attributes.length; index += 2) {
    map[attributes[index]] = String(attributes[index + 1]);
  }
  return map;
}

function quadBox(model) {
  const quad = model?.border;
  if (!quad) return null;
  const xs = [quad[0], quad[2], quad[4], quad[6]];
  const ys = [quad[1], quad[3], quad[5], quad[7]];
  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
  };
}

function intersect(box, clip) {
  const left = Math.max(box.x, clip.x);
  const top = Math.max(box.y, clip.y);
  const right = Math.min(box.x + box.width, clip.x + clip.width);
  const bottom = Math.min(box.y + box.height, clip.y + clip.height);
  if (right - left < 1 || bottom - top < 1) return null;
  return { x: left, y: top, width: right - left, height: bottom - top };
}

/**
 * Flattens a Lynx `DOM.getDocumentWithBoxModel` tree into the items the colour
 * comparison pairs: text runs (a TEXT element's own text, or its raw-text
 * children) and labelled controls, each clipped to the window and to the scroll
 * containers above it. Style is attached afterwards by the caller.
 */
export function nativeItems(root, windowBox) {
  const texts = [];
  const controls = [];
  const visit = (node, parent, clip, hidden, textBox) => {
    const attributes = attributesOf(node);
    const ownBox = quadBox(node.box_model);
    node.__parent = parent;
    if (attributes["accessibility-elements-hidden"] === "true") hidden = true;
    const box = ownBox && clip ? intersect(ownBox, clip) : null;
    let inheritedTextBox = textBox;
    if (node.nodeName === "TEXT") {
      // An inline <text> inside a <text> has no box of its own: it is measured
      // over the paragraph that lays it out.
      const borrowedBox = !box && ownBox?.width === 0 && Boolean(textBox);
      const runBox = box ?? (borrowedBox ? textBox : null);
      if (box) inheritedTextBox = box;
      if (runBox) {
        const fragments = [];
        if (attributes.text !== undefined) fragments.push(attributes.text);
        for (const child of node.children ?? []) {
          if (child.nodeName === "RAW-TEXT") fragments.push(attributesOf(child).text ?? "");
        }
        // Electron pairs per DOM text node; a Lynx text with several raw-text
        // children is one run per child, sharing the element's box and colour.
        for (const fragment of fragments) {
          const key = fragment.replace(/\s+/g, " ").trim();
          if (key) texts.push({ key, box: runBox, node, borrowedBox });
        }
      }
    }
    const label = attributes["accessibility-label"];
    if (label && box && !hidden) {
      const svg = findSvg(node);
      const iconBox = svg && clip ? intersect(quadBox(svg.box_model), clip) : null;
      controls.push({ key: label, box, node, svg, iconBox });
    }
    let childClip = clip;
    if (ownBox && /^(SCROLL-VIEW|LIST)$/.test(node.nodeName))
      childClip = clip ? intersect(ownBox, clip) : null;
    for (const child of node.children ?? [])
      visit(child, node, childClip, hidden, inheritedTextBox);
  };
  visit(root, null, windowBox, false, null);
  return { texts, controls };
}

function findSvg(node) {
  const queue = [node];
  while (queue.length > 0) {
    const current = queue.shift();
    if (current.nodeName === "SVG" && (current.box_model?.width ?? 0) > 0) return current;
    queue.push(...(current.children ?? []));
  }
  return null;
}

async function nativeInventory(driver, size) {
  await driver.send("DOM.enable", { useCompression: false });
  const document = await driver.send("DOM.getDocumentWithBoxModel", {});
  const root = document?.root ?? document;
  const items = nativeItems(root, { x: 0, y: 0, width: size.width, height: size.height });
  const styleCache = new Map();
  const styleOf = async (node) => {
    if (styleCache.has(node.nodeId)) return styleCache.get(node.nodeId);
    let style = {};
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const computed = await driver.send("CSS.getComputedStyleForNode", { nodeId: node.nodeId });
        style = Object.fromEntries(
          (computed?.computedStyle ?? []).map((entry) => [entry.name, entry.value]),
        );
        break;
      } catch (error) {
        if (attempt === 2) throw error;
        await sleep(300);
      }
    }
    styleCache.set(node.nodeId, style);
    return style;
  };
  const opacityOf = async (node) => {
    let opacity = 1;
    for (let current = node; current && current.nodeId !== undefined; current = current.__parent) {
      if (
        !/^(VIEW|TEXT|SVG|IMAGE|SCROLL-VIEW|LIST|TEXTAREA|INPUT|WRAPPER|PAGE|LIST-ITEM)$/.test(
          current.nodeName ?? "",
        )
      )
        continue;
      const style = await styleOf(current);
      if (style.visibility === "hidden") return 0;
      opacity *= Number.parseFloat(style.opacity ?? "1");
      if (opacity <= 0.01) return 0;
    }
    return opacity;
  };
  const texts = [];
  for (const item of items.texts) {
    const opacity = await opacityOf(item.node);
    if (opacity <= 0.01) continue;
    const style = await styleOf(item.node);
    let colour = colourOrNull(style.color);
    let borrowedBox = item.borrowedBox;
    const unset = (value) => !value || (value[0] === 0 && value[1] === 0 && value[2] === 0);
    if (borrowedBox && unset(colour)) {
      // An inline run without a colour of its own paints with its paragraph's,
      // and then the paragraph's pixels can vouch for it.
      let owner = item.node.__parent;
      while (owner && !(owner.nodeName === "TEXT" && (owner.box_model?.width ?? 0) > 0)) {
        owner = owner.__parent;
      }
      colour = owner ? colourOrNull((await styleOf(owner)).color) : null;
      borrowedBox = false;
    }
    texts.push({
      key: item.key,
      box: item.box,
      colour,
      opacity,
      borrowedBox,
      inlineRun: item.borrowedBox,
    });
  }
  const controls = [];
  for (const item of items.controls) {
    const opacity = await opacityOf(item.node);
    if (opacity <= 0.01) continue;
    const style = await styleOf(item.node);
    let border = null;
    for (const edge of ["top", "bottom", "left", "right"]) {
      if (Number.parseFloat(style[`border-${edge}-width`] ?? "0") > 0) {
        border = colourOrNull(style[`border-${edge}-color`]);
        if (border) break;
      }
    }
    let icon = null;
    let iconOpacity = 1;
    if (item.svg) {
      icon = svgPaint(attributesOf(item.svg).content);
      iconOpacity = await opacityOf(item.svg);
    }
    controls.push({
      key: item.key,
      box: item.box,
      opacity,
      border,
      icon,
      iconOpacity,
      iconBox: item.iconBox,
      background: style["background-color"],
    });
  }
  return { texts, controls };
}

let sharpModule = null;
function sharp() {
  // sharp is a dependency of the Lynx app (its host stages it); resolve it from there.
  sharpModule ??= createRequire(join(repositoryRoot, "apps/lynx/package.json"))("sharp");
  return sharpModule;
}

async function decode(png, cssWidth) {
  const { data, info } = await sharp()(png).raw().toBuffer({ resolveWithObject: true });
  return {
    data,
    width: info.width,
    height: info.height,
    channels: info.channels,
    scale: info.width / cssWidth,
  };
}

export async function electronScreenshot(driver) {
  const shot = await driver.send("Page.captureScreenshot", { format: "png" });
  return Buffer.from(shot.data, "base64");
}

export async function nativeScreenshot(devtoolPort) {
  const connectorPath = process.env.LYNX_DEVTOOL_CONNECTOR?.trim() || defaultLynxDevtoolConnector;
  const { createDefaultConnector } = await import(connectorPath);
  let lastError;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const connector = createDefaultConnector();
      const clientId = `localhost:${devtoolPort}`;
      const session = (await connector.sendListSessionMessage(clientId)).at(-1);
      let frame = null;
      let gotFrame;
      const framePromise = new Promise((resolveFrame) => (gotFrame = resolveFrame));
      let acknowledged;
      const ackPromise = new Promise((resolveAck) => (acknowledged = resolveAck));
      const stream = await connector.sendCDPStream(
        clientId,
        Number(session.session_id),
        new ReadableStream({
          async start(controller) {
            controller.enqueue({
              method: "Page.startScreencast",
              params: { format: "png", quality: 100, mode: "lynxview" },
            });
            await Promise.race([framePromise, sleep(12_000)]);
            if (frame) controller.enqueue({ method: "Page.screencastFrameAck" });
            controller.close();
            acknowledged();
          },
        }),
        { signal: AbortSignal.timeout(15_000) },
      );
      for await (const message of stream) {
        if (message.method !== "Page.screencastFrame" || !message.params?.data) continue;
        frame = Buffer.from(message.params.data, "base64");
        gotFrame();
        await ackPromise;
        break;
      }
      await stream[Symbol.asyncDispose]?.();
      if (frame) return frame;
      lastError = new Error("No Page.screencastFrame received");
    } catch (error) {
      lastError = error;
    }
    await sleep(800);
  }
  throw lastError;
}

// ---------------------------------------------------------------------------
// Theme tokens
// ---------------------------------------------------------------------------

/**
 * Root variables that differ by design: Electron on macOS takes the translucent
 * branch of upstream's `buildThemeCssVariables` (window vibrancy), Native the
 * opaque one, because Lynxtron exposes no vibrancy or backdrop blur.
 */
export const MATERIAL_TOKENS = Object.freeze([
  "--app-shell-background",
  "--app-window-background",
  "--app-content-surface",
  "--app-glass-raised-surface",
  "--app-composer-picker-surface",
  "--app-overlay-surface",
  "--app-overlay-backing",
  "--app-sidebar-surface",
  "--app-sidebar-chip-surface",
  "--app-settings-surface",
]);

/** `--name: value` pairs of an inline style attribute (values may contain `;` only inside quotes). */
export function inlineCustomProperties(style) {
  const properties = {};
  const pattern = /(--[\w-]+)\s*:\s*((?:"[^"]*"|[^;"])*)/g;
  for (const [, name, value] of String(style ?? "").matchAll(pattern))
    properties[name] = value.trim();
  return properties;
}

/** Tokens of one theme block of the generated colour-mix stylesheet, with their recipes. */
export function generatedColourMixTokens(css, theme) {
  const start = css.indexOf(`.SliceRoot--theme-${theme} {`);
  if (start < 0) return [];
  const block = css.slice(start, css.indexOf("\n}", start));
  const tokens = [];
  const pattern =
    /\/\*\s*(?:defined-by-name:\s*)?(color-mix\([\s\S]*?\))\s*\*\/\s*(--[\w-]+):\s*([^;]+);/g;
  for (const [, expression, name, value] of block.matchAll(pattern)) {
    tokens.push({ name, expression, value: value.trim() });
  }
  return tokens;
}

/** `--name: value` declarations of one theme block of a generated Native stylesheet. */
export function themeBlockDeclarations(css, theme) {
  const start = css.indexOf(`.SliceRoot--theme-${theme} {`);
  if (start < 0) return {};
  const block = css.slice(start, css.indexOf("\n}", start)).replace(/\/\*[\s\S]*?\*\//g, "");
  const declarations = {};
  for (const [, name, value] of block.matchAll(/(--[\w-]+):\s*([^;]*);/g)) {
    declarations[name] = value.trim();
  }
  return declarations;
}

/**
 * The generated colour-mix tokens against the browser's own arithmetic for the
 * pack they were generated from: `browserResolved` maps each recipe to what
 * Chromium computes for it with the default pack's variables in scope.
 */
export function compareDefaultPackColourMix(colourMix, browserResolved) {
  return colourMix.map((token) => {
    const native = parseCssColor(token.value);
    const browser = browserResolved[token.expression]
      ? parseCssColor(browserResolved[token.expression])
      : null;
    const channel = native && browser ? round1(translucentDistance(browser, native)) : null;
    return {
      kind: "default-pack-colour-mix",
      name: token.name,
      expression: token.expression,
      native: token.value,
      electron: browserResolved[token.expression] ?? null,
      channel,
      within: channel !== null && channel <= CHANNEL_THRESHOLD + 0.5,
    };
  });
}

/** Largest channel difference of two possibly translucent colours, over black and over white. */
export function translucentDistance(left, right) {
  return Math.max(
    channelDistance(over(left, [0, 0, 0]), over(right, [0, 0, 0])),
    channelDistance(over(left, [255, 255, 255]), over(right, [255, 255, 255])),
  );
}

/**
 * Compares what each renderer resolves the theme's colour variables to. Native:
 * the root view's inline map (upstream's variables and the colour-mix recipes
 * evaluated against the active pack), and for a name the map does not carry, the
 * generated stylesheet's value. Electron: the same name or recipe resolved by the
 * browser on the document root.
 */
export function compareTokens(nativeInline, colourMix, electronResolved) {
  const records = [];
  const add = (kind, name, nativeValue, electronValue, extra = {}) => {
    const native = parseCssColor(nativeValue);
    const electron = electronValue ? parseCssColor(electronValue) : null;
    if (!native) return;
    const channel = electron ? round1(translucentDistance(electron, native)) : null;
    records.push({
      kind,
      name,
      native: nativeValue,
      electron: electronValue ?? null,
      channel,
      within: channel !== null && channel <= CHANNEL_THRESHOLD + 0.5,
      ...(MATERIAL_TOKENS.includes(name) ? { material: true } : {}),
      ...extra,
    });
  };
  for (const [name, value] of Object.entries(nativeInline)) {
    // A projected colour-mix token exists only on Native; it is compared by recipe below.
    if (name.startsWith("--color-mix-")) continue;
    add("inline", name, value, electronResolved.names[name]);
  }
  for (const token of colourMix) {
    if (token.name.startsWith("--color-mix-")) {
      // The value Native applies: the root inline map evaluates each recipe against the
      // active pack and overrides the stylesheet's default-pack value.
      add(
        "colour-mix",
        token.name,
        nativeInline[token.name] ?? token.value,
        electronResolved.expressions[token.expression],
        { expression: token.expression },
      );
    } else if (!(token.name in nativeInline)) {
      add("stylesheet", token.name, token.value, electronResolved.names[token.name], {
        expression: token.expression,
      });
    }
  }
  return records;
}

async function measureTokens(electron, native, theme) {
  const root = await native.documentRoot();
  const queue = [root];
  let inline = {};
  while (queue.length > 0) {
    const node = queue.shift();
    const attributes = attributesOf(node);
    if (/(^|\s)SliceRoot(\s|$)/.test(attributes.class ?? "")) {
      inline = inlineCustomProperties(attributes.style);
      break;
    }
    queue.push(...(node.children ?? []));
  }
  const colourMix = generatedColourMixTokens(
    readFileSync(
      join(repositoryRoot, "apps/lynx/src/generated/native-color-mix-variables.css"),
      "utf8",
    ),
    theme,
  );
  const names = [...new Set([...Object.keys(inline), ...colourMix.map((token) => token.name)])];
  const expressions = [...new Set(colourMix.map((token) => token.expression))];
  const electronResolved = await electron.evaluate(`(() => {
    const probe = document.createElement("div");
    probe.style.display = "none";
    document.body.appendChild(probe);
    const resolve = (value) => {
      probe.style.backgroundColor = "";
      probe.style.backgroundColor = value;
      return probe.style.backgroundColor ? getComputedStyle(probe).backgroundColor : null;
    };
    const rootStyle = getComputedStyle(document.documentElement);
    const names = Object.fromEntries(${JSON.stringify(names)}.map((name) => [name, rootStyle.getPropertyValue(name).trim() === "" ? null : resolve("var(" + name + ")")]));
    const expressions = Object.fromEntries(${JSON.stringify(expressions)}.map((expression) => [expression, resolve(expression)]));
    probe.remove();
    return { names, expressions };
  })()`);
  // The same recipes with the DEFAULT pack's variables in scope (the generated theme
  // sheet), whatever pack this run's renderers are showing.
  const defaults = themeBlockDeclarations(
    readFileSync(
      join(repositoryRoot, "apps/lynx/src/generated/native-theme-variables.css"),
      "utf8",
    ),
    theme,
  );
  const defaultResolved = await electron.evaluate(`(() => {
    const scope = document.createElement("div");
    scope.style.display = "none";
    for (const [name, value] of Object.entries(${JSON.stringify(defaults)})) scope.style.setProperty(name, value);
    const probe = document.createElement("div");
    scope.appendChild(probe);
    document.body.appendChild(scope);
    const resolved = Object.fromEntries(${JSON.stringify(expressions)}.map((expression) => {
      probe.style.backgroundColor = "";
      probe.style.backgroundColor = expression;
      return [expression, probe.style.backgroundColor ? getComputedStyle(probe).backgroundColor : null];
    }));
    scope.remove();
    return resolved;
  })()`);
  return [
    ...compareTokens(inline, colourMix, electronResolved),
    ...compareDefaultPackColourMix(colourMix, defaultResolved),
  ];
}

// ---------------------------------------------------------------------------
// Surfaces
// ---------------------------------------------------------------------------

async function loadSurfaces() {
  const cells = await import("./comparison-cells.mjs");
  const navigation = await import("./comparison-navigation.mjs");
  const workflows = await import("./comparison-workflows.mjs");
  const { waitFor } = await import("./comparison-workflow.mjs");
  const { SURFACES, INCREMENTS } = cells;
  const base = (name) => async (driver) => {
    await SURFACES[name].open(driver);
    await waitFor(() => SURFACES[name].ready(driver), {
      label: `${name} on ${driver.kind}`,
      timeoutMs: 45_000,
    });
  };
  const increment = (name) => ({
    open: async (driver) => {
      const entry = INCREMENTS[name];
      await base(entry.base)(driver);
      await entry.open(driver);
      if (entry.ready) {
        await waitFor(() => entry.ready(driver), {
          label: `${name} on ${driver.kind}`,
          timeoutMs: entry.readyTimeoutMs ?? 20_000,
        });
      }
    },
    close: (driver) => INCREMENTS[name].close(driver),
  });
  return {
    landing: { open: base("landing") },
    thread: { open: base("thread") },
    "thread-model-menu": increment("model-menu"),
    "thread-dock-diff": {
      open: async (driver) => {
        await base("thread")(driver);
        await navigation.openDockWithPane(driver, "Open Review");
        await workflows.openDockTab(driver, "Diff");
        await waitFor(
          () =>
            driver.kind === "electron"
              ? // The diff body, not only the tab: under load Electron can show an error first.
                workflows.renderedTextIncludes(driver, "unmodified line")
              : driver.find({ label: "Collapse src/math.ts" }),
          { label: `the diff on ${driver.kind}`, timeoutMs: 45_000 },
        );
      },
    },
    "thread-dock-explorer": {
      open: async (driver) => {
        await base("thread")(driver);
        await workflows.openExplorerFromDock(driver);
        await workflows.openTreeFile(driver, "src/math.ts");
        await waitFor(() => workflows.renderedTextIncludes(driver, "clamp", "explorer"), {
          label: `the math.ts preview on ${driver.kind}`,
          timeoutMs: 20_000,
        });
      },
      // Leaves the dock closed for the surfaces that follow.
      close: async (driver) => {
        if (await driver.find(navigation.DOCK_ADD_PANEL)) await driver.tap(navigation.DOCK_TOGGLE);
      },
    },
    "settings-general": { open: base("settings") },
    "settings-appearance": increment("settings-appearance"),
    kanban: { open: base("kanban") },
    "code-review": { open: base("pr") },
    automations: { open: base("automations") },
    "automation-dialog": increment("automation-dialog"),
    // Hover exists only where the driver can move a pointer (Electron/CDP); the
    // Lynx DevTool has touch emulation only, so Native shows the resting rail.
    "rail-hover": {
      open: async (driver) => {
        await base("thread")(driver);
        if (driver.kind === "electron") {
          const box = await driver.find({ label: "Automations" });
          if (box) await driver.hover(box);
        }
      },
      close: async (driver) => {
        if (driver.kind === "electron") await driver.hover({ x: 640, y: 400 });
      },
    },
  };
}

async function measure({ surfaces, outDir, imagesDir }) {
  const { openElectronDriver, openNativeDriver, readCertifiedRun } =
    await import("./comparison-workflow.mjs");
  const run = readCertifiedRun();
  const theme = run.options.theme;
  const size = { width: run.options.width, height: run.options.height };
  const backdrop = WINDOW_BACKDROP[theme];
  if (!backdrop) throw new Error(`No window backdrop for theme ${theme}.`);
  const table = await loadSurfaces();
  const electron = await openElectronDriver(run.options.electronCdpPort);
  const native = await openNativeDriver(run.native.devtool.port);
  mkdirSync(outDir, { recursive: true });
  mkdirSync(imagesDir, { recursive: true });
  const report = {
    runId: run.runId,
    theme,
    viewport: size,
    threshold: CHANNEL_THRESHOLD,
    backdrop,
    measuredAt: new Date().toISOString(),
    surfaces: {},
    records: [],
  };
  for (const name of surfaces) {
    const surface = table[name];
    if (!surface)
      throw new Error(`Unknown surface ${name}; known: ${Object.keys(table).join(", ")}`);
    const entry = { ok: false };
    report.surfaces[name] = entry;
    try {
      for (const driver of [electron, native]) await surface.open(driver);
      await sleep(900);
      const electronPng = await electronScreenshot(electron);
      const nativePng = await nativeScreenshot(run.native.devtool.port);
      const sides = {
        electron: {
          ...(await electronInventory(electron)),
          image: await decode(electronPng, size.width),
        },
        native: {
          ...(await nativeInventory(native, size)),
          image: await decode(nativePng, size.width),
        },
      };
      for (const [renderer, png] of [
        ["electron", electronPng],
        ["native", nativePng],
      ]) {
        writeFileSync(join(imagesDir, `${theme}-${name}.${renderer}.png`), png);
        const flattened = sharp()(png).flatten({
          background: { r: backdrop[0], g: backdrop[1], b: backdrop[2] },
        });
        await flattened
          .resize({ width: size.width })
          .jpeg({ quality: 82 })
          .toFile(join(outDir, `${theme}-${name}.${renderer}.jpg`));
      }
      const compared = compareSurface(name, sides.electron, sides.native, backdrop);
      const grid = gridDifference(sides.electron.image, sides.native.image, backdrop, size);
      report.records.push(...compared.records);
      Object.assign(entry, {
        ok: true,
        imageSize: {
          electron: [sides.electron.image.width, sides.electron.image.height],
          native: [sides.native.image.width, sides.native.image.height],
        },
        tally: tally(compared.records),
        grid: {
          cells: grid.cells,
          differing: grid.differing.length,
          share: round1((grid.differing.length / grid.cells) * 100),
        },
        gridCells: grid.differing,
        unpaired: compared.unpaired,
      });
      const { total } = entry.tally;
      console.log(
        `[colours] ${theme} ${name}: ${total.within}/${total.compared} pairs within ${CHANNEL_THRESHOLD}/255; grid ${entry.grid.share}% of ${grid.cells} cells differ`,
      );
    } catch (error) {
      entry.error = String(error?.message ?? error);
      console.log(`[colours] ${theme} ${name}: FAILED ${entry.error}`);
    }
    try {
      for (const driver of [electron, native]) await surface.close?.(driver);
    } catch (error) {
      entry.closeError = String(error?.message ?? error);
    }
    await sleep(400);
  }
  try {
    report.tokens = await measureTokens(electron, native, theme);
    const differing = report.tokens.filter((token) => !token.within);
    console.log(
      `[colours] ${theme} tokens: ${report.tokens.length - differing.length}/${report.tokens.length} resolve alike; differing: ${differing.map((token) => `${token.name}${token.material ? " (material)" : ""}`).join(", ") || "none"}`,
    );
  } catch (error) {
    report.tokensError = String(error?.message ?? error);
    console.log(`[colours] ${theme} tokens: FAILED ${report.tokensError}`);
  }
  report.tally = tally(report.records);
  report.findings = groupFindings(report.records);
  writeFileSync(join(outDir, `colours-${theme}.json`), `${JSON.stringify(report)}\n`);
  console.log(
    `[colours] ${theme}: ${report.tally.total.within}/${report.tally.total.compared} pairs within threshold; ${report.findings.length} distinct differing colour pairs`,
  );
  electron.close();
  native.close();
}

/** Markdown for the per-theme reports of one archive directory. */
export function summaryMarkdown(reports) {
  const lines = ["# Colour comparison: Native against Electron", ""];
  for (const report of reports) {
    lines.push(
      `## ${report.theme} (${report.viewport.width}×${report.viewport.height}, run ${report.runId})`,
      "",
    );
    lines.push(
      `Threshold ${report.threshold}/255 per channel after compositing; Electron glass composited over ${hex(report.backdrop)}.`,
      "",
    );
    lines.push(
      "| Surface | Pairs | Within | Outside | Grid cells differing |",
      "| --- | ---: | ---: | ---: | ---: |",
    );
    for (const [name, surface] of Object.entries(report.surfaces)) {
      if (!surface.ok) {
        lines.push(`| ${name} | not measured: ${surface.error} | | | |`);
        continue;
      }
      const { total } = surface.tally;
      lines.push(
        `| ${name} | ${total.compared} | ${total.within} | ${total.compared - total.within} | ${surface.grid.share}% |`,
      );
    }
    const { total, byKind } = report.tally;
    lines.push(
      `| **all** | ${total.compared} | ${total.within} | ${total.compared - total.within} | |`,
      "",
    );
    lines.push(
      `By kind: ${Object.entries(byKind)
        .map(([kind, entry]) => `${kind} ${entry.within}/${entry.compared}`)
        .join(", ")}.`,
      "",
    );
    if (report.findings.length > 0) {
      lines.push(
        "| Kind | Electron | Native | Max channel | ΔE | Count | Surfaces | Examples |",
        "| --- | --- | --- | ---: | ---: | ---: | --- | --- |",
      );
      for (const finding of report.findings.slice(0, 60)) {
        lines.push(
          `| ${finding.kind} | ${finding.electron} | ${finding.native} | ${finding.channel} | ${finding.deltaE} | ${finding.count} | ${finding.surfaces.join(", ")} | ${finding.examples.map((example) => example.replaceAll("|", "\\|")).join("; ")} |`,
        );
      }
      if (report.findings.length > 60)
        lines.push("", `…and ${report.findings.length - 60} more in the JSON.`);
      lines.push("");
    }
  }
  return `${lines.join("\n")}\n`;
}

const isEntrypoint =
  process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isEntrypoint) {
  const argv = process.argv.slice(2);
  const option = (name, fallback) => {
    const index = argv.indexOf(name);
    return index >= 0 ? argv[index + 1] : fallback;
  };
  const summarise = option("--summarise");
  if (summarise) {
    const reports = readdirSync(summarise)
      .filter((file) => /^colours-.*\.json$/.test(file))
      .toSorted()
      .map((file) => JSON.parse(readFileSync(join(summarise, file), "utf8")));
    writeFileSync(join(summarise, option("--name", "SUMMARY.md")), summaryMarkdown(reports));
    console.log(`[colours] wrote ${join(summarise, option("--name", "SUMMARY.md"))}`);
  } else {
    const table = await loadSurfaces();
    const outDir = resolve(
      option("--out", join(repositoryRoot, ".synara-desktop-comparison", "colours")),
    );
    await measure({
      surfaces: option("--surfaces", Object.keys(table).join(",")).split(","),
      outDir,
      imagesDir: resolve(option("--images", join(outDir, "full"))),
    });
    process.exit(0);
  }
}
