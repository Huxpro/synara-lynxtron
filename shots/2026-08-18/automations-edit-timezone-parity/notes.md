# Automations Edit Timezone Parity

## Classification

- New scope: Automation Edit for an existing timezone-aware Daily schedule at
  `900x650`, dark.
- P1 product loss: `lynx-automation-edit-timezone-missing`, `1.00 -> 0.00`.
- Missing coverage: direct Lynx-for-Web and Native text mutation remains
  blocked by the existing custom-input/DevTool text-input boundary. This slice
  proves rendered field parity and a canonical Web mutation read back through
  Lynx; it does not claim a Lynx-originated text mutation.

## Product Loss

Web authority exposes Timezone when a Daily, Weekdays, Weekly, or Cron
schedule already has a timezone. The focused Lynx editor supports Daily and
Weekdays, preserves an existing timezone in schedule state, but previously
rendered no Timezone field. Users therefore could not see or modify a schedule
property already supported by the product contract.

The fix intentionally does not add Timezone to schedules without one because
Web authority also hides the field in that state.

## Product Fix

- Show a Native Timezone input when the current Daily or Weekdays schedule
  already contains `timezone`.
- Preserve `timeOfDay` and schedule kind while editing timezone.
- Match `AutomationTimezone`: trim-aware non-empty validation and a maximum of
  128 characters.
- Keep invalid intermediate text local by disabling Save until the timezone is
  valid.
- Use the existing shared `Input nativeInput` implementation and expose the
  explicit Native name `Automation timezone`.

## Shared Fixture And Identity

A disabled timezone-aware Daily Automation was created and deleted through the
real Web authority `createWsNativeApi()`:

- server instance:
  `cbfdb4e0-74c1-4df4-9d6c-7d6f358c6de1`;
- Automation:
  `automation:78735edf-0df1-4b2d-98be-2549bbf1d288`;
- initial and restored schedule:
  `{"type":"daily","timeOfDay":"09:00","timezone":"Asia/Seoul"}`;
- canonical cleanup result: `listed:false`.

SQLite was read only after rendered mutations. No fixture state was written
directly.

## Web And Lynx-for-Web

Both clients used the same server, fixture, dark theme, `900x650` viewport,
and DPR `1`.

Web authority rendered:

- Time `09:00`, `106.59x30.59 @ (775.41,322)`;
- Timezone `Asia/Seoul`, `165x28 @ (717,354.59)`.

Lynx-for-Web opened Edit through a rendered coordinate click and rendered:

- Time textbox `09:00`;
- Timezone textbox `Asia/Seoul`;
- Timezone wrapper `526x32 @ (187,460)`;
- maximum length `128`.

Web authority then completed a real rendered-control roundtrip:

1. `Asia/Seoul -> Europe/Rome` with blur commit;
2. a fresh Lynx-for-Web Edit read `Europe/Rome`;
3. Web restored `Europe/Rome -> Asia/Seoul`;
4. read-only SQLite confirmed the restored schedule.

Every Lynx-for-Web session recorded one connection attempt,
`feature-open -> connect-success -> socket-owned`, socket state `1`, zero
pending requests, and no transport or RPC error. Browser page-error output was
empty.

## Exact Native

The prior owned Native process was stopped and replaced after a complete
production build:

- PID `59545`;
- PID-derived DevTool client `localhost:8902`, session `1`;
- production session URL:
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`;
- bundle SHA-256:
  `741ce5451ec570b5e86e2ae72a0b3af51f6d23d47fc1cbd031e78b64be77d8f5`;
- one established socket to `127.0.0.1:58090`.

DevTool touch opened the real Edit modal. The Native Timezone input was:

- value and default value `Asia/Seoul`;
- maximum length `128`;
- `364x34 @ (458,635)`.

Fresh exact-client warning/error console output was empty.

Direct Native text mutation is not claimed. The existing upstream blockers
remain `lynx-family/lynx#6524/#6527/#6528/#6529/#6530` and
`lynx-family/lynxtron#149/#151`.

## Verification

- focused tests: `4 files / 22 tests`;
- Lynx-for-Web production build passed;
- complete Lynx/Desktop production build passed;
- canonical fixture cleanup passed;
- no screenshots added; repository screenshot count remained `100`;
- browser ownership gate returned `sessions: []` and zero agent-browser-owned
  processes.
