# Explorer Corrupt PDF at 320x200

## Newly discovered scope

A canonical project/thread selected `corrupt.pdf`, a real file with a PDF
header but invalid document structure, in the ordinary Explorer at `320x200`,
DPR 1, dark.

Identity:

- state directory: `.synara-fidelity-explorer-corrupt-pdf-short`;
- server: `ws://127.0.0.1:58090`;
- Web origin: `http://localhost:8891`;
- workspace: `/tmp/synara-explorer-corrupt-pdf-workspace`;
- route flags: `explorer=open&explorerPath=corrupt.pdf`.

The canonical `projects.inspectPdf` RPC failed with
`InvalidPDFException: Invalid PDF structure.`.

## P0 product loss

Before the fix, the exact same thread without an Explorer path hydrated within
six seconds. Adding `corrupt.pdf` left the complete Lynx renderer on
`Preparing Synara…` for more than 20 seconds:

- Explorer dock: absent;
- local PDF error: absent;
- renderer-ready route: absent;
- relay socket: open and connected;
- pending requests: `1`;
- last pending RPC tag: `projects.inspectPdf`;
- last transport/RPC error: null.

Raw WebSocket capture showed why:

```json
{"_tag":"Defect","defect":{"message":"Invalid PDF structure.","name":"InvalidPDFException"}}
```

Effect RPC emits this connection-level `Defect` without a request id. The
Lynx-for-Web relay recognized only `Exit` and `Chunk`, silently dropped the
frame, and never settled the pending bridge promise. The initial product
bootstrap therefore never reached its local PDF error boundary.

`lynx-web-rpc-defect-bootstrap-deadlock`: P0 component contribution
`1.00 -> 0.00`.

## Root fix

Web RPC frame parsing now recognizes `Defect` alongside `Exit` and `Chunk`.
Because the wire defect has no request id, the relay rejects all currently
pending requests as RPC failures:

- every pending timer is cleared;
- the corrupt PDF metadata promise settles;
- the socket remains healthy rather than being marked offline;
- the existing local `.then(..., error)` boundary publishes PDF error UI;
- later RPCs continue through the same connection.

The parser and defect description live in focused pure logic instead of being
embedded in the Web host.

## After evidence

The same corrupt PDF now reaches the ordinary compact Explorer:

- dock: `320x108 @ (0,92)`;
- PDF toolbar: `159.5x35 @ (160.5,120)`;
- page count: `— / —`;
- page frame: `159.5x45 @ (160.5,155)`;
- error container: `137.828125x26 @ (171.328125,164.5)`;
- error copy: `Could not render this PDF.`;
- error bottom: `190.5`, fully inside the `320x200` viewport;
- rendered page image: absent;
- renderer-ready route:
  `/thread/thread-fidelity-corrupt-pdf-short-5`;
- a canonical snapshot RPC succeeded after the defect.

A temporary after PNG was exactly `320x200`, SHA-256
`bda743596e399f1cc6223eeb8886b2a653d689dc9016e3e21c6f2ed5dfa32bc2`,
then deleted. No screenshot was retained.

## Stability and classification

The first immediate after sample caught six normal startup requests in flight.
A separate nine-second stability run showed:

- `pendingRequests=0` at every sample;
- `projects.inspectPdf` count stable at `2`;
- no additional defect requests;
- no transport error;
- no repeated recovery or socket reconnect.

The transient initial count was not retained as a leak or product regression.

## Validation and boundaries

- Focused Lynx Rstest passed `2 files / 8 tests`.
- Lynx-for-Web production build passed:
  `output/bundle/web/main.web.bundle` `4556.0 kB`.
- Native/Desktop production build passed with registered warnings only.
- Staged Native bundle SHA-256:
  `d12cf9449de4251902ef3726131f6cac4c0ed9c3c82574b5f24baeac02b2cf4f`.
- Lynx-for-Web bundle SHA-256:
  `1520b8a7d5534e440ebc824f78c127c76ffd2065a5ccd593b972c9f35abc8f64`.
- This fix is Web-host-only. Native/Desktop does not use this relay and is
  supporting bundle evidence, not Native runtime evidence for the defect.
- The local error UI itself already existed; this slice fixes failure delivery
  so that UI can mount.
- Console output contained only Vite connection logs and the known upstream
  Lynx initialization deprecation warning.
- Every browser workflow used `bun run browser:run -- ...` and returned to
  `sessions: []` with zero agent-browser-owned processes.
