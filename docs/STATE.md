# STATE — session 交接文档

> 每个 session 开局必读、收尾必更。只保留当前有效信息，历史看 git log。

更新时间：2026-07-07（M0 第一个 session 收尾）

## 当前里程碑

M0 骨架（进行中，前段完成）— 范围见 docs/PLAN.md §9

## 已完成

- 工程手册与 agent 套件、产品规格 PLAN v1.0
- git init + Next.js 16 脚手架（TS strict、Tailwind v4、standalone、basePath 按 `NEXT_BASE_PATH` env 注入）
- drizzle schema 15 表全落地 + 迁移 + lib/db.ts（WAL）；约定见 ADR-001
- 质量门 `pnpm check`（typecheck/lint/test/content:validate）全绿运行中；content zod schema 契约（lib/content/*）
- seed 幂等骨架：gary/learner 两账号 + approved-only 内容投影
- 三大题型引擎（主会话 TDD）：lib/tokenize.ts（缩写等价组/NFA 键入判定）+ lib/exercise-judge.ts（MCQ/cloze/改错含删除语义），60 测试，核心文件 100% 分支覆盖
- 内容管道全流程试跑：content_draft.md 契约 → drafter 起草 L01-L03 → auditor 逐题质检（三课均返工）→ 返工完成 → validate 全绿。**L01-L03 处于 draft，待 gary 终审**
- 服务器只读查验完成（gary 授权）：见"风险/待 gary 决策"与 ADR-002

## 进行中

- L01-L03 终审包已交 gary（见下），等 draft → approved（只有 gary 能改）

## 下一步（≤3 条，按优先级）

1. gary 终审 L01-L03 → approved 后跑 `pnpm content:tts`（需先实现 edge-tts 真身，现为占位）+ `pnpm seed`
2. M0 收口三件套：登录 SYS-1（两账号 JWT cookie）+ TTS 管道实现 + 最小课程页（语法讲解 → 25 题 → 句构关卡，attempts 落库）→ 跑 `/milestone-review` + `git tag M0`
3. ADR-002（宿主 nginx 部署方案）等 gary 批复；部署本身属 M1

## 风险 / 待 gary 决策

- **L01-L03 终审包**（gary 逐课过，审完把三课 9 个文件 frontmatter `status: draft` 改 `approved`）：
  - auditor 建议修未动，待 gary 拍板：L01-cloze-04（词汇联想偏题）、L03-cloze-05（like/love 唯一性）、L02 want to 词块密度、L01-correct-07 tokens 里顺带的三单 "eats"（漏网）、L01-s-16 改成了 be+open 状态句（drafter 自报语义微调）
  - drafter 自报存疑：L01-mcq-10（hard 副词表述）、L02-correct-03（give a gift to you 的另一修法引擎表达不了）
- **部署（M1）**：目标 `ziaoliu.io/english`；服务器已实测（OCI ARM 4C/24G、Ubuntu 22.04、docker 27、宿主 nginx 独占 80/443、/bridgesignal 先例 = basePath+容器 127.0.0.1:8090+nginx 反代；已占端口 8000/8080/8081/8090/8001/8444/3333，拟用 8091）。方案 ADR-002 待批；改 nginx conf 与部署动手前需 gary 明确放行
- edge-tts 非官方接口失效风险（PLAN §11-3，备胎 Piper）
- 内容审校节奏：gary 每天 2-3 课，从 M1 前一周开始
