# Claude Resume Transcript Live Edge

## New Scope

- screen: completed chat transcript;
- provider: authenticated Claude Max through `claudeAgent`;
- state: first successful turn, explicit session stop, successful resumed turn;
- content: two user messages and two Markdown assistant replies;
- theme: light;
- viewport: Web and Lynx-for-Web `900x650`, DPR `1`; Native `900x650`
  logical and `1800x1300` physical;
- interaction: open the completed thread from the real Native sidebar and land
  at the latest assistant response.

No provider fixture or direct SQLite write was used.

## Canonical Provider Lifecycle

The temporary thread
`fidelity-claude-resume-1787060241031` was created through
`orchestration.dispatchCommand` in project `Home`.

The real sequence was:

1. `thread.create` with `claude-sonnet-4-6`;
2. first `thread.turn.start`;
3. assistant reply:
   `## Connection confirmed` and
   `Claude Max is responding through Synara.`;
4. `thread.session.stop` reached `stopped`;
5. second `thread.turn.start` on the same thread;
6. assistant reply:
   `## Session resumed` and
   `The same Claude thread continued after an explicit stop.`;
7. final session `ready`, `activeTurnId:null`, `lastError:null`;
8. both durable turns completed successfully.

The first turn also emitted an informational Claude cache diagnostic about an
uncached fresh-session prompt. It did not fail the turn and is provider
diagnostic state, not product loss.

## Identity Preflight

All retained comparisons used the same server at `127.0.0.1:58090`, the same
thread snapshot, light theme, and `900x650` viewport.

Web authority:

- route:
  `/fidelity-claude-resume-1787060241031`;
- screenshot: exactly `900x650`;
- transcript viewport: `644x513`;
- latest assistant heading at `y=390`;
- latest assistant body at `y=423.625`;
- page errors empty.

Lynx-for-Web:

- route:
  `/lynx/index.html?route=%2Fthread%2Ffidelity-claude-resume-1787060241031`;
- screenshot: exactly `900x650`;
- root resolved light at `900x650`;
- latest assistant reply visibly rendered above the composer;
- page errors empty.

Exact-owned Native:

- final PID `76996`;
- PID-derived DevTool client `localhost:8902`, session `1`;
- staged production bundle:
  `apps/lynx/dist/desktop/main.lynx.bundle`;
- final bundle SHA-256:
  `b4f2830bd7c8923d5e31f0c3b1a3510e3c49ba594ff5da979bea1c5085d68867`;
- root:
  `SliceRoot--theme-light`, `900x650`;
- transcript: `616x493 @ (272,62)`;
- composer: `616x95 @ (272,555)`;
- one established product socket to `127.0.0.1:58090`;
- warning/error console empty.

## P1 Product Loss

Before the fix, Web authority and Lynx-for-Web opened the completed thread at
the live edge and showed the latest assistant response.

Native rendered all four messages in its DOM but opened at an older position:

- latest user heading: `y=444`;
- latest user body: `y=483`;
- latest assistant heading: `y=565`;
- latest assistant body: `y=607`;
- composer began at `y=555`.

The newest assistant response therefore existed but was hidden behind and
below the composer. A user opening a completed Claude thread saw their latest
question without the answer. This was a P1 product loss, not missing data,
provider state, rendering noise, or a capture mismatch.

## Root Cause

`buildTranscriptScrollToBottomParams` omitted the required `alignTo` parameter
from Lynx `<list>.scrollToPosition` and used a `1_000_000` positive offset to
try to force platform clamping.

The official Lynx `<list>` contract requires:

- `position`: target child index;
- `alignTo`: target alignment (`top`, `middle`, or `bottom`);
- `offset`: additional distance after alignment.

On Lynxtron PC, the undocumented offset-clamp approximation did not align the
last row. Three timing hypotheses were independently rejected on real Native:

- a delayed mount retry;
- a synchronous first-layout retry;
- a first-layout retry deferred to the next task.

All produced the same incorrect frame. They were removed rather than retained
as complexity.

## Fix

The shared Native scroll command now follows the documented contract:

```text
position: final list item
alignTo: bottom
offset: 0
smooth: false
```

No height measurement, virtualizer measurement, polling loop, or
measure/scroll feedback cycle was added.

## Post-Fix Result

Native now opens the same completed thread at its live edge:

- latest assistant content:
  `608x117 @ (271,70)`;
- latest heading and body are fully visible;
- the intentional Native `Reference whole message` fallback is visible below
  the reply;
- composer remains at `y=555`;
- exact-client warning/error console remains empty.

Web and Lynx-for-Web still show the latest assistant response with no page
errors. The fix changes only the Native `<list>` command parameters.

## Intentional Platform Delta

Native exposes `Reference whole message` because arbitrary text-range selection
on Lynxtron PC is an already documented engine blocker: invoking
`getSelectedText` can terminate the host. Web retains arbitrary range
selection. This fallback is intentionally separate and was not counted as a
new loss in this loop.

## Harness Losses

- Lynxtron `App.openPage` returned `not implemented`. The frame was rejected as
  navigation evidence; the retained Native path used real rendered controls:
  Settings Appearance, Back to app, and the sidebar thread row.
- Native DevTool Runtime evaluation had no `document` global, so it could not
  be used to invoke the list directly. Product verification used a rebuilt
  staged bundle and exact-client screenshots instead.
- A shadow-root probe ran after canonical thread deletion and therefore had no
  transcript content. It was rejected rather than mixed with retained state.

None of these harness failures is attributed to product behavior.

## Verification And Cleanup

- focused transcript tests: `13/13`;
- Native/Desktop production build: passed;
- Lynx-for-Web production build: passed;
- Web and Lynx-for-Web page errors: empty;
- exact-owned Native warning/error console: empty;
- every failed or interrupted browser/DevTool attempt was followed by
  `browser:gate`;
- final browser workflows returned `sessions: []` and zero
  agent-browser-owned processes;
- no repository screenshot was added;
- repository screenshot count remained `100`.

The app left the temporary thread through the real `New thread` control. The
temporary thread was then canonically stopped and deleted:

- `deletedAt: 2026-08-18T14:05:46.031Z`;
- final snapshot sequence: `388`.
- final full snapshot: thread omitted (`exists:false`).

Product contribution: `1.00 -> 0.00`.
