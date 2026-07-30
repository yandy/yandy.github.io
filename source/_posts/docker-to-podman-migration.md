---
title: 个人开发机容器引擎迁移：从 Docker 到 Podman
toc: true
date: 2026-07-30 12:11:18
categories: ['按图索骥']
tags:
  - container
  - podman
  - docker
  - linux
---

最近把自己的个人开发机（CachyOS / Arch Linux）的容器引擎从 Docker 迁移到了 Podman，整个过程比预想的顺利得多。正好把迁移过程记录整理出来，附带一份可直接照做的操作方案。

<!-- more -->

## 什么是 Podman

Podman（Pod Manager）是由 Red Hat 主导开发的开源容器引擎，一句话概括：**它是一个"去守护进程化"的 Docker 替代品**。

Docker 的架构中有一个常驻后台的守护进程 `dockerd`，所有容器操作都经过它。Podman 则不同——它没有守护进程，每次执行 `podman run`、`podman build` 等命令，都直接 fork 出进程来管理容器，用完即退。

这意味着 Podman 天然具备几个特质：

- **Rootless（无需 root 权限即可运行容器）**：容器以当前用户身份运行，安全隔离由 Linux 用户命名空间提供，不会在宿主机上留下 root 进程。
- **与 systemd 深度集成**：可以直接为容器生成 systemd unit 文件，让容器像系统服务一样管理。
- **兼容 Docker CLI**：核心命令（`run`、`build`、`pull`、`push`、`images`……）与 Docker 几乎完全一致，学习成本极低。装上 `podman-docker` 后，直接敲 `docker` 命令也能操作 Podman。
- **无守护进程 = 无单点故障**：不会出现 "docker daemon 挂了所有容器全挂" 的情况。
- **OCI 标准兼容**：镜像格式、容器运行时完全遵循 OCI 标准，可以直接与 Kubernetes 生态对接。

## 为什么个人开发机更适合用 Podman

如果你和我一样，容器引擎主要用在个人开发机上——跑本地服务、搭开发环境、做实验，而不是管理生产集群——那 Podman 在以下几个维度上比 Docker 更合适：

### 1. 资源开销

Docker 的 `dockerd` 是一个常驻进程，即使没有任何容器在跑也会占用内存（通常在几百 MB 量级）。对于一台 16G/32G 内存的开发机来说，这部分开销虽不算大，但积少成多——IDE、浏览器、本地 LLM、Docker daemon 加起来就不是小数目了。Podman 没有后台守护进程，零空闲开销。

### 2. 安全性

Docker daemon 以 root 运行，虽然 Docker 也支持 rootless 模式，但那不是默认行为且配置繁琐。Podman 的 rootless 模式是**开箱即用**的——容器内的 root 被映射为宿主机上的普通用户，即使容器被攻破，攻击者也拿不到宿主机的 root 权限。对个人开发机来说，你很可能用容器跑一些来源不那么确定的镜像（比如 GitHub 上随手拉的项目），这层隔离很有价值。

### 3. systemd 集成

Linux 桌面/开发机基本都在用 systemd。Podman 可以一键生成 systemd user unit：

```bash
podman generate systemd --new --name my-container > ~/.config/systemd/user/my-container.service
systemctl --user enable --now my-container
```

重启机器后容器自动恢复，不需要额外配置 `restart=always` + 依赖 dockerd 启动 —— 这就是 systemd 原生服务的能力。

### 4. 无守护进程 = 运维心智负担小

没有守护进程意味着没有 "daemon 需要重启才能应用新配置" 的问题，也没有 "daemon 挂了排查半天" 的麻烦。出问题时排查范围更小：要么是容器进程本身的问题，要么是内核参数的问题，没有中间层。

### 5. 安装简单、依赖少

在 Arch Linux 上，`sudo pacman -S podman` 一条命令搞定，依赖只有 `netavark` 和 `aardvark-dns`。相比之下 Docker 的安装涉及 `docker` + `containerd` + `runc` + `docker-buildx` 等多个包，组件多了出问题的概率也大。

