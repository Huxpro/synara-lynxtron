# Native Runtime Endpoint Trim Guard

## Classification

The user-preview error was:

`r.trim is not a function`

The original preview process no longer retained a usable stack, so this run
did not invent a source location from the minified variable name alone.

Lynx official runtime documentation lists `String.prototype.trim` as an
available String API. It also states that automatic JavaScript polyfills are
injected only on iOS. Adding Babel/core-js to Lynxtron would therefore not
repair a non-string receiver and would mask the actual type-boundary bug.

## Bundle attribution

The production Lynx bundle placed the endpoint resolvers together in minified
module `7819`. Before the fix, the module contained unguarded calls equivalent
to:

```ts
explicitUrl.trim()
configuredUrl.trim()
```

The values cross build/runtime boundaries:

- desktop `process.env.SYNARA_WS_URL`;
- Rspeedy compile-time `process.env.SYNARA_WS_URL`;
- renderer explicit runtime endpoint.

Their TypeScript annotations did not protect Native runtime values.

## Fix

- Desktop and renderer endpoint resolvers now accept `unknown`.
- Only a real string is trimmed.
- Non-string object, number, partial runtime payload, or malformed define
  shape falls back to the product endpoint instead of throwing.
- Valid explicit/configured string precedence and WebSocket protocol
  validation are unchanged.

The rebuilt bundle now contains:

```js
var r="string"==typeof e?e.trim():"";
var n="string"==typeof t?t.trim():"";
```

for the renderer endpoint path.

## Exact Native result

- bundle SHA-256:
  `9929d9d8eaa8655b798bec6da9728d2713795ea0bed7c59bcbe8160a5b145c98`;
- exact-owned PID: `5702`;
- PID-derived DevTool client: `localhost:8903`, session `1`;
- session URL:
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`;
- owned PID connected to `127.0.0.1:58090`;
- background runtime probe:
  `typeof String.prototype.trim === "function"`;
- `"  ok  ".trim() === "ok"`;
- Native warning/error console: empty.

This proves the runtime method exists and the repaired boundary does not rely
on a speculative polyfill.

## Verification and cleanup

- Focused endpoint tests: `2 files / 5 tests`.
- Native/Desktop production build: passed with existing registered warnings.
- Default `kv.json` and `window-state.json` restored byte-exact after the
  owned process exited.
- No screenshot was retained; repository screenshot count stayed `100`.
- Entry/exit `browser:gate` returned `sessions: []` and zero
  agent-browser-owned processes.
