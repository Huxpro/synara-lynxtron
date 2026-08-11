# Current-head Native Landing light 1280

- Scope: exact-owned Native Landing light cell at a persisted `1280x820`
  window. Dark remains unretained because the current DevTool input path did not
  activate the rendered Settings control.
- Source/staged Native bundle SHA-256:
  `14be9892d92605b69c56ddc761fc6bbf15825902ec311a1672229dd1cdbc6fee`.
- Isolated server snapshot SHA-256:
  `a209ba85773882b79b8147779c406fbb67a12dcb723ba7c4ea7ca3168e651cc8`.
- Published `@lynx-js/lynxtron@0.0.9` rendered and connected but did not
  register a DevTool listener while unrelated `@t3tools/lynxtron` owned 8901.
  That run was rejected before evidence capture.
- The temporary published `@lynx-js/lynxtron@0.0.9-dev` diagnostic host uses
  the same main executable bytes, registered the exact-owned process on
  `localhost:8902`, and did not modify workspace dependencies.
- Exact identity:
  - CLI/root PID `9295`, app PID `9300`
  - client `localhost:8902`, session `1`
  - session URL
    `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`
  - unrelated `@t3tools/lynxtron` on 8901 was not touched.
- Runtime geometry:
  - root `1280x820`
  - banner `736x68 @ (400,58)`
  - screenshot `2560x1640`
  - theme light, density comfortable, wide viewport.
- Native residual fixed: the provider error icon's raw SVG previously carried
  the default foreground stroke `#0d0d0d`, so CSS color could not make it red.
  `ProviderHealthBanner` now passes the resolved destructive/warning color into
  the generated SVG. Native DOM now contains `stroke="#e02e2a"` and the
  retained frame matches the Web/Lynx-for-Web error tone.
- Exact-client warning/error console is empty.
- Verification: focused banner tests 3/3; Web and Native/Desktop production
  builds pass.
- Boundary: this closes one current-head Native Landing light cell. It does not
  certify Native dark, 1440, other routes, or the full current-head matrix.
