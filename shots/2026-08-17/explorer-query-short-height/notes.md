# Explorer Query at 320x200

## Newly discovered scope

A canonical repository-backed Thread opened the ordinary right-dock Explorer
at `320x200`, dark, with deterministic populated and no-result file queries.
Existing Explorer evidence covered search at normal and Editor compact sizes,
but not the ordinary Thread dock under the 92px compact header.

Identity:

- state directory: `.synara-fidelity-explorer-query-short`;
- server: `ws://127.0.0.1:58090`;
- origin: `http://localhost:8891`;
- project: `project-fidelity-explorer-query-short`;
- thread: `thread-fidelity-explorer-query-short`;
- canonical sequence: `0 -> 1 -> 2`;
- route flags: `explorer=open&explorerQuery=<query>`;
- theme: dark;
- viewport/DPR: `320x200`, DPR `1`.

## P1 product loss

Before the fix, the ordinary Explorer retained its desktop `min-width:480px`
and `top:46px` contract:

- dock: `480x154 @ (-160,46)`;
- sidebar: `240x110 @ (-159,90)`;
- search input: `223x28 @ (-151,98)`;
- entries owner: `239x65 @ (-159,135)`;
- preview: `239x110 @ (81,90)`.

The fixed 240px search/results column was completely left of the viewport. The
dock also started inside the compact Thread header instead of below its 92px
boundary. Both populated and no-result queries shared the same invalid owner:

- populated query `package` returned real search results and a 3496px result
  scroll range, but every result began at negative x;
- no-result query rendered `No matching files.` at
  `x=-90.59375..11.59375`.

`lynx-explorer-query-compact-offscreen`: P1 component contribution
`1.00 -> 0.00`.

## Authority and root fix

Web's `DockExplorerPane` remains a horizontal fixed 240px sidebar plus flexible
preview. The fix preserves that shared anatomy and does not substitute the
Editor vertical stack.

Only the ordinary compact Thread dock now:

- clamps to `left:0`, `width:100%`, `min-width:0`, and no max width;
- starts at `top:92px`, below the compact Thread header;
- reduces short-height dock header to 28px;
- reduces search and preview padding to 4px;
- reduces result-owner padding to 3px so one canonical result remains fully
  visible without changing row height or filtering data.

Normal-size and Editor Explorer contracts are unchanged.

## After evidence

Populated `package` query:

- dock: `320x108 @ (0,92)`, bottom `200`;
- search input: `231x28 @ (5,124)`;
- results owner: `239x43 @ (1,157)`, `scrollHeight=3478`;
- first result: `233x40 @ (4,160)`, bottom exactly `200`;
- preview: `79x80 @ (241,120)`;
- preview empty copy: `x=245..316`, `y=133..187`;
- relay: one connection, zero pending requests, no transport/RPC error.

No-result query:

- the same dock/search/sidebar/preview geometry;
- `No matching files.`: `x=69.40625..171.59375`,
  `y=169.5..187.5`;
- result owner: `239x43`, no overflow;
- preview empty copy remains in bounds.

A temporary post-fix PNG was exactly `320x200`, SHA-256
`55bf67480d7ff2a10fd289c718410797bdfe8cc6a7bb0551f2b9bacc7298d739`,
then deleted. No screenshot was retained.

## Validation and boundaries

- Focused Explorer Rstest passed `2/2`.
- Lynx-for-Web production build passed:
  `output/bundle/web/main.web.bundle` `4541.4 kB`.
- Native/Desktop production build passed with the registered unsupported CSS
  and optional WebSocket dependency warnings.
- Staged Native bundle SHA-256:
  `f5fac46548dfde3e917240e36d86e8f09fea2a22ba5cf9c067291e93cc8ae0b5`.
- Native cannot represent the `320x200` viewport because the host minimum is
  `900x650`; the production build is supporting bundle evidence, not Native
  certification for this responsive cell.
- A first Web authority probe used the correct root-level thread route but
  failed to hydrate and published no controls. It was classified as a harness
  mismatch and was not used as visual product evidence. Web source authority
  supplied the fixed horizontal dock anatomy; canonical Lynx RPC data supplied
  the retained runtime geometry.
- The no-result probe observed the environment-only
  `provider.listModels: codex not found in PATH` error after the Explorer
  geometry had mounted. It is accepted provider noise, not an Explorer pass or
  failure.
- Every browser workflow used `bun run browser:run -- ...`; the failed
  authority probe was followed by an independent double-zero cleanup gate
  before continuing.
