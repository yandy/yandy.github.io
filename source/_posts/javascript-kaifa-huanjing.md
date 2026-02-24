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

| Windows | WSL |
| --- | --- |
| ✓ | ✓ |

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
$env:ELECTRON_MIRROR = "https://npmmirror.com/mirrors/electron/"

'@

# 安装 node (open in a new terminal tab)
fnm use --install-if-missing 22

# 设置 npm 源
npm config set registry https://registry.npmmirror.com
```

## 3. WSL

```bash
# 安装
curl -fsSL https://fnm.vercel.app/install | bash
```

将 fnm 相关shell配置从 `.bashrc` 移到 `.profile`，并在fnm相关shell配置block中增加如下环境变量定义：
```bash
export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
export FNM_NODE_DIST_MIRROR="https://mirrors.aliyun.com/nodejs-release/"
```

打开新终端
```bash
# 安装 node (open in a new terminal tab)
fnm use --install-if-missing 22

# 设置 npm 源
npm config set registry https://registry.npmmirror.com
```
