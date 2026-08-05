# Settings advanced dark 1440 evidence

Status: retained current-head Web, Lynx-for-Web, and exact-owned Native evidence

- State: recovery-visible
- Theme: dark
- Browser viewport: 1440x900 at DPR 1
- Native outer window: 1440x900; LynxView raw: 2880x1736 at DPR 2
- Snapshot: 8855c7bfa8d97ffbb6be04551e38c17a54ad171b0c3983261f874c0117657d5a
- Lynx-for-Web bundle: f2bfbb9af5b8be33e9c3096a76721a541489d7201a1ad88ce9035f1a4e7b1c95
- Native bundle: 3112efe2859746a746a7142ee11533657c1cd09b63c9aa0a77aa401dda8c337a
- Web and Lynx-for-Web retain dark theme and the requested route/target.
- Native capture uses a PID-derived exact client, a dark root class, the requested target role, and an empty warning/error console.
- Owned KV and window-state files were restored byte-exact after the batch.

## Frozen snapshot refresh

This cell was recaptured from current head while the owned Synara server was
paused after Web, Lynx-for-Web, and Native synchronized the dark theme. All
three clients therefore reference the same SQLite online-backup snapshot
`8855c7bfa8d97ffbb6be04551e38c17a54ad171b0c3983261f874c0117657d5a`. Web reconnect warnings during the deliberate freeze are harness
evidence; no page error was retained, Lynx-for-Web had a clean console, and the
PID-owned Native console was empty.
