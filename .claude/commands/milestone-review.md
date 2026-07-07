---
description: 里程碑收口：质量门 + reviewer 深审 + 手测清单 + STATE 更新 + git tag
argument-hint: 里程碑编号，如 M1
---

收口里程碑：$ARGUMENTS

1. 对照 `docs/PLAN.md` §9 该里程碑的"交付范围"和"验收标准"，列出逐项自查表（完成/未完成）。有未完成项先报给 gary：是补完再收口，还是降级顺延。
2. 亲自跑 `pnpm check`，全绿才继续。
3. 派 reviewer：diff 范围 = 上一个 tag..HEAD（M0 收口用仓库全量），附本期模块清单。等待分级 findings。
4. Blockers 全修（按 §6 路由派单或亲自修，修完重跑 pnpm check）；Shoulds 尽量修，修不完记 STATE；Nits 记 STATE。
5. 手测：按验收标准在 dev 环境实际走一遍学习者主路径（登录 → 今日任务 → 做一课 → 错题进复习），记录结果。
6. 更新 `docs/STATE.md`（本期完成/遗留/下期入口），conventional commit，`git tag $ARGUMENTS`。
7. 向 gary 汇报：验收标准逐项 ✓/✗ + reviewer 结论 + 遗留清单 + 下一里程碑第一步。若涉及部署到服务器，列出部署步骤等 gary 确认后才执行。
