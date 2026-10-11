按本轮执行规则（同一问题两种做法失败即回退），#80 保持 OPEN；本轮原型已归档并回退，不创建 PR。

- 做法 1：复用上游 KaTeX 0.16.45 布局和字体轮廓，直接用 Native SVG image 显示。实际截图中预留尺寸正确但公式为空白，未通过。
- 做法 2：宿主将相同字体轮廓转为 PNG，Native 使用 inline-image / image。深色 1280×820、13px：行内公式、积分、嵌套分式、根号、矩阵、`$5` 六项全部通过，行高/位置/尺寸差值均 ≤2px。16px：五项通过，行内公式水平位置比 Electron 右偏 **3.5px**；其行高差 0px，宽/高差约 0.0023px，垂直偏差约 0.045px。该水平差值仍需定位文本前缀排版/字体度量，不能用针对夹具前缀的固定偏移掩盖，也未证明是平台限制。
- 两次配置的夹具均通过正常 RPC 删除，provider 配置恢复成功；launcher 已验证仅其自有 Native/Electron/Web 进程退出。未操作生产数据，未将应用置前。

仍缺：修复 16px 的行内水平对齐；完成深浅色 × 两种窗口尺寸 × 13/16px 全部八配置；Lynx Web 的实际 PNG/排版验证；更多 KaTeX 命令/组合与非法表达式的界面验证。八配置在第二配置失败后停止，不能宣称全矩阵通过。直接依赖 KaTeX 内部布局 API 的方案还需版本守卫、字体 OFL 版权和宿主懒加载保留。

本轮验证：Native **431 文件 / 1819 测试，0 失败**；受影响上游 Markdown Vitest **60/60**；根 fmt:check、lint（1307 warnings / 0 errors）、typecheck **8/8** 均通过（最后的异步图片身份修正后已重跑 Native 全量测试/构建，根检查未再次完整跑）。线程单元格 **46/50** 控件≤2px，另四项为既有 trail 点击区区别；canonical 消息格式 **4/8** 行高和 **16/30** 控件≤2px，剩余 assistant 行差 +2.4/+2.1/−8.7/−5px。J1（除 Stop）/J2/J7 两端各通过一次，发生在最后 math-only 修正之前，不作最终三连通过证明。#35 未修。

可恢复实现和证据位于本机：`/tmp/synara-chat80-rollback/`（35 个文件及 tracked.patch），`/tmp/synara-chat80-proof/native-matrix-v2/{dark-1280-13,dark-1280-16}.json`（实际逐项几何、清理结果），其他中间失败和截图保留于 `/tmp/synara-chat80-proof/`、`/tmp/chat80-native*.png`。这些本机路径不是公开 CI 产物；上面的数值和缺项是本 issue 的持久记录。下一步按顺序处理 #79，默认开。
