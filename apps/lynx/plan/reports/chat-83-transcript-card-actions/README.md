# #83: transcript card actions

Native restores plan export/copy/download, changed-file actions, and failed-turn recovery using guarded extraction of current upstream callbacks. All implementation and fixture tooling lives in `apps/lynx`.

## Measurements and operations

Certified run `2026-10-11T09-13-20-517Z-71638`: dark, 1440×900, chat font 13. Controls are measured relative to their card, with primary buttons matched explicitly; absolute panel boxes are retained. These measurements certify this configuration only.

| Card          | Controls within 2px | Largest delta | Card height delta |
| ------------- | ------------------: | ------------: | ----------------: |
| Plan          |                 3/3 |           0px |          −0.375px |
| Failed turn   |                 3/3 |        0.25px |           +0.25px |
| Changed files |                 9/9 |        0.75px |               0px |

[Plan/recovery evidence](cards4.json) includes successful copy/download and failed-turn continuation from both renderers. Continuation reaches the deterministic protocol provider with the exact upstream continuation prompt, current model/effort, and preserves an ordinary composer draft. Change model opens the existing picker. This is protocol validation, not live-provider success.

[Fresh Git checkpoint evidence](files4e.json) passes path-copy menus, collapse/expand, and per-file review on each renderer. Both diff panes contain the newly changed `cardAudit` text. The fixture creates a marker-guarded isolated Git repository and uses normal project/thread/provider RPC; cleanup stops/deletes its owned resources. No database writes.

Current upstream uses three plan buttons rather than an action menu, and opens a review dock rather than expanding an inline diff. Native follows the current source. The existing Explorer editor controls were extracted into `EditorOpenControls.lynx.tsx` and reused for file cards. Existing menu, icon-button, Collapsible/disclosure motion, clipboard, toast, and composer send ownership primitives are reused. No comparable card action controller existed; the new controller joins canonical store data to generated upstream actions.

OS save-file and confirmation dialogs and external-editor launch are not physically exercised under the no-foreground constraint. Native port tests cover export cancellation, accepted/cancelled confirmation, busy guards, descending unique checkpoint dispatch and first-failure termination. This is not physical dialog/launch certification.

## Retained failed measurements

- [Initial layout](cards-before.json): missing/oversized actions before implementation.
- [Route race](cards3.json): failed card read before Electron committed the route; measurement now waits for the card.
- [Provider restart failure](cards3b.json): the fixture binary was restored before recovery, so the real provider could not resume a synthetic ID. The exercise now retains and finally restores the fixture binary.
- [Mixed card run](cards4.json): plan/recovery pass; canonical seeded checkpoint review times out because its Git ref is missing. The error is retained, and this whole report is not called a passing harness.
- [Owned workspace initial failure](files-seed4.log): fixture provider shebang was displaced by imports, causing ENOEXEC. The executable now retains its first-line shebang; [retry receipt](files-seed4b.log).
- [Dock state failure](files4b.json), [repetition](files4c.json): empty review docks remained open after closing the file view, so different content widths produced a 10.5px x mismatch. Closing the dock via its visible Collapse panel action before measuring produces [the final passing run](files4e.json). This is not a platform exemption.
- [Final thread cell at a matched end position](thread-bottom.json) passes: 42/46 controls within 2px, four existing trail hit-area exemptions. Earlier standard thread attempts retain panel/navigation and virtualized control-pairing failures. New per-file labels expose off-screen pairing and Electron button-group versus primary-button measurement differences. Dedicated card measurements explicitly select the actual primary control. These earlier general harness failures are not platform exemptions.

## Validation

Native: [425 files / 1801 tests / zero failures](units4.log). [Affected upstream Vitest](vitest2.log): 4 files / 187 tests. [Generator guards](generator-final.log): 3/3. Root fmt/lint/typecheck pass (8/8 typecheck tasks); Native reuse, style and upstream footprint checks pass.

[Canonical message formats](formats-canonical-dark.json): existing 4/8 row-height acceptance; deltas +2.4, +2.1, −8.7 and −5px remain open. Native console probes were unavailable in the generic cell run; no zero-console-error claim.

The full row-type fixture/eight configurations, 24/24 and 28/28 matrices, and final three consecutive paired J1/J2/J7 remain outstanding. [J1 excluding only Stop](j1.json), [J2](j2.json), and [J7](j7.json) each pass on both renderers in this run. This is one paired pass, not three consecutive passes.
