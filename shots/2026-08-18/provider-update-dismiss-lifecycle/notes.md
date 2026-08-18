# Provider Update Dismiss Lifecycle

## Classification

- New scope: provider update prompt × dismiss × same mount/reload/cold process
  lifecycle × Web/Lynx-for-Web/Native.
- Missing coverage:
  `provider-update-dismiss-current-lifecycle`, `1.00 -> 0.00`.
- Intentional lifecycle delta:
  `provider-update-reload-seen-key-lifecycle`, `1.00 -> 1.00`.
- Product result:
  pass.

## Web Authority

Web authority's real Dismiss toast action:

- removed the prompt immediately;
- kept it dismissed across a same-tab page reload;
- did not persist a user preference.

The reload behavior comes from Web's module-level seen-key set. A fresh browser
process/module instance can show the current provider/version key again.

## Lynx-for-Web

Lynx used a real pointer press/release on the prompt's X:

- prompt after dismiss:
  absent;
- current heading:
  still `Skills`;
- relay:
  one connection, socket state `1`, zero pending requests, no transport/RPC
  error;
- page errors:
  empty.

After a page reload, the new Lynx renderer mount showed the prompt again and
established one clean relay connection. Lynx keeps the dismissed key in
component state rather than a module-level set.

This is an intentional renderer-lifecycle delta. Both clients:

- suppress the prompt for the active interaction lifecycle;
- do not write a durable dismissal preference;
- can show a newly detected provider/version key.

## Exact Native

Native used the exact PID-derived DevTool client and the rendered dismiss
button:

- prompt hosts before dismiss:
  one;
- prompt hosts after dismiss:
  zero;
- exact-client warning/error console:
  empty;
- server socket:
  remained established.

The owned Native process was then terminated and relaunched with the same
production bundle and Settings Skills route. The cold process showed the
prompt again, matching the non-durable dismissal contract.

The final Native app remains running for user experience.

## Connection Assessment

No connection defect was reproduced:

- every Lynx-for-Web mount connected once;
- no transport or RPC error occurred;
- Native retained one established server socket before and after dismiss;
- cold Native startup completed config, settings, shell snapshot, skills
  catalog, and renderer-ready RPCs.

No Lynx or Lynxtron upstream issue is warranted from this cell.

## Verification

- Web, Lynx-for-Web, and exact Native real dismiss actions passed.
- Lynx-for-Web reload and Native cold-process behavior were verified.
- No provider update was executed and no settings changed.
- No screenshots added; repository count remained `100`.
- Temporary Native DOM files were removed before commit.
- Every failed/interrupted browser or DevTool command was followed by
  `browser:gate`.
