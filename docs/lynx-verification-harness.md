# Web and Lynx verification harness

Prove the harness before using it to judge the product. A screenshot does not prove a matrix cell unless its process, data source, viewport, theme, route, and output dimensions are recorded.

### Two-tier verification model

Use the harness in two distinct modes. Do not pay final-certification costs on every UI edit, and do not treat the fast loop as Native certification.

1. **Fast Lynx-for-Web loop** — the default for layout, composition, ordinary pointer/keyboard interaction, query state, transcript behavior, and rendered Markdown. Run Web original and Lynx-for-Web against one isolated server and one real snapshot. Iterate in named browser sessions, collect paired screenshots plus numeric geometry, and run focused tests. A complete production build is required at the validated slice boundary, not after every edit.
2. **Native batch / certification loop** — required for platform semantics and release evidence. Batch several Web-proven slices into one exact-owned Lynxtron run, then verify Native input, focus, accessibility, host integration, persistence, restart, and DevTool console. The full route × theme × size matrix and packaged-app checks belong here.

Every discovery, fast, and Native loop must use this browser-ownership checklist, including loops that do not expect to open a browser:

1. At loop entry, run `bun run browser:cleanup`, then independently run `bun run browser:run -- agent-browser session list --json`.
2. After every timeout, interruption, failed script, failed probe, or failed browser command, stop the loop and repeat both checks before any retry or other work.
3. At loop exit, repeat both checks before retaining evidence, committing, pushing, or beginning the next loop.

Both checks must report `sessions: []` and zero agent-browser-owned daemon/browser processes. Any remainder is a harness leak: stop, record it as harness failure, and do not continue until an independent retry of both checks passes. Never infer cleanup from `agent-browser close` output alone, reuse a leaked session, or terminate unrelated Chrome, Playwright, remote-debugging, Lynxtron, Lynx Explorer, or other application processes.

The fast loop has been validated end to end: Composer, transcript follow/switching, Markdown code actions, and structured mention/skill rendering developed through Lynx-for-Web all passed a later real Lynxtron batch, including canonical send, provider response, restart persistence, scroll, wrap, copy, and a clean exact-client console. Keep the evidence under `shots/2026-08-02/harness/` and `shots/2026-08-02/native-regression/` as the reference run.

### Fast Lynx-for-Web loop

- Keep the Web relay a compile-time Web-only capability. The Web bundle may contain `synaraRpc`, browser storage, and the `0.5.5-lynx-web` build id; the Desktop/Lynx bundle must compile with relay disabled and must not contain those Web-only markers. Never hardcode a certification port into product code.
- Start one isolated Synara server with an empty inherited auth token and a temporary home. Point Web original and Lynx-for-Web at that server; use the same snapshot, route, theme, viewport, DPR, and product state.
- Use separate named `agent-browser` sessions. A useful default cell is `1280×820`, DPR 1, light. Verify runtime dimensions before capture and PNG dimensions after capture.
- Run every shell workflow that opens `agent-browser` through `bun run browser:run -- <command> [args...]`. For a multi-command flow, pass one script or `bash -c` invocation to that wrapper. It performs a cleanup preflight, installs normal and signal exit traps, and requires a final zero-session/zero-owned-process cleanup before returning. Do not call `agent-browser` from an unguarded shell. A successful `agent-browser close` or `close --all` message is not sufficient: the cleanup gate polls until `session list --json` is empty and no agent-browser daemon or agent-browser-owned remote-debugging process remains. Never fail or terminate an unrelated browser merely because it uses `--remote-debugging-port`.
- Create required states through canonical product RPC/mutations. Never write fixtures directly into SQLite. Read SQLite only to verify projections such as structured skills, mentions, messages, or persistence.
- Use Web original as the design and composition authority, not an infallible behavior oracle. If Web leaks state or violates the intended contract, preserve the correct product behavior in Lynx and record the intentional delta instead of copying the bug.
- Measure before patching. Record relevant bounding boxes, font sizes, scrollTop/scrollHeight/clientHeight, accessible names, action order, and console output. Screenshots establish visual structure; numeric probes make iteration fast and falsifiable.
- Exercise real rendered controls for retained evidence. Programmatic state changes are acceptable for setting up a precise scroll or fixture condition, but route changes, menu selections, sends, copy/wrap actions, and other claimed interactions must use the product path.
- Keep fresh-console checks separate from long-lived development sessions, whose logs may contain expected reconnect noise from server-origin switches. A retained cell fails on page errors; known upstream initialization warnings must be named.
- At each coherent slice boundary: save paired evidence and residuals, run focused tests, run Web/Lynx/Desktop production builds in proportion to the change, run relevant audits, then commit the slice independently.

