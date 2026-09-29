# P10 motion and temporal fidelity contract

Status: complete

Updated: 2026-08-04

## Authority

All open/close disclosure motion reuses the shared Web authority in
`apps/web/src/lib/disclosureMotion.ts` and the Native counterpart in
`apps/lynx/src/platform/motion.lynx.{ts,css}`.

Canonical timing:

- duration: 220ms;
- easing: `ease-out`;
- cleanup buffer: 40ms where exit presence is retained;
- no bounce or elastic easing;
- reduced motion: Web `transition-none`, Native `0.01ms`;
- Native implementation may differ physically, but timing, feedback, and end
  state must match.

## Platform implementation

Web:

- shell: grid-row + opacity;
- optional content drift: opacity + translateY;
- chevron: transform only;
- Base UI collapsible: height using the same 220ms contract;
- width reveal: width only where a side panel requires an inline-axis reveal.

Native:

- content: opacity + `translateY(-4px → 0)`;
- chevron: `rotate(0deg → 90deg)`;
- no grid-row interpolation;
- closed content is non-interactive;
- exit cleanup uses the shared 220ms + 40ms semantic timing.

The Native downgrade is an `INTENTIONAL_PLATFORM_DELTA`, not a second motion
language.

## Required temporal surfaces

| Surface                  | Current consumer                               | Required sample points                  | Current proof                      | P10 gap                                      |
| ------------------------ | ---------------------------------------------- | --------------------------------------- | ---------------------------------- | -------------------------------------------- |
| Disclosure open/close    | Sidebar project/chats, collapsed work          | 0/80/160/220ms + end                    | source/tests, older Sidebar timing | current-build sequence                       |
| Popover/menu open/close  | Project Picker, Extras, model/trait, Command K | 0/80/160/220ms + end                    | static end states                  | temporal sequence                            |
| Submenu/group disclosure | model provider groups                          | 0/80/160/220ms                          | source state classes               | temporal sequence                            |
| Hover                    | view-backed controls                           | entry and stable frame                  | source/older runtime               | current specimens                            |
| Pressed                  | view-backed controls                           | pointer down and release                | source/older runtime               | current specimens                            |
| Selected transition      | menu/tab/segmented/switch                      | before/after + intermediate if animated | static selected evidence           | current sequence                             |
| Composer height/content  | attachments/tokens/multiline                   | before/intermediate/end                 | behavior tests                     | temporal evidence                            |
| Loading→content          | route and picker states                        | loading/end                             | source state compositions          | temporal evidence                            |
| Sidebar expansion        | project/chats sections                         | 0/80/160/220/end                        | older timing proof                 | current sequence                             |
| Collapsed work           | transcript disclosure                          | 0/80/160/220/end                        | product consumer + older proof     | current sequence                             |
| Focus ring               | enabled view-backed controls                   | before/focused                          | source classes                     | current runtime where host publishes focus   |
| Reduced motion           | disclosure/chevron                             | start/end                               | source/tests                       | current runtime or deterministic style proof |

## Transcript guardrails

- auto-follow is driven by real transcript content, not generic working,
  buffering, reconnecting, approval, or tool-only state;
- tool/work rows do not retrigger the message-arrival stick path;
- list measurement does not feed another bottom-stick loop;
- transcript disclosure exit presence may be disabled when retained exit nodes
  would perturb native list measurement;
- reduced motion must not alter final scroll or focus state.

## Existing verification

Current tests prove:

- Web open/closed classes, chevron rotation, pointer-events, 220ms/ease-out,
  and reduced-motion declarations;
- Native 220ms/40ms timing and open/closed/chevron class projection.

P10 current-build sequences are retained under
`shots/2026-08-04/p10-perceptual-fidelity/specimens/runtime/`:

- Sidebar close: samples at approximately 13/93/173/232ms retain the closed
  body and its exit trajectory; the body is absent at 334ms after the shared
  220ms + 40ms cleanup contract.
- Sidebar open: samples at approximately 19/94/176/235ms retain the open body;
  the stable 243×90 end frame is present at 335ms.
- Collapsed work: the 728×32 panel follows the open transform trajectory
  through 220ms. Close removes it immediately because
  `preserveOnClose=false` protects Native list measurement and transcript
  follow from exit-node feedback.
- Composer menus: Web and Native intentionally use instant presence rather than
  disclosure motion. Open samples at approximately 20/98/178/235ms retain an
  identical 142×109 box; close samples at approximately 14/96/173/234ms remain
  absent. There is no instant-vs-animated cross-platform mismatch.
- Pressed feedback: Native command-row pointer down publishes `ui-pressed` and
  opacity `0.72` without changing its 716×28 box; release clears the row through
  the real product action.
- Reduced motion: current Web and Native focused tests retain
  `transition-none` and `0.01ms` fallbacks with identical final states.
- Transcript guardrails: current Web auto-follow/timeline suites pass 175
  tests and Native thread-state suites pass 5 tests. Non-message working/tool
  activity leaves the message signal stable, while loading/error states retain
  last-known-good transcript rows instead of creating a measurement/follow
  feedback path.

## Evidence format

Every retained P10 temporal specimen records:

- build and snapshot identity;
- route/theme/size/density;
- trigger state and interaction path;
- fixed timestamps or short frame sequence;
- relevant geometry/style values per frame;
- console result;
- reduced-motion mode;
- final static frame and residual disposition.

## Completion

The current-build specimen SSOT is
`shots/2026-08-04/p10-perceptual-fidelity/specimens/manifest.json`.
`apps/lynx/scripts/specimen-evidence.mjs` requires all 12 temporal surfaces and
their applicable samples. Strict verification reports
**12 temporal surfaces / 0 incomplete**.

Focused interaction, disclosure, system-state, and transcript guardrail suites
remain green. Host Tab focus and inconsistent Native/Lynx mouseenter delivery
are explicit platform deltas rather than fabricated temporal proof. No open
P0/P1 motion residual remains.
