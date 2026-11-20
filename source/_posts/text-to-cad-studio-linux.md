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

```sh
cd "$HOME/.local/src"   # <-- 改成你的存放源码的路径
git clone --depth 1 https://github.com/amywork777/studio.git text-to-cad-studio
cd text-to-cad-studio
git submodule update --init text-to-cad      # 带路径；不要加 --recurse-submodules
cat text-to-cad/VERSION                      # 打印版本号
ls text-to-cad/.claude-plugin/marketplace.json
git submodule status text-to-cad             # 行首空格 + sha == git ls-tree HEAD text-to-cad
```

CAD 能力全在 `text-to-cad` 子模块里，Studio 启动时会先检查它的 `.claude-plugin/marketplace.json`，缺了就直接退出。

**子模块命令一定要带路径**，这不是风格问题：仓库索引里有 vendored 的 gitlink（`.repos/alchemy-effect/...`），但 `.gitmodules` 只声明了 `text-to-cad`，所以不带路径的 `git submodule status` 和任何 `--recurse-submodules` 都会报 `no submodule mapping found`。

最后那条检查点的含义是：行首是一个空格（而不是 `-` 或 `+`），且 sha 与父仓库记录的 pin 一致，说明子模块处在干净状态。

## 2. 确认 Node.js 26 环境

monorepo 的 `package.json` 里 `engines.node` 写的是 `26.12.1`：

```sh
node -v              # 期望是 v26.x
```

低于 26 通常只是告警——`vite-plus@1.4.0` 自身允许 `^24.11.0`，我一开始就是在 24 上把依赖装完的。但如果哪一步真被 `engines` 拦下来，切到 26 重跑即可。

**具体用哪种方式装 Node 26 随意，下面只是我用的 `fnm`**；`nvm`、`volta`、发行版包、官方二进制都一样，本质是让 `PATH` 上的 `node` 是 26.x：

```sh
fnm install 26.12.1
fnm use 26.12.1
node -v              # 再确认一次
```

换 Node 大版本**不需要重装 `node_modules`**：它按项目放，不按 Node 版本，而且这个仓库里没有按 ABI 编译的原生模块（`node-pty`、`sharp`、`koffi` 都是 N-API 或按平台的 prebuild）。唯一代价是 `engines` 是个精确值，切过去之后建议在第 3 步重跑一次 `vp install`（store 命中，十几秒）。

## 3. 装 monorepo

```sh
npx --yes -p vite-plus@1.4.0 vp install
# 检查点
ls node_modules/.bin/vp node_modules/.bin/vpr
```

仓库用 vite-plus 的 `vp` 管依赖，版本在 catalog 里固定为 `1.4.0`。本机没有全局 `vp`，所以用 `npx` 临时拉这个版本执行安装。

## 4. 下载 Electron 运行时

```sh
(cd apps/desktop && node scripts/ensure-electron-runtime.mjs)
# 检查点
(cd apps/desktop && node -e "console.log(require('./node_modules/electron'))")
```

Electron 从某个版本起不再带 install 脚本，运行时得单独拉一次。

## 5. 准备 text-to-cad（checkout 版插件要用）

```sh
cd text-to-cad
uv venv --clear --python 3.14 .venv
uv pip install --python .venv/bin/python -r requirements-dev.txt
uv pip install --python .venv/bin/python --editable "./packages/cad[build123d,trimesh,netgen,calculix]"
npm ci
npm run build:packages
scripts/bundle/bundle.sh
cd ..
# 检查点
text-to-cad/.venv/bin/python -c "import cad_mcp.shim, cad_server.cli, OCP, netgen, cad_ccx, trimesh; print('ok')"
```

这一步就是在造一个独立的 Python 3.14 环境，把 CAD 建模、网格、求解所需的二进制全装进去。最后那行 `import` 检查点跑通，说明建模、网格、求解、导出四条链路都齐了。

## 6. 启动脚本

写启动脚本 `~/.local/bin/cad-studio`：

```bash
#!/usr/bin/env bash
# Starts text-to-cad Studio from this checkout, what the KDE menu's "Studio (Dev)" runs.
# Same as `pnpm studio:desktop` with the four settings below. Ctrl-C, or closing the
# terminal window, quits Studio.
set -euo pipefail

ROOT="$HOME/.local/src/text-to-cad-studio"   # <-- 改成你的 checkout 路径

export TEXT_TO_CAD_STUDIO_HOME="$HOME/.text-to-cad-studio-dev"
export TEXT_TO_CAD_DEV=1
export STUDIO_PROJECTS_DIR="$HOME/workspace/text-to-cad/.studio-projects"
export STUDIO_NEW_PROJECTS_DIR="$HOME/workspace/text-to-cad/studio"

cd "$ROOT"

# 单实例：第二次启动会去抢 CAD engine 的 3346 端口然后失败。锁跟着进程走，
# 崩溃或 Ctrl-C 之后自动释放。
exec 9>"$TEXT_TO_CAD_STUDIO_HOME/studio-dev.lock"
if ! flock -n 9; then
  echo "Studio is already running."
  exit 0
fi

exec node_modules/.bin/vpr studio:desktop
```

```sh
chmod +x ~/.local/bin/cad-studio
bash -n ~/.local/bin/cad-studio && echo ok
```

几个关键字都是有意为之：

- **`TEXT_TO_CAD_STUDIO_HOME`** 是 Studio 自己的状态根目录（数据库、会话历史、插件副本、`cad/state`），不设时默认是 `~/.text-to-cad-studio`，带 `TEXT_TO_CAD_DEV=1` 时是 `~/.text-to-cad-studio-dev`。它必须写绝对路径，Node 不展开 `~`。
- **`TEXT_TO_CAD_DEV=1`** 决定跑哪套 CAD 工具。不设时 Studio 会用 `uvx` 从 PyPI 拉发布版 `cad-mcp`，技能只有 Jake 自带的 10 个；设了才用第 5 步刚建好的 `.venv`，并多出 `fdm`、`export`、`board-fab`、`cnc` 这批 job 技能。**建议始终带上。**
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
