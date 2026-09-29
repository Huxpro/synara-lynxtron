import { readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "@rstest/core";

import { openUpdateDownload } from "./updateHandoff.logic";

describe("update download handoff", () => {
  it("captures the URL without opening an external browser when opted in", async () => {
    const capturePath = join(
      tmpdir(),
      `synara-update-handoff-${Date.now()}-${Math.random()}.jsonl`,
    );
    const openedUrls: string[] = [];
    const openExternal = async (url: string) => {
      openedUrls.push(url);
    };

    try {
      await openUpdateDownload({
        capturePath,
        openExternal,
        url: "https://example.com/releases/latest",
      });

      expect(openedUrls).toEqual([]);
      expect(JSON.parse((await readFile(capturePath, "utf8")).trim())).toEqual({
        url: "https://example.com/releases/latest",
      });
    } finally {
      await rm(capturePath, { force: true });
    }
  });

  it("uses the platform handoff by default", async () => {
    const openedUrls: string[] = [];
    const openExternal = async (url: string) => {
      openedUrls.push(url);
    };

    await openUpdateDownload({
      capturePath: null,
      openExternal,
      url: "https://example.com/releases/latest",
    });

    expect(openedUrls).toEqual(["https://example.com/releases/latest"]);
  });
});
