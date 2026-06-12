---
name: "self-content-analysis"
description: "对我方单篇内容执行完整复盘分析流程。用户提到我方内容分析、单篇复盘、修正对比或我方内容特征提取时调用。"
---

# 我方内容分析

默认使用中文。

## 目标

对我方已发布或已产出的单篇内容做结构化复盘，并把结果回写到对应文件。

## 先定位当前账号资料

1. 当前工作区默认是 `/workspace/users/<slug>`
2. 从当前工作区路径推导 `<slug>`
3. 方法论文档读取目录是 `/data/users/<slug>/methodology/active`
4. 我方资料和记录表从当前工作区读取

## 固定优先读取

- `/data/users/<slug>/methodology/active/02-业务方法论/内容分析方法论.md`
- `/data/users/<slug>/methodology/active/02-业务方法论/数据分析方法论.md`
- `/data/users/<slug>/methodology/active/03-执行流程/我方内容分析流程.md`
- `/data/users/<slug>/methodology/active/04-提示词/内容分析-无数据提示词.md`
- `/data/users/<slug>/methodology/active/04-提示词/内容分析-数据修正后提示词.md`
- `/data/users/<slug>/methodology/active/04-提示词/内容分析-修正对比提示词.md`
- `/data/users/<slug>/methodology/active/04-提示词/内容分析-内容特征提取提示词.md`
- `/data/users/<slug>/methodology/active/04-提示词/内容特征自动录入提示词.md`
- `07-记录表/我方内容库.csv`

## 适用场景

- 用户要求做我方单篇内容复盘
- 用户要求更新我方内容分析结果
- 用户要求生成修正对比或提取我方内容特征

## 执行顺序

1. 判断本轮是首次分析、承接继续还是局部重做
2. 在 `我方内容库.csv` 中定位目标内容
3. 读取终稿、发布数据和上游文件
4. 生成无数据分析
5. 生成数据修正后分析
6. 按需生成修正对比
7. 提取内容特征并在需要时录入特征库
8. 回写对应记录

## 输出要求

- 不要跳过内容对象定位
- 没有终稿或基础数据时先说明缺口
- 默认给进度和下一步，不直接铺满内部推理
