# P9-D1 — Real macOS IME composition proof

## Identity and safety

- Exact-owned probe PID: `87477`
- Runtime: repository Lynxtron `0.0.7`
- DevTool client: PID-derived `localhost:8903`, session `1`
- Session bundle:
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`
- Probe bundle SHA-256:
  `05138a65af9bcdc1ff3309999aa0520fd6112f2ef9da01b9cc378289b9857629`
- Isolated user data: `/private/tmp/synara-p9-d1-native-state`
- Outer bounds: `1280×820`
- DevTool frames: `2560×1576`

The probe launched with `SYNARA_BACKGROUND_LAUNCH=1`,
`SYNARA_ALLOW_PARALLEL_INSTANCE=1`, DevTool enabled, and an explicit report
path. Computer Use first proved the window and textarea were visible and
unoccluded. A real visual tap on the probe textarea was the only activation
mechanism; no Raise, `open -a`, AppleScript focus/show, or user-process control
was used.

The user's already-selected Doubao Pinyin source remained selected before and
after the run. No clipboard operation occurred.

## Sequence

1. Baseline report: 25/25 bindings, no delivered events.
2. Visual tap on the large `Type here` textarea:
   - textarea focus arrived twice;
   - one textarea blur arrived during activation handoff;
   - one host window focus arrived.
3. Computer Use typed delayed physical Pinyin keys `zhongwen` without a commit
   key:
   - generic `input`: 8 calls;
   - `input:composing`: 8 calls;
   - last composing detail:
     `value=zhong'wen;isComposing=true`.
4. Computer Use pressed Space once:
   - generic `input`: ninth call;
   - `input:committed`: 1 call;
   - committed detail: `value=中文;isComposing=false`.

The composing event timestamp precedes the committed event timestamp, proving
the real `isComposing=true → false` boundary.

## Evidence

- `report-final.json`: complete 25-event matrix.
- `ime-summary.json`: focused textarea summary.
- `baseline.png`, `focused.png`, `composing.png`, `committed.png`.
- `console-*.txt`: exact-client error/warning consoles; all empty.
- `evidence.sha256`: retained evidence hashes.

## Cleanup

- Owned probe stopped and port `8903` released.
- Existing `8901` Fiddle and `8902` iOS clients remained untouched.
- Temporary Computer Use credential copy was deleted.
- Default Web/Desktop artifacts were rebuilt and contain only
  `ws://127.0.0.1:58090` with no probe markers.

This closes the final P9-D1 blocker. It does not authorize or enter P9-R1.
