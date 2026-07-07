# STATE — session 交接文档

> 每个 session 开局必读、收尾必更。只保留当前有效信息，历史看 git log。

更新时间：2026-07-07（M0 session 1：骨架+引擎+L01-L03 approved 入库）

## 当前里程碑

M0 骨架（进行中，前段完成）— 范围见 docs/PLAN.md §9

## 已完成

- 工程手册与 agent 套件、产品规格 PLAN v1.0
- git init + Next.js 16 脚手架（TS strict、Tailwind v4、standalone、basePath 按 `NEXT_BASE_PATH` env 注入）
- drizzle schema 15 表全落地 + 迁移 + lib/db.ts（WAL）；约定见 ADR-001
- 质量门 `pnpm check`（typecheck/lint/test/content:validate）全绿运行中；content zod schema 契约（lib/content/*）
- seed 幂等骨架：gary/learner 两账号 + approved-only 内容投影
- 三大题型引擎（主会话 TDD）：lib/tokenize.ts（缩写等价组/NFA 键入判定）+ lib/exercise-judge.ts（MCQ/cloze/改错含删除语义），60 测试，核心文件 100% 分支覆盖
- 内容管道全流程闭环：contract → drafter 起草 L01-L03 → auditor 质检（三课返工）→ 返工 → **gary 终审（5 项修复）→ approved → seed 入库**（3 语法点/75 题/54 句在 DB）
- 服务器只读查验完成；**ADR-002 已批**（宿主 nginx 方案 + 3 执行条件：25m body、audio 走 nginx alias、whisper 异步）

## 进行中

（无）

## 下一步（≤3 条，按优先级）

1. M0 收口三件套（gary 确认不扩）：登录 SYS-1（两账号 JWT cookie）+ TTS 管道真身（edge-tts 替换 gen_tts 占位）+ 最小课程页（讲解 → 25 题 → 句构关卡，attempts 落库）
2. M0 验收：本地完整学完一课留下 attempts 记录 → `/milestone-review` + `git tag M0`
3. L04-L07 起草排队（内容领先学习进度一周即可，别囤）

## 风险 / 待 gary 决策

- **部署（M1，方案已批 ADR-002）**：`ziaoliu.io/english`，照 /bridgesignal 模式（basePath 构建 + 容器 127.0.0.1:8091 + 宿主 nginx location）；执行条件：`client_max_body_size 25m`、`/english/audio/` 走 nginx alias、whisper 异步任务。改 nginx conf 与部署动手前需 gary 明确放行（红线不变）
- L02-correct-03 备忘：give you a gift 这一等价修法引擎表达不了（token 移动），已按唯一可表达解上线，遇学习者困惑再议
- edge-tts 非官方接口失效风险（PLAN §11-3，备胎 Piper）
- 内容审校节奏：gary 每天 2-3 课，从 M1 前一周开始
