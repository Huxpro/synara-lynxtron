# Transcript residual audit

## Ledger result

- Final generated fidelity loss remains `8.289406207894311`.
- The rolling 24-pair median RGB MAE is `0.5507725943527818%`.
- Accepted visual pairs at the latest commit point: `285`; rejected pairs: `1`; accepted pairs at or
  above `25%`: `0`; active reliability loss: `0`.
- Scoped exclusions preserve the valid Landing light `1280/1440` browser
  siblings (`0.380%` / `0.425%`) and the Sidebar Projects Lynx-to-Native
  sibling (`0.552%`).

## Product fix and current Browser evidence

The 2026-08-02 transcript-scroll archive explicitly records a real structural
difference: Electron used a full-width `1024x683` transcript viewport while
Lynx-for-Web used a centered `736x651` list. Its pinned and detached pairs
remain the two highest accepted residuals at `8.081%` and `6.654%`.

The product now separates the scroll owner from the content frame:

- main thread and embedded sidechat use a full-width `ThreadTranscriptColumn`;
- `<list>` owns the complete chat pane;
- every `list-item` centers its content through `TranscriptRowFrame`, which
  reuses the shared `736px` composer-column contract.

A current same-origin fast loop used Web `/` and staged Lynx-for-Web `/lynx/`
from one trusted `http://127.0.0.1:63250` origin, the same isolated backend
`58150`, the same canonical 16-message handoff thread, light `1280x820`, DPR 1,
and a closed dock. After the fix:

- Electron scroll owner: `x=256`, `width=1024`, `height=683`;
- Lynx-for-Web scroll owner: `x=256`, `width=1024`, `height=647`;
- Lynx visible message frames: `x=400`, `width=736`;
- matched pinned whole-frame MAE: `2.751226611071258%`, down from the old
  archive's `8.08137092997768%`.

Lynx-for-Web did not accept PageUp, wheel, or browser low-level drag delivery
for this `<list>`, so no detached browser frame is claimed. The temporary
screenshots were deleted, and without retained evidence plus a commit boundary
the old pair remains scored.

The later completed-thread live-edge fix at `d1ba34f80` validates a different
state. It cannot supersede the old pinned/detached visual pairs. The 2026-08-31
narrow Markdown evidence likewise validates table/code containment, not the
old mention-menu, skill-menu, selected-token, or persisted-token states. No
product-evidence supersession was added for either family.

The apparently closer 2026-08-03 P9-U5 Composer archive was also rejected as
replacement token evidence. Its manifest and assertions declare the same light
theme, viewport, snapshot, and interaction state, but direct inspection of the
archived pixels shows Web dark with provider overlays and Lynx-for-Web light.
The four sampled menu/selected pairs measure `90.381-91.047%` whole-frame MAE.
Those frames cannot replace the valid same-theme 2026-08-02 token pairs.

## Current slash-skill result

The current matched `/pol` run exposed a real remaining product loss rather
than only stale evidence: Electron displayed the ranked Skills menu while
Lynx-for-Web displayed `No matching command.`. The shared parser already
classified `/pol` as a slash command; Native alone restricted that lane to
three built-in commands and fetched skills only for the legacy `$` trigger.

Native now fetches provider skills for both slash-command and legacy skill
triggers, merges ranked skills after supported slash commands, and dispatches
selection by item type. Current verification used one backend and light
`1280x820` Browser clients:

- Electron and Lynx-for-Web both display the same ordered Skills results with
  `polish` first;
- a real Lynx-for-Web pointer selection produces `ComposerChip--skill` with
  label `polish`;
- exact-owned Native PID/window `65219/28138`, backend `54884`, accepted real
  `/pol` typing and a real click on `polish`;
- the Native host persisted canonical `prompt:"/polish "` plus the structured
  `polish` skill reference.

The final backend-pinned bundle SHA-256 is
`78af327aa52fadebf4ec78d88c815fd9b31affb5601d20e264076df6271c5de7`.
The current screenshots remained temporary, so the historical same-theme
skill-menu/selected pairs remain scored until retained evidence and a commit
boundary exist.

The current mention audit initially produced an empty Lynx menu because the
temporary server ran its normal seven-day retention sweep and hid all three
old seed threads. That run is rejected as a harness-state mismatch. Repeating
the same-origin run with `SYNARA_DISABLE_THREAD_RETENTION=1` preserved the
snapshot: both renderers showed the same three `New chat` thread results for
`@New`, with matching Chats / github / Chats descriptions. Electron also
offers its broader filesystem and subagent mention capabilities; those are a
separate capability surface and are not folded into the old thread-token
visual residual. A later exact-selection attempt was rejected after its shell
quoting failed before browser launch. No mention screenshot is retained and no
mention supersession is claimed.

After the slash-skill change, the focused Composer and transcript suite passes
5 files / 20 tests. The exact-owned host log independently records the real
selection sequence: `/pol`, then canonical `/polish `, then a structured
`polish` skill reference. The current bundle keeps the same SHA recorded
above.

## Current mention result

The first mention recapture was invalid because the temporary server applied
normal thread retention and hid all seed threads. With
`SYNARA_DISABLE_THREAD_RETENTION=1`, both clients exposed the same three `New
chat` thread matches and the same Chats / github / Chats descriptions for
`@New`. Electron additionally exposes Local, filesystem, plugins, and
subagents.

Native now closes the subagent portion of that gap through the shared static
provider alias catalog. Its empty `@` menu places the same Codex aliases after
Chats, and a real `@mini` pointer selection produces canonical `@mini()` plus
an `@mini` agent chip. `@local` and full filesystem navigation remain open
because advertising those rows without a real nested folder-navigation owner
would be a fake capability. No mention screenshot is retained and no ledger
supersession is claimed.

The complete eight-package build after this addition passes. Its generic
production bundle SHA-256 is
`d6537e8623449c96682791a76d5db3615aa55e0620dbf1f28c6462c911510278`.

## P8-Q2 Settings overlay audit

Direct inspection of all four archived P8-Q2 Settings cells (`dark-1280`,
`dark-1440`, `light-1280`, and `light-1440`) confirms the Electron/Web frame
contains the open provider-update overlay while the corresponding
Lynx-for-Web frame does not. The underlying General-page composition is
closely aligned, so these full-frame comparisons mix product state and cannot
measure renderer fidelity.

The harness exclusion is deliberately scoped to story prefix
`2026-08-03--p8-q2--settings--` and client pair `web:lynx`. It removes exactly
the four contaminated Browser comparisons, reducing current accepted pairs
from `360` to `356`. It does not match the same stories' `lynx:native` pairs;
those remain scored at `3.853340%`, `3.442286%`, `2.215512%`, and `1.980902%`.
After regeneration, total loss remains `8.289406207894311`, rolling median MAE
remains `0.5507725943527818%`, and accepted MAE at or above 25% remains zero.
The original archive is preserved; all temporary inspection PNGs are deleted.

