# Native compact-header batch preflight

## Objective

Batch the recent Web-proven `320px` header fixes into one exact-owned Native
certification run without treating a production build as Native evidence.

## Exact-owned identity

- Host executable: repository-local `@lynx-js/lynxtron@0.0.7`;
- launch root/child: CLI session / owned Lynxtron PID `45465`;
- isolated user data: `/tmp/synara-native-compact-batch-user`;
- isolated server state: `.synara-fidelity-native-compact-batch`;
- server: `ws://127.0.0.1:58090`;
- PID-derived listening client: `localhost:8903`;
- client identity: `App: @synara/lynx`;
- session: `1`, type `lynx`;
- session URL:
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`;
- output/staged bundle SHA-256 before launch:
  `ed6d243d9b4a5b5548d4a5d0929f1efb00bcd7b55599658677e929b97e45d8e3`.

Unrelated clients remained untouched:

- `localhost:8901`: `another-project`, PID `18721`;
- `localhost:8902`: iOS `LynxExplorer`, PID `22037`.

## Compact certification boundary

The isolated state was prewritten as an exact `320x568` outer window. On
startup, the production host normalized it to:

`{"version":1,"bounds":{"x":224,"y":165,"width":1280,"height":820},...}`

CoreGraphics independently measured owned PID `45465` as
`1280x820 @ (224,165)`. DevTool root init data likewise reported
`1280x820` and `SliceRoot--viewport-wide`.

Therefore this host cannot produce a real Native compact viewport for these
cells. The recent `320px` fixes remain Web/Lynx-for-Web proven but Native
compact certification is **missing coverage due to the enforced host minimum**.
It is not reported as a Native pass or product failure.

## Wide regression evidence

The same exact staged bundle rendered a clean wide Landing:

- root: `1280x820`, light, wide;
- sidebar: open, `256px`;
- `ThreadsLandingHeader`: `984x46 @ (256,0)`, content starts `x=276`;
- `New Chat`: `56x18 @ (298,14)`;
- exact-client warning/error console: empty;
- canonical RPC bootstrap completed against the isolated server.

The explicit `ThreadsLandingHeader` owner class was present in Native DOM and
wide geometry remained unchanged.

## Harness classifications and cleanup

- `lynxtron --help` is not a supported introspection path and entered the CLI
  launch lifecycle. It was interrupted; process/client audits proved it left
  no new process or DevTool client.
- The first React Doctor invocation used rejected base syntax `HEAD^`; it ran no
  scan. The actual parent SHA rerun completed with zero errors/warnings.
- Owned Native PID `45465`, server, isolated state, and user data were removed.
- PID-derived `localhost:8903` disappeared; unrelated `8901/8902` remained.
- Browser exit gate returned `sessions: []` and zero agent-browser-owned
  processes.
- No screenshot was retained; local count remained `100`.
