# Native Polyfills, User Input, And Composer Fidelity

## New Scope

- JavaScript runtime error handling on the exact Native Lynx background runtime;
- real authenticated Claude Max `AskUserQuestion` lifecycle;
- thread composer vertical anchor and model/effort typography;
- Web authority, trusted-origin Lynx-for-Web, and exact-owned Native;
- light theme; browser clients `1280x820`, DPR `1`; Native content
  `1250x896`.

No provider fixture or direct SQLite mutation was used. Temporary threads were
created, answered, stopped, and deleted through canonical orchestration
commands.

## Polyfill Audit

The reported Native error was:

`Cannot read properties of undefined (reading 'toLowerCase')`

This is not a missing `String.prototype.toLowerCase` polyfill. A missing method
would report that `toLowerCase` is not a function; this error says the receiver
was `undefined`.

Official Lynx documentation confirms:

- SWC transforms syntax but does not make arbitrary runtime data valid;
- Lynx documents its built-in/polyfilled APIs separately;
- the bundled Lynx polyfills are injected only on iOS;
- project-specific global polyfills should use Rspeedy `source.preEntry`.

LynxBase OnCall asset `6b3fd896-978a-4da4-a881-a1c7e34bd9ac` describes the
same failure class: downstream code assumes data exists and reads a property
from `undefined`; the fix is to validate the data boundary.

The existing targeted polyfills were moved from individual app entry files to
one Rspeedy `source.preEntry`:

- `url-search-params-polyfill`;
- `Object.hasOwn`;
- UTF-8 `TextEncoder` / `TextDecoder`.

No blanket `core-js` dependency was added.

The shared shortcut parser now accepts host-shaped events whose `key` is
missing or non-string and fails closed before normalization. This covers the
Native event boundary that previously called `undefined.toLowerCase()`.

## Real Claude User Input Loss

Web authority already rendered the complete detached question card. Before
the fix, Lynx projected only pending approvals; Native showed an awaiting-input
dot and an empty main surface with no way to answer. This was a P1 functional
loss, not rendering noise.

Temporary thread:

`fidelity-claude-user-input-1787069129113`

Provider request:

- question: `Which release channel should I prepare?`;
- options: `Stable`, `Beta`;
- request id: `5b03e53f-1533-470d-b58d-6dff8dad8715`;
- lifecycle generation: `dd826356-91ff-4ee6-9635-6c926e9ccb1c`.

The Lynx thread summary now reuses `derivePendingUserInputs`, and the new panel
reuses the shared answer/progress functions for:

- single-select automatic submission;
- multi-select;
- custom text;
- multiple-question navigation;
- cancellation;
- lifecycle-generation-safe dispatch.

Native exact-session interaction selected visible `Stable` through node `165`,
box `688x20 @ (463,636)`. Canonical result:

- `user-input.resolved` sequence `587`;
- answer:
  `Which release channel should I prepare? -> Stable`;
- pending count `0`;
- session `ready`, `lastError:null`;
- Claude replied that it was preparing the Stable release.

## Composer Position And Typography

Web authority gives a normal thread composer `pb-3 sm:pb-4`, or `16px` at the
validated desktop viewport. Lynx previously rendered the composer directly
after the transcript with no corresponding bottom inset.

Native now renders:

- content height: `896`;
- composer surface: `734x93 @ (514,785)`;
- composer surface bottom: `880`;
- bottom breathing room: exactly `16px`.

Typography:

- model label `Claude Sonnet 5`: `11px / 16.5px`;
- effort label `High`: `10px / 15px`.

The effort label is intentionally one step smaller and more muted than the
model name.

## Harness Classification

- The first browser route used `/chat/$threadId`; both clients rendered the
  wrong route. Rejected as harness mismatch.
- Port `3000` belonged to an unrelated Rspeedy project. Rejected.
- An isolated `10044` static host was not a trusted server origin and correctly
  rendered Synara offline. Rejected as harness mismatch.
- Trusted-origin `8891/lynx/index.html` loaded the exact current
  `main.web.bundle` hash and had no page errors. Its only console warning was
  the known upstream Web initialization deprecation.
- Native `App.openPage` returned host `not implemented`; exact-owned launch with
  the staged bundle was used instead.
- One verification assertion expected the internal question id as the resolved
  answer key; the provider canonical activity uses the question text. Product
  behavior had passed; the assertion was corrected.

None of these harness failures is counted as product loss.

## Verification

- shared keybindings: `67/67`;
- shared pending interaction and user-input state: `25/25`;
- Lynx pending input, composer dock, and composer style tests: `9/9`;
- UTF-8 polyfill tests: `7/7`;
- Lynx-for-Web production build: passed;
- Native/Desktop production build: passed;
- staged Native bundle SHA-256:
  `1ed63b859f000e4fd28678003d1a104dfb6deed4141bac936c0f532da0551c06`;
- exact Native warning/error console: empty;
- agent-browser entry/failure/exit gates: `sessions: []`, zero owned processes;
- local repository screenshot count remained `100`.

## Sources

- https://lynxjs.org/guide/scripting-runtime/index.html#javascript-polyfills
- https://lynx.bytedance.net/3.6/zh/api/rspeedy/rspeedy.source.preentry
- LynxBase asset `01791085-e750-489d-bf9c-d5b18be6609b`
- LynxBase asset `4e5f11b2-7aab-48ce-9bb5-3d6f8bcf28d9`
- LynxBase asset `6b3fd896-978a-4da4-a881-a1c7e34bd9ac`
