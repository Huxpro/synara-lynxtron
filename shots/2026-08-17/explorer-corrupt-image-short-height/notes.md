# Explorer Corrupt Image at 320x200

## Newly discovered scope

A canonical project/thread selected `corrupt.png`, a real 30-byte file whose
contents were not valid PNG data, in the ordinary Explorer at `320x200`, DPR 1,
dark.

Identity:

- state directory: `.synara-fidelity-explorer-corrupt-image-short`;
- server: `ws://127.0.0.1:58090`;
- Web origin: `http://localhost:8891`;
- project: `project-fidelity-corrupt-image-short`;
- thread: `thread-fidelity-corrupt-image-short`;
- route flags: `explorer=open&explorerPath=corrupt.png`.

The local-image request completed as HTTP `200`. This isolates image decode
failure from URL creation, transport, authorization, and missing-file errors.

## P1 product loss

Before the fix, Lynx treated a resolved local-preview URL as success and did
not subscribe to the `<image>` decode error:

- image/frame: `155.5x76 @ (162.5,122)`;
- image request: HTTP `200`;
- image error copy: absent;
- page errors: empty;
- visible result: an unexplained blank preview.

Web authority already uses the image element's real `onError` transition and
shows a dedicated error card.

`lynx-explorer-image-decode-failure-blank`: P1 component contribution
`1.00 -> 0.00`.

## Root fix

The Lynx image renderer is now a focused `ExplorerImagePreview` component:

- `binderror` records decode failure on the background thread;
- failed bytes unmount the image/frame and render the existing
  `Could not load this image.` state;
- the component is keyed by preview URL so a new file/source generation starts
  with clean decode state;
- URL-fetch failure and image-byte decode failure remain separate paths.

No server route, MIME mapping, image sizing, successful image path, or Web
renderer behavior changed.

## After evidence

The same canonical corrupt file automatically published the real decode error:

- local-image request: HTTP `200`;
- image/frame: unmounted;
- error: `147.59375x18 @ (166.453125,151)`;
- error bottom: `169`, fully inside the `320x200` viewport;
- copy: `Could not load this image.`;
- More actions: `28x28 @ (288,124)`;
- page errors: empty;
- relay: one connection, zero pending requests, no transport/RPC error.

No synthetic error or controlled state mutation was used for runtime evidence.
The browser image decoder emitted the failure event from the invalid bytes.

A temporary after PNG was exactly `320x200`, SHA-256
`aa21c88eaf52910957998f8209bf5be4233eefdcb6312ac6c41a407719827f07`,
then deleted. No screenshot was retained.

## Validation and boundaries

- Focused Lynx Rstest passed `2 files / 3 tests`, including a real
  `bindEvent:error` component transition.
- Lynx-for-Web production build passed:
  `output/bundle/web/main.web.bundle` `4556.0 kB`.
- Native/Desktop production build passed with registered warnings only.
- Staged Native bundle SHA-256:
  `d12cf9449de4251902ef3726131f6cac4c0ed9c3c82574b5f24baeac02b2cf4f`.
- Lynx-for-Web bundle SHA-256:
  `1520b8a7d5534e440ebc824f78c127c76ffd2065a5ccd593b972c9f35abc8f64`.
- Native cannot certify `320x200`; the production build is supporting bundle
  evidence only.
- Web authority source uses `onError: () => settleLoad("error")` and the
  existing browser lifecycle suite covers recovery across an errored
  A -> B -> A transition. This loop does not claim a fresh Web runtime capture.
- Lynx-for-Web console contained only the known upstream initialization
  deprecation warning.
- Every browser workflow used `bun run browser:run -- ...` and returned to
  `sessions: []` with zero agent-browser-owned processes.
