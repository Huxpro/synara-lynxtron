# Current-head empty Thread fidelity

## Honest state creation

- Date: 2026-08-06.
- Browser cell: light / comfortable / `1280×820`, DPR 1.
- Owned server: `127.0.0.1:60480`.
- Shared origin: `http://localhost:8925`.
- Final Lynx-for-Web bundle:
  `97d017743c0be205f61d729a434d46c1eacb1b3ce3dc99cc974f3d7a71dfa339`.
- Final Native bundle:
  `ceeda1cee0e97507075046dbbaf7bd33ca94564164c39b645769cb1a574bdcba`.

The normal snapshot contained no durable threads or project-kind workspace.
The retained state was produced in a disposable byte-clone:

1. create an excluded temporary Git repository with one commit;
2. import it through the rendered Web `Add project` dialog and
   `project.create` product path;
3. open its rendered new-thread surface;
4. promote its client draft with the already-loaded production
   `promoteThreadCreate` helper, which dispatches canonical `thread.create`
   through `readNativeApi()` and the normal WebSocket transport.

The resulting server projections contained one real project and one real
durable thread named `Fidelity route verification`. No SQLite row was inserted
directly. Web and Lynx-for-Web entered that thread through rendered sidebar
rows; Native expanded the rendered project and entered the rendered thread with
real DevTool touch events.

The entire mutated server and Native clone was deleted after capture.

## Residual and repair

The real empty durable thread exposed a structural branch fork:

- Web used `CenteredEmptyLandingStack`, placing the heading, composer, and
  project-context tray in one vertically centered group.
- Lynx used the old `ChatEmptyStateHero` in a center owner but rendered the
  composer separately at the bottom (`y=701`).

The repair reuses the existing Landing SSOT:

- empty Thread now renders `CenteredEmptyLandingStack`;
- `CenteredEmptyLanding` renders the same project-specific heading;
- the composer sits in the same stack;
- non-empty/loading/error branches retain the normal bottom composer path.

The project heading initially wrapped inside Lynx's global 321px heading width.
A named project-copy variant owns 400px, while the global Landing heading keeps
its calibrated 321px identity.

The first centered version still omitted Web's real 58px project-context tray.
Rather than adding a spacing placeholder, Lynx now renders a data-driven tray:

- project identity from the thread's project snapshot;
- Local/Worktree from `envMode`;
- branch from the durable thread snapshot;
- Temporary is an actual button with `aria-pressed` and Native selected state.

Local and branch are explicitly unavailable controls in this runtime, so they
are disabled status surfaces rather than fake interactive selectors.
Temporary has a real lifecycle: enabling it marks the mounted thread as
temporary and leaving the route dispatches canonical `thread.delete`, then
invalidates thread/sidebar queries. The retained state toggled
`false → true → false`, so the evidence thread was not deleted.

## Browser geometry

| Anchor | Web | Lynx-for-Web |
| --- | --- | --- |
| Header title | `298/14/140.015625/18`, 12/18/400 | exact |
| Project heading y/height | `407.25/34.5` | `407/35` |
| Composer | `400/461.75/736/95` | `400/462/736/95` |
| Context tray | `400/536.75/736/58` | `400/537/736/58` |
| Temporary | `1025.515625/560.75/102.484375/28` | `1026/561/102/28` |

The remaining quarter-pixel Browser differences are engine rounding. The
heading width differs because Web sizes the text intrinsically while Lynx owns
the 400px no-wrap frame; both are centered on the same x=768 axis and render
one 35px line.

Both Browser PNGs are exactly `1280×820`, and page-error files are empty.

## Native

- Launch root PID: `7673`.
- Renderer PID: `7676`.
- PID-derived client: `localhost:8903`.
- Session: 1.
- Session URL:
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`.
- Raw screenshot: `2560×1576`.
- Header title: `296/14/140/18`, computed `12/18/400`.
- Project heading: `568/391/400/35`.
- Composer and tray are visibly centered beneath the heading.
- Temporary DOM publishes full accessibility naming and toggled
  `aria-pressed=false → true → false` through real Native touch events.
- Native warning/error console: empty.

As on the PR route, this Lynx DevTool build collapses compound VIEW box models
to child bounds. The retained evidence therefore uses direct title/heading
geometry, raw DOM, temporary-state DOM, screenshot, and console; it does not
mislabel the collapsed tray/button box-model values as outer boxes.

## Cleanup caveat

Normal product data remained logically unchanged:

- two orchestration events;
- two normal projects;
- zero normal durable threads;
- all projectors remain at sequence 2;
- settings, Native KV, and window-state hashes remain unchanged.

The normal SQLite main-file hash is not byte-exact. During the completion audit,
running the external `sqlite3` CLI against the live WAL database checkpointed
unchanged WAL pages into the main file. The main-file hash progressed from the
previous recorded value to `25c6a307…` even though all projection/event counts
and sequences remained identical. No pre-checkpoint byte backup survived, so
this report does not claim byte restoration or silently rewrite the database.

## Gates

- Focused Thread/Header/branch-state suites: 3 files, 9/9.
- Lynx-for-Web production build: pass.
- Native/Desktop production build: pass with existing unsupported CSS and
  optional `ws` native-module warnings.
- Owned processes, named Browser sessions, and disposable clones removed.
- `bun fmt`, `bun lint`, and `bun typecheck` were not run because the current
  conversation does not authorize those heavyweight checks.
