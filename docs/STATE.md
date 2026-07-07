# STATE — session 交接文档

> 每个 session 开局必读、收尾必更。只保留当前有效信息，历史看 git log。

更新时间：2026-07-07（初始化）

## 当前里程碑

M0 骨架（未开始）— 范围见 docs/PLAN.md §9

## 已完成

- 工程手册与 agent 套件（CLAUDE.md、.claude/agents ×6、.claude/commands ×3）
- 产品规格 docs/PLAN.md v1.0

## 进行中

（无）

## 下一步（≤3 条，按优先级）

1. M0 第一步：`git init` + Next.js 脚手架（目录非空，见 CLAUDE.md §12）+ drizzle schema 全表（PLAN §6.3）+ `pnpm check` 四脚本建立
2. 三大题型引擎纯逻辑 + 测试（MCQ/填空/句构，先 lib 后 UI）
3. `/draft-lesson L01 L02 L03` 试跑内容管道

## 风险 / 待 gary 决策

- 服务器部署（PLAN §10）动手前需 gary 确认放行 80/443 与 docker 环境
- 内容审校节奏：gary 每天 2-3 课，从 M1 前一周开始
