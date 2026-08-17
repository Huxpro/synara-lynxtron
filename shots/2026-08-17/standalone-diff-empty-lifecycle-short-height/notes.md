# Standalone Empty File Lifecycle at 320x200

## Newly discovered scope

Two independent canonical repositories produced empty-file lifecycle patches:

- add:
  `new file mode 100644`, `index 0000000..e69de29`;
- delete:
  `deleted file mode 100644`, `index e69de29..0000000`.

Using separate repositories avoided Git's valid optimization that collapses an
empty add plus empty delete into a 100%-similarity rename.

## P1 shared product loss

The real empty-add runtime rendered only:

- `1 file`;
- `added.empty`;
- `+0/-0`.

Expanding the file produced no lifecycle body. The shared model likewise had no
field capable of distinguishing an empty addition from an empty deletion.

`shared-diff-empty-lifecycle-missing`: P1 component contribution
`1.00 -> 0.00`.

## Root fix

- `PullRequestDiffFileView` now carries
  `lifecycle: "added" | "deleted" | null`.
- Parsed and pure-string portable paths recognize `new file mode` and
  `deleted file mode`.
- Shared composition renders `File added.` or `File deleted.`.

## After evidence

Empty add:

- notice: `File added.`;
- notice: `269px` wide at `y=175..191`;
- scroller: `clientHeight=110`, `scrollHeight=126`;
- pending requests: `0`.

Empty delete:

- notice: `File deleted.`;
- notice: `269px` wide at `y=175..191`;
- scroller: `clientHeight=110`, `scrollHeight=126`;
- pending requests: `0`.

## Validation and boundaries

- Web parser Vitest: `7/7` passed.
- Lynx shared-composition Rstest: `1/1` passed.
- Web production build passed with `8953` modules.
- Lynx-for-Web production build passed: `4569.1 kB`.
- Web bundle SHA-256:
  `c4055af901703547d9eaac160e5295a35ebdacd81f51158529b17bbd020b9cb4`.
- Native/Desktop production build passed: `4277.6 kB`.
- Staged Native bundle SHA-256:
  `eac8cfda6ce20ea024777fdea7b329f794a4b82efc57fa77a99f7f9ebbec9d74`.
- The first combined before probe did not enter the delete UI case and is not
  claimed as runtime delete evidence. Canonical delete patch inspection and
  shared-model tests established the missing pre-fix contract; separate after
  sessions verified both rendered outcomes.
- The first add-after probe sampled while one request was pending and was
  rejected as timing harness failure. A fresh add session with longer readiness
  produced the retained evidence.
- Final cleanup reported `sessions: []`, zero agent-browser-owned processes,
  removed states/workspaces, and repository screenshot count `100`.
