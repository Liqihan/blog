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
summary: Working Memory 是 Agent 为完成当前任务而主动维护和操作的任务工作区。它不是完整聊天历史，也不等于全部短期记忆，而是从目标、约束、计划、证据和工具结果中筛选出当前决策真正需要的信息，并持续更新、压缩和淘汰。
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
当前假设：token fixture 的时区格式错误
关键证据：auth.spec.ts 第 3 个用例失败
已排除：数据库连接问题
下一步：检查 token 解析逻辑
```

这些信息不是全部对话历史，也不是所有工具日志。

它们是 Agent 当前真正拿来思考和推进任务的那一小部分信息。

需要注意的是，Working Memory 并不是所有 Agent 框架都明确定义的标准组件。工程上，它通常表现为 Runtime 中的一组任务状态、计划、关键事实、假设和工具结果。

所以，Working Memory 更像 Agent 的任务白板，而不是聊天记录仓库。

---

## 问题

Working Memory 是什么？

它和 Short-Term Memory、Context、State、Scratchpad 有什么区别？

为什么 Working Memory 会直接影响 Agent 在长任务中的稳定性？

---

## 面试官在考什么？

这个问题表面上是在问 Memory 的分类。

但面试官真正想考的是：

> 你是否理解 Agent 不只是要保存信息，还要维护一份面向当前决策、可以持续更新的任务工作集。

很多 Agent 能完成一两步操作，却容易在长任务中出现：

```text
忘记最初目标
重复尝试已经失败的方案
把模型猜测当成已确认事实
忽略用户明确约束
工具返回很多，却没有形成结论
执行到后面不知道下一步做什么
```

这些问题不一定是模型能力不足。

更常见的原因是，Runtime 没有帮助 Agent 维护清晰的 Working Memory。

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

例如 Browser Use Agent 正在填写采购表单：

```text
目标：提交 3 台显示器的采购申请
约束：总价不超过 12000 元，提交前需要确认
已填字段：品类、数量、成本中心
未填字段：供应商、交付日期
页面状态：供应商列表加载失败一次
下一步：刷新列表，不要重复提交表单
```

Working Memory 不是静态资料，而是随着执行持续变化的操作面板。

---

### 2. Working Memory 不等于 Short-Term Memory

两者很接近，但侧重点不同：

```text
Short-Term Memory：当前任务期间暂时保留的信息总池
Working Memory：从临时信息中选出的、当前正在操作的信息集合
```

一次调试任务中，Short-Term Memory 可能保存完整对话、所有测试日志和最近 20 次工具调用。

Working Memory 只保留当前决策真正需要的信息：

```text
失败用例是 auth.spec.ts
当前假设是 token fixture 格式错误
已经排除数据库连接问题
不能修改登录接口签名
下一步检查 fixture
```

因此：

```text
所有 Working Memory 通常都属于短期信息，
但不是所有 Short-Term Memory 都应该进入 Working Memory。
```

---

### 3. Working Memory 和 Context、State、Scratchpad 不同

Context 是模型某一次调用实际看到的输入。

Working Memory 是 Runtime 维护的当前任务工作集。

```text
对话历史 / 工具结果 / 长期记忆 / 环境状态
                    ↓
             Working Memory
                    ↓
          Context Manager 选择
                    ↓
             Model Context
