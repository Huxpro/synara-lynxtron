# Native Sidebar Fixed Navigation And Collection Scroll Ownership

## Product correction

The Sidebar now gives its segmented identity and primary navigation one shared
fixed region. Only the project/chat collections own vertical scrolling:

- fixed: Studio / Projects picker, New thread, Search, Kanban, Pull requests,
  and Automations;
- scrollable: Projects and Chats collection content;
- independently fixed: titlebar and Settings footer.

Web and Lynx consume the same `SidebarSurfaceContent` composition. Native maps
the collection region to the only `scroll-view.AppSidebarScroll`.

## Canonical Native setup

- Isolated server: `127.0.0.1:58092`;
- server instance:
  `b044f0e8-a11e-4dac-af0b-d43cd25bf6bc`;
- canonical RPC data: 12 projects and 36 threads created only through
  `orchestration.dispatchCommand`;
- resulting snapshot sequence: `48`;
- exact-owned Native PID: `97015`;
- PID-derived DevTool client: `localhost:8903`, session `1`;
- session URL:
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`;
- evidence bundle SHA-256:
  `3a04d6cef062cc1975eec385c7a67ada7ad534e6da237e7a069be72e3e3c36b4`.

The host log showed every product RPC using
`ws://127.0.0.1:58092`. The owned PID held the matching established server
connection and the `8903` listener.

## Resolved geometry

At the `1280x820` Native viewport:

- fixed segmented + primary navigation region:
  `256x199.25 @ (0,46..246)`;
- collection scroll viewport:
  `256x530.75 @ (0,246..777)`;
- collection direct content:
  `256x553 @ (0,246..817)`;
- Sidebar Project 01:
  `244x28 @ (6,288..316)`;
- Sidebar Project 12:
  `244x28 @ (6,684..712)`;
- Settings footer:
  `256x44 @ (0,776..820)`.

`DOM.getOuterHTML` confirmed the fixed region directly contains the complete
segmented picker and all five primary navigation rows. The scroll owner
directly contains `SharedSidebarProjectsRoot` and `SharedSidebarChatsRoot`.

## Interaction boundary

The DevTool-supported synthetic touch drag was accepted but did not move the
Native scroll owner. It is not relabeled as a real wheel/gesture pass.

The ownership anatomy is exact-Native evidence. Real foreground wheel
publication for this same `AppSidebarScroll` remains covered by the existing
P7-I3 Native run; this background-only follow-up did not activate or raise the
app over the user's windows.

## Verification and cleanup

- Focused ownership contract: `1 file / 2 tests`.
- Web Sidebar import smoke: `1 file / 1 test`.
- Native/Desktop production build: passed.
- Web production build: passed.
- Native warning/error console: empty before the rejected synthetic-drag
  follow-up probe.
- No screenshot was retained; repository screenshot count stayed `100`.

The evidence run exposed a harness flaw: Native uses the default app KV even
with isolated server state. The temporary project order changed
`synara:renderer-state:v8`. The app was stopped first, then the unique
schema-valid 1692-byte preflight state was restored atomically:

```json
{ "projectOrderCwds": ["/Users/bytedance"], "projectNamesByCwd": { "/Users/bytedance": "Home" } }
```

Window state remained byte-exact at SHA-256
`546a34654182b782d20e93402ef61564803e6a6f12fc3a3a67fb374a3ba8267f`.
Future Native loops must back up both `kv.json` and `window-state.json` during
preflight.

The owned app, server, Web dev process, temporary RPC helper, isolated state,
and evidence endpoint build were removed. The final staged bundle was rebuilt
for the product-default endpoint.
