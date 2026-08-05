# Current-head Worktrees empty-state proof

- Same isolated snapshot, Light, `1280x820`, DPR 1.
- The real snapshot has no app-managed worktrees, so this proof covers the
  loading/empty/error status surface. Populated destructive rows remain
  canonical-RPC and focused-test evidence.

Before repair, Lynx forced a 72px minimum and inherited Settings description
typography (`12/18`). Web's shared empty state is content-driven:

- `x=456 y=118 w=624 h=70`;
- `24px 16px` padding;
- 1px dashed border;
- 10px radius;
- `14px/20px/400` copy.

Removing the artificial minimum and assigning the empty-state copy its Web
typography makes every measured value exact.

Evidence:

- `worktrees-web-1280x820-light.png`
- `worktrees-lynx-web-1280x820-light.png`
- `worktrees-lynx-web-1280x820-light-final.png`

All PNGs are exactly `1280x820`; browser page errors were empty.

Gates:

- Focused Worktrees suite: 1 file, 3/3 passed.
- Lynx-for-Web and Native/Desktop production builds passed.
- Final bundles: Lynx-for-Web `046420bd…`; Native `0e841ae6…`.
- `bun fmt`, `bun lint`, and `bun typecheck` remain unauthorized.
