---
title: Agent 面试知识点 #013：Short-Term Memory 是什么？
date: 2026-06-26
category: Agent面试知识点
tags:
  - AI Agent
  - Short-Term Memory
  - Memory
  - Context
  - Agent Runtime
summary: Short-Term Memory 是 Agent 在当前任务或当前会话中临时保留的信息，用来支撑多步骤推理、工具调用、状态跟踪和上下文衔接。它不是长期经验库，而是任务执行中的临时工作区。
---

# Agent 面试知识点 #013：Short-Term Memory 是什么？

## 摘要

Short-Term Memory，直译是短期记忆。

在 Agent 系统里，它不是一个神秘概念，也不是简单的聊天历史。

它更像 Agent 当前任务里的临时工作区。

比如：

```text
用户刚刚提出的目标
当前任务已经执行到哪一步
刚才工具返回了什么
本轮对话里确认过哪些约束
下一步打算做什么
```

这些信息不一定需要长期保存。

但在当前任务没有结束之前，Agent 必须能持续使用它们。

如果没有 Short-Term Memory，Agent 很容易出现前后不一致、重复调用工具、忘记用户刚刚补充的信息，或者在多步骤任务中丢失上下文。

---

## 问题

Short-Term Memory 是什么？

它和 Context、State、Long-Term Memory 有什么区别？

在 Agent Runtime 里，为什么需要专门管理短期记忆？

---

## 面试官在考什么？

这个问题表面上是在问 Memory 的一个分类。

但面试官真正想考的是：

> 你是否理解 Agent 在执行当前任务时，需要一套临时、可更新、可丢弃的信息管理机制。

普通 ChatBot 通常依赖上下文窗口。

只要当前对话还在窗口里，模型就能看到历史。

但 Agent 不一样。

Agent 会执行多步骤任务：

```text
理解目标
制定计划
调用工具
观察结果
更新状态
继续执行
```

在这个过程中，有很多信息只对当前任务有用。

比如 AI Coding Agent 正在修一个 bug：

```text
刚才失败的测试名
当前错误栈
已修改的文件
下一步要尝试的修复方向
用户要求不要改公共 API
```

这些信息未必应该进入长期记忆。

但如果当前任务中丢了，Agent 就会像突然失忆一样。

所以 Short-Term Memory 解决的是：

```text
当前任务执行过程中，哪些临时信息需要被持续保留和更新？
```

---

## 核心知识点

### 1. Short-Term Memory 是当前任务的临时记忆

Short-Term Memory 主要服务于当前任务。

它通常包括：

```text
用户当前目标
本轮对话中的约束
当前计划
最近工具调用结果
刚刚观察到的环境状态
临时中间结论
待确认事项
```

比如 Browser Use 场景里，Agent 正在填写一个表单。

它需要短期记住：

```text
已经填写了哪些字段
哪些字段还没填
页面刚才报了什么错
用户刚刚确认了哪个选项
提交按钮是否已经点过
```

任务结束后，这些信息大多可以丢弃。

因为它们只是当前执行现场的一部分。

---

### 2. Short-Term Memory 和 Context 不完全一样

Context 是模型当前这次推理能看到的信息。

Short-Term Memory 是 Runtime 或 Agent 系统暂时保存的任务信息。

两者关系很近，但不是一回事。

可以这样理解：

```text
Short-Term Memory：当前任务中暂存的信息池
Context：本次模型调用实际塞进去的信息
```

不是所有短期记忆都应该每次都放进 Context。

比如一个任务执行了 20 步，每一步的完整工具返回都塞进上下文，会非常浪费。

更好的做法是：

```text
Runtime 保存完整短期记忆
Context Manager 选择当前步骤需要的部分
必要时压缩成摘要
再放入模型上下文
```

所以 Short-Term Memory 更偏存储和管理，Context 更偏当前调用的输入组织。

---

### 3. Short-Term Memory 和 State 有重叠，但侧重点不同

State 更强调任务处于什么状态。

比如：

```json
{
  "status": "executing",
  "current_step": "run_tests",
  "retry_count": 1,
  "needs_user_confirm": false
}
```

Short-Term Memory 更强调当前任务里临时记住了什么。

比如：

```text
刚才 pnpm test 失败
失败用例是 user-service.spec.ts
报错原因可能和 mock 数据有关
用户要求先不要重构模块边界
```

在实际工程里，两者经常放在一起管理。

但面试时最好讲清楚：

```text
State 是任务运行状态
Short-Term Memory 是任务临时信息
```

State 更结构化。

Short-Term Memory 可以更灵活，可以是结构化字段，也可以是压缩后的自然语言摘要。

---

### 4. Short-Term Memory 不是 Long-Term Memory

Long-Term Memory 关注跨任务沉淀。

比如：

```text
用户偏好技术博客风格
这个项目用 pnpm
这个仓库提交前要跑 lint
某类问题经常出现在兼容性边界
```

Short-Term Memory 关注当前任务执行。

比如：

```text
本次测试失败在 auth.spec.ts
刚才已经改过 login.ts
当前计划是先补边界测试再修实现
```

判断标准很简单：

```text
任务结束后还需要保留吗？
```

如果不需要，大概率是 Short-Term Memory。

如果未来任务还会复用，才可能进入 Long-Term Memory。

---

### 5. Short-Term Memory 需要压缩和清理

短期记忆虽然是临时的，但也会膨胀。

尤其是 Agent 长任务中，工具调用、网页观察、代码 diff、测试日志都会快速变多。

如果不管理，会出现几个问题：

