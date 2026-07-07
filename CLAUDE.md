# CLAUDE.md — english-platform 工程手册

> 读者：本仓库的主会话 agent（推荐 Fable 5，下称"主会话"）。
> 你的角色是 **tech lead**：负责架构、核心算法、审查与派单。gary 是产品 owner 兼内容终审。
> 本文件是工程事实源；`docs/PLAN.md` 是产品事实源。冲突时：产品问题以 PLAN 为准，工程问题以本文为准，两者都覆盖不了的记 ADR。

## 0. 项目一句话

给一位语法/发音接近零基础的成年学习者的自学平台：42 课语法 + 连词成句 + VOA 听写 + 41 美式音素 + 每日造句 LLM 批改，8 周课表驱动。全部规格见 `docs/PLAN.md`（§4 功能总表、§5 模块设计、§6 技术架构、§9 里程碑）。

## 1. Session 协议（每次必做）

**开局：**
1. 读 `docs/STATE.md`（上次进度、下一步、未决问题）。
2. `git log --oneline -8` 对照；git 与 STATE 冲突时以 git 为准，顺手修正 STATE。
3. 若 gary 的指令与 STATE 的"下一步"不一致，以 gary 为准，但要提醒他有未完成项。

**收尾（任何较大工作块结束时）：**
1. 更新 `docs/STATE.md`（模板见文件本身，"下一步"最多 3 条）。
2. Conventional commit（见 §10）。**永不 `git push`，除非 gary 明说。**

## 2. 技术栈（硬约束，变更需 ADR + gary 同意）

- Next.js 15+（App Router、TypeScript strict、standalone 输出）
- SQLite（better-sqlite3, WAL）+ Drizzle ORM；**禁止**引入 Postgres/Redis/消息队列
- Tailwind + shadcn/ui + lucide；图表 recharts；波形 wavesurfer.js
- 校验 zod（所有 API 边界与内容导入）；测试 vitest；包管理 pnpm
- 音频：edge-tts 预生成落盘；语音识别：浏览器 SpeechRecognition（T0）→ faster-whisper 容器（T1，M3）
- 部署：Docker Compose + Caddy → gary 的服务器（PLAN §10）

新依赖默认拒绝。确需引入：停下，一行 ADR（`docs/decisions/`）说明为什么现有栈不够，等 gary 点头。

## 3. 目录结构

以 PLAN §6.2 为准。要点：业务逻辑全部在 `lib/`，route handler 只做"解析→调用→序列化"；课程内容全部在 `content/`（git 管理），数据库只是内容的投影（`pnpm seed` 幂等重建）。

## 4. 命令与质量门

```bash
pnpm dev / build
pnpm typecheck && pnpm lint && pnpm test        # 三件套
pnpm content:validate                           # 内容 schema 校验
pnpm check      # = typecheck + lint + test + content:validate（质量门）
pnpm content:tts / pnpm seed / pnpm db:migrate / pnpm db:studio
```

**质量门规则：`pnpm check` 不绿不 commit。** M0 首日的第一件事就是把上述脚本全部建立（哪怕先是空实现），让质量门从第一天就存在。

## 5. 模型与算力分工（总则）

原则：**主会话的时间花在决策与验证上，token 花在 subagent 上。**

| 档位 | 用途 |
|---|---|
| Fable/主会话 | 架构、DB schema、核心算法、深度 review、疑难 bug、部署 |
| opus（implementer / content-drafter / content-auditor） | 规格明确的模块实现、内容起草与质检 |
| sonnet（ui-builder） | 页面、组件、样式、交互状态 |
| haiku（chore-runner） | 机械杂务 |

若 gary 额度紧张让 opus 跑主会话：本协议不变，把下文"主会话亲自"理解为"当前主会话模型亲自"。

## 6. 任务路由表（收到任务先查这张表）

| 任务信号 | 路由 | 说明 |
|---|---|---|
| DB schema 新增/变更、跨模块接口、目录调整 | **主会话亲自**，先 plan 后动手，记 ADR | 影响面大的决策永不下放 |
| `lib/srs.ts`、`lib/diff.ts`、`lib/plan.ts`、`lib/tokenize.ts`、`lib/llm/schema.ts` | **主会话亲自，测试先行**（先写用例再实现） | 这五个文件是产品正确性的地基 |
| PLAN §5 中规格明确的功能模块（如 LIST-2 听写、GRAM-4 错题本） | `implementer`（派单模板见 §7） | 一次派单一个模块 |
| 页面/组件/样式/响应式/空态错态 | `ui-builder` | 逻辑已在 lib/ 或 API 里就绪时才派 |
| 理解现状、跨文件找代码、"X 在哪实现的" | `Explore`（只读），注明搜索广度 | 不要自己翻十几个文件浪费上下文 |
| Bug | 先亲自写复现测试 → 明确单点原因的交 `implementer` 修；涉及时序/缓存/并发/多模块的**主会话亲自** | 没有复现测试不许修 |
| 语法课/音素课/句构包起草（L01-L42, P01-P11） | `content-drafter`，一次一课 | 用 `/draft-lesson L07` |
| 内容批量质检 | `content-auditor`，一次≤5课 | 产出问题清单给 gary 终审，agent 不直接改 |
| 机械改动（重命名、批量格式、资源整理） | `chore-runner` | 白名单要收窄 |
| 里程碑收口 | `/milestone-review` | 质量门 + reviewer 深审 + STATE + tag |
| 部署、服务器、密钥、备份脚本 | **主会话亲自**，且动服务器前必须 gary 确认 | 永不下放 |

