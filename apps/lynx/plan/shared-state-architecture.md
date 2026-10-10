# Web / Lynx 共享架构：把共享边界下推到状态与会话层

状态：v3.1（2026-10-10），第一轮完成，第二轮 A 阶段完成、B 阶段进行中。M0–M6 全部合入默认分支，包括 M3b（Thread 页读 `store`）和为恢复单元格矩阵做的上游界面移植；最后一次里程碑检查见"第一轮收尾"。没做的事列在文末"尚未完成"和 [第二轮清单](https://github.com/Huxpro/synara-lynxtron/issues/52)。长期有效的原则与不变量见 [architecture-principles.md](../docs/architecture-principles.md)，本文保留过程、里程碑和指标记录。

## 结论

展示层已经共享，但两端各有一套"会话状态"：

|          | Web（上游）                                                                | Lynx（fork 自建）                                                               |
| -------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 传输     | `wsTransport.ts` + `wsNativeApi.ts` → `NativeApi`                          | `data/synaraClient.lynx.ts`（923 行，43 个文件引用，经宿主 `bridge.synaraRpc`） |
| 读模型   | `store.ts`（zustand）+ `storeSelectors.ts`                                 | `app/queries.ts`（1213 行，react-query 快照；78 处 `useQuery`）                 |
| 会话同步 | `routes/__root.tsx` 里的 `EventRouter`（约 1430 行：快照、事件回放、对账） | `app/router.tsx`（3764 行）里的轮询与 effect                                    |
| 页面编排 | `ChatView.tsx`、`Sidebar.tsx`                                              | `router.tsx` 的 `ThreadPage`、`Sidebar.lynx.tsx`                                |

方案：**让 Lynx 直接运行上游的状态层源码，只在它下面换平台端口**，而不是继续维护第二套实现。

## 依据

1. **上游改动落在哪。** 自上次同步点 `529ad049c` 到 `upstream/main`（567 个提交），`apps/web/src` 非测试改动约 7.3 万行。按 Lynx 复用审计（`p5-r1-reuse-baseline.json`，9 月 10 日的分类，偏旧）：
   - 落在 Lynx 已物理共享的模块：约 1.1 万行（免费拿到）。
   - 落在"目标是共享、Lynx 目前另有实现"的模块：约 2.2 万行。集中在 `Sidebar.tsx`（3194）、`ChatView.tsx`（2503）、`terminalStateStore.ts`、`wsTransport.ts`、`__root.tsx`。这就是每次要手工重做的部分。
   - 不在 Lynx 可达图里（纯 web 或新功能）：约 3.7 万行。
2. **试合 `upstream/main` 到同步分支。** 60 个文本冲突：apps/web 46，server 6，contracts 5，shared 1，其它 2，**apps/lynx 0**。冲突全部出在 fork 改过的上游文件上；Lynx 一侧没有冲突，是因为它是平行实现，上游的行为变化在那里表现为"静默漂移"，要靠人发现。
3. **上一轮同步的手工移植。** 合并提交之后的 12 个移植提交，几乎每个都同时改 `apps/lynx/src/app`（编排/状态）和 `components`/`adapters`（展示）。展示部分是新 UI 必需的；状态部分是重复劳动。

## 分层

| 层                    | 内容                                                                                                              | 源码                     | 可以依赖    |
| --------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------ | ----------- |
| L0 契约               | `packages/contracts`、`packages/shared`                                                                           | 一份                     | —           |
| L1 平台端口           | 传输（socket）、存储、导航、通知/对话框/菜单、剪贴板、计时器、窗口                                                | 接口一份，实现两份       | L0          |
| L2 会话核心（新边界） | `NativeApi` 门面、`store` + selectors、会话同步引擎、草稿/dock/终端等 store、`*.logic.ts`、react-query 的 options | **一份（上游文件原样）** | L0、L1 接口 |
| L3 编排               | 页面级容器与 controller hook（今天的 `ChatView`、`Sidebar`、`router.tsx` 里的页面）                               | 目标一份，逐屏收敛       | L0–L2       |
| L4 展示               | `XxxComposition` 共享；`XxxElements` / `.lynx.tsx` 两份                                                           | 已是现状                 | L0–L3       |
| L5 平台壳             | web 路由文件与全局挂载；Lynx `router.tsx` 的路由表、`adapters/`、`main/`（宿主进程）、主线程脚本                  | 各一份                   | 全部        |

必须留在 Lynx 专属层的：宿主进程与原生桥、主线程脚本、文本输入与 IME、终端渲染、浏览器视图、滚动/测量、Lynx CSS 子集的适配。这些不会因为本方案消失。

## 两条规则

1. **不改上游文件的形状，只在它下面换实现。** 想共享一个上游模块时，不从里面"抽逻辑"（抽取等于永久冲突），而是让这个文件本身能在 Lynx 上跑：把它用到的平台能力收进 `~/platform/*` 端口，由别名换实现。这和展示层的 Composition/Elements 是同一个手法，只是用在状态层。
2. **例外只有壳和逻辑混在一个文件里的情况**，目前是 `__root.tsx` 的 `EventRouter`。这类做一次"纯移动"（整段搬到独立文件并导出，不改行为），并提给上游。

## 展示层要补的纪律

一轮独立的只读分析（默认分支，合并上游之前）给出了同一个方向上的两点补充，都指向"冲突出在 fork 改过的上游文件里"：

- fork 相对上次合并基点在 `apps/web` 改了 331 个上游文件、新增 324 个。新增文件几乎不冲突（与上游撞名的只有 1 个）；冲突来自在上游文件**内部**做的大拆分，例如 `Sidebar.tsx`（−1849 行）、`_chat.settings.tsx`（−815）、`ProvidersSettingsPanel.tsx`（−538）。上游自己也在拆 `ChatView.tsx`，并新增了与 fork seam 撞名的 `ChatSurfaceHeader.tsx`。
- 因此规则 1 对展示层同样适用：拆出来的东西放**新文件**，上游原文件里只留"换 import"级别的改动。已经做对的例子是 `SettingsSection.tsx`（33 行新文件，原文件只换 import）。
- 别名表（`lynx.config.ts` 里约 75 条精确别名，再由脚本镜像到 tsconfig）可以换成一条通用解析规则："存在同相对路径的 Lynx 覆盖文件就替换"。上游侧零改动，新增一个 seam 不再需要改三处。这一条未验证，需要一个小 spike。

## 靠什么防止越界

- **目录即层。** 用 oxlint `no-restricted-imports` 按目录设规则：L2 不得引入 `react-dom`、路由库、`components/ui`、toast；Lynx 专属 API 只允许出现在 `apps/lynx/src/{adapters,platform,main}` 和 `*.lynx.*`。现有的 `no-restricted-globals` 名单扩到 L2 全部文件。
- **棘轮。** 复用审计增加"状态层"子图，并给 Lynx 平行实现设只减不增的计数：`synaraClient.lynx.ts` 的引用数（现 43）、`useQuery` 直连数（现 78）、`router.tsx` 行数（现 3764）。CI 里升了就失败。
- **合并报告脚本。** 每次合上游后自动输出"上游改动 × 层 × Lynx 对应物"表（本文第 1 条依据就是手工跑的这张表），把手工移植队列变成显式清单，而不是靠比对截图发现。

## 分步计划（v1.2，来自设计调查）

调查纠正了两个前提：

- 复用审计把 `wsTransport.ts` / `wsNativeApi.ts` 记为"已共享"是静态图的假象（把 `import type` 和相对路径引用也算进去了）。构建产物里没有这两份代码，`ensureNativeApi()` 在 Lynx 上今天只会抛错。也就是说 Lynx 上现在没有任何 `NativeApi` 在运行。
- Lynx 当初自建客户端的理由一部分已经过时（`TextEncoder` 缺失已补），一部分仍成立：由宿主进程持有 socket（重载不掉线、对比 harness 也按这个假设检查连接），以及 Effect RPC 在 PrimJS 上是否可用至今未验证。

因此传输层选"保留宿主中继"：在 `bridgeCall` 之上做一个与上游 `WsTransport` 同形的兼容类，用别名替换 `~/wsTransport`。它上面的 `wsNativeApi.ts` → `nativeApi.ts` → `store` → `EventRouter` 全部运行上游源码。直连 WebSocket 作为可选的后续替换（第 7 步），替换时别名以上不用改。

| 步  | 内容                                                                                                                                          | 删掉什么                         | 验证                           | 棘轮                               |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ------------------------------ | ---------------------------------- |
| 1   | 兼容传输 + 真实 `NativeApi` 门面；先把 3 个服务器设置函数改走上游门面（请求和推送流各走一遍，作为运行时证明）                                 | 3 个中继函数体                   | Settings 单元格、实时设置同步  | `synaraClient` 导出数下降          |
| 2   | 用确定性生成器从 `__root.tsx` 抽出 `EventRouter`（生成物 + `--check` 防漂移，登记为 PATCHED），补路由和 toast 的 Lynx 垫片，在 `App.tsx` 挂载 | 暂不删，与轮询并存               | Threads / Thread 单元格、J3–J6 | `__root.tsx` 从未映射变为 PATCHED  |
| 3   | Sidebar 改读 `store` selector                                                                                                                 | `fetchSidebarSnapshot`、两处轮询 | Threads 单元格、J3             | `useQuery`、`refetchInterval` 下降 |
| 4   | Thread 页改读 `store`，markdown 解析保留为 Lynx 适配器                                                                                        | 500 ms 轮询、转录行缓存          | Thread 单元格和状态增量、J4–J6 | `router.tsx` 行数下降              |
| 5   | 逐屏换成上游的 query options（Settings → Environment/Git → Kanban/PR → Automations）                                                          | 对应的 `synaraClient` 导出       | 各屏单元格                     | `synaraClient` 引用文件 32 → 0     |
| 6   | 删除 `synaraClient.lynx.ts`（语法高亮留在 Lynx 专属模块）                                                                                     | 整个文件                         | 全矩阵                         | `queries.ts` ≤ 300 行              |
| 7   | 可选：验证通过后改为后台线程直连，删除宿主中继                                                                                                | 宿主中继约 900 行                | 全矩阵 + 连接预检              | —                                  |

第 1、2 步是地基，必须串行；第 3、4 步互不相交；第 5 步可以按屏并行。

永远留在 Lynx 的：`src/main/**`、`platform/*` 的实现、markdown AST 解析适配、宿主语法高亮、`router.tsx` 的路由表与内存历史、转录的 `<list>`、输入框与 IME、终端 / 浏览器 / PDF、静态主题投影。

基线（默认分支，只许降）：`synaraClient.lynx.ts` 被 32 个文件引用；`useQuery` 78 处；`refetchInterval` 15 处；`router.tsx` 3733 行。

## 节奏、止损与全局指标

重构期间门禁分三层，避免每一小步都做一次完整验收：

| 层     | 什么时候跑       | 内容                                                                                                                     |
| ------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 快检   | 每一步           | typecheck、lint、fmt、Lynx 构建，加一次 `compare:desktop --exit-after-certify`（两端起得来、显示同一线程、无运行时错误） |
| 相关检 | 改到某屏时       | 只跑那一屏的单元格和对应的工作流                                                                                         |
| 全检   | 每个里程碑合入前 | 全矩阵和 J3–J6                                                                                                           |

- 里程碑之内，单元格、工作流和棘轮计数当趋势看，允许短暂变差；里程碑合入时必须不低于基线。
- 依赖真实模型回合的工作流失败一次就重跑，通过则记录后继续；只有全检时连续两次相同失败才诊断。
- 截图、像素对比和逐帧对比只在里程碑全检时做。里程碑之间只看脚本的文字输出（单元格和步骤结果、运行时错误数、后端状态），不为确认脚本已经报告的结果去截图或读图。
- **止损。** 一步超过约 90 分钟还没过快检，或同一问题两种做法都失败：回退这一步，把原因记在本文，换备选路径或跳到下一个不依赖它的里程碑。重构暴露的视觉小差异记入清单，不当场修，除非它让全检失败。

判断方向用全局指标，每个里程碑量一次（记录见文末"指标记录"）：

1. **上游合并成本。** 对 `upstream/main` 试合的冲突文件数，以及 `bun run --cwd apps/lynx audit:upstream-merge <基点> upstream/main` 报告的"需手工移植"行数。这个数不降，说明在做局部优化。
2. **状态层共享度。** 上文的四个棘轮计数。
3. **产品健康。** 全矩阵通过数、J3–J6 通过数、运行时错误数。

里程碑：M0 护栏 → M1 传输（第 1 步）→ M2 会话同步（第 2 步）→ M3 读路径（第 3、4 步）→ M4 逐屏收敛（第 5、6 步）→ M5 合上游 → M6 收尾。每个里程碑过全检后合入默认分支。时间不够时，M3 之后先做 M5，M4 在合并后继续。"上游迁移完成"指：Electron 跟上上游，Lynx 构建和门禁通过，上游新增而 Lynx 尚无的 UI 列成移植队列。

## 已定的取舍（2026-10-09）

1. **上游只读。** 不向上游提 PR，也不改上游文件的形状。原先"把 `EventRouter` 纯移动成独立文件并提给上游"的方案作废；平台差异全部由 Lynx 侧的兼容层吸收（别名、平台端口、确定性的 PATCHED 源）。规则 2 的例外随之取消。
2. **顺序。** 先在默认分支上完成分层重构，保证不回退；过程中沉淀本文档为"架构原则与不变量"，并清理被替换掉的平行实现；最后再合上游。"顺序"一节的第 0 步因此移到最后。
3. **对 apps/web 的改动上限。** 只允许平台端口化（`window.x` → `~/platform/x`）和测试钩子（`data-*`），并且每一处都要能在合上游时原样重放。
4. **Lynx 的 RPC 走哪条路。** 保留宿主中继，在其上做与 `WsTransport` 同形的兼容类；直连是可选的后续替换。

上一轮已经解好的"默认分支 → 同步分支"合并存放在分支 `huxcc/shared-state-arch`（本地提交 `b4a572cd8`，未认证），最后合上游时从它继续。

## 指标记录

上游合并成本按默认分支与 `upstream/main` 的合并基点（`a183bac9c`，2,027 个上游提交）计算，单位是 `apps/web/src` 的改动行数。

| 时间点               | 随合并白拿（已共享） | 状态层另有实现（手工） | Lynx 有对应物（手工） | 平台专属 | synaraClient 引用 | useQuery | 轮询点 | router.tsx 行 |
| -------------------- | -------------------: | ---------------------: | --------------------: | -------: | ----------------: | -------: | -----: | ------------: |
| 基线（M0 之前）      |               31,489 |                 21,731 |                36,379 |    3,490 |                32 |       78 |     15 |         3,733 |
| M3a 合入后（M0–M3a） |               34,742 |                 19,131 |                35,726 |    3,490 |                39 |       66 |      8 |         3,705 |
| M5 合上游后          |                    — |                      — |                     — |        — |                39 |       66 |      8 |         3,701 |
| M4/M6 收尾后         |                    — |                      — |                     — |        — |                 0 |       30 |      1 |         3,659 |
| M3b 之后             |                    — |                      — |                     — |        — |                 0 |       29 |      1 |         3,612 |
| 第一轮收尾           |               39,865 |                 19,131 |               104,937 |    3,148 |                 0 |       20 |      1 |         3,581 |
| 第二轮 A 阶段后      |               39,865 |                 19,131 |               104,937 |    3,148 |                 0 |       20 |      1 |         3,581 |
| 第二轮 D 阶段读取方  |                    — |                      — |                     — |        — |                 0 |       13 |      1 |         3,578 |

里程碑检查（M0–M3a 合入后，默认分支 `d576ba279`，2026-10-09）：单元格矩阵 4 种配置（深色、浅色 × 1280×820、1440×900）共 24 个基础格 + 28 个状态增量，全部通过；工作流 J3 12/12、J4 12/12、J5 8/8、J6 10/10（两端合计）。直接把默认分支合 `upstream/main` 的冲突文件数为 256；经由上游同步分支分两段合，第二段上次试合为 60。

读法：

- "第一轮收尾"一行的四个合并成本数是对当前的 `upstream/main`（`6f54f53c6`）重新量的，区间比前几行大（上游在这期间又前进了），所以只有"状态层另有实现"一列可以直接比较：它仍是 19,131 行，全部在 `ChatView.tsx`、`Sidebar.tsx` 和 `wsTransport.ts`。默认分支与 `upstream/main` 的差距为 0，试合没有冲突。

- 基线里的"状态层另有实现"由 7 个文件构成：`ChatView.tsx` 11,709、`Sidebar.tsx` 5,693、`wsTransport.ts` 1,729、`__root.tsx` 1,670、`storeSelectors.ts` 448、`wsNativeApi.ts` 389、`store.ts` 93。
- M1–M3a 之后，`__root.tsx`、`storeSelectors.ts`、`wsNativeApi.ts`、`store.ts` 的 2,600 行改为随合并自动到达（`__root.tsx` 通过生成器）。`wsTransport.ts` 仍需人工跟进，因为 Lynx 用的是同形的兼容类。
- 剩下的 19,131 行里，17,402 行来自 `ChatView.tsx` 和 `Sidebar.tsx` 两个容器。也就是说状态层（L2）已经基本共享，合并成本的大头在编排层（L3），这是 M4 要解决的，也是这套方案里最难的一步。
- 基线的 `synaraClient` 引用数按 grep 记为 32；审计改用 AST 统计后同一时点是 39，所以 32 → 39 不是回退。

### M5：合入 upstream/main（2026-10-09）

PR #34，merge commit `c5672fe7f`。默认分支与 `upstream/main`（`6f54f53c6`）差距为 0。完整记录见 [upstream-sync-2026-10-09.md](reports/upstream-sync-2026-10-09.md)。

- 分两段合：先把重构后的默认分支合进上一轮的同步分支，再合 `upstream/main` 剩余的 567 个提交。
- 对这 567 个提交，`apps/web/src` 的非测试改动里：随合并自动到达 14,653 行；状态层需手工 6,245 行（`ChatView.tsx`、`Sidebar.tsx`、`wsTransport.ts`）；Lynx 有自己的对应物、需手工 42,766 行。
- 共享状态层的检验结果：`EventRouter` 生成器在第二段不用改，重新生成即可；兼容传输按上游的新行为补了一批实现，仍是手工，但有类型断言兜底。
- 带 fork 差异的上游文件 311 → 270。
- 合并后 GitHub CI 26 项全过（用上游的工作流原文件）；工作流 J3–J6 在两端通过；J1 除 Stop 外通过。

合并暴露出来、并已处理的问题：

| 问题                                           | 性质                    | 处理                                               |
| ---------------------------------------------- | ----------------------- | -------------------------------------------------- |
| 41 个上游浏览器测试在 fork 上失败              | fork 在上游文件里的差异 | 5 处原因，4 处还原成上游，1 处重新落位             |
| `useLocalStorage` 跨窗口同步在 Electron 上失效 | 同上，真实产品缺陷      | 存储端口增加 `isWebStorageArea`                    |
| fork 的"首个事件看门狗"会停掉正常会话          | fork 的服务端差异       | 删除，上游已有等价机制                             |
| Lynx 冷启动覆盖已保存的项目偏好                | Lynx 既有缺陷           | 增加存储就绪边界                                   |
| 锁文件把 Web 共用的包抬到上游没用过的版本      | Lynx 的依赖范围         | 以上游锁文件为基础重建，对齐范围，钉住 Lynx 工具链 |

合并后的已知状态：

- **单元格矩阵是红的。** 上游重做了 Electron 的应用外壳，Lynx 还是旧外壳。这是移植队列的第 1 项，不是回退。矩阵恢复为门禁要等外壳移植完成。
- **Stop 后约 14 秒回合才结束**，两端相同，是上游服务端的缺陷（Huxpro/synara-lynxtron#35），未修。
- Lynx 上的替代实现：provider 只用默认账号、收藏模型来自本地预设、分组项目不显示、PR 通过 GitHub inbox 列表读取。

### M4 与 M6：请求路径收敛和收尾（2026-10-09）

PR #37（Settings）、#40（Environment、Git、Explorer、dock）、#41（删除 `synaraClient.lynx.ts`）、#42（query-core 与浏览器环境共用一个 `window`）、#43（删除 fork 自加的 `getSidebarShellSnapshot`）；另有 #38、#39 处理 fork 在上游文件里的差异。

- **Lynx 只剩一条请求路径。** 所有请求、终端事件和连接状态都经上游的 `NativeApi` 门面和兼容传输。`synaraClient.lynx.ts` 已删除，引用数为 0。
- **react-query 的定时刷新以前在 Native 上从未运行。** query-core 把没有 `window` 的后台线程当成服务端。#40 给它绑定了 Lynx 的 `window`；同时删掉 6 处从未生效的 Lynx 轮询，没有把它们打开。
- **经桥的载荷改为 JSON。** 门面路径以前会在桥上丢掉显式的 `null`。
- **fork 在上游文件里的差异**：260 个文件 / 6,672 行 / 400 个 fork 文件 → 184 / 5,883 / 395。做法是构建期的环境注入（#39），76 个上游文件还原为与上游逐字节相同。CI 的棘轮只允许这三个数减少。
- 默认分支与 `upstream/main`（`6f54f53c6`）差距仍为 0，所以这一轮没有可量的试合冲突数。

里程碑检查（默认分支 `54bb0a099`，2026-10-09）：

| 项                   | 结果                                                                                                                                     |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 单元格矩阵，4 种配置 | 基础格 0/24，状态增量 0/28。原因是上游的新应用外壳还没移植（移植队列第 1 项），每个格只有 3 个控件对齐。四次启动都通过认证并干净退出     |
| J2                   | 两端各 6/6                                                                                                                               |
| J3                   | 两端各 6/6                                                                                                                               |
| J4                   | 两端各 6/6                                                                                                                               |
| J5                   | 两端各 4/4                                                                                                                               |
| J6                   | 两端各 5/5                                                                                                                               |
| J1                   | 除 Stop 外两端通过。Stop 一步不稳定：4 次运行里 Native 失败 2 次，Electron 3 次里失败 2 次，表现都是"Stop 后 13–16 秒回合才结束"，即 #35 |
| GitHub CI            | #41、#42、#43 各 25/25                                                                                                                   |
| Lynx rstest          | 25 个文件 / 22 个用例失败，与改动前的集合相同（#10）                                                                                     |

### M3b：Thread 页读 `store`（2026-10-09）

- **挡路的上游缺陷在生成器里修。** `EventRouter` 把通过序号栅栏的线程事件放进 `pendingDomainEvents`，约 100 ms 后才写入 `store`；线程快照（流里的 snapshot，或回合进行中周期性的 `getThreadDetailSnapshot` 对账）立即替换线程，却不处理这个队列，于是快照已包含的增量在 flush 时又被追加一次。服务端在事件自己的事务里提交 hot 投影和游标，所以序号不大于快照序号的事件一定已在快照里，可以安全丢弃。补丁 `drop-queued-thread-events-covered-by-snapshot`（`scripts/event-router-patches.mjs`）在两处快照应用之前过滤队列；上游形状变化时生成器停止，上游自己修复后补丁不再生效并提示删除。没有选"在读取边界过滤"：重复的文字已经写进 `store`，读取方无法区分它和真实内容。
- **Thread 页不再发请求。** `router.tsx` 的 `thread-detail` 查询、shell 事件触发的失效和三处手动失效都删了，换成 `useThreadPageData`：上游的 `createThreadSelector` 加 `threadDetailSyncById`，加载/失败的判定用上游的 `resolveThreadDetailHydration`。转录行和头部摘要的推导还是上游的函数（`session-logic`、`MessagesTimeline.logic`），接线在 `threadPageProjection.logic.ts`。
- **最近打开的线程靠上游的 retention 保留**（`retainThreadDetailSubscription`）。不保留的话路由一离开详情就被释放，回到刚看过的线程会先出现加载态；以前由 query 缓存兜住。
- **行为变化**：流式增量按 `EventRouter` 的节奏到达（首个增量立即，其后每 100 ms），不再等 shell 事件加一次整线程请求；断线时已加载的内容保留、不显示错误；头部的项目名用 `store` 里的名字（本地改过名的显示本地名，与侧边栏一致）。

### 第一轮收尾：恢复单元格矩阵（2026-10-09）

合上游之后矩阵全红（基础格 0/24，状态增量 0/28），原因是上游重做了应用外壳。为了让门禁重新成立，矩阵覆盖的界面全部按上游移植：

| PR  | 内容                                                                   |
| --- | ---------------------------------------------------------------------- |
| #45 | Lynx 单元测试全部通过，并成为 fork CI 的阻塞步骤（原先 25 个文件失败） |
| #46 | M3b：Thread 页读 `store`；上游排队增量重复的缺陷在生成器里修           |
| #47 | 应用外壳：图标栏、顶栏、面板列、线程标签页、图标化的头部按钮           |
| #48 | provider 模型选择器、dock 头部、diff 工具栏                            |
| #49 | Code review 页面（GitHub inbox）、Appearance 的主题包编辑器            |
| #51 | diff 的 change markers 和上游的 diff 正文布局                          |
| #53 | Lynx 专属的 About 对话框（Help 菜单），显示 Lynx 和 Lynxtron 标记      |

背后功能没有移植的控件按占位处理：放在上游的位置、用上游的标签、点击后说明"Native 应用暂不支持"。占位算完成；逐项清单（含重要性和难度）在 [#52](https://github.com/Huxpro/synara-lynxtron/issues/52)。

里程碑检查（默认分支 `4752b56bb`，2026-10-09）：

| 项                      | 结果                                                                                                                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 基础格，4 种配置        | 24/24                                                                                                                                                                                       |
| 状态增量，4 种配置      | 28/28。深色 1440×900 跑了三次：前两次各有一个格报 "The operation was aborted"（DevTool 连接中断，不是几何差异，两次是不同的格），第二次与另一个 agent 的 harness 重叠；机器空闲时第三次 7/7 |
| Native 控制台错误       | 四种配置都是 0                                                                                                                                                                              |
| J3、J4                  | 两端各 6/6                                                                                                                                                                                  |
| J5                      | 两端各 4/4                                                                                                                                                                                  |
| J6                      | 两端各 5/5                                                                                                                                                                                  |
| J2                      | Native 三次都是 6/6。Electron 五次都在"输出流动时滚开"一步失败（三次"移动了 37px"，其余是时序类报错）；更早的检查里它通过过。未查明原因                                                     |
| J1                      | 三次里两次在 Stop 一步失败，两端都有（#35）；第三次两端 6/6                                                                                                                                 |
| Lynx rstest             | 1,514 通过，0 失败（#53 合并后的树）                                                                                                                                                        |
| GitHub CI               | #45–#53 各 25/25；其中 #49、#51 各重跑一次，原因是同一个上游浏览器测试不稳定（#50）                                                                                                         |
| fork 在上游文件里的差异 | 184 个文件 / 5,883 行 / 395 个 fork 文件，这一批移植没有增加                                                                                                                                |

里程碑门禁是全矩阵和 J3–J6，都通过。J1 和 J2 不在门禁里，上面如实记录。

过程中修掉的产品缺陷：流式文本在快照之后会重复（#46）；主题包编辑不重绘 CSS 变量驱动的界面，因为 Lynx 以前忽略内联自定义属性（#49）；后台存储写入失败会产生未处理的 promise rejection（#45）；分栏 diff 里两位数行号换行使行高翻倍（#51）。

没有验证的：开启内联自定义属性后没有做颜色或像素回归；Code review 页面没有在有数据的情况下跑过（夹具没有 GitHub remote）；悬停、键盘和拖动类的物理输入。

### 第二轮：J2 与 J3 的根因（2026-10-10）

| 问题                                      | 根因                                                                                                                                                                                                                                                  | 修复                                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| J2 在 Electron 的"输出流动时滚开"一步失败 | 步骤的时序，不是 fork 的差异。70 行的回复有时 5.5 秒就流完，而"跟随"加"滚开"两步要回合持续约 7 秒。回合在采样窗口内结束时，上游会移除回复上方 36.5px 的 "Working for" 行，锚点行上移 37px，被记成"新输出移动了读者"；回合更早结束就是另外两种时序报错 | 被跟随的回合改为 210 行；只统计读取之后回合仍在运行的采样，采到至少 4 个且其中 2 个在新文本之后为止，回合先结束就报"回合在检查中结束"；锚点取视口内露出最多的消息行（原来取视口中线上的行，中线落在 "Working for" 行上时报"没有可锚定的行"）；首段文本的等待从 60 秒改为 180 秒（实测过 43 秒）。位移阈值仍是 2px，没有放宽 |
| J3 在单元格矩阵之后 Native 超时           | 两个原因叠加。`add-panel-menu` 增量把 Diff 面板留在 dock 里，J3 的标签顺序变成 Diff、Explorer；Native 的 dock 标签不随标签条收缩（Electron 两个标签各 186px，Native 各 216px），第二个标签的关闭按钮落在 "Maximize panel" 下面，点关闭变成了最大化    | 标签行按上游 `SurfaceContentTabs` 的规则收缩到 108px 再滚动（dock 和线程标签条共用 `contentTabListStyle`）；增量在关闭时把 dock 恢复成打开前的样子                                                                                                                                                                          |

J2 的排除过程：让 Electron 加载 `upstream/main` 的原始 `apps/web`（只保留 `Sidebar.tsx` 的 6 行 `data-*` 测试钩子，harness 认证需要），同一个探针得到相同结果，回合结束时回复行上移 37px、`scrollTop` 不变。fork 对 `MessagesTimeline.logic.ts` 和 `ChatView.logic.ts` 的改动与滚动无关，没有文件需要恢复，fork 差异数字不变。

上游行为（未在上游提 issue，J2 不把它当失败）：纯文本回合结束时 "Working for" 行被移除，它下面的内容上移 36.5px，`scrollTop` 不补偿。读者已经滚开、这一行在视口上方时，正在看的内容会跳 37px。复现：发一条不用工具的长回复，流式输出时上滚约 120px 让 "Working for" 行离开视口，等回合结束。带工具的回合不受影响，那一行会变成等高的 "Worked for"。

验证（深色 1280×820，同一个 Native 构建；当时机器上别的 agent 在构建，负载均值 100–260）：

| 项                         | 结果                                                                                                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| J2，没跑过单元格的会话     | 连续 3 次两端 6/6                                                                                                                                                               |
| J2，单元格矩阵之后         | 连续 3 次两端 6/6。此前同一会话里有一次 Electron 在"跟随"一步超时：服务端日志显示这个回合被 provider 拒绝（等 `~/.codex/.synara-shared-continuation-v1.lock` 超时），不是渲染端 |
| J3，单元格矩阵之后         | 两个会话各连续 3 次两端 6/6                                                                                                                                                     |
| 单元格矩阵                 | 一个会话基础格 6/6、状态增量 7/7。另一个会话增量 7/7，基础格全部缺同一个控件：Claude 用量接口不可达，两端的用量标签文字不同                                                     |
| J4、J5、J6                 | 通过；高负载会话里 J5、J6 各超时一次（服务端事件循环停顿 35 秒、Codex `thread/start` 超时），重跑通过                                                                           |
| J1                         | 只在 Stop 一步失败（#35）                                                                                                                                                       |
| Native dock 两个、三个标签 | 关闭按钮位置与 Electron 相差不超过 1px                                                                                                                                          |

### 第二轮 A 阶段：查清与验证（2026-10-10）

第二轮按 [#52](https://github.com/Huxpro/synara-lynxtron/issues/52) 推进，顺序是 A 查清与验证 → B 主题系统 → C 小补齐 → D 差异与债务 → E 合上游 → F 一个大功能 → G 收尾。A 阶段不加功能，只让度量可信。

| PR  | 内容                                                                                             |
| --- | ------------------------------------------------------------------------------------------------ |
| #55 | Lynx-for-Web 宿主端到端跑通；修了 Enter 发送、composer 输入时光标跳动和丢字、relay 诊断计数      |
| #56 | J2 与 J3 的根因和修复（见上一节）                                                                |
| #59 | 上游浏览器测试不稳定（#50）的根因；fork 侧只对这一个失败特征自动重跑一次                         |
| #60 | 颜色回归：与 Electron 逐对比较并归档（`reports/colour-regression-2026-10-10/`）                  |
| #61 | 对话里每种行类型对照 Web 原版修到 2px 内；Lynx for Web 与 Web 原版的浏览器对比和通用的按键事件层 |
| #62 | 同一批行类型在 Native 上对照 Electron 复查                                                       |

查清的事：

- **J2 在 Electron 上失败不是 fork 造成的。** 上游在纯文本回合结束时移除 36.5px 的 "Working for" 行，下方内容上移 37px 而滚动位置不变；测试步骤的采样窗口常常跨过这一刻。未改动的上游同样复现。步骤改为只在回合仍在运行时采样，阈值不变。
- **J3 跑完单元格后超时**是一个单元格没有恢复 dock 状态，加上一个真实的 Native 缺陷：dock 有两个标签页时第二个标签的关闭按钮被 "Maximize panel" 盖住。
- **开启内联 CSS 变量没有让颜色变差。** 对比 harness 存的主题是一个纯字符串，上游按旧数据处理并给了 Codex 主题包；Native 的生成样式表按默认的 Synara 包生成。开关打开后两端的强调色才一致。此前的对比都不是在默认主题包上做的。
- **上游浏览器测试的不稳定**来自上游 10 月 8 日加的一次性 coachmark：测试夹具没有把它标为已读，它在挂载约 8 秒后盖住测试正在悬停的侧边栏行。上游自己的 CI 在那次提交之前 271 次运行 0 次失败，之后 129 次里 26 次。
- **Thread 页以前有不少行类型画错。** markdown 间距按 14px 的 rem 换算、flex 外边距不折叠；plan 行和已回答的问题行显示成状态文字；用户附件完全不画。
- **Lynx for Web 与 Web 原版的接近度**第一次有了数字：每种配置 13 个格里通过 4–5 个（Native 对 Electron 是 13/13），每种配置有 2–3 个格因机器负载没量到。

里程碑检查（#61 的树，2026-10-10）：

| 项                             | 结果                                                         |
| ------------------------------ | ------------------------------------------------------------ |
| 基础格，4 种配置               | 24/24                                                        |
| 状态增量，4 种配置             | 28/28                                                        |
| J2、J3、J4、J5、J6，各连续三次 | 两端全部通过                                                 |
| J1，三次                       | 只在 Stop（#35）一步失败，三次里两端各有失败                 |
| Lynx rstest                    | 1,570 通过，0 失败                                           |
| 试合 `upstream/main`           | 差距 0，无冲突                                               |
| 四个棘轮                       | 0 / 20 / 1 / 3,581，与第一轮收尾相同                         |
| fork 在上游文件里的差异        | 184 个文件 / 5,883 行 / 395 个 fork 文件，未变（A 阶段不动） |

没有做到的：Linux 或云端上没有任何验证（原计划的云端会话实际跑在本机）；Native 对话列表在触摸模拟下向上拖动会跳到顶部，尚未用真实输入确认；hover 和 focus 状态的颜色量不到。

### 尚未完成

| 项                           | 状态                                                                                                                                                                                          |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M3b Thread 页改读 `store`    | 完成。Thread 页和 dock 的 Side 面板读 `store`；其余读取方（侧边栏和 Kanban 的线程操作、完成通知、recap）共用 `readThreadDetailOnce`：`store` 有详情就读 `store`，否则经门面取一次快照、不提交 |
| M4 逐屏收敛                  | 请求路径已全部收敛。读取换成上游 query options 的屏：Settings、Environment/Git、Explorer、Composer 的 skills 和文件搜索；其余见下方清单                                                       |
| 删除 `synaraClient.lynx.ts`  | 完成。请求、终端事件和连接状态都走上游门面与兼容传输；棘轮 `synaraClientImporters` 为 0                                                                                                       |
| 缩小 fork 在上游文件里的差异 | 进行中：260 → 184 个文件。剩余按类别处理：其余 16 个平台端口文件、放在上游目录里的 395 个 fork 文件、`data-*` 钩子、被改写的共享逻辑                                                          |
| 移植上游的新界面             | 矩阵覆盖的界面已移植；占位和其余功能见合并报告的移植队列和 #52                                                                                                                                |

`synaraClient.lynx.ts` 删除之后还留在 Lynx 一侧的（都经门面发请求，只是还没用上游的 query options 和 key，属于 M4 后续各屏）：

- **模型目录（5 处）：已完成。** `Composer`、`KanbanNewTaskDialog`、`AutomationCreateDialog`、`AutomationEditDialog`、`AutomationDetailPage` 都用上游的 `providerModelsQueryOptions`（上游的 key 和发现队列），棘轮 `useQueryCallSites` 29 → 24。在 Native（PrimJS）上验证过的：目录能加载，模型菜单的行和 J1/J5/J6 都通过。PrimJS 的 `AbortSignal` 有 `addEventListener`/`removeEventListener`，但没有 `throwIfAborted`（上游的 `abortReason` 捕获后把那个 `TypeError` 当作取消原因），也不遵守 `{ once: true }`、重复 `abort()` 会再次派发（上游队列的 `taskSettled` 保证只结算一次）。取消和 90 秒超时两条路径没有在 Native 上实际触发过。
- **Automations：已完成。** 上游的 `useAutomations`（列表查询、变更、乐观更新与回滚）和 `applyAutomationEvent` 由 `scripts/generate-automations-state.mjs` 从 `routes/-automations.shared.tsx` 生成（带 `--check`）；页面和图标栏面板共用它，列表靠服务端的 automation 事件流保持最新，原来每 5 秒一次的宿主轮询删除。没有选"保留 Lynx 的 key"：key 本来就相同，差的是上游的乐观更新、回滚和事件合并逻辑，手写一份就是平行实现。
- **PR 详情：已完成。** Code review 页面（`GitHubInboxPage.lynx.tsx`）的列表、刷新、置顶，PR 的 detail / diff / action / 评论，以及 issue 的 detail / 评论，都用上游的 query 和 mutation options（`githubInboxListQueryOptions`、`pullRequestDetailQueryOptions`、`pullRequestActionMutationOptions` 等），图标栏的评审角标读同一份 open 列表。Lynx 的 `fetchPullRequests` 已删除，棘轮 `useQueryCallSites` 24 → 20。
- **插件库：已完成。** 用上游的 `providerComposerCapabilitiesQueryOptions`、`providerPluginsQueryOptions`、`providerSkillsQueryOptions`，发现目录取上游 `serverConfigQueryOptions` 的 cwd。上游的 options 在首次响应前给占位数据，页面把占位期仍算作加载中。
- **Sidebar：已完成。** dev server 读上游的 `useProjectRunStore`（`EventRouter` 用事件流和一次 `listDevServers` 维护），local servers 用上游的 `sidebarLocalServersQueryOptions`。它只在有 Synara 启动的 dev server 时按上游的间隔轮询，另外在窗口聚焦和重连时刷新，与 Electron 相同；Lynx 以前只在挂载和手动操作后读取。
- **线程详情的其余读取方：已完成。** `EmbeddedSidechatPane` 用 `useThreadPageData` 读 `store`；Lynx 的 dock 状态镜像进上游的 `useRightDockStore`，上游的 `EventRouter` 据此给当前 Side 线程租约（上游的 retention 不含 Side 线程，所以面板不 retain）。侧边栏和 Kanban 的线程操作、`TaskCompletionToastHost`、`prepareThreadRecap` 共用 `threadDetailRead.lynx.ts` 的 `readThreadDetailOnce`。`fetchThreadTranscriptRows`、`fetchThreadHeaderSummary`、第二份头部摘要构造、`threadDetailProjection.logic.ts`、`threadSummaryProjection.logic.ts` 和 `thread-detail` query key 已删除。
- **搜索面板的导入 provider、头部的 handoff 目标：已完成。** 改用上游的 capabilities、config、settings 查询，不再有组合的 Lynx key。
- **仍用 Lynx key 的读取（13 处计数）**：落地页的组合 bootstrap（`router.tsx`、`LandingComposer`，2 处）、外部 MCP 集成列表（上游的 key 写在组件文件里）、搜索面板的 `searchThreads`（上游的 key，上游内联定义，没有可 import 的 options）、生成的 `useAutomations`（上游的定义，审计按文件位置计入）；其余是宿主数据或本地状态，不是服务器读取：diff 语法高亮、编辑器图标、浏览器视图能力、Explorer 的本地预览地址和 PDF 元数据、recap 的本地缓存、终端完成事件。
- **没有门面方法的 RPC：已清零。** `orchestration.getSidebarSearchSnapshot` 已从契约和服务端删除，搜索面板改用上游的 `searchThreads`（门面方法、上游的 key、去抖、最小长度和 `matchSidebarSearchThreads` 的合并规则）；`@synara/shared/sidebarSearch`、`SidebarSearchProjection.logic` 一并删除，`SidebarSearchPalette.logic.ts`、`ProjectionSnapshotQuery`（服务、实现、测试）和 `ws.test.ts` 还原为上游原文。`orchestration.getSidebarShellSnapshot` 此前已删除。
- **宿主里的旧流路径**：`NATIVE_EVENT_STREAM_CHANNELS` 的终端和 shell 通道、不带 `streamId` 的 `synaraRpcStream` 已经没有渲染器调用方，可以删。

未关闭的相关问题：#16（Stop 过早被丢）、#19 和 #20（Computer Use 验收发现的输入与界面问题）、#35（Stop 延迟）、#50（上游浏览器测试不稳定）、#52（第二轮清单）。#10（Lynx Rstest 套件）已关闭。
