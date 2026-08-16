# Workspace header at medium width with sidebar closed

## Newly discovered scope

This loop added the real Workspace route at `800x568`, dark, medium, with the
sidebar closed. Workspace was enabled through the deterministic product init
contract `workspaceVisible=open`; its default pane opened the real host-backed
terminal.

The first `/workspace` attempt omitted that contract and correctly rendered no
Workspace surface. It was classified as a missing prerequisite, not a product
pass or loss.

## P1 product loss

Before the fix:

- header: `800x46`;
- title: `x=14..113.19`, `y=6.5..38.5`;
- fixed controls: `x=90..174`, `y=0..46`;
- the title's visible right segment was covered by the titlebar cluster;
- full actions were safe at `x=503.13..786`.

`lynx-workspace-medium-closed-title-overlap`: P1 component contribution
`1.00 -> 0.00`.

## Root fix

Medium Workspace reuses the compact two-row **structure** only when the sidebar
is closed:

- title row `46px` with a `180px` left inset;
- action row `46px` below it;
- full medium action labels remain visible because compact icon-only selectors
  were not extended.

## After evidence

At the same real Workspace state:

- header: `800x92`;
- title row: title `x=180..786`, `y=7..39`;
- actions: full-width row `x=0..800`, `y=46..92`;
- fixed controls remained in the reserved first-row left region;
- real terminal stayed `running` and rendered `Terminal ready.`.

Medium sidebar-open retained `592x46 @ (208,0)`.

Web output/stage SHA-256:
`2a20a4d953a9c661c55c41d1f69200e43c4954227684562e5664fd47b945dffa`.

## Verification

- Focused Workspace suite: `5/5`.
- Lynx-for-Web production build: passed.
- Native/Desktop production build: passed with registered warnings only.
- DOM click established sidebar-closed state only; no toggle interaction pass
  is claimed.
- No screenshot retained; local count remained `100`.
- Every browser command used the guarded wrapper.
