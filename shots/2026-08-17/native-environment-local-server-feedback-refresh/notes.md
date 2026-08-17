# Native Environment Local Server Feedback Refresh

## Newly Discovered Scope

This exact-owned Native cell extended the resistant-server Stop proof into its
ownership cleanup lifecycle:

`stopped:false feedback -> owned process disappears -> real Refresh -> row and alert clear`

The resistant Node server on `localhost:58191` was created by the current
harness, ignored `SIGTERM`, and produced the real message:

`Stop signal sent; the process is still shutting down.`

## Harness Identity

- Source commit: `97e56d9dc2573c58a7341a4d30ec58bdd528a496`.
- Exact-owned Native window: `900x650`.
- Staged bundle SHA-256:
  `64aecc2b7aec67a2e62f76a1ffbba4f5b31a51476ea8bbf613a718dc414dabbe`.
- PID/lsof-derived client: `localhost:8903/session 1`.
- Every stage reported the same client, session, and bundle URL.
- Unrelated DevTool clients were untouched.

## Real Interaction Evidence

The retained sequence used real Native press/release input:

1. open Local Servers at `(744,220)`;
2. Stop the exact `localhost:58191` row at `(866,332)`;
3. wait for the real failure feedback and retry-ready Stop;
4. force-stop only the current-run-owned resistant process group;
5. verify PID reaped and port `58191` free;
6. activate rendered Refresh at `(872,255)`.

Before process removal:

- popup mounted: `1`;
- owned address row mounted: `1`;
- exact feedback mounted: `1`;
- Stop was `focusable=true`, `aria-disabled=false`, with complete bindings.

After process removal and real Refresh:

- popup mounted: `1`;
- owned address row mounted: `0`;
- owned feedback mounted: `0`.

The alert therefore remains owned by its target PID and disappears when a
refreshed server list no longer contains that process. It does not become a
stale global warning.

## Classification

- `native-environment-local-server-feedback-refresh-cleanup`:
  missing coverage `1.00 -> 0.00`.
- Product-loss contribution: `0.00 -> 0.00`.
- No code change was required.

## Validation And Cleanup

- Host logs proved real `server.stopLocalServer` and multiple
  `server.listLocalServers` requests.
- Exact-owned Native warning/error console contained no entry.
- Temporary JPEG was exactly `1800x1300` and was deleted.
- The resistant process was killed only after its failure state was retained;
  no unrelated process was signaled.
- Owned ports `58090` and `58191` were free.
- All owned app, Synara server, resistant server, state, Git fixture, logs,
  console, and image artifacts were removed.
- Entry and exit `browser:gate` returned `sessions: []` and zero
  agent-browser-owned processes.
- Screenshot count remained exactly `100`.
