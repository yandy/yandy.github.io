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

## 3. 开始菜单启动项

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
Exec=/path/to/text-to-cad-studio/scripts/run-studio.sh
Path=/path/to/text-to-cad-studio
Icon=cad-studio
Terminal=true
StartupNotify=true
Categories=Development;
Keywords=CAD;Studio;text-to-cad;engineering;mechanical;
```

如果想覆盖一些默认路径，可以增加如下环境变量

- **`TEXT_TO_CAD_STUDIO_HOME`** 是 Studio 自己的状态根目录（数据库、会话历史、插件副本、`cad/state`），不设时默认是 `~/.text-to-cad-studio`，带 `TEXT_TO_CAD_DEV=1` 时是 `~/.text-to-cad-studio-dev`。它必须写绝对路径，Node 不展开 `~`。
- **`STUDIO_PROJECTS_DIR` / `STUDIO_NEW_PROJECTS_DIR`** 分别是项目记录目录和新项目文件夹位置。默认分别为 `~/studio-projects` / `~/Documents/Studio`

覆盖方法是：将以上 `cad-studio.desktop` 中 `Exec=` 改写为：

`Exec=env TEXT_TO_CAD_STUDIO_HOME=/path/to/studio-home STUDIO_PROJECTS_DIR=/path/to/studio-projects STUDIO_NEW_PROJECTS_DIR=/path/to/studios /path/to/text-to-cad-studio/scripts/run-studio.sh`

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
