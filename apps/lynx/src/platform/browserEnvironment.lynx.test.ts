import { afterEach, describe, expect, it, rs } from "@rstest/core";

// Storage writes persist through the host bridge; record them instead.
const bridgeCalls: Array<{ readonly method: string; readonly params: unknown }> = [];
rs.mock("./bridge", () => ({
  bridgeCall: async (method: string, params: unknown) => {
    bridgeCalls.push({ method, params });
    return method === "shellOpenExternal" ? { opened: true } : {};
  },
  onGlobalEvent: () => () => undefined,
}));

import { addWsTransportStateListener, emitWsTransportState } from "@synara-web/wsTransportEvents";
import { getNavigatorPlatform, randomUUID } from "@synara-web/lib/utils";

import {
  BROWSER_ENVIRONMENT_GLOBALS,
  BrowserEnvironmentUnsupportedError,
  crypto,
  document,
  localStorage,
  location,
  navigator,
  sessionStorage,
  window,
} from "./browserEnvironment.lynx";
import * as browserEnvironment from "./browserEnvironment.lynx";
import { resetWindowEventListenersForTest } from "./events";
import { sessionWebStorage, webStorage } from "./storage";

describe("Lynx browser environment", () => {
  afterEach(() => {
    resetWindowEventListenersForTest();
    webStorage.clear();
    sessionWebStorage.clear();
  });

  it("touches the host bridge only when a backed member is used", async () => {
    // Importing the module and reading its members is free of bridge calls.
    expect(bridgeCalls).toEqual([]);
    await navigator.clipboard.writeText("copied");
    expect(bridgeCalls).toEqual([{ method: "clipboardWriteText", params: { text: "copied" } }]);
  });

  it("exports every name the loader may bind", () => {
    for (const name of BROWSER_ENVIRONMENT_GLOBALS) {
      expect(typeof browserEnvironment[name]).toBe("object");
    }
  });

  it("backs both storages with the Lynx storage port", () => {
    window.localStorage.setItem("synara:test", "1");
    expect(webStorage.getItem("synara:test")).toBe("1");
    expect(localStorage.getItem("synara:test")).toBe("1");
    window.sessionStorage.setItem("synara:session", "2");
    expect(sessionStorage.getItem("synara:session")).toBe("2");
    expect(webStorage.getItem("synara:session")).toBeNull();
  });

  it("delivers window events through the renderer-local bus", () => {
    const seen: string[] = [];
    const listener = (event: Event) => seen.push(event.type);
    window.addEventListener("synara:probe", listener);
    window.dispatchEvent(new Event("synara:probe"));
    window.removeEventListener("synara:probe", listener);
    window.dispatchEvent(new Event("synara:probe"));
    expect(seen).toEqual(["synara:probe"]);
  });

  it("runs timers and frames, and cancels them", async () => {
    const calls: string[] = [];
    window.setTimeout(() => calls.push("timeout"), 0);
    const cancelledTimeout = window.setTimeout(() => calls.push("cancelled-timeout"), 0);
    window.clearTimeout(cancelledTimeout);
    window.requestAnimationFrame((time) => calls.push(typeof time === "number" ? "frame" : "bad"));
    const cancelledFrame = window.requestAnimationFrame(() => calls.push("cancelled-frame"));
    window.cancelAnimationFrame(cancelledFrame);
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(calls.toSorted()).toEqual(["frame", "timeout"]);
  });

  it("reports the facts upstream reads from navigator and location", () => {
    expect(navigator.platform).toBe("MacIntel");
    expect(window.navigator).toBe(navigator);
    expect(window.location).toBe(location);
    expect(location.protocol).toBe("");
    expect(location.hash).toBe("");
    expect(typeof location.origin).toBe("string");
  });

  it("leaves what Lynx lacks undefined so upstream feature detection fails closed", () => {
    expect(window.desktopBridge).toBeUndefined();
    expect(navigator.mediaDevices).toBeUndefined();
    expect(navigator.hardwareConcurrency).toBeUndefined();
    expect(typeof document.execCommand).toBe("undefined");
    expect("write" in navigator.clipboard).toBe(false);
  });

  it("accepts document listeners and root-style writes without effect", () => {
    document.addEventListener("visibilitychange", () => {
      throw new Error("never called");
    });
    document.documentElement.style.setProperty("--probe", "1");
    expect(document.documentElement.style.getPropertyValue("--probe")).toBe("");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.visibilityState).toBe("visible");
    expect(document.activeElement).toBeNull();
    expect(document.querySelector("[data-probe]")).toBeNull();
    expect(window.matchMedia("(prefers-color-scheme: dark)").matches).toBe(false);
    expect(window.getSelection()).toBeNull();
  });

  it("throws a named error for members that cannot work", () => {
    expect(() => document.createElement("canvas")).toThrow(BrowserEnvironmentUnsupportedError);
    expect(() => document.body).toThrow("document.body is not available in the Lynx renderer.");
    expect(() => window.getComputedStyle({})).toThrow(BrowserEnvironmentUnsupportedError);
    expect(() => location.assign("/")).toThrow(BrowserEnvironmentUnsupportedError);
    expect(() => location.reload()).toThrow(BrowserEnvironmentUnsupportedError);
  });

  it("opens a URL through the host and returns no window handle", async () => {
    bridgeCalls.length = 0;
    expect(window.open("https://example.com/a", "_blank", "noopener,noreferrer")).toBeNull();
    expect(window.open()).toBeNull();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(bridgeCalls).toEqual([
      { method: "shellOpenExternal", params: { url: "https://example.com/a" } },
    ]);
  });

  it("keeps debug handles upstream attaches to window", () => {
    window.__probeForTests = 1;
    expect(window.__probeForTests).toBe(1);
    delete window.__probeForTests;
  });

  it("passes the runtime's crypto through and emulates nothing", () => {
    const host = (globalThis as { crypto?: { randomUUID?: unknown } }).crypto;
    expect(typeof crypto.randomUUID).toBe(
      typeof host?.randomUUID === "function" ? "function" : "undefined",
    );
  });
});

// These modules are upstream's files, byte-identical. They reference the bare
// globals; the test runner binds them through the same loader as the bundle.
describe("upstream source on the Lynx browser environment", () => {
  afterEach(() => {
    resetWindowEventListenersForTest();
  });

  it("reads navigator and crypto through the environment", () => {
    expect(getNavigatorPlatform()).toBe(navigator.platform);
    expect(randomUUID()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-/);
  });

  it("publishes transport state on the environment's window bus", () => {
    const states: string[] = [];
    const remove = addWsTransportStateListener((state) => states.push(state));
    const busStates: unknown[] = [];
    window.addEventListener("synara:ws-transport-state", (event) =>
      busStates.push((event as CustomEvent<{ state: string }>).detail.state),
    );
    emitWsTransportState("open");
    remove();
    emitWsTransportState("closed");
    expect(states).toEqual(["open"]);
    expect(busStates).toEqual(["open", "closed"]);
  });
});
