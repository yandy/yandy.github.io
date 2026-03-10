---
title: Javascript 开发环境
toc: true
date: 2024-11-06 15:38:24
categories: ['最佳实践']
tags:
  - js
  - xops
---

## 1. Overview

| Windows | Linux/WSL |
| --- | --- |
| ✓ | ✓ |

## 2. Windows

### 2.1. fnm

<!-- more -->

```pwsh
# 安装
# https://github.com/Schniz/fnm?tab=readme-ov-file#installation
winget install -e --id Schniz.fnm
# or using cargo if you have rust installed
# cargo install fnm

# 更新 $PROFILE
Add-Content -Path $PROFILE -Value @'
# fnm
$env:FNM_NODE_DIST_MIRROR = "https://mirrors.aliyun.com/nodejs-release/"
fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression
$env:ELECTRON_MIRROR = "https://npmmirror.com/mirrors/electron/"

'@

# 安装 node (open in a new terminal tab)
fnm use --install-if-missing 22

# 设置 npm 源
npm config set registry https://registry.npmmirror.com
```

### 2.2. bun

#### 安装

```pwsh
powershell -c "irm bun.sh/install.ps1|iex"
```

#### 设置国内源

```pwsh
Add-Content -Path $PROFILE -Value @'
$env:BUN_CONFIG_REGISTRY = "https://registry.npmmirror.com"

'@
```

## 3. Linux/WSL

### 3.1. fnm

#### 安装
```bash
curl -fsSL https://fnm.vercel.app/install | bash
```

#### 设置国内源

**for bash**

`$HOME/.bashrc`

```bash
export FNM_NODE_DIST_MIRROR="https://mirrors.aliyun.com/nodejs-release/"
export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
```

**for fish**

`$HOME/.config/fish/conf.d/fnm.fish`

```fish
set FNM_NODE_DIST_MIRROR "https://mirrors.aliyun.com/nodejs-release/"
set ELECTRON_MIRROR "https://npmmirror.com/mirrors/electron/"
```

**打开新终端**

```sh
# 安装 node (open in a new terminal tab)
fnm use --install-if-missing 22

# 设置 npm 源
npm config set registry https://registry.npmmirror.com
```

### 3.2. bun

#### 安裝

```sh
curl -fsSL https://bun.com/install | bash
```

#### 设置国内源


**for bash**

`$HOME/.bashrc`

```sh
export BUN_CONFIG_REGISTRY="https://registry.npmmirror.com"
```

**for fish**

`$HOME/.config/fish/config.fish`

```sh
set --export BUN_CONFIG_REGISTRY "https://registry.npmmirror.com"
```
