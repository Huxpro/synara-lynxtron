# Web and Lynx verification harness

Electron is the design and behavior authority. Lynxtron (Native) is verified against it on the same backend and data. Prove the harness before judging the product: a harness failure is never a product regression.

## The path

1. **Iterate in Lynx-for-Web** for layout, composition, ordinary pointer and keyboard interaction, and rendered content. Run Web original and Lynx-for-Web against one isolated server (see "Local instance isolation" in the root `AGENTS.md`) in named `agent-browser` sessions, always through `bun run browser:run -- <command>`. The wrapper owns browser cleanup; run `bun run browser:gate` yourself only after a timeout or interruption. The Web dev server serves the Lynx-for-Web build at `/lynx/` with the same server URL as the Web original: `bun run --cwd apps/lynx build:web`, then `SYNARA_PORT_OFFSET=<n> SYNARA_HOME=<isolated home> node scripts/dev-runner.ts dev:server` and the same variables with `dev:web` (check each with `--dry-run` first), and open `http://localhost:<web port>/` and `http://localhost:<web port>/lynx/`. Lynx content sits in the `<lynx-view>` shadow tree, so drive it by coordinates read from that tree; `find text` does not see it. For transcript content there is a fixture with every row type and a measuring script: [message-formats-checklist.md](message-formats-checklist.md).
2. **Launch the Native session** with `bun run compare:desktop [--width 1280 --height 820] [--theme dark|light] [--route /path] [--skip-build] [--regular-app] [--message-formats]`. It builds, clones the canonical fixture into an isolated home, starts one backend with Electron and Lynxtron as background apps, certifies that both show the same thread, writes a run manifest under `.synara-desktop-comparison/runs/`, and cleans up on exit. Do not redo its checks by hand. If it does not print `Run manifest`, fix that first. `--message-formats` adds the transcript fixture threads to the isolated clone for the row-by-row audit in [message-formats-checklist.md](message-formats-checklist.md); measure cells and workflows on a launch without it.
3. **Measure** with `node scripts/comparison-cells.mjs`: paired control geometry (≤2 px) on the six main surfaces plus the declared state increments, with page errors from both renderers. A full matrix is four launches (two themes × 1280×820 and 1440×900); only the first builds, the rest use `--skip-build`.
   Colour is a separate, milestone-only pass: `node scripts/comparison-colours.mjs --out <dir>` pairs text, fills, borders and icons by text and label, compares them at 4/255 per channel, checks the root theme variables and the generated colour-mix tokens against what Electron resolves, and saves one screenshot per surface and renderer. Run it per theme on a fresh launch, then `--summarise <dir>`. The last archive is [colour-regression-2026-10-10](../plan/reports/colour-regression-2026-10-10/README.md).
4. **Exercise the workflows** with `node scripts/comparison-workflow-run.mjs <J1…J6> --renderer electron|native|both`. They drive real controls and check every step against the backend. Run them after the cells: they leave state behind, and a cell measured on top of it is a harness failure.
5. **Explore and accept** what the scripts do not cover, using the input path your environment has (next section).
6. **Stop the launcher** (Ctrl-C or SIGINT) and confirm it printed `Cleanup verified`.

## The browser pair: Web original ↔ Lynx for Web

`node scripts/comparison-web.mjs` measures step 1's pair with step 3's cells, and needs no desktop app. It is the same measurement, not a second one: the cell definitions, navigation table, control collection, pairing by label, 2 px tolerance and named exemptions are imported from `comparison-cells.mjs` and `comparison-navigation.mjs`; `openNativeDriver` drives Lynx for Web through `comparison-web-connector.mjs`, which answers the DevTool connector's methods from the `<lynx-view>` shadow tree over Chrome's DevTools protocol.

```
node scripts/comparison-web.mjs --matrix [--skip-build] [--out report.json] [--markdown table.md]
node scripts/comparison-web.mjs --theme light --width 1440 --height 900 --surfaces thread,settings --increments ""
```