## P8-Q2 Thread Native state audit

All four P8-Q2 Thread Lynx-to-Native comparisons are invalid as visual pairs.
The Lynx-for-Web frames contain the short seed transcript with `Hello` code
blocks and `More. A JavaScript function`; the Native frames instead contain a
different long WebSocket-reconnection essay, additional user messages, and a
different scroll position. This mismatch is present at dark/light and
`1280/1440`.

The exclusion is scoped to story prefix
`2026-08-03--p8-q2--thread--` and client pair `lynx:native`. It removes exactly
the four mismatched Native comparisons (`6.754283%`, `6.086102%`, `4.722118%`,
and `4.640122%`) and preserves the corresponding same-transcript Web-to-Lynx
pairs. Current accepted count becomes `352`; total loss and rolling median MAE
remain `8.289406207894311` and `0.5507725943527818%`, with zero accepted pairs
at or above 25%.

## Command Palette empty-state audit

The `2026-08-03--command-k--browser--states` `empty` pair is not a matched
empty palette state. Electron has both provider-update and provider-health
overlays, no Recent rows, and a broader suggested-command set; Lynx-for-Web is
unobscured and contains three Recent rows. An exact story, state, and
`web:lynx` exclusion removes only this `5.992001%` pair. Other Command Palette
states remain governed independently. The current accepted count is `351`;
loss, rolling median MAE, and critical count remain unchanged.

## P10 final-matrix Thread Native state audit

The four P10 final-matrix Thread cells repeat the P8-Q2 Native transcript
mismatch in both their `raw` and titlebar-normalized `comparison` images.
Lynx-for-Web contains the short code-block seed transcript; Native contains the
long WebSocket essay, extra user turns, a different scroll position, and a
`Reconnecting...` badge. The story-family plus `lynx:native` exclusion removes
all eight invalid comparisons while preserving all eight Web-to-Lynx siblings.
Current accepted count becomes `343`; loss, rolling median MAE, and critical
count remain unchanged.

The separate `2026-08-06--command-k-current` `open-before` pair also mixes
provider and snapshot state despite both palettes being open. Electron contains
provider-update plus provider-error overlays, a broader suggested-command set,
and a different project/thread snapshot; Lynx-for-Web contains a
Codex-unavailable banner. Its exact `web:lynx` pair is excluded at `4.431781%`
without broadening the rule to other Command Palette states. Current accepted
count becomes `342`; loss, rolling median MAE, and critical count remain
unchanged.

## Settings Keyboard Shortcuts overlay audit

The two archived Settings Keyboard Shortcuts Browser pairs (`dark-1440` and
`light-1280`) both contain an open provider-update overlay only in Electron,
obscuring the heading and search area. The underlying shortcut table is closely
aligned. A `web:lynx`-scoped family exclusion removes the `3.944034%` and
`2.952616%` contaminated comparisons. Current accepted count becomes `340`;
loss, rolling median MAE, and critical count remain unchanged.

Both Settings Notifications Browser cells (`dark-1440` and `light-1280`) also
contain a Web-only provider-update overlay that obscures the heading and upper
controls. Their full-frame pairs are excluded. The Test-button capability and
status-copy differences remain a separate matched-state product question.

The separate `2026-08-03--command-k--browser--empty-1280` story repeats the
same mismatch with two Recent rows on Lynx-for-Web and none on Electron. Its
exact story ID is excluded at `3.039006%`; no broad Command-K prefix exclusion
was added. Current accepted count becomes `339`.

The `2026-08-03--command-k--browser--message-1280` pair has the same query and
thread result, but Electron is covered by provider-update and provider-health
overlays while Lynx-for-Web is unobscured. Its exact `2.788311%` full-frame pair
is excluded. The differing result highlight and summary remain recapture debt;
this classification does not claim that local surface is resolved.

The `2026-08-03--command-k--browser--theme-1280` pair likewise has a matched
`dark` query and the same two theme actions, but only Electron carries the two
provider overlays. Its exact `2.614143%` full-frame pair is excluded; selected
row paint and icon fidelity still need a matched recapture.

## High-MAE harness sweep result

This pass added fifteen exact harness issue rules covering 40 invalid visual
pairs. The rules are deliberately story, state, and/or client-pair scoped. In
particular, valid `lynx:native` siblings remain for P8-Q2 Settings, Pull
requests, and August 5 Appearance, while valid `web:lynx` siblings remain for
P8-Q2 and P10 Thread evidence.

Two commit-bounded product supersessions additionally retire only the stale
August 5 Integrations/AppSnap `lynx:native` snapshots after their later
committed capability work. Their historical `web:lynx` siblings are separately
classified as Web-only provider-overlay capture mismatches, since both old Web
frames obscure the heading and upper card while Lynx-for-Web is unobscured.
The current Browser Integrations pair used backend `58150` and measured
`0.5546544964530528%`. A separate exact-owned Native anatomy check used
PID/window `61269/29688` and the generic `58090` endpoint; it confirms the
current capability surface but is not presented as same-backend three-client
evidence.

The four P8-Q2 Settings General `lynx:native` snapshots are likewise retired
at committed boundary `a385a479f`, after the retained P10 Settings evidence had
already established the canonical 256px sidebar, 672px content rail, semantic
typography, select/material geometry, and final vertical rhythm. Their Web
overlay contamination remains a separate harness issue.

The eight P10 final-matrix Settings General Native samples (`raw` and
titlebar-normalized `comparison` at both themes and widths) show the same old
Native 2x typography/control scale. They are superseded at `a385a479f` as well;
all corresponding Web-to-Lynx samples remain independently scored.

All eight P8-Q2 empty-thread `threads` pairs are retired at committed boundary
`8d1506220`. Unlike the capture mismatches above, these were valid historical
product residuals. The later retained Web/Lynx-for-Web/exact-owned Native cell
covers the same centered heading/composer state plus its real project context
tray and Temporary lifecycle.

The regenerated latest commit point contains `285` accepted pairs and one rejected
pair. Total loss remains `8.289406207894311`, rolling median MAE remains
`0.5507725943527818%` across 24 samples, reliability loss remains zero, and no
accepted pair has MAE at or above 25%. The remaining highest entries are the
known Markdown-token retained-recapture debt, the pre-fix Skills
visual evidence, or visually confirmed same-state product residuals such as
Behavior, P8 Threads, and P8 Kanban.

## Current transcript recapture

