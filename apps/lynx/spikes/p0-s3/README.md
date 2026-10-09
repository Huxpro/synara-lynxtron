# P0-S3: Tailwind v3 Preset Coverage Measurement

**Date:** 2026-07-27
**Tool:** `measure.cjs` — programmatic PostCSS + tailwindcss v3 + @lynx-js/tailwind-preset v0.5.0

## 方法

1. 从 synara web 源码中提取 Top 500 高频 Tailwind class token（见 `classes.txt`）及其出现次数（`classes-with-counts.txt`）。
2. 使用 `tailwindcss` + `@lynx-js/tailwind-preset`（Tailwind v3 preset）编译。
3. 构造 HTML content 源，包含全部 500 个 class 作为 `class="..."` 属性值，Tailwind 按需扫描生成。
4. 解析输出 CSS 的选择器，反转义（`\:` → `:`，`\[` → `[`，`\/` → `/` 等），与输入 500 个 class 求交。
5. 未生成的 class 归入 **❌ 未通过**。
6. 已生成但依赖 Lynx 可能不支持的伪类/变体（`:hover`、`@media`、`data-*` 等）归入 **⚠️ 警告**（宽松判定）。
7. 加权通过率：使用 `classes-with-counts.txt` 的出现次数加权（仅限 Top 500 范围）。

## 样本

| 指标 | 值 |
|------|-----|
| 测试 class 总数 | 500 |
| Top 500 加权总出现次数 | 15,994 |
| 提取程序扫描文件数（全量） | 见 extract-classes.mjs |
| Tailwind 版本 | 3.4.19 |
| @lynx-js/tailwind-preset 版本 | 0.5.0 |

## 结果

### 绝对通过率（class 级别）

| 类别 | 数量 | 占比 |
|------|------|------|
| ✅ 生成成功 | 330 / 500 | **66.0%** |
| └─ ✅ 安全（无标记） | 297 | 59.4% |
| └─ ⚠️ 已生成但含潜在不兼容变体 | 33 | 6.6% |
| ❌ 未生成 | 170 / 500 | **34.0%** |

### 加权通过率（按出现次数）

| 类别 | 加权数 | 占比 |
|------|--------|------|
| ✅ 生成成功（含警告） | 12,815 / 15,994 | **80.1%** |
| └─ ✅ 安全（无标记） | 12,451 | 77.8% |
| └─ ⚠️ 已生成但含潜在不兼容变体 | 364 | 2.3% |
| ❌ 未生成 | 3,179 / 15,994 | **19.9%** |

> 加权通过率（80.1%）显著高于 class 级别通过率（66.0%），因为最高频 class（如 `flex`、`items-center`、`shrink-0`）在 Lynx preset 中均有支持。

---

## ❌ 未通过完整清单（按出现次数降序）

### Top 20

| # | 次数 | Class | 分类 |
|---|------|-------|------|
| 1 | 366 | `text-muted-foreground` | A: 自定义主题色 |
| 2 | 179 | `text-foreground` | A: 自定义主题色 |
| 3 | 154 | `inline-flex` | B: 缺失 display 变体 |
| 4 | 88 | `hover:text-foreground` | C: 伪类变体 + 自定义色 |
| 5 | 86 | `cursor-pointer` | B: 缺失 cursor 插件 |
| 6 | 76 | `pointer-events-none` | B: 缺失 pointer-events |
| 7 | 74 | `tabular-nums` | B: 缺失 font-variant |
| 8 | 70 | `text-muted-foreground/70` | A: 自定义色 + 透明度 |
| 9 | 66 | `outline-none` | B: 缺失 outline 插件 |
| 10 | 65 | `text-[length:var(--app-font-size-ui,12px)]` | D: CSS 变量任意值 |
| 11 | 48 | `font-system-ui` | B: 自定义 font-family |
| 12 | 44 | `block` | B: 缺失 display 变体 |
| 13 | 41 | `text-destructive` | A: 自定义主题色 |
| 14 | 39 | `text-muted-foreground/55` | A: 自定义色 + 透明度 |
| 15 | 35 | `sr-only` | B: 缺失 sr-only |
| 16 | 34 | `border-border/70` | A: 自定义边框色 |
| 17 | 34 | `overflow-y-auto` | B: 缺失 overflow 变体 |
| 18 | 32 | `bg-background` | A: 自定义背景色 |
| 19 | 30 | `border-border/60` | A: 自定义边框色 |
| 20 | 29 | `focus-visible:outline-none` | C: 伪类变体 + 缺失 outline |

### 全部 170 个未通过 class

详见 `report.json` → `classifications.failed`。

### 未通过分类统计

