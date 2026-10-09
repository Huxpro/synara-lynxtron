# Web / Lynx 共享架构：把共享边界下推到状态与会话层

状态：提案 v1（2026-10-09），待确认。本文只定边界和顺序，不含重构。

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

## 顺序

0. **先合并，不重构。** 在同步分支上继续：合入默认分支（41 个提交，41 个冲突文件），再合 `upstream/main`（60 个冲突）。过矩阵和 J3–J6 后成为新的默认分支。
1. **传输端口。** Lynx 已有 W3C 形状的 socket 端口（`platform/net.socket.ts`）。让上游的 `WsTransport` / `createWsNativeApi()` 在 Lynx 上运行，`ensureNativeApi()` 两端同源。`synaraClient.lynx.ts` 退化为过渡期薄封装，再逐步删除。**这一步需要先做一个小验证**：Effect RPC 客户端在 PrimJS 后台线程能否正常工作，未验证。
2. **会话同步引擎。** `EventRouter` 纯移动成独立模块，Lynx 挂载同一份。之后 `store` 成为两端唯一读模型。
3. **读路径逐屏迁移。** Sidebar → Thread → Kanban/PR/Automations → Settings。每屏把 `queries.ts` 的快照投影换成 `store` selector 和上游的 query options；每屏过一次矩阵。
4. **编排层收敛。** 最后处理 `router.tsx` 里的页面编排，让上游容器在 Lynx 上可达。这一层体量最大、上游改动最频繁（`ChatView.tsx` 在 567 个提交里被改了 80 次），放最后，按屏做。

每一步的验收：fmt / lint / typecheck、矩阵 24+28、J3–J6、该屏复用率不降。

## 需要你拍板的取舍

1. **`EventRouter` 怎么共享。**（a）纯移动并提给上游 —— 推荐；上游接受前，fork 每次同步要在这个文件上解一次冲突（它在 567 个提交里被改了 15 次）。（b）不动上游文件，Lynx 继续自己实现同步 —— 零冲突，但漂移照旧。
2. **Lynx 的 RPC 走哪条路。**（a）后台线程直连 WebSocket，复用上游 `WsTransport` —— 推荐，代码最少；（b）保留宿主进程中继，在其上实现一个与 `WsTransport` 同形的端口 —— 多一层要维护，但不依赖 Effect RPC 在 PrimJS 上可用。取决于第 1 步的验证结果。
3. **分支策略。** 同步分支通过验收后，是否直接替换默认分支（合并提交，保留上游祖先关系，不 squash）—— 推荐是。
4. **对 apps/web 的改动上限。** 建议只允许三类：平台端口化（`window.x` → `~/platform/x`）、纯移动、测试钩子（`data-*`）。其它都算越界。是否同意把这三类整理成 PR 提给上游。

在你回复之前，我会按推荐项推进第 0 步（只合并、不重构），它不依赖以上任何一项。