Commit `3986fb12a` retains a same-backend Electron/Lynx-for-Web recapture for
the old transcript pinned and detached states. Both clients used backend
`54095`, server instance `9240f5bd-66ad-4e46-8f05-9f739b614103`, thread
`lynx-landing-thread-1787254540864-987357febecef`, light `864x620` DPR 2,
sidebar open, dock closed, and the same provider-update/error overlays. Pinned
MAE is `2.227684%` and detached MAE is `2.263907%`, replacing the old
`8.081371%` / `6.653651%` snapshots after that boundary. The recapture also
closed the empty Lynx jump-button glyph by switching it from a `currentColor`
DOM SVG whose stroke resolved to `none` to an explicitly colorized SVG content
path. Markdown-token states remain independently open.

Commit `3a8158992` then retains the matching composer menu and selected-token
states on the same backend/thread/route/overlay/viewport contract. Current MAE
is `3.411695%` for skill-menu, `2.797184%` for mention-menu, `2.265266%` for
skill-selected, and `2.312400%` for mention-selected. The run found and fixed
two current presentation losses: Lynx menu rows leaked raw namespaced skill
names instead of provider display names, and selected skill chips showed raw
lowercase names instead of Electron's shared formatter. The old
`persisted-tokens` sample remains scored because this run sent no message.

Commit `4582803a2` closes that final stale token snapshot and icon boundary with a separate
isolated product-RPC run. The canonical user message has non-empty
`mentions_json` and `skills_json`; both clients render `Token mention source`
and `Polish` on backend `58270`, server instance
`7f56a536-f9ed-4165-b817-079bb6a3908d`, light `864x620` DPR 2. Current MAE is
`1.920211%`. Native's skill glyph now uses the resolved theme accent; the
remaining generic thread-mention glyph is retained as a current residual rather
than hidden by the supersession.

## Current Settings Behavior closure

The current shared Settings composition already aligns both renderers to the
same 672px content frame. A fresh same-origin Browser run used isolated backend
`58150`, dark `1280x820` at DPR 1, `/settings?section=behavior` for Electron/Web
and `/lynx/?route=%2Fsettings%2Fbehavior` for Lynx-for-Web. With the same
four-provider update overlay visible in both clients, whole-frame MAE measured
`0.6582181322732344%`.

That run exposed one remaining current product delta: Native permanently
rendered `Preferences loaded.` after successful hydration while Electron stays
visually quiet. The `loaded` persistence presentation now returns no visible
message; saving, saved, error, and retry states are unchanged. Focused
persistence coverage passes `4/4`; both touched ReactLynx files scan with zero
issues; `build:web` and the complete eight-package production build pass.

Exact-owned Native acceptance used PID/window `34722/29579`, route
`synara://settings/behavior`, isolated backend `58150`, and staged bundle
SHA-256 `24f63d012e3533f3039dd4f3059a2aa7c0abebb9f7cea0bab0a545817a70e681`.
Computer Use dismissed the AppSnap welcome and provider update prompt through
their real visible controls. The final stable Behavior page contains no
`Preferences loaded.` row. The owned process had a live socket to `58150`, and
its host log recorded `server.getConfig`, `server.getSettings`, and shell
snapshot RPCs with that same base URL. No screenshot was retained in the
repository.

Five focused 2026-08-06 Command Palette stories (footer, footer text, input,
keyboard hints, and labels) also reuse one mismatched full-frame capture.
Electron has provider-update/error overlays and eight Suggested commands;
Lynx-for-Web has a Codex-unavailable banner and six Suggested commands. Exact
story IDs remove only those `2.912-2.998%` pairs. Current accepted count becomes
`330`; the focused assertions and later matched palette evidence remain valid.

## P8-Q2 Pull requests state audit

All four P8-Q2 Pull requests Electron frames contain a
repository-unavailable warning that is absent from Lynx-for-Web. The filter and
search affordances also differ, but these full-frame captures cannot separate
that capability delta from the warning-state mismatch. Only the four
`web:lynx` pairs are excluded; all four `lynx:native` siblings remain scored.
The exclusion reduced accepted count from `339` to `335` before the focused
Command Palette exclusions above.

## August 5 Appearance overlay audit

Both August 5 Appearance Electron frames contain an open provider-update
overlay that is absent from Lynx-for-Web, obscuring the heading and upper theme
card. The exact two-story rule is scoped to `web:lynx`; both same-page
`lynx:native` siblings remain scored. Current accepted count becomes `328`
after this and the focused Command Palette classification; core loss invariants
remain unchanged.

The two August 5 Settings Skills Web-to-Lynx frames repeat the same provider
overlay contamination over the heading and portable-skills card. They are
excluded by exact story ID and client pair. Their same-page Lynx-to-Native
siblings remain scored independently from the newer `/plugins` Skills evidence.
The two old Settings Skills Native samples are then superseded at `ef1706ce3`,
whose retained current-head wide evidence makes the 624px Shared skills section
and representative row heights exact. This boundary does not use the newer
`/plugins` surface as a substitute.

## Current exact-owned Native acceptance

- Bundle: `apps/lynx/dist/desktop/main.lynx.bundle`.
- Final exact-owned backend-pinned bundle SHA-256:
  `176d96efcc92f1f0df2ad0e2c92a948b55212010e3627b1c76106751be6d04a1`.
- Exact-owned app: `com.lynxjs.SynaraComparisonLynxtron`, PID/window
  `63644/27649`.
- Isolated backend: `64418`; Electron CDP: `9225`; Native DevTool request:
  `8904`; light `1280x820`; dock closed.
- A temporary 16-message long transcript was created through canonical
  `thread.handoff.create`; no SQLite fixture write was used. Electron and
  Native both opened the same `fidelity-transcript-recapture-20260901` thread
  at the live edge.
- TraeX Computer Use opened the thread through the rendered Chats row, used a
  real upward drag to detach from section 8 to sections 6/7, observed the
  scroll-to-bottom affordance, and activated that affordance to return to
  section 8.
- The final rebuilt exact-owned run used PID/window `4310/27905`, backend
  `53148`, and repeated the same real sidebar, drag, and jump path after the
  full-pane scroll-owner fix.
- Computer Use page scrolling did not move the Native list, but direct drag
  delivery did. The Lynx DevTool CLI reported no registered clients, so this
  run makes no Native console or DOM claim.

This proves current Native pinned/detached behavior, but it is not a
Lynx-for-Web replacement pair. The old browser-pair scores remain until a
same-origin fast-loop recapture uses the same backend, thread, theme, viewport,
dock, and interaction state.

## Cleanup

- The temporary thread was left through a rendered Native thread row and then
  deleted through canonical `thread.delete`.
- Temporary Electron PNGs and Git-object inspection PNGs were deleted.
- Browser cleanup reported `sessions: []` and zero owned browser processes.
- Owned ports `8893`, `9225`, `8904`, and `64418` were released.
- The user's launcher PID `97403` and ports `9158/9490/9062` were not touched.
- No screenshot was added to the repository; the existing count remains 179.

## Verification

- Fidelity ledger generation: `808` commit points / `17` archive daily anchors,
  `66.32 -> 8.29`.
