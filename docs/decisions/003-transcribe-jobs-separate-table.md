# ADR-003: whisper 转写任务独立表，不复用 llm_jobs（占位）

- 日期：2026-07-07
- 状态：占位（M3 落地时定稿）— gary 2026-07-07 拍板方向
- 背景：`llm_jobs` 语义绑死"导出批改包 → cli 人工跑 → 回填"这条链路（`provider: api|file`、export md、result 有固定 zod schema）。whisper 是本地算力任务，无 export 路径，payload/result 形状完全不同；塞同表会逼 `/admin/llm-jobs/export` 学会过滤、把 result 的 zod union 撑松。
- 决定：M3 用独立表 `transcribe_jobs`（本地转写：材料对齐 + 录音可懂度）。把 job runner 的**共享部分**抽成通用模式——状态机（pending→running→done/failed）、重试、cron 扫描——两张表共用；**表结构与 provider 语义各自独立**。
- 代价与替代方案：两张 job 表 + 一层共享 runner 抽象，换 llm_jobs 的 zod schema 保持收紧、admin 导出路径不用分支。放弃"单表 union"（会让批改链路的类型契约变松，得不偿失）。
