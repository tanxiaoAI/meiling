---
name: "content-analysis"
description: "对单篇对标内容执行完整内容分析流程。用户提到对标内容分析、单篇内容分析、内容特征提取或重做内容分析时调用。"
---

# 对标内容分析

默认使用中文。

## 目标

按既有方法论完整拆解一篇对标内容，而不是只给一段主观点评。

## 先定位当前账号资料

1. 当前工作区默认是 `/workspace/users/<slug>`
2. 从当前工作区路径推导 `<slug>`
3. 方法论文档读取目录是 `/data/users/<slug>/methodology/active`
4. 对标内容和记录表从当前工作区读取

## 固定优先读取

- `/data/users/<slug>/methodology/active/02-业务方法论/内容分析方法论.md`
- `/data/users/<slug>/methodology/active/03-执行流程/内容分析流程.md`
- `/data/users/<slug>/methodology/active/04-提示词/内容分析-无数据提示词.md`
- `/data/users/<slug>/methodology/active/04-提示词/内容分析-数据修正后提示词.md`
- `/data/users/<slug>/methodology/active/04-提示词/内容分析-内容特征提取提示词.md`
- `/data/users/<slug>/methodology/active/04-提示词/内容分析-修正对比提示词.md`
- `/data/users/<slug>/methodology/active/04-提示词/内容特征自动录入提示词.md`
- `07-记录表/内容库.csv`

## 适用场景

- 用户要求分析一篇对标内容
- 用户要求更新某篇 `内容分析.md`
- 用户要求提取内容特征
- 用户要求生成修正对比

## 执行顺序

1. 先判断本轮分析的是哪个内容对象
2. 检查 `视频文案.md` 和上游依赖是否齐全
3. 生成 `内容分析初判.md`
4. 生成 `内容分析修正.md`
5. 生成 `内容分析.md`
6. 生成 `内容特征提取.md`
7. 用户明确要求时再生成 `修正对比.md`
8. 需要时回写内容库

## 输出要求

- 默认用简短勾选进度说明当前步骤
- 没定位到具体内容对象时不要硬做
- 不要把“看起来可能成立”写成“数据已经证明成立”
