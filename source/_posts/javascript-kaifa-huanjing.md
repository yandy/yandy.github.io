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

| fnm/electron/nextjs | Windows | WSL | Container |
| --- | --- | --- | --- |
| 开发环境(VS Code with Extension) | ✓ | ✕ | ✓ |

<!-- more -->

## 2. Windows

```pwsh
# 安装
# https://github.com/Schniz/fnm?tab=readme-ov-file#installation
winget install -e --id Schniz.fnm
# or using cargo if you have rust installed
# cargo install fnm

# 配置
fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression

# 更新 $PROFILE
Add-Content -Path $PROFILE -Value @'
# fnm
fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression

'@

# 安装 node
fnm use --install-if-missing 22

# 设置 npm 源
npm config set registry https://registry.npmmirror.com

# 设置 electron 源
Add-Content -Path $PROFILE -Value @'
# electron
$env:ELECTRON_MIRROR = "https://npmmirror.com/mirrors/electron/"

'@
```

## 3. Container

参考 [项目模板](https://github.com/yandy/project-tmpl)： [next](https://github.com/yandy/project-tmpl/tree/main/next)
