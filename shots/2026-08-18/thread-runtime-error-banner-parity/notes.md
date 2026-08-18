# Thread Runtime Error Banner Parity

## New scope

- screen: thread detail after a real provider runtime failure;
- state: Codex account usage limit, persisted user message, failed turn;
- theme: dark;
- viewport: `1280x820`, DPR `1` for Web and Lynx-for-Web;
- interaction: dismiss the error banner while preserving transcript activity.

This state was created by the real Native send path. No synthetic provider
fixture or SQLite write was used.

## Identity preflight

- Server endpoint: `127.0.0.1:58090`.
- Server instance:
  `c7fea750-6510-4770-a0ca-c78804443bb8`.
- Thread:
  `lynx-landing-thread-1787038961366-4541af01c9c728`.
- User message: `hi`.
- Turn:
  `01a013db-94b8-75b2-9529-b9daec01781c`.
- Provider result:
  `You've hit your usage limit. Visit https://chatgpt.com/codex/settings/usage to purchase more credits or try again at Aug 20th, 2026 12:29 PM.`
- Web authority route:
  `/lynx-landing-thread-1787038961366-4541af01c9c728`.
- Lynx-for-Web route:
  `/lynx/index.html?route=%2Fthread%2Flynx-landing-thread-1787038961366-4541af01c9c728`.
- Native route:
  `synara://thread/lynx-landing-thread-1787038961366-4541af01c9c728`.

Lynx-for-Web used one open relay socket, one connection attempt, no transport
or RPC error, and the same server instance. Exact Native used PID `31460`,
PID-derived client `localhost:8902`, session `1`, and the staged production
bundle.

## Product loss

Web authority rendered a dismissible thread error banner containing the
complete provider message. Lynx-for-Web and Native rendered only the generic
timeline rows:

- `Provider runtime error`;
- `Turn failed`.

Those rows are useful history, but they omit the actionable reason and retry
time. The missing full message was a P1 product loss, not an accepted platform
delta.

## Fix

- Add `session.lastError` to the Lynx thread header projection.
- Add a Lynx `ThreadErrorBanner` using the existing chat banner composition
  and error tokens.
- Preserve the complete provider text and expose it as the accessibility
  label.
- Dismiss locally without mutating the server event history.
- Keep `Provider runtime error` and `Turn failed` timeline rows visible after
  dismissal.
- Key dismissal by `session.updatedAt + error`, so the same provider message is
  shown again after a newer failed session instead of remaining hidden forever.

## Comparable result

Lynx-for-Web:

- banner: `736x64 @ (400,58)`;
- dismiss: `24x24 @ (1103,67)`;
- complete provider error text;
- real rendered-control dismissal succeeded;
- timeline rows remained visible after dismissal.

Native:

- banner outer bounds: `736x64 @ (440,58)`;
- dismiss: `24x24 @ (1144,66)`;
- complete provider error text in raw text and accessibility label;
- real DevTool touch dismissal succeeded;
- timeline rows remained visible after dismissal;
- warning/error console empty;
- one established product socket to `127.0.0.1:58090`.

The 40px x offset is explained by the different sidebar widths in the current
Web/Lynx-for-Web and Native persisted layouts. Banner width and internal
geometry are otherwise identical.

## Harness losses

- The first Lynx-for-Web attempt used the Vite `/@fs/.../dist/web/index.html`
  path. That path loaded the template but did not start the BTS application
  effects. It remained at `Preparing Synara…`, had zero bridge methods and zero
  relay attempts, and was rejected as a harness/capture mismatch.
- The correct validated entry is `/lynx/index.html`.
- The first Lynx-for-Web dismiss probe used a stale coordinate. The retry used
  the measured center `(1115,79)` and passed.

Neither harness failure is counted as product loss.

## Verification

- Focused tests: `3 files / 7 tests`.
- Lynx/Desktop production build: passed with existing registered warnings.
- Lynx-for-Web production build: passed.
- Web and Lynx-for-Web retained screenshots were both exactly `1280x820`.
- No screenshot was added to the repository; local repository screenshot count
  remained `100`.
- Every browser workflow ran under `browser:run`.
- Every failed probe was followed by `browser:gate`.
- Fidelity loss: `11.667654316861451 -> 11.539802495015246`
  (`-0.12785182184620503`).
- Component contribution:
  - scope: `-0.13761467889908174`;
  - completeness: `+0.009762857052875162`;
  - visual: `0`;
  - reliability: `0`.

## Follow-up discovery

A real same-thread repeat attempt was not retained as banner evidence. The
second Codex session remained in `starting`, and canonical stop entered
`uncertain` because Synara could not prove process-tree capture completion:

`rootExited=true, captureComplete=false; no captured descendants remain`

The verification thread was permanently deleted (`exists: false`, shell
sequence `256`). This is a separate Synara provider-process lifecycle issue,
not a Lynx/Lynxtron connection blocker and not evidence against the pure
dismiss-revision contract.