- Fidelity-loss logic: `41/41`.
- Current visual ledger: `285` accepted / `1` rejected, rolling median MAE
  `0.5507725943527818%`, total loss `8.289406207894311`, reliability loss
  `0`, and zero accepted pairs at or above 25%.
- Plugin Library and Composer source contracts under Rstest: `7/7`.
- Shared provider-discovery coverage: `7/7`.
- Comparison launcher coverage: `20/20`.
- ReactLynx scans: zero issues in both touched components.
- Full-pane transcript focused coverage: `8/8`; all three affected ReactLynx
  scans report zero issues.
- Complete eight-package production build: passed with registered warnings
  only.
- A broader six-file transcript run passed `33/34`. Its sole failure is a
  pre-existing source-contract assertion that still expects hard-coded
  `11px/19px` reasoning typography, while the current working tree already
  uses the shared inherited transcript typography. It does not touch the
  scroll-owner change; the focused ownership/sidechat suite remains `8/8`.

## August 2 Markdown supersession audit

Commit `741439802` contains the original Markdown implementation plus three
paired Browser states. Git-object inspection confirms that `before` and
`after-dark` use the same isolated backend, thread, `1280x820` viewport,
message/code-block contents, composer state, and live-edge scroll position.
The post-fix dark pair therefore remains valid implementation evidence.

It is not a same-state visual replacement for the accepted light/light
`before` pair: `after-dark` is dark/dark, while the nominal light `after` pair
is actually Web dark versus Lynx light and is already classified as
`capture-theme-mismatch` (`90.48495822871831%`). The current Markdown source
also contains a large uncommitted stack spanning syntax highlighting, text
selection, table layout, and typography, so a fresh capture from that bundle
would be `working-tree-product-change`, not a commit-bounded replacement.

No supersession is registered at `741439802`. The accepted `before`
(`3.5946676231468198%`) and `after-dark` (`3.1481740943328553%`) samples remain
independently scored until matched light and dark current evidence can be
retained at a safe implementation commit boundary. The audit used temporary
Git-object extraction only; the temporary directory was removed, and the
browser entry/exit gates both returned zero sessions and zero owned processes.

## P10 final-matrix Browser state audit

All 40 P10 final-matrix Web-to-Lynx samples are invalid as visual pairs. At
light/dark and `1280x820`/`1440x900`, both `raw` and normalized `comparison`
images derive from captures where Electron shows the provider-update dialog
and Lynx-for-Web does not. This was verified across Landing, Thread, Settings
General, project Kanban, and Pull requests. Thread additionally compares an
Electron provider-path banner against a Lynx `Reconnecting...` badge; Pull
requests includes an Electron-only repository warning. Matching snapshot
hashes, routes, viewports, and themes do not make those renderer-local overlay
and connection states equivalent.

The exclusion is scoped to the P10 final-matrix namespace and `web:lynx`. The
final-overlays family, all clean P8-Q2 Browser pairs, and independently
governed Native pairs remain untouched. After regeneration the current ledger
has `809` commit points, `245` accepted pairs, `1` rejected pair, rolling median
MAE `0.5507725943527818%`, total loss `8.289406207894311`, reliability loss
`0`, and no accepted pair at or above `25%`. Fidelity-loss logic passes
`42/42`.

## P10 final-overlays Browser state audit

All 36 P10 final-overlays Web-to-Lynx samples are invalid as visual pairs.
Their intended composer states are present in both renderers, but every
Electron frame also carries the provider-update dialog and provider-path error
banner while Lynx-for-Web has neither. This applies to both `raw` and
titlebar-normalized `comparison` images across all 18 Extras, project-picker,
command, skill, and mention menu stories.

The exclusion is scoped to the final-overlays namespace and `web:lynx`. Native
siblings remain independently scored, and the later matched composer token
recaptures keep their own commit-bounded replacement history. After
regeneration the ledger has `810` commit points, `209` accepted pairs, `1`
rejected pair, rolling median MAE `0.5507725943527818%`, total loss
`8.289406207894311`, reliability loss `0`, and no accepted pair at or above
`25%`. Fidelity-loss logic passes `43/43`.

## P10 Settings General Browser hydration audit

The earlier P10 Browser Settings General `raw` and normalized `comparison`
images are not same-state pairs. Electron has fully hydrated controls and an
open provider-update dialog; Lynx-for-Web remains at `Loading preferences...`
with a `Reconnecting...` badge. An exact story-ID plus `web:lynx` rule excludes
only those two frames. Later hydrated Settings evidence remains independently
available.

After regeneration the ledger has `811` commit points, `207` accepted pairs,
`1` rejected pair, rolling median MAE `0.5507725943527818%`, total loss
`8.289406207894311`, reliability loss `0`, and no accepted pair at or above
`25%`. Fidelity-loss logic passes `44/44`.

## August 3 Composer Details shell-state audit

The four still-active Extras and Project Picker Browser pairs are not
same-state full-frame comparisons. The intended `raw`/`menu` and
`open`/`selected` composer states are present in both renderers, but Electron
also has the provider-update dialog and provider-path error banner while
Lynx-for-Web has neither. The exclusion uses the two exact story IDs and the
`web:lynx` client pair, so the separately superseded skill/mention states and
all later focused composer evidence remain untouched.

After regeneration the ledger has `812` commit points, `203` accepted pairs,
`1` rejected pair, rolling median MAE `0.5507725943527818%`, total loss
`8.289406207894311`, reliability loss `0`, and no accepted pair at or above
`25%`. Fidelity-loss logic passes `45/45`.

## P10 runtime mention-chip Browser state audit

The selected mention is present in both runtime specimen frames, but Electron
also contains the provider-update dialog and provider-path error banner while
Lynx-for-Web has neither. Its `2.412054763470429%` whole-frame MAE therefore
does not isolate mention-chip fidelity. The exact story-ID plus `web:lynx` rule
excludes only that pair; the same specimen's Lynx-to-Native pair remains
scored at `1.0706325721345449%`, and later matched mention-token evidence stays
independent.

After regeneration the ledger has `814` commit points, `202` accepted pairs,
`1` rejected pair, rolling median MAE `0.5507725943527818%`, total loss
`8.289406207894311`, reliability loss `0`, and no accepted pair at or above
`25%`. Fidelity-loss logic passes `46/46`.

## Authenticated Lynx-for-Web relay recovery

A clean detached worktree at `3fb81905f` reproduced a harness-blocking product
defect before any Thread fidelity comparison: the configured endpoint
`ws://127.0.0.1:60892/?token=synara-local-desktop-comparison` was normalized
to `url.origin`, so all `/ws/bootstrap` and `/ws` connections lost the token.
The renderer remained at `Preparing Synara...`; relay diagnostics recorded six
connection failures and no ready route.

