# Explorer Nested Directory Error at 320x200

## Newly discovered scope

A canonical project/thread exposed a root `locked` directory successfully, but
the directory itself had mode `000`. Expanding it in the ordinary Explorer at
`320x200`, DPR 1, dark produced a real nested
`projects.listDirectories` `EACCES` failure.

This differs from the previously covered root-list failure: the root list,
directory row, disclosure state, and preview all mounted successfully before
the child listing failed.

## P1 product loss

Before the fix:

- entries owner: `158.5x43 @ (1,157)`;
- directory row: `152.5x28 @ (4,160)`;
- nested error: `152.5x28 @ (4,184.921)`, bottom `212.921`;
- owner `scrollHeight=62`, `clientHeight=43`.

The error was clipped below the viewport. A real wheel interaction over the
entries owner left `scrollTop=0`; the error remained at `y=188..216`. The
nominal scroll range therefore did not make the failure reachable.

`lynx-explorer-nested-directory-error-clipped`: P1 component contribution
`1.00 -> 0.00`.

## Root fix

Only in short-height ordinary Thread Explorer, nested loading/error states now
use the existing compact 9px meta type at a fixed 12px line:

- `height:12px`;
- `min-height:12px`;
- `font-size:9px`;
- `line-height:12px`.

Normal-size and Editor Explorer states retain the existing 28px row. Directory
data, disclosure behavior, error semantics, and root rows are unchanged.

## After evidence

Without scrolling:

- entries owner: `158.5x43 @ (1,157)`;
- directory row remains 28px;
- nested error: `152.5x12 @ (4,188)`;
- error bottom: exactly `200`;
- error is fully inside the entries owner and viewport;
- copy: `Could not load directory.`.

The canonical nested RPC continued to report the real `EACCES` error; only its
compact presentation changed.

A temporary before PNG was exactly `320x200`, SHA-256
`1877407b0e700881fb3871b63ff5a4795ef643316310e6b8d7d0c0d94742b446`,
then deleted. No screenshot was retained.

## Validation and boundaries

- Focused Explorer Rstest passed `2/2`.
- Lynx-for-Web production build passed:
  `output/bundle/web/main.web.bundle` `4556.4 kB`.
- Native/Desktop production build passed with registered warnings only.
- Staged Native bundle SHA-256:
  `6bb6bdf0dc2951b4748f14cc891fa94d5c677801ac909b390d4179b542da4930`.
- Lynx-for-Web bundle SHA-256:
  `9b1aabf7249d34028a997b80d4bcb158c973876544a69095b57134924625b3dd`.
- Native cannot certify `320x200`; the production build is supporting evidence.
- The failed wheel attempt is retained as real interaction evidence, not
  relabelled as programmatic scrolling.
- The known environment-only Codex provider error is accepted noise.
- Every browser workflow used `bun run browser:run -- ...` and returned to
  `sessions: []` with zero agent-browser-owned processes.
