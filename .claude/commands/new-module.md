---
description: 按 PLAN 规格开发一个功能模块（派单给 implementer/ui-builder 并走完整回收协议）
argument-hint: 模块编号，如 LIST-2 或 GRAM-4
---

开发模块：$ARGUMENTS

严格按以下步骤执行（CLAUDE.md §6-§7 是本命令的规则来源）：

1. 从 `docs/PLAN.md` §4 定位 $ARGUMENTS 的优先级与所属模块，抄出 §5 对应小节的完整规格。
2. 判断路由：涉及 schema/核心算法（lib 四件套）→ 你亲自做，不派单；纯逻辑+API → implementer；纯页面 → ui-builder；两者都有 → 先 implementer（逻辑+API+测试），回收后再 ui-builder（页面）。
3. 写六段式派单（目标/规格/可改路径/禁改/完成定义/回报格式），规格段必须把 PLAN 原文关键约束抄进去，不许只给章节号。
4. 派出 agent，等待回报。
5. 回收协议三步：`git diff --stat` 逐文件审 → 亲自跑 `pnpm check` → 违规 revert 重派或自修。
6. 通过后 conventional commit，并把该模块在 `docs/STATE.md` 标记完成。
7. 向 gary 汇报：一句话结果 + 手测入口（URL 路径）+ 遗留项。
