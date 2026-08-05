# Settings row tone evidence

Status: retained current-head Lynx-for-Web resolved styles

Web's shared sidebar hierarchy uses:

- 95% foreground for inactive Settings navigation and owning-section rows;
- 89% foreground for nested setting titles;
- full foreground for active, hovered, and pressed rows.

Lynx previously rendered all of these at full foreground. The correction lives
on the row owners so icons and labels remain synchronized.

Resolved current-head values:

- active General navigation row: opacity 1;
- inactive Profile navigation row: opacity 0.95;
- Archived search section row: opacity 0.95;
- `Archived: Archived threads` title row: opacity 0.89.

Identity:

- Lynx-for-Web bundle:
  `2dcff5cfca5486cbc7d0aad237732c6ab91a1ba90bf8355d82646452ff7622c1`
- Native/Desktop bundle:
  `39512362d8d0feaa6318a0a1480cf031a9424a0e2b426a265e4020e619d5a9ca`
- Focused navigation/search/chrome tests: 4/4.
- Web and Native/Desktop production builds passed with existing warnings only.
