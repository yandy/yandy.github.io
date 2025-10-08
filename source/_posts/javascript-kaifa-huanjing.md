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

| fnm/electron/nextjs | Windows | WSL |
| --- | --- | --- |
| 开发环境(VS Code with Extension) | ✓ | ✓ |

<!-- more -->

## 2. Windows

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

'@

# 安装 node (open in a new terminal tab)
fnm use --install-if-missing 22

# 设置 npm 源
npm config set registry https://registry.npmmirror.com

# 设置 electron 源
Add-Content -Path $PROFILE -Value @'
# electron
$env:ELECTRON_MIRROR = "https://npmmirror.com/mirrors/electron/"

'@
```

## 3. WSL

```bash
# 安装
curl -fsSL https://fnm.vercel.app/install | bash

# 打开新终端
# 安装 node (open in a new terminal tab)
fnm use --install-if-missing 22

# 设置 npm 源
npm config set registry https://registry.npmmirror.com
```
