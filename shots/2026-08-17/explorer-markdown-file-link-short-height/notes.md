# Explorer Markdown File Link at 320x200

## Newly discovered scope

A canonical workspace contained:

- `README.md` with inline code `` `target.txt` ``;
- `target.txt` with `target content`.

The ordinary compact Explorer rendered `README.md` at `320x200`, DPR 1, dark.
This executes Markdown-to-Explorer navigation rather than only measuring the
Markdown layout.

## Trusted interaction evidence

The rendered inline-code file token published:

- accessibility label: `Open target.txt`;
- box: `75.28125x17 @ (203.203125,184)`;
- center: `(241,193)`, inside the viewport.

A real browser mouse move/down/up sequence activated that token. After:

- selected path: `README.md -> target.txt`;
- Markdown renderer: mounted -> unmounted;
- source content: `target content`;
- relay issued a fresh `projects.readFile`;
- Explorer stayed open and in bounds.

This is a compact interaction pass, contribution `0.00 -> 0.00`; no product
code change was required.

## Harness boundaries

- The first probe selected the sidebar's `target.txt` row because it shared the
  same accessible label; its center was below the viewport and no activation
  occurred.
- A second probe repeated that selector mismatch after a wheel attempt.
- The initial Markdown fixture used `@target.txt`, which is not the product's
  Markdown file-reference grammar. The final retained fixture used the shared
  inline-code candidate grammar.
- These failed setup/selector probes were cleaned and are not product failures.
- No controlled DOM activation was used for the retained transition.
- Every browser workflow used `bun run browser:run -- ...` and returned to
  `sessions: []` with zero agent-browser-owned processes.
