# Explorer Binary File at 320x200

## Newly discovered scope

A canonical project/thread selected `payload.bin`, a real file containing NUL
and non-text bytes, in the ordinary Explorer at `320x200`, DPR 1, dark.

The canonical `projects.readFile` call rejected the file as binary. This is
distinct from the previously covered missing-path read error and from local
image/PDF preview branches.

## Product evidence

The binary read failure remained local to the selected-file preview:

- dock: `320x108 @ (0,92)`;
- selected header: `159.5x40 @ (160.5,120)`;
- path: `99.5x16 @ (172.5,131.5)`;
- preview content: `159.5x40 @ (160.5,160)`;
- error: `131.71875x18 @ (174.390625,171)`;
- error bottom: `189`, fully inside the viewport;
- copy: `Could not read this file.`;
- renderer-ready route:
  `/thread/thread-fidelity-binary-short`;
- `projects.readFile` call count: `1`;
- transport error: null.

This is a compact failure-boundary pass, contribution `0.00 -> 0.00`; no code
change was required. It also verifies that the newly fixed Web relay defect
path does not deadlock another deterministic workspace RPC failure.

A temporary PNG was exactly `320x200`, SHA-256
`05988b5edf24ecc26806de8d55e98020655cbba524a6b1c61f6099a9cd9b4f88`,
then deleted. No screenshot was retained.

## Classification and boundaries

- The direct Web API surfaced a typed `WsRpcError`; Lynx intentionally maps
  the internal binary detail to the stable user copy above.
- Two ordinary polling requests were in flight at the later diagnostics
  sample. `projects.readFile` stayed at one call and was not leaking.
- `provider.listModels` reported the known environment-only
  `codex not found in PATH` error. It is accepted provider noise, not Explorer
  evidence.
- No product source changed, so the immediately preceding verified production
  bundles remain the supporting artifacts:
  - Native:
    `d12cf9449de4251902ef3726131f6cac4c0ed9c3c82574b5f24baeac02b2cf4f`;
  - Lynx-for-Web:
    `1520b8a7d5534e440ebc824f78c127c76ffd2065a5ccd593b972c9f35abc8f64`.
- Native cannot certify `320x200`.
- Every browser workflow used `bun run browser:run -- ...` and returned to
  `sessions: []` with zero agent-browser-owned processes.