| 分类 | 唯一 class 数 | 加权出现次数 | 加权占比 | 修复难度 |
|------|-------------|-------------|---------|---------|
| **A: 自定义主题色**（`text-foreground`, `bg-muted`, `border-border` 等） | 53 | 1,274 | 8.0% | 🟢 低 — 扩展 theme |
| **B: 缺失 utility 插件**（`inline-flex`, `cursor-pointer`, `outline-none`, `sr-only`, `overflow-*` 等） | 48 | 1,108 | 6.9% | 🟡 中 — 增加/启用插件 |
| **C: 伪类/变体**（`hover:*`, `focus-visible:*`, `dark:*`, `data-*`, `sm:*` 等） | 47 | 515 | 3.2% | 🔴 高 — Lynx 限制 |
| **D: CSS 变量任意值**（`text-[length:var(--)]`, `w-(--var)`） | 12 | 185 | 1.2% | 🟡 中 — 需要 Lynx 变量支持 |
| **E: 复杂任意选择器**（`[&_svg]`, `sm:[&_svg:not(...)]`） | 5 | 57 | 0.4% | 🔴 高 — Lynx 限制 |
| **F: 其他**（`drag-region`, `file-row` 等 synara 特有） | 5 | 40 | 0.3% | 🟢 低 — 逐项配置 |

---

## ⚠️ 警告清单摘要

已生成但使用了 Lynx 可能不支持的伪类/变体的 class（共 33 个，加权 364）：

| 变体类型 | 示例 | 数量 |
|---------|------|------|
| `hover:*` | `hover:bg-[var(--sidebar-accent)]`, `hover:text-[var(--color-text-foreground)]` | 7 |
| `before:*` / `after:*` | `before:absolute`, `before:inset-0` | 5 |
| `group-hover:*` | `group-hover:opacity-100` | 1 |
| `sm:*` | `sm:gap-3`, `sm:flex-row`, `sm:text-sm` | 9 |
| `disabled:*` | `disabled:opacity-50` | 1 |
| `focus-visible:*` | `focus-visible:opacity-100` | 1 |
| `first:*` | `first:border-t-0` | 1 |
| `active:*` | `active:bg-transparent`, `active:scale-[98%]` | 2 |
| `data-*` | `data-[state=active]:bg-accent`, `data-[state=open]:text-muted-foreground` | 4 |
| `dark:*` | `dark:bg-white/5` | 1 |
| `motion-reduce:*` | `motion-reduce:transition-none` | 1 |

详见 `report.json` → `classifications.warned`。

---

## 对 D1 决策的数据性建议

### 选项回顾

- **A: 双 Tailwind** — 保留 web 用的 Tailwind v4 配置，Lynx 端另起 Tailwind v3 + lynx preset
- **B: PostCSS strip** — 统一用 Tailwind v4，编译后用 PostCSS 剥离 Lynx 不支持的规则
- **C: 自收敛子集** — 从 synara class 命中集提取最小支持子集，手写 CSS 或生成

### 数据支持

| 指标 | 值 |
|------|-----|
| **直接可用率**（现成 preset 覆盖） | **80.1%** (加权) |
| 加自定义主题色后 | ~88% |
| 加自定义主题色 + 补齐 utility 后 | ~95% |
| 真·完全不支持（伪类/变体 + 复杂选择器） | ~3.6% (加权) |

### 建议

**推荐 A（双 Tailwind）**，理由：

1. **80.1% 加权可用率**意味着大部分高频 class 直接零成本迁移；补齐主题色（A 类 53 个 class，加权 8.0%）只需要在 Tailwind config 里 `extend theme`，是标准操作。
2. 补齐缺失 utility（B 类 48 个 class，加权 6.9%）也只需要在 Lynx preset 上追加插件或在 preset 中打开更多 core plugin：`inline-flex`/`block`/`contents` 需扩展 display 插件，`cursor-*`/`pointer-events-*`/`outline-*`/`sr-only`/`overflow-*`/`select-none` 等需追加简单 utility 定义。30 分钟内可覆盖。
3. **真·不兼容部分仅 ~3.6%**（伪类 `hover:`/`focus-visible:`/`data-*` 等），可以通过 `uiVariants` 插件（`lynx preset 已内置`）或修改组件 props 替代。这部分需要手动适配但量极小。
4. **B (PostCSS strip) 的问题**：Tailwind v4 和 v3 的解析引擎/插件系统不兼容，无法保证 v4 输出能被 PostCSS 精确裁剪到 Lynx 支持子集；且 v4 用 `@theme`/`@import "tailwindcss"` 而非传统 `@tailwind` 指令，与 Lynx preset 不具通用性。
5. **C (自收敛子集) 的问题**：失去 Tailwind 生态工具（tailwind-merge、clsx 的类型推导等），维护成本高。

### 实现路径概要

```
1. tailwind.config.ts (Lynx 端)
   import lynxPreset from '@lynx-js/tailwind-preset'
   export default {
     presets: [lynxPreset],
     content: ['./src/**/*.{tsx,jsx,ts,js}'],
     theme: {
       extend: {
         colors: {
           foreground, muted, destructive, card, popover,
           border, input, ring, background, /* …synara 色板 */
         },
         fontFamily: {
           'system-ui': ['system-ui', 'sans-serif'],
           /* … */
         },
       },
     },
     // 补齐缺失 utility 可通过 extraPlugins 或覆盖 corePlugins
   }

2. 伪类变体 → 用 uiVariants plugin 或组件内条件 className 替代
   例: hover:text-foreground → className="ui-open:text-foreground" (配合组件的 ui-open class)

3. 生成预设后，实测通过率可预期达到 ~95-97%
```

---

## 附

- 原始数据：`report.json`（含全部 500 个 class 的逐条判定与出现次数）
- 可重跑：`node measure.cjs`（耗时约 200ms）
- 提取脚本：`extract-classes.mjs`
