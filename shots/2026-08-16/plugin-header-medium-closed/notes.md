# Plugin header at medium width with sidebar closed

## Newly discovered scope

This loop crossed `800x568` medium with sidebar-closed for app-specific headers.
Automations and Plugin Library were measured in one isolated harness. Workspace
requires a real terminal/workspace state and remains a separate loop.

## Automations product pass

Automations medium closed remained one row with no left-side title:

- Refresh: `x=616.02..648.02`;
- New automation: `x=652.02..788`;
- fixed controls: `x=90..174`.

`lynx-automations-medium-closed-header`: product pass, contribution
`0.00 -> 0.00`.

## Plugin P1 product loss

Before the fix, Plugin medium closed stayed one row:

- Plugins: `x=27..69.38`, safe;
- Skills: `x=97.38..127.92`, covered by fixed controls;
- provider strip continued through the same titlebar row;
- fixed controls occupied `x=90..174`, `y=0..46`.

`lynx-plugin-medium-closed-titlebar-overlap`: P1 component contribution
`1.00 -> 0.00`.

## Root fix and after evidence

Medium Plugin uses the compact two-row header only under
`.AppMain--sidebar-closed`:

- header: `800x92`;
- tabs in row one are inset after fixed controls: Plugins `x=191..233.38`,
  Skills `x=261.38..291.92`;
- providers occupy row two at `y=61.5..76.5`, beginning with Codex `x=27`;
- sidebar-open medium remains one row: `592x46 @ (208,0)`.

Web output/stage SHA-256:
`c0ad94f21a061d646d856f50beadd1d1d99b0f46450e2179eaa54bd904013eee`.

## Harness and verification

- A static search named a nonexistent `.test.tsx` before finding the actual
  `.test.ts`; cleanup reconfirmed both browser zero conditions before work
  continued.
- Focused Plugin suite: `3/3`.
- Lynx-for-Web production build: passed.
- Native/Desktop production build: passed with registered warnings only.
- No screenshot retained; local count remained `100`.
- DOM click established sidebar-closed state only; no toggle interaction pass
  is claimed.
