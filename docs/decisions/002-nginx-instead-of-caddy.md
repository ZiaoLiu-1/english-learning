# ADR-002: 部署复用宿主 nginx，放弃自带 Caddy

- 日期：2026-07-07
- 状态：提议
- 背景：实测服务器（OCI ARM 4C/24G，Ubuntu 22.04，docker 27 + compose v2）：宿主 nginx 已独占 80/443 并服务多站点；ziaoliu.io/bridgesignal 已有成熟先例 = Next.js basePath 构建 + 容器绑 127.0.0.1:8090 + nginx location 反代；TLS 证书由既有 ziaoliu.io.pem 覆盖。
- 决定：english-platform 照 bridgesignal 模式部署——`NEXT_BASE_PATH=/english` 构建 standalone 镜像，容器绑 127.0.0.1:8091（部署时确认端口空闲），在 ziaoliu.io.conf 加一个 `location ^~ /english` 反代块；compose 只管 app（后续 LT/whisper 容器仅内网），不含 Caddy。
- 代价与替代方案：放弃 Caddy 自动 HTTPS（不需要，证书已有）；改 nginx 配置动到 gary 的既有站点文件，上线前备份该 conf 并 `nginx -t` 后 reload。备选"新起子域名+Caddy"被否：与 gary 明确的 ziaoliu.io/english 路径方案冲突。
