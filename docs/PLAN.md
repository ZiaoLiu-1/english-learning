# 英语自学平台 Working Plan

> 面向对象：单词量尚可、语法几乎为零、发音差且不识音标的成年初学者
> 决策已确认：自建轻量平台 · Next.js + SQLite · LLM 批改（API 或 claude cli/codex 文件模式）· 部署到私人服务器 150.230.24.148
> 版本：v1.0 · 2026-07-07

---

## 0. 一页概览（TL;DR）

- **不做背单词 App**。平台围绕四条主线：**语法体系（42 课）→ 连词成句刻意练习 → 听力精听/听写 → 音标与跟读**，外加每日造句 + LLM 中文批改闭环。
- **核心机制**：诊断定级 → 每天自动生成任务清单（约 150 分钟）→ 所有错误进错题本并挂到对应语法点 → SM-2 间隔复习 → 每周日测验出周报。
- **技术**：Next.js（App Router, TS）+ SQLite（Drizzle）+ edge-tts 预生成音频 + faster-whisper 字幕/转写 + 自建 LanguageTool，docker compose 部署到你的服务器，Caddy 自动 HTTPS。
- **内容来源**：语法课与题库由 LLM 起草 + 你审校（版权干净）；听力素材用 VOA Learning English（美国政府作品，公有领域）；例句参考 Tatoeba（CC-BY）；词典用 ECDICT 本地库。
- **开发节奏**：3~4 天出可学习的 M0，第 2 周末上线 MVP 让朋友开始学；此后内容保持领先学习进度一周。
- **诚实预期**：8 周高强度（每天 2.5-3h）可以达成「日常交流听得懂、说得清、无严重语法错误」（约 B1+ / 雅思 5.5-6.0）。**雅思全 7 需要在此基础上再练 3-5 个月**，平台已为后续阶段留好扩展位。

---

## 1. 用户画像、目标与现实预期

### 1.1 学习者画像

| 维度 | 现状 | 对产品的含义 |
|---|---|---|
| 词汇 | 有一定存量（估 2000-4000 认读词） | 词汇模块降为辅助功能，不做主线 |
| 语法 | 无法写出一段无错误的话，估 A1-A2 | 语法是第一主线，从句子骨架教起 |
| 发音 | 发音差、完全不识音标 | 需要从零的音标课 + 听辨训练 + 跟读 |
| 听力 | 未知，按初级假设 | 从慢速材料（VOA Level 1 / Let's Learn English）起步 |
| 母语 | 中文 | 全部讲解用中文；专设"中式英语"对照专题 |
| 时间 | 目标 1-2 个月见效 | 每日任务默认 150 分钟，可调 |

### 1.2 目标拆解（诚实版）

剑桥官方研究的常用估算是：**CEFR 每升一级约需 180-260 小时有效学习**。朋友现状约 A2，雅思 7 约等于 C1，中间隔着 B1、B2 两整级，合计约 600-800 小时。8 周 × 每天 3h ≈ 180 小时——所以「2 个月到全 7」在数字上不成立，把它设成硬目标只会带来挫败感。

更合理的分段目标（本平台按此设计）：

| 阶段 | 时间 | 目标 | 可验证标准 |
|---|---|---|---|
| P1 打地基 | 第 1-8 周（本计划） | 日常交流听懂、讲清、**无严重语法错误**；识读全部音标 | 平台第 8 周全真自测：语法 ≥85%，慢速听力听写 ≥80%，3 分钟自述无时态/主谓/成句类硬伤 |
| P2 冲 6.5 | 第 3-5 个月 | 常速听力、成段表达、写作 250 词 | 剑桥真题模考 6.0-6.5 |
| P3 冲 7 | 第 6-8 个月 | 精确度与地道度打磨 | 真题模考稳定 6.5-7 |

**本文档的全部功能围绕 P1 设计，但数据模型和课程结构为 P2/P3 预留扩展**（见 §5B 阶段 5 占位、§8 结尾）。

---

## 2. 调研结论：为什么自建