### What the fast loop cannot certify

Always escalate these to the Native batch:

- Native textarea behavior, IME, selection, paste, undo/redo, keyboard routing, and focus.
- macOS Accessibility, system menus, secondary click/long press, clipboard/dialog semantics, deep links, application lock, window lifecycle, and background presentation.
- Native `<list>` event shape, real wheel/gesture behavior, DevTool element/console identity, cold start, disk persistence, and packaged bundle loading.
- CSS or element behavior whose Lynx-for-Web custom-element implementation can differ from the native Lynx engine.

Use one exact-owned isolated app instance for the batch. Prefer Computer Use plus background `showInactive()` operation, do not `Raise` the app, keep the verified instance alive across states, and restart only for an explicit cold-start/persistence cell or a newly staged bundle. A Web pass plus a focused test is not permission to skip this Native boundary.

### Certification preflight gate

Do not retain matrix evidence until every preflight check passes:

- Run the complete production build. Record the staged bundle path and hash.
- Dry-run the isolated server. Record the state directory, ports, and owned PIDs.
- Prepare one complete snapshot for both clients. Create missing project or thread data through the real product API.
- Start one named browser session. Verify its viewport, visual viewport, device pixel ratio, and PNG dimensions.
- Verify the Native process, workspace executable, staged bundle, root theme class, and PID-derived DevTool client.
- Save the original bytes and hashes for every persisted state file that the run will change.

If preflight fails, fix the harness before collecting product evidence. Do not accumulate diagnostic screenshots in the certification matrix.

### Separate harness failures from product failures

Invalidate the evidence when the harness has any of these failures:

- The exported image dimensions differ from the requested viewport.
- DevTool connects to the wrong client or a remembered port.
- Lynxtron loads a stale bundle or requests a development asset server.
- Web and Native use different snapshots, routes, themes, or product states.
- A persisted state file changes outside the owned run.
- Runtime errors appear during capture.

Classify rendering, content, layout, token, and interaction differences as product failures only after preflight passes. Never report a harness failure as a product regression.

### Shared data and process ownership

- Connect Web and Lynx to the same isolated Synara server, snapshot, route, and product state. Record the server PID, Web PID, Lynxtron PID, ports, and state directory before capture.
- Check every port with `lsof` before launch. Stop only PIDs created for the current verification run.
- Do not hardcode renderer data. If an isolated snapshot lacks a required project or thread, create temporary records through the real workspace RPC or product API. Use the resulting server snapshot on both clients. Back up the snapshot first and remove or restore the temporary clone after capture.
- Treat a missing data state as incomplete only when the harness cannot create it through the real product path. Never use historical screenshots or an empty state to certify a populated screen.

### Web capture

- Use a named, isolated `agent-browser` session. Do not attach to the user's Chrome profile or rely on a shared preview screenshot exporter.
- Set the viewport and scale explicitly for each cell, such as `agent-browser --session p8q2-web-evidence set viewport 1280 820 1`.
- Before capture, read `innerWidth`, `innerHeight`, `visualViewport.width`, `visualViewport.height`, and `devicePixelRatio` from that same session. After capture, inspect the PNG pixel dimensions. Reject the image if either check differs from the requested matrix cell.
- Reuse the same named session for navigation and capture. Close it explicitly inside the `browser:run` workflow; do not consider the browser cell complete unless the wrapper's final cleanup gate passes. Do not close unrelated user browser sessions.

