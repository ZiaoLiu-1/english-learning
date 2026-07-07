# ADR-001: 确立 SQLite schema 具体化约定

- 日期：2026-07-07
- 状态：提议
- 背景：PLAN §6.3 是摘要，落地需要定死 JSON/时间/引用/幂等的表示法。
- 决定：JSON 列 = text+json mode；瞬时时间 = epoch 秒，日粒度（srs.due、plans.date）= ISO 日期文本；标量外键存行 id，内容内嵌引用数组存稳定 code（`prereq_codes`、`gp_codes`）；`exercises.uid`/`sentences.uid` 为内容自然键（seed upsert 冲突目标）；ECDICT 放独立 `data/dict.db` 只读附库，不进主库。
- 代价与替代方案：code 引用牺牲一点关联完整性，换 seed 单遍幂等；dict 独立库多一个文件，换主库备份不背 77 万词条（~200MB）。
