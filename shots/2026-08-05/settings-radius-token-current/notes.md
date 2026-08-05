# Settings large-radius token proof

## Finding

`--radius-lg` was referenced by eleven Settings surfaces across:

- Advanced
- AppSnap
- Integrations
- Skills
- Worktrees

The token had no Lynx definition. CSS declarations such as
`border-radius: var(--radius-lg)` therefore computed to `0px`, as first observed
on the Archived empty state.

## Repair

The Lynx root now defines the shared platform semantic:

```css
--radius-lg: 10px;
```

This preserves one token owner instead of replacing eleven consumers with
duplicated literals. A focused regression test reads all five consumer files
and requires the root definition.

## Runtime proof

Current Lynx-for-Web computed styles on the real isolated snapshot:

- AppSnap hero: `624x130`, solid border, radius `10px`.
- Skills loading state: `624x72`, dashed border, radius `10px`.
- Worktrees empty state: `624x72`, dashed border, radius `10px`.
- Root `--radius-lg`: `10px`.

The real Integrations and Advanced states did not expose a qualifying
token-backed surface during this run. Their consumer declarations are covered
by the focused token test, but are not represented as visual evidence here.

## Evidence and gates

- `appsnap-lynx-web-1280x820-light.png`: representative current-bundle frame,
  exactly `1280x820`.
- Focused token/sidebar suite: 1 file, 2/2 passed.
- Lynx-for-Web and Native/Desktop production builds passed.
- Native bundle contains no Web relay markers.
- `bun fmt`, `bun lint`, and `bun typecheck` remain unauthorized.