### Native production capture

- Prefer Computer Use when it is available. Inspect and operate the already-running owned Synara app through Computer Use instead of restarting or activating it from the shell.
- Verify the existing process and bundle identity before reuse. Computer Use cannot supply the `dist/desktop` argument required to launch the workspace build, so do not let an implicit background launch select an installed or stale app with the same display name.
- Keep one verified production instance alive across route, theme, scroll, and interaction cells. Use Computer Use for those state changes, and use DevTool for exact LynxView screenshots, component inspection, and console capture.
- Do not call `open -a`, AppleScript activation, menu commands that call `show()` or `focus()`, or deep links only to drive the harness. These paths can raise the app over the user's windows.
- Restart only when a matrix cell explicitly tests cold start, a new bundle must be staged, persisted window bounds must change, or the owned process has exited. Batch all work that needs the same size and bundle into one launch.
- If the owned app exits twice with the same error, stop the restart loop and diagnose the runtime. Do not keep reopening a window over the user's desktop.
- Run the complete app build before production capture. `rspeedy build` updates `output/bundle` but does not stage the Lynx bundle in `dist/desktop`; `bun run build` stages both Lynx and desktop assets.
- Launch with `NODE_ENV=production` and `SYNARA_ENABLE_DEVTOOL=1`. Verify that the process belongs to `apps/lynx`, loads `apps/lynx/dist/desktop/main.lynx.bundle`, and renders the expected `SliceRoot--theme-*` class before collecting evidence.
- Treat any production request to `127.0.0.1:3000`, `localhost:5971`, or another dev asset server as a harness failure. Do not start an arbitrary server to mask it. Stop the owned process, check `NODE_ENV`, process arguments, staged bundle contents, and the active Lynxtron executable, then rebuild.
- Resolve the DevTool client from the owned Lynxtron PID with `lsof`. Never select a client by a remembered port or by list order. Other Lynxtron and Fiddle clients may reuse adjacent ports.
- Use a capture helper only when its executable identity gate points to `apps/lynx`. A helper that still references the retired `synara-lynx/slice` staging tree is invalid after the workspace migration.

### Native window size and persisted state

- Close the owned Lynxtron process before changing its persisted `window-state.json`. Save the original bytes and hash, then record the exact temporary bytes and hash written for the target size.
- Restart the owned app after each size change. Verify the outer bounds with CoreGraphics and the content frame with DevTool. A `1280×820` macOS window maps to `1280×788` logical content, or `2560×1576` physical pixels at device pixel ratio 2, because the native title bar consumes 32 logical pixels.
- Do not request Accessibility permission only to resize a window. Persisted state plus restart and CoreGraphics provide an auditable path without controlling the user's desktop.
- Restore the original file only after the owned app exits and the current file still matches the temporary bytes written by this run. If the file changed unexpectedly, do not overwrite it. Preserve the backup and report both hashes and the possible competing writer.

### Execute the matrix by restart cost

Put the most expensive state change in the outer loop:

1. Build once and prepare one shared snapshot.
2. Start Native at `1280×820`. Capture all routes in light and dark mode.
3. Restart Native at `1440×900`. Capture all routes in light and dark mode.
4. Reuse one named Web session. Change its viewport without restarting the browser.

Use Computer Use to change routes, themes, scroll positions, and interaction states. Do not restart Native for those changes. A full two-size matrix should need two normal Native launches unless it includes an explicit cold-start cell or the app crashes.

### Evidence and cleanup gate

- Capture DevTool errors and warnings with every retained Native frame. A successful screenshot with runtime errors is not passing evidence.
- Record the Web geometry, PNG dimensions, Native outer/content dimensions, bundle path, client port, server snapshot identity, theme, route, and cleanup result in the cell's `notes.md`.
- Close the named browser session and stop owned Web, server, Lynxtron, and DevTool processes. Confirm owned ports are free and byte-exact state restoration succeeded before declaring the harness clean.
