---
title: Agent 面试知识点 #015：Working Memory 是什么？
date: 2026-07-12
category: Agent面试知识点
tags:
  - AI Agent
  - Working Memory
  - Memory
  - Context
  - Agent Runtime
summary: Working Memory 是 Agent 为完成当前步骤而主动维护和操作的任务工作区。它不是完整聊天历史，也不等于全部短期记忆，而是从目标、约束、计划、证据和工具结果中筛选出当前决策真正需要的信息，并持续更新、压缩和淘汰。
---

# Agent 面试知识点 #015：Working Memory 是什么？

## 摘要

Working Memory，直译是工作记忆。

在 Agent 系统里，可以把它理解为：

```text
Agent 为完成当前任务，正在主动读取、比较、修改和使用的任务工作区。
```

比如一个 AI Coding Agent 正在修复登录失败问题。

它的 Working Memory 可能是：

```text
目标：修复登录接口的 500 错误
约束：不能修改公共 API
当前假设：token 解析失败可能来自时区格式
关键证据：auth.spec.ts 第 3 个用例失败
已尝试：补充空值判断，无效
下一步：检查 token fixture 和解析逻辑
```

这些信息不是全部对话历史，也不是所有工具日志。

它们是 Agent 当前真正拿来思考和推进任务的那一小部分信息。

Working Memory 的核心不是“临时保存”，而是：

```text
选择什么进入工作区
如何区分目标、事实、假设和约束
工具执行后如何更新
信息冲突时相信什么
容量不足时删除什么
任务结束后哪些内容需要沉淀
```

所以，Working Memory 更像 Agent 的任务白板，而不是聊天记录仓库。

---

## 问题

Working Memory 是什么？

它和 Short-Term Memory、Context、State、Scratchpad 有什么区别？

为什么 Working Memory 决定了 Agent 在长任务中能不能持续做出正确决策？

---

## 面试官在考什么？

这个问题表面上是在问 Memory 的分类。

但面试官真正想考的是：

> 你是否理解 Agent 不只是要保存信息，还要维护一份面向当前决策、可以持续更新的任务工作集。

很多 Agent 能完成一两步操作，却容易在长任务中失控。

常见表现包括：

```text
忘记最初目标
重复尝试已经失败的方案
把模型猜测当成已确认事实
忽略用户明确约束
工具返回很多，但没有形成结论
任务执行到后面不知道下一步做什么
```

这些问题不一定是模型能力不足。

更常见的原因是，Runtime 没有帮助 Agent 维护清晰的 Working Memory。

模型每次只能根据当前输入做判断。

如果当前输入里混杂了大量聊天历史、过期观察、完整日志和重复结果，模型就很难知道：

```text
现在最重要的目标是什么？
哪些条件不能违反？
哪些结论已经确认？
哪些只是待验证假设？
刚才发生了什么变化？
下一步应该做什么？
```

因此，Working Memory 考察的是 Agent 的信息组织能力，而不只是信息存储能力。

---

## 核心知识点

### 1. Working Memory 是当前任务的主动工作区

Working Memory 服务于当前任务，并且强调“正在被使用”。

它通常包含：

```text
当前目标
不可违反的约束
当前计划
已确认事实
待验证假设
关键工具结果
失败尝试
未解决问题
下一步动作
```

例如 Browser Use Agent 正在提交一个采购表单。

Working Memory 可能是：

```text
目标：提交 3 台显示器的采购申请
约束：总价不能超过 12000 元，提交前需要用户确认
已填字段：品类、数量、成本中心
未填字段：供应商、交付日期
页面状态：供应商下拉框加载失败一次
下一步：刷新供应商列表，不要重复提交表单
```

这份工作区应该随着任务执行不断变化。

它不是静态资料，而是 Agent 当前推理和行动的操作面板。

---

### 2. Working Memory 不等于 Short-Term Memory

这两个概念很接近，但侧重点不同。

可以这样理解：

```text
Short-Term Memory：当前任务期间暂时保留的信息总池
Working Memory：从临时信息中选出的、当前正在操作的信息集合
```

例如一次调试任务中，Short-Term Memory 可能保存：

```text
完整对话
最近 20 次工具调用
所有测试日志
查看过的文件
多轮中间输出
```

Working Memory 只保留当前决策真正需要的内容：

```text
失败用例是 auth.spec.ts
当前假设是 mock token 格式错误
已经排除数据库连接问题
不能修改登录接口签名
下一步检查 fixture
```

