# High-fidelity verification playbook

This document records the verification method used while converging the Synara
Web, Lynx-for-Web, and Lynxtron Native clients. It is a working protocol, not a
claim that every route is currently certified.

## Verification objective

High fidelity means that the same product state has comparable:

- content and behavior;
- layout, typography, material, and iconography;
- interaction states and transitions;
- platform semantics where the platform is expected to differ;
- runtime reliability, including clean consoles and stable process ownership.

A screenshot alone is not sufficient evidence. Every retained result needs a
known process, data source, route, theme, viewport, output size, and runtime
status.

## Two-tier loop

### Browser lifecycle gate

Apply this gate to every discovery, fast, or Native verification loop before
doing product work, including loops that do not intend to open a browser:

1. Run `bun run browser:gate` at loop entry. It must print both the ownership
   cleanup success and `sessions: []`.
2. Any workflow that can open `agent-browser` must run as
   `bun run browser:run -- <command> [args...]`; keep the complete
   open/interact/capture/close sequence inside that wrapper.
3. Reuse named sessions inside the wrapped workflow. Do not launch a fresh
   browser for each measurement.
4. At loop exit, run `bun run browser:gate` again. The gate must report zero
   agent-browser-owned daemon/browser processes and `sessions: []`.
5. Treat a timeout, interruption, failed script, failed probe, malformed
   helper, or tool failure as an immediate cleanup boundary. Rerun
   `bun run browser:gate` before the next browser command.
6. Treat any nonzero remainder as a harness failure that blocks retained
   evidence, commit, push, and the next loop.

Never terminate unrelated Chrome or remote-debugging processes. Ownership is
defined by the agent-browser daemon/profile markers in the repository cleanup
script, not by the presence of a debugging port.

### Fast Lynx-for-Web loop

Use this by default for layout, composition, ordinary pointer and keyboard
interaction, route/query state, transcript behavior, and rendered Markdown.

1. Start one isolated Synara server after a dry run.
2. Unset inherited `SYNARA_AUTH_TOKEN` unless both browser clients use it.
3. Point Web and Lynx-for-Web at the same server and snapshot.
4. Open separate named browser sessions with explicit viewport and DPR.
5. Create state through canonical RPCs and product controls, never direct
   SQLite writes.
6. Measure geometry, typography, scroll state, accessible names, and console
   output before changing code.
7. Capture paired frames only after route, theme, viewport, state, and runtime
   dimensions match.
8. Run focused tests and proportionate production builds at the coherent slice
   boundary.

Web is the composition authority, not an infallible behavior oracle. Preserve
the intended product contract when Web itself leaks or retains stale state, and
record the intentional difference.

### Native batch and certification loop

Use Native for textarea/IME/focus behavior, Native list and wheel behavior,
host integration, system menus, accessibility, clipboard/dialog semantics,
window lifecycle, persistence, restart, and packaged bundle loading.

1. Build the complete app so `dist/desktop` contains the current Lynx bundle.
2. Record the staged bundle path and hash.
3. Start one exact-owned isolated Native instance with
   `NODE_ENV=production` and `SYNARA_ENABLE_DEVTOOL=1`.
4. Resolve the DevTool client from that process PID; never select a remembered
   port or list position.
5. Keep the verified instance alive across routes, themes, scroll positions,
   and interaction states.
6. Restart only for a new staged bundle, a cold-start/persistence cell, a
   window-size change, or a crashed process.
7. Capture exact LynxView pixels with DevTool and record warnings/errors with
   every retained frame.
8. Restore any owned persisted state byte-for-byte after the process exits.

On macOS, a `1280x820` outer window has `1280x788` logical content because of
the title bar, and a DPR 2 capture is `2560x1576`. Reject unexpected dimensions.

## Preflight gate

Do not retain product evidence until all of these are true:

- the production build is current;
- server, Web, and Native ports are free or owned by this run;
- PIDs, state directory, bundle path, and hashes are recorded;
- both clients use the same snapshot and route;
- browser viewport, visual viewport, DPR, and PNG dimensions agree;
- Native process, workspace executable, root theme class, and PID-derived
  DevTool client agree;