Commit `e86b1fe2a` moves URL normalization and socket-path composition into a
tested helper that preserves and merges query parameters. The same clean
worktree, backend, thread, and bundle build then connected on attempt one to
server instance `a37695d2-2571-4837-95ee-367d435a11bf`, reported socket state
`1`, set renderer-ready route
`/thread/lynx-landing-thread-1787254540864-987357febecef`, and had null transport
and RPC errors. Focused relay coverage passes `7/7`.

This is recorded as a reliability event from the original relay introduction
at `b4df16d69` through `e86b1fe2a`. It is distinct from the earlier
`WebSocket.OPEN` ready-state defect. The clean app still resolved the cloned
thread route to a project-scoped New Thread surface, so no Thread visual frame
from this diagnostic run is retained or used for supersession.

## 2026-09-02 current Markdown surface replacement

The authenticated clean-worktree fast loop retained current light and dark
Markdown fixtures at `shots/2026-09-02/markdown-surface-current/`. Both clients
used backend `57198`, server instance
`82ba5bed-296b-4ab2-9ba9-7ebc7efa8fff`, thread
`fidelity-markdown-dark-20260902-b`, `1280x820` DPR 1, the same transcript,
closed dock, and no provider-update overlay. Current MAE is
`1.2959141608879323%` light and `1.4813689373106964%` dark.

Two exact `web:lynx` / `1280x820` supersessions retire only the valid August 2
light `before` and dark `after-dark` samples at evidence commit `0dfcf4b69`; the
nominal light `after` pair remains rejected as a theme mismatch. Regenerating
the clean screenshot archive also activated previously committed 2026-08-20,
2026-08-21, and 2026-09-02 evidence. The ledger now has `824` commit points,
`19` daily anchors, `206` accepted pairs, `1` rejected pair, rolling median MAE
`0.6448107988835652%`, total loss `8.653649876629391`, reliability loss `0`,
and no accepted pair at or above `25%`. The current visual residual is a wider,
syntax-highlighted Electron Markdown rail/code block versus a narrower,
monochrome Lynx rendering.

## August 5 Profile and Advanced provider-state audit

Direct inspection confirms that the light/current and dark/1440 Profile and
Advanced stories compare Electron frames with the provider-update dialog
against Lynx-for-Web frames with a `Reconnecting...` badge. Profile also
differs in provider-derived actions, while Advanced differs in recovery state,
so none of the four full-shell Browser pairs isolates page fidelity. The exact
story-ID plus `web:lynx` rule excludes only these samples. All Lynx-to-Native
siblings remain scored. The same inspection extended the existing
Integrations/AppSnap rule to their dark/1440 siblings, which repeat the overlay
versus reconnecting mismatch and expose different host capability state. After
regeneration the ledger has `826` commit points, `200` accepted pairs, `1`
rejected pair, rolling median MAE
`0.6448107988835652%`, total loss `8.653649876629391`, reliability loss `0`,
and no accepted pair at or above `25%`. Fidelity-loss logic passes `48/48`.

## August 6 Providers dark overlay audit

The `providers-dark-1440` Electron frame contains the provider-update dialog,
obscuring the heading and upper update card, while Lynx-for-Web is unobscured.
An exact story-ID plus `web:lynx` rule excludes only this
`1.862102900831114%` full-shell pair. Other Providers stories and independent
Native/provider-row evidence are unaffected. Regeneration yields `827` commit
points, `199` accepted pairs, `1` rejected pair, median MAE
`0.6448107988835652%`, total loss `8.653649876629391`, reliability loss `0`,
and zero accepted pairs at or above `25%`. Fidelity-loss logic passes `49/49`.

## Sidebar primary-shortcut offline-state audit

The August 6 primary-shortcut `raw`, `default`, and `hover` Web frames show a
healthy landing plus provider-update/health overlays and a usable composer.
Their Lynx-for-Web siblings are globally offline: `Server unavailable`,
`Synara is offline`, and a retry-only landing replace the intended state. The
two exact story IDs plus `web:lynx` rule exclude these three full-shell samples
without weakening focused shortcut or hover assertions. Regeneration yields
`828` commit points, `196` accepted pairs, `1` rejected pair, median MAE
`0.6448107988835652%`, total loss `8.653649876629391`, reliability loss `0`,
and zero accepted pairs at or above `25%`. Fidelity-loss logic passes `50/50`.

## Composer model-row provider and menu-state audit

The August 6 `composer-model-row-text-current/open` Web frame includes
provider-update and provider-health overlays plus a two-level provider/model
menu. Lynx-for-Web instead shows a Codex-unavailable banner and a single-level
model page. The full-shell `1.742733864379085%` MAE cannot isolate row text.
An exact story/state/`web:lynx` rule excludes only that pair; focused row
assertions and later matched composer-model evidence remain independent. The
ledger now has `829` commit points, `195` accepted pairs, `1` rejected pair,
median MAE `0.6448107988835652%`, total loss `8.653649876629391`, reliability
loss `0`, and no accepted pair at or above `25%`. Fidelity-loss logic passes
`51/51`.

## Settings Search transport-state audit

The August 6 Settings Search frames agree on the `archived thread` query and
result, but Electron carries the provider-update overlay while Lynx-for-Web is
globally offline. The exact story plus `web:lynx` rule excludes only the
`1.6027259684361548%` mixed-state Browser sample. Its Lynx-to-Native sibling
remains scored at `2.185268586601307%`, as do focused search behavior checks.
The ledger now has `830` commit points, `194` accepted pairs, `1` rejected
pair, median MAE `0.6448107988835652%`, total loss `8.653649876629391`,
reliability loss `0`, and no accepted pair at or above `25%`. Fidelity-loss
logic passes `52/52`.

## Settings Archived provider-state audit

The August 5 Archived empty-state pair has matching copy, but Electron carries
the provider-update overlay while Lynx-for-Web shows `Reconnecting...`; the
Lynx archived-state image resource is also broken. The exact `web:lynx` rule
excludes only the `1.5035950203252033%` mixed-state full-shell sample. Its
Lynx-to-Native sibling remains scored at `1.0598293280726927%`, and the broken
image remains an explicit product defect rather than being declared fixed. The
ledger now has `831` commit points, `193` accepted pairs, `1` rejected pair,
median MAE `0.6448107988835652%`, total loss `8.653649876629391`, reliability
loss `0`, and no accepted pair at or above `25%`. Fidelity-loss logic passes
`53/53`.

## Worktrees, shared-menu, and Composer provider-state audit

