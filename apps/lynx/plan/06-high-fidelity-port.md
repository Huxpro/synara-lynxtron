# 06 — 高保真 UI 移植计划

## 1. 目标

把 P2–P4 的“运行时可行、功能切片可用”推进为真正的 UI port：

- 普通页面复用 Synara Web 的组件树、props、状态和 class/tokens。
- 平台差异集中在 L1 ports、L2 UI primitives 和少数硬岛。
- 同一功能不长期维护两份手写页面结构。
- 用源码复用率和 side-by-side 视觉指标共同验收。

Web 当前实现是视觉与交互真源；本阶段不重新设计产品。Lynx 平台无法等价的地方允许近似，
但必须在 compat matrix 和每屏 notes 中显式登记。

## 2. 复用分类

| 分类 | 定义 | 例子 |
|---|---|---|
| SHARED | 同一源文件由 Web/Lynx 直接构建 | logic、store、feature composition、普通 JSX |
| PATCHED | 同一真源经确定性生成/编译补丁 | tokens、Tailwind utility、icon manifest |
| SPLIT | 同一无后缀 import/props，下层平台双实现 | Button、Dialog、scroll surface、markdown renderer |
| EXCLUSIVE | 无合理等价物且被隔离的硬岛 | xterm、PDF canvas、browser webview、Lexical editing core |

禁止把 Web JSX 复制到新 `.lynx.tsx` 后称作 SHARED。SPLIT 必须保持调用点和 props 契约，
并说明为何 adapter/样式补丁不足。

## 3. Eligible source reuse

每个 screen 从 Web route entry 计算静态模块图：

1. 排除测试、story、generated、类型声明、主进程和已批准 EXCLUSIVE 硬岛。
2. 对剩余 TS/TSX 统计模块数与非空逻辑行。
3. Lynx 构建实际引用同一物理源文件记为 shared；确定性生成记 patched；仅同名复制不计。
4. 同时报 module reuse 与 LOC reuse，退出标准取较低值。

> **D13 修订（2026-07-28）**：≥70% 已由**放行门禁**降为**报告用目标值**。
> reuse-audit 仍每刀出数并写入 LOG/roadmap，但任务不因未达标而阻塞标 completed。
> 任务放行改以本文件的**视觉契约**为准（两尺寸、锚点 ≤8px、字号 ≤2px、semantic
> tokens、同源真实数据、无未登记平台差异）。以下阈值段落按此解释。

Phase 5 reference screen 与 Phase 6 每个核心屏目标均为 **≥70%**。低于阈值只能用逐模块
证据申请豁免，不能通过移动文件、生成复制或扩大排除集提高数字。

## 4. Fidelity contract

固定使用同一 Synara server、同一 snapshot、同一 route/state，至少验证 1280×820 与
1440×900；最终矩阵覆盖 light/dark。

每屏检查：

- 布局锚点：shell/sidebar/header/content/card 的 x/y/width/height 偏差 ≤8px。
- Typography：对应文本字号偏差 ≤2px，weight/line-height/token 一致或登记差异。
- Color：背景、foreground、border、selected、elevated、focus 使用同名 semantic token；
  不允许未登记的大面积色块差异。
- Content：排序、标签、计数、empty/loading/error 文案与同一数据一致。
- Interaction：当前阶段范围内的 hover/active/focus/keyboard/scroll 状态逐项截图或记录。

可辅以 pixel/SSIM 报告，但机器分数不能替代检查单。抗锯齿、原生控件绘制等差异可 mask，
mask 必须小范围、在 notes 中解释，禁止用大面积 mask 隐藏布局偏差。

## 5. 实施原则

1. **Compiler first**：先把 Web entry 加入 Lynx build，看真实错误，再建立最小 adapter。
2. **Call-site zero change**：UI primitive 优先保持 import、props、状态 discriminant 不变。
3. **One visual source**：tokens/class strings/variant recipes 同源；Lynx override 集中管理。
4. **Hard islands stay small**：platform renderer 只包住不兼容内核，不复制外围 chrome。
5. **Web baseline protected**：共享重构必须证明 Web 行为/视觉基线不变。
6. **No fake parity**：缺失交互显示为明确 unavailable/降级，不能用静态假数据伪装。

## 6. Phases

- Phase 5：建立依赖图、真实复用率、编译探针、UI adapters、样式与视觉门禁。
- Phase 6：按 shell → thread → composer/settings → feature lists 迁移六个核心屏。
- Phase 7：补桌面 pointer/keyboard/overlay/scroll/theme/system states。
- Phase 8：删除切片重复层，跑最终视觉矩阵，再验证 packaged app。

稳定 ID、依赖和退出标准以 `01-roadmap.md` 为准。

## 7. 与硬岛的关系

P3-E5 terminal 继续依赖 D2；P3-E6 PDF/browser 继续依赖 D3。它们不会阻塞 Phase 5–8 的
普通 UI 高保真工作。Composer 外围 chrome 属于 Phase 6；contentEditable 内核属于硬岛。
最终报告必须分别陈述普通 UI 完成度与硬岛状态，不用后者掩盖前者，也不用前者宣称全功能
等价。
