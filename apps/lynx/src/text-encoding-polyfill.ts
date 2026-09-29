function encodeCodePoint(codePoint: number): number[] {
  const scalar = codePoint >= 0xd800 && codePoint <= 0xdfff ? 0xfffd : codePoint;
  if (scalar <= 0x7f) return [scalar];
  if (scalar <= 0x7ff) {
    return [0xc0 | (scalar >> 6), 0x80 | (scalar & 0x3f)];
  }
  if (scalar <= 0xffff) {
    return [0xe0 | (scalar >> 12), 0x80 | ((scalar >> 6) & 0x3f), 0x80 | (scalar & 0x3f)];
  }
  return [
    0xf0 | (scalar >> 18),
    0x80 | ((scalar >> 12) & 0x3f),
    0x80 | ((scalar >> 6) & 0x3f),
    0x80 | (scalar & 0x3f),
  ];
}

export function encodeUtf8(input = ""): Uint8Array {
  const bytes: number[] = [];
  for (const symbol of String(input)) {
    bytes.push(...encodeCodePoint(symbol.codePointAt(0) ?? 0));
  }
  return new Uint8Array(bytes);
}

export function encodeUtf8Into(
  input: string,
  destination: Uint8Array,
): TextEncoderEncodeIntoResult {
  let read = 0;
  let written = 0;
  for (const symbol of String(input)) {
    const bytes = encodeCodePoint(symbol.codePointAt(0) ?? 0);
    if (written + bytes.length > destination.length) break;
    destination.set(bytes, written);
    read += symbol.length;
    written += bytes.length;
  }
  return { read, written };
}

export function decodeUtf8(input?: ArrayBufferView | ArrayBuffer | null): string {
  if (!input) return "";
  const bytes =
    input instanceof ArrayBuffer
      ? new Uint8Array(input)
      : new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  let output = "";
  for (let index = 0; index < bytes.length; ) {
    const first = bytes[index++] ?? 0;
    let codePoint: number;
    if (first < 0x80) {
      codePoint = first;
    } else if ((first & 0xe0) === 0xc0) {
      codePoint = ((first & 0x1f) << 6) | ((bytes[index++] ?? 0) & 0x3f);
    } else if ((first & 0xf0) === 0xe0) {
      codePoint =
        ((first & 0x0f) << 12) |
        (((bytes[index++] ?? 0) & 0x3f) << 6) |
        ((bytes[index++] ?? 0) & 0x3f);
    } else {
      codePoint =
        ((first & 0x07) << 18) |
        (((bytes[index++] ?? 0) & 0x3f) << 12) |
        (((bytes[index++] ?? 0) & 0x3f) << 6) |
        ((bytes[index++] ?? 0) & 0x3f);
    }
    output += String.fromCodePoint(codePoint);
  }
  return output;
}

export class LynxTextEncoder {
  readonly encoding = "utf-8";

  encode(input = ""): Uint8Array {
    return encodeUtf8(input);
  }

  encodeInto(input: string, destination: Uint8Array): TextEncoderEncodeIntoResult {
    return encodeUtf8Into(input, destination);
  }
}

export class LynxTextDecoder {
  readonly encoding = "utf-8";

  decode(input?: ArrayBufferView | ArrayBuffer | null): string {
    return decodeUtf8(input);
  }
}

interface TextEncodingGlobal {
  TextDecoder?: typeof TextDecoder;
  TextEncoder?: typeof TextEncoder;
}

function supportsTextEncoderEncodeInto(
  TextEncoderConstructor: typeof TextEncoder | undefined,
): boolean {
  if (typeof TextEncoderConstructor !== "function") return false;
  try {
    const destination = new Uint8Array(1);
    const result = new TextEncoderConstructor().encodeInto("A", destination);
    return result.read === 1 && result.written === 1 && destination[0] === 0x41;
  } catch {
    return false;
  }
}

function supportsTextDecoderViewBounds(
  TextDecoderConstructor: typeof TextDecoder | undefined,
): boolean {
  if (typeof TextDecoderConstructor !== "function") return false;
  try {
    const source = new Uint8Array([0x78, 0x41, 0x79]);
    return new TextDecoderConstructor().decode(source.subarray(1, 2)) === "A";
  } catch {
    return false;
  }
}

export function installTextEncodingPolyfill(target: TextEncodingGlobal): void {
  if (!supportsTextEncoderEncodeInto(target.TextEncoder)) {
    Object.defineProperty(target, "TextEncoder", {
      configurable: true,
      writable: true,
      value: LynxTextEncoder,
    });
  }

  if (!supportsTextDecoderViewBounds(target.TextDecoder)) {
    Object.defineProperty(target, "TextDecoder", {
      configurable: true,
      writable: true,
      value: LynxTextDecoder,
    });
  }
}

installTextEncodingPolyfill(globalThis);
