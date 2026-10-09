# Web and Lynx verification harness

Electron is the design and behavior authority. Lynxtron (Native) is verified against it on the same backend and data. Prove the harness before judging the product: a harness failure is never a product regression.

## The path

1. **Iterate in Lynx-for-Web** for layout, composition, ordinary pointer and keyboard interaction, and rendered content. Run Web original and Lynx-for-Web against one isolated server (see "Local instance isolation" in the root `AGENTS.md`) in named `agent-browser` sessions, always through `bun run browser:run -- <command>`. The wrapper owns browser cleanup; run `bun run browser:gate` yourself only after a timeout or interruption.
2. **Launch the Native session** with `bun run compare:desktop [--width 1280 --height 820] [--theme dark|light] [--route /path] [--skip-build] [--regular-app]`. It builds, clones the canonical fixture into an isolated home, starts one backend with Electron and Lynxtron as background apps, certifies that both show the same thread, writes a run manifest under `.synara-desktop-comparison/runs/`, and cleans up on exit. Do not redo its checks by hand. If it does not print `Run manifest`, fix that first.
3. **Measure** with `node scripts/comparison-cells.mjs`: paired control geometry (≤2 px) on the six main surfaces plus the declared state increments, with page errors from both renderers. A full matrix is four launches (two themes × 1280×820 and 1440×900); only the first builds, the rest use `--skip-build`.
4. **Exercise the workflows** with `node scripts/comparison-workflow-run.mjs <J1…J6> --renderer electron|native|both`. They drive real controls and check every step against the backend. Run them after the cells: they leave state behind, and a cell measured on top of it is a harness failure.
5. **Explore and accept** what the scripts do not cover, using the input path your environment has (next section).
6. **Stop the launcher** (Ctrl-C or SIGINT) and confirm it printed `Cleanup verified`.

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
