按本轮规则（同一问题两种做法失败即回退），#79 保持 OPEN；本轮原型已归档并回退，不创建 PR。默认值决定已按用户指示采用上游 **开**，无需再决定。

两种 Native 主线程单一滚动所有者方案均未达到真实界面的发送置顶/保持标准：

1. 主线程查询真实 list/anchor bounds、getScrollInfo，动态尾部 reserve，再 scrollToPosition 对齐发送行。Electron 发送后稳定在绝对 y=60px（容器 y=44px + paddingTop=16px）；Native 容器 y=60px，发送行最终 y=92px / 103px，偏差 **32px / 43px**。Native list 的尺寸估计稳定后仍未对齐。
2. 改为有时限、代数有边界的实测 offset 校正；只在未脱离读者的本地发送和该锚点内容变更期间运行。实际 Native 发送行仍停在 **y=103px**，Electron **y=60px**，差 **43px**；750ms 内达到“Anchor offset failed to converge”边界，未继续无限校正。

第二次的实际主线程读数：listHeight=743、scrollY=2200、maxScrollOffset=2243、anchor relativeTop=43、reserve=520、tail=223、position=2。这表明 invoke fulfilled 和 mock 的状态机测试不能证明 Native 实际置顶。仍需定位虚拟 list 的 reserve 子元素重测/估计缓存及 scrollToPosition offset 生效行为，或找到不耦合测量与高度跟随的主线程平台能力；不能将差值宣布为平台豁免。

原型还接入了可写设置、未知设置字段保留、Restore defaults、composer 实际 message ID（非泛化消息到达事件）、首次发送待挂载锚点，以及脱离取消/溢出回尾部门控。它们随失败的滚动实现一起回退，未留下行为不可靠的可用开关。

验证：Native 全量 **431 文件 / 1816 测试，0 失败**；主线程代码体的四项状态机测试通过（Rstest 会剥离 main-thread exports，测试转译相同函数体；这不等于真实引擎成功）；Native 构建及类型检查通过。初次单测导入方式导致 4 项失败和测试 afterEach 返回类型错误均已修正。两次比较的 harness 错误也保留：最初未找到 Electron 容器；后来发现两端内边距归属不同，最终按绝对可见位置比较。最终 Electron 500–2000ms 的所有样本 y=60px，Native y=103px。普通 J2、线程单元格和消息格式没有在这个失败原型上跑完；不能宣称该步快检通过。

剩余：真正发送后置顶并保持；首发、流式增长/溢出、手动脱离、Jump、路由/恢复、设置开关、失败发送的真实引擎覆盖；J2 及其余必要快检。仅靠状态机 mocks 不足以关闭本 issue。#35 未修。

本机可恢复文件：`/tmp/synara-chat79-rollback/`（13 个文件及 tracked.patch）；原始报告 `/tmp/synara-chat79-proof/{anchor1-inset,anchor1-diagnostic,anchor2}.json`；日志 `/tmp/synara-chat79-*`。本机路径不是公开 CI 产物；上面的读数和缺项为持久 issue 记录。接下来在已合入的集成版本做最终矩阵和三连工作流审核，最终清单会明确未满足项。