One launch is one configuration. It clones the canonical fixture into a new home under `.synara-desktop-comparison/web/<run id>/`, starts `dev:server` and `dev:web` on ports of their own (`--port-offset`, default 731; it refuses a port that is in use), opens each page in a headless Chromium it owns, seeds both with the renderer state the desktop launcher gives Electron and Lynxtron, certifies that both show the fixture thread on the fixture's data at the requested size and theme, measures, and stops what it started. It prints `Cleanup verified` per launch; a launch that cannot be certified is a harness failure and exits 1, while differences are the measurement and exit 0.

- **Fixture.** `--fixture-root <checkout>` (or `SYNARA_COMPARE_FIXTURE_ROOT`) points at the checkout that holds `.synara-desktop-comparison/fixture/`; a git worktree does not have it. Building it (`node scripts/comparison-fixture.mjs`) runs real provider turns and needs a provider login.
- **Browser.** `SYNARA_COMPARE_CHROME`, then Playwright's Chromium (`bun run --cwd apps/web test:browser:install`), then any headless shell in the Playwright cache, then the system Chrome.
- **Reading the table.** Per cell: compared, within 2 px, named exemptions, outside, missing on Lynx (a Web control with no Lynx counterpart, which fails the cell) and Lynx-only (reported, not failing, as on the desktop path). The JSON report carries each outside control's deltas and the Lynx page's and worker's errors.
- **What it does not prove.** It compares two Chromium pages, so it says nothing about the Native text engine, AppKit input, or anything in the physical-input list below. A browser-pair pass is not a Native pass.

Differences that exist only because the page is a browser tab are closed in the web host, never in shared Lynx code: `src/main/web/webHostStyleOverrides.logic.ts` (window chrome, and the Native text-metric corrections the shared stylesheets carry), `webKeyEvents.logic.ts` (element key handlers and their browser defaults), and `webVoiceRecorder.ts` (the voice capability). Known host limits that stay open are listed in `lynxtron-runtime-compatibility.md` and in the tracking issue.

## Developing without the desktop apps (Linux, cloud)

The browser pair is the loop for a machine with no Mac. What it needed on a fresh checkout, as exercised on macOS in a clean git worktree with no desktop app running; **not yet run on Linux**, so treat the Linux notes as a checklist to confirm, not as results:

- **Toolchain.** The pinned bun and node from `.mise.toml` / `package.json`. Install only with the pinned bun and `bun install --frozen-lockfile`; a different bun must never rewrite `bun.lock`. Where the pinned bun is not the system one, `npm i bun@<pinned>` in a scratch directory gives a usable binary. Running scripts (`bun run …`) with another bun is harmless.
- **Native dependencies.** The install runs the `@lynx-js/lynxtron`, `node-pty` and `electron-winstaller` install scripts. The browser pair uses `node-pty` (the server) and none of Lynxtron's runtime. On Linux expect `node-pty` to need a compiler toolchain, and see PR #6 for what the Lynxtron build needs there (`bun run build` verifies macOS-only resources).
- **Fixture.** As above: copy `.synara-desktop-comparison/fixture/` from a machine that has it, or build it with a provider login. The manifest records the workspace's absolute path, so the fixture workspace must exist at that path on the machine that uses it.
- **Browser.** Any Chromium with `--remote-debugging-port`. On Linux, `playwright install --with-deps chromium` also installs the system libraries a headless Chromium needs.
- **Isolation.** `dev-runner` opens a browser tab and creates a project from the working directory unless `SYNARA_NO_BROWSER=1` and `SYNARA_AUTO_BOOTSTRAP_PROJECT_FROM_CWD=0` are set; the launcher sets both and drops an inherited `SYNARA_AUTH_TOKEN`. Stopping `dev-runner` with a signal leaves its server and Vite children running, so stop the process group (the launcher does) and check both ports.
- **Does not work there.** `bun run compare:desktop`, the Native matrix, workflows J1–J6 on Native, Computer Use, and everything in the physical-input list. Shared Lynx changes made from such a machine must be listed for a Native run before they merge.

