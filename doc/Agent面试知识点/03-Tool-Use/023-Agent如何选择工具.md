---
title: Agent 面试知识点 #023：Agent 如何选择工具？
date: 2026-07-20
category: Agent面试知识点
tags:
  - AI Agent
  - Tool Selection
  - Tool Routing
  - Tool Calling
  - Agent Runtime
summary: Agent 选择工具不是根据关键词匹配一个函数，而是在任务目标、当前状态、权限、风险、成本和可靠性约束下，先判断是否需要工具，再发现候选能力、过滤不可用工具、比较执行路径，并根据结果持续调整。生产系统通常采用 Tool Registry、动态工具加载、策略引擎和模型路由相结合的分层方案。
---

# Agent 面试知识点 #023：Agent 如何选择工具？

## 摘要

当 Agent 同时拥有搜索、数据库、代码执行、Browser Use、Computer Use、MCP Tool 和子 Agent 等能力时，真正困难的往往不是“能不能调用”，而是：

```text
当前任务是否需要调用工具？
应该选择哪一个工具？
多个工具都能完成时，哪个更可靠？
什么时候应该组合调用，什么时候应该停止？
```

例如用户要求：

```text
帮我确认仓库中的登录问题，并修复后运行测试。
```

Agent 可能面对：

```text
search_code
read_file
run_shell
apply_patch
browser_search
computer_use
coding_agent
```

此时不能只看工具名称做关键词匹配。

更合理的选择过程是：

```text
理解目标和当前状态
→ 判断是否需要外部能力
→ 发现候选工具
→ 按权限、风险和适用范围过滤
→ 比较可靠性、成本和信息增益
→ 选择并执行
→ 根据结果重新规划
```

所以，Tool Selection 本质上是 Agent Runtime 中的一次受约束决策，而不是模型在工具列表里“随便挑一个”。

---

## 问题

Agent 如何选择工具？

为什么工具描述、Context、权限、成本和执行状态都会影响选择？

在 API、MCP、Browser Use、Computer Use、AI Coding Tool 和 A2A Agent 之间，应该如何决定优先级？

---

## 面试官在考什么？

这个问题表面上是在问模型如何挑选函数。

但面试官真正想考的是：

> 你是否理解 Tool Selection 是候选发现、语义匹配、策略过滤、风险控制和执行反馈共同组成的路由系统，而不是只靠 Prompt 让模型自由决定。

一个 Demo 通常会把十几个工具一次性放进 Prompt，然后告诉模型：

```text
请根据用户问题选择最合适的工具。
```

工具数量少、语义差异大时，这可能有效。

进入生产后，系统会遇到：

```text
多个工具功能重叠
工具列表过大，占用 Context
工具描述模糊，模型容易误选
某些工具当前用户没有权限
Browser Use 能完成，但 API 更稳定
高风险写操作需要确认
工具结果失败后需要切换路径
```

因此，工具选择能力既取决于模型，也取决于 Runtime 是否给模型提供了正确、有限且可执行的候选集合。

---

## 核心知识点

### 1. 第一个决策不是“选哪个工具”，而是“是否需要工具”

并不是所有问题都应该调用工具。

通常以下情况更需要工具：

```text
需要实时或最新信息
需要访问私有数据
需要精确计算或执行代码
需要读取当前文件、页面或系统状态
需要产生真实副作用
需要验证模型不能凭参数知识确认的事实
```

以下情况可能不需要：

```text
解释稳定概念
改写用户已经提供的文本
基于当前 Context 做总结
回答不依赖外部事实的推理问题
```

如果 Agent 不先做这一步，会出现两个极端：

```text
该查询真实数据时直接编造
不需要工具时频繁调用，增加成本和风险
```

所以工具选择的第一层是 `tool vs no_tool`。

---

### 2. 候选工具发现和最终选择应该分开

当工具数量较少时，模型可以直接看到全部工具。

当工具达到几十、几百甚至来自多个 MCP Server 时，全部加载会导致：

