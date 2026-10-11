# #82: approval and question panels

Native uses the upstream pending-interaction hook for lifecycle identity, submission, retries, durable question drafts and composer handoff. Native-only generators extract the hook and approval actions verbatim; a guarded type-only import port accommodates React 18's mutable-ref types. The Native draft facade persists the upstream recovery shape. UI components retain Native primitives.

## Geometry and flow

[Paired evidence](panels-dark-1440-13.json), certified run `2026-10-11T08-19-32-858Z-39408`: dark, 1440×900, chat font 13.

| Case     | Controls within 2px | Largest control delta | Panel height delta |
| -------- | ------------------: | --------------------: | -----------------: |
| Approval |                 4/4 |             +0.25px y |            +0.25px |
| Question |                 5/5 | ±1.4px cancel x/width |             +0.5px |

[Before measurements](panels-before.json): approval/question panel height deltas were +13.25/+33.5px; approval option pitch was 34px rather than 36px. Question navigation controls were missing and Native had an extra panel input.

Approval hides the composer toolbar. Question navigation reads “1 of 2”; custom answers use the composer, with no separate panel input. Both renderers retain the question toolbar. Choice rows keep upstream's 34px height and 2px gap, 14px/500 label and 13px/400 description. Native counter padding compensates for proportional digits within the measured tolerance.

Four workflows pass: one approval and one two-question submission initiated in each renderer. The deterministic protocol provider acknowledges the actual received payload; both selected and custom answers arrive, and answering preserves the existing turn ID. This is protocol-fixture validation, not a live-provider certification. Electron uses CDP; Native uses DevTool touch/text insertion. Physical keyboard shortcuts remain unverified here.

Decision: current upstream Activity renders an approval status glyph, without a “Pending” word (`SidebarActivityView.tsx`). Native retains that current upstream behavior. The issue's older wording does not justify inventing a Native-only label.

Reproduce against a freshly certified isolated desktop pair, one harness at a time:

```sh
node apps/lynx/scripts/decision-panel-fixture.mjs
node apps/lynx/scripts/decision-panels-desktop.mjs --exercise --assert --out /tmp/chat82-panels.json
node apps/lynx/scripts/decision-panel-fixture.mjs --cleanup
```

Cleanup stops and deletes only the four owned fixture threads through normal RPC. The seeder restores the prior provider binary setting immediately after starting the fixture turns.

## Validation

- Native: final rerun, 424 files, 1796 tests, zero failures.
- Generator guards plus existing AST extraction tests: 18/18. Shared pending-input/recovery Vitest: 12/12.
- Root format, lint and typecheck pass (8/8 typecheck tasks). Native style and upstream footprint checks pass.
- [Thread cell](thread.json): 41/45 controls within 2px, four pre-existing named trail-hit-area exemptions. The first run could not locate the canonical thread after the four added fixture threads displaced it; [retained failure](thread-initial-harness-failure.json). Deleting those owned fixture threads through RPC restored the cell. Native console capture was unavailable; no zero-error-console claim.
- [Canonical message formats](canonical-formats.json): unchanged 4/8 row heights and 11/23 paired controls within 2px; remaining row deltas +2.4, +2.1, −8.7, −5px. These remain open differences, not platform exemptions.
- [J1 excluding Stop](j1-without-stop.json) and [J2](j2.json): both renderers pass. [Initial J2 failure](j2-initial-failure.json): Native selection toolbar remained after Add to Chat; unmodified paired rerun passed. This is not three consecutive successful runs and does not establish the failure cause.
- [J7](j7.json): both renderers pass, including provider handoff and retaining a draft typed while handoff waits.

The full eight-configuration row certificate, final 24/24 and 28/28 matrices, and three consecutive paired workflow passes remain separate open acceptance work. This report does not classify existing message-format differences as platform limits.
