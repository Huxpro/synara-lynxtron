# #84: visible user context messages

Native uses upstream `deriveDisplayedUserMessageState` and
`resolveUserMessageMarkdownText` for both its cached markdown tree and rendered
body. Copy/edit use the visible prompt; original context transport remains in
the upstream edit/resend pipeline. Five isolated fixture threads are seeded
through ordinary provider RPC, with upstream serializers and unique message IDs.
No SQLite data is injected. Owned threads are deleted through RPC after use.

The Native composer and transcript share `ReferenceAttachmentCard`; selection
and file-comment summaries reuse the existing composer elements. Upstream's
remark chip transform supplies terminal/mention tokens. Annotation overflow
limit and PR scope icons are generated from upstream with shape guards.

## Measurements

The clean passing run [contexts10.json](contexts10.json), dark 1440×900,
chat size 13, measures seven states and 26/26 paired controls within 2px.
Terminal −1.08px; paste collapsed 0px / expanded +1.5px; PR collapsed −0.12px /
expanded +0.88px; browser annotation −0.12px; quoted selection −0.12px.
Both renderers pass visible-prompt copy and edit/cancel for all five kinds
(20 operations). The clean build contains no temporary URL diagnostics. The earlier passing
[diagnostic run](contexts9.json) is retained separately.

[Thread cell](thread.json): 41/45 controls within 2px and four existing named
trail hit-area exemptions. Electron errors and bracketed Native console errors
are empty. No new platform exemption is introduced.

## Retained failures and fixes

- [contexts4.json](contexts4.json): composer CSS overrode transcript attachment
  sizing; browser annotations exposed raw transport; quoted summary was 2px short.
- [contexts6.json](contexts6.json): edit/cancel harness lacked an Electron button
  selector. [contexts7.json](contexts7.json): unscoped Native Copy matched the
  assistant row. The harness now scopes user-row actions.
- [contexts8.json](contexts8.json): paste expansion +3.5px, browser annotation
  raw transport +246.88px. Paste inherited 2px action padding, now removed.
- [URL diagnostic failure](console-probe2.log): the URL parser's npm `punycode`
  resolved to Native's incomplete Node builtin stub (`ucs2.decode` absent).
  A rule scoped to the URL parser resolves its npm dependency.
  [Runtime retry](console-probe4.log) verifies URL fields on both threads.
  Only the unchanged shared annotation sanitizer receives the URL port;
  credentials, private paths, query and fragment redaction remain upstream-owned.
- [Bootstrap test failure](bootstrap.log) assumed hidden bootstrap text became
  empty. Upstream renders `(No Content)` while copying an empty prompt;
  [corrected test](bootstrap2.log) asserts that contract.

## Verification and remaining scope

[Native tests](units4.log): 428 files, 1806 tests, zero failures. The later
bootstrap assertions pass in the focused rerun. [Affected upstream Vitest](vitest.log):
51/51. [Generator and loader guards](generators-final.log): 25/25.
Root format/lint/typecheck and Native reuse/style/upstream-footprint audits pass.
The only root change is dependency metadata in `bun.lock`; declarations and
implementation stay in `apps/lynx`. Upstream source footprint is unchanged.

All eight typography/window/theme combinations, full 24/24 and 28/28 matrices,
and three consecutive paired workflows remain final acceptance work. Terminal
hover and OS-level behavior are not physically claimed by this fixture pass.

[Canonical formats](formats-canonical-dark.json) now pass 5/8 row heights;
the remaining three deltas are +2.1, −8.7 and −5px. Controls pass 19/30.
Two file-entry controls differ in width by 26px (generic container pairing);
the earlier #83 dedicated primary-control measurements remain the narrower
proof. These generic differences are retained, not classified as platform limits.

[J1 excluding only Stop](j1.json), [J2](j2.json), and [J7](j7.json) each pass
on both renderers once. This is not the final three consecutive passes.
The final clean fixture repetition retains all seven passing states and twenty
copy/edit-cancel operations, with 26/26 controls within 2px.