Four additional Browser pairs compare different provider or transport states.
Settings Worktrees and shared-menu text use Electron's provider-update overlay
against reconnecting or unobscured Lynx shells. Composer provider-row and
permission-icon frames use healthy or quiet Electron provider state against
Codex-failure banners in Lynx-for-Web. Two exact story lists scoped to
`web:lynx` exclude only these full-shell samples. The Worktrees and permission
icon Lynx-to-Native siblings remain scored at `0.960322513151602%` and
`0.5503492148892077%`. The ledger now has `832` commit points, `189` accepted
pairs, `1` rejected pair, median MAE `0.6448107988835652%`, total loss
`8.653649876629391`, reliability loss `0`, and no accepted pair at or above
`25%`. Fidelity-loss logic passes `55/55`.

## August 6 Composer provider-shell family audit

Representative frames and the per-story notes confirm that 15 explicit
Composer open-state Browser pairs share the same shell mismatch: Web has
provider-update and provider-health overlays while Lynx-for-Web has a
Codex-unavailable banner. This applies to the named picker chrome/rows, trait,
footer, runtime/send/voice, Extras, and related label states, but not to any
closed state or unrelated Composer story. An explicit story list scoped to
`open`, `open-before`, `open-final`, and `web:lynx` excludes exactly those 15
full-shell samples. Focused geometry/behavior evidence and later matched
Composer runs remain independent. The ledger now has `833` commit points,
`174` accepted pairs, `1` rejected pair, median MAE
`0.6448107988835652%`, total loss `8.653649876629391`, reliability loss `0`,
and no accepted pair at or above `25%`. Fidelity-loss logic passes `56/56`.

## Archived and Worktrees dark sibling audit

The dark/1440 Archived and Worktrees siblings repeat the same Electron
provider-update overlay versus Lynx `Reconnecting...` mismatch. Archived also
retains the broken Lynx image. Extending the existing exact story lists removes
only these two Browser samples. Their Lynx-to-Native siblings remain scored at
`0.9226361655773421%` and `0.8239872306947471%`. The ledger now has `834`
commit points, `172` accepted pairs, `1` rejected pair, median MAE
`0.6448107988835652%`, total loss `8.653649876629391`, reliability loss `0`,
and no accepted pair at or above `25%`. Fidelity-loss logic remains `56/56`.

## Focused P10 skill-menu and project-picker audit

The P10 Browser `skill-menu-filtered` and `project-picker-open` stories are not
matched full-shell states. Electron has the provider-update overlay in both;
Lynx-for-Web does not. The picker also compares Electron's `Loading folders...`
phase against populated local directory results and a reconnecting badge in
Lynx. An exact two-story rule scoped to `raw`, `comparison`, and `web:lynx`
excludes those four samples. Skill icon and project-picker composition remain
open until a matched recapture. The ledger now has `835` commit points, `168`
accepted pairs, `1` rejected pair, median MAE `0.6448107988835652%`, total loss
`8.653649876629391`, reliability loss `0`, and no accepted pair at or above
`25%`. Fidelity-loss logic passes `57/57`.

## Sidebar primary-action provider-banner audit

The August 6 primary-action icon and label frames reuse Electron
provider-update/health overlays against a Lynx Codex-unavailable banner. Their
`1.0675397038896859%` and `1.0672277269647696%` full-shell MAE cannot isolate
the permission glyph or label. Extending the exact Composer provider-banner
story list excludes only those two Browser pairs; focused component evidence
remains intact. The ledger now has `836` commit points, `166` accepted pairs,
`1` rejected pair, median MAE `0.6448107988835652%`, total loss
`8.653649876629391`, reliability loss `0`, and no accepted pair at or above
`25%`. Fidelity-loss logic remains `57/57`.

## P10 Browser default overlay audit

The P10 Browser `default`, `composer-default`, `landing-default`, and
`sidebar-default` stories all reuse Electron frames with the provider-update
dialog while Lynx-for-Web is unobscured. An exact four-story rule scoped to
`raw`, `comparison`, and `web:lynx` excludes those 8 full-shell samples. The
clean same-snapshot P9 Composer default remains scored at
`1.1445656235054997%`. The ledger now has `837` commit points, `158` accepted
pairs, `1` rejected pair, median MAE `0.6448107988835652%`, total loss
`8.653649876629391`, reliability loss `0`, and no accepted pair at or above
`25%`. Fidelity-loss logic passes `58/58`.

## Committed Plugin Library Skills replacement

The previously uncommitted Plugin Skills stack was split at a safe boundary.
Commit `fad6fb541` contains the full Skills surface plus shared deterministic
accent helper, while generated icon files stage only the required Tabler
`list-check` additions; unrelated user icon changes remain in the working tree.
Shared tests pass `7/7`, Plugin tests `3/3`, the ReactLynx scanner reports zero
issues, icon regeneration is byte-identical, and the staged-tree Web production
build passes.

Commit-bounded evidence in
`shots/2026-09-02/plugins-skills-current-committed/` uses backend `56506`,
server instance `981808a8-81fa-4eda-9227-14d5b357007b`, route `/plugins`,
Codex, Skills, light `1280x820` DPR 1, identical catalog/sidebar, and no
overlays. Current MAE is `2.123356298820341%`, replacing the old
`5.449254867089112%` wide Skills sample. The ledger activates one new pair and
supersedes exactly one old pair at evidence commit `b5c80c68e`; compact,
Plugins-tab, and Native evidence remain untouched. It now has `839` commit
points, `158` accepted pairs, `1` rejected pair, median MAE
`0.6448107988835652%`, total loss `8.658511436259841`, reliability loss `0`,
and no accepted pair at or above `25%`. Fidelity-loss logic passes `59/59`.

## Commit-bounded Markdown highlighting and width split

The fenced-code residual was separated from the user's larger Transcript stack
without staging unrelated selection, tables, message-trail, edit, or revert
work. Commit `356e765cf` adds asynchronous host-backed syntax highlighting with
plaintext fallback. Commit `9de83da62` adds the transcript width styles, and
follow-up `48115ec64` adds the required shared-frame and assistant-typography
wiring after a browser geometry probe correctly exposed the first CSS-only
commit as incomplete. Focused tests pass (`4/4` and `1/1`), ReactLynx scans
report zero issues, and committed-tree Web builds pass.

The diagnostic capture under
`shots/2026-09-02/markdown-syntax-highlight-current/` proves one successful
`javascript`/`snippet.js` highlight call with no RPC or transport error and
shows the expected token color families. It does not supersede the current
Markdown light/dark pair: Electron reported DPR 2 while Lynx-for-Web reported
DPR 1, and later attempts were invalidated by AppSnap first-run modal, route
fallback, theme, hydration, or overlay mismatches. All temporary fixtures were
created and deleted through canonical orchestration commands; owned processes
and ports were cleaned, and browser entry/retry/exit gates all reached zero.

