# Explorer Truncated Preview at 320x200

## Newly discovered scope

A canonical project/thread selected two real files larger than the server's
`1,000,000` byte read limit:

- `large.txt`: `1,001,000` bytes;
- `large.md`: `1,001,042` bytes.

The canonical `projects.readFile` response for `large.txt` contained exactly
`1,000,000` characters and `truncated:true`. Both files were exercised in the
ordinary Explorer at `320x200`, DPR 1, dark, using:

- state directory: `.synara-fidelity-explorer-truncated-short`;
- server: `ws://127.0.0.1:58090`;
- Web origin: `http://localhost:8891`;
- project: `project-fidelity-explorer-truncated-short`;
- thread: `thread-fidelity-explorer-truncated-short`;
- route flags: `explorer=open&explorerPath=<file>`.

## P1 product loss

Before the fix, Lynx placed `Preview truncated at 1 MB.` after the complete
one-megabyte preview body:

- compact scroller: `151.5x32`, `scrollHeight=784642`;
- compact marker: `151.5x12 @ (164.5,784794)`;
- marker distance below viewport: `784594px`;
- normal `1280x820` marker distance below viewport: `522424px`.

The user could read, quote, or comment on an incomplete file without any
first-screen indication that the source had been cut off.

Web source authority already treated truncation as preview identity in the
fixed header, but hid the label below its container breakpoint. That made the
same state undiscoverable in a narrow Web dock.

`lynx-explorer-truncated-disclosure-buried`: P1 component contribution
`1.00 -> 0.00`.

## Root fix

Truncation disclosure now belongs to the shared preview header rather than the
end of a potentially enormous content stream:

- Lynx adds `ExplorerDockPreview--truncated` and a fixed `Partial` label with
  accessibility label `Preview truncated at 1 MB.`;
- ordinary and normal-size Lynx headers preserve filename, disclosure, and
  More actions without overlap;
- compact Markdown expands its existing actions overlay to hold both
  disclosure and More actions while retaining the full-height preview;
- the old tail marker is removed;
- Web always exposes a compact `Partial` label and upgrades it to
  `Shown partially` at the existing header breakpoint.

This does not change the server read limit, file contents, syntax
highlighting, Markdown rendering, or scroll behavior.

## After evidence

Ordinary `large.txt` at `320x200`, dark:

- dock: `320x108 @ (0,92)`;
- preview header: `159.5x40 @ (160.5,120)`;
- filename: `60.9375x16 @ (172.5,131.5)`;
- `Partial`: `30.5625x14 @ (241.4375,132.5)`;
- More actions: `28x28 @ (280,125.5)`;
- filename/disclosure overlap: `0`;
- disclosure/actions overlap: `0`;
- accessibility label: `Preview truncated at 1 MB.`;
- old tail marker: absent.

The `1280x820` control also keeps `Partial` in the fixed header with zero
overlap.

Compact `large.md`:

- full-height Markdown content: `159.5x80`;
- overlay header: `84x28 @ (232,124)`;
- `Partial`: `30.5625x14 @ (236,131)`;
- More actions: `28x28 @ (270.5625,124)`;
- disclosure/actions overlap: `0`;
- old tail marker: absent.

A temporary after PNG was exactly `320x200`, SHA-256
`bf8991ce98f19b97094044f29dc33e6cd58de9fcd7e5ae04aca89ce3bbb0c6ad`,
then deleted. No screenshot was retained.

## Validation and boundaries

- Lynx focused Rstest passed `2 files / 5 tests`.
- Web focused Vitest passed `1/1`.
- Lynx-for-Web production build passed:
  `output/bundle/web/main.web.bundle` `4555.3 kB`.
- Web production build passed with `8953` modules.
- Native/Desktop production build passed with registered warnings only.
- Staged Native bundle SHA-256:
  `f55a43980e15d38a6f0597f3bbf33c3bc8b19fde580e084cf5a45363c5910604`.
- Lynx-for-Web bundle SHA-256:
  `c8be7902774da9bd2e38aeb455ffdc0bee6c0247f54f7f8420ec58147e0b9bb6`.
- The exact Web authority route loaded only the Vite shell at `320x200`:
  body text was empty, no controls were published, and the console contained
  only Vite connection logs. This is an authority hydration harness loss, not
  product evidence. Web source structure, focused rendering test, and
  production artifact prove the corrected disclosure contract without
  claiming runtime Web parity for this cell.
- Native cannot certify `320x200`; its production build is supporting bundle
  evidence only.
- Lynx-for-Web console contained only the known upstream initialization
  deprecation warning; page errors were empty.
- Every browser workflow used `bun run browser:run -- ...` and returned to
  `sessions: []` with zero agent-browser-owned processes.
