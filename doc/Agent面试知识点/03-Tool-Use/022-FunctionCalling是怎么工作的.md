---
title: Agent 面试知识点 #022：Function Calling 是怎么工作的？
date: 2026-07-19
category: Agent面试知识点
tags:
  - AI Agent
  - Function Calling
  - Tool Calling
  - Tool Use
  - Agent Runtime
summary: Function Calling 不是让模型直接执行函数，而是把函数名称、描述和参数 Schema 提供给模型，让模型生成结构化调用意图；Runtime 再完成参数校验、权限判断、真实执行、结果回传和状态推进。它本质上是一套连接概率模型与确定性软件系统的协议化执行循环。
---

# Agent 面试知识点 #022：Function Calling 是怎么工作的？

## 摘要

Function Calling 是 Tool Calling 最常见的一种实现方式。

它并不是把一段真实函数代码交给模型运行，而是把函数的接口描述交给模型：

```text
函数叫什么
解决什么问题
什么时候应该调用
需要哪些参数
参数类型和约束是什么
```

模型根据用户目标和当前 Context，可能返回普通文本，也可能返回结构化调用请求：

```json
{
  "name": "get_order",
  "arguments": {
    "order_id": "ORD-1024"
  }
}
```

真正执行 `get_order` 的不是模型，而是 Agent Runtime。

完整过程是：

```text
声明函数 → 模型选择并生成参数 → Runtime 校验与执行
→ 将结果按 call_id 回传 → 模型继续推理或结束
```

所以 Function Calling 的本质不是“模型会调用代码”，而是：

> 模型负责把自然语言目标转换成结构化执行意图，Runtime 负责把这个意图安全地变成真实动作。

---

## 问题

Function Calling 是怎么工作的？

模型返回函数名和参数以后，系统为什么还不能直接相信并执行？

Function Calling、Tool Calling、MCP、A2A 和真实 API 分别处在哪一层？

---

## 面试官在考什么？

这个问题表面上是在问 API 调用流程。

但面试官真正想考的是：

> 你是否理解 Function Calling 是一套由模型、Schema、Runtime、执行器和状态管理共同组成的闭环，而不是模型输出一段 JSON 就结束了。

一个可靠的系统需要处理：

```text
函数如何描述给模型
模型如何决定调用还是直接回答
参数如何解析和校验
调用是否有权限
函数在哪里真正执行
多个调用如何关联结果
失败后是否可以重试
有副作用的调用如何避免重复
结果如何重新进入 Context
什么时候继续调用，什么时候停止
```

如果只会定义一个函数，却没有处理这些问题，做出来的通常只是 Demo，而不是可上线的 Agent Runtime。

---

## 核心知识点

### 1. 第一步是把真实能力转换成 Function Declaration

Runtime 不会把函数源码完整塞给模型。

它通常只提供一份接口契约：

```json
{
  "type": "function",
  "name": "search_code",
  "description": "在指定仓库中搜索代码，仅用于读取和定位，不修改文件。",
  "parameters": {
    "type": "object",
    "properties": {
      "repository": {
        "type": "string",
        "description": "owner/name 格式的仓库名"
      },
      "query": {
        "type": "string",
        "description": "要搜索的文件名、符号或文本"
      },
      "limit": {
        "type": "integer",
        "minimum": 1,
        "maximum": 50
      }
    },
    "required": ["repository", "query"],
    "additionalProperties": false
  }
}
```

模型看到的是：

```text
name + description + JSON Schema
```

执行器持有的才是：

```text
真实函数、API Client、数据库连接或系统能力
```

这层分离让 Runtime 可以独立控制权限、版本、凭证和执行环境。

---

### 2. 模型生成的是 Function Call Proposal

调用模型时，应用会同时发送：

```text
用户输入
当前 Context
可用函数声明
tool_choice 等调用策略
```

模型可能有三种结果：

```text
直接生成文本
请求调用一个函数
请求调用多个函数
```

结构化调用通常包含：

```text
call_id：本次调用的唯一标识
name：函数名称
arguments：模型生成的参数
```

这里最重要的是：

```text
Function Call 只是提议，不是执行结果。
```

模型可能选错函数，也可能生成格式正确但业务上错误的参数。

---

### 3. Strict Schema 只保证结构，不保证语义

严格模式可以提升参数符合 JSON Schema 的概率，例如：

```text
必填字段存在
类型正确
枚举值合法
没有多余字段
```

但它不能保证：

```text
order_id 真实存在
文件路径属于当前工作区
用户有权访问该资源
调用符合当前任务目标
金额、日期和对象选择正确
操作现在应该执行
```

因此 Runtime 仍然需要进行两层校验：

```text
Schema Validation：结构是否合法
Business Validation：语义、权限和状态是否合法
```

“JSON 能解析”距离“可以安全执行”还差很远。

---

### 4. Runtime 才是真正的执行者

Runtime 收到 Function Call 后，通常会经过：

