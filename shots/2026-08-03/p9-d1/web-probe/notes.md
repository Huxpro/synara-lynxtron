# P9-D1 — Lynx-for-Web host input probe

## Scope

This is the browser-harnessable half of P9-D1. It proves that the probe's
ReactLynx bindings compile and records which events cross the Lynx-for-Web
custom-element boundary under real browser input. It does not certify native
Lynxtron host delivery.

The probe is a separate build entry selected by
`SYNARA_HOST_INPUT_PROBE=1`. It is not imported by the product
`src/app/index.tsx`, `App.tsx`, or `router.tsx`, and therefore does not add a
diagnostic route to the six-screen production graph.

## Harness identity

- Build: `bun run build:probe:host-input:web`
- Bundle: `apps/lynx/output/probes/host-input/web/main.web.bundle`
- Bundle size: 102.1 kB
- Static server: owned `127.0.0.1:49321`
- Browser session: `synara-p9-d1-probe-final`
- URL: `http://127.0.0.1:49321/`
- Viewport: `1280×820`, visual viewport `1280×820`, DPR 1
- PNG: `final.png`, `1280×820`
- PNG SHA-256:
  `a758848d28c9a1541b335d1fae3a4e243a08a7cffec1e77907a2f49ac9d52ab9`

## Result

`final-state.json` is the machine-readable authority:

- Binding existence: **25/25**
- Event delivery: **9/25 event categories**
- Positive real-input delivery:
  - textarea `focus` / `blur`
  - textarea `input` and `input:committed` (9 calls; final value
    `中文 input\n`, `isComposing=false`)
  - view-control `mousedown` / `mouseup` / `tap`
  - host window `focus` / `blur`, forwarded with the LynxView
    `sendGlobalEvent` API
- Not delivered in this Web run:
  - view-control focus/blur and Enter/Space/Arrow/Escape/Tab keydown
  - textarea Enter/Arrow/Escape keydown
  - `input:composing`
  - view-control mouseenter/mouseleave
  - nested `scroll-view` scroll

The scroll probe had `scroll-y="true"`, computed `overflow-y: scroll`,
`scrollHeight=360`, and `clientHeight=118`. Three real CDP wheel steps moved
the outer page to 16 px but left the nested host at `scrollTop=0`; no
`bindscroll` arrived. This is a Web/custom-element or automation-path negative,
not a Native product regression. Native product wheel/list publication already
has older positive evidence and must be re-certified in the P9-D1 Native batch.

The browser typed CJK characters directly; it did not operate a macOS IME
composition session. Therefore `input:composing` remains **Native-only and
unverified**, rather than a negative IME conclusion.

## Console

- Page errors: none (`errors.txt` is empty).
- One upstream initialization deprecation warning remains in `console.txt`.
- No probe handler exception occurred.

## Invalid attempts

- The first interaction chain reused an accessibility ref after Tab changed
  focus and ended on `about:blank`; its screenshot was deleted and is not
  evidence.
- `agent-browser fill` changed the internal DOM value without publishing
  Lynx `bindinput`; the retained run used `keyboard type`, which produced nine
  real `bindinput` deliveries.
- No programmatic `dispatchEvent`, `scrollTop` assignment, or synthetic
  composition event is counted as event-delivery proof.
