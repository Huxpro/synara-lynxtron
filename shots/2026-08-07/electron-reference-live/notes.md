# Live Synara Electron reference

Status: retained current Electron authority with real desktop service data

- The reference is an isolated `Synara (Dev)` Electron instance using
  `.synara/electron-fidelity`, Vite `10054`, and CDP `127.0.0.1:19321`.
- Electron owns its desktop backend child and chooses a dynamic loopback port.
  Health was verified with startup, push-bus, keybindings, terminal, and
  orchestration subscriptions ready.
- Provider discovery is real: OpenCode is ready and returned eight actual model
  entries. The machine has no Codex CLI and Claude is unauthenticated; those
  real error states were preserved rather than replaced with fixtures.
- A canonical `orchestration.dispatchCommand` created thread
  `2955a57a-b31a-4eaf-8036-586eb803f0c2` in the isolated Home project with
  `opencode/big-pickle`. No direct SQLite writes were used.
- CDP navigated the renderer through the product hash route. The final page
  reports title `Electron fidelity reference`, model button `Big Pickle`, and
  `offline: false`, with the real composer and environment panel visible.
- `electron-opencode-thread-final.png` is a focus-safe CDP renderer capture at
  1728x1084 logical / 3456x2168 physical pixels (DPR 2).
- `electron-opencode-thread-final.png` is the retained visual authority for
  subsequent Electron-to-Lynxtron alignment. `electron-opencode-thread-final`
  data remains isolated from normal Synara state.
