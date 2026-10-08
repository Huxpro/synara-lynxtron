# 07 — Phase 5–8 长程 Goal Prompt

> 历史存档（2026-10-08 标注）：本 prompt 写于 `synara-lynx` 独立仓库时期，其中的路径、任务状态与“不运行 fmt/lint/typecheck”等约束均已过期，不要再作为新会话的启动 prompt。当前流程见仓库根 `AGENTS.md` 与 `plan/reports/`。

复制下面代码块作为新 Goal：

```text
阅读 ~/github/synara-lynx/README.md、plan/LOG.md、plan/01-roadmap.md 与
plan/06-high-fidelity-port.md；执行中按需查 00/02/03/04/05。目标是连续完成 Phase 5–8
所有依赖已满足的任务，把当前 clean-room slice 改为复用 Synara Web 原组件树的高保真移植。
本 prompt 本身是一个覆盖 Phase 5–8 的长程 goal；开始时 goal get 核验并延续它，不为每个
roadmap task 创建嵌套 goal。只有达到本 prompt 的停止条件后才把总 goal 标记 complete。

循环（直到触发停止条件）：
1. 从 P5-R1 开始，取下一个 pending 且依赖全部 completed 的 P5/P6/P7/P8 任务；同级按 ID。
   P3-E5/P3-E6 只有在 D2/D3 已由用户明确决策时才执行，否则跳过，不阻塞普通 UI 主线。
2. 把任务标为 in_progress，并在 LOG 写开始心跳；执行到 01-roadmap 与 06 中的退出标准
   全部满足。完成后更新：
   - 01-roadmap：状态/日期/产物与截图链接；
   - 02-compat-matrix：任何新差异或状态变化（✅/🔧/🔀/⬆️）；
   - 03-decisions：新决策/豁免，保守可逆分支标 🟡；
   - 04-lynx-patterns：可复用的新模式；
   - LOG.md：命令、验证、临时发现、下一任务；
   - 将 task 标为 completed，然后进入下一循环；总 goal 保持 active。

移植硬规则：
- Web 当前组件树、结构、文案、tokens 和交互是 source of truth，不做重新设计。
- 普通 screen 禁止 clean-room 重写。必须先把原 Web entry/subtree 放进 Lynx compiler，
  根据真实编译/运行错误增加最小 adapter。
- 复用必须是同一物理源文件被双端构建；复制 JSX 到 .lynx.tsx 不算复用。
- 平台差异只允许收口在 L1 ports、同 API L2 primitives、集中 CSS/utility patch 和已登记
  hard island。新增 SPLIT/EXCLUSIVE 必须在 02/03 写证据。
- 每个 screen 生成 eligible module+LOC reuse 报告，目标 ≥70%；不得靠扩大排除集刷数字。
- 不把 slice 现有页面当设计真源；它们只能作为运行时/数据能力参考，稳定替代后应删除。
- 保持 Web call-site/import/props 尽量零改动；共享重构必须验证 Web 基线不变。

视觉验收：
- 严格按 plan/05-side-by-side.md 启动隔离 Web 与 Lynx，两侧连接同一 58090 Synara server。
- 每屏至少验证 1280×820、1440×900；Phase 8 再乘 light/dark。
- 布局锚点偏差 ≤8px、字号偏差 ≤2px；背景/foreground/border/selected/elevated/focus
  使用同名 semantic tokens；内容/排序/计数必须同源一致。
- 截图与 notes 存到 shots/<date>/port/<task-or-screen>/<variant>/。
- pixel/SSIM 只能辅助；mask 仅限抗锯齿/原生绘制等小区域并在 notes 解释，禁止遮盖布局差异。
- Lynx 截图用 lynx-devtool：list-clients → 按 PID/lsof 定位 client →
  list-sessions → take-screenshot；需要时 get-console/reactlynx tree。

仓库与安全约束：
- ~/github/synara 的现有未提交改动属于用户；先读 AGENTS.md，保留并最小化重叠。
- `synara` 远端拓扑：`origin=Huxpro/synara-lynxtron`、`upstream=Emanuele-web04/synara`；
  `main` 跟踪 upstream/main，默认 push 指向 origin。
- 允许在自然、已验证检查点提交本迁移范围代码，但不要为了提交打断当前 in-progress
  工作，不得夹带用户无关改动；没有用户明确要求时不 push、不建 PR。
- 不运行 bun fmt/lint/typecheck；绝不运行 bun test（只可 bun run test）。
- synara-lynx/slice 可运行 scoped Rstest、scanner、build 与 pack。
- 不上传/发布，不代用户签名、公证、授权或点击系统权限框。
- 禁止向用户提问；无明确产品决策时选最保守可逆方案，备选和理由写 03+LOG 后继续。
- 不杀用户进程；启动实例后记录 PID，只停止自己启动的进程。

停止条件（满足其一）：
a. Phase 5–8 所有可达任务 completed；
b. 只剩依赖 D2/D3/D8 或其他不可代用户决策的任务；
c. 外部硬阻塞且无安全绕法；
d. 同一任务连续三次失败且已尝试拆分仍不能推进。

上下文将尽时先在 LOG.md 写：当前 task、已完成步骤、验证结果、下一条精确命令、进程/PID、
临时文件与发现，再结束。最终输出总简报：完成任务、每阶段出口、reuse 指标、视觉认证矩阵、
已登记差异/硬岛、未提交文件范围和建议的下一决策。
```
