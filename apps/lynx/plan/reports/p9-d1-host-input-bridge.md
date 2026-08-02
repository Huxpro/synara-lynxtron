# P9-D1 — Host/Input-Bridge Investigation

**Status: blocked on one real macOS IME composition cell**

## Objective and boundary

P9-D1 inventories the macOS/Lynxtron input boundary for normal Synara UI:
view focus and keyboard, native textarea input and composition, pointer,
scroll, and host window focus. Terminal, embedded browser, PDF, voice,
VoiceOver/AX exposure, background global shortcuts, and non-macOS hosts remain
out of scope.

This is an investigation task. It does not patch Lynxtron or enter P9-R1.

## Three transport paths

1. **Application menu accelerators**
   - Host-owned shortcuts call `sendGlobalEvent('shell:command', ...)` or route
     dispatch.
   - They do not require a focused Lynx view.
2. **`-lynx-invoke` request bridge**
   - Lynx calls host services through `NativeModules.bridge.call`.
   - It is Lynx → host request/reply, not passive host input publication.
   - The probe uses this path only to persist its matrix.
3. **Lynx built-in and global events**
   - `bindfocus`, `bindblur`, `bindkeydown`, `bindinput`, pointer bindings, and
     `bindscroll` depend on the runtime host actually publishing an event.
   - Host window focus/blur is forwarded as an explicit GlobalEventEmitter
     event in probe mode.

Types, DOM attributes, unit handlers, and fulfilled node commands prove wiring;
they do not prove host delivery.

## Probe implementation

- Pure matrix: `src/app/HostInputProbe.logic.ts`
- Separate UI entry: `src/app/host-input-probe-index.tsx`
- Web host: `src/main/web/host-input-probe-host.ts`
- Native report seam: explicit `SYNARA_HOST_INPUT_PROBE_REPORT`
- Web build: `bun run build:probe:host-input:web`
- Native build: `bun run build:probe:host-input:native`

`SYNARA_HOST_INPUT_PROBE=1` selects the probe at build time. Default Web,
Lynx, and Desktop artifacts were rebuilt and checked to contain no probe
markers.

## Event matrix

| Source | Event | Web | Native | Conclusion |
|---|---|---:|---:|---|
| view control | focus / blur | no | no | host focus bridge gap; real Tab/Shift+Tab does not publish |
| view control | Enter / Space | no | no | handler wiring exists; no host key delivery |
| view control | ArrowUp / ArrowDown / Escape / Tab | no | no | no host key delivery |
| view control | mouseenter / mouseleave | no | yes | Native host publishes hover boundary |
| view control | mousedown / mouseup / tap | yes | yes | positive on both runtimes |
| textarea | focus | yes | yes | positive on both runtimes |
| textarea | blur | yes | not isolated | Native window blur did not blur the textarea during retained sequence |
| textarea | Enter / ArrowUp / ArrowDown / Escape | no | no | textarea kernel consumes keys before Lynx JS |
| textarea | ordinary input | yes | yes | committed `bindinput` positive |
| textarea | `isComposing=true` | not a real IME run | blocked | no valid user-path evidence |
| textarea | committed input | yes | yes | Web 9 calls; Native 13 calls |
| scroll-view | wheel → scroll | no | yes | Native 3 events; final `scrollTop=242` |
| host | window focus / blur | yes | yes | explicit host global-event bridge works |

The Native retained matrix is **25/25 bindings, 11/25 delivered categories**.
The Web retained matrix is **25/25 bindings, 9/25 delivered categories**.
Undelivered categories are not all bugs: some are negative product conclusions,
while real IME remains unverified because the harness could not deliver it.

## Native evidence

Retained evidence: `shots/2026-08-03/p9-d1/native-probe/`.

- Exact process: repo Lynxtron 0.0.7; DevTool client derived from owned PID as
  `localhost:8903`, session 1.
- Bundle SHA-256:
  `05138a65af9bcdc1ff3309999aa0520fd6112f2ef9da01b9cc378289b9857629`.
- Baseline: 1280×820 outer window, 2560×1576 content PNG at DPR 2.
- Pointer: visible, unoccluded strip of the owned window produced
  mouseenter/down/up/tap and host focus.
- Keyboard: real Tab/Shift+Tab/Enter/Space/Arrow/Escape produced no view focus
  or key handler arrival.
- Textarea: real ASCII typing produced one focus and 13 committed input calls;
  physical Arrow/Escape/Enter produced no key handler arrival.
- Scroll: four real wheel steps produced three `bindscroll` calls; final detail
  included `scrollTop=242`, `scrollHeight=361`, `deltaY=2`.
- Window: switching focus away and back produced one host blur and one host
  focus; pointer leave/enter also reached Lynx.
- Exact DevTool error/warning console is empty.

## IME blocker

The installed Chinese input source was temporarily selected and always restored
to `com.apple.keylayout.US`. No retained attempt changed the user's clipboard.

The first IME attempts were rejected from evidence because the owned
`showInactive()` window was occluded or not frontmost. The isolated window was
restarted at an alternate persisted bound without moving user windows. Its
textarea could receive a Lynx focus event while remaining a background app, but
global key events still went to the frontmost browser. PID-targeted `CGEvent`
keycodes also did not pass through macOS Text Input Manager and generated no
input/composition event.

Therefore:

- `input:composing=false` is proven for ordinary committed input.
- `input:composing=true → false` is **not proven and not disproven**.
- P9-D1 cannot be marked completed under the current no-Raise/background
  harness.

Unblock with one of:

1. user authorization for one controlled activation of the exact-owned probe
   window, followed by immediate IME input and restoration; or
2. a configured Computer Use visual model capable of targeting the exact-owned
   inactive window under the approved harness.

## Gap and feasibility assessment

| Gap | Evidence | Feasible next action |
|---|---|---|
| Tab/view focus publication | Web and Native negative; P-110 history | likely Lynxtron host/upstream work; app helper changes cannot create missing host event |
| view key publication | Web and Native negative | host/upstream investigation; menu accelerators remain separate fallback |
| textarea Arrow/Enter/Escape | Web and Native negative | native textarea/custom element work or accepted kernel island |
| real IME composition payload | harness blocked | finish one authorized active-window proof before deciding |
| Web nested scroll wheel | Web negative, Native positive | Web custom-element/harness issue; not a Native product gap |
| window focus/blur global event | positive | retained probe pattern is feasible if product needs this signal |

## Exit audit

- Roadmap definition: complete.
- Single compat-matrix host-input row: complete.
- Independent Lynx-for-Web probe: complete.
- Native proof for pointer, ordinary input, focus/key negatives, wheel, and
  window focus: complete.
- Focused tests/builds/audits: complete for the retained slice.
- Real IME composition: **blocked**.
- P9-D1 status: **blocked, not completed**.
- P9-R1: forbidden.
