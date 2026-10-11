# #89: handoff ownership and provider selection

Native copies picked image/file descriptors with the transferable draft. Shared
host capabilities remain alive while any draft or outgoing send owns them;
failed sends can restore the draft before releasing their send lease. This
extends the existing attachment bridge and draft store. No equivalent shared
host-token lease existed, so a small Lynx ownership helper was added.

Per-provider sticky selections persist through the existing storage port, using
upstream model-selection normalization. Coordinator identity comes from the
actual upstream project-agent summary hook/store, including its event and polling
lifecycle. Header, sidebar and composer refuse cross-provider handoff until that
summary is loaded, and for coordinator threads thereafter.

Current Electron semantics allow provider handoff in ordinary group threads;
only coordinator threads prohibit it. Group-container restrictions apply to
workspace handoff. This follows the current upstream availability helper rather
than the older issue wording. Multi-account selection remains separate scope.

## Live Native evidence

All actions ran against an isolated comparison home, without foregrounding an
application. Fixtures used normal RPC; no SQLite writes were made.

- [Attachment transfer](attachments.json): background Cocoa dialogs picked one
  PNG and one text file. Header handoff copied them into a new Claude thread;
  removing both from the source did not invalidate the target. Sending claimed
  both managed attachments and completed a real Claude turn.
- [Sidebar failure](sidebar-failure.json): actual background secondary click
  opened the Handoff submenu. Disabling Claude through isolated settings after
  opening it made the selected action fail visibly; the Codex source and draft
  survived. The original provider setting was restored in `finally`.
- [Busy sidebar](sidebar-busy.json): during a real provider shell `sleep 45`,
  an actual background secondary click showed no Handoff entry.
- Both owned attachment threads were [deleted through RPC](cleanup.json).
- Sticky Codex/Claude selections were observed in the Native storage file both
  before and [after the J1 renderer reload](sticky-after-reload.json). Storage
  contents unrelated to these selections were not copied into this report.

[Physical-input notes](physical-input-notes.json) preserve two harness mistakes:
wrong sidebar selector, and ambiguous duplicate thread titles. Exact thread-ID
navigation fixed the harness. A 250-line stress reply also emitted
`ContextProxy::DispatchEvent called too frequently. 2`; this is retained for #88,
not classified as a clean runtime-warning pass. A later empty console CLI reply
was unavailable evidence, not proof of zero errors.

## Browser J7 and retained harness failures

[Lynx for Web J7](web-J7g.json) passes every unchanged upstream J7 operation,
including model selection, in-place send handoff, the transcript boundary, and
both header handoffs. Page errors are empty. The same report is **not a paired
pass**: Web original times out creating the initial empty conversation.

The Lynx-scoped runner adapts the legacy browser launcher's obsolete `/thread/id`
Web route to the actual `/$threadId` route in memory, with exact source-shape
checks. Native's route remains `/thread/id`. It then requires the active fixture
thread and actual last-message ID on both clients. The old sidebar-membership
certificate alone could accept an empty page. Browser pointer hover is allowed
two animation frames before resolving and clicking the target again. Native
sidebar `data-active` is serialized explicitly as `"true"`/`"false"`; Lynx for Web
otherwise exposed both boolean attribute values as empty strings.

Run sequentially after `bun run --cwd apps/lynx build:web`:

```sh
PATH="$PWD/node_modules/.bin:$PATH" node apps/lynx/scripts/handoff-web-workflow.mjs \
  --skip-build --width 1440 --height 900 --theme dark --port-offset 745 \
  --out /tmp/chat89-web-j7.json
```

The runner exits nonzero for the retained Web-original failure and stops only
its owned headless browsers and servers. Earlier browser attempts and raw Native
failure trees remain under `/tmp/synara-chat89-proof/web-J7{b,c,e,f}.json` on the
verification machine. Route/attribute failures are harness findings, not product
regressions. A manual background CDP hover/click did create a Web-original thread,
but a reliable paired automated repetition remains unproven.

## Verification and remaining scope

[Native unit tests](units-final2.log): 428 files, 1809 tests, zero failures.
The preceding [failed run](units-final.log) had one stale source assertion for the
old boolean `data-active`; the assertion now checks its explicit string form.
[Affected upstream Vitest](vitest1.log): 19/19.
[Handoff generator guards](generator1.log): 5/5.

Live coordinator UI navigation is still unverified: Native's ordinary sidebar
excludes group containers. Shared-summary guards and fail-closed behavior have
unit coverage; this does not substitute for a real coordinator UI test.

[Root format](fmt-final3.log), [lint](lint-final.log),
[typecheck](root-types-final.log) (8/8), [Native types](native-types-final.log),
[reuse](reuse-final.log), [style](style-final.log), and
[upstream footprint](footprint-final.log) checks pass. Lint retains 1305 existing
warnings and zero errors. All implementation changes stay in `apps/lynx`.

The final bundle's [thread cell](thread.json) passes 41/45 controls within 2px,
plus four existing named trail hit-area exemptions. Electron errors and bracketed
Native console errors are empty. [Canonical formats](formats-canonical-dark.json)
pass 5/8 row heights (remaining +2.1, −8.7, −5px), with 19/30 paired controls.
Two generic file controls still differ in width by 26px; these are open
measurement differences, not platform exemptions.

Paired [J7](J7.json) and [J1 excluding only Stop](J1.json) pass once on the final
bundle. The first [J2](J2.json) passes every Native step but fails on Electron's
detached-reader tool-activity anchor leaving the viewport. This is retained;
the unchanged [paired rerun](J2-rerun.json) passes all steps on both renderers.
This is one passing paired repetition, not the final three consecutive passes. Eight configurations, 24/24 and 28/28 matrices,
and three consecutive paired workflows remain overall acceptance work.