---

## 迁移方案

以下是我从 Docker 迁移到 Podman 的完整操作方案。环境是 CachyOS（Arch Linux），场景是**有若干重要镜像需要保留、无需保留容器/数据卷/网络/项目**。

> 注：每一步都可以独立确认后再继续，没有隐藏的副作用。

### 一、迁移前准备

**了解当前状态：**

```bash
# 镜像
docker image ls

# Docker 占用的磁盘空间
sudo du -sh /var/lib/docker

# 确认没有运行中需要保留的容器
docker ps -a

# 当前 Docker 包
pacman -Q | grep -iE 'docker|containerd|runc'
```

**共存期注意事项：**

| 冲突点 | 影响 | 处理方式 |
|--------|------|----------|
| `/var/run/docker.sock` | Docker 有，Podman 无 | 共存期内无关 |
| `/usr/bin/docker` | 属于 `docker` 包 | Podman 先不装 `podman-docker`，两者不冲突 |
| **端口占用** | ⚠️ Docker 容器映射的端口，Podman 不能用同样的主机端口 | 共存期内只搬镜像，不启动容器 |
| 存储路径 | Docker: `/var/lib/docker/`，Podman: `~/.local/share/containers/` | 路径不同，无冲突 |

### 二、安装 Podman

```bash
sudo pacman -S podman
```

**装了什么**：`podman` + 依赖 `netavark`（网络后端）+ `aardvark-dns`（容器 DNS）+ `passt`（Socket Transport） 。

**按需可选：**

| 包 | 作用 | 判断 |
|----|------|------|
| `podman-compose` | 兼容 docker-compose.yml | 没有 compose 项目则不装 |

**安装后校验：**

```bash
podman version
podman info --format '{{.Store.GraphDriverName}}'  # 期望: overlay
```

### 三、配置检查与修复

> CachyOS 默认配置大概率不需要改，但要查过才能确认。以下每步都是**先检查，有问题才修改**。

**3.1 镜像搜索源：**

```bash
podman info --format '{{range .Registries.SearchRegistries}}{{.}} {{end}}'
```

输出包含 `docker.io` → ✅ 无需操作；否则：

```bash
echo 'unqualified-search-registries = ["docker.io"]' | \
  sudo tee /etc/containers/registries.conf.d/10-unqualified-search-registries.conf
```

**3.2 rootless 系统参数：**

```bash
sysctl kernel.unprivileged_userns_clone
```

输出 `= 1` → ✅ 无需操作；输出 `= 0`：

```bash
sudo sysctl -w kernel.unprivileged_userns_clone=1
echo 'kernel.unprivileged_userns_clone=1' | sudo tee /etc/sysctl.d/10-userns.conf
```

**3.3 subuid / subgid：**

```bash
grep "^$USER:" /etc/subuid /etc/subgid
```

无输出则需配置：

```bash
sudo usermod --add-subuids 100000-165535 --add-subgids 100000-165535 "$USER"
```

**3.4 rootless overlay 验证：**

```bash
podman info --format '{{.Store.GraphStatus}}' 2>/dev/null
```

无报错 → ✅。

### 四、迁移镜像

```bash
docker image ls --format "{{.Repository}}:{{.Tag}}" | grep -v "<none>" | \
  while read img; do
    echo "--- $img ---"
    docker save "$img" | podman load
    echo ""
  done
```

**原理**：`docker save` 输出 OCI 格式 tar 流 → 管道直接给 `podman load`，不经中间文件，不额外占磁盘。

**验证**：

```bash
# 应有同名镜像
podman image ls

# 抽样跑一个看看能否正常启动
# 选一张你"重要的镜像"之一
podman run --rm <某镜像> <它的入口命令>
```

### 五、保留 Registry 登录凭据

