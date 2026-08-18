# Automations Edit Short Height

## Classification

- New scope: Automation Edit at `900x300` logical viewport, dark/light state
  independent, with the newly added Repeats field.
- Product loss: none proven.
- Harness loss: Lynx-for-Web browser wheel did not move the native custom
  scroll-view; exact Native `DOM.scrollIntoViewIfNeeded` node IDs were not
  stable across modal updates.
- Missing coverage: physical Native wheel/gesture scrolling remains unverified.

## Identity

The canonical disabled heartbeat Automation and source thread were created and
deleted through product RPC. Web and Lynx-for-Web used:

- server instance `cbfdb4e0-74c1-4df4-9d6c-7d6f358c6de1`;
- Automation `automation:791b0226-1332-4997-b46e-eb7a6a0e4da0`;
- source thread `455e4bba-a0a3-45d6-b835-f15fdebc2984`;
- initial/final schedule Manual;
- initial/final max iterations 25.

## Discovery

The first `900x500` probe was rejected as a short-height product cell because
the responsive contract defines short height as `<320px`. Its root correctly
contained only `SliceRoot--viewport-medium`.

At the real `900x300` short-height cell:

- dialog: `560x268 @ (170,16)`;
- panel: `526x173 @ (187,54)`;
- panel content height: `334`;
- footer Save: `53.73x36 @ (659.27,231)`;
- Repeats and Max iterations are intentionally below the initial viewport and
  require panel scrolling.

The footer remained fully visible and separate from the scroll owner. No field
was removed and no scope was reduced.

## Interaction Evidence

At `900x500`, where only `22px` overflow existed, a real rendered click on the
remaining visible strip of `250 runs` selected the choice, enabled Save, and
persisted the update. The fixture was restored to 25 through canonical RPC.

At `900x300`, Lynx-for-Web browser wheel did not change scrollTop in either
direction. This matches the already tracked custom-element browser automation
boundary and is not product evidence.

An exact-owned Native `900x332` outer window loaded the same production bundle
and snapshot. DevTool could locate the option and begin
`DOM.scrollIntoViewIfNeeded`, but live node IDs/search results became invalid
after modal mutations. The run was stopped and classified as missing coverage;
no partial Native pass is claimed.

## Verification

- Automation focused tests: `2 files / 17 tests`.
- HostInputProbe/Diff/fidelity focused tests from the attribution audit:
  `21/21`.
- Web, Lynx-for-Web, and Native/Desktop production builds passed.
- Relay remained one-attempt OPEN with no RPC/transport/page errors.
- Every browser loop and failure was followed by a clean `browser:gate`.
- No screenshots added; local screenshot count remained `100`.