| 项目 | 亮点 | 为什么不直接用 |
|---|---|---|
| [earthworm](https://github.com/cuixueshe/earthworm)（MIT，≈8.7k★） | 连词成句玩法直击"无法成句"痛点，游戏化好 | 只有句构一种玩法；无语法讲解、无听力、无音标；Nuxt+NestJS+Postgres+Redis+Logto 自部署重，issue 中部署报错常见 |
| [Enjoy App](https://github.com/ZuodaoTech/everyone-can-use-english)（人人都能用英语） | 跟读、录音对比、听力素材管理成熟 | Electron 桌面应用而非网页平台；无语法体系；不可整合进我们的学习闭环 |
| LibreLingo（AGPL） | Duolingo 式开源框架 | 偏词汇/短语卡片，语法讲解能力弱，社区近年不活跃 |
| Lute / LinguaCafe / LWT | 自托管阅读器，点词查询好 | 纯阅读向，与语法+听说目标不匹配 |
| 各类 AI tutor demo（Streamlit 等） | 有 LLM 批改思路可借鉴 | demo 级，无课程体系与进度管理 |

**结论**：无一覆盖「语法体系 + 听力 + 音标」三主线 → 自建。**借鉴**：earthworm 的句构交互与提示节奏（MIT 允许参考实现）、Enjoy 的"录音-回放-对比"跟读流。

## 3. 产品核心设计：每日学习闭环

```
诊断测试(一次) ──► 生成个人起点
                     │
        ┌────────────▼─────────────┐
        │   每日计划生成器 (~150min) │◄──── 弱项标签 / SRS 到期数 / 周数
        └────────────┬─────────────┘
   ┌─────────┬───────┼─────────┬──────────┬─────────┐
   ▼         ▼       ▼         ▼          ▼         ▼
 SRS复习   音标课   语法新课   连词成句    听力精听   每日造句3句
 15min    15min    30min     20min      45min     15min
   │         │       │         │          │         │
   └─────────┴───────┴────┬────┴──────────┴─────────┘
                          ▼
              错误 ──► 错题本(挂语法点) ──► 进入 SRS 队列
                          │
              周日 ──► 周测 ──► LLM 周报(中文点评+下周侧重)
```

设计原则：
1. **打开即学**：每天登录只看到"今日任务"一列卡片，不需要自己决定学什么。
2. **所有错误都有去处**：任何题型的错误自动关联语法点/音素，进入错题本与复习队列，杜绝"错过就忘"。
3. **输入输出配平**：每天必有输出任务（造句/跟读），且 24h 内必得到中文批改反馈。
4. **中文讲解、英文操练**：讲解、错误解释、周报全中文；练习材料全英文。

## 4. 功能清单总表

优先级定义：P0 = MVP 必须（第 2 周末上线）；P1 = 前 4 周内补齐；P2 = 有余力再做。

| 编号 | 模块 | 功能 | 优先级 |
|---|---|---|---|
| PHON-1 | 音标 | 41 音素课程（美式，中文讲解+发音要领+示例词） | P0 |
| PHON-2 | 音标 | 最小对立体听辨训练（ship/sheep 二选一游戏） | P0 |
| PHON-3 | 音标 | 单词→音标标注（全站词典联动） | P0 |
| PHON-4 | 音标 | 跟读录音对比（波形+回放） | P1 |
| PHON-5 | 音标 | 连读/弱读/重音专题课 | P1 |
| PHON-6 | 音标 | 口型/舌位示意图 | P2 |
| GRAM-1 | 语法 | 42 课语法课程（4 阶段，中文讲解+中式英语对照） | P0 |
| GRAM-2 | 语法 | 五种题型引擎（选择/填空/改错/排序/翻译） | P0（翻译题 P1） |
| GRAM-3 | 语法 | 语法点知识图谱页（进度可视化） | P1 |
| GRAM-4 | 语法 | 错题本（按语法点聚合） | P0 |
| SENT-1 | 句构 | 连词成句练习（earthworm 式，键入+点选双模式） | P0 |
| SENT-2 | 句构 | 课程包（与语法课同步的句构关卡） | P0 |
| SENT-3 | 句构 | 提示体系（中文意→首词→逐词）与连击反馈 | P1 |
| LIST-1 | 听力 | 素材库（VOA 抓取管道 + 分级） | P0 |
| LIST-2 | 听力 | 精听听写（逐句播放≤3遍，词级 diff 高亮） | P0 |
| LIST-3 | 听力 | 泛听播放器（0.5-1.5x 变速、逐句字幕、点词查询） | P1 |
| LIST-4 | 听力 | 影子跟读模式（句级循环+录音） | P1 |
| SPK-1 | 输出 | 每日造句任务（3 句，绑定当日语法点） | P0 |
| SPK-2 | 输出 | LLM 批改闭环（API 模式 + claude cli/codex 文件模式） | P0 |
| SPK-3 | 输出 | LanguageTool 即时语法检查（写作输入框内） | P1 |
| SPK-4 | 输出 | 口语题库（雅思 Part1 风格 + 录音 + 转写批改） | P1 |
| SPK-5 | 输出 | AI 对话陪练（文字） | P2 |
| VOC-1 | 词汇 | ECDICT 本地词典 + 全站点词查询 | P0 |
| VOC-2 | 词汇 | 生词本 + SRS（辅助，非主线） | P1 |
| CORE-1 | 管理 | 诊断测试与定级 | P0 |
| CORE-2 | 管理 | 每日计划生成器 + 打卡/streak | P0 |
| CORE-3 | 管理 | SM-2 间隔复习引擎（统一队列） | P0 |
| CORE-4 | 管理 | 周测 + LLM 周报 | P1 |
| CORE-5 | 管理 | 学习统计（时长/正确率/热力图/弱项雷达） | P1 |
| CORE-6 | 管理 | 8 周课表视图（进度对照） | P1 |
| SYS-1 | 系统 | 登录（两账号：你+朋友），角色区分 admin/learner | P0 |
| SYS-2 | 系统 | TTS 音频管道（edge-tts 预生成 + 缓存） | P0 |
| SYS-3 | 系统 | 移动端适配 + PWA（手机可用，音频离线缓存） | P1 |
| SYS-4 | 系统 | 管理后台（内容导入、LLM 任务导出/回填、数据备份） | P0（最简版） |
| SYS-5 | 系统 | 通知（每日提醒 / 周报推送，Telegram Bot） | P2 |

## 5. 模块详细设计

### 5A. 音标与发音（PHON）

**目标**：3 周内做到"看到音标能读、听到能辨"，第 4 周起进入连读弱读；不追求音素级 AI 纠音（开源方案不可靠，见 §11 风险 4），主打**听辨 + 跟读对比 + 可懂度评分**。

**PHON-1 音素课程**
- 41 个美式音素（含 r 化音），分 11 课，完整清单见附录 A。（常说的"48 音标"是英式清单；本平台采用美式体系，如实按 41 个教，避免她学到用不上的音。）
- 每课结构（内容存 `content/phonics/*.md` + frontmatter）：
  1. 中文发音要领（口型、舌位、与拼音的对照和区别，如 /θ/ ≠ s：舌尖轻咬）
  2. 3 个示例词（音频 + 音标 + 中文）
  3. 5 组最小对立体（音频对比）
  4. 10 题听辨练习（PHON-2 引擎）
  5. 5 个跟读句（P1 后带录音）
- 音频实现：edge-tts 批量生成单词/句子 mp3（`en-US-JennyNeural`），构建期脚本产出，存 `/data/audio/phonics/`；音素单独发音采用 TTS 读示例词 + 截取，或录制/使用公有领域 IPA 音频（Wikimedia IPA 音源多为 CC，需逐个确认后再用，MVP 用示例词方案即可）。

**PHON-2 最小对立体听辨**
- 交互：播放音频 → 二选一点击（ship / sheep）→ 即时反馈 + 连击计数；每轮 10 题 90 秒内。
- 数据：`exercises.type = 'minimal_pair'`，payload `{audio, options:[w1,w2], answer}`。
- 题库：为中文学习者高频混淆对预置约 30 组 × 每组多词对（/ɪ-iː/、/æ-e/、/θ-s/、/ð-z/、/v-w/、/n-l/、/oʊ-ɔː/、尾辅音有无），LLM 起草 + 你审校 + TTS 生成。

**PHON-3 全站音标标注**
- ECDICT 含音标字段；缺失时用 CMU Pronouncing Dictionary（ARPABET）经映射表转 IPA 兜底。
- 全站任何英文单词长按/点击弹出：音标 + 发音按钮（TTS）+ 中文释义 + "加入生词本"。

**PHON-4 跟读录音对比**
- 交互：听原句 → 按住录音（MediaRecorder API）→ 并排显示原句/自己录音的波形（wavesurfer.js）→ 可逐个回放对比 → 自评 1-3 星 + 系统"可懂度分"。
- 可懂度分（T0 实现）：浏览器 SpeechRecognition（Chrome）把录音实时转文字，与目标句做词级匹配率；T1 升级为服务器 faster-whisper 转写（见 §6.5）。明确告知用户这是"机器能否听懂你"的分数，不是发音打分。

**PHON-5 连读/弱读/重音专题**（第 3-4 周解锁）
- 6 节课：单词重音规则、句子重音、弱读 (to/for/and/can)、连读 (辅+元)、失爆、语调。素材直接用 LIST 模块的 VOA 句子标注版。

### 5B. 语法课程（GRAM）——第一主线

**GRAM-1 课程体系：4 阶段 42 课**

每课固定结构：`中文讲解(500字内) → 10 个对照例句(音频) → 常见中式英语错误 2-3 条 → 练习 20-30 题 → 关联句构关卡`。讲解写法原则：不用术语堆砌，每个规则必配"中文思维 vs 英文思维"对照。

**阶段 1 · 句子的骨架（第 1-2 周，L1-L14）**

| # | 语法点 | 专治的典型错误 |
|---|---|---|
| L1 | 词性总览与句子成分 | 不知道词有类别、词序全凭感觉 |
| L2 | 五大基本句型 SV/SVO/SVC/SVOO/SVOC | 中文流水句直译 |
| L3 | be 动词 vs 实义动词 | *I am agree / I very happy* |
| L4 | 一般现在时与三单 -s | *He go to work* |
| L5 | 名词单复数与可数性 | *many money, two book* |
| L6 | 冠词 a/an/the 入门 | 全句丢冠词 |
| L7 | 人称代词与物主代词 | *me is / he's book* |
| L8 | 一般过去时（规则+高频不规则） | *Yesterday I go* |
| L9 | 现在进行时 | 与一般现在混用 |
| L10 | 否定句与 do/does/did | *I not like* |
| L11 | 疑问句构成（yes-no / wh-） | *Why you say that?* |
| L12 | there be 句型 | *There have many people* |
| L13 | 时间地点介词 in/on/at | 介词乱配 |
| L14 | 并列连词 and/but/or/so/because | *Because..., so...* 连用 |

**阶段 2 · 表达的扩展（第 3-4 周，L15-L28）**

| # | 语法点 | # | 语法点 |
|---|---|---|---|
| L15 | will / be going to | L22 | much/many/a few/a little |
| L16 | 现在完成时入门 | L23 | 祈使句 |
| L17 | 过去进行时 | L24 | like doing / want to do（动名词vs不定式基础） |
| L18 | 情态动词 can/could/may/must/should/have to | L25 | 宾语从句（重点：陈述语序！） |
| L19 | 频度副词及其位置 | L26 | 时间状语从句 when/while/before/after |
| L20 | 比较级与最高级 | L27 | 形容词 vs 副词（*speak English good*） |
| L21 | some/any/no/every 及复合词 | L28 | It 形式主语（It's important to...） |

**阶段 3 · 复杂句与地道化（第 5-6 周，L29-L38）**

| # | 语法点 | # | 语法点 |
|---|---|---|---|
| L29 | 定语从句 who/which/that | L34 | 条件句 1 类（if + 现在时） |
| L30 | 现在完成 vs 一般过去（对比专课） | L35 | 条件句 2 类（虚拟入门） |
| L31 | 现在完成进行时 | L36 | 间接引语（陈述句） |
| L32 | 过去完成时（讲故事用） | L37 | 使役 make/let/have + 感官动词 see sb do/doing |
| L33 | 被动语态（一般时态） | L38 | run-on 句与标点（*I like it, it is good*） |

**阶段 4 · 输出巩固（第 7-8 周，L39-L42）**

| # | 内容 |
|---|---|
| L39 | 中式英语总对照专题（附录 B Top20 全部过一遍） |
| L40 | 口语功能句型包：观点/经历/比较/建议/澄清 |
| L41 | 段落写作：主题句 + 连接词 + 3-5 句支撑 |
| L42 | 总复习与错题清零策略课 |

（**阶段 5 占位**：B2 语法——非谓语进阶、倒装强调、条件 3 类、名词性从句全家桶——数据结构同构，P2 之后按同一管道生产，服务雅思 6.5-7 阶段。）

**GRAM-2 题型引擎**（全部前端组件 + 统一提交接口 `/api/exercises/submit`）

| 题型 | 判定实现 | 备注 |
|---|---|---|
| 单选 MCQ | 精确匹配 | 每题必带 `explain_zh`（为什么对/为什么错） |
| 填空 cloze | 归一化后匹配（小写、去首尾空格、可接受答案数组，如 don't = do not） | 支持动词变位多空 |
| 改错 | 点击标错词 → 输入修正；两段判定（找对位置 + 改对内容），各占 50% | 题源=中式英语真实错误 |
| 排序连词成句 | 与 SENT 引擎共用（见 5C） | |
| 中译英 | 有参考答案集 + LanguageTool 检查 + 可选转入 LLM 批改队列 | P1；MVP 阶段此题型只做"看参考答案自评对/错" |

**GRAM-4 错题本**
- 任何 `attempts.correct = false` 自动入库，按语法点聚合展示：`L4 三单 -s（错 7 次，最近 3 天 2 次）`。
- 每个错题生成一张 SRS 卡（去重：同一题 24h 内多次错只一张）。
- "清零挑战"：连续两次复习正确即从错题本移出（SRS 卡保留继续拉长间隔）。

### 5C. 连词成句（SENT）——把语法变成肌肉记忆

**玩法**（借鉴 earthworm，针对语法学习强化）：
1. 屏幕显示中文句意：「他昨天没有去上班。」
2. 学习者**键入**英文（主模式，练拼写与成句）或**点选乱序词块**（易模式，手机端默认）。
3. 逐词校验：打对一个词立即亮绿并播放该词读音；卡壳 5 秒自动给下一词首字母，再 5 秒给整词（记一次提示）。
4. 整句完成 → 播放整句 TTS → 显示语法点标签（`一般过去时否定` 可点击跳讲解）→ 下一句。
5. 连击/进度条/每关 10 句的节奏反馈（游戏化保留但克制）。

**与语法课的绑定**：每课语法配一个 15-20 句的句构关卡（`sentences.gp_ids` 关联），当天语法学什么就成句什么——这是"讲解→内化"的核心转换器。

**判定实现**：
- `sentences.tokens_json` 存标准分词（含缩写等价：`don't` ↔ `do not` 记录在 alt 数组）。
- 键入模式逐 token 前缀匹配，大小写不敏感，标点自动补。
- 复现算法：答错/用提示 ≥2 次的句子记入"生句列表"，next day 计划自动插入重练；连续 2 天全对转入 SRS 长间隔。

**内容量**：42 关卡 × 18 句 ≈ 750 句 + 300 高频日常句 ≈ **1050 句**。生产管道见 §7。

### 5D. 听力训练（LIST）

**素材策略（全部免版权）**

| 级别 | 素材 | 说明 |
|---|---|---|
| 入门（W1-2） | VOA **Let's Learn English** Level 1（52 课情景对话） | 有官方文本，语速极慢，正好配阶段 1 语法 |
| 初级（W3-5） | VOA Learning English **Level One / As It Is**（约 1500 核心词表，2/3 语速） | mp3 + 全文对照 |
| 进阶（W6-8） | VOA 常速新闻短篇 + LLE Level 2 | 让耳朵先于口碰到常速 |

VOA 为美国政府作品，公有领域，可下载、切分、改编（页面注明来源即可，礼貌做法）。

**LIST-1 素材管道**（`scripts/fetch_voa.py`）
1. 按栏目 RSS/列表页抓取文章 → 解析出 mp3 URL + 正文文本（requests + bs4）。
2. 下载 mp3 至 `/data/audio/voa/`，正文清洗为纯文本。
3. **faster-whisper（small, int8, CPU）跑一遍生成词级时间戳**，与官方文本对齐（官方文本为准，whisper 只取时间戳），切成句级 segments 存 `materials.transcript_json`。
4. 计算词数/时长/生词率（对照朋友已学词表）自动定级入库。
5. cron 每周日抓新素材；管理后台可手动导入任意 mp3+文本（比如她喜欢的美剧片段——注意仅自用，不分发）。

**LIST-2 精听听写（每天的硬菜，30 分钟）**
- 流程：选当日材料（计划器指派，2-4 分钟一篇）→ 逐句播放（空格键重播，每句最多 3 遍）→ 键入听到的句子 → 提交后词级 diff 高亮：**绿=对、黄=错词、红=漏词、灰=多词** → 显示原文+中文参考翻译 → 下一句。
- diff 实现：双方分词归一化（小写、去标点、缩写展开对照表）→ 词级 Levenshtein 对齐（动态规划回溯出 ops）→ 渲染；得分 = 对齐正确词 / 原文词数。
- 错误联动：听错的词若属于弱读/连读现象，自动标注「连读：want to→wanna」并计入 PHON-5 弱项。
- 数据：`dictation_logs` 存每句 diff 结果，周报统计"听力薄弱音素/词频段"。

**LIST-3 泛听播放器**
- 变速 0.5-1.5x（`audio.playbackRate`，preservesPitch）、句级字幕跟随（点句跳播）、点词查询（VOC-1）、单句 AB 循环。
- 每日泛听任务 = 当天精听材料的完整重听 + 1 篇新材料盲听。

**LIST-4 影子跟读（shadowing）**
- 句级循环播放 + 延迟 0.5s 自动录音，录完自动排下一句；一篇材料跟读完生成"原音/我的"交错回放轨。复用 PHON-4 的录音与可懂度组件。

### 5E. 输出与批改（SPK/WRITE）——每天必须开口、必须动笔

**SPK-1 每日造句**
- 每天 3 句，题目绑定当日语法点（如学了 L16 现在完成时：「用 have been to 造一句关于旅行的话」），输入框带 LanguageTool 即时下划线（P1）。
- 提交后进入 LLM 批改队列，**次日晨展示批改结果**（异步是刻意设计：写时不依赖 AI，先自己想）。

**SPK-2 LLM 批改闭环（双 Provider，核心设计）**

统一任务表 `llm_jobs {id, type, payload_json, provider, status: pending→exported→done, result_json}`，两种模式可随时切换：

*模式 A：API 直连*
- 服务端调 Anthropic API（claude-haiku 级即可），cron 每晚 23:00 批量处理当日 pending 任务，成本估 <$3/月（每天 ~10 个任务 × 1k tokens）。

*模式 B：文件模式（用你已有的 claude cli / codex，零 API 成本）*
1. 管理后台「导出批改包」→ 生成 `review_batch_2026-07-14.md`：内含固定 system prompt + 全部待批任务 + **要求输出严格 JSON** 的说明与 schema。
2. 你在自己电脑：`claude -p "$(cat review_batch_xxx.md)" > result.json`（或丢给 codex / 直接粘给任意 LLM）。
3. 后台「导入结果」上传 result.json → 校验 schema（zod）→ 逐条回填 `result_json` → 学习端自动出现批改。
4. 每晚一次，5 分钟人工成本；schema 校验失败的条目回退 pending 并提示重跑。

*批改输出 JSON schema（两种模式共用）*：
```json
{
  "job_id": 123,
  "original": "I have went to Beijing last year.",
  "corrected": "I went to Beijing last year.",
  "errors": [
    {"span": "have went", "type": "tense",
     "explain_zh": "有明确过去时间 last year 时用一般过去时，不用完成时；且 go 的过去分词是 gone。",
     "rule_ref": "L30"}
  ],
  "better_version": "I visited Beijing last year and loved it.",
  "score": 60
}
```
- `rule_ref` 直接挂语法点 → 错误自动进错题本与 SRS，这是批改和课程打通的关键。

**SPK-3 LanguageTool 即时检查**
- 自建 docker（`erikvl87/languagetool`），关掉外网依赖；前端输入框 800ms debounce 调 `/api/lt/check`（服务端代理），下划线渲染 + 中文化常见 rule 消息（维护一个 ruleId→中文 的映射表，覆盖 Top 50 规则即可）。
- 定位：写作时的"拼写+低级错误"第一道网；深度批改仍归 LLM。

**SPK-4 口语题库（P1，第 5 周解锁）**
- 30 个雅思 Part1 风格话题（家乡/工作/爱好…），每题：范例句型 3 个（音频）→ 学习者录音 45-60 秒 → whisper 转写 → 转写文本进 LLM 批改队列（type=speaking_review，批语法与表达，不批发音）→ 次日反馈。
- 发音反馈依靠：转写错词提示（机器都听不出来的词=可懂度问题）+ 自己回听。

**SPK-5 AI 对话陪练（P2）**：文字聊天，system prompt 限制 AI 用已学语法点范围内的简单英语回复并温和纠错。留到 P2 是因为对初学者，自由对话的收益低于结构化练习。

### 5F. 词汇辅助（VOC，非主线）

- **VOC-1**：ECDICT（skywind3000/ECDICT，77 万词条含音标/释义/词频标记；许可证以仓库为准）转 SQLite 表随应用分发；全站点词弹层：音标 + TTS + 释义 + 词频星级 + 例句（Tatoeba CC-BY，展示时带来源标注）。
- **VOC-2**：生词本手动添加（来自点词/听写错词自动建议），走统一 SRS 队列，每日上限 15 个新词——**刻意压低**，把时间留给语法和听力。

### 5G. 学习管理（CORE）

**CORE-1 诊断测试（注册后一次，40 分钟）**
- 40 题：语法 30（覆盖 42 课的抽样，自适应两轮：先 15 题定粗档，再 15 题在粗档附近加密）+ 听辨 5 + 音标认读 5。
- 输出：五维雷达（句法/时态/听辨/音标/词汇）+ 建议起点（如"语法从 L1 开始但 L5/L7 可跳过"）→ 写入 `users.settings_json.start_map`。

**CORE-2 每日计划生成器**（纯规则引擎，`lib/plan.ts`）
```
输入: 周数、SRS到期数、错题数、昨日完成率、弱项标签
输出: 任务卡序列，总时长逼近 target_minutes(默认150)
规则示例:
- SRS 到期 > 40 → 复习加到 25min，砍泛听
- 连续 2 天听写 < 70% → 当日听写材料降一级
- 音标课在 W1-3 每天必排；W4 起改为每周 2 次连读专题
- 昨日完成率 < 60% → 今日总量 × 0.8（防崩盘）
```
- 完成打卡 + streak + 每日结束页（今日数据 3 行总结）。

**CORE-3 SRS 引擎（SM-2）**
- 所有可复习对象统一成卡：`srs_cards(ref_type: gp|exercise|sentence|word|phoneme)`。
- SM-2 参数：EF 初始 2.5，间隔 1、6、interval×EF；答题质量 q 由结果映射（全对首试=5，对但用提示=4，二试对=3，错=1）；q<3 重置间隔并 lapses+1。
- 每日复习上限 60 卡，超出的顺延并在周报提示"复习债"。

**CORE-4 周测与周报（每周日）**
- 30-40 分钟固定卷：语法 20 题（本周点 70% + 往周 30%）+ 听写 5 句 + 造句 3 句 + 跟读 3 句。
- 客观题即时出分；主观题进 LLM 队列，周一晨出完整周报：`{各维度分数、与上周对比、Top3 弱项、下周侧重（写回计划器权重）、中文鼓励性点评}`。

**CORE-5 统计**：日历热力图（学习分钟）、语法点掌握矩阵（42 格红黄绿）、听写正确率趋势线、发音可懂度趋势。图表用 recharts。

**CORE-6 课表视图**：8 周课表（§8）渲染为进度对照页：计划 vs 实际，落后自动提示补课策略（优先砍新词、保语法+听写）。

### 5H. 系统（SYS）

- **SYS-1 账号**：两账号写死在 seed（admin=你 / learner=朋友），密码 bcrypt，JWT session cookie；admin 多出内容管理与 LLM 任务页。不做注册功能（省掉一堆安全面）。
- **SYS-2 TTS 管道**：构建/内容导入时批量 edge-tts 生成并落盘缓存（`/data/audio/tts/{sha1(text)}.mp3`）；运行时新文本走 `/api/tts` 即时生成+缓存；edge-tts 属非官方接口有失效风险 → 备胎：本地 Piper TTS（质量略降但完全离线）或浏览器 Web Speech API 实时朗读。
- **SYS-3 PWA**：manifest + service worker 缓存当日计划涉及的音频（她通勤可手机学）；响应式布局，句构点选模式为手机主交互。
- **SYS-4 管理后台**：内容 JSON 导入校验、素材抓取触发、LLM 批改包导出/导入、SQLite 一键备份下载。
- **SYS-5 通知（P2）**：Telegram Bot 每晚推"明日任务已生成 + 昨日批改已出"。

## 6. 技术架构

### 6.1 技术栈与理由

| 层 | 选型 | 理由 |
|---|---|---|
| 全栈框架 | Next.js 15（App Router、TypeScript、standalone 输出） | 单仓库单进程，前后端一把梭，部署最简 |
| UI | Tailwind CSS + shadcn/ui + lucide | 快速做出干净的学习界面；深色模式免费得 |
| 数据库 | SQLite（better-sqlite3）+ Drizzle ORM | 两个用户完全够；单文件即全部数据，备份=拷文件 |
| 状态 | React Server Components 为主 + zustand（练习会话内状态） | 练习引擎需要本地即时反馈 |
| 音频 | edge-tts（预生成）/ Piper（备）；wavesurfer.js（波形）；MediaRecorder（录音） | 全免费 |
| 语音识别 | 浏览器 SpeechRecognition（T0）→ faster-whisper small int8 容器（T1） | 分层实现，MVP 不阻塞 |
| 语法检查 | LanguageTool 自建容器 | LGPL，免费无限量 |
| LLM | Anthropic API（模式A）/ claude cli 文件批改（模式B） | 见 5E |
| 图表 | recharts | 够用 |
| 部署 | Docker Compose + Caddy（自动 HTTPS） | 你的服务器一条命令拉起 |

### 6.2 目录结构

```
english-platform/
├─ app/
│  ├─ (learn)/            # 学习端
│  │  ├─ today/           # 每日计划（首页）
│  │  ├─ phonics/[lesson]
│  │  ├─ grammar/[lesson]
│  │  ├─ sentence/[pack]
│  │  ├─ listening/[id]   # 精听/泛听/跟读三 tab
│  │  ├─ speak/           # 造句任务+口语题
│  │  ├─ review/          # SRS 队列 + 错题本
│  │  └─ stats/
│  ├─ admin/              # 内容导入/LLM任务/备份
│  └─ api/                # route handlers（见 6.4）
├─ lib/
│  ├─ srs.ts              # SM-2
│  ├─ diff.ts             # 听写词级对齐
│  ├─ plan.ts             # 每日计划规则引擎
│  ├─ tokenize.ts         # 句子分词/归一化/缩写表
│  └─ llm/{api.ts,filejob.ts,schema.ts}
├─ content/               # 全部课程内容（git 管理，可独立于代码迭代）
│  ├─ grammar/L01..L42.md # frontmatter: 元数据; 正文: 讲解
│  ├─ grammar/L01..L42.exercises.json
│  ├─ phonics/P01..P11.md + minimal_pairs.json
│  ├─ sentences/pack-L01..L42.json + daily-300.json
│  └─ prompts/{review.md, weekly_report.md, content_draft.md}
├─ scripts/
│  ├─ fetch_voa.py        # 素材抓取
│  ├─ whisper_align.py    # 时间戳与分句
│  ├─ gen_tts.ts          # 批量 TTS
│  ├─ import_ecdict.ts    # 词典导入
│  └─ seed.ts             # 内容+账号入库
├─ data/                  # volume: app.db + audio/（不进 git）
└─ docker/{compose.yml, Caddyfile}
```

### 6.3 数据模型（Drizzle schema 摘要）

```
users            id, name, pw_hash, role(admin|learner), settings_json
grammar_points   id, stage(1-4), ord, code(L1..L42), title_zh, explain_md,
                 pitfalls_md, prereq_ids
exercises        id, gp_id?, phoneme?, type(mcq|cloze|correct|order|translate|
                 minimal_pair|dictation), payload_json, answer_json,
                 explain_zh, difficulty(1-3), source
attempts         id, user_id, exercise_id, response_json, correct, used_hint,
                 ms_used, created_at
sentences        id, en, zh, tokens_json, alt_json, audio_path, gp_ids[],
                 pack_id, level
materials        id, kind(lle|voa1|voa_std|custom), title, level(1-3),
                 audio_path, transcript_json[{t0,t1,en,zh?}], duration_s,
                 word_count, published_at
dictation_logs   id, user_id, material_id, seg_idx, answer, diff_json, score
recordings       id, user_id, ref_type(sentence|material_seg|topic), ref_id,
                 audio_path, transcript, intelligibility, created_at
productions      id, user_id, kind(sentence|paragraph|speaking), prompt,
                 content, status(pending|reviewed), review_json, created_at
llm_jobs         id, type(sentence_review|speaking_review|weekly_report|final_report),
                 payload_json, provider(api|file), status, result_json,
                 created_at, done_at
srs_cards        id, user_id, ref_type, ref_id, ef, interval_d, due,
                 reps, lapses
wordbook         id, user_id, word, source_ref, note, created_at
daily_plans      id, user_id, date, items_json, done_json, minutes_actual
tests            id, user_id, kind(diagnostic|weekly|final), answers_json,
                 scores_json, report_md, created_at
events           id, user_id, type, meta_json, ts        # 统计打点
dict_ecdict      word, phonetic, translation, tags, bnc, frq   # 独立附表
```

### 6.4 API 设计（App Router route handlers）

```
POST /api/auth/login
GET  /api/plan/today                # 生成/读取当日计划
POST /api/plan/complete-item
GET  /api/srs/queue                 # 今日到期卡
POST /api/srs/answer                # {card_id, quality}
GET  /api/lessons/grammar/:code     # 讲解+题目
POST /api/exercises/submit          # 统一判定入口，写 attempts + 错题联动
GET  /api/sentences/pack/:id
POST /api/sentences/result          # 句构完成度/提示次数
GET  /api/materials?level=&kind=
POST /api/dictation/check           # {material_id, seg_idx, answer} → diff
POST /api/recordings                # multipart 上传，返回可懂度(T0在前端算,T1走此口)
POST /api/productions               # 造句/口语提交 → 建 llm_job
GET  /api/dict/:word                # ECDICT + CMU 兜底
GET  /api/tts?text=&voice=          # 缓存优先
POST /api/lt/check                  # LanguageTool 代理
GET  /api/stats/overview
--- admin ---
POST /api/admin/content/import      # zod 校验 JSON → 入库 + 触发 TTS
POST /api/admin/materials/fetch     # 触发 fetch_voa
GET  /api/admin/llm-jobs/export     # 生成批改包 md
POST /api/admin/llm-jobs/import     # 上传 result.json 回填
GET  /api/admin/backup              # 下载 app.db 快照
```

### 6.5 关键算法

**SM-2（lib/srs.ts）**
```ts
q = mapQuality(correct, usedHint, secondTry)   // 5/4/3/1
if (q < 3) { reps = 0; interval = 1; lapses++ }
else {
  interval = reps === 0 ? 1 : reps === 1 ? 6 : Math.round(interval * ef)
  reps++
}
ef = Math.max(1.3, ef + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
due = today + interval
```

**听写词级 diff（lib/diff.ts）**：`normalize(小写/去标点/缩写展开) → 词级编辑距离 DP → 回溯得 ops[equal|sub|del|ins] → 前端着色`；分数 = equal 数 / 原文词数。同义可接受词表（如数字 "two"/"2"）在 normalize 层处理。

**句构判定（lib/tokenize.ts)**：目标 tokens + alt 等价组；键入模式做逐 token 前缀匹配与自动空格；提示阶梯 5s/5s 由前端计时器驱动，`used_hint` 计数影响 SRS quality。

**可懂度（T0→T1）**：T0 = SpeechRecognition 转写与目标句 `diff.ts` 匹配率（仅 Chrome，明示局限）；T1 = 录音上传 → faster-whisper 容器（HTTP 微服务，`/transcribe`）→ 同一匹配率 + 语速(wpm) + 长停顿次数。**不做音素级打分**（理由见 §11-4）。

**计划生成（lib/plan.ts）**：纯函数 `(profile, srsDue, weekNo, yesterday) → PlanItem[]`，规则表驱动（见 5G），单元测试覆盖边界（复习积压、连败降级、周日测验日）。

## 7. 内容生产管道（决定成败的部分）

内容量盘点：语法讲解 42 篇、练习题 ~1100 题（42 课 × 25 + 诊断/周测卷）、句构 ~1050 句、音标 11 课 + 最小对 ~300 对、口语题 30 个。**纯手写不现实，纯 LLM 生成不放心 → 采用「LLM 起草 + 你审校 + 脚本校验」流水线**：

1. **起草**：`content/prompts/content_draft.md` 是给 claude cli 的模板——输入语法点编号与讲解要点（本文档 §5B 表格就是要点来源），要求输出符合 `exercises.schema.json` 的完整一课（讲解 md + 25 题 + 18 个句构句，全部带中文解释）。一次跑一课。
2. **审校**：你逐课过一遍（重点查：例句自然度、解释准确性、答案唯一性），预算 **每课 40-60 分钟，42 课 ≈ 35-40 小时**——这是整个项目最大的人力成本，必须排进里程碑（每天审 2-3 课，三周摊完）。
3. **校验**：`pnpm content:validate`——zod 校验 JSON schema、答案在选项中、填空可归一化命中、句构 tokens 与句子一致、音频文本非空。
4. **生成音频**：`pnpm content:tts` 扫描新内容批量 edge-tts，失败重试 + 报告。
5. **入库**：`pnpm seed`（幂等 upsert，内容可反复迭代）。

**版权红线**：讲解与题目全部原创（LLM 起草+人审即原创）；**不得**复制《English Grammar in Use》等版权教材的原文或成套题目（可参考其语法点顺序思想）；VOA 公有领域随便用；Tatoeba 例句用时保留 CC-BY 署名；ECDICT/CMUdict 按各自许可证随附声明文件。

## 8. 内置 8 周学习课表（产品直接照此排课）

每日模板（净学习约 140 分钟，目标档 150 含切换缓冲；计划器按 §5G 规则动态微调）：

```
15' SRS复习+错题  →  15' 音标(W1-3)/连读(W4起,隔天)  →  30' 语法新课
→  20' 连词成句关卡  →  30' 精听听写  →  15' 泛听/跟读  →  15' 造句3句
（周日不学新课：40' 周测 + 复盘）
```

| 周 | 音标 | 语法 | 听力 | 输出 | 周末验收标准 |
|---|---|---|---|---|---|
| W1 | P01-P04（15 音素） | L1-L7 | LLE L1-7 精听 | 每日 3 句（简单陈述句） | 能读 15 音素；五大句型选择题 ≥80% |
| W2 | P05-P08（累计 31） | L8-L14 | LLE L8-14 + 听写起步 | 加入过去时叙事句 | 听写慢速 ≥70%；一般过去时改错 ≥75% |
| W3 | P09-P11（41 全）+ 复习 | L15-L21 | VOA L1 短文精听 | 情态/将来时造句 | 全音标认读测验 ≥90%；最小对听辨 ≥85% |
| W4 | 连读弱读×2 | L22-L28 | VOA L1 + 泛听加量 | 宾语从句造句（重点纠语序） | **期中诊断**：语法 ≥75%，听写 ≥75% |
| W5 | 连读弱读×2 | L29-L34 | 首次常速短篇尝试 | 口语 Part1 ×5 题录音 | 定语从句/完成过去对比 ≥70%；口语转写可懂度 ≥80% |
| W6 | 语调专题 | L35-L38 | 常速+慢速混合 | Part1 ×5 + 段落写作 ×2 | 被动/条件句 ≥75%；段落经 LLM 批改无"严重错误"标记 |
| W7 | 弱项定制 | L39-L40 + 错题清零周 | 精听换新题材 | Part1 累计 20 题；每日段落 | 错题本存量 <30；3 分钟自述录音时态一致 |
| W8 | 弱项定制 | L41-L42 + 总复习 | 全真混合卷 | 模拟口语全流程 | **全真自测**：语法 ≥85%、听写 ≥80%、自述无硬伤 → P1 目标达成 |

第 8 周结束动作：平台生成《总结报告 + P2 阶段（冲 6.5）三个月方案》（LLM 周报管道复用，type=final_report）。

## 9. 开发里程碑（内容审校与编码并行）

| 里程碑 | 时间 | 交付范围 | 验收标准 |
|---|---|---|---|
| **M0 骨架** | D1-D4 | 脚手架、schema、登录、TTS 管道、三大题型引擎（MCQ/填空/句构）、L1-L3 内容 | 本地可完整学完一课并留下 attempts 记录 |
| **M1 MVP 上线** | 开发第 2 周末 | 诊断测试、每日计划、SRS、错题本、阶段 1 语法 14 课、音标 P01-P08、听写引擎 + LLE 20 篇、造句 + LLM 文件模式批改、部署上服务器 | **朋友正式开始 W1**；你完成首次批改包往返 |
| **M2** | 开发第 4 周末 | 音标全 11 课、阶段 2 语法、跟读录音 T0、泛听播放器、统计页、LT 容器、PWA 基础 | 她进入 W3 时功能不掉队；周测第一次跑通 |
| **M3** | 开发第 6 周末 | 阶段 3 语法、faster-whisper 容器（T1 可懂度+素材对齐）、口语题库、周报自动化 | W5 口语任务可用；周报连续两周准点产出 |
| **M4** | 开发第 8 周末 | 阶段 4 内容、全真自测卷、总结报告、备份自动化、修磨 | 8 周验收跑完；数据完整可导出 |

节奏保障：**内容审校每天 2-3 课排入你自己的日程**（W1-W3 最重）；平台内容只需领先她一周，不需要一次做完。

## 10. 部署方案（服务器 150.230.24.148）

前置检查：Ubuntu 22+；放行 80/443（若是 Oracle Cloud，安全组/Security List 也要放行）；装 docker + compose plugin。

**docker-compose 服务**

| 服务 | 镜像 | 资源 | 说明 |
|---|---|---|---|
| app | 本仓库 Dockerfile（next standalone） | ~300MB RAM | 挂载 `/data`（SQLite+音频） |
| caddy | caddy:2 | 极小 | 自动 HTTPS；**部署目标：`ziaoliu.io/english`（gary 2026-07-07 确认，个人站子路径）**；app 以 `NEXT_BASE_PATH=/english` 构建。部署前需确认：ziaoliu.io DNS 是否指向本服务器、个人站现由什么服务（若有既有 web 服务器则由它反代 /english，Caddy 不抢 80/443） |
| languagetool | erikvl87/languagetool | ~1.5GB RAM（限 2GB） | 仅内网暴露给 app（P1 再开） |
| whisper | 自制 faster-whisper HTTP 微服务 | 峰值 ~2GB，`small` int8 CPU | compose profile 按需启动（M3 起） |

RAM 合计峰值 ≈ 4GB：普通 4GB VPS 够用但紧，若是 OCI ARM（4C/24G）非常宽裕。

**运维**
- 更新：`git pull && docker compose up -d --build`（可选 GitHub Actions ssh 部署，P2）。
- 备份：cron 每日 3:00 `sqlite3 app.db ".backup /backups/app-$(date +%F).db"`，保留 14 天；音频只备清单（可重新生成）；每周 `rsync` 拉回你本地一份。
- 安全：ufw 只开 22/80/443；ssh 建议禁密码登录；平台本身有登录且只有两个账号，攻击面小；LT/whisper 不映射公网端口。
- 监控：P2 加 uptime-kuma 或简单 healthcheck cron 发 Telegram。

## 11. 成本与风险

**成本**：服务器已有（$0 新增）；域名可选（$10/年，前期 sslip.io 免费）；TTS/词典/素材 $0；LLM 批改——文件模式 $0（用你现有 claude cli），API 模式估 $1-3/月。**合计新增 ≈ $0-3/月。**

**风险与对策**

| # | 风险 | 对策 |
|---|---|---|
| 1 | 期望管理：把"8 周全 7"当承诺 → 挫败弃学 | §1.2 分段目标已内置产品文案；周报强调与自己比 |
| 2 | 内容审校 40h 是隐性大头，容易拖垮进度 | 排进里程碑；只领先一周；题量可从 25/课降到 18/课止损 |
| 3 | edge-tts 非官方接口可能失效 | 音频全部落盘缓存；Piper 本地兜底；一键重生成脚本 |
| 4 | 开源音素级发音打分不可靠，做了反而误导 | 明确不做；以听辨训练+可懂度+自我对比替代，并在 UI 文案说明 |
| 5 | 学习者中断（最大风险） | 每日 150min 可降档至 90min"保底模式"；连败降量规则；streak + 你能在 admin 看到她的进度，人肉督学 |
| 6 | SpeechRecognition 仅 Chrome 可用 | UI 检测并提示；T1 whisper 上线后与浏览器无关 |
| 7 | 版权 | §7 红线已列；自产内容 + 公有领域素材为主 |

## 12. 附录

### 附录 A：41 音素分课表（美式，含 r 化音）

| 课 | 音素 | 示例词 | 中文学习者常见问题 |
|---|---|---|---|
| P01 | iː ɪ e æ | seat/sit/bed/cat | ɪ-iː 不分（ship=sheep）；æ 张不开嘴读成"哎" |
| P02 | ʌ ə ɑː ɔː | cup/about/father/law | ə 弱读意识为零；ʌ 读成"啊" |
| P03 | ʊ uː ɜː(ɝ) ər(ɚ) | book/food/bird/teacher | ʊ-uː 不分；卷舌位置错 |
| P04 | eɪ aɪ ɔɪ | day/my/boy | 双元音滑动不足读成单音 |
| P05 | aʊ oʊ | now/go | oʊ 读成"欧"不圆唇 |
| P06 | p b t d k g | pig/big/two/do/key/go | 词尾爆破音吞掉或加"呃"（bag→bagə） |
| P07 | f v θ ð | fan/van/think/this | v 读成 w；θ/ð 读成 s/z（最高频问题） |
| P08 | s z ʃ ʒ | see/zoo/she/vision | ʒ 陌生；s/ʃ 混（普通话平翘舌迁移） |
| P09 | tʃ dʒ h r | chair/job/hat/red | r 与汉语 r 舌位不同；dʒ-ʒ 混 |
| P10 | m n ŋ l | man/no/sing/leg | 前后鼻音迁移；词尾 l（dark l）读成"欧"；n-l 混（方言） |
| P11 | j w + 复习测验 | yes/we | y 前加"衣"；w 前加"乌" |

### 附录 B：中式英语 Top 20（改错题库与 L39 专题的骨架）

1. 时态漂移：*Yesterday I go shopping.*
2. 三单丢 -s：*He like it.*
3. be+实义动词叠用：*I am agree with you.*
4. 主谓不一致：*People is...*
5. very + 动词：*I very like it.*
6. 单复数混乱：*two book / many informations*
7. 丢冠词：*I am student.*
8. because...so 连用
9. 宾语从句用疑问语序：*I don't know where is he.*
10. there be 与 have 混用：*There have many people.*
11. 介词错配：*arrive to Beijing / depend of*
12. 形副不分：*He runs very good.*
13. 双谓语：*I will to go.*
14. 可数/不可数：*many money / a advice*
15. 完成时误用/回避：*I have seen him yesterday.*
16. 被动缺失：*My phone stolen.*
17. 直译词组：*open the light / eat medicine*
18. run-on 逗号粘连：*I like it, it is cheap.*
19. 否定位置：*I think he isn't right.*（宜否定转移）
20. 时间/地点状语堆句首直译：*Tomorrow morning nine o'clock I go.*

### 附录 C：资源与许可清单

| 资源 | 用途 | 许可 |
|---|---|---|
| VOA Learning English（learningenglish.voanews.com） | 听力素材（LLE/Level One/常速） | 美国政府作品，公有领域 |
| Tatoeba 例句库 | 例句参考/展示 | CC-BY 2.0 FR，需署名 |
| ECDICT（skywind3000/ECDICT） | 本地英汉词典+音标+词频 | 以仓库 LICENSE 为准（MIT，使用前确认） |
| CMU Pronouncing Dictionary | 音标兜底（ARPABET→IPA） | BSD 类宽松许可 |
| edge-tts | 批量 TTS | 非官方接口，有失效风险（已列风险 3） |
| Piper TTS | TTS 本地备胎 | MIT |
| faster-whisper | 转写/对齐/可懂度 | MIT |
| LanguageTool | 语法规则检查 | LGPL-2.1（自建服务，不改源码无传染问题） |
| earthworm | 句构交互参考 | MIT |
| wavesurfer.js / recharts / shadcn/ui | 前端组件 | MIT 系 |

---
*文档结束。执行入口：按 §9 M0 开始搭骨架；内容起草 prompt 见 §7。*





