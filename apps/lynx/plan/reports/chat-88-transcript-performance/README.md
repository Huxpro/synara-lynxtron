# Chat #88: transcript rendering and size hints

The row boundary now uses normal ReactLynx `memo`, the existing upstream
`useStableCallback`, stable selection handlers and a per-row pinned boolean.
The card action context is stable while its semantic state is unchanged. No
custom comparator hides text, edit, selection, pin or action changes.

## Measured Native streaming

Both profiling runs use the same background desktop harness, 1079×803, dark,
chat font 13, and the same deterministic provider protocol: 100 normally
completed turns followed by 200 text deltas at 50ms intervals. These are real
adapter/store/render events, not a live-model benchmark or injected app state.

| Metric                             |   Baseline |      Final |
| ---------------------------------- | ---------: | ---------: |
| Completed messages                 |        202 |        202 |
| Rows at profiling stop             |        202 |        203 |
| Parent renders                     |        107 |        116 |
| Total row renders                  |      21993 |        714 |
| Unchanged-history row renders      |      21576 |        600 |
| Positive main-thread rAF intervals |       1251 |       1267 |
| p50 / p95 / p99 (ms)               | 8 / 9 / 13 | 8 / 9 / 14 |
| Maximum interval (ms)              |        342 |         44 |

[Raw baseline](baseline.json), [raw final](optimized.json), and [summary](summary.json).
The final sample still includes a transient working row at stop; this is not a
claim that both settled lists contain exactly the same number of rows. The same
200 historical messages were counted individually in each run. Total and
history renders drop by 96.8% and 97.2%. This is one paired benchmark, not a
three-repetition performance certificate. The p99 did not improve.

Pipeline observation registered but returned zero matching samples. An earlier
pipeline-only attempt could not measure frame time; its raw report remains in
`/tmp/synara-chat88-proof/baseline1.json`. The successful second method uses real
main-thread `requestAnimationFrame` callbacks through `runOnMainThread`, with no
timer fallback. Zero intervals from timestamp resolution are retained in raw
reports and excluded from nearest-rank percentiles. These are callback
intervals, not GPU paint timings. [First console drain](profile-console.log)
contains no bracketed runtime errors.

Profiling requires an explicit `SYNARA_TRANSCRIPT_PROFILE=1` build. The default
build disables the collector. Reproduce with an isolated certified pair:

```sh
SYNARA_TRANSCRIPT_PROFILE=1 bun run compare:desktop --lynx-devtool-port 18902 --width 1079 --height 803 --chat-font-size 13
# In a second shell after certification; run one comparison harness at a time.
node apps/lynx/scripts/transcript-performance-desktop.mjs --out /tmp/chat88.json
```

The script uses normal RPC/provider events, restores the provider setting in
independent cleanup steps, deletes its own fixture thread and writes failures
as evidence. It never foregrounds either app. The recommendation is to keep
these local changes and avoid adding virtualization: this measurement does not
establish a need for another virtualizer or a measurement/follow feedback loop.

## Estimated height

The existing cached Markdown tree supplies tight/loose structure; the estimate
reuses `getChatTranscriptLineHeightPx`, `resolveMarkdownChildSpacing`, table
column weights and the existing changed-file preview limit. Code/header,
table-cell and default expanded changes-card chrome contribute to the hint.
No Markdown is reparsed for this calculation. The transient no-tree fallback
counts line boxes without inventing block gaps for every newline.

The canonical 40-item list now estimates 1073px against 1081px actually measured
on Native, down from 1894px (0.7% error). [Height comparison](height-comparison.json)
records all eight hints, the actual mounted rows, and all eight ordinary-build heights at 1440×900 / font 13. Every canonical hint is within 8.9% of its actual Native height; the largest absolute error is 11.6px. The old values were
calculated by the pre-change function on the same canonical messages, not
copied from the issue's historical 1950/831 example. These are approximate size
hints, not the separate ≤2px Native/Electron layout certificate. Expansion,
attachments and viewport-specific wrapping can still change actual row sizes.
The profiling-only `__synaraTranscriptProfile.estimates()` exposes current
numeric hints; actual heights come from `DOM.getDocumentWithBoxModel` list items.

## Verification

[Native tests](units.log): 429 files, 1811 tests, zero failures. Focused tests
cover unchanged-row memo skips, semantic prop changes, tight versus loose
lists, font scaling, table/code chrome and changes-card suppression while a
turn is running. [Affected upstream Vitest](vitest.log): 69/69.
[Native types](native-types.log), [reuse](reuse.log), [style](style.log), and
[upstream footprint](footprint.log) pass. An initial reuse check correctly
reported a stale generated inventory; it was regenerated and passed.

The ordinary 1440×900 / font 13 build confirms the [collector is absent](production-profile-disabled.json).
[Thread cell](thread.json): 41/45 controls within 2px plus four existing named
trail hit-area exemptions. [Canonical formats](formats-canonical-dark.json):
5/8 row heights and 19/30 paired controls; remaining row deltas +2.1, −8.7,
−5px and two file-control width deltas of −26px remain open, not platform exemptions.

Paired [J1 excluding only Stop](J1.json), [J2](J2.json), and [J7](J7.json) pass once on the ordinary build. The thread cell’s first Native console drain and Electron error list are empty. The later [post-reload Native drain](console-final.log) is empty but unavailable as an independent zero-error certificate, because the app’s backlog was already drained.
The [initial J7 preflight](J7-initial.json) fails before any provider turn because
its fixed display name no longer exists. The current [catalog](J7-catalog.log)
shows “Sonnet” resolving to the same required `claude-sonnet-5-5`. A first
[global display-name adaptation](J7-label-failure.json) passes Electron but fails
Native's picker. A background DOM inspection confirms Native still displays its
explicit “Claude Sonnet 5.5” preset, while Electron shows “Claude Sonnet”. This
label difference is retained, not hidden as product parity. The Lynx-only
`chat-handoff-workflow.mjs` adapter adapts Electron display-name matching in memory while retaining the Native preset name,
guards the exact resolved model and upstream seams, and keeps every original
J7 step. [Adapter guards](harness-tests.log): 3/3. No provider/model choice is changed.

[Root typecheck](root-types.log): 8/8. [Root lint](lint.log): 1304 warnings, zero errors.
[Root format](fmt.log) passes. No upstream-owned file is changed.
The eight configurations, full row-type fixture, 24/24 and 28/28 matrices and
three consecutive paired workflows remain overall acceptance work.
