# 08 — 续接 Phase 5–8 长程 Goal Prompt（2026-07-28 版）

> 历史存档（2026-10-08 标注）：本 prompt 写于 `synara-lynx` 独立仓库时期，其中的路径、任务状态与“不运行 fmt/lint/typecheck”等约束均已过期，不要再作为新会话的启动 prompt。当前流程见仓库根 `AGENTS.md` 与 `plan/reports/`。

取代 07 作为新会话的启动 prompt：07 写于 P5-R1 之前，本文件带上了 2026-07-28
会话验证出的真实状态与两条关键方法。复制下面代码块作为新 Goal。

```text
阅读 ~/github/synara-lynx/README.md、plan/LOG.md（重点读 2026-07-28 全部条目）、
plan/01-roadmap.md 与 plan/06-high-fidelity-port.md；执行中按需查 00/02/03/04/05。
本 prompt 是覆盖 Phase 5–8 的单一长程 goal：开始时 goal get 核验并延续，不为每个
roadmap task 创建嵌套 goal，只有达到停止条件才标 complete。

当前状态（上一会话交接，已全部验证）：
- Phase 0–5 全部 completed；P3-E5/E6 pending（卡 D2/D3，不阻塞主线）。
- P6-C1 in_progress。**C1 的门禁是 `threads-shell` 子图 32.04%**（目标 ≥70%）；完整
  `threads` route 27.90% 仅为进度指标（见 D12）。style 98.04%。
- Web production 8,842 modules；slice production 1723.4/1838.8kB；slice rstest 23/0。
- P6-C2~C6、P7-I1~I5、P8-Q1~Q4 共 14 个任务 pending。
- 主仓有 5 个未提交新文件（SidebarFooterSection{,Elements}、SidebarSurfaceContent{,Elements}、
  sidebarSortDefaults）+ Sidebar.tsx / appSettings.ts 改动，属上一轮产物，勿删勿 commit。

上一会话验证出的两条关键方法（决定效率，务必先读 04 的 P-68 与 LOG 对应条目）：
1. 先修平台 port 的线程边界，再谈复用率。共享 Web 图是静态 import 到达 port 的，port 模块
   自带模块级 `background-only` 会让任何拉到它的 screen 在 main-thread 编译期直接失败。
   修好 storage port 后单刀从 +0.05pt 变成 +2.5pt。
2. 大共享模块若导致 Lynx “编译通过但页面不绘制”（如 appSettings 的加载期副作用），
   正解是把需要的纯数据抽成**无副作用**的物理共享模块（参考 sidebarSortDefaults.ts），
   而不是给大模块补 adapter，也不是放弃共享。用 bundle 体积是否增长来验证隔离是否成功。

循环（直到触发停止条件）：
1. 取下一个 pending 且依赖全部 completed 的 P6/P7/P8 任务；同级按 ID。P3-E5/E6 仅在
   D2/D3 已由用户明确决策时才做。
2. 标 in_progress + LOG 写开始心跳；做到 01-roadmap 与 06 的退出标准全满足，然后更新
   01/02/03/04/LOG 并标 completed；总 goal 保持 active。

P6-C1 的精确起点（按 D12 已改为子图口径）：
- **目标是 `threads-shell` 32.04% → 70%**，不是完整 route 的 27.90%。该子图 328 modules /
  320 eligible，入口只有 `components/Sidebar.tsx`，composer/ChatView/terminal/transport 已
  排除并交给 C2/C3。先从这张子图里最大的未映射模块下手。
- 实机截图统一用 `scripts/capture.sh <out.png>`（自动 PID→lsof 定位自有 client，避免误拍
  别的项目，并在“session 在但页面不绘制”时明确报错）。
- 按上一会话方法把 route subtree 逐块放进 compiler：先建临时探针文件 import 真实依赖面，
  `npx rspeedy build --environment lynx` 收真实错误，每条只补最小 adapter；
  **编译通过后必须换成产品消费才算复用**，探针本身不计数，用完删除。
- `routes/_chat.tsx` 的非 DOM 依赖面已验证零新增 adapter 即可编译，直接从“换成产品消费”开始：
  优先 appNavigation + keybindings.resolveShortcutCommand（Lynx 已有原生 Menu ⌘K / ⇧⌘[ ] 通道）、
  lib/spaces.isOrdinarySpaceProject、workspaceStore / threadSelectionStore。
- 之后是量级最大的三块：composerDraft* 图、ChatView.logic、wsTransport/wsNativeApi。

移植硬规则：
- Web 当前组件树/结构/文案/tokens/交互是 source of truth，不重新设计；普通 screen 禁止
  clean-room 重写；复用必须是同一物理源文件被双端构建，复制 JSX 不算。
- 平台差异只能收口在 L1 ports、同 API L2 primitives、集中 CSS patch 与已登记 hard island；
  新增 SPLIT/EXCLUSIVE 必须在 02/03 写证据。
- 保持 Web call-site/import/props 零改动；共享重构必须验证 Web 基线不变。

验证与证据（每刀都要，不可省）：
- Web focused test + slice `npx rstest` + 双仓 build；串行 `node scripts/reuse-audit.mjs`
  与 `node scripts/style-audit.mjs`（先 write 后 --check）；两仓 `git diff --check`。
- 实机截图：production Lynxtron（`NODE_ENV=production SYNARA_ENABLE_DEVTOOL=1`），
  **必须用 PID→lsof 定位自有 client 端口**（端口会被其它项目占用，上一会话曾误拍到别的 app），
  再 list-sessions → take-screenshot → get-console。
- “编译通过 ≠ 能用”：build 绿 + 测试绿 + session 存在都不构成可用证据，必须有像素。
  无法取得像素时回滚该刀，并把阴性结论写进 LOG。
- 视觉契约：每屏 1280×820 与 1440×900，Phase 8 再乘 light/dark；布局锚点 ≤8px、
  字号 ≤2px；截图与 notes 存到 shots/<date>/port/<task-or-screen>/<variant>/。

仓库与安全约束：
- ~/github/synara 的未提交改动属于用户；`origin=Huxpro/synara-lynxtron`、
  `upstream=Emanuele-web04/synara`。允许在自然、已验证检查点提交本迁移范围代码，但
  不要为提交打断当前工作、不得夹带用户无关改动；未明确要求时不 push/PR。
- 不运行 bun fmt/lint/typecheck；绝不运行 `bun test`（只可 `bun run test`）。
  slice 可跑 rstest/scanner/build/pack。
- 不上传/发布，不代用户签名、公证或点击系统权限框；不杀用户进程，只停自己启动的进程；
  临时路由/fixture 用完必须恢复，用户 KV 不改。
- 禁止向用户提问；无明确产品决策时选最保守可逆方案，理由写 03+LOG 后继续。

停止条件（满足其一）：
a. Phase 5–8 所有可达任务 completed；
b. 只剩依赖 D2/D3/D8/D12 等不可代用户决策的任务；
c. 外部硬阻塞且无安全绕法；
d. 同一任务连续三次失败且拆分后仍不能推进。

上下文将尽时先在 LOG.md 写：当前 task、已完成步骤、验证结果、下一条精确命令、进程/PID、
临时文件与发现，再结束。最终输出总简报：完成任务、每阶段出口、reuse 指标、视觉认证矩阵、
已登记差异/硬岛、未提交文件范围与建议的下一决策。

待你决策（不要替用户拍板，遇到就跳过并继续别的任务）：
- D2（终端路径：一期裁剪 vs 投入原生终端）——唯一仍需产品取舍的决策，建议一期裁剪；
  D3 已定案 🟢=c（放弃 0.0.7 webview 兜底，依据 P0-S5 阴性实测）；
  D12 已定案 🟡（≥70% 强制点移至 P6-C6 + C1 自有子图门禁）。
- 主仓 5 个未提交新文件的审查与 commit。
```
