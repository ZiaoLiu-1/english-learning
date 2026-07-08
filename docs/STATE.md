# STATE — session 交接文档

> 每个 session 开局必读、收尾必更。只保留当前有效信息，历史看 git log。

更新时间：2026-07-07（M0 收口，tag M0）

## 当前里程碑

**M0 骨架 —— 完成（tag M0）**。reviewer 结论 PASS with shoulds，shoulds 已全清。
下一站 M1 MVP（PLAN §9）。

## 已完成（M0）

- Next.js 16 脚手架（TS strict、Tailwind v4、standalone、basePath 按 `NEXT_BASE_PATH` env 注入）
- drizzle schema 15 表 + 迁移 + lib/db.ts（WAL）；约定见 ADR-001
- 质量门 `pnpm check`（typecheck/lint/test/content:validate）；content zod 契约 lib/content/*
- seed 幂等（gary/learner 两账号 + approved-only 内容投影）
- 三大题型引擎：lib/tokenize.ts（缩写等价/NFA 键入判定）、lib/exercise-judge.ts（mcq/cloze/改错含删除语义）、lib/exercise-submit.ts（分发器）—— 四核心文件 100% 分支覆盖
- 鉴权 SYS-1：lib/auth/*（HMAC session、timing-safe、env secret）、/api/auth/login|logout、getCurrentUser 守卫
- 提交 API：/api/exercises/submit（判定→写 attempts→返 explain_zh）、lib/lessons.ts
- TTS 真身：scripts/gen_tts.ts（edge-tts 批量、幂等、audioPath 回填）+ /audio 静态路由（dev）
- 最小课程页：登录页 + 语法课页（讲解 → 25 题 runner → 句构关卡），app/(learn)/**
- L01-L03 内容 approved + seeded（3 语法点/75 题/54 句）
- M0 验收**真实浏览器实测通过**：登录→学完 L01→25 题三类型全落 attempts→句构关卡通过

## 进行中

（无）

## 部署 —— 已上线 ✅ https://ziaoliu.io/english（2026-07-07，段一+段二完成）

- 段二 nginx：`ziaoliu.io.conf` 443 块已加 `location ^~ /english` 反代 127.0.0.1:8091（含 `client_max_body_size 25m`），照 /bridgesignal 先例。备份在 `/home/ubuntu/nginx-backups/ziaoliu.io.conf.bak-20260707-english`。`nginx -t` 过、reload 完
- 公网实测：/english/login 200、登录 learner/xiao520QIAN. 200、grammar/L01 200、答题提交判定+落库；现有站点 /amd、根站全 200 不受影响
- **账号**：learner 密码 `xiao520QIAN.`（gary 给的，含末尾句点）；admin(gary) 仍是临时随机密码（要用告诉我改）
- 更新部署方法（无 CI，源码非 git checkout）：本地 `git archive HEAD | ssh ... tar -x -C ~/english-platform` → 服务器 `docker compose -f docker/compose.yml build && up -d`（改密码/重置数据才需 `down -v`）

## 下一步（≤3 条，按优先级）

1. M1 功能（PLAN §9）：诊断测试 CORE-1、每日计划 CORE-2、SRS CORE-3（lib/srs.ts 主会话亲自测试先行）、错题本 GRAM-4、听写引擎 LIST-2（lib/diff.ts 主会话亲自）、造句+文件模式批改 SPK-1/2、阶段 1 语法补到 L14 + 音标 P01-P08
2. L04-L14 起草排队（内容领先一周即可）
3. 部署运维小项：把音频接进 UI 后加 `/english/audio/` 的 nginx alias（ADR-002 条件②）；配 https remote+token 让服务器能 git pull（免手动 archive）

## 待 gary（部署相关）

- **nginx 历史遗留**（我没动，你的文件）：`sites-enabled/` 里有 `ziaoliu.io.conf.bak-20260615`，因 `include sites-enabled/*` 被 nginx 加载，导致 `nginx -t` 报 conflicting server name 警告（不影响服务）。建议把它挪出 sites-enabled
- admin 密码仍为临时值；要用 admin 账号告诉我设成什么

## 部署段一 —— 已完成（2026-07-07，不碰 nginx）

- 部署目录 `/home/ubuntu/english-platform`（git archive 传入，非 git checkout —— 更新用重新 archive 或后续配 https remote+token）
- `docker compose -f docker/compose.yml build && up -d`：镜像 `english-platform:local`、容器 `english-platform-app`、绑 **127.0.0.1:8091**（不公开）、named volume `english-platform_english-data`
- 验证：开机 migrate+seed（3/75/54）、`/english/login` 200、`/english`→登录、端到端登录→grammar/L01 200；公网 IP:8091 不可达；现有站点（/amd、bridgesignal、13 容器）全不受影响
- docker/.env 在服务器（gitignored）：AUTH_SECRET=openssl rand -hex 32；密码为临时值待换
- gary 预览：`ssh -L 8091:127.0.0.1:8091 150.230.24.148` 后本地开 http://localhost:8091/english/login （learner / temp-learner-pw）

## 段二待批 nginx 块（加到 ziaoliu.io.conf 的 443 server 块，照 /bridgesignal 先例）

```nginx
# English learning platform — Next.js (Docker 127.0.0.1:8091, basePath /english)
location ^~ /english {
    proxy_pass http://127.0.0.1:8091;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 60s;
    client_max_body_size 25m;   # M2 录音上传（ADR-002 条件①）
}
```
改法：`sudo cp ziaoliu.io.conf ziaoliu.io.conf.bak-YYYYMMDD` → 加块 → `sudo nginx -t` → `sudo systemctl reload nginx`。
（ADR-002 条件②/english/audio/ 走 nginx alias 待音频接入 UI 后再加；现 app 自带 /audio 路由可用）

## 遗留 Nits（reviewer M0，择机修）

- app/audio route 用 `fs.readFileSync` 同步读整文件（prod 走 nginx alias 影响低，dev fallback 宜改异步/流式）
- lib/exercise-submit.ts 对 payloadJson/answerJson 强转未二次校验（seed 已 zod，绕管道的畸形行会 500 而非 400）
- lib/auth/login.ts 未知用户名提前 return，有用户名枚举时序侧信道（两固定账号，可忽略）
- 句构完成不落库（无 sentences-result API），used_hint/生句追踪纯前端刷新即丢 —— M1 SRS 接入时补
- submit 的 cloze responses 数组无长度上限（登录后可达，面小）

## 部署备忘（M1，ADR-002 已批 + 3 执行条件）

- 目标 `ziaoliu.io/english`；服务器实测：OCI ARM 4C/24G、Ubuntu 22.04、docker 27、宿主 nginx 独占 80/443、`/etc/nginx/sites-enabled/ziaoliu.io.conf` 多站点、TLS 证书 ziaoliu.io.pem 覆盖
- 照 `/bridgesignal` 先例：Docker standalone 镜像 `NEXT_BASE_PATH=/english` 构建 → 容器绑 127.0.0.1:8091（已占端口 8000/8080/8081/8090/8001/8444/3333）→ nginx 加 `location ^~ /english` 反代
- 执行条件：`client_max_body_size 25m`（M2 录音）、`/english/audio/` 走 nginx alias 直服 data/audio、whisper 走异步任务（ADR-003 的 transcribe_jobs）
- **分两段**：① 零风险——服务器上 build+跑容器 curl localhost 验 ARM better-sqlite3 原生编译/basePath；② 碰生产——改 ziaoliu.io.conf（备份 + nginx -t），需 gary 单独放行

## 其它待 gary 决策 / 备忘

- 内容小重复：L03 两句撞 L01（"I love my job." L01-s-12/L03-s-09、"We want a cup of tea." L01-s-18/L03-s-07）。要各异需改 approved 内容
- L02-correct-03：give you a gift 等价修法引擎表达不了（token 移动），按唯一可表达解上线
- TTS 依赖：`python3 -m pip install --user edge-tts`（build/content-time，不进 app 镜像）；data/audio 不入 git，可重生成
- 灾备 remote：git@github.com:ZiaoLiu-1/english-learning.git（私有，gary 已授权 push 用于灾备）
