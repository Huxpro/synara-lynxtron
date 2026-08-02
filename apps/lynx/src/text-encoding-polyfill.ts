export function encodeUtf8(input = ''): Uint8Array {
  const bytes: number[] = [];
  for (const symbol of String(input)) {
    const codePoint = symbol.codePointAt(0) ?? 0;
    if (codePoint <= 0x7f) {
      bytes.push(codePoint);
    } else if (codePoint <= 0x7ff) {
      bytes.push(
        0xc0 | (codePoint >> 6),
        0x80 | (codePoint & 0x3f)
      );
    } else if (codePoint <= 0xffff) {
      bytes.push(
        0xe0 | (codePoint >> 12),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f)
      );
    } else {
      bytes.push(
        0xf0 | (codePoint >> 18),
        0x80 | ((codePoint >> 12) & 0x3f),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f)
      );
    }
  }
  return new Uint8Array(bytes);
}

export function decodeUtf8(input?: ArrayBufferView | ArrayBuffer | null): string {
  if (!input) return '';
  const bytes =
    input instanceof ArrayBuffer
      ? new Uint8Array(input)
      : new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  let output = '';
  for (let index = 0; index < bytes.length; ) {
    const first = bytes[index++] ?? 0;
    let codePoint: number;
    if (first < 0x80) {
      codePoint = first;
    } else if ((first & 0xe0) === 0xc0) {
      codePoint =
        ((first & 0x1f) << 6) |
        ((bytes[index++] ?? 0) & 0x3f);
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

class LynxTextEncoder {
  readonly encoding = 'utf-8';

  encode(input = ''): Uint8Array {
    return encodeUtf8(input);
  }
}

class LynxTextDecoder {
  readonly encoding = 'utf-8';

  decode(input?: ArrayBufferView | ArrayBuffer | null): string {
    return decodeUtf8(input);
  }
}

if (typeof globalThis.TextEncoder === 'undefined') {
  Object.defineProperty(globalThis, 'TextEncoder', {
    configurable: true,
    writable: true,
    value: LynxTextEncoder,
  });
}

if (typeof globalThis.TextDecoder === 'undefined') {
  Object.defineProperty(globalThis, 'TextDecoder', {
    configurable: true,
    writable: true,
    value: LynxTextDecoder,
  });
}