所以：

```text
所有 Working Memory 通常都属于短期信息，
但不是所有 Short-Term Memory 都应该进入 Working Memory。
```

工程上，两者可能存放在同一个 State 或 Checkpoint 中。

但在概念上，Working Memory 更强调筛选、操作和更新。

---

### 3. Working Memory 和 Context 不是一回事

Context 是模型某一次调用实际看到的输入。

Working Memory 是 Runtime 维护的当前任务工作集。

关系可以表示为：

```text
对话历史 / 工具结果 / 长期记忆 / 环境状态
                    ↓
             Working Memory
                    ↓
          Context Manager 组装
                    ↓
             Model Context
```

Working Memory 里可能有结构化字段、文件引用和工具结果索引。

模型调用时，Context Manager 再把当前步骤需要的部分转换成提示词、消息或结构化输入。

因此：

```text
Working Memory 决定当前应该记住什么
Context 决定这一次模型实际看见什么
```

两者不能简单等同。

否则 Runtime 很难做压缩、权限控制和按步骤选择。

---

### 4. Working Memory 和 State 有重叠，但用途不同

State 描述任务当前处于什么状态。

例如：

```json
{
  "status": "executing",
  "current_step": "run_tests",
  "retry_count": 2,
  "requires_approval": false
}
```

Working Memory 描述 Agent 当前根据什么做决策。

例如：

```json
{
  "goal": "修复登录失败测试",
  "constraints": ["不得修改公共 API"],
  "facts": ["auth.spec.ts 第三个用例失败"],
  "hypotheses": ["token fixture 使用了错误时区"],
  "failed_attempts": ["增加空值判断"],
  "next_action": "检查 token fixture"
}
```

在真实 Runtime 中，Working Memory 往往是 State 的一部分。

但最好不要把两者完全混为一谈：

```text
State 更关心执行机如何继续运行
Working Memory 更关心 Agent 根据什么继续思考
```

---

### 5. Working Memory 和 Scratchpad 也不同

Scratchpad 通常指模型产生的临时推理痕迹、中间计算或行动记录。

Working Memory 的范围更广，也更可控。

它可以包含：

```text
用户确认过的约束
Runtime 写入的执行状态
工具返回的关键证据
Agent 提出的假设
外部系统产生的诊断信息
```

Scratchpad 更像模型自己的草稿。

Working Memory 更像 Runtime 和 Agent 共同维护的任务白板。

生产系统里，不应该依赖不可控的自由文本 Scratchpad 作为唯一工作记忆。

更稳妥的方式是把关键内容转成结构化字段和可审计记录。

---

### 6. Working Memory 必须区分事实、假设和计划

Agent 最危险的问题之一，是把不同类型的信息混在一起。

例如：

```text
页面提交失败
可能是权限不足
需要重新登录
```

这三句话分别可能是：

```text
事实：页面返回 403
假设：当前账号权限不足
计划：检查权限后再决定是否重新登录
```

如果 Agent 把“可能是权限不足”当成事实，就可能直接执行错误操作。

因此 Working Memory 最好明确区分：

```text
facts：已验证事实
observations：刚观察到的环境信息
hypotheses：待验证推测
constraints：不可违反的条件
decisions：已经做出的决定
plans：准备执行的步骤
open_questions：尚未解决的问题
```

这种分层会显著降低长任务中的推理漂移。

---

### 7. Working Memory 需要持续更新，而不是只追加

很多 Agent 系统把每一步结果不断追加到历史里。

但 Working Memory 不能只追加。

工具调用之后，Runtime 应该重新整理当前工作集：

```text
新证据是否推翻旧假设？
某个计划是否已经完成？
某条观察是否已经过期？
失败方案是否需要标记，避免重复尝试？
下一步动作是否需要改变？
```

例如测试结果证明数据库连接正常后，Working Memory 应该从：

```text
假设：可能是数据库连接失败
```

更新为：

```text
已排除：数据库连接问题
当前假设：token fixture 格式错误
```

这叫状态修正，不是简单记录日志。

---

### 8. Working Memory 必须有容量和淘汰策略

工作记忆不是越大越好。

如果把所有内容都留在工作区，会出现：

```text
目标被历史细节淹没
过期信息继续影响判断
同一事实出现多个冲突版本
模型重复选择已经失败的方案
上下文成本不断上升
```

常见策略包括：

