# Theme Pack Import textarea runtime

- Web inner textarea resolves to `12px/18px`, the system UI stack, and
  `8px 10px` padding. The source-level `font-chat-code text-[11px]` classes
  belong to its outer control and do not win on the inner textarea.
- Native Lynx host now owns the same font and padding values.
- Lynx-for-Web's `x-textarea` inherits host padding into its shadow textarea.
  LynxView's official `injectStyleRules` hook injects one narrowly scoped
  `::part(textarea)` rule to remove the duplicate shadow padding.
- The adopted LynxView stylesheet contains exactly:
  `.SharedThemePackImportTextarea::part(textarea) { box-sizing: border-box;
width: 100%; height: 100%; padding: 0; }`.
- This rule is Web-only and is absent from the Desktop/Lynx bundle.
- Exact textarea-region comparison:
  - light changed ratio `6.74% → 4.99%`, mean difference `4.19 → 2.39`;
  - dark changed ratio `6.77% → 4.97%`, mean difference `4.41 → 2.53`.
