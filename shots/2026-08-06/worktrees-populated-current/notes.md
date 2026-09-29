# Current-head populated Worktrees fidelity proof

## Harness and real state

- Date: 2026-08-06.
- Shared owned server: `127.0.0.1:60462`, trusted origin
  `http://localhost:8921`.
- Web authority: `http://localhost:8921/`.
- Lynx-for-Web: `http://localhost:8921/lynx-current/`.
- Browser viewport: `1280x820`, DPR 1, light / comfortable.
- Shared SQLite snapshot SHA-256:
  `cd3e1e9efe5d373efd3271338eb504f94f98f5aea24a7b3df43acbb9d5e06710`.
- Lynx-for-Web bundle SHA-256:
  `d7051c77dad2912bdccc44c7949d38f5b6ef2894a5d7a92bf4148186316f2403`.
- Native bundle SHA-256:
  `7b17b78006cd415caec2b5bf405843ec2a3644f48d2d96f6b94afad98659fecb`.

The populated state was not a fixture injected into product storage. The
harness initialized a disposable Git repository under excluded `.p10-view`,
then called canonical `git.createWorktree` with an explicit path under the
server-owned worktrees directory. `server.listWorktrees` returned exactly that
managed worktree and its primary workspace root.

No thread was associated with the worktree, so this proof covers the real
no-linked-conversations row branch and destructive action without adding
conversation data.

## Measured residuals and repair

The real row exposed three owner-level differences:

1. `SettingsWorktreesActions` forced a 160px width even when only Delete was
   present. This reduced the copy/path width from Web's `540.109375px` to
   `418px`.
2. The `Conversations` label used a 16px line box while Web used 18px.
3. The empty conversation copy was rendered directly after the label instead
   of through Web's shared 4px list rhythm.

The action wrapper now self-sizes and only the optional linked-conversation
hint owns the 160px maximum. The row gap matches Web's 10px copy-to-action gap,
the label uses 11px/18px, and both populated and empty conversation branches
reuse one `SettingsWorktreesConversationList` owner.

## Browser geometry

All content anchors are exact between Web and Lynx-for-Web:

| Anchor             | Web                                         | Lynx-for-Web |
| ------------------ | ------------------------------------------- | ------------ |
| Title              | `469/161/540.109375/18`, `12/18/500`        | exact        |
| Path               | `469/181/540.109375/18`, `12/18/400`        | exact        |
| Conversations      | `469/207/540.109375/18`, `11/18/500`        | exact        |
| Empty conversation | `469/229/540.109375/18`, `12/18/400`        | exact        |
| Delete             | `1019.109375/161/47.890625/24`, `10/15/500` | exact        |

Web reports the inner row content at `598x86`; Lynx's bordered/padded row is
`622x106`. Both retained PNGs are exactly `1280x820`. Browser page-error files
are empty; Lynx-for-Web retains only its known host initialization logs and
deprecated-initialization warning.

## Native

- Exact-owned root PID: `35940`.
- PID-derived DevTool client: `localhost:8903`, session 1.
- Session URL:
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`.
- Native root: `1280x788`; raw image: `2560x1576`.
- Row: `622x106`.
- Title: `469/160/540/18`.
- Path: `469/180/540/18`.
- Conversations: `469/206/540/18`.
- Empty conversation: `469/228/540/18`.
- Actions/Delete: `1019/160/48/24`.
- Warning/error console: empty.

The one-pixel vertical offset from Browser is the Native content frame/titlebar
mapping; all internal row intervals and dimensions match.

## Cleanup

- Canonical `git.removeWorktree({ force: true })` removed the managed worktree.
- A subsequent `server.listWorktrees` returned an empty inventory.
- The disposable primary repository and worktree paths were removed.
- SQLite, settings, Native KV, and window state returned to their original
  hashes.
- Owned server, Native app, DevTool client, and named browser sessions exited.
- Existing user clients were not selected or controlled.

## Gates

- Worktrees + Archived focused suites: 2 files, 6/6.
- Final Worktrees focused suite: 1 file, 3/3.
- Final Worktrees/Archived/Advanced regression set: 3 files, 9/9.
- Configured Lynx-for-Web production build: pass.
- Configured Native/Desktop production build: pass with only the existing
  unsupported CSS and optional `ws` native-module warnings.
- Native capture helper: 4/4.
- Reuse strict: pass, Settings 53.91%.
- Style strict: pass, 98.07%.
- `git diff --check`: pass.
- `bun fmt`, `bun lint`, and `bun typecheck` were not run because the current
  conversation does not authorize those heavyweight checks.
