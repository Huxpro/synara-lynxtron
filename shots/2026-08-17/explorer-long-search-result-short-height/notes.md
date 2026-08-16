# Explorer Long Search Result at 320x200

## Newly discovered scope

A canonical workspace contained one valid 241-character filename ending in
`-needle.txt`. Searching `needle` in the ordinary Explorer at `320x200`, DPR 1,
dark returned the file as a root-level result.

This differs from the previously covered long selected-file path: the failure
occurred in the search result row before selection.

## P1 product loss

Before the fix, result copy had no single-line containment:

- entries owner: `158.5x43 @ (1,157)`;
- row: `152.5x248 @ (4,160)`, bottom `408`;
- name: `116.5x240 @ (32,164)`;
- name `white-space:normal`, `text-overflow:clip`;
- the root filename was rendered twice as both name and path.

One result consumed more than the entire viewport height and destroyed the
canonical 28px row rhythm.

`lynx-explorer-long-search-result-wrap`: P1 component contribution
`1.00 -> 0.00`.

## Root fix

Explorer result identity now follows the Web authority contract:

- result copy clips overflow;
- name/path use one-line ellipsis;
- the auxiliary path renders only when it differs from the filename, so
  root-level results are not duplicated.

Directory rows, nested search paths, selection, and normal result height remain
unchanged.

## After evidence

- entries owner remains `158.5x43 @ (1,157)`;
- row: `152.5x28 @ (4,160)`, bottom `188`;
- name: `116.5x16 @ (32,166)`;
- name `white-space:nowrap`;
- name `text-overflow:ellipsis`;
- auxiliary root path: absent;
- result copy height: `16`;
- horizontal scroll width stays equal to client width.

A temporary after PNG was exactly `320x200`, SHA-256
`3c9eaafb06dd4f18b773fcca27b9f0a0fbafef313295a55eb096fd4d76a97f05`,
then deleted. No screenshot was retained.

## Validation and boundaries

- Focused Explorer Rstest passed `2/2`.
- Lynx-for-Web production build passed:
  `output/bundle/web/main.web.bundle` `4560.6 kB`.
- Native/Desktop production build passed with registered warnings only.
- Staged Native bundle SHA-256:
  `db955681234d20b0597b75d3ebb52dc88bc8e8eb319470d51ad98b91e71fea5a`.
- Lynx-for-Web bundle SHA-256:
  `4ee49c10dd31ff02bd65085e6347138902f09a0618a62a8f45fbe74d1d53803b`.
- Native cannot certify `320x200`; the build is supporting evidence only.
- The filesystem's `NAME_MAX=255` allowed the real long filename; no fake UI
  string was injected.
- Every browser workflow used `bun run browser:run -- ...` and returned to
  `sessions: []` with zero agent-browser-owned processes.
