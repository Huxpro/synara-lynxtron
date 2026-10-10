// CSS color parsing and conversion shared by the Native color-mix projection
// (build time) and the paired comparison measurements (scripts/comparison-measure.mjs).
// Colors are { r, g, b, a } with sRGB channels in 0–255 and alpha in 0–1.

const NAMED_COLORS = Object.freeze({
  transparent: { r: 0, g: 0, b: 0, a: 0 },
  black: { r: 0, g: 0, b: 0, a: 1 },
  white: { r: 255, g: 255, b: 255, a: 1 },
  currentcolor: null,
});

function srgbToLinear(channel255) {
  const c = channel255 / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function linearToSrgb255(channel) {
  const clamped = Math.min(1, Math.max(0, channel));
  const encoded =
    clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
  return encoded * 255;
}

// The extended (sign-preserving) transfer functions CSS Color 4 specifies for sRGB
// channels outside 0–1, so a colour outside the sRGB gamut survives a round trip.
function extendedSrgbToLinear(channel255) {
  return Math.sign(channel255) * srgbToLinear(Math.abs(channel255));
}

function linearToExtendedSrgb255(channel) {
  const magnitude = Math.abs(channel);
  const encoded =
    magnitude <= 0.0031308 ? 12.92 * magnitude : 1.055 * Math.pow(magnitude, 1 / 2.4) - 0.055;
  return Math.sign(channel) * encoded * 255;
}

function linearSrgbToOklab(lr, lg, lb) {
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/** sRGB (0–255) → OKLab, per Björn Ottosson's reference matrices. */
export function srgb255ToOklab(r, g, b) {
  return linearSrgbToOklab(srgbToLinear(r), srgbToLinear(g), srgbToLinear(b));
}

/** As `srgb255ToOklab`, for channels that may lie outside 0–255. */
export function extendedSrgb255ToOklab(r, g, b) {
  return linearSrgbToOklab(
    extendedSrgbToLinear(r),
    extendedSrgbToLinear(g),
    extendedSrgbToLinear(b),
  );
}

function oklabToLinearSrgb(l, a, b) {
  const l_ = Math.pow(l + 0.3963377774 * a + 0.2158037573 * b, 3);
  const m_ = Math.pow(l - 0.1055613458 * a - 0.0638541728 * b, 3);
  const s_ = Math.pow(l - 0.0894841775 * a - 1.291485548 * b, 3);
  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
}

/** OKLab → sRGB (0–255), clipped to the sRGB gamut. */
export function oklabToSrgb255(l, a, b) {
  return oklabToLinearSrgb(l, a, b).map(linearToSrgb255);
}

/** OKLab → sRGB (0–255) without clipping: channels may lie outside 0–255. */
export function oklabToExtendedSrgb255(l, a, b) {
  return oklabToLinearSrgb(l, a, b).map(linearToExtendedSrgb255);
}

function splitArguments(body) {
  const [channels, alpha] = body.split("/");
  const parts = channels.split(/[\s,]+/).filter(Boolean);
  if (alpha === undefined && parts.length === 4)
    return { parts: parts.slice(0, 3), alpha: parts[3] };
  return { parts, alpha: alpha?.trim() };
}

function parseAlpha(text) {
  if (text === undefined) return 1;
  return text.endsWith("%") ? Number.parseFloat(text) / 100 : Number.parseFloat(text);
}

/**
 * Parses a CSS color into { r, g, b, a }, or null when unrecognized.
 * `quantizeLegacyAlpha` stores rgb()/hex/hsl() alpha at 8-bit precision, as
 * Chromium does before mixing. `clipToGamut: false` keeps an oklab()/oklch() colour
 * that lies outside sRGB unclipped (channels outside 0–255), for mixing as specified.
 */
export function parseCssColor(value, { quantizeLegacyAlpha = false, clipToGamut = true } = {}) {
  const text = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!text) return null;
  if (text in NAMED_COLORS) return NAMED_COLORS[text] && { ...NAMED_COLORS[text] };
  const quantize = (alpha) => (quantizeLegacyAlpha ? Math.round(alpha * 255) / 255 : alpha);
  const functional = /^rgba?\(([^)]+)\)$/.exec(text);
  if (functional) {
    const { parts, alpha } = splitArguments(functional[1]);
    const channels = parts.map((part) =>
      part.endsWith("%") ? (Number.parseFloat(part) / 100) * 255 : Number(part),
    );
    if (channels.length !== 3 || channels.some((channel) => !Number.isFinite(channel))) return null;
    return { r: channels[0], g: channels[1], b: channels[2], a: quantize(parseAlpha(alpha)) };
  }
  const hex = /^#([0-9a-f]{3,8})$/.exec(text);
  if (hex) {
    let digits = hex[1];
    if (digits.length === 3 || digits.length === 4) {
      digits = [...digits].map((digit) => digit + digit).join("");
    }
    if (digits.length !== 6 && digits.length !== 8) return null;
    const channel = (index) => Number.parseInt(digits.slice(index, index + 2), 16);
    return {
      r: channel(0),
      g: channel(2),
      b: channel(4),
      a: digits.length === 8 ? channel(6) / 255 : 1,
    };
  }
  const hsl = /^hsla?\(([^)]+)\)$/.exec(text);
  if (hsl) {
    const { parts, alpha } = splitArguments(hsl[1]);
    const hue = (((Number.parseFloat(parts[0]) % 360) + 360) % 360) / 360;
    const saturation = Number.parseFloat(parts[1]) / 100;
    const lightness = Number.parseFloat(parts[2]) / 100;
    const q =
      lightness < 0.5
        ? lightness * (1 + saturation)
        : lightness + saturation - lightness * saturation;
    const p = 2 * lightness - q;
    const channel = (t) => {
      const wrapped = t < 0 ? t + 1 : t > 1 ? t - 1 : t;
      if (wrapped < 1 / 6) return p + (q - p) * 6 * wrapped;
      if (wrapped < 1 / 2) return q;
      if (wrapped < 2 / 3) return p + (q - p) * (2 / 3 - wrapped) * 6;
      return p;
    };
    return {
      r: channel(hue + 1 / 3) * 255,
      g: channel(hue) * 255,
      b: channel(hue - 1 / 3) * 255,
      a: quantize(parseAlpha(alpha)),
    };
  }
  const srgb = /^color\(srgb\s+([^)]+)\)$/.exec(text);
  if (srgb) {
    const { parts, alpha } = splitArguments(srgb[1]);
    const [r, g, b] = parts.map(Number);
    return { r: r * 255, g: g * 255, b: b * 255, a: parseAlpha(alpha) };
  }
  const lab = /^(oklab|oklch)\(([^)]+)\)$/.exec(text);
  if (lab) {
    const { parts, alpha } = splitArguments(lab[2]);
    const [l, second, third] = parts.map((part) =>
      part.endsWith("%") ? Number.parseFloat(part) / 100 : Number(part),
    );
    const [a, b] =
      lab[1] === "oklab"
        ? [second, third]
        : [second * Math.cos((third * Math.PI) / 180), second * Math.sin((third * Math.PI) / 180)];
    const [r, g, bl] = clipToGamut ? oklabToSrgb255(l, a, b) : oklabToExtendedSrgb255(l, a, b);
    return { r, g, b: bl, a: parseAlpha(alpha) };
  }
  return null;
}

/** Serializes to the rgba() form Lynx accepts. */
export function formatRgba(color) {
  const channel = (value) => Math.round(Math.min(255, Math.max(0, value)));
  const alpha = Number(Math.min(1, Math.max(0, color.a)).toFixed(6));
  return `rgba(${channel(color.r)}, ${channel(color.g)}, ${channel(color.b)}, ${alpha})`;
}
