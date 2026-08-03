# P10 Perceptual fidelity convergence goal prompt

Status: ready

Updated: 2026-08-04

This is the self-contained goal prompt for moving the Synara Lynx/Lynxtron port
from broad structural parity to high perceptual fidelity. The checkout on disk
is authoritative.

## Goal prompt

```text
继续完成 Synara Web → Lynx-for-Web → Lynxtron Native 的 P10 Perceptual
Fidelity convergence。

工作目录：
`/Users/bytedance/github/synara`

当前分支：
`huxcx/lynxtron-port-current-state`

当前起点：
`a122272000da855f7992f5b847b2daa5040bfa8d`
`fix(web): close production typecheck gate`

用户对当前产品的判断是：大框架已经接近，整体约为 80% fidelity；剩余约 20% 决定产品
是完美复刻甚至超越，还是停留在 uncanny valley。

本 goal 的目标不是继续增加页面或大功能，而是建立并执行一套可重复的感知保真收敛体系，
让普通 UI 的视觉、节奏和交互质感达到稳定的 95%+ 主观相似度，同时把无法等价的平台差异
明确登记。

不要只输出 critique、计划、截图或“下一步建议”。必须完成工具、校准、三端证据、最终
审计、独立 commits 和 push。除非遇到真正不可获得的外部依赖，否则持续执行到整个
P10 goal 完成。

## 已完成且必须保护的基线

以下内容已经完成，不要重做、弱化或用新的视觉工作破坏：

- 六个核心产品表面的共享 anatomy 与平台 adapter 架构；
- P9-D1 Native input/IME 边界；
- P9-U4 Command K 状态矩阵；
- P9-U5 Composer Project Picker、Extras、command menus 和 selected-token convergence；
- Composer 23-state strict manifest，zero incomplete required cells；
- exact-owned Native evidence、PID-derived DevTool、clean console、state restoration；
- Web/Lynx-for-Web/Desktop production builds；
- workspace `bun fmt`、`bun lint`、`bun typecheck` green；
- comparison 页面作为常态迭代和验收工具；
- 不进入 terminal、browser webview、PDF canvas、voice 等 hard islands 的既有边界。

必须先读取：

1. 根目录 `AGENTS.md`；
2. `apps/lynx/plan/05-side-by-side.md`；
3. `apps/lynx/plan/06-high-fidelity-port.md`；
4. `apps/lynx/plan/reports/p6-c6-convergence.md`；
5. `apps/lynx/plan/reports/p9-u5-composer-fidelity-plan.md`；
6. `apps/lynx/plan/reports/p9-u5-completion-audit.md`；
7. `apps/lynx/plan/reports/p8-q2-certification-preflight.md`；
8. `apps/lynx/plan/LOG.md`；
9. 当前 comparison gallery、reuse/style audit 和 evidence scripts；
10. 当前 `git status`、`git diff`、最近 commits 和正在运行的 owned/user processes。

## 核心判断

当前剩余差距主要不是信息架构或大布局，而是多个小偏差叠加后的感知误差：

- 字体 fallback、weight、line box、baseline 和文字密度；
- 中性色温、surface 层级、border opacity、radius 和 shadow；
- icon painted bounds、stroke weight、optical scale 和 baseline；
- control 内部 padding、内容重心、row rhythm 和 popup material；
- hover、pressed、focus、selected、loading、open/close 等瞬时状态；
- Native/Lynx rendering engine 与 Web CSS box model 的系统性差异；
- 某些页面虽然单个 anchor 在旧的 ≤8px gate 内，但整体视觉重心仍明显偏移。

最后 20% 不能继续靠逐页肉眼添加局部 margin。必须把残差归因到可复用 token、primitive、
optical correction 或明确的平台差异。

## 不可协商原则

1. Web original 是 composition、visual rhythm 和 interaction intent 的 authority；正确产品
   行为高于 Web 偶发 bug。
2. Lynx-for-Web 是快速迭代面，Native 是最终平台语义与真实 rendering authority。
3. Browser pass 不能冒充 Native pass；Lynx-for-Web custom-element 结果不能认证 Native
   font/input/list/window behavior。
4. 同一 retained cell 必须使用同一 snapshot、semantic route、theme、viewport、DPR、
   density、selected project/thread、content 和 interaction state。
5. 先测量、归类、定位 owner，再 patch；禁止先凭感觉改 CSS 后找理由。
6. 视觉结果相同优先于 CSS 数字相同。允许小范围、命名清晰的 platform optical
   corrections，但禁止散落 anonymous margin hacks。
7. 普通 anatomy 继续 physical-shared；平台 adapter 只拥有 host elements、native
   input/list/window、asset rasterization 和已登记 optical correction。
8. Native UI 不得使用 HTML elements；使用 ReactLynx built-ins、native events 和已有
   platform primitives。
9. 不以 pixel score、SSIM、manifest green、测试 green 或截图数量单独代理 goal 完成。
10. 不允许大面积 mask 隐藏差异。抗锯齿、原生标题栏或真实平台控件 mask 必须小范围、
    命名并在 notes 中解释。
11. 不为了提高 fidelity 分数硬编码截图数据、直接写 SQLite fixture、伪造 loading/error
    状态或绕过 canonical product path。
12. 不在达到稳定 parity 前主动重新设计产品。先消除无意差异，再加入有意改进。
13. 不进入 Native Command K shortcut repair、general keyboard repair、terminal、browser、
    PDF、voice 或其他 hard islands。
14. 只使用 `bun run test`，永远不要使用 `bun test`。
15. 每个 coherent slice 必须：
    measure → classify → implement → focused tests → proportional builds →
    paired/triple evidence → residual audit → plan/LOG update → independent commit → immediate push。
16. commit message 末尾必须且只能出现一次：
    `Co-authored-by: TRAE CLI <noreply@bytedance.com>`
17. 不得停在“整体已经 90%”或“主要页面看起来接近”。本 prompt 的完成单位是全部 P10
    success criteria，而不是若干漂亮截图。

## Scope

### In scope

- App shell、Sidebar、New Chat landing、Composer。
- Project Picker、Extras、Command K、skill/mention menus 等高频 overlays。
- Thread header、transcript typography/status/work rows、collapsed-work chrome。
- Settings navigation、panel header 和常用 controls。
- Kanban/Pull Request 的 route header、rows/cards、filters 和 common states。
- light/dark、1280×820、1440×900、comfortable/compact（若产品支持）。
- Typography、surface material、icons、control optical alignment、motion。
- comparison tooling、style/geometry sampling、residual manifest 和 completion audit。

### Out of scope

- Terminal renderer、browser webview、PDF canvas、voice recording 内核。
- Native Command K keyboard shortcut delivery。
- 通用 Native Tab/Arrow/Enter/Escape host-input repair。
- 新产品功能、信息架构重写或视觉品牌重设计。
- 为“超越 Web”而增加 Web 不存在的 decorative chrome。
- 与本 goal 无关的全仓 cleanup。

## Concrete deliverables

1. **Perceptual Residual Atlas**
   - Web、Lynx-for-Web、Native 三端状态清单；
   - 每个状态的 screenshot、geometry、resolved style、console、build/snapshot identity；
   - residual category、severity、owner、expected fix 和 disposition；
   - comparison gallery 支持直接审阅残差，而不是只陈列截图。
2. **Typography calibration system**
   - canonical text roles；
   - Web/Lynx/Native resolved metrics；
   - named platform baseline corrections；
   - 无散落的文字 margin hacks。
3. **Surface material contract**
   - canvas/sidebar/content/elevated/popover/selected/hover/pressed/focus/separator；
   - light/dark resolved colors、border、radius 和 shadow；
   - 大面积中性色差异全部关闭或登记。
4. **Optical control calibration**
   - 12–15 个高频 primitives 的 golden specimens；
   - icon painted bounds、optical scale/offset、control content alignment；
   - default/hover/pressed/selected/disabled/focused/loading states。
5. **Temporal fidelity contract**
   - disclosure、popover、hover、pressed、selection、loading transition；
   - 固定时间点或短序列证据；
   - reduced-motion fallback。
6. **Final three-client matrix**
   - route × theme × size × required state；
   - like-for-like Web/Lynx-for-Web/Native evidence；
   - zero unregistered major perceptual residuals。
7. **Completion audit**
   - prompt-to-artifact checklist；
   - 每个 requirement 映射到代码、token、test、build、evidence 或 intentional delta；
   - 不依赖单一分数或 verifier 代理完成。

## Residual taxonomy

每个发现必须属于以下一种，并写入 manifest/notes：

- `TYPOGRAPHY`
  - family/fallback、size、weight、line-height、letter-spacing、baseline、wrapping。
- `GEOMETRY`
  - x/y/width/height、padding、gap、alignment、visual center。
- `MATERIAL`
  - background、foreground、border、radius、shadow、elevation、opacity。
- `ICON`
  - glyph identity、viewBox、painted bounds、stroke、scale、baseline。
- `MOTION`
  - duration、easing、delay、trajectory、intermediate state、reduced motion。
- `INTERACTION`
  - hover、pressed、focus、selected、disabled、loading、open/close feedback。
- `CONTENT`
  - copy、ordering、count、truncation、wrapping、loading/error/empty semantics。
- `ENGINE_CORRECTION`
  - Web/Lynx/Native rendering engine 造成的可命名 correction。
- `INTENTIONAL_PLATFORM_DELTA`
  - 真实 host capability 或平台 convention 差异。
- `ANTIALIASING_NOISE`
  - 仅允许局部、低影响、可证明不改变 geometry/material 的 raster 差异。

Severity：

- `P0`: 主结构/大面积 surface/核心文字明显错误，第一眼破坏产品身份。
- `P1`: 高频 control、popup、typography 或 state 明显 uncanny。
- `P2`: 次要 optical/motion 差异，可见但不主导整体感受。
- `P3`: 小范围 antialiasing 或低频平台差异。

任何 P0/P1 不得以“总体分数不错”关闭。

## Measurement contract

每个 retained cell 至少记录：

- build hash；
- snapshot hash；
- route 和 semantic route；
- theme、viewport、DPR、density；
- selected workspace/project/thread；
- exact interaction state；
- PNG dimensions；
- anchor boxes；
- relevant text metrics；
- resolved colors/borders/radius/shadows；
- icon painted bounds（适用时）；
- fresh console result；
- residuals 与 disposition。

### Geometry

- 继续记录 shell/sidebar/header/content/popup/control anchors。
- 旧的 ≤8px 仅作为粗门禁，不再代表 perceptual pass。
- 高频核心 anchor 目标：
  - position/size ≤2px；
  - repeated row rhythm 累积漂移 ≤2px；
  - icon/text baseline ≤1px；
  - popup trigger alignment ≤2px。
- 若 Native engine 只能通过 named optical correction 达到，应在 adapter token 中实现并
  记录，不在 feature 页面散落局部 patch。

### Typography

记录并比较：

- resolved font family/fallback；
- font size；
- weight；
- line-height；
- letter-spacing；
- text box；
- baseline/cap-height proxy；
- wrapping/truncation outcome。

不能只比较 `font-size`。相同 CSS 数值但视觉高度/浓度不同仍是 residual。

### Color/material

- 记录 resolved RGBA，而不是只比较 token 名。
- 大面积 surface 使用 perceptual color difference 辅助排序。
- selected/hover/pressed/focus 必须分别取样，不能用 default state 推断。
- shadow 至少记录 layer 数、offset、blur、spread、opacity。

### Pixel/edge diff

- comparison 可提供 alpha overlay、split view、pixel diff、edge diff。
- 自动分数只用于排序和发现，不作为 pass/fail 唯一依据。
- masks 必须小范围、命名、带 reason，并出现在 completion audit。

## Phase 0 — Establish the honest perceptual baseline

1. 停止先改 CSS。
2. 选择第一批 canonical surfaces：
   - New Chat landing；
   - Sidebar；
   - Composer default；
   - Project Picker open；
   - skill menu filtered；
   - Settings General。
3. 使用同一 isolated server/snapshot，采集：
   - Web original；
   - Lynx-for-Web；
   - exact-owned Native。
4. 建立 residual manifest 和 schema。
5. comparison gallery 增加：
   - 三端同步 cell；
   - opacity overlay；
   - draggable split；
   - geometry/style panel；
   - residual badges；
   - intentional-delta/mask explanation。
6. 对 baseline residual 逐项分类、severity、owner。
7. 产出 `p10-perceptual-baseline.md`，明确当前最主要的五个感知差距。

Gate：

- 不修改产品视觉前，先得到可重复、同状态、同数据的 honest baseline。
- 每个 P0/P1 residual 有 concrete owner 和 fix direction。
- comparison 中不存在错配 state、旧 build、Browser 冒充 Native 或大面积 mask。

## Phase 1 — Typography calibration

建立 canonical roles：

1. sidebar primary row；
2. sidebar section/group label；
3. route/page title；
4. body/transcript text；
5. status/meta text；
6. composer body/placeholder；
7. popup row title；
8. popup description/meta；
9. button/control label；
10. chip/token text。

Tasks：

- 测量 Web/Lynx-for-Web/Native 的真实 metrics；
- 识别 fallback 或 weight mapping 差异；
- 建立 shared typography roles 和 platform metric corrections；
- 校准 wrapping、ellipsis、line box 和 baseline；
- 删除被新 system 取代的局部 typography overrides；
- 覆盖 light/dark 与两尺寸。

Acceptance：

- 同角色视觉层级一致；
- 关键 text box 高度/基线/换行达到 measurement contract；
- 无因字体差异导致的 row/popup 累积漂移；
- platform corrections 命名、集中、测试并有 evidence；
- 不通过改变文案或隐藏文本制造对齐。

## Phase 2 — Surface material calibration

建立 shared surface roles：

- canvas；
- sidebar；
- content；
- inset；
- elevated；
- popover；
- selected；
- hover；
- pressed；
- focus-ring；
- separator；
- destructive/warning/success。

Tasks：

- 从 Web production resolved styles 生成或维护明确 contract；
- 校准 light/dark 中性色温；
- 对齐 border opacity、radius、shadow、surface separation；
- 校准 overlay、menu、tooltip、composer、cards；
- 检查 nested badges/chips/pills，不只看外层 card；
- 删除重复或相互覆盖的 local color/radius/shadow recipes。

Acceptance：

- 无未登记大面积色块差异；
- popup/elevated surfaces 的 material hierarchy 一致；
- selected/hover/pressed/focus 不互相冒充；
- light/dark 都通过，不以一个主题代表另一个主题；
- 所有 intentional platform deltas 明确登记。

## Phase 3 — Optical control calibration

建立 golden specimen page/harness，但不得让 diagnostic route 进入 production graph。

至少覆盖：

1. sidebar row；
2. segmented control；
3. icon button；
4. disclosure row/chevron；
5. composer shell；
6. textarea；
7. project-picker row；
8. command-menu row；
9. switch；
10. checkbox/radio；
11. tooltip/popover；
12. chip/token；
13. status row；
14. empty-state header；
15. primary/secondary button。

每个 specimen 覆盖：

- default；
- hover；
- pressed；
- selected；
- disabled；
- focused；
- loading（适用时）。

Tasks：

- 计算 icon painted bounds，而不只比较 SVG box；
- 建立 named `iconOpticalScale`、`iconBaselineOffset`、
  `controlContentOffset` 等 correction contract；
- 对齐 stroke weight、visual center、label/icon gap；
- 校准 repeated row rhythm 和 control hit target；
- correction 放在 primitive/adapter，不放在 feature call site。

Acceptance：

- 高频 icons identity 正确，无文本 glyph placeholder；
- icon/text baseline ≤1px；
- repeated rows 无可见 cumulative drift；
- controls 在所有状态下保持同一 visual center；
- 无 anonymous one-off margin hacks。

## Phase 4 — Motion and temporal fidelity

先建立 capture 方法，再改 motion。

覆盖：

- disclosure open/close；
- popover/menu open/close；
- submenu；
- hover/pressed；
- selected-state transition；
- composer height/content transition；
- loading → content；
- sidebar expansion；
- collapsed work；
- focus-ring appearance；
- reduced-motion。

证据使用固定采样点或短序列，例如：

- `t=0ms`
- `t=80ms`
- `t=160ms`
- `t=220ms`

Tasks：

- 复用 shared `disclosureMotion.ts` contract；
- 对齐 duration、easing、opacity/translate trajectory；
- 不用 bounce/elastic；
- 避免 width/height/padding/margin 直接动画造成 layout instability；
- Native 可使用不同实现，但节奏、反馈和结束状态应一致；
- 验证 transcript live output 不被普通 working/loading state误触发。

Acceptance：

- open/close 不再有一端瞬间、一端渐变的 uncanny mismatch；
- pressed feedback 立即且不过重；
- motion 不造成 layout jump、scroll feedback loop 或 stale focus；
- reduced-motion 有明确 fallback；
- temporal evidence 与静态最终帧同时 retained。

## Phase 5 — Route-wide convergence

在前四阶段建立系统后，按 residual severity 扩展到全部核心 surfaces，而不是逐页重新发明
规则。

推荐顺序：

1. Landing + Sidebar + Composer；
2. Project Picker + Extras + Command K + skill/mention menus；
3. Thread header + transcript/status/collapsed work；
4. Settings；
5. Kanban；
6. Pull Requests。

每个 route：

- 先应用 shared calibrated roles；
- 再关闭 route-specific P0/P1；
- P2 按频率和影响排序；
- P3 antialiasing/platform noise 只登记，不进行破坏性追逐；
- 重新检查 shared change 没有让已完成 route 回退。

Gate：

- 每个 route 在 light/dark、两尺寸都有 like-for-like evidence；
- zero P0/P1 residuals；
- zero unregistered major visual/behavior differences；
- shared primitive 修改有 cross-route regression evidence。

## Phase 6 — Native certification and intentional improvement

只在 Lynx-for-Web 快速矩阵收敛后批量执行 exact-owned Native。

Preflight：

- 完整 production build；
- staged bundle path/hash；
- isolated server/snapshot/PIDs/ports；
- Web/Lynx/Native 同数据；
- Native executable/bundle identity；
- PID-derived DevTool client/session；
- outer/content dimensions；
- persisted state backup/hash；
- clean baseline console。

Native 必须认证：

- typography/fallback；
- window/titlebar/content relationship；
- native list/scroll；
- input/focus（若状态涉及）；
- popup/host menu/dialog；
- system appearance/light-dark；
- cold restart/persistence（若状态涉及）；
- temporal states；
- clean exact-client console。

达到稳定 parity 后，才允许 intentional improvement。每个 improvement 必须：

1. 明确 Web baseline；
2. 说明为何 Native/Lynx 改进更符合平台或产品目标；
3. 不伪称 exact copy；
4. 写入 intentional delta；
5. 有独立 before/after evidence；
6. 不破坏 shared product semantics。

推荐可超越方向：

- 更自然的 Native window/menu/file-picker integration；
- 更稳定的长 transcript rendering；
- 更清晰的 reconnect/loading/error state；
- 更克制一致的 motion；
- 更诚实的 unavailable capability 表达。

## Phase 7 — Final matrix and completion audit

最终矩阵至少覆盖：

- clients：Web、Lynx-for-Web、Native；
- themes：light、dark；
- sizes：1280×820、1440×900；
- routes：Landing、Thread、Settings、Kanban、Pull Requests；
- overlays：Project Picker、Extras、Command K、skill/mention menu；
- states：default、hover、pressed、focused、selected、disabled、loading/error/empty
  中各 surface 适用项。

按 restart cost 执行 Native matrix：

1. build once；
2. prepare one shared snapshot；
3. Native 1280×820 完成全部 route/theme/state；
4. Native 1440×900 完成全部 route/theme/state；
5. Web named sessions 复用，只切 viewport；
6. cleanup owned processes/ports/state。

最终 prompt-to-artifact audit 必须：

1. 把本 prompt 每个 numbered item、named file、command、test、gate 和 deliverable 映射到
   concrete artifact；
2. 检查 manifest/verifier 实际覆盖 requirements，而不是只看 green status；
3. 检查每个 retained cell 的 process/data/viewport/theme/route/state/dimensions；
4. 检查每个 P0/P1 residual 已关闭；
5. 检查 P2 disposition；
6. 检查 P3 masks/intentional deltas 小范围且有理由；
7. 检查 typography/material/optical/motion systems 有真实 product consumers；
8. 检查无第二 ordinary anatomy owner；
9. 检查无 hardcoded fixture 或 screenshot-only product path；
10. 检查 Web baseline 未回退；
11. 检查 Native exact-client console；
12. 检查 user/isolated state byte-exact restoration 与 owned cleanup；
13. 把任何 uncertainty 视为 not complete，并继续验证。

## Verification gates

迭代时优先 focused checks，不要每次运行全仓 heavy pass。

每个 coherent slice：

- relevant Web unit/browser tests；
- relevant Lynx tests；
- comparison verifier；
- Web/Lynx-for-Web production build（按影响）；
- exact-owned Native batch（仅平台边界或阶段 batch）；
- reuse/style audits；
- `git diff --check`。

本 goal 明确授权在最终验收阶段运行一次完整 heavy pass：

- `bun fmt`
- `bun lint`
- `bun typecheck`

遵守根 `AGENTS.md`：

- 三项合并为一次 final pass；
- 不在迭代中反复跑；
- `bun fmt` 后审查并恢复 task 外大规模 format churn；
- 只使用 `bun run test`，永远不要使用 `bun test`。

最终必须通过：

- strict residual/comparison verifier；
- all focused regression suites；
- Web production build；
- Lynx-for-Web production build；
- Desktop production build；
- reuse audit strict check；
- style audit strict check；
- `bun fmt`；
- `bun lint` zero errors；
- `bun typecheck` full workspace；
- changed-lines React Doctor zero new warnings/errors（若 commit hook启用）。

## Suggested artifacts

- `apps/lynx/plan/reports/p10-perceptual-baseline.md`
- `apps/lynx/plan/reports/p10-typography-calibration.md`
- `apps/lynx/plan/reports/p10-surface-material-contract.md`
- `apps/lynx/plan/reports/p10-optical-controls.md`
- `apps/lynx/plan/reports/p10-motion-contract.md`
- `apps/lynx/plan/reports/p10-completion-audit.md`
- `apps/lynx/plan/LOG.md`
- `shots/<date>/p10-perceptual-fidelity/manifest.json`
- `shots/<date>/p10-perceptual-fidelity/manifest.js`
- `shots/<date>/p10-perceptual-fidelity/comparison.html`
- per-state screenshot/geometry/style/console/residual artifacts。

不要创建 production-reachable diagnostic route。Golden specimens 和 comparison 必须是
test/evidence tooling 或明确排除在 product graph 外的 harness。

## Commit strategy

建议 commits：

1. `test(fidelity): establish perceptual residual atlas`
2. `style(fidelity): calibrate cross-platform typography`
3. `style(fidelity): align surface materials`
4. `style(fidelity): calibrate control optics`
5. `style(fidelity): align interaction motion`
6. route-specific residual closure commits（每个 coherent slice 一个）
7. `test(fidelity): certify perceptual parity matrix`

每个 commit：

- focused；
- 有对应 evidence；
- 更新 plan/LOG；
- message 末尾 trailer 恰好一次；
- commit 后立即 push；
- 不把多个未验证阶段压进一个巨大 commit。

## Completion criteria

只有以下条件同时满足，才能将 P10 标记 complete：

- Residual Atlas 是 comparison 的 SSOT；
- final matrix 全部 required cells 有有效三端 evidence；
- zero incomplete required cells；
- zero P0/P1 residuals；
- zero unregistered major visual/behavior differences；
- typography roles 在三端有 measured consumers；
- surface material roles 在 light/dark 均收敛；
- golden controls 的所有 required states 收敛；
- motion contract 有静态与时间序列 proof；
- masks 小范围、有理由、可审计；
- intentional platform deltas 完整；
- Web baseline 无回退；
- Native exact-owned identity/console/state/cleanup通过；
- production builds、focused tests、reuse/style audits、final heavy pass全部通过；
- prompt-to-artifact completion audit 无 missing/weak/uncertain requirement；
- 所有 coherent commits 已 push；
- local HEAD 与 origin 对齐；
- worktree clean；
- no required work remains。

主观“看起来已经差不多”、95%分数、SSIM、manifest green 或大量实现工作都不能单独满足
完成条件。

## 工作方式

- 用 plan 跟踪 Phase 0–7，任何时刻只保留一个 in-progress phase。
- 每次大改、build、Native batch 前给用户一句简短进度说明。
- 先读实际 code、resolved style、DOM/DevTool/event shape，不猜测。
- 优先修 shared token/primitive/root cause，不做表面 patch。
- 若一个 correction 只服务一个 platform，仍应集中在命名的 platform correction layer。
- comparison 是日常开发工具，不是最后补截图。
- 除非用户在新的对话中明确授权，不使用 sub-agents/delegation。
- 不因工作量大、耗时长或分数接近目标而提前停止。
- 只有 completion audit 证明 objective 全部实现且无 required work 后，才标记 goal complete。
```

