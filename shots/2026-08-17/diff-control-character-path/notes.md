# Control-Character Diff Paths at 320x200

## Newly discovered scope

One canonical repository contained two distinct tracked files:

- `line\nbreak.txt`, where `\n` is a real newline byte;
- `line break.txt`, with an ordinary space.

Both were modified and opened through the rendered Environment `Changes` row
at `320x200`, DPR 1, dark.

## P1 product loss

The model correctly decoded Git's C-style filename, but the presentation passed
the raw control character into text and accessibility nodes.

Before:

- newline-path header:
  `269x48 @ (26,143)`;
- newline-path text:
  `186.609375x32 @ (56,151)`;
- ordinary-space header:
  `269x32`;
- the first file consumed an extra 16px row and pushed the second header
  further below the compact viewport;
- the visual identity could be confused with a wrapped/space-separated path.

`shared-diff-control-character-path-layout`: P1 component contribution
`1.00 -> 0.00`.

## Root fix

`formatGitPathForDisplay` now escapes control characters only at the
presentation boundary:

- newline -> `\n`;
- carriage return -> `\r`;
- tab -> `\t`;
- other C0/DEL characters -> `\xNN`.

Logical model paths remain byte-faithful for search, file selection, jump
matching, and RPC behavior.

The shared formatter is reused by:

- Web and Lynx portable diff headers;
- previous-path copy/rename identity;
- Lynx Editor changed-file rows;
- Lynx standalone file-jump rows;
- accessibility labels for those rows.

## Final canonical evidence

- server instance:
  `0a62a842-3857-4c06-ab96-5504b857a229`;
- pre-fixture Web/Lynx/Native snapshot sequence: `0`;
- post-fixture sequence: `2`;
- route: `/thread/thread-control-20260817`;
- root:
  `SliceRoot--theme-dark SliceRoot--viewport-compact SliceRoot--viewport-short-height`;
- newline path displayed as literal `line\nbreak.txt`;
- newline path accessibility:
  `Expand line\nbreak.txt`;
- newline-path header:
  `269x32 @ (26,143)`;
- newline-path text:
  `186.609375x16 @ (56,151)`;
- ordinary-space header:
  `269x32 @ (26,189)`;
- ordinary-space text remained `line break.txt`;
- pending requests returned to zero;
- transport and RPC errors: none;
- page errors: none;
- PNG: exactly `320x200`, then deleted.

The second header extends beyond the initial compact frame because two normal
32px rows plus surrounding content exceed the remaining scroller space. That is
normal scroll ownership, not the former 48px control-character expansion.

## Validation

- Focused Web Vitest: `47/47` passed, including executable static rendering of
  the Web header.
- Focused Lynx Rstest: `4/4` passed.
- Web production build passed with `8953` transformed modules.
- Web main asset SHA-256:
  `844311714c248e66218f5bf6ea2543471054602a265bfeeb5ebac62055348817`.
- Lynx-for-Web production build passed:
  `4591.1 kB`.
- Lynx-for-Web bundle SHA-256:
  `8fd915cebae2576cfa2f873fed0574f3cd2cadcb7d789137ea34b08b29c4df73`.
- Native/Desktop production build passed:
  `4296.0 kB`.
- Staged Native bundle SHA-256:
  `bd591f4f553bfbac2d0bbe26d99e69b7ff80c34f1b2c5e386edec4657f03889f`.
- Every browser entry, failed build retry, retained cell, and exit returned
  `sessions: []` with zero agent-browser-owned processes.
- The first Lynx builds failed because `DiffDock` imported the formatter from
  the physical shared composition entry while it was exported only by the
  logic module. The shared entry now re-exports the helper; all three final
  builds passed. A subsequent source audit also caught and fixed a misplaced
  Web formatter local before final tests/builds.
- Screenshot count remained `100`.
