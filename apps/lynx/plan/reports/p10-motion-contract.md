# P10 motion and temporal fidelity contract

Status: in progress

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

| Surface | Current consumer | Required sample points | Current proof | P10 gap |
| --- | --- | --- | --- | --- |
| Disclosure open/close | Sidebar project/chats, collapsed work | 0/80/160/220ms + end | source/tests, older Sidebar timing | current-build sequence |
| Popover/menu open/close | Project Picker, Extras, model/trait, Command K | 0/80/160/220ms + end | static end states | temporal sequence |
| Submenu/group disclosure | model provider groups | 0/80/160/220ms | source state classes | temporal sequence |
| Hover | view-backed controls | entry and stable frame | source/older runtime | current specimens |
| Pressed | view-backed controls | pointer down and release | source/older runtime | current specimens |
| Selected transition | menu/tab/segmented/switch | before/after + intermediate if animated | static selected evidence | current sequence |
| Composer height/content | attachments/tokens/multiline | before/intermediate/end | behavior tests | temporal evidence |
| Loading→content | route and picker states | loading/end | source state compositions | temporal evidence |
| Sidebar expansion | project/chats sections | 0/80/160/220/end | older timing proof | current sequence |
| Collapsed work | transcript disclosure | 0/80/160/220/end | product consumer + older proof | current sequence |
| Focus ring | enabled view-backed controls | before/focused | source classes | current runtime where host publishes focus |
| Reduced motion | disclosure/chevron | start/end | source/tests | current runtime or deterministic style proof |

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

P7-I4 retained a real Native Sidebar close sequence: closed state observed at
approximately 4.93ms, body present at 100ms, absent at 320ms. That evidence
establishes the platform contract but predates P10 calibration and is not the
final current-build certification.

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

## Remaining gate

Phase 4 is complete only when every required temporal surface above has
current-build proof, no route has instant-vs-animated mismatch, reduced motion
is certified, and transcript follow/measurement tests remain green.
