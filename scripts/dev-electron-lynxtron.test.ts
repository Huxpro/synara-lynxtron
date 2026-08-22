import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";

import {
  DEFAULT_DESKTOP_COMPARISON_OPTIONS,
  comparisonLynxDeepLink,
  comparisonWebUrl,
  desktopComparisonCommands,
  parseDesktopComparisonArgs,
  prepareDesktopComparisonHome,
  resolveDesktopComparisonPaths,
} from "./dev-electron-lynxtron.mjs";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("Electron and Lynxtron comparison launcher", () => {
  it("uses the long-lived comparison thread and matched dimensions by default", () => {
    expect(parseDesktopComparisonArgs([])).toEqual(DEFAULT_DESKTOP_COMPARISON_OPTIONS);
  });

  it("parses explicit ports, dimensions, thread, and build mode", () => {
    expect(
      parseDesktopComparisonArgs([
        "--thread",
        "thread-two",
        "--width",
        "1280",
        "--height",
        "820",
        "--web-port",
        "9001",
        "--electron-cdp-port",
        "9002",
        "--lynx-devtool-port",
        "9003",
        "--skip-build",
      ]),
    ).toEqual({
      threadId: "thread-two",
      width: 1280,
      height: 820,
      webPort: 9001,
      electronCdpPort: 9002,
      lynxDevtoolPort: 9003,
      skipBuild: true,
    });
  });

  it("rejects invalid arguments instead of launching an ambiguous fixture", () => {
    expect(() => parseDesktopComparisonArgs(["--width", "wide"])).toThrow(
      "--width requires a positive integer.",
    );
    expect(() => parseDesktopComparisonArgs(["--unknown", "value"])).toThrow(
      "Unknown option: --unknown",
    );
  });

  it("opens the same encoded thread in Web and native Lynx", () => {
    const options = { ...DEFAULT_DESKTOP_COMPARISON_OPTIONS, threadId: "thread / one" };
    expect(comparisonWebUrl(options)).toBe(
      "http://127.0.0.1:8891/#/thread%20%2F%20one",
    );
    expect(comparisonLynxDeepLink(options)).toBe("synara://thread/thread%20%2F%20one");
  });

  it("generates commands with one home, endpoint credential, and matched route", () => {
    const paths = resolveDesktopComparisonPaths("/repo");
    const commands = desktopComparisonCommands(
      DEFAULT_DESKTOP_COMPARISON_OPTIONS,
      paths,
      "comparison-token",
      "/runtime/electron",
    );

    expect(commands.electron).toMatchObject({
      command: "/runtime/electron",
      cwd: "/repo/apps/desktop",
      env: {
        SYNARA_HOME: "/repo/.synara-desktop-comparison/electron",
        SYNARA_DESKTOP_AUTH_TOKEN: "comparison-token",
        SYNARA_DESKTOP_USER_DATA_DIR:
          "/repo/.synara-desktop-comparison/electron-profile",
        VITE_DEV_SERVER_URL:
          "http://127.0.0.1:8891/#/lynx-landing-thread-1787254540864-987357febecef",
      },
    });
    expect(commands.electron.args).toContain("--remote-debugging-port=9223");
    expect(commands.electron.args).toContain(
      "--user-data-dir=/repo/.synara-desktop-comparison/electron-profile",
    );
    expect(commands.lynx).toMatchObject({
      command: "/repo/apps/lynx/node_modules/.bin/lynxtron",
      args: [
        "/repo/apps/lynx/dist/desktop",
        "synara://thread/lynx-landing-thread-1787254540864-987357febecef",
      ],
      env: {
        NODE_ENV: "production",
        SYNARA_ALLOW_PARALLEL_INSTANCE: "1",
        SYNARA_ENABLE_DEVTOOL: "1",
        SYNARA_LYNX_USER_DATA_DIR: "/repo/.synara-desktop-comparison/lynx",
        SYNARA_LYNX_DEVTOOL_PORT: "8902",
      },
    });
  });

  it("clones the real seed snapshot without carrying live runtime ownership files", () => {
    const root = mkdtempSync(join(tmpdir(), "synara-desktop-comparison-"));
    const paths = resolveDesktopComparisonPaths(root);
    mkdirSync(join(paths.seedHome, "dev", "provider-status"), { recursive: true });
    const sqlite = spawnSync(
      "sqlite3",
      [
        join(paths.seedHome, "dev", "state.sqlite"),
        "create table fixture(value text); insert into fixture values('example.js');",
      ],
      { encoding: "utf8" },
    );
    expect(sqlite.status).toBe(0);
    writeFileSync(join(paths.seedHome, "dev", "settings.json"), "{}");
    writeFileSync(join(paths.seedHome, "dev", "server-runtime.json"), "{\"pid\":1}");

    prepareDesktopComparisonHome(paths);

    expect(readFileSync(join(paths.electronHome, "dev", "settings.json"), "utf8")).toBe("{}");
    expect(
      spawnSync(
        "sqlite3",
        [join(paths.electronHome, "dev", "state.sqlite"), "select value from fixture;"],
        { encoding: "utf8" },
      ).stdout,
    ).toBe("example.js\n");
    expect(existsSync(join(paths.electronHome, "dev", "server-runtime.json"))).toBe(false);
  });
});
