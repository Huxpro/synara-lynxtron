import { describe, expect, it } from "vitest";

import {
  CONTROL_TOLERANCE_PX,
  INCREMENTS,
  SURFACES,
  compareControls,
} from "./comparison-cells.mjs";
import {
  LYNX_WEB_STORAGE_PREFIX,
  WEB_COMPARISON_MATRIX,
  chromeArguments,
  chromeExecutableCandidates,
  configurationTitle,
  isolatedServerEnvironment,
  lynxWebStateSeedExpression,
  parseDevRunnerPorts,
  parseWebComparisonArgs,
  resolveChromeExecutable,
  summarizeWebCell,
  summarizeWebReport,
  webComparisonConfigurations,
  webComparisonMarkdown,
  webReportTotals,
} from "./comparison-web.mjs";

const box = (x, y, width = 24, height = 24) => ({ x, y, width, height, gutter: 0 });

describe("browser comparison launcher", () => {
  it("measures the same cells, at the same tolerance, as the desktop matrix", () => {
    const options = parseWebComparisonArgs([], {});
    expect(options.surfaces).toEqual(Object.keys(SURFACES));
    expect(options.increments).toEqual(Object.keys(INCREMENTS));
    expect(CONTROL_TOLERANCE_PX).toBe(2);
    expect(WEB_COMPARISON_MATRIX.map(configurationTitle)).toEqual([
      "dark 1280×820",
      "dark 1440×900",
      "light 1280×820",
      "light 1440×900",
    ]);
    expect(webComparisonConfigurations({ ...options, matrix: true })).toBe(WEB_COMPARISON_MATRIX);
    expect(
      webComparisonConfigurations({ ...options, theme: "light", width: 1440, height: 900 }),
    ).toEqual([{ theme: "light", width: 1440, height: 900 }]);
  });

  it("parses its options and rejects what it does not know", () => {
    const options = parseWebComparisonArgs(
      ["--theme", "light", "--width", "1440", "--height", "900", "--surfaces", "thread,pr"],
      { SYNARA_COMPARE_FIXTURE_ROOT: "/checkout" },
    );
    expect(options).toMatchObject({
      theme: "light",
      width: 1440,
      height: 900,
      surfaces: ["thread", "pr"],
      fixtureRoot: "/checkout",
    });
    expect(parseWebComparisonArgs(["--increments", ""], {}).increments).toEqual([]);
    expect(parseWebComparisonArgs(["--skip-build", "--matrix"], {})).toMatchObject({
      skipBuild: true,
      matrix: true,
    });
    expect(() => parseWebComparisonArgs(["--theme", "system"], {})).toThrow(/dark or light/);
    expect(() => parseWebComparisonArgs(["--surfaces", "thread,nope"], {})).toThrow(/unknown nope/);
    expect(() => parseWebComparisonArgs(["--width", "0"], {})).toThrow(/positive integer/);
    expect(() => parseWebComparisonArgs(["--tolerance", "4"], {})).toThrow(/Unknown argument/);
  });

  it("reads the isolated ports from the dev runner's dry run", () => {
    expect(
      parseDevRunnerPorts(
        "[01:48:31.365] INFO (#1): [dev-runner] mode=dev:server source=SYNARA_PORT_OFFSET=731 serverPort=4504 webPort=6464 baseDir=/x",
      ),
    ).toEqual({ serverPort: 4504, webPort: 6464 });
    expect(() => parseDevRunnerPorts("no ports here")).toThrow(/printed no ports/);
  });

  it("isolates the servers from the person's instance", () => {
    const environment = isolatedServerEnvironment(
      { PATH: "/bin", SYNARA_AUTH_TOKEN: "someone-elses", SYNARA_WS_URL: "ws://elsewhere" },
      { home: "/run/home", portOffset: 731 },
    );
    expect(environment).toEqual({
      PATH: "/bin",
      SYNARA_HOME: "/run/home",
      SYNARA_PORT_OFFSET: "731",
      SYNARA_NO_BROWSER: "1",
      SYNARA_AUTO_BOOTSTRAP_PROJECT_FROM_CWD: "0",
    });
  });

  it("starts a headless Chromium with a profile and port of its own", () => {
    const shell = chromeArguments({
      executable: "/cache/chrome-headless-shell-mac-arm64/chrome-headless-shell",
      cdpPort: 9001,
      profile: "/run/chrome-web",
    });
    expect(shell).toContain("--remote-debugging-port=9001");
    expect(shell).toContain("--user-data-dir=/run/chrome-web");
    expect(shell).not.toContain("--headless=new");
    expect(
      chromeArguments({ executable: "/usr/bin/google-chrome", cdpPort: 1, profile: "/p" }),
    ).toContain("--headless=new");
  });

  it("looks for Chromium where the person said, then Playwright's, then the system's", () => {
    const candidates = chromeExecutableCandidates({
      environment: { SYNARA_COMPARE_CHROME: "/mine/chrome" },
      home: "/home/dev",
      platform: "linux",
      playwrightExecutable: "/pw/chromium-1234/chrome-linux/chrome",
      list: (directory, prefix) =>
        directory === "/home/dev/.cache/ms-playwright" && prefix === "chromium_headless_shell-"
          ? ["/home/dev/.cache/ms-playwright/chromium_headless_shell-1243"]
          : prefix === "chrome-"
            ? [`${directory}/chrome-headless-shell-linux64`]
            : [],
    });
    expect(candidates).toEqual([
      "/mine/chrome",
      "/pw/chromium-1234/chrome-linux/chrome",
      "/home/dev/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell",
      "/home/dev/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/headless_shell",
      "/usr/bin/google-chrome",
      "/usr/bin/chromium",
      "/usr/bin/chromium-browser",
    ]);
    expect(resolveChromeExecutable(candidates, (path) => path === "/usr/bin/chromium")).toBe(
      "/usr/bin/chromium",
    );
    expect(() => resolveChromeExecutable(candidates, () => false)).toThrow(/No Chromium found/);
    expect(
      chromeExecutableCandidates({
        environment: {},
        home: "/Users/dev",
        platform: "darwin",
        list: () => [],
      }),
    ).toEqual(["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"]);
  });

  it("seeds Lynx for Web once with the Web original's allowlisted state and the theme", () => {
    const expression = lynxWebStateSeedExpression(
      { "synara:app-settings:v1": '{"a":1}', "synara:theme": "dark", "not:allowlisted": "x" },
      "light",
    );
    const storage = new Map([
      [`${LYNX_WEB_STORAGE_PREFIX}stale`, "1"],
      ["other", "kept"],
    ]);
    const localStorage = {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
    };
    const run = () =>
      new Function("localStorage", "Object", expression)(localStorage, {
        ...Object,
        keys: (target) => (target === localStorage ? [...storage.keys()] : Object.keys(target)),
        entries: Object.entries,
      });
    run();
    expect(Object.fromEntries(storage)).toEqual({
      other: "kept",
      "synara.lynx.synara:app-settings:v1": '{"a":1}',
      "synara.lynx.synara:theme": "light",
      "synara.comparison.seeded": "1",
    });
    // A later load (a workflow's reload) keeps what the app has saved since.
    storage.set("synara.lynx.synara:theme", "dark");
    run();
    expect(storage.get("synara.lynx.synara:theme")).toBe("dark");
  });

  it("reports a cell as compared, matched, named, outside, missing on Lynx and Lynx-only", () => {
    const web = new Map([
      ["Home", [box(8, 54)]],
      ["Toggle thread sidebar", [box(16, 10)]],
      ["Record voice note", [box(1090, 766)]],
      ["Settings sections", [box(60, 60, 200, 400)]],
    ]);
    const lynx = new Map([
      ["Home", [box(8, 55)]],
      ["Toggle thread sidebar", [box(90, 10)]],
      ["Back", [box(116, 8)]],
    ]);
    const comparison = compareControls(web, lynx);
    const cell = {
      comparison: { ...comparison, exempt: [] },
      pass: false,
      electronErrors: [],
      probes: [{ name: "menu popup", match: false, delta: { x: 38, y: 0, width: 0, height: 0 } }],
    };
    expect(summarizeWebCell("thread", cell)).toMatchObject({
      name: "thread",
      pass: false,
      compared: 2,
      matched: 1,
      exempt: 0,
      outside: 1,
      outsideControls: [
        { label: "Toggle thread sidebar", delta: { x: 74, y: 0, width: 0, height: 0 } },
      ],
      missingOnLynx: ["Record voice note"],
      explainedMissing: ["Settings sections"],
      lynxOnly: ["Back"],
      probes: [{ name: "menu popup", match: false }],
    });
    expect(summarizeWebCell("landing", { pass: false, error: "Timed out" })).toEqual({
      name: "landing",
      pass: false,
      error: "Timed out",
    });

    const report = {
      theme: "dark",
      width: 1280,
      height: 820,
      cells: { thread: cell, landing: { pass: false, error: "Timed | out" } },
      increments: { "model-menu": cell },
    };
    const summaries = summarizeWebReport(report);
    expect(summaries.map((summary) => summary.name)).toEqual(["thread", "landing", "+model-menu"]);
    expect(webReportTotals(summaries)).toEqual({
      cells: 3,
      passed: 0,
      unmeasured: 1,
      compared: 4,
      matched: 2,
      exempt: 0,
      outside: 2,
      missingOnLynx: 2,
      lynxOnly: 2,
    });
    const markdown = webComparisonMarkdown([report]);
    expect(markdown).toContain("| dark 1280×820 | thread | 2 | 1 | 0 | 1 | 1 | 1 | FAIL |");
    expect(markdown).toContain("not measured: Timed \\| out");
    expect(markdown).toContain("| dark 1280×820 | **total** | 4 | 2 | 0 | 2 | 2 | 2 | 0/3 cells |");
  });
});
