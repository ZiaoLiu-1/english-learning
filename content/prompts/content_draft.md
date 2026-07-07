# 语法课起草契约（content-drafter 输入）

> 本文件是起草一课语法内容的唯一格式契约，与 `lib/content/schema.ts` 的 zod 校验严格对应。
> 交付前必须 `pnpm content:validate` 全绿。所有新文件 frontmatter/status 一律 `draft`。

## 读者与语言

学习者：中文母语成年人，词汇 2000-4000 认读词，语法接近零，不识音标。
讲解、解释、题目说明全部中文；英文素材用自然的美式日常口语（工作/吃饭/朋友/手机场景），
禁止教科书腔（"Tom has a pen"）。**i+1 原则**：例句和句构句只用已学语法点（读前置课程文件确认）
+ 高频词（NGSL 前 2000 为主），新语法点只出现本课这一个。

## 每课三个产出文件

以 L07 为例：

### 1) `content/grammar/L07.md`

```
---
lesson: L07
status: draft
stage: 1
ord: 7
title_zh: 人称代词与物主代词
prereq: [L03, L04]
---

## 讲解

（≤500 个汉字。中文思维 vs 英文思维对照，不堆术语。）

## 常见错误

（2-3 条真实中式英语错误：错句 → 对句 → 一句话解释。）
```

**frontmatter 硬约束**（解析器只支持平铺 YAML 子集）：
- 只允许 `key: 标量` 或 `key: [a, b, c]` 单行数组；禁止多行值、嵌套、块列表。
- `lesson` 必须与文件名一致，编码一律补零：L01..L42。
- `stage` 1-4，`ord` 1-42（全局课次），`prereq` 为课程编码数组。
- 正文必须恰好有 `## 讲解` 与 `## 常见错误` 两个二级标题，讲解在前。

### 2) `content/grammar/L07.exercises.json`

25 题：**MCQ 10 / 填空 8 / 改错 7**。顶层：

```json
{
  "lesson": "L07",
  "status": "draft",
  "exercises": [ ... ]
}
```

每题公共字段：
- `uid`：`L07-mcq-01`、`L07-cloze-01`、`L07-correct-01`（课内递增，全局唯一）
- `difficulty`：1-3
- `explain_zh`：≥8 字，说清**为什么对与为什么错**。禁止"根据语法规则"式废话。

**mcq**：
```json
{
  "uid": "L07-mcq-01", "type": "mcq", "difficulty": 1,
  "payload": { "question": "___ is my friend.", "options": ["He", "Him", "His"] },
  "answer": { "index": 0 },
  "explain_zh": "主语位置用主格 He；Him 是宾格只能作宾语，His 是物主代词后面要跟名词。"
}
```
选项 3-5 个、不得重复，`answer.index` 从 0 数。

**cloze**（填空）：
```json
{
  "uid": "L07-cloze-01", "type": "cloze", "difficulty": 2,
  "payload": {
    "text": "This is ___ phone, not ___.",
    "blanks": [ { "accept": ["my"] }, { "accept": ["yours"] } ]
  },
  "answer": {},
  "explain_zh": "名词前用形容词性物主代词 my；句尾独立使用要用名词性物主代词 yours。"
}
```
- 空位写成 `___`（3 个及以上下划线），数量与 `blanks` 数组一一对应。
- `accept` 列出全部可接受答案（大小写/首尾空格不敏感；缩写等价 don't=do not 系统自动处理，不必重复列）。
- **答案必须唯一可判**：自查有没有第二个合理答案，有就改题干锁死语境。

**correct**（改错，题源=中国学习者真实错误，参考 PLAN 附录 B）：
```json
{
  "uid": "L07-correct-01", "type": "correct", "difficulty": 2,
  "payload": { "tokens": ["Me", "is", "a", "teacher"] },
  "answer": { "error_index": 0, "corrections": ["I"] },
  "explain_zh": "主语要用主格 I，Me 是宾格。"
}
```
`tokens` 是整句分词（不含标点），`error_index` 指向错误 token（从 0 数）。答案二选一：
- **替换型**：`"answer": { "error_index": N, "corrections": ["修正词"] }`。
  **自查**：把 corrections[0] 按空格拆开替换进 tokens[N] 后，整句必须完全正确
  （*I am agree* 若指 am 改 "agree" 会得到 *I agree agree with you*——错，该用删除型）。
- **删除型**（多余词，如 be+实义动词叠用）：`"answer": { "error_index": N, "delete": true }`，
  指向多余的那个词；学习者把修正框留空即为删除。
- 修正词禁止含标点或跨句结构（不许 ". I want" 这类）。

### 3) `content/sentences/pack-L07.json`

18 句连词成句，练本课语法点：

```json
{
  "pack": "L07",
  "status": "draft",
  "sentences": [
    {
      "uid": "L07-s-01",
      "en": "Her phone is on the table.",
      "zh": "她的手机在桌上。",
      "tokens": ["Her", "phone", "is", "on", "the", "table"],
      "alt": [],
      "gp_codes": [],
      "level": 1
    }
  ]
}
```

- `zh` 是自然中文句意（不许翻译腔）；`en` 是完整英文句（带正常标点）。
- `tokens`：词级分词，**不含标点**；撇号/连字符留在词内（`don't`、`part-time` 各是一个 token）。
  校验规则：tokens 连接后归一化必须与 en 归一化完全一致。
- `alt`：仅句子特有等价（全局缩写表已内置，don't↔do not 不用写）。格式
  `{ "span": [起, 止), "options": [["替换", "token", "串"]] }`。一般留空数组。
- `gp_codes`：本 pack 的课程编码会自动附加，只在句子额外涉及**已学**语法点时填。
- `level` 1-3（句长与词频难度）。

## 质量红线（违反=返工）

1. 填空/改错答案唯一可判。
2. 改错的错误必须是中国学习者真实会犯的，不造罕见错误。
3. 内容贴近成年人日常生活，全部原创，不复制任何版权教材的原文或成套题目。
4. 例句只用已学语法（i+1），本课新语法点是唯一例外。

## 交付流程

1. 写完三个文件后跑 `pnpm content:validate`，贴末尾输出原文。
2. 回报：产出文件清单 + validate 输出 + 你自己最没把握的 3 处（标 `文件:uid`）。
3. 只写本课的新文件；禁改代码、schema、其他课程、docs。不 commit。
