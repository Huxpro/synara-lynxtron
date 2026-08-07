# Settings General restore-control anatomy

Status: retained current-head dark Browser parity and exact-owned Native
evidence for the Settings panel `Restore defaults` control.

## Residual

The Web header used the canonical outline `xs` button:

- `114.765625x24` at `965.234375,32`;
- Tabler `IconRotate2` at `14x14`, relative `8,5`, opacity `0.8`;
- 4px icon/text gap and 10px/15px label typography.

The Lynx adapter previously rendered text only in the default 32px button,
producing `120.671875x32` and omitting the icon.

## Fix

- The Lynx button now uses `size="xs"`.
- It renders the exact local `IconRotate2` paths rather than a glyph or a
  different generated icon.
- The icon owns a 14px slot and 0.8 opacity.
- A unique `SharedSettingsPanelHeaderRestoreButton` role keeps Native evidence
  selection fail-closed when other `xs` buttons are present.

The implementation intentionally does not try to unify the current dirty
settings state. Web was enabled while Lynx was disabled in the initial
diagnostic pair; that state mismatch changes tone only, not anatomy.

## Browser

Both clients used the same isolated Synara service at
`ws://127.0.0.1:58155`, trusted origin `http://localhost:8998`, route
`/settings`, dark theme, comfortable density, viewport `1280x820`, and DPR 1.

After the Lynx bundle reload and real `shell:navigate` host event:

- Web/Lynx button:
  `965.234375,32,114.765625x24`;
- Web/Lynx icon:
  `973.234375,37,14x14`;
- Web/Lynx icon opacity: `0.8`;
- Web/Lynx first path:
  `M15 4.55a8 8 0 0 0 -6 14.9m0 -4.45v5h-5`;
- Lynx label:
  `991.234375,36.5,80.765625x15`.

The retained Lynx-for-Web screenshot is
`lynx-after-restore-anatomy.png` at exactly `1280x820`.

## Native

The first diagnostic launch correctly failed the certification gate: the
staged bundle still contained the default service endpoint and rendered a
`TransportStatusRetry` action. Its output was deleted.

The final retained run rebuilt Native/Desktop with the isolated service URL:

- production bundle:
  `de3d2b013607e9dd25cc612b2000aa674f81fdaff0d3f2aa94a7637f660ad0e8`;
- read-only SQLite online-backup:
  `abe3bb7a0e5a0de13603888d428a498a8c8202111142da2ac84153e75f2404a6`;
- owned launch root/child: `36527 -> 36546`;
- PID-derived DevTool target: `localhost:8901/session 1`;
- session URL:
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`;
- root: dark, comfortable, `1280x820`;
- header: `456,32,624x54`;
- restore button: `966,32,114x24`;
- icon: `974,37,14x14`, opacity `0.8`, exact Rotate2 content;
- label: `992,37,80x15`, 10px/15px;
- `TransportStatusRetry` nodes: `0`;
- warning/error console: empty;
- raw frame: `2560x1640` at DPR 2.

The owned app and temporary `/tmp` state were removed after capture. Existing
`.p10-view*` state was read only and left untouched.

## Verification

- Focused Rstest: 1 file, 2 tests passed.
- Web production build passed.
- Lynx-for-Web production build passed.
- Native/Desktop production build passed with only existing encoder and
  optional `ws` warnings.
- Uncached React Doctor changed-lines scan against `297455d3`, including the
  untracked focused test, scanned 2 files and reported 0 diagnostics.
