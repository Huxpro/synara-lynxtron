# Plugin Library Skills wide current evidence

Status: retained matched Electron and Lynx-for-Web evidence labelled
`working-tree-product-change`. It does not yet supersede the archived
`skills-wide-light` snapshot because the Plugin Library implementation stack
that produced it is not independently committed.

## Identity

- Route/state: `/plugins`, Codex provider, Skills tab, populated catalog.
- Backend: `ws://127.0.0.1:54095/`; Lynx server instance
  `9240f5bd-66ad-4e46-8f05-9f739b614103`.
- Theme/viewport: light, `1280x820`, DPR 1; both PNGs are exactly `1280x820`.
- Electron used a temporary CDP viewport override and was restored to its real
  `864x620`, DPR 2 thread view after capture; no persisted window state changed.
- Both clients dismissed the provider-update prompt through its rendered close
  control and activated the rendered Skills tab.
- Both page-error buffers are empty; Lynx relay transport/RPC errors are null.
- Final Lynx-for-Web bundle SHA-256:
  `d87cbcebfa0d9fd62ad3a661f5959ce65d9f8477c7d3b920abeb08dc3072eec8`.

## Result

Whole-frame RGB MAE is `2.1488954397816036%`, down from the archived
`5.449254867089112%`. The final first-row geometry is:

- Electron: `487x68 @ 276,249.5`; glyph `44x44 @ 288,261.5`; enabled check
  `28x28 @ 723,269.5`.
- Lynx-for-Web: `487x68 @ 276,249`; glyph `44x44 @ 288,261`; enabled check
  `28x28 @ 723,269`.

Two product owners caused the remaining pre-fix drift:

1. Native did not reserve Web's 10px scrollbar gutter, making each grid column
   5px too wide and moving every enabled check 5px right. Wide Skills rows now
   reserve that gutter; compact single-column layout explicitly removes it.
2. Native's generated `ListChecksIcon` incorrectly mapped to Tabler
   `checklist`; Electron uses Tabler `list-check`. The generator now maps the
   shared export to the same source SVG.

## Verification

- Plugin Library focused tests: `3/3`.
- ReactLynx best-practices scan for `PluginLibraryPage.lynx.tsx`: zero issues.
- Endpoint-pinned Lynx-for-Web production build: passed.
- Browser cleanup gate: no sessions and no owned browser processes.
