# Empty-thread project heading current-head fidelity

## Harness

- Shared isolated server: `ws://127.0.0.1:58960`.
- Shared origin: `http://127.0.0.1:10093`.
- Canonical fixture: project `project-environment-current`, thread
  `thread-environment-current`, workspace
  `/private/tmp/synara-environment-current-workspace`; both records were
  created through `orchestration.dispatchCommand`.
- Web route: `/thread-environment-current`.
- Lynx-for-Web route:
  `/lynx/index.html?route=/thread/thread-environment-current`.
- Separate named `agent-browser` sessions used `1280x820`, DPR 1. Both PNGs
  are exactly `1280x820`.
- The Lynx target exposes the expected `X-VIEW` root with current light,
  comfortable, and wide viewport classes. The only console message is the
  named upstream Web Elements deprecated-initialization warning.

## Residual

The current real project name `Environment Current` exposed a stale fixed-width
contract in the Lynx adapter:

- Web heading: `545.25x34.5`, one line.
- Lynx before repair: `400x70`, two lines.
- The two-line heading expanded the empty-thread stack from the Web-compatible
  approximately 244px rhythm to 279px and displaced the Composer group.

The existing focused test incorrectly described the `400px` width as a
one-line guarantee, so its green result did not cover the actual product copy.

## Repair and result

`CenteredEmptyLandingFrame` now maps Web's `mx-auto max-w-[46rem]` chat frame:
it is full-width up to `736px`, border-box sized, and centered in its parent.
The project-specific heading fills that frame instead of owning a hard-coded
`400px` width. The compact viewport override remains unchanged.

Final geometry:

| Anchor | Web | Lynx-for-Web |
| --- | --- | --- |
| Frame | `400/351.25/736/110.5` | `400/311/736/111` |
| Heading | `495.375/407.25/545.25/34.5` | `424/367/688/35` |
| Composer surface | `400/461.75/736/95` | `400/422/736/95` |

The vertical coordinates differ because Web and Lynx displayed different
provider-health heights during these fresh sessions; they are not used as a
paired residual. The repaired contract is the independently observable
horizontal anatomy: frame and Composer share `x=400`, `width=736`; the heading
is one 35px line and remains centered inside the same rail. Web sizes the text
intrinsically while Lynx exposes the centered heading container.

Focused `ThreadEmptyLanding.lynx.test.tsx` passes 3/3, and the final
Lynx-for-Web production build succeeds.
