import { readFileSync } from "node:fs";

import { describe, expect, it } from "@rstest/core";

import {
  CHAT_WIDTH_OPTIONS,
  readChatWidthSetting,
  resolveChatWidthVariables,
  writeChatWidthSetting,
} from "./chatWidthSetting.logic";

describe("Chat width setting", () => {
  it("defaults to standard and ignores values upstream does not know", () => {
    expect(readChatWidthSetting(null)).toBe("standard");
    expect(readChatWidthSetting('{"chatWidth":"huge"}')).toBe("standard");
    expect(readChatWidthSetting('{"chatWidth":"wide"}')).toBe("wide");
  });

  it("writes only its key and keeps every key it does not know", () => {
    const raw = JSON.stringify({ uiDensity: "compact", someFutureSetting: [1], chatWidth: "wide" });
    expect(JSON.parse(writeChatWidthSetting(raw, "full"))).toEqual({
      uiDensity: "compact",
      someFutureSetting: [1],
      chatWidth: "full",
    });
  });

  it("gives the root upstream's column width in pixels", () => {
    expect(resolveChatWidthVariables("standard")).toEqual({ "--app-chat-max-width": "736px" });
    expect(resolveChatWidthVariables("wide")).toEqual({ "--app-chat-max-width": "1152px" });
    expect(resolveChatWidthVariables("full")).toEqual({ "--app-chat-max-width": "100%" });
  });

  it("offers upstream's options and the column reads the variable", () => {
    const upstream = readFileSync(
      new URL("../../../web/src/routes/_chat.settings.tsx", import.meta.url),
      "utf8",
    );
    for (const option of CHAT_WIDTH_OPTIONS) {
      expect(upstream).toContain(`value: "${option.value}",\n    label: "${option.label}",`);
    }
    for (const file of [
      "../adapters/composer-column-frame-surface-elements.css",
      "../adapters/centered-empty-landing-elements.css",
      "./empty-thread-context-tray.css",
    ]) {
      expect(readFileSync(new URL(file, import.meta.url), "utf8")).toContain(
        "max-width: var(--app-chat-max-width, 736px);",
      );
    }
  });
});