```text
始终保留目标和硬约束
只保留当前计划和最近关键结果
将完整日志替换成引用或摘要
完成的步骤移入执行历史
被推翻的假设标记为已排除
相似信息合并去重
任务阶段切换时重新生成工作集
```

Working Memory 的目标不是保存全部过程，而是让当前决策保持清晰。

---

## 工业界方案

### 1. Runtime 维护结构化 Task Workspace

成熟 Agent Runtime 通常会维护一个任务级工作区，而不是只传消息数组。

例如：

```json
{
  "goal": "修复支付回调重复处理问题",
  "constraints": [
    "保持接口兼容",
    "不得跳过现有幂等校验"
  ],
  "plan": [
    "定位重复消费入口",
    "检查幂等键生成逻辑",
    "补充并发测试"
  ],
  "facts": [
    "重复记录来自同一个 event_id"
  ],
  "hypotheses": [
    "幂等键在重试请求中发生变化"
  ],
  "failed_attempts": [],
  "open_questions": [
    "上游是否可能并发发送同一事件"
  ],
  "next_action": "检查 event_id 到幂等键的映射"
}
```

每次工具调用后，Runtime 先更新工作区，再决定下一轮模型输入。

这样可以让任务暂停、恢复、审计和调试。

---

### 2. AI Coding：用 Working Memory 管理调试假设

AI Coding 场景非常适合显式 Working Memory。

一个代码 Agent 不应该只记录“看过哪些文件”。

它还应该维护：

```text
问题定义
影响范围
不可修改边界
当前根因假设
支持或反对该假设的证据
已尝试但失败的修改
待执行测试
完成标准
```

例如：

```text
事实：并发测试下出现重复订单
假设：锁的作用域只覆盖单进程
证据：两条请求来自不同 Worker
已排除：数据库唯一索引缺失
下一步：检查分布式锁 key 和过期时间
完成标准：并发 100 次只创建一条订单
```

这种 Working Memory 能避免 Agent 在代码库里无目的搜索，也能让 Review 更容易判断推理是否可靠。

---

### 3. Browser Use / Computer Use：维护动作账本和环境快照

环境操作类 Agent 的 Working Memory 需要额外关注重复执行风险。

例如表单提交场景，可以维护：

```text
action_ledger：已经执行过的关键动作
page_state：当前页面和窗口状态
filled_fields：已填写字段
pending_fields：待填写字段
submission_status：是否提交、是否收到成功回执
approval_state：是否获得用户确认
```

如果 Agent 只依赖截图或最近一条消息，很容易重复点击付款、重复发送消息或重复提交表单。

因此 Working Memory 中应该保留幂等标记：

```text
提交按钮已点击，但尚未收到成功回执
不要再次提交，先检查网络响应和订单列表
```

这比单纯保存截图更重要。

---

### 4. MCP：工具和资源提供证据，Host 维护 Working Memory

MCP 可以向 Agent 提供 tools、resources 和 prompts。

但 MCP Server 返回的信息，不应该自动全部成为 Working Memory。

更合理的职责划分是：

```text
MCP Server：提供工具能力和外部上下文
MCP Host / Agent Runtime：选择关键结果并更新任务工作区
Context Manager：决定本轮模型看到哪些内容
```

例如 GitHub MCP 工具返回几百行 Issue 和 Commit 数据。

Working Memory 可能只提取：

```text
Issue 要求保持向后兼容
最近一次相关修改发生在 auth middleware
当前失败与 commit abc123 之后的行为一致
```

协议负责交换信息，Runtime 负责把信息变成可工作的记忆。

---

### 5. A2A：传递任务工作集，而不是共享全部记忆

在 A2A 场景中，一个 Agent 把子任务交给另一个 Agent 时，不应该直接发送全部对话历史和长期记忆。

更合理的交接内容是：

```text
子任务目标
输入材料
硬约束
已确认事实
当前假设
期望输出
验收标准
```

例如主 Agent 把代码审查任务交给 Review Agent：

```text
目标：检查当前 diff 的兼容性风险
约束：不修改代码，只输出问题
已知事实：本次改动替换了缓存实现
重点检查：并发、过期策略和旧数据兼容
输出：按严重程度排序的问题列表
```

A2A 的 contextId 或 taskId 可以维持交互连续性，但具体 Working Memory 仍然需要由各自 Runtime 管理。

跨 Agent 共享时应遵循最小必要原则，避免把无关用户信息和其他任务状态一起传递。

---

### 6. ACP：把编辑器现场转成可操作的工作区

