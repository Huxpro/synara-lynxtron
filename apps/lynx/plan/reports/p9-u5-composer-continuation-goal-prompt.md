# P9-U5 Composer final gate continuation goal prompt

Updated: 2026-08-04

This is the self-contained prompt for resuming the only unfinished portion of
the active P9-U5 Composer fidelity goal. The checkout on disk is authoritative.

## Goal prompt

```text
继续并完整关闭 Synara P9-U5 Composer fidelity convergence 的最后一个 gate。

工作目录：
`/Users/bytedance/github/synara`

分支：
`huxcx/lynxtron-port-current-state`

当前已推送 HEAD：
`604f4bd89e281c05ecbc33f243c5fba3287f2ad3`
`test(composer): certify detailed composer states`

最终目标：

1. 完成当前未提交的 Web production typecheck 修复 slice；
2. 让完整 workspace `bun typecheck` 通过；
3. 重新运行最终必要 gates；
4. 做一次真实 prompt-to-artifact completion audit；
5. 更新 P9-U5 plan、completion audit 和 LOG；
6. 将 coherent final-gate slice 独立 commit 并立即 push；
7. 只有全部要求真实满足后，才将 P9-U5 goal 标记 complete。

不要停在分析、错误数量下降、局部 typecheck 通过或“剩余问题与 Composer 无关”。
本 prompt 的完成单位是整个 P9-U5 goal，而不是一个中间修复。

## 已完成且必须保护的基线

以下内容已经真实完成、commit 并 push，不要重做、弱化或删除：

- Composer Project Picker、Extras、skill/mention menu 和 selected-token convergence；
- Browser paired evidence；
- exact-owned Native certification；
- 23-state strict manifest，required cells 为零 incomplete；
- dedicated Native Plan-only、Fast-only、attachment、project 和 token states；
- canonical send、structured references、clear/history/paste/failure/restart focused proof；
- production Web、Lynx-for-Web、Desktop builds；
- strict Composer verifier、reuse/style audits；
- exact-owned process、bundle、snapshot、DevTool、console、state restoration 和 cleanup 证据；
- commits：
  - `244be2ee feat(composer): project native inline tokens`
  - `604f4bd8 test(composer): certify detailed composer states`

重要证据：

- `shots/2026-08-03/p9-u5-composer/manifest.json`
- `shots/2026-08-03/p9-u5-composer/manifest.js`
- `shots/2026-08-03/p9-u5-composer/notes.md`
- `shots/2026-08-03/p9-u5-composer/native/`
- production bundle SHA：
  `74272594d98950e1c031e2181dc3b5834aeee5a586d171866aa58ba856b57a11`
- shared snapshot SHA：
  `98753f94c2df90724d0a892353c03bf2fba50bb880de6d9db012f1266f606070`
- PID-derived Native DevTool identity：
  `localhost:8904/session 1`

除非 typecheck 修复确实改变 Composer 产品行为或 evidence contract，否则不要重新采集
Browser/Native 截图，不要重新启动 Native certification harness。

## 开始前读取

1. 根目录 `AGENTS.md`；
2. `apps/lynx/plan/reports/p9-u5-composer-fidelity-plan.md`；
3. `apps/lynx/plan/reports/p9-u5-completion-audit.md`；
4. `apps/lynx/plan/LOG.md`；
5. 本文件；
6. 当前 `git status --short`、`git diff`、`git diff --check`；
7. `apps/web/tsconfig.json`、`apps/web/package.json` 和 root typecheck scripts；
8. 当前 typecheck 输出中涉及的实际源码和第三方类型边界。

先确认 HEAD 和 origin 仍一致，并保护工作树里已有的 typecheck 修复。不得 reset、
checkout、clean、覆盖或丢弃未提交改动。

## 当前未提交 slice

当前工作树已经包含一组有效的 Web production typecheck 修复，重点包括：

- `apps/web/tsconfig.typecheck.json`
- `apps/web/package.json`
- `apps/web/src/platform/events.ts`
- `apps/web/src/components/chat/ComposerReferenceAttachmentsComposition.tsx`
- `apps/web/src/components/chat/ProposedPlanActions.tsx`
- `apps/web/src/components/pullRequest/PullRequestSummaryCompositionElements.tsx`
- `apps/web/src/components/pullRequest/PullRequestsUnavailableState.tsx`
- `apps/web/src/components/settings/DesktopSettingsPanels.tsx`
- `apps/web/src/components/terminal/terminalRuntimeAppearance.ts`
- `apps/web/src/hooks/useCopyToClipboard.ts`
- `apps/web/src/hooks/useMediaQuery.ts`
- `apps/web/src/hooks/useTheme.ts`
- `apps/web/src/notifications/taskCompletion.tsx`
- `apps/web/src/session-logic.ts`
- `apps/web/src/sessionActivity.logic.ts`

`apps/web/src/browser-globals.d.ts` 是无效的 timer ambient overload 实验。如果它仍为空且
没有真实用途，删除它，不要把空占位文件提交。

计划中的 Web production typecheck 配置为：

{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "composite": false,
    "exactOptionalPropertyTypes": false
  },
  "include": ["src"],
  "exclude": [
    "src/**/*.test.ts",
    "src/**/*.test.tsx",
    "src/**/*.browser.ts",
    "src/**/*.browser.tsx"
  ]
}

`apps/web/package.json` 的 `typecheck` 应使用：
`tsc -p tsconfig.typecheck.json --noEmit`

这项配置变更的边界必须保持清晰：

- production typecheck 排除由 Vitest/browser suites 单独编译的 test/browser 文件；
- 只在 Web production config 中关闭尚未完成全仓迁移的
  `exactOptionalPropertyTypes`；
- 其余 strict 选项保持开启；
- 不得设置 `strict: false`、`skipLibCheck: true`、`noCheck`；
- 不得用大范围 `any`、`@ts-ignore`、`@ts-nocheck`、虚假 ambient globals 或删除代码
  来制造 green gate。

## 已知剩余问题

先运行：
`bun run --cwd apps/web typecheck`

以最新输出为准，不要机械相信这份列表。此前剩余项包括：

1. `PullRequestSummaryCompositionElements.tsx`
   - 使用明确 discriminant：
     `if (props.kind !== "checks")`
   - 最终 checks branch 才访问 `props.checks`。
2. `sessionActivity.logic.ts` / `session-logic.ts`
   - `LatestTurnTiming` 的定义与调用方需要一致；
   - 若业务语义要求 `turnId`，使用项目真实 branded ID 类型补齐，而不是 `string` 或
     cast 掩盖。
3. React 18/19 第三方类型边界：
   - `FileDiffView.tsx`
   - `DiffWorkerPoolProvider.tsx`
   - `Icons.tsx`
   - `Sidebar.tsx` 的第三方 DND context children
   - 使用最窄的局部 adapter/component boundary 解决，不全局降级 React 类型。
4. `MessagesTimeline.tsx`
   - 给 `renderItem` 参数真实类型，禁止 implicit `any`。
5. `ChatView.tsx`
   - automation schedule payload 中不要把 `undefined` 字段塞进 Json；
   - 条件构造 optional fields。
6. `Sidebar.tsx`
   - 修复 `globalThis` debug-feature cast；
   - 保持 `ProjectId`、`SpaceId`、`ThreadId` branded types；
   - 不用宽泛 `string`/双重 unknown cast 绕过 domain boundary。

对每个错误先读定义和调用路径，修根因并保持 runtime behavior 不变。修完 Web production
typecheck 后，运行 root `bun typecheck`，继续处理其他 workspace package 的真实失败，
直到完整 workspace gate 通过。不要只运行 Web package 后宣告完成。

## 执行顺序

### Phase 1 — 收口 Web production typecheck

1. 记录当前 status/diff，确认没有 Composer certification 文件被意外改动。
2. 删除无效空 ambient experiment。
3. 修正当前已知 narrowing、domain types、Json payload、render callback 和
   React 18/19 adapter 问题。
4. 迭代运行：
   `bun run --cwd apps/web typecheck`
5. 每轮只修最新错误，不做无关 refactor。
6. Web package 必须 zero type errors。

### Phase 2 — 完整 workspace gate

1. 运行：
   `bun typecheck`
2. 如果其他 package 失败，区分：
   - 本 slice 引入的 regression；
   - workspace 真实 production error；
   - harness/configuration error。
3. 对真实错误做最小、可维护的根因修复；不要以 baseline red 为理由停止。
4. 完整 workspace `bun typecheck` 必须 exit 0。

### Phase 3 — 最终验证

本 goal prompt 明确授权在最终阶段执行所需 workspace checks。遵守根 AGENTS 的
heavy-check 要求，不在迭代中反复运行全套：

1. 先运行针对性检查：
   - `git diff --check`
   - `bun run --cwd apps/web typecheck`
   - 与实际修改相关的最小 focused tests；只使用 `bun run test`，永远不要用
     `bun test`
2. 再运行一次最终 workspace pass：
   - `bun fmt`
   - `bun lint`
   - `bun typecheck`
3. `bun fmt` 可能格式化全仓。运行后必须立即审查 `git status` 和 `git diff --stat`：
   - 只保留本 task 必要的格式变化；
   - 恢复无关的大规模 quote/format churn；
   - 不得因清理格式副作用而恢复或丢失目标修复；
   - 若恢复无关 churn，按最小必要范围复验，不要无意义地再次制造全仓 churn。
4. 重新运行 Composer 最终 gates，确认 typecheck 修复没有破坏已认证基线：
   - `bun run --cwd apps/lynx evidence:composer`
   - `bun run --cwd apps/lynx test:evidence:composer`
   - `bun run --cwd apps/lynx audit:reuse:check`
   - `bun run --cwd apps/lynx audit:style:check`
5. 若源码变化触及 Web runtime/component behavior，运行相应 focused tests 和最小
   production build；若只改类型且 emit/runtime 不变，也至少运行 Web production build：
   - `bun run --cwd apps/web build`

所有命令必须真实通过。warnings 可以记录，但 errors、失败 tests 或 strict verifier
failure 不能被忽略。

### Phase 4 — Prompt-to-artifact completion audit

不要把“manifest green”或“typecheck green”单独当作 goal 完成代理。重新逐项审计
`apps/lynx/plan/reports/p9-u5-composer-fidelity-plan.md` 的原始 goal prompt 和完成标准，
并把每一项映射到代码、测试、manifest、Browser/Native evidence、build 或 cleanup
artifact。

必须至少复核：

- strict matrix 仍为 23 states、zero incomplete required cells；
- Project Picker 和 Extras 仍没有分叉的 ordinary anatomy owner；
- command rows 不使用 `$`、`@`、`/` 文本 glyph 占位；
- selected skill/mention 在编辑器中只显示一次；
- canonical provider text 与 structured skills/mentions projection 正确；
- clear/undo/redo/paste/send/failure/restart 仍有对应证明；
- Plan-only、Fast-only 与 combined state 没有混用；
- Browser evidence 没有冒充 Native；
- manifest、generated manifest.js、notes 没有 stale metadata；
- intentional platform differences 已登记；
- 用户/isolated state 已恢复，owned ports/processes 已释放；
- 零未登记重大视觉或行为差异；
- workspace `bun fmt`、`bun lint`、`bun typecheck` 全部通过。

然后更新：

- `apps/lynx/plan/reports/p9-u5-composer-fidelity-plan.md`
  - Status 改为 complete；
  - 不再写 “final workspace typecheck blocked”。
- `apps/lynx/plan/reports/p9-u5-completion-audit.md`
  - Status 改为 complete；
  - 用最新真实命令结果替换旧 typecheck blocker；
  - 保留历史 baseline 说明仅在它有审计价值时，且明确 blocker 已关闭。
- `apps/lynx/plan/LOG.md`
  - 记录 production typecheck config、根因修复、完整 workspace gate 和最终 completion
    audit 结果。

只有在审计发现 evidence contract 或产品行为被本 slice 改变时，才更新 Composer manifest、
manifest.js、notes 或重新采集 evidence。不要为了“更新时间”制造 stale build metadata。

### Phase 5 — Commit、push 和完成判定

1. 检查最终 diff：
   - 没有空文件；
   - 没有临时日志、build artifacts、harness state、个人路径或无关格式 churn；
   - 没有 staged/unstaged 遗漏；
   - `git diff --check` 通过。
2. 创建一个 coherent final-gate commit，建议：
   `fix(web): close production typecheck gate`
3. commit message 末尾必须且只能有一次：
   `Co-authored-by: TRAE CLI <noreply@bytedance.com>`
4. 立即 push 当前分支。
5. 确认本地 HEAD 与 origin 对齐，工作树 clean。
6. 只有以下条件同时满足，才可将 goal 标记 complete 并向用户报告：
   - Web production typecheck 通过；
   - root workspace typecheck 通过；
   - final format/lint/typecheck pass 通过；
   - Composer strict verifier、regressions、reuse/style audits 通过；
   - 必要 focused tests/builds 通过；
   - prompt-to-artifact audit 全部通过；
   - plan、completion audit、LOG 已更新；
   - commit 已 push；
   - 工作树 clean；
   - 无 required work remaining。

如果遇到真正不可获取的外部依赖，保留准确失败命令、完整错误、已完成范围和下一步；
除此之外继续执行，不要因错误数量多、修复耗时或接近完成而提前停止。

## 工作方式

- 用 plan 跟踪 Phase 1–5，任何时刻只保留一个 in-progress phase。
- 开始耗时 gate 前给用户一句简短进度说明。
- 先检查实际定义、调用方和第三方类型，不猜测。
- 不使用 sub-agents，除非用户在新的对话中明确授权 delegation。
- 不进入 Native Command K shortcut、general host keyboard repair、terminal/browser/PDF/
  voice hard islands。
- 不做无关 cleanup，不修改已认证 UI 设计。
- 每完成一个 gate 立即更新 plan 状态。
- 不以“绝大部分完成”结案；必须关闭整个 P9-U5 goal。
```
