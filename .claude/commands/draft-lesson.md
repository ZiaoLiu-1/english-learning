---
description: 起草一课内容并质检（content-drafter → validate → content-auditor → 汇总给 gary 终审）
argument-hint: 课程编号，如 L07 或 P03；可跟多个，空格分隔
---

起草课程：$ARGUMENTS

0. 确认 `content/prompts/content_draft.md` 存在；不存在则你（主会话）先按 PLAN §7 创建它（含输出 JSON schema 与质量要求），这是 drafter 的输入契约。
1. 检查 `content/` 中该课是否已存在：已 approved → 停止并报告（改已审内容需 gary 明示）；存在 draft → 询问 gary 是重写还是继续。
2. 对每个编号依次（不并行——content/ 同时只允许一个 agent）派 content-drafter，一次一课。
3. 每课回收：确认只新增了该课文件（`git status` 核对）→ 亲自跑 `pnpm content:validate`。
4. 全部起草完后，派 content-auditor 一次性质检本批（≤5 课）。
5. 汇总给 gary 的终审包：
   - 每课文件路径
   - auditor 的"必须修"清单（若有，先让 drafter 返工修完再进终审包）
   - drafter 自报的"最没把握的 3 处"
   - 提醒：审完请把 frontmatter `status: draft` 改为 `approved`（只有你能改），然后我跑 `pnpm content:tts && pnpm seed`。
6. 不 commit 内容文件，直到 gary 审完 approved（draft 状态可以 commit，标注 wip: content）。