```text
Tool Schema 占用大量 Context
相似工具互相干扰
模型选错命名相近的能力
无关工具扩大权限暴露面
```

更合理的过程是：

```text
Tool Registry / Tool Search
        ↓
召回少量候选工具
        ↓
权限和策略过滤
        ↓
模型在候选集中选择
```

候选召回可以结合：

```text
任务类型
关键词和语义检索
当前工作区
工具命名空间
历史成功率
用户和 Agent 权限
```

发现解决“有哪些可能可用”，选择解决“当前到底用哪个”。

---

### 3. Tool Description 和 Schema 是模型的语义接口

模型通常看不到真实实现，只能看到：

```text
name
description
inputSchema
outputSchema
annotations
```

因此工具描述需要说明：

```text
它能做什么
它不能做什么
什么场景应该使用
与相似工具有什么区别
是否只读、是否有副作用
成功结果代表什么
```

例如下面两个描述差异很大：

```text
search：搜索内容
```

和：

```text
search_repository：在指定 Git 仓库中按文件名、符号或文本搜索代码；
只用于定位，不读取完整文件，也不修改内容。
```

后者更容易让模型正确区分 `search_repository`、`read_file` 和 `apply_patch`。

Schema 也会影响选择。如果一个简单查询工具要求十几个复杂参数，模型可能转而选择更容易调用但更不可靠的工具。

---

### 4. 工具选择是多目标优化，不只是相关性排序

语义上最相关的工具，不一定是最终应该选择的工具。

Runtime 还需要考虑：

```text
Capability：能否完成任务
Reliability：历史成功率和稳定性
Freshness：数据是否足够新
Permission：当前用户是否有权限
Risk：是否会产生不可逆副作用
Latency：执行时间
Cost：模型、API 和计算成本
Observability：结果是否可验证、可审计
Reversibility：失败后能否撤销
```

可以抽象成：

```text
Tool Score
= 任务匹配度 + 可靠性 + 信息增益
- 成本 - 延迟 - 风险
```

但硬性约束不能只靠打分。

例如用户没有写权限时，即使 `update_database` 的匹配度最高，也必须在策略过滤阶段直接移除。

---

### 5. 选择必须结合当前 State 和 Context

同一句用户指令，在任务不同阶段应该选择不同工具。

例如 AI Coding 任务：

```text
开始阶段：search_code
定位后：read_file
形成方案后：apply_patch
修改后：run_tests
验证完成后：git_diff
```

如果 Runtime 没有保存当前 State，模型可能：

```text
重复搜索已经找到的文件
未读取代码就直接修改
测试失败后仍然提交
已经执行成功却再次调用写工具
```

Tool Selection 的输入不应该只有用户最新一句话，还要包括：

```text
当前目标
已确认事实
已经调用过的工具
关键结果和错误
未完成步骤
剩余预算
副作用是否已经发生
```

所以工具选择和 Working Memory、Context Engineering、Checkpoint 密切相关。

---

### 6. 优先选择结构化、稳定、可验证的执行路径

多个工具都能完成任务时，常见优先级是：

```text
直接结构化 API / 专用业务工具
> MCP 暴露的稳定语义工具
> Browser Use 的 DOM / Accessibility 操作
> Computer Use 的视觉与坐标操作
```

例如查询订单状态：

```text
get_order API
```

通常优于：

```text
打开后台网页 → 搜索订单 → 读取页面文字
```

因为 API 更容易获得结构化结果、业务状态和稳定错误码。

但 Browser Use 或 Computer Use 仍然重要，因为很多系统没有 API，或者任务必须操作真实 UI。

正确做法不是固定排斥某类工具，而是建立逐级降级策略。

---

### 7. 模型路由和确定性规则应该结合

完全由规则选择工具，难以覆盖自然语言的开放性。

完全由模型选择，又容易受到描述、Context 和随机性的影响。

生产系统通常采用混合方案：

```text
确定性规则：权限、租户、风险、资源边界、强制流程
模型判断：任务理解、候选比较、参数生成、组合顺序
Runtime 校验：调用前再次检查业务状态
```