```text
解析参数
校验 Schema
检查工具是否在允许列表
检查用户和 Agent 权限
判断风险等级
必要时请求确认
注入服务凭证与运行上下文
调用真实函数
捕获成功、失败、超时和异常
```

例如模型返回：

```json
{
  "name": "apply_patch",
  "arguments": {
    "path": "../../etc/hosts",
    "patch": "..."
  }
}
```

即使参数结构合法，Runtime 也必须拒绝越过工作区边界的路径。

所以安全边界不能写在 Prompt 里，必须落实在执行器和策略层。

---

### 5. 函数结果需要通过 call_id 回到模型

函数执行后，Runtime 会把结果转换成 Tool Result，并与原调用关联：

```json
{
  "type": "function_call_output",
  "call_id": "call_abc123",
  "output": {
    "status": "success",
    "matches": [
      {
        "path": "src/auth/token.ts",
        "line": 84
      }
    ]
  }
}
```

`call_id` 的作用是让系统知道：

```text
这个结果对应哪一次调用
多个并行调用的结果如何配对
重试返回的是新调用还是旧调用
执行历史如何审计
```

模型拿到结果以后，可能：

```text
直接回答用户
调用下一个函数
修正此前计划
根据错误选择恢复路径
```

因此 Function Calling 通常是循环，而不是一次请求。

---

### 6. Function Calling 本质上是一台状态机

一个典型循环可以表示为：

```text
MODEL
  ↓
FUNCTION_CALL?
  ├─ 否 → FINAL_ANSWER
  └─ 是
       ↓
VALIDATE
       ↓
AUTHORIZE / CONFIRM
       ↓
EXECUTE
       ↓
NORMALIZE_RESULT
       ↓
UPDATE_STATE
       ↓
MODEL
```

Runtime 需要维护：

```text
当前目标
调用次数
已执行动作
失败尝试
工具结果
剩余预算
是否已经确认
是否满足停止条件
```

否则 Agent 很容易重复调用同一函数、忘记已发生的副作用，或者在工具失败后陷入循环。

---

### 7. 并行调用和串行调用需要不同处理

当多个调用互不依赖时，可以并行执行：

```text
读取三个独立文件
查询多个服务状态
获取多个城市天气
```

当后一个参数依赖前一个结果时，必须串行：

```text
先 search_code 找到文件
再 read_file 读取内容
再 apply_patch 修改
最后 run_tests 验证
```

Runtime 不能只看模型一次返回了几个 Function Call，还要判断：

```text
是否存在数据依赖
是否会写同一资源
是否有副作用
是否需要按顺序提交
失败时是否取消其他调用
```

并行不是越多越好，它必须满足安全和一致性条件。

---

### 8. 错误必须作为结构化结果返回

函数调用失败时，不应该只把一长段异常堆栈丢回模型。

更好的结果是：

```json
{
  "status": "error",
  "error_type": "permission_denied",
  "message": "当前用户没有写入该仓库的权限",
  "retryable": false
}
```

常见错误类型包括：

```text
invalid_arguments
permission_denied
not_found
conflict
timeout
rate_limited
dependency_failed
partial_success
```

模型需要知道：

```text
是否应该修正参数
是否应该重试
是否应换工具
是否需要用户介入
是否必须立即停止
```

错误协议设计得越清楚，Agent 的恢复能力越稳定。

---

## 工业界方案

### 1. Runtime 使用标准执行流水线

生产系统常见架构是：

```text
Tool Registry
    ↓
Context Compiler
    ↓
Model Function Call
    ↓
Call Parser
    ↓
Schema Validator
    ↓
Policy / Permission / Confirmation
    ↓
Executor
    ↓
Result Normalizer
    ↓
State Store + Trace
    ↓
Model
```

其中 Tool Registry 保存：

```text
函数版本
Schema
风险级别
读写属性
超时和重试策略
所需权限
负责执行的服务
```

模型不应该直接持有真实凭证，也不应该绕过 Broker 访问底层系统。

---

### 2. AI Coding：函数调用驱动可验证的修改循环

AI Coding Agent 常见函数包括：

```text
search_code
read_file
apply_patch
run_command
run_tests
get_diff
git_commit
```

一次修复任务可能是：

```text
search_code → read_file → apply_patch → run_tests → get_diff
```

Runtime 需要限制工作区路径、记录每次 diff，并把测试结果作为真实验收依据。

模型生成“已经修好”不算完成，只有工具返回测试通过和实际 diff 才能形成可信结论。

---

### 3. Browser Use / Computer Use：底层动作也可以封装成函数

浏览器或桌面操作可以抽象为：

```text
navigate
read_page
click
type
select
take_screenshot
```

但函数调用成功只代表动作被执行，不一定代表业务成功。

例如 `click("提交")` 返回成功后，还要通过：

```text
网络响应
成功提示
业务记录 ID
列表中的新记录
```

确认提交结果。

对发送、付款、删除等副作用，还要保存幂等键和动作账本，避免超时重试造成重复操作。

---

### 4. MCP：标准化函数如何被发现和调用

