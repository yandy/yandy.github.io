---
title: 在 CachyOS 上基于 distrobox 安装使用 ROS2
toc: true
date: 2026-07-30 22:00:00
categories: ['最佳实践']
tags:
  - ros2
  - distrobox
  - podman
  - cachyos
  - linux
  - robotics
---

ROS2（Robot Operating System 2）是机器人开发领域最主流的中间件框架。但它有一个公认的痛点：**安装环境要求非常苛刻**。官方只对 Ubuntu 提供一线支持，而 CachyOS 作为 Arch 系发行版，直接安装 ROS2 要么依赖 AUR（版本滞后、打包质量参差不齐），要么需要从源码编译（耗时且容易踩坑）。

[distrobox](https://github.com/89luca89/distrobox) 正好解决了这个问题——它在容器里跑一个完整的 Ubuntu 用户态环境，同时无缝共享宿主机的主目录、GPU、显示器、音频和网络。你可以把它理解为"用 Docker 容器当开发环境，但体验和原生安装几乎一模一样"。

本文记录在 CachyOS（Arch 系滚动发行版）上使用 distrobox + Podman 搭建 ROS2 Humble / Jazzy 开发环境的完整方案，支持 GPU 加速仿真与可视化。

<!-- more -->

## 为什么是 distrobox

先明确一个问题：ROS2 的开发环境需求，本质上是两个矛盾的集合——

- **环境隔离需求**：不同 ROS2 发行版（Humble / Jazzy）之间 ABI 不兼容，不能混装在同一系统上；构建产物的 CMake 版本、依赖库版本也各不相同，混用工作空间极易出错。
- **系统集成需求**：你又希望它能访问 GPU 跑仿真、能弹出 GUI 窗口做可视化、能读写主目录下的代码、能用宿主机的网络做 DDS 发现。

虚拟机太重（GPU 直通复杂），裸 Docker 太繁琐（手动挂载一堆 volume、配 X11 socket、装 nvidia-container-toolkit），而 distrobox 把这些脏活全部封装掉了，留下了干净的用户界面：`distrobox create --nvidia --image ubuntu:22.04 --name humble-box`，一条命令搞定。

> 如果你还没接触过 Podman，可以参考我之前写的 [个人开发机容器引擎迁移：从 Docker 到 Podman](/2026/07/30/docker-to-podman-migration/)——distrobox 同时支持 Docker 和 Podman，本文使用 Podman 6.0.2 作为后端。

## 整体架构

```
CachyOS Host (Wayland + NVIDIA RTX 5060)
├── distrobox
│   ├── humble-box ── Ubuntu 22.04 ── ROS2 Humble desktop
│   └── jazzy-box  ── Ubuntu 24.04 ── ROS2 Jazzy  desktop
└── Podman 6.0.2
    ├── --nvidia GPU 透传 (CDI)
    ├── X11 通过 XWayland ($DISPLAY + /tmp/.X11-unix)
    ├── Wayland socket 自动继承
    ├── $HOME 自动共享 (distrobox 默认)
    └── ipc=host (仿真共享内存)
```

每个 ROS2 发行版一个容器、安装 `desktop`（最完整版本）。做纯代码开发时不启动 GUI 即可，不会有额外开销——真正做到了"一套环境覆盖轻量开发和重型仿真"。

## 安装步骤

### 1. 宿主机安装 distrobox

```bash
# CachyOS 上选择 pacman
sudo pacman -S distrobox
```

### 2. 创建容器

```bash
# Humble (Ubuntu 22.04)
SHELL=/usr/bin/bash \
distrobox create \
  --name humble-box \
  --image ubuntu:22.04 \
  --nvidia \
  --additional-flags "--ipc=host"

# Jazzy (Ubuntu 24.04)
SHELL=/usr/bin/bash \
distrobox create \
  --name jazzy-box \
  --image ubuntu:24.04 \
  --nvidia \
  --additional-flags "--ipc=host"
```

> [!NOTE] 如果希望 ubuntu 使用国内源，需要制作变更了软件源的镜像，并将 `--image` 参数的值替换为该镜像

几个关键参数：
- `--nvidia`：通过 CDI（Container Device Interface）自动配置 GPU 透传，无需手动指定 `--device`。宿主机 CUDA 13.3 驱动与容器内 CUDA 库兼容（驱动版本 ≥ 工具包版本即可）。
- `--additional-flags "--ipc=host"`：共享 IPC 命名空间，Gazebo 仿真需要较大的共享内存。
- GUI 方面不需要额外配置——distrobox 自动挂载 `/tmp/.X11-unix` 并继承 `$DISPLAY`（XWayland），同时继承 `$WAYLAND_DISPLAY`（原生 Wayland 备选）。

### 3. 进入容器并安装 ROS2

```bash
distrobox enter humble-box
```

在容器内执行以下步骤：

```bash
# --- 添加 ROS2 apt 仓库 ---
sudo curl -sSL https://raw.githubusercontent.com/ros/rosdistro/master/ros.key \
  -o /usr/share/keyrings/ros-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/ros-archive-keyring.gpg] http://mirrors.ustc.edu.cn/ros2/ubuntu $(. /etc/os-release && echo $UBUNTU_CODENAME) main" \
  | sudo tee /etc/apt/sources.list.d/ros2.list > /dev/null

# --- 安装 ROS2 + 开发工具 ---
sudo apt update
sudo apt install ros-humble-desktop ros-dev-tools
```

对于 `jazzy-box`，重复同样流程，只需将包名换为 `ros-jazzy-desktop`，并且 24.04 上 `add-apt-repository universe` 这步可以跳过（universe 源默认已启用）。

### 4. Shell 自动加载

由于 `$HOME` 在所有容器间共享，同一份 `~/.bashrc` 会被 humble-box 和 jazzy-box 同时看到。利用文件存在性检测，自然分流：

```bash
# 在 ~/.bashrc 末尾添加
if [ -f /opt/ros/humble/setup.bash ]; then
  source /opt/ros/humble/setup.bash
elif [ -f /opt/ros/jazzy/setup.bash ]; then
  source /opt/ros/jazzy/setup.bash
fi
```

每个容器只安装了对应的 ROS distro，所以不会误加载——humble-box 中只有 `/opt/ros/humble/` 存在，jazzy-box 反之。

## 日常工作流

```bash
# 进入 ROS2 环境
distrobox enter humble-box

# 创建工作空间
mkdir -p ~/ros2_ws_humble/src
cd ~/ros2_ws_humble
colcon build

# 运行 GUI 工具（GPU 加速，通过 XWayland 渲染）
rviz2 &
ros2 run gazebo_ros gazebo

# 加载工作空间 overlay
source ~/ros2_ws_humble/install/setup.bash

# 退出容器
exit
```

### 工作空间隔离

不同 ROS2 版本的构建产物互不兼容，建议使用按版本命名的独立工作空间：

- `~/ros2_ws_humble/` —— Humble 专用
- `~/ros2_ws_jazzy/` —— Jazzy 专用

### 导出应用到宿主机菜单

```bash
distrobox enter humble-box
distrobox-export --app rviz2
distrobox-export --app gazebo
exit
```

这会在宿主机上生成 `.desktop` 文件，之后可以直接从系统菜单启动容器化的 GUI 应用，体验如同原生安装。

### 网络与多容器通信

distrobox 默认使用宿主机网络，ROS2 的 DDS 发现通过组播直接工作。如果需要防止不同 ROS distro 的容器意外串扰，可以设置 `ROS_DOMAIN_ID`：

```bash
# 在 humble-box 中
export ROS_DOMAIN_ID=1

# 在 jazzy-box 中
export ROS_DOMAIN_ID=2
```

## 验证清单

安装完成后，逐项确认以下内容：

- [ ] `nvidia-smi` 在容器内正常工作，能识别 GPU 型号
- [ ] `ros2 run demo_nodes_cpp talker` 无报错运行
- [ ] `rviz2` 启动并使用 GPU 加速渲染
- [ ] `gazebo`（或 `gz sim`）启动并正确显示
- [ ] `colcon build` 在测试工作空间中编译通过
- [ ] 同一容器内的两个终端可以通过 ROS2 topic 正常通信

## 常见问题与排查

| 问题 | 原因 | 解决方式 |
|------|------|---------|
| `nvidia-smi` 报错或找不到 GPU | nvidia-container-toolkit CDI 配置缺失 | 在宿主机执行 `sudo nvidia-ctk cdi generate` |
| Gazebo 启动后崩溃或卡顿 | 共享内存不足 | 确认创建容器时加了 `--additional-flags "--ipc=host"` |
| Wayland 原生 GUI 不工作 | 部分 ROS 工具只适配 X11 | 当前方案已用 XWayland 兜底，`$WAYLAND_DISPLAY` 也被继承可自行尝试 |
| distrobox 不在 CachyOS 仓库中 | CachyOS 包名与上游 Arch 一致 | 使用 `yay -S distrobox` 从 AUR 安装，或直接从 GitHub 安装 |
| 两个容器磁盘占用过大 | 每个 `desktop-full` 约 6-8 GB | 两个容器总计约 16 GB，对现代开发机压力不大；如需瘦身可改用 `ros-base` |

## 小结

用 distrobox 搭建 ROS2 开发环境的核心思路是：**让 Ubuntu 负责 ROS2 的软件生态，让容器负责隔离，让 distrobox 负责把一切集成得像个原生环境**。

比起在 Arch 系发行版上和 AUR 包拉扯、或者从源码编译 ROS2，这套方案的优势很明显——遵循 ROS2 官方的 Ubuntu 安装路径，兼容性最好；同时宿主机完全不被污染，删容器即卸载；GPU、GUI、网络、文件系统全部开箱共享，不用踩一堆配置坑。

如果你也在 CachyOS（或任何非 Ubuntu 发行版）上做 ROS2 开发，不妨试试这套方案。
