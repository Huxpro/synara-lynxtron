# P9-U5 Composer fidelity completion audit

Status: blocked on the pre-existing workspace Web typecheck baseline

## Objective as concrete deliverables

1. Replace loose Composer comparison cases with a strict state manifest and
   verifier.
2. Converge Project Picker ordinary anatomy across Web and Lynx.
3. Converge Extras menu icons, Plan switch, Fast submenu, and geometry.
4. Converge skill/mention command-menu icons, ranking, typography, metadata,
   and theme.
5. Project Native selected tokens so one semantic token is visible while
   canonical provider text and structured references remain correct.
6. Retain like-for-like Browser evidence and exact-owned Native evidence.
7. Verify clear, selection, history, paste, send, failure, IME-adjacent edits,
   and restart persistence.
8. Pass focused tests, evidence checks, production builds, final workspace
   formatting, lint, and typecheck.
9. Restore user/isolated state and release every owned process and port.
10. Commit and push each coherent slice.

## Prompt-to-artifact checklist

| Requirement                                         | Artifact or command                                          | Result                                             |
| --------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------- |
| Strict comparison SSOT                              | `shots/2026-08-03/p9-u5-composer/manifest.json`              | 23 states, zero incomplete required cells          |
| Strict verifier                                     | `bun run --cwd apps/lynx evidence:composer`                  | pass                                               |
| Verifier regressions                                | `bun run --cwd apps/lynx test:evidence:composer`             | 6/6                                                |
| Offline comparison data                             | `shots/2026-08-03/p9-u5-composer/manifest.js`                | generated from manifest                            |
| Project Picker shared owner                         | `ComposerProjectPickerComposition.tsx`, Web/Lynx Elements    | complete                                           |
| Project Picker loading/error                        | `focused/project-loading.json`, `focused/project-error.json` | hashed passing focused evidence                    |
| Extras parity                                       | shared Extras composition + Lynx menu primitive              | complete                                           |
| Plan-only/Fast-only separation                      | `native/plan-only/`, `native/fast-only/`                     | dedicated independent frames                       |
| Add image Web action                                | `browser/attachment-action/web/`                             | real upload, preview, remove                       |
| Add files Native host action                        | `native/attachment-action/`                                  | `dialogsPickFiles`, PID-owned AXSheet, Cancel/Open |
| Skill/mention menu parity                           | `browser/command-menu/`                                      | four paired retained states                        |
| No command-row text placeholders                    | Lynx command adapter and Phase 3 assertions                  | complete                                           |
| Selected token shown once                           | `browser/tokens/`, `native/*-selected/`                      | one chip, no canonical syntax visible              |
| Canonical/structured projection                     | `composerDraftProjection.logic.ts`, KV evidence              | complete                                           |
| Backspace/selection/multiple/duplicate/IME adjacent | `composerDraftProjection.logic.test.ts`                      | pass                                               |
| Undo/redo                                           | `composerEditorHistory.logic.test.ts`                        | pass                                               |
| Paste/input transition                              | `composerPastedTextInput.logic.test.ts`                      | pass                                               |
| Canonical send command                              | `composerDispatch.logic.test.ts`                             | pass                                               |
| Failed send retains draft                           | `runComposerSendTransaction` failure test                    | pass                                               |
| Successful send clears after dispatch               | transaction success test + draft-store tests                 | pass                                               |
| Real Native IME publication                         | `shots/2026-08-03/p9-d1/native-ime/`                         | independent exact-owned proof                      |
| Cold restart persistence                            | `native/skill-selected/`, `native/mention-selected/`         | pass                                               |
| Cold restart cleared state                          | `native/skill-cleared/`, `native/mention-cleared/`           | pass                                               |
| Native identity                                     | PID-derived `localhost:8904/session 1`                       | pass                                               |
| Native bundle                                       | `apps/lynx/dist/desktop/main.lynx.bundle`                    | exact production bundle retained                   |
| Native dimensions                                   | ten `2560×1576` PNGs                                         | pass                                               |
| Native consoles                                     | per-cell `console.txt`                                       | zero error/warning messages                        |
| State restoration                                   | KV `cdf73622…`, window `2dd961d3…`                           | byte-exact                                         |
| Snapshot integrity                                  | `98753f94…` before/after                                     | unchanged                                          |
| Owned cleanup                                       | ports `62190`, `63231`, `8904`                               | released                                           |
| Other clients                                       | `8901`–`8903`                                                | untouched                                          |
| Web focused suites                                  | 83 unit + 3 Browser tests                                    | pass                                               |
| Lynx focused suites                                 | 41 + 14 tests                                                | pass                                               |
| Reuse/style audits                                  | strict check commands                                        | pass                                               |
| Web production build                                | `bun run --cwd apps/web build`                               | pass                                               |
| Lynx-for-Web build                                  | `bun run --cwd apps/lynx build:web`                          | pass                                               |
| Desktop build                                       | `bun run --cwd apps/lynx build`                              | pass                                               |
| Default artifact endpoints                          | Web/Desktop bundles                                          | only `ws://127.0.0.1:58090`                        |
| Workspace format                                    | `bun fmt`                                                    | pass                                               |
| Workspace lint                                      | `bun lint`                                                   | pass, zero errors                                  |
| Workspace typecheck                                 | `bun typecheck`                                              | **blocked**                                        |

## Typecheck blocker

The current workspace Web typecheck reports 239 errors across 91 files. A real
detached `244be2ee` baseline, run with the same TypeScript binary and
dependencies, reports 245 errors across 94 files. The six P9-U5 Project Picker
errors from that baseline were fixed; no current error names
`ComposerProjectPicker.logic.ts`, `ComposerProjectPickerComposition.tsx`, or
`ProjectPicker.tsx`.

The remaining 239 errors span unrelated Sidebar, terminal, timeline, settings,
session, notification, and other Web modules. They are not treated as P9-U5
success, but they are also not mass-fixed inside this Composer certification
slice.

## Completion decision

All P9-U5 implementation, evidence, Browser, Native, build, lint, formatting,
cleanup, and push deliverables are complete. The goal cannot be marked achieved
while the repository's explicit final `bun typecheck` requirement remains red.
