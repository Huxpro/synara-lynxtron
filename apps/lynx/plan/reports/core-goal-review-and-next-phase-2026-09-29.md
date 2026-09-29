# 核心目标复核与下一阶段计划

状态：计划已制定；尚未执行下一阶段。
复核基线：`4e330757413126fec9798fdef0b9739f07f66900`。
范围：当前源码、仓库计划/ledger、上一轮工具日志及临时展示的 Native 画面；本次未启动应用、重跑构建或认证矩阵。

## 1. 核心目标与当前判断

核心目标是让 Synara Lynxtron 在普通 UI 上持续逼近 Electron 的视觉和行为：共享产品组件/状态/语义，在真实工作区完成日常任务，视觉、排版、动效和交互可复验，平台差异明确登记。

依据：

- [高保真移植契约](../06-high-fidelity-port.md)：共享组件树、props、状态和 tokens，平台差异集中在 adapter/硬岛，六屏及双主题双尺寸验收。
- [P10 原始目标](p10-perceptual-fidelity-goal-prompt.md)：从结构相似推进到稳定的 95%+ 主观感知相似度；禁止用测试数、manifest green 或单一分数替代完成。后续用户要求明确以 Electron 为唯一 UI/UX authority。
- [FC 证据规则及最终 disposition](fidelity-continuation-backlog-2026-09-06.md)：历史 PASS 只覆盖被验证的具体状态；普通实现、外部验收和上游阻塞分别陈述。

**判断：共享架构与局部 UI 修复积累可保留；当前版本的整体感知保真和真实工作流完成度尚未得到充分证明。上一轮“全部可安全验证 todo 已完成”的结论过强。不能给出可信的整体完成百分比。**

| 维度          | 当前可确认成果                                                                    | 仍缺的结论                                                                   |
| ------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 产品源码共享  | 已建立 shared composition、platform adapter、组件 Lab 和复用审计                  | 最新核心入口依赖图与重复 owner 需要刷新；历史复用率不能作当前数值            |
| 局部视觉      | DS-179–184 六次提交已在本地历史；边框改为显式 physical properties，既有测试已更新 | 有边框不等于与 Electron 的透明度、位置、占用空间相同                         |
| 状态覆盖      | AF 自动化、FC 状态与 DS 基础组件有大量历史工作                                    | 声明的 Lab case 数不等于当前版本已执行 Native case 数                        |
| 真实任务      | 历史记录包含发送/响应、文件/菜单、重启等证据                                      | 最近几轮退到无工作区状态，不能继承 populated workflow 的验收结论             |
| 输入/辅助功能 | 有 bridge、focus、IME 调查和局部实现/验证                                         | FC-013/014/020/022/025/026/032 仍有外部验收或上游边界；需按当前 runtime 复核 |
| 构建/发行     | 最近切片有 focused tests 与 Lynx/Desktop build 记录                               | 当前全工作区验证、最新完整矩阵、打包 smoke 未由这些记录证明                  |

## 2. 本次发现

### R-01 / P0：部分最终认证未满足数据身份前置条件

DS-182 Native-only run 的普通 RPC 日志仍指向编译时 comparison URL `53477`，而 Terminal RPC 指向新 server `58090`。`apps/lynx/lynx.config.ts` 与 `rsbuild.config.ts` 均把 `SYNARA_WS_URL` 注入构建，运行时换环境变量不能据此推定所有通道已经切换。该 cell 能提供样式观测，但不能作为同一 server/snapshot 的最终认证。

DS-183/184 所展示的画面为 `Thread`/landing；DS-184 Explorer 明确显示 `No workspace.`。此前 server 日志记录隐藏三个 inactive threads，后续启动 sequence 从 249 变为 252。需要调查 thread retention 与当前 route 的关系；暂不能把空工作区画面记为原 populated thread 的认证。

处理：保留代码与历史原始事实；为 DS-182–184 增加当前状态覆盖说明，重跑 populated acceptance。不要直接回滚已落地产品修复。

### R-02 / P1：边框“恢复”未校准 Electron 实际材料

| 对象                    | Electron 源码要求                                                                        | 当前 Native                                                  |
| ----------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Right dock 主分隔线     | `RightDock.tsx` 使用 `--app-surface-divider`；`index.css` 定义为 `--color-border` 的 60% | `thread-right-dock-host.css` 使用完整 `--border`             |
| Explorer sidebar/search | `DockExplorerPane.tsx`、`workspaceExplorer.tsx` 使用 `border-border/65`                  | `explorer-dock.css` 使用完整 `--border`                      |
| Git list/diff 分隔      | `GitPanel.tsx` 使用 `border-border/70`，位于 diff viewport 顶部                          | `git-dock-pane.css` 使用完整 `--border`，位于 file list 底部 |
| 共享 header hairline    | `index.css` 的 `.chat-surface-divider` 用不占布局的 1px background gradient              | 部分 Native 修复用占据边框盒的 1px border                    |

这是明确的源码语义差异，最终像素影响需要 paired runtime 测量。不能将统一的 Native `rgba(...,0.0705882)` 当作各个 consumer 都匹配的证明。

