# Populated Automation detail at 320x200

## Newly discovered scope

A canonical disabled/manual automation was opened at `320x200`, dark. Existing
short-height evidence covered only not-found detail and list/empty states.

## P1 product loss

Before:

- compact main was fixed at `246px`;
- viewport height was `200px`;
- aside height collapsed to `0` at `y=246`;
- Edit/Delete/Resume header began at `y=246..292`;
- aside scroller had `scrollHeight=464` but zero visible height.

All detail actions and metadata were unreachable.

`lynx-automation-populated-short-actions-unreachable`: P1 contribution
`1.00 -> 0.00`.

## Root fix

Only compact short-height detail reduces the main pane from `246px` to
`120px`. The 92px breadcrumb header remains intact; the prompt receives the
remaining main space. The aside receives 80px, enough for the complete 46px
action header and a 34px scroll viewport.

## After evidence

At `320x200`:

- main: `320x120`;
- aside: `320x80 @ y=120`;
- Edit/Delete/Resume header: `y=120..166`;
- aside scroller: `34px` visible, `scrollHeight=464`.

At `320x568`, normal compact allocation remains main `246px`, aside `322px`,
actions `y=246..292`.

Web bundle was rebuilt from the final source. Native/Desktop bundle hash:
`506b3bf3f7a8394c2a59a0a93e086cb7836813fa8d9be8972ee87e3b71aaf7c0`.

## Verification

- Focused Automations suite: `11/11`.
- Lynx-for-Web production build: passed.
- Native/Desktop production build: passed with registered warnings only.
- Fixture was created and removed through canonical automation/project RPCs.
- No screenshot retained; local count remained `100`.