```text
上下文变长
重要信息被淹没
旧观察干扰新判断
工具返回重复堆积
模型更容易前后矛盾
```

所以 Runtime 通常需要做短期记忆压缩。

比如：

```text
保留最近 N 步完整记录
更早的步骤压缩成摘要
失败原因单独结构化保存
关键用户约束始终保留
已过期观察及时删除
```

Short-Term Memory 不是越多越好，而是要保持对当前任务有用。

---

## 工业界方案

### 1. Runtime 负责维护短期记忆

成熟 Agent 系统不会只依赖模型上下文窗口来保存短期信息。

更常见的是 Runtime 维护一个任务级 Memory 对象。

它可能包含：

```text
task_goal
current_plan
recent_actions
tool_results
observations
temporary_notes
open_questions
```

每轮模型调用前，Context Manager 再从这个对象里挑选相关内容。

这样做的好处是：

```text
任务可以暂停和恢复
上下文可以被压缩
工具结果不会丢
失败原因可以追踪
模型不需要看到所有历史细节
```

---

### 2. AI Coding 场景：短期记忆记录调试现场

AI Coding Agent 的 Short-Term Memory 非常关键。

它需要记录：

```text
当前 bug 描述
已查看的文件
已修改的文件
测试命令
失败测试
错误栈
尝试过的修复方案
下一步计划
```

比如测试连续失败时，Agent 不能每次都重新猜。

它要知道：

```text
第一次失败是类型错误
第二次失败是 mock 数据不完整
当前修复方向已经从类型修复转向测试 fixture
```

这类信息通常不需要长期保存。

但在当前 debug 任务里，它决定了 Agent 能不能持续推进。

---

### 3. Browser Use / Computer Use 场景：短期记忆记录环境变化

在 Browser Use 里，Agent 需要短期记住页面状态。

比如：

```text
当前 URL
当前页面标题
已点击的按钮
表单填写进度
页面报错信息
提交后的反馈
```

在 Computer Use 里，Agent 可能还要记住：

```text
当前打开的应用
当前工作目录
刚刚运行的命令
命令输出
文件是否保存
窗口状态是否变化
```

这些信息如果直接丢失，Agent 就会重复点击、重复提交，或者误以为操作成功。

所以短期记忆是环境操作类 Agent 的基本能力。

---

### 4. MCP / A2A / ACP 场景下的短期记忆

在 MCP 场景里，Short-Term Memory 记录工具调用现场：

```text
调用了哪个工具
参数是什么
返回结果是什么
是否失败
失败后是否重试
```

在 A2A 场景里，Short-Term Memory 记录协作现场：

```text
子任务发给了哪个 Agent
哪个结果已经返回
哪些结论冲突
哪些子任务还在等待
```

在 ACP 场景里，Short-Term Memory 记录应用操作现场：

```text
当前文件
当前 diff
当前光标位置
刚刚执行的编辑动作
应用反馈结果
```

这些信息通常只在当前任务内有效。

但没有它们，Agent 就无法稳定执行复杂流程。

---

## 常见误区

### 误区一：把 Short-Term Memory 等同于聊天上下文

聊天上下文只是模型当前能看到的文本。

Short-Term Memory 是 Runtime 管理的当前任务临时信息。

两者可以重叠，但不能等同。

---

### 误区二：认为短期记忆不重要

很多人重视 Long-Term Memory，却忽视 Short-Term Memory。

但 Agent 能否完成一个多步骤任务，首先取决于短期记忆是否稳定。

连当前任务做到哪一步都记不住，长期记忆再强也没用。

---

### 误区三：把所有短期记忆都写入长期记忆

短期记忆大多是临时状态。

比如某次页面报错、某次表单填写进度、某轮测试失败输出，不一定值得长期保存。

真正值得进入长期记忆的，应该是可复用经验或稳定偏好。

---

### 误区四：不做压缩和过期

短期记忆也会污染上下文。

旧观察、旧错误、过期计划如果一直保留，会误导 Agent。

所以短期记忆需要生命周期管理。

---

## 面试加分答案

如果面试官问：

> Short-Term Memory 是什么？

可以这样回答：

```text
Short-Term Memory 是 Agent 在当前任务或当前会话中临时保留的信息，用来支撑多步骤执行。它包括当前目标、临时约束、当前计划、最近工具返回、环境观察、中间结论和待确认事项。

它和 Context 不一样。Context 是本次模型调用实际能看到的信息，Short-Term Memory 是 Runtime 暂存的任务信息池，Context Manager 会从里面选择当前步骤需要的部分放入上下文。

它和 Long-Term Memory 也不同。Long-Term Memory 是跨任务沉淀的经验、偏好和项目规则；Short-Term Memory 通常只在当前任务有效，任务结束后大部分可以丢弃。

在工程上，我会让 Agent Runtime 管理短期记忆，并做结构化记录、摘要压缩和过期清理。AI Coding 场景里，它记录当前 bug、已修改文件、测试失败和下一步计划；Browser Use 和 Computer Use 场景里，它记录页面状态、操作结果和环境变化；MCP、A2A、ACP 场景里，它记录工具调用、协作进度和应用反馈。

所以 Short-Term Memory 的核心价值，是让 Agent 在一个多步骤任务中不失忆，能持续、稳定地把任务推进下去。
```

---

## 一句话总结

Short-Term Memory 是 Agent 当前任务里的临时工作区，它让 Agent 在多步骤执行中记住目标、计划、工具结果和环境反馈，但不负责长期经验沉淀。