还需验证 DevTool 的空 side-style 是否等于屏幕没有绘制：上一轮主要检查 computed property，未建立 matched style、边缘绘制、几何之间的完整关联。避免把 inspector 序列化差异误判为渲染缺陷。

### R-03 / P1：完成统计的分母与核心目标不一致

177 个 DS 编号完整，说明 ledger 编号覆盖完整；不能推出六屏/状态/主题/尺寸/交互全部合格。AF、FC、P8/P9、P10 的范围不同。FC 最新 disposition 已覆盖旧表，不能因旧行写 OPEN 就重新认定实现缺失；同样不能把 EXTERNAL ACCEPTANCE 从总体可用性报告中消失。

DS-179–184 最近证据主要是 dark/1079×803。历史 P10 完整矩阵针对旧 build；必须明确哪些 cell 可继承、哪些因公共 CSS/token 变化失效。

### R-04 / P1：验证工具失败被过早归因，重复运行成本过高

`Promise was collected` 出现在 Electron CDP 配置阶段附近。launcher 的 catch 会终止 owned children，因此 `dev exited 143` 可能是清理结果，尚不能证明是 Electron 自发退出导致失败。需要保存 activity、CDP request/response、异常堆栈和进程退出先后顺序。

多次相同重试、每次重新构建、64 个 exec processes 警告、重复写入 DS-184 ledger 都表明执行与证据管理需要改进。最终重复 ledger 已被清理，但不能以重复操作作为正常推进方式。

### R-05 / P1：发行与最终门禁缺少当前基线

`01-roadmap.md` 仍将 P8-Q3 packaged-app 和 P8-Q4 完成报告标为 pending；其部分平台描述也已落后于之后的实现。先核对真实 artifact/commit，再决定状态，不机械重做历史任务。

最近未运行 `bun fmt`、`bun lint`、`bun typecheck`；这是遵守用户限制，但意味着无法声称当前已通过这些工作区门禁。下一阶段仍不得自动运行，最终报告应显式标为未运行，待用户明确请求。

## 3. 下一阶段：以完整用户流程验收收敛

顺序：N1 → N2 → N3 → N4 → N5。每项是可独立验收的工作包；优先级由用户可见影响与证据可信度决定，不按 CSS selector 数量推进。

### N1 / P0：修复验证链并重建完成口径

- 单一 run manifest 记录 commit、dirty diff 摘要、runtime 版本、bundle hash、server/stateDir、PID/client/window、theme、viewport/content/DPR、route 与真实 project/thread/message IDs。
- 同时验证普通 RPC、stream 与 Terminal 通道的 backend identity；先启动后端再构建，或采用已有可靠 runtime 配置路径，不硬编码新端口到产品。
- 使用专用真实测试 project/thread，经 canonical RPC 创建并保持活跃；冻结数据 mutation 阶段，记录 sequence 与实体集合。正确配置 isolated retention；禁止直接改 SQLite fixture。
- cell 前检查 active thread、workspaceRoot、消息 tail、文件列表或 Diff 内容；缺失时返回 harness failure，禁止以 landing/No workspace 冒充 populated cell。
- 修复/诊断 `Promise was collected` 的具体失败 activity；保留有界日志、原始错误与 cleanup 结果。复用一个受控 supervisor；失败后按现有规则执行两项 browser ownership gate。
- 给历史结论增加覆盖层：implementation landed / source contract / rendered style observed / paired product verified / external acceptance / upstream blocked。保留旧记录并注明 supersession。

**退出：连续 3 次干净启动都验证同一预期实体与正确后端，无丢线程/错误 URL；人为缺失 thread 或错误 bundle 的负向用例必须拒绝认证；退出后零 owned 进程与 session。**

### N2 / P1：统一校准 surface divider 契约

- 从 Electron 的 shared divider、65%/70% consumer recipe 出发，生成或投影 Native 对应值；保留语义角色与单一来源，避免每个 CSS 文件手填 RGBA。
- 对 DS-180/182/183/184 先量测，再决定颜色/位置/box model 修改；同查共享 header consumers，按语义组批次修复。
- 同时采集 computed、matched、border/content geometry；遵守不保留新截图的要求，可临时显示画面做 paired 检查，落盘数值/文本证据。若确需持久像素分析，作为另行明确的证据需求，不能偷偷留图。
- 回归验证语义映射和运行时视觉目标，避免仅用正则断言“写了哪些 CSS”就宣告通过。

**退出：列出的分隔线均在 light/dark × 两尺寸匹配 Electron 角色、强度和位置；alpha 容差不超过 1/255，关键边缘位置偏差不超过 1 logical px（引擎例外必须有测量说明）；不产生累计布局位移。**

### N3 / P1：六条真实任务链逐条闭环

