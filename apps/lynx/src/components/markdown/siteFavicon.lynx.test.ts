import { describe, expect, it } from "@rstest/core";

import {
  buildSiteFaviconUrl,
  extractExternalLinkHost,
  isGitHubExternalLink,
} from "./siteFavicon.lynx";

describe("Lynx markdown site favicon URLs", () => {
  it("extracts safe HTTP hosts and recognizes GitHub", () => {
    expect(extractExternalLinkHost("https://OpenAI.com/research?q=1")).toBe("openai.com");
    expect(extractExternalLinkHost("mailto:test@example.com")).toBeNull();
    expect(isGitHubExternalLink("https://github.com/openai/codex")).toBe(true);
    expect(isGitHubExternalLink("https://docs.github.com/en")).toBe(true);
    expect(isGitHubExternalLink("https://example.com")).toBe(false);
  });

  it("builds a same-server favicon URL and forwards the startup token", () => {
    const previous = process.env.SYNARA_WS_URL;
    process.env.SYNARA_WS_URL = "wss://synara.example/ws?token=dev-secret&ignored=value";
    try {
      expect(buildSiteFaviconUrl("https://OpenAI.com/research")).toBe(
        "https://synara.example/api/site-favicon?domain=openai.com&token=dev-secret",
      );
      expect(buildSiteFaviconUrl("not a URL")).toBeNull();
    } finally {
      if (previous === undefined) delete process.env.SYNARA_WS_URL;
      else process.env.SYNARA_WS_URL = previous;
    }
  });

  it("prefers the live backend the desktop host passed in init data", () => {
    const host = lynx as unknown as { __initData?: unknown };
    const previousInitData = host.__initData;
    const previousEnv = process.env.SYNARA_WS_URL;
    process.env.SYNARA_WS_URL = "ws://127.0.0.1:53477/?token=stale";
    host.__initData = { runtimeWsUrl: "ws://127.0.0.1:58090/?token=live" };
    try {
      expect(buildSiteFaviconUrl("https://example.com")).toBe(
        "http://127.0.0.1:58090/api/site-favicon?domain=example.com&token=live",
      );
    } finally {
      host.__initData = previousInitData;
      if (previousEnv === undefined) delete process.env.SYNARA_WS_URL;
      else process.env.SYNARA_WS_URL = previousEnv;
    }
  });
});
