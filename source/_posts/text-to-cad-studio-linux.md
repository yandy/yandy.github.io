---
title: 在 Linux 上从源码运行 text-to-cad Studio
toc: true
date: 2026-11-20 17:00:00
categories: ['最佳实践']
tags:
  - linux
  - cad
  - cachyos
  - ai
---

[text-to-cad](https://github.com/amywork777/studio) 是一套「用自然语言做机械设计」的工具链：背后是 build123d（OCP）建模内核，加上 netgen 网格与 CalculiX 强度校核，再加上 3D 打印、CNC、导出等一批技能。Studio 则是它的桌面外壳——一个 Electron 应用，你在里面和 agent 对话，agent 调用 CAD 工具把零件真正建出来。

问题在于，官方打包脚本在 Linux 上直接 `stop`，没有现成的安装包。所以想在 Linux 用上它，只能从源码跑仓库自带的 dev 版（checkout 版 Studio）。下面是我在自己机器（CachyOS、x86_64、Wayland）上跑通的完整步骤。

几个先要知道的事实，能帮你判断值不值得动手：

- 整套依赖装下来约 **1.5～3 GB**，第 5 步最耗时；
- `cadquery-ocp` / `netgen-mesher` / `cad-ccx` 的 cp314 轮子只有 **Linux x86_64**，ARM64 缺 netgen，强度校核不可用；
- 需要 git、uv，以及一个 26.x 的 Node（见第 2 步）。

<!-- more -->

## 1. 准备 git repo

### 初次下载

```sh
cd "$HOME/.local/src"   # <-- 改成你的存放源码的路径
git clone --depth 1 --revision '<tag|branch|完整40位SHA>' https://github.com/amywork777/studio.git text-to-cad-studio
cd text-to-cad-studio
```

### 后续更新

```sh
cd "$HOME/.local/src/text-to-cad-studio"   # <-- 改成你的存放源码的路径
git fetch --depth 1 origin tag '<new tag>' && git switch --detach '<new tag>'
git fetch --depth 1 origin '<new branch>' && git switch --detach '<new branch>'
```

## 2. 构建环境

项目中自带一个环境设置脚本 `scripts/setup-studio.sh`，但它限定了只能在 Mac 下执行。我们基于它改造出一个 Linux 版：

- 复制一个作为 Linux 版设置脚本
```sh
cp scripts/setup-studio.sh scripts/setup-studio-linux.sh
```
- 删掉其中的 mac 平台检测代码 (搜索 darwin 和 xcode-select)

- 运行脚本
```sh
scripts/setup-studio-linux.sh
```

## 6. 启动脚本

写启动脚本 `~/.local/bin/cad-studio`：

```bash
#!/usr/bin/env bash
# Starts text-to-cad Studio from this checkout, what the KDE menu's "Studio (Dev)" runs.
# Same as `pnpm studio:desktop` with the four settings below. Ctrl-C, or closing the
# terminal window, quits Studio.
set -euo pipefail

export TEXT_TO_CAD_STUDIO_HOME="$HOME/.text-to-cad-studio-dev"
export STUDIO_PROJECTS_DIR="$HOME/workspace/text-to-cad/.studio-projects"
export STUDIO_NEW_PROJECTS_DIR="$HOME/workspace/text-to-cad/studio"

RUN_SCRIPT="$HOME/.local/src/text-to-cad-studio/scripts/run-studio.sh"   # <-- 改成你的 checkout 路径

# 单实例：第二次启动会去抢 CAD engine 的 3346 端口然后失败。锁跟着进程走，
# 崩溃或 Ctrl-C 之后自动释放。
exec 9>"$TEXT_TO_CAD_STUDIO_HOME/studio-dev.lock"
if ! flock -n 9; then
  echo "Studio is already running."
  exit 0
fi

exec $RUN_SCRIPT
```

```sh
chmod +x ~/.local/bin/cad-studio
bash -n ~/.local/bin/cad-studio && echo ok
```

几个关键字都是有意为之：

- **`TEXT_TO_CAD_STUDIO_HOME`** 是 Studio 自己的状态根目录（数据库、会话历史、插件副本、`cad/state`），不设时默认是 `~/.text-to-cad-studio`，带 `TEXT_TO_CAD_DEV=1` 时是 `~/.text-to-cad-studio-dev`。它必须写绝对路径，Node 不展开 `~`。
- **`STUDIO_PROJECTS_DIR` / `STUDIO_NEW_PROJECTS_DIR`** 分别是项目记录目录和新项目文件夹位置。换一套路径就等于换一套状态，旧项目不会自动出现。
- **`exec node_modules/.bin/vpr`** 而不是 `pnpm studio:desktop`：少一层 corepack/pnpm 解析，只依赖 `node`，行为完全一致。
- **`exec 9>…` + `flock -n 9`** 做单实例：文件描述符跟着 `exec` 进到 Studio 进程里，所以锁的生命周期就是 Studio 的生命周期。

## 7. 启动

```sh
cad-studio
```

终端会先打印构建开发插件的信息，然后弹出 Electron 窗口，标题是 Studio。注意：**关掉窗口不等于退出**——dev server 还在跑，要 Ctrl-C 或关掉终端窗口，整棵进程树才会干净结束。

## 8. 开始菜单启动项（可选）

装图标（来源是仓库自带的 512×512 图标）：

```sh
install -Dm644 /path/to/text-to-cad-studio/brand/app-icon.png \
  ~/.local/share/icons/hicolor/512x512/apps/cad-studio.png
```

写菜单项 `~/.local/share/applications/cad-studio.desktop`：

```ini
[Desktop Entry]
Type=Application
Version=1.0
Name=CAD Studio
GenericName=text-to-cad Studio
Comment=Design mechanical parts with text-to-cad, from this checkout
Exec=/home/yandy/.local/bin/cad-studio
Path=/home/yandy/.local/src/text-to-cad-studio
Icon=cad-studio
Terminal=true
StartupNotify=true
Categories=Development;
Keywords=CAD;Studio;text-to-cad;engineering;mechanical;
```

验证：

```sh
desktop-file-validate ~/.local/share/applications/cad-studio.desktop  # 无输出 = 通过
kbuildsycoca6 --noincremental                # Plasma 重建菜单索引
```

三条容易踩的点：

- `Exec` 必须写绝对路径，`~` 不会被展开；
- `Icon=cad-studio` 是图标名，对应上面装进图标主题的文件名（不带扩展名）；
- `Terminal=true` 是刻意的：这套 dev 启动是「`vp pack --watch` + Electron」，带终端才能靠 Ctrl-C 把 dev server 一起收掉；而且 `Categories` 只能有一个 main category，写成 `Development;Graphics;` 会让条目在菜单里出现两次。

之后在开始菜单里搜 `CAD Studio` 就能点开。点第二次只会打印 `Studio is already running.` 然后退出，不会起第二套。