A later committed-tree run forced both renderers to `1280x820`, DPR 1 and used
the same backend, canonical fixture, theme, sidebar, dock, and provider-update
overlay. The fully wired width/highlight boundary measured `1.4447498206599714%`
light and `1.6054932847122587%` dark. A clean-overlay light cell measured
`1.3408854166666668%`; the corresponding dark attempt was rejected because
Lynx returned to New Chat instead of the fixture route. None improves the
existing exact no-overlay Markdown pair (`1.2959141608879323%` light,
`1.4813689373106964%` dark) under the same capture state, so the ledger remains
unchanged. The strict-run fixture was canonically deleted and all temporary
images, worktree, processes, ports, and browser sessions were removed.

## P8-Q2 Thread full-pane supersession

The four P8-Q2 Thread Browser cells were still counted even though their own
notes identify the Lynx outer transcript owner as the retired 736px list while
Web owned the full 1024px pane. The existing `3986fb12a` evidence proves the
later shared full-pane scroll-owner boundary with one backend, thread, route,
overlay state, viewport, and dock state. A new exact supersession therefore
matches only `2026-08-03--p8-q2--thread--*`, state `raw`, client pair
`web:lynx`; the `threads/*` landing family and Native siblings remain governed
independently. Fidelity-loss logic passes `60/60`. The current accepted count
drops from `158` to `154`; rolling median and total loss remain
`0.6448107988835652%` and `8.658511436259841` because those four historical
cells are outside the latest 24-pair rolling window.

## Retained Settings Behavior dark replacement

Commit `779c9d05c` removes the stable-state `Preferences loaded.` row while
preserving saving, saved, and actionable error/retry feedback. Retained evidence
in `shots/2026-09-02/settings-behavior-current/` uses backend `53057`, server
instance `bc6b818b-91cf-41a0-9df7-d90d598021f5`, dark `1440x900` DPR 1, the
Behavior route, identical settings values, and the same three-provider update
prompt in both clients. Current MAE is `0.5927520576131687%`, replacing the old
`2.79470729444041%` Browser pair. Fidelity-loss logic passes `61/61`; accepted
count becomes `153`, while rolling median and total loss remain
`0.6448107988835652%` and `8.658511436259841`.

The remaining light `1280x820` Behavior pair was recovered directly from its
archived Git blobs and audited separately. Its Lynx frame contains the same
now-fixed `Preferences loaded.` row, but it also differs from Electron in
sidebar search availability/disabled styling and uses a different viewport and
theme from the retained dark replacement. The dark proof is therefore not
expanded to cover this light cell. Two fresh isolated recapture attempts reached
the correct backend and endpoint-pinned bundle, but agent-browser repeatedly
failed with `EAGAIN` during browser configuration. No partial frame was
retained; the `1.675639646102343%` light pair remains scored pending an exact
recapture.

## Current Kanban dark audit

A current committed-tree Browser run used one isolated backend, dark
`1280x820` DPR 1, the same project-scoped Kanban route, sidebar, cards, and
provider-update overlay. With the seed's two real Done cards, whole-frame MAE
was `0.6604728349673203%`, confirming that the modern shared card/sidebar/board
composition has removed most of the old `2.7723045442770604%` residual.

The old P8 cell has three Done cards. Attempts to build the exact third Done
card stayed inside canonical product RPCs, but handoff cards correctly remained
Draft until bootstrap and a real provider turn did not settle reproducibly. A
three-card capture with two Draft and one Done measured a different product
state and was discarded. No SQLite writes or false supersession were used. All
temporary threads were deleted with canonical commands or removed with their
isolated state directory, and browser exit gates reached zero. P8 Kanban remains
scored pending a retained exact three-Done recapture.

## Current empty Projects overview dark audit

A fresh commit-bounded Browser run used one isolated backend, dark `1280x820`
DPR 1, the same `github` project row, provider-update overlay, and real visible
`Kanban` navigation control in both clients. The current canonical snapshot has
zero Kanban tasks, so both renderers show the same empty overview. Whole-frame
MAE is `0.6836233909214092%`; both PNG dimensions and runtime viewports are
exact, page-error buffers are empty, and Lynx-for-Web has only the named
upstream initialization warning.

This does not supersede the old P8-Q2 Projects cell. Its recorded snapshot SHA
and notes describe populated project and Chats columns, while the current seed
is a different 0-task fixture. The retained audit lives at
`shots/2026-09-02/projects-overview-current-empty/`; the historical
`2.7367782809261914%` Browser pair and its Native sibling remain scored pending
an exact populated-fixture recapture.

## Plugin Library search-height correction

The retained Plugin Skills pair showed a local, independently attributable
search-control mismatch: Electron's responsive InputGroup is 32px high at the
wide viewport while Lynx fixed its shell and inner input to 42px and 40px.
Commit `f1a2f6cb7` changes those Lynx values to 32px and 30px and increases the
following margin from 13px to 23px, preserving the already-aligned Skills
heading and grid positions. Focused coverage passes 3/3, the ReactLynx scanner
reports zero issues, and committed-tree Lynx-for-Web and Desktop builds pass.

A new visual pair was not retained: repeated agent-browser daemon startup
failed with `EAGAIN` before the UI interaction could be performed. Browser
cleanup was independently verified after each failure. The existing Plugin
Skills pair remains scored until a later stable matched recapture measures the
post-fix frame.

The same retained pair exposed a second independent header issue: Lynx gave
both its spacer and provider viewport `flex: 1`, splitting the remaining width
and clipping the provider list after Pi. Electron uses one flex spacer followed
by an intrinsic-width provider rail. Commit `ce28e45e8` changes the Lynx rail to
`flex: none`, `width: max-content`, and `max-width: 100%`, retaining horizontal
scrolling as a narrow-width fallback. The new source contract and ReactLynx
scanner pass, as does the committed-tree Lynx-for-Web build. The focused Rstest runner was terminated by system resource
pressure before assertions, so this boundary remains pending a clean test rerun
and matched screenshot rather than being called visually certified.

The grid audit also found that Lynx rendered every installed badge with full
border and icon opacity while Electron uses `border-border/40` and
`text-muted-foreground/60`. Commit `a6d93fed6` maps those exact alpha semantics
to Lynx `color-mix(...)` tokens. Its source contract, ReactLynx scan, and diff
check pass; the change remains grouped into the pending post-fix Plugin Skills
visual recapture.

Provider pills also retained a narrower Lynx-only internal rhythm: 4px icon gap
and 8px horizontal padding versus Electron's 6px and 10px. Commit `4619a6e95`
matches those exact values while preserving the 28px capsule height. The source
contract, ReactLynx scanner, and diff check pass; this remains grouped into the
pending Plugin Skills visual recapture.

The retained header also showed Lynx rounded secondary pills where Electron uses
40px text tabs with a 2px active underline. Commit `2ee373f92` adds a
Plugin-local tab class and active modifier with Electron's exact height, 12px
gap, transparent background, square corners, and underline treatment without
changing the global Button primitive. Source contracts, the ReactLynx scanner,
and diff check pass; this remains part of the pending grouped recapture.