在 ACP 和 AI Coding 场景中，编辑器可以向 Agent 提供当前文件、选区、诊断、diff 和用户操作。

这些输入进入 Runtime 后，需要被整理成 Working Memory：

```text
当前目标文件
选中的代码范围
编译器诊断
已提出的修改
尚未解决的错误
用户拒绝过的方案
下一步准备编辑的位置
```

ACP 解决的是客户端和 Agent 之间如何交换会话更新与操作结果。

Working Memory 解决的是 Agent 如何把这些更新组织成当前任务的有效工作集。

协议和记忆系统是两个层次。

---

### 7. 长任务：Checkpoint 保存，Context 按需编译

Working Memory 虽然主要服务当前任务，但长任务可能需要暂停和恢复。

因此 Runtime 通常会把它写入 Checkpoint。

恢复时不必把全部历史重新塞给模型，而是读取：

```text
当前目标
当前阶段
关键事实
未完成计划
最近工具结果
下一步动作
```

然后由 Context Manager 重新编译本轮 Context。

这能同时满足：

```text
任务可恢复
上下文成本可控
执行过程可审计
模型输入保持聚焦
```

---

## 常见误区

### 误区一：把 Working Memory 当成聊天历史

聊天历史只是原始输入之一。

Working Memory 应该是经过筛选和组织的任务工作集。

---

### 误区二：把所有工具结果都放进 Working Memory

完整日志、网页 HTML、长代码文件不应该全部长期占据工作区。

应该保留关键结论、必要片段和可回查引用。

---

### 误区三：不区分事实和假设

模型推测如果没有明确标记，很容易在后续步骤中被当成事实。

Working Memory 必须记录信息类型和证据来源。

---

### 误区四：只追加，不修正

新证据出现后，旧假设和旧计划需要被更新、推翻或归档。

只追加历史会让冲突信息越来越多。

---

### 误区五：让多个 Agent 无边界共享同一份 Working Memory

不同 Agent 的目标、权限和任务范围不同。

共享全部工作区容易造成状态污染和敏感信息泄露。

---

### 误区六：把 Working Memory 永久保存

工作记忆主要服务当前任务。

任务结束后，只有稳定、可复用的结论才应该晋升为 Long-Term Memory。

---

### 误区七：每轮都把完整 Working Memory 塞进 Context

Working Memory 是信息池，不等于模型输入。

每一轮应该根据当前步骤选择相关内容，否则仍然会浪费上下文并降低注意力质量。

---

## 面试加分答案

如果面试官问：

> Working Memory 是什么？

可以这样回答：

```text
Working Memory 是 Agent 为完成当前任务而主动维护和操作的任务工作区。它通常包含当前目标、硬约束、计划、已确认事实、待验证假设、关键工具结果、失败尝试和下一步动作。

它和 Short-Term Memory 很接近，但不完全相同。Short-Term Memory 是任务期间暂时保存的信息总池，包括对话、日志和工具历史；Working Memory 是从中筛选出的、当前决策真正需要的信息集合。所有 Working Memory 通常属于短期信息，但不是所有短期信息都应该进入工作记忆。

它和 Context 也不同。Working Memory 由 Runtime 持续维护，Context Manager 再根据当前步骤，把其中相关部分编译进本轮模型输入。它和 State 也有区别：State 更关注执行机处于什么阶段，Working Memory 更关注 Agent 根据哪些目标、事实、假设和约束做下一步决策。

工程上，我会把 Working Memory 设计成结构化 Task Workspace，至少区分 goal、constraints、facts、observations、hypotheses、plan、failed_attempts、open_questions 和 next_action。每次工具调用后都要更新而不是只追加，并通过压缩、去重、冲突处理和淘汰策略控制容量。

在 AI Coding 中，它可以维护根因假设、证据和验证标准；在 Browser Use 和 Computer Use 中，它需要记录动作账本和幂等状态；MCP 提供工具与外部上下文，但由 Host Runtime 决定哪些结果进入工作区；A2A 只传递子任务必要的工作集；ACP 提供编辑器现场更新，Runtime 再把当前文件、diff、诊断和计划组织成工作记忆。

所以 Working Memory 的价值不是让 Agent 暂时记住更多内容，而是让它在长任务中始终知道目标是什么、已经确认了什么、还需要验证什么，以及下一步为什么这样做。
```

---

## 一句话总结

Working Memory 是 Agent 当前任务的主动工作区，它把目标、约束、事实、假设、计划和工具结果组织成可持续更新的决策依据。