| ID  | 用户任务链                                                                  | 成功必须包含                                                           |
| --- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| J1  | 已有项目 → 新线程 → 模型/skill/mention → 发送 → 流式输出 → 停止/完成 → 重启 | 真实 provider turn、消息/状态一致、重启恢复，无重复发送                |
| J2  | 读长 transcript → 上滚脱离 → 新输出 → Jump → 切线程返回                     | live-text 驱动跟随、用户位置保持、tool-only 不误吸底、内容身份正确     |
| J3  | 打开 Explorer → 搜索/选择真实文件 → 预览 → Diff → 关闭/重开                 | workspace/file/path 正确、成功与真实读取失败/Retry 均验证、dock 持久化 |
| J4  | 普通页 ↔ Settings 反复切换 → 更改主题/密度 → 保存/恢复 → 重启               | 仅一个正确 sidebar、跨客户端/重启一致、unknown settings 不丢失         |
| J5  | 创建 automation → 编辑 → 暂停/恢复 → 列表/详情返回                          | canonical mutation、字段/状态一致；真实执行与服务边界另行明确          |
| J6  | populated Kanban / PR → 详情或菜单 → 返回 → 恢复连接                        | 数据、排序、计数与动作回写一致；无数据时先准备 canonical fixture       |

**退出：6/6 工作流在 fast loop 与 exact-owned Native 有当前证据；各执行一次正常路径与指定失败/恢复路径。真实 provider/PR 服务不可用时保留具名 blocked cell，不能用展示 fixture 算完成。**

### N4 / P1：固定分母的整页与状态回归

- 六个主表面：landing/composer、populated thread、Settings、Kanban、PR、Automations；每个 light/dark × 1280×820/1440×900，共 24 个 paired 基础 cell。
- Overlay、dock、滚动、loading/error、disabled/focus/pressed、motion 为单独的状态增量集，与 J1–J6 绑定，不能拿 24 个静态 cell 代替交互验收。
- 先在 Web original/Lynx-for-Web 快速迭代；Native 按 bundle 与 size 批量执行，减少重启。无必要不逐改重建全应用。
- 视觉目标仍参考原 fidelity contract；关键 control 对齐目标 ≤2px；超出或保留的引擎差异逐项解释。恢复字体、图标、surface、motion 的 residual 分类，不能只扫描 border。
- 依赖图/样式审计输出至新 run 文件，不覆盖用户 dirty baseline；报告 physical shared 与 generated patched，不扩大 EXCLUSIVE 提高复用率。

**退出：24/24 基础 cell + 所有预先声明的状态增量 cell 通过或具名豁免；零未登记重大残差；无 page errors。观察与产品状态必须来自同一 build/data identity。**

### N5 / P1：打包验收与核心目标报告

- 审核现有 package 工具与历史产物；生成本地 unsigned arm64 包，离开开发 server 验证内置 bundle、普通导航、provider 状态、菜单/深链、重启与数据恢复。此计划不包含发布。
- 刷新四张总表：源码复用、视觉状态、功能工作流、原生平台差异，并映射 P8-Q3/Q4、AF/FC/DS 与原始 P10 success criteria。
- 单列实体键盘/IME、候选窗、剪贴板编辑、Terminal/Composer 焦点切换、VoiceOver 与音频权限等验收。沿用 FC 最新 disposition，当前 runtime 能否解决需重新验证。
- P9-R1 的宿主内核实现边界仍按 roadmap 单独处理；本计划不自动扩大到通用键盘/引擎改造。可先完成调查、最小复现、版本能力对照和可供用户执行的短验收脚本。
- 仅在用户明确要求时，将 fmt/lint/typecheck 合并为一次最终工作区验证；未运行时明确记录，不能盖 complete 章。

**退出：本地发行包 smoke、普通 UI 的全部声明工作流与矩阵有当前证据；外部/上游限制具名、可复现、有 owner。若原生输入仍需人工验收，报告普通 UI 与整体可用性两种状态，整体目标不标全部完成。**

## 4. 执行与计量约束

- 不以新 DS 编号数作为进度。主进度：有效 harness runs、6 条工作流、24 基础 cell、声明状态增量、未关闭高优先级残差、发行包 smoke、原生验收清单。未执行为 unknown，不记 pass。
- 对影响 shared CSS/token 的变更，自动列出受影响 consumers/cells；一个 dark 单节点通过不能继承 light 或别的 viewport。
- 每个 coherent 工作包：量测 → 修复/最小共享抽取 → 必要 focused tests → 比例合适的 build → paired/Native evidence → ledger → 独立提交和推送。
- 连续两次同类 harness 失败后转诊断，不做重复盲目启动；已知进程/session 要正常回收，不终止无关应用或 T3 Code。
- 不使用子代理或 Codebase CLI；不运行 `bun test`；不自动运行 fmt/lint/typecheck；不保留新截图；不覆盖无关 dirty files。
- 本次仅新增该计划文档，不修改产品源码或历史 ledger 状态，也不将计划写入用户 memory。

## 5. 第一项具体行动

从 N1 开始：定位 `configureElectronRenderer` 中最后成功 activity 与 `Promise was collected` 的精确 CDP 请求，确认 143 的先后因果；建立一个经 RPC 创建、不会被 retention 隐藏的真实工作区 fixture，并让旧端口/缺线程自动导致 preflight 失败。验证链通过后，再校准 N2 的 60%/65%/70% divider recipes，同时重新认证 DS-182–184。