The active provider pill was also a direct token mismatch: Electron uses a
foreground solid fill with surface-colored text, while Lynx inherited the
generic secondary-gray button. Commit `cb5a7e91e` adds a Plugin-local active
provider modifier with the Electron tokens and leaves global Button behavior
and inactive/disabled providers unchanged. Source contracts, the ReactLynx
scanner, and diff check pass; it remains grouped into the pending Plugin Skills
visual recapture.

The combined correction stack was then verified from a detached clean worktree
at committed `38cb5da1f`. `bun install --frozen-lockfile --ignore-scripts` and
`bun run build:web` both completed successfully. Inspection of the generated
Lynx-for-Web bundle confirms the current 40px/12px tab geometry, intrinsic
capped provider rail, 6px/10px provider-button rhythm, foreground/surface active
provider tokens, 32px/30px search geometry with a 23px following margin, and
the installed-badge `color-mix` rules. This closes the combined production-build
boundary only; it does not supersede the retained `2.123356298820341%` visual
pair or claim visual certification before an exact matched recapture.

## Current Composer token capture-state correction

A direct audit of all four retained
`2026-09-02--composer-tokens-1280-current` pairs disproved their notes' claim
that the renderers shared one transcript and renderer-local state. Every Web
frame contains a `1 selection` chip and fewer transcript messages. Every
Lynx-for-Web frame omits that chip and contains later recovery/watchdog user and
assistant messages. Those differences dominate the menu and selected-token
whole-frame MAEs and cannot measure token fidelity.

An exact harness issue now matches only that story's `skill-menu`,
`mention-menu`, `skill-selected`, and `mention-selected` `web:lynx` pairs. It
preserves persisted-token evidence, any Native sibling, and the older token
samples already governed by the current replacement boundary. Fidelity-loss
logic passes `62/62`; accepted count changes from 153 to 149, rolling median
from `0.6448107988835652%` to `0.5578416427546629%`, and total loss from
`8.658511436259841` to `8.354119389808682`.

## P9 Composer default landing supersession

The P9 Composer default Browser pair is internally matched, but its screenshot
records the old 264px Lynx sidebar and vertically displaced landing stack. The
later `180a6b27` evidence covers the same light `1280x820` DPR 1 New Chat state:
empty draft, no selected project, Plan off, Fast off, no provider banner, and no
Environment overlay. It proves exact 256px sidebar / 1024px main ownership and
subpixel-aligned heading and composer anchors.

An exact product supersession therefore retires only
`2026-08-03--p9-u5-composer--browser--default`, state `screenshot`, pair
`web:lynx`. P9 menus, tokens, Extras, project picker, attachment, and Native
cells remain untouched. Fidelity-loss logic passes `63/63`; accepted count
changes from 149 to 148 while the rolling median and total loss remain
`0.5578416427546629%` and `8.354119389808682`.

## Composer provider activation supersession

The `bc4a1b295` provider-activation Browser pair is not a current visual
residual: its Web frame renders seven real OpenCode models while Lynx-for-Web
still shows only the static `OpenAI GPT-5` fallback. The immediately following
`6c6392f1e` retained pair keeps the same light `1280x820` provider/status state
and hydrates those same seven OpenCode models into both clients.

An exact supersession retires only
`2026-08-11--current-head-composer-provider-activation-light-1280`, state
`models`, pair `web:lynx`. The replacement dynamic-model pair, other provider
activation states, and Native evidence remain scored. Fidelity-loss logic passes
`65/65`; accepted count changes from 147 to 146, rolling median becomes
`0.5514469253148414%`, and total loss becomes `8.331737878769307`.

## Settings Search Native state correction

The Settings Search capture metadata explicitly labels Lynx-for-Web as
`interactionState: filtered` with the `Archived / Archived threads` result,
while Native is `interactionState: default` and its notes say filtered Native
interaction was not claimed. Their `raw` whole-frame pair therefore compares
different UI states and cannot measure Native parity.

An exact `story + raw + lynx:native` harness rule excludes only that pair. Web
filtered interaction, Native default anatomy, and focused search/input evidence
remain intact. Fidelity-loss logic passes `66/66`; accepted count changes from
146 to 145 while rolling median and total loss remain
`0.5514469253148414%` and `8.331737878769307`.

## Integrations dark Native supersession

The existing Integrations Native supersession covered only the August 5
light/current path. The dark `1440x900` sibling's metadata confirms the same
old `empty-connections` surface, captured before `9962bf8a9` completed the
responsive collections, project selection, disclosure state, input metadata,
and full empty/create workflow.

The supersession now names both old Integrations prefixes while remaining
strictly `lynx:native`. Browser overlay classifications and the later connected
row evidence remain independent. Fidelity-loss logic passes `69/69`; accepted
count changes from 143 to 142 while rolling median and total loss remain
`0.5514469253148414%` and `8.331737878769307`.

## AppSnap dark Native supersession

The existing AppSnap Native product supersession covered only the August 5
light/current path even though the dark `1440x900` sibling records the same
retired `unavailable` capability state. Commit `6cf595b46` and later exact-owned
AppSnap evidence establish the replacement Native behavior independently of
theme: real permission state, shortcut listener, capture sound, destination,
capture attachment, restart recovery, and explicit cleanup.

The supersession now names both old AppSnap story prefixes while remaining
strictly `lynx:native`; Browser overlay mismatches and later AppSnap evidence
are untouched. Fidelity-loss logic passes `68/68`; accepted count changes from
144 to 143 while rolling median and total loss remain
`0.5514469253148414%` and `8.331737878769307`.

## P8 Pull Requests light Native supersession

The P8 light `1280x820` Pull Requests Native pair predates the final route
title, inset, pill radius, project-filter glyph, and refresh glyph composition.
Commit `544d49bc0` retains the same light `1280x820` default All/Open empty-list
state in Lynx-for-Web and exact-owned Native after those fixes, with real Native
sidebar navigation and an empty console.

The supersession is limited to the old `light-1280`, `raw`, `lynx:native` pair.
Dark and 1440px P8 cells, Browser siblings, P10 matrix evidence, and the later
replacement remain scored. Fidelity-loss logic passes `67/67`; accepted count
changes from 145 to 144 while rolling median and total loss remain
`0.5514469253148414%` and `8.331737878769307`.

The even earlier `2026-08-02--harness--composer` light Browser pair represents
the same empty New Chat semantic state and records the old Lynx `+8px`
horizontal / `+7.25px` vertical composer and tray offsets in its own notes. The
same `180a6b27` landing evidence therefore supersedes only that story's `light`
`web:lynx` pair. Traits-menu, filtered-skill, selected-chip, and Native evidence
remain outside the rule. Fidelity-loss logic passes `64/64`; accepted count
changes from 148 to 147, with rolling median and total loss unchanged.
