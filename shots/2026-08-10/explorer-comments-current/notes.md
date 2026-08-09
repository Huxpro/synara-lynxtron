# Explorer line comments current-head evidence

- Isolated server: `ws://127.0.0.1:58260`; Lynx-for-Web origin:
  `http://localhost:9082`; server instance
  `e64a00bf-85fd-4648-bc5e-b933972398d9`.
- Canonical RPC-created project/thread use `/tmp/synara-comment-workspace`
  with root file `syntax.ts`.
- Named browser session: `synara-comment-evidence`; viewport `1280x820`, DPR 1.
- A real pointer click on the line-5 gutter produced the idempotent
  `explorerCommentLine=5` target and rendered the product editor.
- Both themes expose six named `Comment on line N` controls, the active line-1
  accent band, and identical `440x135 @ (807,164)` editor geometry.
- Editor copy matches Web: `Local comment`, `Comment on line 5`,
  `Request change`, Cancel, Comment. Both screenshots are exactly 1280x820 and
  page-errors.txt is empty.
- The shared Web `fileComments.ts` owns validation and formatting. Focused tests
  prove line tap/Cancel, input/submit, invalid rejection, normalization,
  persistence, dedupe, removal, shared composer chip data, and exact
  `<file_comments>` send serialization (47/47).
- Web and Desktop production builds pass.
- Web Elements does not publish real x-textarea keyboard input into ReactLynx
  bindinput, so Browser automation does not certify runtime comment submission.
  Native textarea/IME remains the certification boundary; no synthetic state
  was used to claim a submitted comment.
- Final badge calibration uses the shared Synara SVG (`X-SVG`, accessibility
  label `Synara`, non-empty 1,238-character SVG content) rather than a text
  approximation.
