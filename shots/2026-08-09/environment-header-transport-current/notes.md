# Environment header transport overlap

Status: overlap/state semantics fixed; Native panel-open interaction remains a
registered boundary

## Fixture

- isolated server: `127.0.0.1:58820`
- server instance: `e5d68a36-2df3-4b10-9698-601c40dd40b4`
- canonical RPC-created project: `project-env-native`
- canonical RPC-created thread: `thread-env-native`
- local no-remote Git workspace: `/tmp/synara-env-native-fixture`
- `README.md`: one fixed replacement (`+1 / -1`)
- startup route: `synara://thread/thread-env-native`

## Defect

The reconnecting notice and the thread-header controls occupied the same
top-right hit region:

- notice: `1158,8..1268,36`
- Files + Environment controls: `1204,9..1260,37`
- Environment center `1246,23` resolved to
  `TransportStatusNoticeText`

The notice had `z-index: 1000`, so both visible controls were covered whenever
the transport observer reported reconnecting.

The observer also made normal facade socket churn look like failure recovery:
`closeWhenIdle` intentionally retires every completed socket, but the next
first-attempt connection used `everConnected` to publish `reconnecting`.

## Resolution

- reserve the right-header control cluster by moving the notice from
  `right: 12px` to `right: 76px`;
- classify a first-attempt connection from normal `idle` as `connecting`;
- retain `reconnecting` when invalidation/offline recovery or a later retry is
  actually in progress.

After the change:

- notice: `1094,8..1204,36`
- controls: `1204,9..1260,37`
- Environment center resolves to `EnvironmentToggleIcon`
- transport and Environment focused suites: 13/13
- full Native/Desktop production build: pass

## Remaining boundary

The exact-client `Input.emulateTouchFromMouseEvent` stream still does not
activate this specific right-header toggle even after hit testing resolves to
the correct subtree. This reproduces the previously registered Native
right-header synthetic-input boundary. The loaded panel is not claimed through
hidden initial data or direct React state mutation.