```bash
if [ -f ~/.docker/config.json ]; then
  mkdir -p ~/.config/containers
  cp ~/.docker/config.json ~/.config/containers/auth.json
  echo "✅ 凭据已迁移"
  echo "  源: ~/.docker/config.json"
  echo "  目标: ~/.config/containers/auth.json"
else
  echo "没有找到 Docker 登录凭据，无需迁移"
fi
```

> Podman 的认证查找顺序：`~/.config/containers/auth.json` → `~/.docker/config.json`。提前复制过去，后续删 `~/.docker/` 不影响认证。

### 六、验证

**6.1 镜像完整性：**

```bash
echo "Docker 镜像数: $(docker image ls -q | wc -l)"
echo "Podman 镜像数: $(podman image ls -q | wc -l)"
```

数量应对得上。

**6.2 核心功能：**

```bash
# 拉取测试（需要 registry 配置正确）
podman run --rm hello-world

# 网络连通（rootless 下走 pasta）
podman run --rm alpine ping -c 1 8.8.8.8

# DNS 解析
podman run --rm alpine wget -q -O - https://example.com | head -3
```

**6.3 rootless 确认：**

```bash
[ "$(id -u)" -eq 0 ] && echo "⚠️ root 模式" || echo "✅ rootless 模式"
```

### 七、铲除 Docker

```bash
# 停止并禁用服务
sudo systemctl stop docker docker.socket
sudo systemctl disable docker docker.socket

# 卸载包（交互式确认）
sudo pacman -Rns docker containerd docker-buildx docker-compose
# ↑ 看清楚将要删除的包列表，确认后才 Y
#   如果系统上还有其他软件依赖 containerd/runc
#   这里会提示，pacman 会跳过它们而不删除

# 清理数据
sudo rm -rf /var/lib/docker /etc/docker ~/.docker

# 清理用户组
sudo groupdel docker 2>/dev/null || echo "docker 组已不存在，跳过"

# 确认
pacman -Q | grep -i docker || echo "✅ 无残留 Docker 包"
```

**可能遇到的坑：**

| 情况 | 处理 |
|------|------|
| 卸载时提示 `containerd` 或 `runc` 被其他包依赖 | `-Rns` 会跳过，保留它们不影响 |
| `~/.docker/config.json` 已被删但 Podman 丢认证 | 重新 `podman login` |
| `docker0` 网卡残留 | 卸载 Docker 后系统重启会自动清理 |
| 之前有 `docker-compose` 作为独立包 | `sudo pacman -Rns docker-compose`（如果你有的话） |

### 八（可选）：安装命令兼容层

```bash
sudo pacman -S podman-docker
```

装完后 `docker --version` 输出 Podman 版本号。如果你打算以后全部用 `podman` 命令，这步可以跳过。

**兼容模式下需要关注的差异：**

| 方面 | Docker | Podman | 影响程度 |
|------|--------|--------|----------|
| 默认日志驱动 | `json-file`（写入 `/var/lib/docker/containers/`） | `journald` | **有影响**：`docker logs` 行为相同，但日志文件位置不同；原来解析日志文件的脚本需要改 |
| 容器自启动 | `--restart=always` + `dockerd` 自动处理 | 需 `systemctl --user enable podman-restart` 或生成 systemd unit | **有影响**：如果不手动操作，重启后容器不会自动恢复 |
| 端口绑定 (<1024) | sudo 即可 | rootless 下不能绑定 80/443 | **有影响**：需要 `sudo podman` 或调高 `ip_unprivileged_port_start` |
| 存储路径 | `/var/lib/docker/` | `~/.local/share/containers/` | 无影响 |
| 构建镜像 | `docker build` | `podman build`（语法相同） | 无影响 |

---

## 小结

整个迁移过程的核心时间花在检查前提条件和搬镜像上，实际操作不超过 20 分钟。迁移完后最大的感受是"清爽"——没有后台守护进程占用资源，容器管理直接融入到 systemd 体系中，和 Linux 桌面环境的契合度比 Docker 高了一个档次。

如果你也在考虑把开发机上的容器引擎换成 Podman，希望这份方案对你有帮助。