- persisted state files that the run can change are backed up.

If any item fails, fix the harness first. A stale bundle, wrong DevTool client,
wrong snapshot, unexpected image size, development asset request, or runtime
error invalidates the cell.

## State creation and evidence

- Exercise real rendered controls for sends, route changes, menu selection,
  copy/wrap actions, and other claimed interactions.
- Programmatic setup is acceptable only for precise fixture positioning, and
  the retained action still needs the product path.
- Read SQLite only to verify projections or persistence; do not manufacture
  certification state in SQLite.
- Retain paired screenshots, geometry, computed styles, accessible semantics,
  console output, connection preflight, and capture identity together.
- Keep negative evidence. A failed interaction or missing platform capability
  must remain marked as unverified instead of being inferred from source code.

## Measurement before patching

Measure first so a change has a falsifiable target:

- bounding boxes and anchor deltas;
- resolved font size, line height, color, border, radius, and shadow;
- `scrollTop`, `scrollHeight`, and `clientHeight`;
- action order, expanded/selected state, and accessible names;
- console errors and warnings;
- exact PNG dimensions and Native content bounds.

Screenshots establish visual structure. Numeric probes distinguish a product
defect from scale, crop, stale state, or harness drift.

## Matrix execution

Order work by restart cost:

1. build once and prepare one shared snapshot;
2. capture all Native routes and themes at `1280x820`;
3. restart Native once at `1440x900` and capture the remaining cells;
4. reuse one named Web session and change only its viewport.

The fast loop can iterate on a narrow slice. Full route, theme, and size
coverage belongs to a Native certification batch, not every local edit.

## Failure classification

Classify as a harness failure:

- stale or development assets;
- the wrong process or DevTool client;
- mismatched snapshots, routes, themes, or sizes;
- unexpected PNG dimensions;
- persisted state changed by another writer;
- runtime errors during capture.

Classify visual, behavioral, and interaction differences as product failures
only after preflight passes.

## Flicker and transient-state diagnostics

Single screenshots cannot prove stability. For reported flashing:

1. capture a timed frame sequence for an idle baseline;
2. isolate hover, resize, window drag, focus, and product interaction into
   separate sequences;
3. compare frame dimensions, mean luminance, white fraction, and normalized
   frame deltas;
4. correlate large deltas with window bounds, route/theme/layout state, and
   console output;
5. inspect all independent event sources that can publish the same state;
6. retain the sequence and summary even if no blank frame appears.

The August 10 diagnostic showed stable pure-hover sequences but large window
drag deltas. That distinction prevents blanket hover styling from being blamed
for a window/layout event problem.

## Slice completion and cleanup

A coherent slice is complete only when:

- the root cause is fixed;
- focused behavior tests cover the changed contract;
- paired evidence or the relevant Native boundary is retained;
- production outputs are rebuilt in proportion to the change;
- runtime consoles are clean for retained cells;
- named browser sessions and owned processes are closed;
- owned ports are free and persisted state is restored;
- the slice is committed and pushed independently.

Do not run broad certification repeatedly during iteration. Do not substitute a
green manifest, build, or source-only assertion for the runtime behavior the
slice claims.

## Evidence archive

The interactive atlas is:

`shots/2026-08-04/p10-perceptual-fidelity/comparison.html`

Its screenshot archive tab indexes every image under `shots/2026-08-02` through
`shots/2026-08-11`, including diagnostic frame sequences. Regenerate the index
after adding or removing images:

```sh
node apps/lynx/scripts/generate-screenshot-archive.mjs
```

The generated archive records whether each image is tracked or only present in
the local working tree. That status is part of the evidence boundary.

Screenshot bytes are now hosted in the public
`Huxpro/synara-fidelity-assets` repository. The comparison artifact resolves
every review, canonical matrix, and loss-ledger image through GitHub Raw.
`screenshot-assets.json` is the local metadata source of truth. Exact duplicate
flicker frames were removed by SHA-256 within each sequence; the
removed-to-retained mapping is preserved in
`shots/2026-08-10/native-interaction-flicker-diagnostic/dedupe-map.json`.