## How much to run

The full loop above is an acceptance pass. During a multi-step refactor, scale it:

- **Every step:** `bun typecheck`, `bun lint`, `bun fmt --check`, the Lynx build, and `bun run compare:desktop --exit-after-certify` (both renderers start, show the same thread, no runtime errors).
- **When a screen changes:** that screen's cells and the workflow that covers it.
- **Before a milestone merges:** the full matrix and the workflows.

Screenshots, pixel diffs and frame comparisons are milestone-only. Between milestones, judge from the scripts' text output (cell and step results, console error counts, backend state) and do not capture or read images to confirm what a script already reported.

Inside a milestone, cells and workflows are a trend, not a gate. A workflow that depends on a live model turn and fails once is rerun; diagnose only when the same failure repeats in the milestone pass.

## Input: with and without Computer Use

Both environments run steps 1–4 and 6 unchanged. They differ only in step 5.

- **With Computer Use** (Claude Desktop, TraeX, interactive Codex): operate `Synara Comparison Lynxtron` in the background, identified by the PID in the run manifest. Never activate or raise it. Lynx content is not exposed to macOS accessibility, so work from screenshots and coordinates. This is the only automated path that exercises the AppKit input pipeline, so use it for the physical-input list below. Computer Use resolves targets from the running-application list, and the comparison app is an agent that is not on it, so launch with `--regular-app` for this pass (both apps then get a Dock icon and may take focus once at launch; close Electron's detached DevTools window first, it holds the text cursor). If the harness asks the user to approve the app and control is refused, stop and say so; do not work around the approval.
- **Without Computer Use** (CLI, CI, a refused approval): drive the app through the Lynx DevTool, as the workflow driver does (`openNativeDriver` in `scripts/comparison-workflow.mjs`: tap, drag-scroll, text insertion, reload), and inspect with `take-screenshot` and `get-console`. This proves product logic and layout. It does not prove physical input, so report those items as pending and never as passed.

Physical-input list, certifiable only with Computer Use or by a person: IME and candidate window, selection, paste, undo and redo, keyboard routing and focus handoff (Composer ↔ Terminal), system menus, secondary click, dialogs and permission prompts, VoiceOver, real wheel and gesture scrolling.

## Rules that hold everywhere

- Stop only processes you started. Never terminate unrelated Chrome, Lynxtron, Lynx Explorer, or other apps; other projects run Lynxtron on adjacent DevTool ports.
- Never bring an app forward to drive it: no `open -a`, AppleScript activation, `show()`/`focus()` menu commands, or deep links used only as a harness shortcut.
- Take the Lynx DevTool port from the run manifest or from the owned PID with `lsof`, never from memory or list order.
- Create product state through the product (UI or RPC). Never write fixtures into SQLite; read it only to verify.
- The DevTool gives the console backlog to the first `get-console` of an app session and nothing afterwards. Read it once, after the interactions; an empty later read means unknown, not clean.
- Evidence counts only from a certified run on the current bundle, with zero runtime errors, and with the route, theme, size, and data identity recorded. Unrun cells are unknown, not passed.
- Two identical harness failures in a row mean diagnose, not retry.
- Fix a small product defect at its source and rerun the workflow or cell that found it. File an issue for anything larger, with the run id and the failing step.

## Outside the launcher

A packaged app or a Web-only loop has no launcher to certify it, so establish the same facts yourself and record them: the production build and bundle hash, the isolated server's state directory and PIDs, one shared snapshot for both clients, the requested viewport and resulting image size, and the owned process and DevTool client. For a standalone Native run, `bun run build` in `apps/lynx` (plain `rspeedy build` does not stage `dist/desktop`), then launch with `NODE_ENV=production SYNARA_ENABLE_DEVTOOL=1`. A request to a dev asset server (`127.0.0.1:3000`, `localhost:5971`) from a production run is a harness failure.