MCP Server 可以暴露工具名称、描述和输入 Schema。

Host 将这些 MCP Tools 适配成模型可使用的 Function Declarations；模型生成调用请求后，Host 再通过 MCP 调用 Server，并把 Tool Result 返回模型。

可以理解为：

```text
Function Calling：模型侧的结构化调用机制
MCP：Host 与外部工具提供方之间的标准协议
```

MCP 解决接入标准化，Runtime 仍然负责工具选择、权限、确认、Context 和错误恢复。

---

### 5. ACP：把编辑器能力变成受控函数

在 ACP 或编辑器 Agent 中，Function Calling 可以连接：

```text
读取当前文件
获取选区
查看诊断
应用编辑
展示 diff
运行任务
```

编辑器 Host 掌握真实工作区和用户交互，因此可以在写入前展示改动、在高风险操作前确认，并把结果回传给 Agent。

这比让模型直接生成不可追踪的文件修改更可控。

---

### 6. A2A：远程 Agent 不应简单伪装成普通函数

普通函数通常具有：

```text
输入明确
执行边界清晰
返回结果相对短
生命周期较短
```

远程 Agent 可能需要多轮澄清、长时间运行、持续状态和多个 Artifact。

这类任务更适合使用 A2A 的任务交接，而不是塞进一次同步 Function Call。

主 Agent 可以通过 Function Calling 发起一个 A2A 客户端动作，但协议层仍应保留远程任务的状态、上下文和产物语义。

---

### 7. 全链路记录比只看最终答案更重要

每次 Function Calling 至少应记录：

```text
模型看到了哪些函数
模型选择了什么
原始参数是什么
参数如何被修正或拒绝
谁授权了调用
真实执行耗时和结果
是否发生重试
结果如何影响下一步决策
```

核心指标可以包括：

```text
函数选择准确率
参数一次通过率
无效调用率
重复调用率
调用成功率
恢复成功率
高风险调用拦截率
单任务调用次数和成本
```

只有能观察完整调用链，才能判断问题来自模型、Schema、Runtime 还是底层服务。

---

## 常见误区

### 误区一：Function Calling 会让模型直接执行函数

模型只生成函数名和参数，真正执行发生在应用 Runtime 或外部服务中。

### 误区二：Function Calling 就是让模型输出 JSON

普通 JSON 输出只是结构化文本；Function Calling 还包含工具声明、调用标识、结果回传和多轮执行语义。

### 误区三：Strict Mode 可以保证调用正确

Strict Mode 主要保证参数结构符合 Schema，不能保证权限、业务状态和调用意图正确。

### 误区四：函数执行成功就代表任务成功

底层函数成功只说明一个步骤完成，Agent 仍需验证是否满足用户最终目标。

### 误区五：遇到超时直接重试

写操作可能已经成功但响应丢失。没有幂等键和业务回执，重试可能产生重复副作用。

### 误区六：所有函数都可以并行执行

存在依赖、共享资源或副作用时必须串行或使用事务控制。

### 误区七：MCP 可以替代 Function Calling

MCP 负责外部工具的标准化接入，Function Calling 负责模型如何表达结构化调用意图，两者处于不同层。

### 误区八：把远程 Agent 封装成函数就等于完成 A2A

长任务、多轮交互、状态更新和 Artifact 交付需要独立的 Agent 协作语义。

---

## 面试加分答案

如果面试官问：

> Function Calling 是怎么工作的？

可以这样回答：

```text
Function Calling 的核心，是先把真实函数转换成模型可理解的声明，包括 name、description 和 JSON Schema。模型收到用户目标、Context 和函数声明后，可以直接回答，也可以输出包含函数名、参数和 call_id 的结构化调用请求。

模型不会真正执行函数。Agent Runtime 收到调用后，要完成 Schema 校验、业务校验、权限判断、风险分级和必要的用户确认，再由 Executor 调用真实 API、数据库、本地函数或系统能力。执行结果会被标准化，并通过 call_id 作为 Function Result 返回模型。模型根据 Observation 更新 State，决定继续调用、修正计划还是输出最终答案，因此它本质上是一个多轮状态机。

Strict Schema 只能提高参数结构正确性，不能保证资源存在、用户有权限或业务操作合理。有副作用的函数还需要幂等键、业务回执、超时与重试策略。多个无依赖的只读调用可以并行，存在数据依赖或共享写入时则需要串行执行。

在 AI Coding 中，它驱动搜索、读取、补丁和测试循环；Browser Use 与 Computer Use 可以把点击、输入和页面读取封装成函数，但仍要验证业务是否真正成功；MCP 标准化外部工具发现与调用，ACP 提供编辑器能力，A2A 负责更长生命周期的 Agent 协作。

所以 Function Calling 不是一个 JSON 技巧，而是模型、Schema、Runtime、执行器、权限系统和状态管理共同组成的执行协议。
```

---

## 一句话总结

Function Calling 是把自然语言决策转换成结构化调用意图，再由 Runtime 安全执行、回传结果并驱动下一轮决策的完整闭环。
