# Current-head Native Settings General light 1280

- Scope: exact-owned Native Settings General light cell plus current Web
  authority at `1280x820`.
- Native startup used the real deep link `synara://settings/general`; no
  renderer state or SQLite fixture was injected.
- Native identity:
  - CLI/root PID `29608`, app PID `29629`
  - PID-derived client `localhost:8902`, session `1`
  - session URL points to the staged
    `apps/lynx/dist/desktop/main.lynx.bundle`
  - unrelated `another-project` on 8901 was not touched.
- Native dimensions and roles:
  - logical root `1280x820`; screenshot `2560x1640`
  - Settings page `1024x820 @ (256,0)`
  - content rail `672px @ x=432`
  - header `624x54 @ (456,32)`
  - first section `624x155 @ (456,118)`
  - first row `622x61 @ (457,151)`
  - first control `176x32 @ (891,165)`.
- Web authority matches the first control exactly at `176x32 @ (891,165)`;
  the General heading starts at `(456,32)` in both clients.
- Native and Web page/error consoles are empty for the retained cells.
- Production bundle SHA-256:
  `14be9892d92605b69c56ddc761fc6bbf15825902ec311a1672229dd1cdbc6fee`.
- No product patch was needed; this is current-head route certification.
- Boundary: this closes Settings General light/1280 only. Dark, 1440, other
  Settings sections, and the rest of the Native matrix remain pending.
