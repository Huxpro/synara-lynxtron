import { assert, describe, expect, it, vi } from "vitest";

import { isMacPlatform, isWindowsPlatform, randomUUID } from "./utils";

describe("randomUUID", () => {
  it("uses the platform implementation when Web Crypto is available", () => {
    const nativeRandomUUID = vi
      .spyOn(globalThis.crypto, "randomUUID")
      .mockReturnValue("00000000-0000-4000-8000-000000000001");

    expect(randomUUID()).toBe("00000000-0000-4000-8000-000000000001");
    expect(nativeRandomUUID).toHaveBeenCalledOnce();

    nativeRandomUUID.mockRestore();
  });

  it("falls back when the runtime does not define global crypto", () => {
    const originalCrypto = globalThis.crypto;
    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: undefined,
    });

    try {
      expect(randomUUID()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    } finally {
      Object.defineProperty(globalThis, "crypto", {
        configurable: true,
        value: originalCrypto,
      });
    }
  });
});

describe("isMacPlatform", () => {
  it("matches browser and Node.js macOS platform identifiers", () => {
    assert.isTrue(isMacPlatform("MacIntel"));
    assert.isTrue(isMacPlatform("darwin"));
  });

  it("does not match Windows or Linux", () => {
    assert.isFalse(isMacPlatform("Win32"));
    assert.isFalse(isMacPlatform("Linux x86_64"));
  });
});

describe("isWindowsPlatform", () => {
  it("matches Windows platform identifiers", () => {
    assert.isTrue(isWindowsPlatform("Win32"));
    assert.isTrue(isWindowsPlatform("Windows"));
    assert.isTrue(isWindowsPlatform("windows_nt"));
  });

  it("does not match darwin", () => {
    assert.isFalse(isWindowsPlatform("darwin"));
  });
});
