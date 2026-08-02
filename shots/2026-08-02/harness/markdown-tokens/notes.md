# Markdown mention and skill token paired proof

- Scope: Web original and Lynx-for-Web against the same isolated server,
  thread `lynx-landing-thread-1785672810767-c62ad44e40f9e8`, at
  `1280x820`, DPR 1, light theme.
- The interaction used each product's rendered command menu and pointer
  selection. The persisted messages were sent through the canonical server
  mutation; the database was read only to verify structured projections.

## Skill input and persistence

- Web opens its shared slash menu with `/pol`, groups provider skills, and
  selects `polish` as an inline rich token. Evidence:
  `web-skill-menu.png`, `web-skill-selected.png`.
- Lynx opens its provider skill menu with `$pol`, renders the same description
  and scope metadata, and selects `polish` as a reference chip. Evidence:
  `lynx-skill-menu.png`, `lynx-skill-selected.png`.
- The real persisted user message has id
  `4a8e8d73-fb98-4db5-a7bf-17c34bd61511`, canonical text
  `/polish Reply exactly SKILL-TOKEN-OK and do not use tools.`, and
  `skills_json=[{"name":"polish","path":"/Users/bytedance/.agents/skills/polish/SKILL.md"}]`.
- Both transcript renderers turn the canonical token back into a visible
  skill entity instead of leaking `/polish` as plain text.

## Mention input and persistence

- Web opens the shared mention menu with `@`, selects the real
  `Draft seed task` thread, and displays an inline entity. Evidence:
  `web-mention-menu.png`, `web-mention-selected.png`.
- Lynx opens its thread mention group from the same `@` trigger, selects the
  same real thread, and displays a reference chip. Evidence:
  `lynx-mention-menu.png`, `lynx-mention-selected.png`.
- The real persisted user message has id
  `ab65ee12-c3f9-4250-b0cb-c9f4f0fe2d56`, canonical text
  `@"Draft seed task" Reply exactly MENTION-TOKEN-OK and do not use tools.`,
  and
  `mentions_json=[{"name":"Draft seed task","path":"thread://thread:1785617357970-wy83hd92"}]`.
- Both transcript renderers turn the canonical quoted token back into the
  named thread entity.

## Output geometry and differences

- Web persisted rows: `x=395`, width `736`, height `72.5`; inline token text
  height `15`.
- Lynx persisted rows: `x=407`, width `736`, height `77`; inline token text
  height `17`.
- The `+12px` row anchor delta is explained by the Web transcript's scrollbar
  gutter/message-trail layout in this long thread; the token content width,
  ordering, semantics, and truncation remain intact. This is recorded as a
  shell residual rather than hidden.
- Web owns a single inline rich editor token. Lynx's platform textarea cannot
  host the rich node, so it currently shows a chip plus the canonical
  `/polish` or quoted `@` text. This duplicate input presentation is the
  already-recorded platform-island residual; structured send/output behavior
  is canonical.
- `web-persisted-tokens.png` and `lynx-persisted-tokens.png` show both real
  messages in the same persisted state.
- All ten PNGs are `1280x820`.

## Code-block authority clarification

The current Web-original code surface exposes language/file metadata,
soft-wrap and copy controls, plus horizontal scrolling when wrapping is off.
It does not render line numbers in the authoritative state captured for this
goal. Lynx therefore does not invent line numbers; that item is an explicit
authority absence, not an omitted parity feature. The code-block paired proof
remains in `../markdown/notes.md`.

