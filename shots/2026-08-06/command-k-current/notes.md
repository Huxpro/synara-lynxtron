# Command K current-head fidelity

Status: retained Web, Lynx-for-Web, and exact-owned Native evidence

## Harness

- Source base: `987d57db`.
- Shared isolated state: `.synara-sxs`, server `58290`, Web origin
  `http://localhost:8991`.
- Web original and Lynx-for-Web used the same snapshot, light theme,
  comfortable density, and `1280x820` DPR 1 viewport.
- Lynx-for-Web was staged under the trusted Web origin at
  `/lynx/index.html`; the served bundle hash matched the built artifact.
- The visible sidebar Search control opened Command K in both browser clients.
  No hidden route or component state was injected.

## Current-head measurement

The historical atlas mixed real differences with inherited-container noise:

- Web input text is `12px/18px`; current Lynx textarea text is already `12px`.
- Web command labels are `14px/20px`; current Lynx label nodes are already
  `14px/20px` in Lynx-for-Web.
- The inherited `16px/normal` values on `.LxCommandInput` and
  `.LxCommandItem` containers are not the rendered text owners.

Two real primitive residuals remained:

- `.LxCommandPanel`: Web `14px 14px 0 0`, Lynx `12px 12px 0 0`.
- `.LxCommandItem`: Web `10px`, Lynx `8px`.

## Repair

- `.LxCommandPanel` now owns the Web `14px` top corners.
- `.LxCommandItem` now owns the Web `10px` row radius.
- Lynx `CommandItem` removes the shared Web-only `rounded-lg` utility while
  preserving all other composition classes. This prevents generated utility
  CSS from overriding the primitive and keeps one radius owner.
- Focused tests lock both primitive values and the class-normalization seam.

Final Lynx-for-Web computed styles are:

- panel `14px 14px 0 0`;
- first row `10px`;
- input row `574x48`;
- first row `562x32`.

Web and Lynx-for-Web final screenshots are both exactly `1280x820`; both
browser error logs are empty.

## Native

- Configured production bundle:
  `3c73de574f54447a14bed3c18852c37389519d30348ea19504c276dbe0545f50`.
- Exact-owned root PID `78314`, PID-derived
  `localhost:8903/session 1`.
- Session URL:
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`.
- Native Command K was opened through a real
  `Input.emulateTouchFromMouseEvent` press/release on the rendered Search
  control.
- The retained DOM proves the real row no longer contains `rounded-lg` and
  contains the primitive-owned `.LxCommandItem` class.
- Seven required roles were retained; the raw frame is `2560x1576`; the
  warning/error console is empty.

This Lynx DevTool build reports `border-radius: 0px` for compound Native
`VIEW` nodes, including historically rounded controls. Native evidence
therefore certifies current bundle identity, rendered class identity, real
interaction, screenshot, and console. The numeric radius closure comes from
the production source/test contract plus current Lynx-for-Web computed style;
Native computed radius is not claimed.

## Verification

- Focused Command/composition suites: 2 files, 10/10 tests.
- Configured Lynx-for-Web production build: pass.
- Configured Native/Desktop production build: pass.
