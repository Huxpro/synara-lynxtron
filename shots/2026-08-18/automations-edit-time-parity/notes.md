# Automations Edit Time Parity

## Classification

- New scope: Daily and Weekdays schedule fields in Automation Edit at
  `900x650`, dark.
- P1 product loss: `lynx-automation-edit-time-missing`, `1.00 -> 0.00`.
- Missing coverage: Lynx-for-Web custom input text injection and background
  Native physical keyboard certification remain open. Neither is counted as a
  product failure or a passing mutation roundtrip.
- Harness failures: two invalid Rstest invocations, one Web text wait, one
  content-boundary JSON parse, one failed background Native launch, and one
  unavailable Midscene model. Every browser failure was followed by a clean
  `browser:gate`. No failed attempt changed product state.

## Product Loss

Web authority edits `timeOfDay` for Daily and Weekdays schedules. Lynx Edit
previously preserved or defaulted the value in state but exposed no Time
field, so users could not change it.

The first implementation probe also found that the old Create-only raw
`createElement('input')` path had no Lynx-for-Web layout box. The shared
component now uses the established `Input nativeInput` infrastructure instead
of duplicating that raw input path.

## Product Fix

- Extract a shared `AutomationTimeInput` used by Create and Edit.
- Use the common Native input wrapper with one accessibility label, input
  filter, max length, placeholder, and change contract.
- Show Time only for Daily and Weekdays Edit schedules.
- Preserve timezone while updating `timeOfDay`.
- Reuse one shared `HH:mm` validator in both Create and Edit save gates.
- Reject incomplete or out-of-range values before enabling Save.

## Shared Fixture And Connection

A disabled Daily Automation was created and deleted through the real Web
authority `createWsNativeApi()`:

- server instance:
  `cbfdb4e0-74c1-4df4-9d6c-7d6f358c6de1`;
- Automation:
  `automation:eb0ccc40-ae1a-4a4f-9e52-065bb69e6412`;
- initial and final pre-delete schedule:
  `{"type":"daily","timeOfDay":"09:00"}`;
- canonical cleanup result: `listed:false`.

SQLite was read only to verify persistence. No fixture state was written
directly.

Connection preflight independently exercised Web, Lynx-for-Web, and Native
against snapshot sequence `188`. All three returned the same server instance.
Fresh Lynx-for-Web sessions consistently recorded one connection attempt,
`feature-open -> connect-success -> socket-owned`, socket state `1`, zero
pending requests, and no transport or RPC error.

## Web And Lynx-for-Web

Web authority showed Repeats `daily` and Time `09:00` for the canonical
fixture.

Lynx-for-Web opened Edit through a rendered coordinate click. Before the
wrapper fix, `.AutomationCreateTime` measured `0x0`. After the fix:

- wrapper: `112x32 @ (187,415)`;
- accessibility tree: `textbox "09:00"`;
- input filter: `[0-9:]*`;
- maximum length: `5`;
- Save remained disabled for the unchanged schedule.

Both semantic `fill` and focused keyboard typing returned without updating
the custom `x-input` value or firing the main-thread input pipeline. The
fixture remained `09:00`; this is retained as missing harness coverage rather
than a fabricated product roundtrip.

## Exact Native

The prior owned process was stopped. The current exact-owned production
instance is:

- PID `29509`;
- PID-derived DevTool client `localhost:8902`, session `1`;
- production session URL:
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`;
- bundle SHA-256:
  `9a818ddd4173cd2a5626b22a90b423742240183f469e6100df29114edc6b31d6`;
- one established socket to `127.0.0.1:58090`.

DevTool touch opened the real Edit modal. The Native Time input was:

- value and default value `09:00`;
- `86x18 @ (460,585)` inside the styled wrapper;
- input filter `[0-9:]*`;
- maximum length `5`.

Lynx DevTool supports touch emulation but not text input. A PID-targeted
Quartz keyboard attempt did not change the value and did not mutate the
fixture. Midscene completed its desktop health check but could not perform an
action because no model was configured. Native physical-keyboard mutation is
therefore retained as missing coverage. Fresh exact-client warning/error
console output was empty.

The upstream blockers are already tracked, so no duplicate issue was opened:

- `lynx-family/lynx#6524`, `#6527`, `#6528`, `#6529`, and `#6530` cover
  DevTool text insertion, focus, key events, and IME composition;
- `lynx-family/lynxtron#149` and `#151` cover the Desktop keyboard event path
  and the broader DevTool input-emulation boundary.

## Verification

- focused tests: `3 files / 19 tests`;
- Lynx-for-Web production build passed;
- complete Lynx/Desktop production build passed;
- desktop bundle excluded the Web runtime bootstrap and Web build id;
- fixture canonical cleanup passed;
- no screenshots added; repository screenshot count remained `100`;
- final browser ownership gate must remain empty before commit and push.
