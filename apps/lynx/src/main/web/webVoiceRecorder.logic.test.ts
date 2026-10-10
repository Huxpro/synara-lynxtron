import { describe, expect, it } from "@rstest/core";

import {
  bytesToBase64,
  encodeWavPcm16,
  peakLevel,
  webVoicePermission,
  webVoiceSupported,
} from "./webVoiceRecorder.logic";

describe("Lynx-for-Web voice recorder", () => {
  it("is supported only with a secure context, a microphone API and an audio graph", () => {
    const all = { isSecureContext: true, hasGetUserMedia: true, hasAudioContext: true };
    expect(webVoiceSupported(all)).toBe(true);
    expect(webVoiceSupported({ ...all, isSecureContext: false })).toBe(false);
    expect(webVoiceSupported({ ...all, hasGetUserMedia: false })).toBe(false);
    expect(webVoiceSupported({ ...all, hasAudioContext: false })).toBe(false);
  });

  it("names the browser's permission states as the desktop host does", () => {
    expect(webVoicePermission("granted")).toBe("granted");
    expect(webVoicePermission("denied")).toBe("denied");
    expect(webVoicePermission("prompt")).toBe("not-determined");
    expect(webVoicePermission(undefined)).toBe("unknown");
  });

  it("reports the loudest sample, capped at 1", () => {
    expect(peakLevel(new Float32Array([0, -0.5, 0.25]))).toBe(0.5);
    expect(peakLevel(new Float32Array([2]))).toBe(1);
    expect(peakLevel(new Float32Array([]))).toBe(0);
  });

  it("encodes mono 16-bit PCM WAV with a correct header", () => {
    const wav = encodeWavPcm16([new Float32Array([0, 1]), new Float32Array([-1, 0.5])], 24000);
    const view = new DataView(wav.buffer);
    const text = (offset: number) => String.fromCharCode(...wav.subarray(offset, offset + 4));
    expect(wav.length).toBe(44 + 4 * 2);
    expect([text(0), text(8), text(12), text(36)]).toEqual(["RIFF", "WAVE", "fmt ", "data"]);
    expect(view.getUint32(4, true)).toBe(36 + 8);
    expect(view.getUint16(20, true)).toBe(1);
    expect(view.getUint16(22, true)).toBe(1);
    expect(view.getUint32(24, true)).toBe(24000);
    expect(view.getUint32(28, true)).toBe(48000);
    expect(view.getUint16(34, true)).toBe(16);
    expect(view.getUint32(40, true)).toBe(8);
    expect([0, 1, 2, 3].map((index) => view.getInt16(44 + index * 2, true))).toEqual([
      0, 32767, -32768, 16384,
    ]);
  });

  it("truncates at the byte limit and clamps out-of-range samples", () => {
    const wav = encodeWavPcm16([new Float32Array([3, -3, 0.1, 0.2])], 24000, 44 + 4);
    const view = new DataView(wav.buffer);
    expect(wav.length).toBe(48);
    expect(view.getUint32(40, true)).toBe(4);
    expect([view.getInt16(44, true), view.getInt16(46, true)]).toEqual([32767, -32768]);
    expect(encodeWavPcm16([], 24000).length).toBe(44);
  });

  it("encodes bytes of any length to base64", () => {
    const bytes = new Uint8Array(70_000).map((_, index) => index % 251);
    const encoded = bytesToBase64(bytes, (binary) =>
      Buffer.from(binary, "binary").toString("base64"),
    );
    expect(Buffer.from(encoded, "base64").equals(Buffer.from(bytes))).toBe(true);
  });
});
