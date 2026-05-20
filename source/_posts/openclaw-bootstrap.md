---
title: OpenClaw 零障碍安装：国内网络完全指南
toc: true
date: 2026-05-19 10:34:03
categories: ['最佳实践']
tags:
  - linux
  - xops
---

[OpenClaw](https://github.com/nicedoc/openclaw) 是一个 AI 编码助手代理，能够自主完成编码任务。

虽然网上已经有了很多搭建教程，但是一直没有完全满足我需求的方案——**仅依赖国内网络**，且**仅参考官方原版文档**，避免使用第三方魔改脚本。

核心思路：
- Python 和 Node.js 环境需要灵活的工具来管理多版本——发行版自带的往往跟不上，所以需要用 `fnm`、`uv` 这类工具管理 Python 和 Node.js；
- 用 `cargo` + 国内镜像源来安装那些官方安装脚本对网络有要求的工具（如 `fnm`、`uv`），从而保证整个链路都在国内网络下畅通无阻。

<!-- more -->

## 1. 系统工具

```bash
apt install -y git curl wget build-essential ffmpeg
```

## 2. Rust 工具链

通过 `rsproxy.cn` 镜像安装 Rust，并配置 cargo 国内源：

```bash
export RUSTUP_DIST_SERVER="https://rsproxy.cn"
export RUSTUP_UPDATE_ROOT="https://rsproxy.cn/rustup"
curl --proto '=https' --tlsv1.2 -sSf https://rsproxy.cn/rustup-init.sh | sh

cat > ~/.cargo/config.toml <<- 'EOM'
[source.crates-io]
replace-with = 'rsproxy-sparse'
[source.rsproxy]
registry = "https://rsproxy.cn/crates.io-index"
[source.rsproxy-sparse]
registry = "sparse+https://rsproxy.cn/index/"
[registries.rsproxy]
index = "https://rsproxy.cn/crates.io-index"
[net]
git-fetch-with-cli = true
EOM
```

## 3. Node.js

用 cargo 安装 `fnm`（Node 版本管理），配合阿里云镜像：

```bash
cargo install --locked fnm

cat >> ~/.bashrc <<- 'EOM'

# fnm
export FNM_NODE_DIST_MIRROR="https://mirrors.aliyun.com/nodejs-release/"
eval "$(fnm env --use-on-cd --shell bash)"
EOM

# 新开 shell 或 source ~/.bashrc 后再执行以下命令
fnm use --install-if-missing 24
npm config set registry https://registry.npmmirror.com

cat >> ~/.bashrc <<- 'EOM'

# corepack
export COREPACK_NPM_REGISTRY=$(npm config get registry)
EOM

# 新开 shell 或 source ~/.bashrc
corepack enable pnpm
pnpm setup
npm install -g bun

cat >> ~/.bashrc <<- 'EOM'

# bun
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
export BUN_CONFIG_REGISTRY="https://registry.npmmirror.com"
EOM
```

## 4. uv (Python 包管理)

使用 cargo 安装 `uv`，并配置 PyPI 国内镜像：

```bash
cargo install --locked uv

cat > ~/.config/uv/uv.toml <<- 'EOM'
[[index]]
url = "https://mirrors.aliyun.com/pypi/simple"
default = true
EOM

cat >> ~/.bashrc <<- 'EOM'

# uv
export UV_PYTHON_INSTALL_MIRROR=https://mirrors.ustc.edu.cn/github-release/astral-sh/python-build-standalone/
export PATH="$PATH:$HOME/.local/bin"
EOM
```

## 5. OpenClaw

```bash
pnpm add -g --allow-build=openclaw openclaw@latest
openclaw onboard --install-daemon
```
