# Provider CLI Resolution

## User-visible failure

The Native provider picker showed:

- Codex: Unavailable;
- Claude: Sign in.

Both command names existed on the shell PATH, but they resolved to temporary
cmux wrapper shims.

## Root cause

The Codex shim delegated to `cmux-codex-wrapper`, which then failed with:

`Error: codex not found in PATH`

The actual authenticated Codex CLI ships with ChatGPT:

`/Applications/ChatGPT.app/Contents/Resources/codex`

Direct verification:

- version: `codex-cli 0.147.0-alpha.6.5`;
- auth: `Logged in using ChatGPT`;
- `app-server --help`: passed.

Claude is a separate case:

- CLI version: `2.1.220`;
- health probe can execute it;
- local auth state is genuinely `auth_required`;
- Synara's Sign in label is truthful until `claude auth login` completes.

## Fix

- Added one shared Codex binary resolver.
- Explicit custom binary paths remain authoritative.
- On macOS, the default `codex` setting uses ChatGPT's bundled binary when
  present.
- Provider health, Codex app-server sessions/forks, and background text
  generation all use the same resolver.
- Unit tests disable automatic bundled discovery unless explicitly requested,
  preventing tests from calling a real subscription.

## Live result

Canonical `server.refreshProviders` returned:

- Codex:
  - `status=ready`;
  - `available=true`;
  - `authStatus=authenticated`;
  - version `0.147.0-alpha.6.5`.
- Claude:
  - `available=true`;
  - version `2.1.220`;
  - `authStatus=unauthenticated`;
  - message: run `claude auth login`.

The user-preview server remained on `58090`, and the exact Native app
re-established an `ESTABLISHED` connection after the server restart.

## Verification

- Resolver/health/app-server tests: `182 passed / 2 skipped`.
- Codex text-generation fake-binary tests: `14/14`.
- Browser ownership gates remained clean.
