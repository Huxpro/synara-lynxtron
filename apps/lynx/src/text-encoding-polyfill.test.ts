import { describe, expect, it } from '@rstest/core';

import {
  decodeUtf8,
  encodeUtf8,
  encodeUtf8Into,
  installTextEncodingPolyfill,
  LynxTextDecoder,
  LynxTextEncoder,
} from './text-encoding-polyfill';

describe('UTF-8 text encoding polyfill', () => {
  it('round-trips ASCII, CJK, and astral symbols', () => {
    const value = 'Synara · 线程 · 🦊';
    expect(decodeUtf8(encodeUtf8(value))).toBe(value);
  });

  it('emits the standard UTF-8 byte sequence', () => {
    expect([...encodeUtf8('A€')]).toEqual([0x41, 0xe2, 0x82, 0xac]);
  });

  it('replaces isolated UTF-16 surrogates with the replacement character', () => {
    expect([...encodeUtf8('\ud800')]).toEqual([0xef, 0xbf, 0xbd]);
  });

  it('encodes into a bounded destination without splitting a symbol', () => {
    const destination = new Uint8Array(5);

    expect(encodeUtf8Into('A🦊B', destination)).toEqual({
      read: 3,
      written: 5,
    });
    expect([...destination]).toEqual([0x41, 0xf0, 0x9f, 0xa6, 0x8a]);
  });

  it('exposes the standard encodeInto method on the Lynx constructor', () => {
    const destination = new Uint8Array(4);

    expect(new LynxTextEncoder().encodeInto('€A', destination)).toEqual({
      read: 2,
      written: 4,
    });
    expect([...destination]).toEqual([0xe2, 0x82, 0xac, 0x41]);
  });

  it('replaces an existing partial TextEncoder implementation', () => {
    class PartialTextEncoder {
      readonly encoding = 'utf-8';

      encode(input = ''): Uint8Array {
        return encodeUtf8(input);
      }
    }
    const target = {
      TextEncoder: PartialTextEncoder as unknown as typeof TextEncoder,
      TextDecoder,
    };

    installTextEncodingPolyfill(target);

    expect(target.TextEncoder).toBe(LynxTextEncoder);
    expect(typeof target.TextEncoder.prototype.encodeInto).toBe('function');
  });

  it('replaces a Lynx-style encoder whose encodeInto method throws', () => {
    class UnsupportedEncodeIntoTextEncoder {
      readonly encoding = 'utf-8';

      encode(input = ''): Uint8Array {
        return encodeUtf8(input);
      }

      encodeInto(): TextEncoderEncodeIntoResult {
        throw new TypeError('TextEncoder().encodeInto not supported');
      }
    }
    const target = {
      TextEncoder: UnsupportedEncodeIntoTextEncoder as unknown as typeof TextEncoder,
      TextDecoder,
    };

    installTextEncodingPolyfill(target);

    expect(target.TextEncoder).toBe(LynxTextEncoder);
    expect(new target.TextEncoder().encodeInto('A', new Uint8Array(1))).toEqual({
      read: 1,
      written: 1,
    });
  });

  it('replaces a Lynx-style decoder that ignores typed-array view bounds', () => {
    class UnboundedTextDecoder {
      readonly encoding = 'utf-8';

      decode(input?: ArrayBufferView | ArrayBuffer | null): string {
        if (!input) return '';
        const bytes =
          input instanceof ArrayBuffer
            ? new Uint8Array(input)
            : new Uint8Array(input.buffer);
        return String.fromCharCode(...bytes);
      }
    }
    const target = {
      TextEncoder,
      TextDecoder: UnboundedTextDecoder as unknown as typeof TextDecoder,
    };

    installTextEncodingPolyfill(target);

    expect(target.TextDecoder).toBe(LynxTextDecoder);
    const source = new Uint8Array([0x78, 0x41, 0x79]);
    expect(new target.TextDecoder().decode(source.subarray(1, 2))).toBe('A');
  });

  it('preserves an existing complete TextEncoder implementation', () => {
    const target = { TextEncoder, TextDecoder };

    installTextEncodingPolyfill(target);

    expect(target.TextEncoder).toBe(TextEncoder);
    expect(target.TextDecoder).toBe(TextDecoder);
  });
});
