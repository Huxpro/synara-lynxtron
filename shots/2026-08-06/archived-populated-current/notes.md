# Current-head populated Archived fidelity proof

## Harness

- Date: 2026-08-06.
- Shared owned server: `127.0.0.1:60462`, configured with trusted
  `http://localhost:8921`.
- Web authority: `http://localhost:8921/`.
- Lynx-for-Web: `http://localhost:8921/lynx-current/`.
- Browser viewport: `1280x820`, DPR 1, light / comfortable.
- Shared SQLite snapshot SHA-256:
  `cd3e1e9efe5d373efd3271338eb504f94f98f5aea24a7b3df43acbb9d5e06710`.
- Lynx-for-Web bundle SHA-256:
  `8f139186489c0500f8f090009748db706c309e3808b1f5e5c4d078047451758f`.
- Native bundle SHA-256:
  `f2982a114f0a48cfd33833bb9c7f72fee5ef88fe378aae759fd2428eabf9275f`.

The populated state was created through canonical product commands, not a
SQLite fixture: `thread.create` followed by `thread.archive` for the temporary
thread `Fidelity archived row verification`. All three canonical snapshot APIs
reported that archived thread before capture.

## Finding and repair

The previous empty-state proof did not cover the populated workflow. The real
row exposed two current-head gaps:

1. Web owned both `Restore` and confirmed destructive `Delete`; Lynx exposed
   only `Restore`.
2. Generic Lynx `xs` buttons still rendered as 25px / 12px controls, while Web
   uses 24px controls with 10px / 15px labels and 7px horizontal padding.

Lynx now dispatches canonical `thread.delete` after the same host confirmation
copy as Web. Restore and Delete share one pending-action owner, disable
together, refresh the canonical sidebar snapshot after success, and publish
separate busy/error states. The shared `LxButton--xs` owner now matches the Web
24px / 10px / 15px control instead of requiring per-page corrections.

## Browser geometry

The Web and Lynx-for-Web content anchors are exact:

| Anchor | Web | Lynx-for-Web |
| --- | --- | --- |
| Title | `x=469 y=161 w=478.21875 h=18`, `12/18/500` | exact |
| Description | `x=469 y=181 w=478.21875 h=18`, `12/18/400` | exact |
| Restore | `x=957.21875 y=168 w=53.890625 h=24`, `10/15/500` | exact |
| Delete | `x=1019.109375 y=168 w=47.890625 h=24`, `10/15/500` | exact |
| Action gap | `8px` | exact |

Web reports the inner row content at `598x38`; Lynx reports the bordered row at
`622x58`. Their shared content starts at the same `x=469/y=161` after the
Lynx card's 1px border and 12px/10px row padding.

Both retained PNGs are exactly `1280x820`, and both browser sessions have empty
page-error output. The Lynx-for-Web console contains only web-host setup logs
and the known upstream deprecated-initialization warning. An earlier
`1280x633` diagnostic capture was rejected and replaced after runtime viewport
and PNG dimensions were revalidated.

## Native

- Exact-owned root PID: `71742`.
- PID-derived DevTool client: `localhost:8903`, session 1.
- Session URL:
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`.
- Native root: `1280x788`; raw image: `2560x1576`.
- Populated panel: `624x91`.
- Row: `622x58`.
- Title: `x=469 y=160 w=478 h=18`, `12/18/500`.
- Description: `x=469 y=180 w=478 h=18`, `12/18/400`.
- Actions: `x=957 y=167 w=110 h=24`.
- Warning/error console: empty.

The rendered Native Delete button was activated through exact-client
`Input.emulateTouchFromMouseEvent`. Host output confirms the real
`dialogsConfirm` call and the complete permanent-delete warning. The hidden
system dialog was not confirmed through desktop automation because doing so
would take over the user's mouse/focus. The canonical delete command was then
used only to remove the temporary test thread.

## Cleanup

- The temporary thread is absent from both shell and sidebar snapshots.
- The SQLite main file returned to its original SHA-256 and contains the
  original zero-thread projection; temporary WAL/SHM files were removed after
  owned-server shutdown.
- `settings.json` returned to
  `d221bb251a46a7341676e93bcb682b6c09c89259429c4d2efff4ab5232ec1269`.
- Native KV returned to
  `f53a83aac62fff4c8e7b6dac18d34ce8ffe27970a807a428fa0d9b0ba1a42474`.
- Native window state returned to
  `2dd961d318ba0c6680929b6f58d30c76e82e6aa6f9e3b719955d1e06d69e571b`.
- Owned server, Native app, DevTool client, and named browser sessions exited.
  Existing user clients on ports 8901 and 8902 were not touched.

## Gates

- Archived + Advanced focused suites: 2 files, 6/6 tests.
- Final Archived/Advanced/Worktrees/Providers regression set: 4 files, 13/13
  tests.
- Configured Lynx-for-Web production build: pass.
- Configured Native/Desktop production build: pass with only the existing
  unsupported CSS and optional `ws` native-module warnings.
- Native capture helper: 4/4.
- Reuse strict: pass, Settings 53.91%.
- Style strict: pass, 98.07%.
- `git diff --check`: pass.
- `bun fmt`, `bun lint`, and `bun typecheck` were not run because the current
  conversation does not authorize those heavyweight checks.
