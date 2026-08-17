# Lynx CSS 可移植性报告（机器生成）

生成：node scripts/lynx-css-report.ts ｜ 输入：apps/web/src/index.css, apps/web/src/tokens.css
判定四态：✅ 直接可用 / 🔧 需适配 / 🔀 需重写 / ⬆️ 推上游 / ❓ 未文档化待验证

## 汇总

| 状态 | 条目数 |
| ---- | ------ |
| ✅   | 1      |
| ❓   | 2      |
| ⬆️   | 1      |
| 🔀   | 5      |
| 🔧   | 20     |

## 明细

| 状态 | 类别     | 条目                                                | 语境示例                                                                                | 方案                                                                                                   |
| ---- | -------- | --------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 🔧   | at-rule  | `@media (max-width: 480px) and (max-height: 480px)` | `(max-width: 480px) and (max-height: 480px)`                                            | Desktop 需 enableCSSRule:true；宽度查询与 resize 重求值已实证，system preference signal 仍需 host 验证 |
| 🔧   | at-rule  | `@media (prefers-reduced-motion: reduce)`           | `(prefers-reduced-motion: reduce)`                                                      | Desktop 需 enableCSSRule:true；宽度查询与 resize 重求值已实证，system preference signal 仍需 host 验证 |
| 🔀   | at-rule  | `@property`                                         | `--scroll-fade-t`                                                                       | 未支持 — 注册型自定义属性需替代方案                                                                    |
| 🔧   | at-rule  | `@supports`                                         | `(animation-timeline: scroll())`                                                        | Desktop 需 enableCSSRule:true；恒真 display:flex 已实证命中                                            |
| 🔧   | property | `backdrop-filter`                                   | `backdrop-filter: var(--app-sidebar-backdrop-filter, none)`                             | 无 CSS 入口 — <blur-view> 元素替代；接受差异项                                                         |
| 🔀   | property | `background-clip`                                   | `background-clip: text`                                                                 | background-clip:text 缺                                                                                |
| ✅   | value    | `--app-surface-divider`                             | `--app-surface-divider: color-mix(in srgb, var(--color-border) 60%, transparent)`       | color-mix Lynx 3.x 支持（tokens 依赖；若不达标需构建期展开）                                           |
| 🔧   | property | `cursor`                                            | `cursor: pointer`                                                                       | cursor 部分支持 — 逐值核对                                                                             |
| 🔧   | property | `display`                                           | `display: block`                                                                        | display 仅 linear/flex/grid/relative/none — 默认 linear 布局注意                                       |
| 🔧   | property | `filter`                                            | `filter: none`                                                                          | filter 仅 blur/grayscale/brightness/contrast/saturate — 逐值核对                                       |
| 🔧   | property | `border-radius`                                     | `border-radius: inherit`                                                                | inherit/initial/unset 等全局关键字缺 — 显式值替代                                                      |
| 🔀   | property | `object-fit`                                        | `object-fit: contain`                                                                   | object-fit 缺 — image mode 属性替代                                                                    |
| 🔧   | property | `outline`                                           | `outline: none`                                                                         | outline 缺 — focus ring 接受差异/box-shadow 近似                                                       |
| 🔀   | property | `overflow-x`                                        | `overflow-x: auto`                                                                      | overflow 仅 visible/hidden — scroll/auto 必须 scroll-view/list 重构                                    |
| 🔀   | property | `overflow-wrap`                                     | `overflow-wrap: anywhere`                                                               | overflow-wrap/word-break 缺                                                                            |
| 🔧   | selector | `::-webkit-scrollbar`                               | `::-webkit-scrollbar`                                                                   | 伪元素全无 — 需额外元素或裁剪                                                                          |
| 🔧   | selector | `::after`                                           | `.chat-content-card-backing::after`                                                     | 伪元素全无 — 需额外元素                                                                                |
| 🔧   | selector | `::before`                                          | `.chat-content-card::before`                                                            | 伪元素全无 — 需额外元素                                                                                |
| 🔧   | selector | `::placeholder`                                     | `.editor-file-viewer__comment-input::placeholder`                                       | 伪元素全无 — input placeholder 属性化处理                                                              |
| 🔧   | selector | `::selection`                                       | `.pdf-viewer-page__text-layer ::selection`                                              | 伪元素全无 — 文本选区属接受差异项                                                                      |
| 🔧   | selector | `:disabled(…)`                                      | `.chat-markdown .chat-markdown-task-checkbox:not(:disabled)`                            | 伪类仅 :active — data 属性/状态类替代                                                                  |
| 🔧   | selector | `:first-child(…)`                                   | `.chat-markdown > :first-child`                                                         | 伪类仅 :active                                                                                         |
| 🔧   | selector | `:focus-visible(…)`                                 | `.theme-slider:focus-visible::-webkit-slider-thumb`                                     | 仅 :active 可用 — focus ring 属接受差异                                                                |
| 🔧   | selector | `:focus-within(…)`                                  | `.local-image-preview[data-status="ready"]:focus-within .local-image-preview__download` | 仅 :active 可用                                                                                        |
| 🔧   | selector | `:has(…)`                                           | `[data-slot="sidebar-inset"]:has(.chat-content-card)`                                   | :has() 无 — 结构改造                                                                                   |
| ⬆️   | selector | `:hover(…)`                                         | `.sidebar-icon-button:hover`                                                            | 桌面推上游 + 状态类替代（P0 已记录）                                                                   |
| 🔧   | selector | `:last-child(…)`                                    | `.chat-markdown > :last-child`                                                          | 伪类仅 :active                                                                                         |
| ❓   | selector | `:not(…)`                                           | `.chat-markdown .chat-markdown-task-checkbox:not(:disabled)`                            | 未文档化 — 待验证                                                                                      |
| ❓   | selector | `[data-*]/attr 选择器`                              | `[data-slot="sidebar-inset"]:has(.chat-content-card)`                                   | 属性选择器 Lynx 支持未文档化 — P2 验证                                                                 |
