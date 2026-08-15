# Editor terminal rail fidelity loop

## Scope

- Screen: Editor view, Chat rail header and rail surface.
- State: same canonical Editor Changes project/thread, chat visible, terminal rail selected.
- Theme / viewport: light, 1280 x 820, DPR 1.
- Shared isolated state: `.synara-fidelity-editor-changes`, server `127.0.0.1:59260`.
- Lynx-for-Web route: `?route=/thread/editor-changes-thread&editor=open&terminal=open`.

## Web authority

- `New editor rail item` is a 24 x 24 Plus trigger.
- Its menu exposes two distinct product contracts: `New chat` and `New terminal`.
- Selecting `New terminal` opens a Terminal rail tab; Chat and Terminal tabs share the header row and Terminal becomes active.
- `New chat` has a separate draft-thread lifecycle and preserves `view=editor`; it is not claimed by this slice.

## Lynx result

- Added a 24 x 24 Plus trigger and a deterministic `editorNew=open` verification state.
- The Plus modal exposes only the implemented `New terminal` action. No disabled/fake `New chat` row was added.
- Selecting/opening the terminal uses the existing real `ThreadTerminal` runtime in `workspace` presentation mode with terminal id `lynx-editor-rail`.
- Chat and Terminal tabs render in the chat header row; Terminal active state is explicit.
- Closing the real terminal returns the rail to Chat and uses the existing terminal cleanup callback.
- Valid terminal cell:
  - exact relay active at `ws://127.0.0.1:59260`
  - Chat tab `47.27 x 24`, Terminal tab `69.39 x 24`
  - terminal surface `384 x 728` at `(896, 92)`
  - terminal status `running`
  - exactly one `terminal.open` RPC in the retained diagnostics
  - `lastTransportError: null`, `lastRpcError: null`
  - evidence: `lynx-web-terminal-open-1280x820-light.png` (`1280 x 820`)

## Reliability finding

The first terminal capture used a missing workspace path. `ThreadTerminal` cleared its auto-open attempt key on failure, so the `pending` state change retriggered the same effect repeatedly (40 `terminal.open` calls in one short cell).

The fix keeps the attempt key after an automatic failure. A given thread/terminal/cwd tuple now attempts once; the existing Refresh action remains the explicit retry path. This is a P1 reliability fix independent of the missing-workspace harness state.

## Classification

| Item | Classification | Result |
| --- | --- | --- |
| Missing Editor New-terminal rail action/surface | product loss, P2 | closed |
| Repeated terminal auto-open after deterministic failure | product loss, P1 | closed |
| Missing canonical workspace during first terminal cell | harness state loss | fixed by recreating the real Git workspace; no SQLite writes |
| New chat draft lifecycle | missing coverage / P2 residual | still open; intentionally not represented by a disabled control |
| Lynx-for-Web dynamic click path | historical dynamic-event blocker | deterministic state remains the retained evidence for this cell; the global blocker was closed later, but terminal-rail activation still needs a current-head rerun |
| `pullRequests.list` missing `state` key | newly discovered product/RPC loss | closed: Sidebar now passes explicit `{ state: 'open', projectId: null }` instead of leaking QueryFunctionContext |
| Native terminal interaction | missing certification coverage | not claimed; user-owned Native process remained untouched |

## Validation

- Focused Rstest: Editor/Terminal/deep-link/Sidebar suites passed (36/36).
- Production `CI=1 bun run build`: passed after browser sessions and owned browser processes were fully cleaned.
- Browser cleanup gate after the retained cell:
  - `agent-browser close --all`
  - `agent-browser session list` -> `No active sessions`
  - no `agent-browser` or `remote-debugging-port` owned process remained.
- Local screenshot count: 50, below the 100-image limit.