```

State 更强调执行机处于什么阶段，例如：

```json
{
  "status": "executing",
  "current_step": "run_tests",
  "retry_count": 2
}
```

Working Memory 更强调 Agent 根据什么做决策，例如目标、事实、假设和下一步动作。

Scratchpad 更像模型自己的临时草稿；Working Memory 则通常由 Runtime 和 Agent 共同维护，并且可以被结构化、检查和恢复。

---

### 4. Working Memory 必须区分事实、假设和计划

Agent 最危险的问题之一，是把不同类型的信息混在一起。

例如：

```text
事实：页面返回 403
假设：当前账号权限不足
计划：检查账号权限后再决定是否重新登录
```

如果 Agent 把“可能是权限不足”当成事实，就可能直接执行错误操作。

因此 Working Memory 最好明确区分：

```text
facts：已验证事实
observations：刚观察到的环境信息
hypotheses：待验证推测
constraints：不可违反的条件
decisions：已经做出的决定
plan：准备执行的步骤
open_questions：尚未解决的问题
```

这种分层能降低长任务中的推理漂移。

---

### 5. Working Memory 需要更新，而不是只追加

工具调用之后，Runtime 应该重新整理当前工作集：

```text
新证据是否推翻旧假设？
某个计划是否已经完成？
某条观察是否已经过期？
失败方案是否需要标记，避免重复尝试？
下一步动作是否需要改变？
```

例如测试证明数据库连接正常后，Working Memory 应该从：

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

### 6. Working Memory 必须有容量和淘汰策略

工作记忆不是越大越好。

常见策略包括：

```text
始终保留目标和硬约束
只保留当前计划和关键结果
将完整日志替换成摘要或引用
完成的步骤移入执行历史
被推翻的假设标记为已排除
相似信息合并去重
任务阶段切换时重新生成工作集
```

任务结束后，也不应该把整份 Working Memory 永久保存。

只有稳定、可复用的结论，才适合晋升为 Long-Term Memory。

---

## 工业界方案

### 1. Runtime 维护结构化 Task Workspace

成熟 Agent Runtime 通常会维护任务级工作区，而不是只传消息数组。

例如：

```json
{
  "goal": "修复支付回调重复处理问题",
  "constraints": ["保持接口兼容"],
  "facts": ["重复记录来自同一个 event_id"],
  "hypotheses": ["幂等键在重试请求中发生变化"],
  "failed_attempts": [],
  "open_questions": ["上游是否并发发送同一事件"],
  "next_action": "检查 event_id 到幂等键的映射"
}
```

每次工具调用后，Runtime 先更新工作区，再决定下一轮模型输入。

这样任务才能暂停、恢复、审计和调试。

---

### 2. AI Coding：维护根因假设和验证标准

代码 Agent 不应该只记录“看过哪些文件”。

它还应该维护：

```text
问题定义
不可修改边界
当前根因假设
支持或反对该假设的证据
已经失败的修改
待执行测试
完成标准
```

例如：

```text
事实：并发测试下出现重复订单
假设：锁的作用域只覆盖单进程
证据：两条请求来自不同 Worker
下一步：检查分布式锁 key 和过期时间
完成标准：并发 100 次只创建一条订单
```

这能避免 Agent 在代码库里无目的搜索。

---

### 3. Browser Use / Computer Use：维护动作账本

环境操作类 Agent 需要记录：

```text
已经执行过的关键动作
当前页面或窗口状态
已填写和待填写字段
是否获得用户确认
是否已经提交
是否收到成功回执
```

例如：

```text
提交按钮已点击，但尚未收到成功回执。
不要再次提交，先检查网络响应和订单列表。
```

这类幂等标记可以避免重复付款、重复发送消息或重复提交表单。

---

### 4. MCP、A2A、ACP：协议提供信息，Runtime 组织工作记忆

在 MCP 场景中，Server 提供 tools、resources 和 prompts，但工具返回不应该自动全部进入 Working Memory。

Host Runtime 需要提取关键结论，并由 Context Manager 决定本轮模型看到什么。

在 A2A 场景中，Agent 交接子任务时，应该传递：

```text
子任务目标
必要输入
硬约束
已确认事实
期望输出
验收标准
```

而不是共享全部聊天历史和长期记忆。

在 ACP 和 AI Coding 场景中，编辑器可以提供当前文件、选区、诊断和 diff。Runtime 再把这些更新整理成当前目标、错误、修改计划和下一步动作。

协议解决信息如何交换；Working Memory 解决信息如何被当前任务使用。

---

### 5. Checkpoint 保存，Context 按需编译

长任务可能暂停或被中断，因此 Working Memory 通常需要写入 Checkpoint。

恢复时只需要读取：

```text
当前目标
当前阶段
关键事实
未完成计划
最近工具结果
下一步动作
```

再由 Context Manager 重新组装模型输入。

这可以同时保证任务可恢复、上下文成本可控和执行过程可审计。

---

## 常见误区

### 误区一：把 Working Memory 当成聊天历史

聊天历史只是原始输入之一，Working Memory 应该是经过筛选和组织的任务工作集。

### 误区二：把所有工具结果都放进去

完整日志、网页 HTML 和长代码文件应该保留引用或摘要，而不是长期占据工作区。

### 误区三：不区分事实和假设

模型推测如果没有明确标记，很容易在后续步骤中被当成事实。

### 误区四：只追加，不修正

新证据出现后，旧假设和旧计划需要被更新、推翻或归档。

### 误区五：多个 Agent 无边界共享同一份工作记忆

不同 Agent 的目标和权限不同，共享全部工作区容易造成状态污染和信息泄露。

### 误区六：每轮都把完整 Working Memory 塞进 Context

Working Memory 是信息池，不等于模型输入。每一轮仍然需要按当前步骤选择相关内容。

---

## 面试加分答案

如果面试官问：

> Working Memory 是什么？

可以这样回答：

```text
Working Memory 是 Agent 为完成当前任务而主动维护和操作的任务工作区，通常包含目标、硬约束、计划、已确认事实、待验证假设、关键工具结果、失败尝试和下一步动作。

它和 Short-Term Memory 很接近，但不完全相同。Short-Term Memory 是任务期间暂时保存的信息总池；Working Memory 是从中筛选出的、当前决策真正需要的信息集合。它和 Context 也不同：Working Memory 由 Runtime 持续维护，Context Manager 再根据当前步骤，把相关部分放进本轮模型输入。

工程上，我会把它设计成结构化 Task Workspace，区分 facts、observations、hypotheses、constraints、plan 和 next_action。每次工具调用后都要更新而不是只追加，并通过压缩、去重、冲突处理和淘汰策略控制容量。

在 AI Coding 中，它可以维护根因假设、证据和验证标准；在 Browser Use 和 Computer Use 中，它需要记录动作账本和幂等状态；MCP 提供工具与外部上下文，A2A 和 ACP 负责交换任务或编辑器信息，但最终都需要 Runtime 把相关信息组织成可工作的记忆。

所以 Working Memory 的价值不是让 Agent 暂时记住更多内容，而是让它始终知道目标是什么、已经确认了什么、还需要验证什么，以及下一步为什么这样做。
```

---

## 一句话总结

Working Memory 是 Agent 当前任务的主动工作区，它把目标、约束、事实、假设、计划和工具结果组织成可持续更新的决策依据。