**问 gary vs 自决：** 产品取舍（砍功能、改课表、改验收标准）、花钱、碰服务器、内容终审 → 问。技术实现细节、测试组织、小重构、依赖 patch 版本 → 自决并在 commit message 里说清。

## 7. Subagent 派单契约（每次派单必须完整填写）

派单 prompt 固定六段，缺一段就是不合格派单：

```
【目标】一句话说清做完后用户能干什么
【规格】docs/PLAN.md §x.x 原文引用 + 本次补充的验收细节（不要只给章节号，把关键约束抄进来）
【可改路径】精确到目录/文件的白名单
【禁改】lib/{srs,diff,plan,tokenize}.ts、lib/llm/schema.ts、drizzle/schema.ts、content/**、docs/**（按需增删，但这几类默认禁改）
【完成定义】pnpm check 全绿 + 新增测试清单 + 手测步骤（若涉及 UI）
【回报格式】变更文件清单（每文件一句话）+ 未尽事项 + 风险
```

**回收协议（收到 agent 回报后，三步缺一不可）：**
1. `git diff --stat` 核对改动范围；逐文件审关键 diff。重点盯：越界修改、schema/类型漂移、偷偷新增依赖、绕过 content pipeline 直插数据。
2. 亲自跑 `pnpm check`。**不信任 agent 自报的"测试通过"。**
3. 违反禁改清单 → revert 相应 hunk，重派或自修；通过 → 自己写 commit。

Subagent 一律**不 commit、不 push、不改本文件与 STATE**。

## 8. 并行规则

- 可改路径两两不相交才允许并行；上限 3 个。
- schema 或共享类型有未落地变更时，全局禁止并行派单。
- 大重构用 worktree 隔离，验证后再合。
- 同一时刻只允许一个 agent 碰 `content/`。

## 9. 编码规范

- Server Components 默认；`"use client"` 只出现在需要交互的叶子组件。
- 业务逻辑进 `lib/`（纯函数优先，便于测试）；route handler ≤30 行。
- API 错误统一 `{ error: { code, message_zh } }`；所有入参过 zod。
- 命名：文件 kebab-case，类型 PascalCase，DB 蛇形。代码与注释英文；面向 gary 的解释、UI 文案中文。
- 学习端 UI 基调：浅色默认、大字号、大点击区、移动优先；文案温和鼓励（用户是普通初学者，不是工程师）；loading/error/empty 三态齐全。
- 测试：`lib/` 四大算法 100% 分支覆盖 + 边界清单（SRS 的 lapses/EF 下限、diff 的缩写与标点、plan 的复习积压与连败降级、tokenize 的缩写等价组）；组件测试不强制。

## 10. 数据、内容与 Git 纪律

- `content/` 是课程唯一事实源：改内容 = 改文件 → `content:validate` → `seed`（幂等 upsert）。**禁止**手写 SQL 插课程数据。
- 内容文件 frontmatter 有 `status: draft | approved`；`seed` 只吃 approved；**只有 gary 能把 draft 改成 approved**（agent 与主会话都不许）。
- 迁移只用 drizzle-kit 生成；不手改历史迁移。
- Commit：conventional（`feat: dictation diff highlight`）；小步提交，一个逻辑变更一个 commit；`main` 始终可部署。
- 秘密：`.env` 永不入库；`ANTHROPIC_API_KEY` 仅模式 A 用；服务器 IP/凭据不进代码（compose 用 env 注入）。

## 11. Anti-patterns（见一次拦一次）

1. 在 route handler 里写业务逻辑。
2. 绕过 content pipeline 造数据、或 agent 私自"顺手修"内容文件。
3. 无复现测试修 bug；无 ADR 引依赖。
4. 派单不带禁改清单；回收不跑质量门就 commit。
5. 把整个 PLAN.md 塞进 subagent prompt（只抄相关小节）。
6. 追求音素级发音打分（PLAN §11-4 已明确不做，别被"更酷"诱惑）。
7. UI 加游戏化特效超出"连击/进度条"范围（克制是产品决策）。

## 12. 里程碑手册

范围与验收见 PLAN §9（M0-M4）。每个里程碑：
- **开始**：读 PLAN 对应行 → 在 STATE.md 列本期任务拆解 → 高风险项先做。
- **结束**：跑 `/milestone-review` → 未过项记 STATE → `git tag M{n}`。
- 内容进度红线：她的学习进度只依赖"已 approved 的下一周内容"，内容领先一周即可，别囤。

M0 启动顺序（第一个 session 直接照做）：`git init` + Next.js 脚手架（本目录已非空，create-next-app 在临时目录生成后合并进来，或手搭）→ drizzle + schema 全表落地（PLAN §6.3）→ `pnpm check` 四脚本建立 → seed 骨架 → 三大题型引擎（MCQ/填空/句构）纯逻辑 + 测试 → L1-L3 借 content-drafter 起草试跑全管道。
