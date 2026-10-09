# P0-S4 — `<list>` 滚动跟随语义验证（结论）

日期：2026-07-27 ｜ 状态：✅ 通过 ｜ 测试床：spikes/p0-s1/app（Lynxtron 0.0.7，SDK 4.1）
原始数据：`results.jsonl`；截图：`shots/2026-07-27/p0-s4/lynx.png`；代码：`spikes/p0-s1/app/src/app/Transcript.tsx`

## 模型

最小 transcript：30 条初始消息 + 120 条流式追加（120ms/条，变长文本），固定行高 56px，
视口 480px（≈9 行可见）。自动时间线：P1  eager/可见性 → P2 流式 → P3 模拟上滚脱离 →
P4 回底重吸附 → P5 节流测量（200ms vs 16ms）→ P6 汇总。

## 退出标准逐项

| 标准 | 结果 | 证据 |
|---|---|---|
| 流式追加 + 底部吸附 | ✅ | 吸附态下每次追加后 `scrollY ≈ maxScrollOffset`（p1: 1202≈1202；p4: 5738≈5736） |
| 用户上滚脱离 | ✅ | 脱离后 scrollY 停在 3218，maxScrollOffset 3216→4392 增长而视图不动（p3 pass=true） |
| 子组件 JS 提前实例化 | ✅ 确认 | jsInstances=150 == itemCount=150（首屏 30/30）；**JS 层无 windowing** |
| ref/effect ≠ 可见 | ✅ 确认 | effectsFired=150，而同刻 attachedCells=9（UI 层有 windowing） |
| scroll 事件节流 | ✅ 确认 | 同类 smooth 滚动：throttle=200ms → 1 事件；throttle=16ms → 10 事件 |

## 关键语义（已回填 04-lynx-patterns.md）

1. **eventSource 三态实测**：`ListScrollEvent.detail.eventSource` — 0=DIFF / 1=LAYOUT / 2=SCROLL。
   - **瞬时程序滚动（smooth:false）报 LAYOUT(1)**，不报 SCROLL —— 意味着自己的吸附代码不会误触发"用户脱离"。
   - **smooth:true 程序滚动报 SCROLL(2)**（与用户手势同源）—— P5 中 smooth 滚顶触发自动脱离（p5 前 `pin detach` 事件即此）。
   - 推论：脱离检测门 `eventSource===2 && !atBottom` 对手势/平滑滚动都成立；瞬时程序滚动天然豁免。✅ 设计安全。
2. **attachedCells**（`need-visible-item-info={true}` 开启）给出真实渲染中的 item 数（9），是"可见性"的可靠来源；
   useEffect/ref 对所有 150 个实例触发 —— **可见性相关逻辑（已读、自动播放、动画）不得挂在 effect 上**。
3. **scroll-event-throttle 默认 200ms 极粗**（2.5s 平滑滚动仅 1 事件）；跟随/吸附逻辑应设 16–32ms，但事件跨线程，handler 必须廉价。
4. **getScrollInfo 有 @PC**（scrollY/maxScrollOffset 精确可靠）；**getVisibleCells 无 @PC 标注**（避免使用，用 attachedCells 替代）。
5. scrollTop 为亚像素浮点（34.52, 7472.37）—— atBottom 判定须用 epsilon（实测 BOTTOM_EPS=30px 稳健）。
6. 吸附实现：items 变化 effect 中 `invoke scrollToPosition({index:last, alignTo:'bottom'})`；渲染完成后 scrollHeight 1680=30×56 数学精确。

## 对 Phase 2（P2-V6 transcript）的直接输入

- 状态机：`pinnedRef` + bindscroll(eventSource==SCROLL 门) + 追加后 scrollToPosition —— 本 spike 已跑通，可直接抄。
- 每条事件跨线程开销 × 高频追加场景：吸附判定全放 background 可行（本测试即如此）；若帧率不足再上 MTS（P-03）。
- 150 实例全量 JS 创建 → 单条消息组件必须轻；markdown 重渲染件后续关注首屏成本（P2-V5 联动）。

## 复跑

```bash
cd spikes/p0-s1/app && npm run build && npx lynxtron dist/desktop
# 自动时间线 ~17s；结果落 spikes/p0-s4/results.jsonl
```
