# P9-U5 Composer fidelity evidence

Status: Phase 0 diagnostic manifest

## Contract

`manifest.json` is the only Composer evidence source consumed by the
repository comparison gallery. `manifest.js` is generated for offline
`file://` viewing:

```bash
bun run --cwd apps/lynx evidence:composer:write
```

Strict completion remains red until every required client cell is retained:

```bash
bun run --cwd apps/lynx evidence:composer
```

The verifier checks:

- unique state ids;
- explicit route/theme/viewport/project/Plan/Fast/draft/caret/token state;
- required versus optional clients;
- retained/diagnostic/pending/not-applicable status;
- a reason for every non-retained state;
- real PNG bytes and dimensions;
- build and snapshot hashes for retained evidence;
- assertion and console files;
- state echo equality, preventing combined Plan/Fast evidence from being
  reused for a single-mode state.

## Current baseline

- 23 strict Composer states.
- 55 required client cells are intentionally incomplete.
- Legacy Browser captures are diagnostic, not passing evidence, because they
  did not record exact production build hashes and full state assertions.
- The prior DevTool files used JPEG bytes with `.png` names. Exact Native
  project and combined Plan/Fast frames were normalized into real PNG files
  under `native/normalized/`; the original bytes remain unchanged.
- The old hand-written Composer cases were removed from
  `p8-q2/comparison.html`. The gallery now loads Composer states only from the
  generated manifest.

This red baseline is intentional. Later P9-U5 slices replace diagnostic and
pending entries with like-for-like retained Web, Lynx-for-Web, and exact-owned
Native evidence.
