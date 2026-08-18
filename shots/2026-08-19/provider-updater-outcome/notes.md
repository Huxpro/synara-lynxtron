# Provider Updater Outcome Fidelity

## Loss

The Lynx prompt previously treated every fulfilled `server.updateProvider`
request as success. A fulfilled response could still report:

- `updateState.status: "failed"`;
- `updateState.status: "unchanged"`;
- `versionAdvisory.status: "behind_latest"`;
- no refreshed status for the requested provider.

In those cases Lynx dismissed the update prompt while Web original retained an
error outcome. This was a functional outcome loss, not a visual difference.

## Shared Contract

Web original and Lynx now use the same `runProviderUpdateBatch` and
`providerUpdateOutcomeCopy` contract from
`apps/web/src/providerUpdates.ts`.

The shared contract:

- runs providers sequentially with the existing update timeout;
- inspects fulfilled server results instead of equating fulfillment with
  success;
- distinguishes all-success, partial failure, and full failure;
- preserves exact per-provider failure reasons;
- reports missing refreshed provider state as failure;
- deduplicates manual update commands;
- provides identical success and failure copy to both renderers.

Web retains its original toast presentation. Lynx now retains failure feedback,
supports retry, exposes a native clipboard action for manual commands, and
shows the same six-second success outcome instead of disappearing immediately.
Detailed failure copy uses an expanded prompt layout rather than the original
fixed two-line body.

## Controlled Outcome Matrix

No real provider update was executed. The test harness passed controlled server
results into the shared contract and covered:

- all providers succeeded and became current;
- fulfilled response with failed update state;
- fulfilled response with unchanged update state;
- fulfilled response that remained behind latest;
- fulfilled response missing the requested provider status;
- rejected request;
- partial failure with successful providers preserved;
- full failure with exact reasons and copyable manual commands.

This verifies the user-visible outcome contract without changing the installed
Codex, Claude, or other provider CLIs.

## Verification

- shared updater tests: `17/17`;
- Lynx updater composition tests: `5/5`;
- Web production build: passed;
- Lynx-for-Web production build: passed;
- Native/Desktop production build: passed;
- staged Native bundle SHA-256:
  `e4f56374005f3dcc17206a409b338fca61a6cb6988609eae686ee5672b4d2dd7`;
- Lynx-for-Web bundle SHA-256:
  `db4c7459c064b2243de5a3a6ef2f8121aa2891745f35c98f1ced32baece4d135`;
- exact-owned Native PID: `33634`;
- PID-derived DevTool client: `localhost:8902`, session `1`;
- loaded bundle:
  `apps/lynx/dist/desktop/main.lynx.bundle`;
- exact Native warning/error console: empty;
- local repository screenshot count remained `100`.

## Harness

One initial focused test command was passed through the root Turbo script with
file paths, so Turbo interpreted the paths as task names. The corrected
workspace Vitest and Rstest commands passed. A first Lynx-for-Web build also
rejected a clipboard import from a main-thread handler; the action was moved
behind a `background only` boundary and the next build passed. Neither harness
issue is counted as product loss.
