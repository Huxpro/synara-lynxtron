# Provider update checks off-state

## Contract

When automatic provider update checks are disabled:

- both summary rows say `Automatic checks off`;
- the behind-latest inset list is hidden;
- behind-latest one-click actions are suppressed in Provider tools;
- safe unknown-advisory actions remain available;
- the preference exposes its reset action.

## Real Mutation

The preference started enabled in canonical server settings. Lynx-for-Web used
the rendered `Automatic CLI update checks` switch to call the real
`server.updateSettings` path.

After the mutation:

- server settings contained `enableProviderUpdateChecks: false`;
- SQLite remained byte-identical;
- Lynx-for-Web showed two `Automatic checks off` statuses;
- the update inset list was absent;
- only Cursor, Antigravity, and Droid retained Update actions;
- the reset action was visible.

## Cross-client Web Proof

The first Web cold-route attempt was superseded by route restoration and was
discarded. Retained Web evidence entered through rendered Settings and
Providers controls after the shell stabilized.

Web then showed:

- Providers heading;
- two `Automatic checks off` statuses;
- no behind-latest version rows;
- zero Update buttons;
- zero page errors.

## Restore and Cleanup

Lynx-for-Web used the rendered reset action to restore the preference to true.
The reset affordance disappeared and canonical settings reported
`enableProviderUpdateChecks: true`.

The fresh Lynx query cache had not yet refreshed provider advisories and showed
`No provider updates detected`; this transient cache state is not claimed as a
provider-status refresh result.

After the owned server stopped, the settings file's revision-only writes were
restored to the original bytes:

`d221bb251a46a7341676e93bcb682b6c09c89259429c4d2efff4ab5232ec1269`.

SQLite remained:

`cd3e1e9efe5d373efd3271338eb504f94f98f5aea24a7b3df43acbb9d5e06710`.

No browser sessions or owned listeners remained.