例如：

```text
查询当前余额 → 规则要求必须使用实时账户工具
多个只读查询工具之间 → 模型选择最合适的一个
付款工具 → Runtime 强制用户确认
```

模型负责处理模糊语义，Runtime 负责守住确定性边界。

---

### 8. 工具执行结果会反过来影响下一次选择

工具选择不是一次性分类。

执行后可能出现：

```text
工具不可用
权限不足
参数错误
数据为空
结果不完整
页面结构变化
API 返回冲突
```

Agent 需要根据错误类型重新选择：

```text
参数错误 → 修正参数后重试
权限不足 → 停止并说明需要授权
API 不可用 → 在策略允许时降级到 Browser Use
搜索结果为空 → 调整查询或换检索工具
写操作状态未知 → 先查询业务结果，不直接重试
```

因此工具选择实际是：

```text
Select → Execute → Observe → Re-select
```

可靠性来自整个闭环，而不是第一次就永远选对。

---

## 工业界方案

### 1. 建立 Tool Registry，而不是把工具散落在 Prompt 中

Tool Registry 可以记录：

```json
{
  "name": "search_code",
  "namespace": "repository",
  "capabilities": ["search", "read_only"],
  "risk_level": "low",
  "required_permissions": ["repo:read"],
  "average_latency_ms": 350,
  "cost_class": "low",
  "fallbacks": ["repository_browser_search"]
}
```

除了模型可见的 name、description 和 Schema，还应保存 Runtime 使用的：

```text
版本
作用域
风险等级
权限要求
超时和重试策略
历史成功率
成本
降级路径
```

这样工具选择才可以被治理、监控和持续优化。

---

### 2. 使用分层 Tool Router

一个常见路由流水线是：

```text
任务识别
  ↓
Tool / No-Tool 判断
  ↓
候选工具检索
  ↓
权限、风险和可用性过滤
  ↓
模型选择或规则路由
  ↓
参数与业务校验
  ↓
执行和结果反馈
```

对于明确任务，可以直接规则路由。

对于开放任务，可以由模型在有限候选中选择。

这种分层方式比让一个 Prompt 同时承担所有判断更稳定。

---

### 3. 动态加载工具与命名空间

工具很多时，可以先只暴露高层命名空间：

```text
repository
browser
calendar
crm
billing
```

模型先选择领域，再由 Runtime 加载该领域少量工具。

例如：

```text
repository.search_code
repository.read_file
repository.apply_patch
```

动态加载可以：

```text
降低 Context 占用
减少名称冲突
提高选择准确率
缩小权限暴露范围
```

MCP Host 同样可以根据当前任务，只加载相关 Server 或 Tool，而不是把所有已连接能力同时交给模型。

---

### 4. AI Coding 与 ACP：围绕任务阶段提供工具

在 AI Coding 场景里，工具集合可以随阶段变化：

```text
探索阶段：list_files、search_code、read_file
修改阶段：apply_patch、format_file
验证阶段：run_tests、get_diagnostics、git_diff
提交阶段：git_status、git_commit
```

ACP 或编辑器 Host 可以结合当前文件、选区、诊断和工作区权限，动态启用工具。

例如没有写权限时，只提供读取和审查能力；进入提交阶段前，Runtime 必须确认测试和 Diff 状态。

---

### 5. Browser Use / Computer Use：建立能力降级链

环境操作可以设计为：

```text
业务 API
→ 页面结构化接口
→ Browser DOM / Accessibility
→ Computer Use 视觉操作
```

每次降级都要重新评估：

```text
准确性是否足够
是否能确认业务成功
是否涉及高风险动作
是否需要人工确认
```

Computer Use 最通用，但通常也最脆弱。按钮位置、弹窗和视觉状态都可能变化，所以不能仅凭“点击成功”判断任务完成。

---

### 6. MCP 和 A2A 处在不同选择层级

MCP Tool 通常是一个明确能力，例如：

```text
search_documents
create_issue
query_database
```

