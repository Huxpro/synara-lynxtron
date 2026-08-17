# Native Sidebar Resize And Connection Audit

## Sidebar resize root cause

The visible Native sash accepted hover but rejected every real primary-button
drag. Before the fix:

- exact-owned Native PID: `90267`;
- PID-derived DevTool client: `localhost:8902`, session `1`;
- window bounds: `1280x820 @ (181,159)`;
- sash: `10x820 @ (249,0)`;
- real CGEvent and `cliclick` mouse paths both produced hover;
- mouse down did not mount `SidebarResizeOverlay`;
- sidebar width and persisted storage did not change.

The failure was in the application compatibility guard, not the resize
algorithm. Lynx Desktop Clay forwards the primary button bit as both:

```text
button = 1
buttons = 1
```

even with `alignMouseEventWithW3C: true`. Synara accepted only the W3C
`button = 0`, so `startResize` returned before creating a resize session.

The compatibility boundary now accepts either W3C primary button `0` or the
Desktop primary bit representation `button = 1, buttons = 1`. Secondary and
other non-primary combinations remain rejected.

This supersedes the earlier conclusion in
`shots/2026-08-18/native-sidebar-resize-and-primary-icons/notes.md` that the
user report was only a stale preview. That run used a synthetic event path and
did not prove real system-mouse delivery.

Upstream issue:

- https://github.com/lynx-family/lynx/issues/8664

## Exact real-mouse result

Final verification loaded production bundle SHA-256:

`bedade411c8a016410a1ffa60ecb89db228d253debdabc4659eb33eeb27d13c4`

On exact-owned PID `23082`, DevTool client `localhost:8902`:

- real system mouse down mounted one `SidebarResizeOverlay`;
- real drag moved the sash from `x=249..259` to `x=329..339`;
- release persisted `chat_thread_sidebar_width = 336`.

A cold restart created PID `38518` and a new PID-derived DevTool client
`localhost:8903`. The new renderer restored:

- sash `x=329..339`;
- persisted storage `336`.

No synthetic DevTool input was used as final resize evidence.

## Provider and connection audit

Canonical `server.refreshProviders` returned:

- Codex: `ready`, available, authenticated, `0.147.0-alpha.6.5`;
- Claude: CLI available at `2.1.220`, but genuinely unauthenticated.

`claude auth login` remains open for user OAuth completion. Authentication was
not fabricated.

The isolated user-preview server remained PID `42321` on
`127.0.0.1:58090`. It had run continuously for approximately 30 minutes at
the audit point. Cold-started Native PID `38518` held one established feature
socket to that server.

Ten independent bootstrap negotiation plus
`orchestration.getSnapshot` probes all passed:

- latency: `7..17ms`;
- one server instance:
  `1405e4a2-b612-442d-bc23-504011bd416b`;
- one stable snapshot sequence: `182`;
- failures/timeouts: `0`.

Focused Native reconnect/backoff tests passed `18/18`. This run found no
evidence that the observed Offline incident is an upstream Lynx/Lynxtron
blocker. The earlier incident was the owned server process exiting; the
running server and Native transport recovered normally after restart.

## LogBox

Fresh exact-client DevTool warning/error console output was empty.

One host stderr line appeared after a storage update:

```text
Cannot find 'error' field in json
```

Source inspection attributes it to Lynx DevTool
`DevToolLogBoxManager.extractBriefMessage`, which logs whenever a valid JSON
message lacks a top-level `error` field and then falls back to the original
message. It did not appear in the application warning/error console, did not
open LogBox, and was not reproducible as a product failure. It is recorded as
upstream diagnostic noise, not relabeled as a Synara runtime error.

## Verification

- Sidebar focused tests: `8/8`.
- Native connection/reconnect focused tests: `18/18`.
- Shared automation/provider projection tests: `14/14`.
- Web Automations tests: `33/33`.
- Local PDF preview test: `1/1`.
- `bun lint`: passed with 485 existing warnings and zero errors.
- `bun typecheck`: passed across all seven workspace tasks.
- `bun fmt`: completed; unrelated repository-wide formatter churn was
  restored, and the touched files were formatted directly.
- Formatter/linter config now excludes the pre-existing `.p10-view*`
  cross-repository worktrees so future standard checks do not scan or rewrite
  them.
- `node scripts/lynx-css-report.ts --check`: 29/29 findings in baseline.
- Native/Desktop production build: passed with existing registered warnings.
- Final Rspeedy output and `dist/desktop/main.lynx.bundle` were byte-identical.
- Entry/failure/exit browser gates returned `sessions: []` and zero
  agent-browser-owned processes.
- No screenshot was retained; repository screenshot count remained `100`.
