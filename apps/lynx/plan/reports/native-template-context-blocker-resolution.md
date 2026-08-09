# Native template context blocker resolution

Status: Resolved

Updated: 2026-08-09

## Failure

Current production bundles created a LynxView and DevTool session but never
created a document tree. The visible host log was misleading:

```text
An error occurred when parse json: The data couldn’t be read because it isn’t in the correct format.
```

Reading the exact-owned LogBox proxy showed the underlying renderer error:

```text
Decode error: Context construct failed
```

Source tracing narrowed this to `QuickContext::DeSerialize`, after template
container decoding and before ReactLynx initialization.

## Isolation

- Lynxtron `0.0.9` production and `0.0.9-dev` use the same main executable.
  The paired dev release enables the local DevTool connector; the production
  release intentionally does not.
- A rebuilt `52ec3f62` bundle initialized successfully on the same
  `0.0.9-dev` host.
- The first failing `e25a8f7c` bundle failed on that host.
- Reducing the current main bundle to 2.284 MB and 221 snapshot templates with
  local React lazy bundles still failed. Snapshot count and total bundle size
  were therefore correlates, not the root cause.
- Element Template compilation also reached the same context construction
  failure after replacing the incompatible LynxUI surface in a temporary
  probe. Changing renderer backends did not address the bytecode dependency
  graph.

## Root cause

The Environment panel imported pure label helpers from Web action modules:

- `@synara-web/pinnedMessages`
- `@synara-web/threadMarkers`

Those modules also import Web dispatch infrastructure. In the Lynx build this
pulled `nativeApi`, `wsTransport`, Effect RPC, and `apps/web/src/lib/utils.ts`
into both ReactLynx layers. Rspack stats confirmed the unexpected issuer chains,
including large `effect/Effect`, `effect/Stream`, `effect/Schema`, and
`tailwind-merge` modules.

The PrimJS context could deserialize the known-good graph, but not the expanded
graph. The failure appeared when pinned rows were added because their supposedly
pure import crossed into Web runtime code.

## Resolution

- Move `derivePinLabel`, `displayLabelFor`, and
  `deriveThreadMarkerLabel` into schema-free runtime modules under
  `packages/shared`.
- Keep the existing Web modules as action/dispatch facades that re-export the
  shared pure helpers.
- Import those helpers directly from `@synara/shared` in the Lynx Environment
  panel.
- Upgrade Lynxtron, builder, and development plugins together from `0.0.7` to
  `0.0.9`.

No Environment UI, route, interaction, or data capability was removed.

## Verification

- Shared pinned and marker tests: 9 passed.
- Web pinned and marker tests: 25 passed.
- Lynx Environment tests: 4 passed.
- Complete Native/Desktop build passed; staged and output bundle hashes matched.
- Production Lynxtron `0.0.9` initialized the staged bundle and invoked the
  storage, viewport, endpoint, and renderer-ready bridges.
- Exact-owned `0.0.9-dev` registered the PID-derived DevTool client, exposed a
  populated `SliceRoot` document at `1280x820`, and had no error or warning
  console entries.

## Regression guard

Lynx code may import pure Web composition or logic modules only when their
runtime dependency graph remains platform-neutral. Domain transforms used by
both Web and Lynx belong in `packages/shared`; Web modules that also dispatch
through `nativeApi` must not be used as Lynx pure-helper entry points.