A2A 面向的是另一个可以自主规划、多轮执行并返回 Artifact 的 Agent。

当任务边界清晰、输入输出确定时，优先选择普通 Tool。

当任务需要独立上下文、长时间执行、专业推理或多步骤协作时，才考虑交给远程 Agent。

可以理解为：

```text
选择 Tool：选择一种能力
选择 A2A Agent：选择一个任务承担者
```

两者不应该仅因为都能“返回结果”就混为一类。

---

### 7. 用 Trace 和 Eval 持续优化工具选择

工具选择需要离线评测和线上观测。

常见指标包括：

```text
Tool / No-Tool 判断准确率
首选工具正确率
候选召回率
无效调用率
重复调用率
降级成功率
任务完成率
平均调用次数
单任务成本和延迟
高风险误调用拦截率
```

还需要保存完整 Trace：

```text
模型当时看到了哪些工具
为什么某些工具被过滤
最终选择了什么
工具返回了什么
是否发生重试或降级
最终任务是否成功
```

否则很难判断失败来自模型、工具描述、候选召回、权限策略还是底层执行器。

---

## 常见误区

### 误区一：把所有工具一次性提供给模型

工具越多不代表能力越强，反而会增加 Context 成本、选择冲突和权限风险。

### 误区二：工具选择完全交给 Prompt

Prompt 可以指导语义判断，但权限、风险和业务状态必须由 Runtime 强制控制。

### 误区三：名称相近的工具，模型自然能区分

工具名称、描述和 Schema 如果重叠，模型很容易误选。需要明确边界，必要时合并或分层。

### 误区四：最强、最通用的工具就是最佳工具

无限制 Shell 或 Computer Use 很通用，但专用 API 通常更稳定、更便宜、更容易审计。

### 误区五：工具调用成功，就说明选择正确

API 返回成功可能只代表请求完成，不代表用户最终目标已经满足。

### 误区六：向量检索可以独立解决工具路由

语义召回只能找候选，不能替代权限、风险、状态和副作用判断。

### 误区七：失败后无限换工具重试

重试和降级需要预算、停止条件和幂等控制，否则 Agent 会进入高成本循环。

### 误区八：工具选择只由用户最新一句话决定

当前 State、过去结果、已经发生的副作用和工作区 Context 同样重要。

---

## 面试加分答案

如果面试官问：

> Agent 如何选择工具？

可以这样回答：

```text
Agent 选择工具不是简单的关键词匹配，而是一个受约束的路由过程。第一步先判断当前问题是否需要工具，例如是否依赖实时数据、私有信息、精确计算或真实副作用；如果需要，再从 Tool Registry 或 MCP Server 中召回少量候选工具，而不是把全部能力一次性放进 Context。

最终选择需要综合任务匹配度、可靠性、数据新鲜度、权限、风险、延迟、成本和结果可验证性。权限和安全属于硬约束，必须由 Runtime 过滤；模型更适合负责自然语言理解、候选比较和参数生成。工具的 name、description 和 Schema 是模型理解能力边界的语义接口，因此必须清楚说明何时使用、不能做什么，以及与相似工具的区别。

工具选择还要结合当前 State。AI Coding 任务在探索、修改、测试和提交阶段需要不同工具；Browser Use 和 Computer Use 应优先选择结构化 API，再逐级降级到 DOM 和视觉操作；MCP 用于选择标准化外部能力，A2A 则用于把完整子任务交给另一个 Agent。

执行结果会继续影响下一轮选择，因此完整流程是 Select、Execute、Observe、Re-select。生产系统通常采用 Tool Registry、候选检索、策略引擎、模型路由、执行校验和 Trace/Eval 组成的分层方案。

所以，好的 Tool Selection 不是让模型拥有最多工具，而是让它在当前状态下只看到有权限、低风险、最可靠且最有可能推进任务的那几个能力。
```

---

## 一句话总结

Agent 选择工具的核心，是在目标、状态、权限、风险、成本和可靠性约束下，为当前一步找到最小、最稳、最可验证的执行能力，并根据结果持续调整。
