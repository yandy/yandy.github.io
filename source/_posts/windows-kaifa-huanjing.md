---
title: Windows 开发环境
toc: true
date: 2024-10-06 19:05:50
categories: ['最佳实践']
tags:
  - windows
  - xops
---


## 基础工具

### 网络工具

[Clash Verge](https://clashverge.net/)

### IDE

- 下载并安装 [VSCode](https://code.visualstudio.com/) 或者通过 Microsoft Store
- 登录微软账号，开启[配置同步](https://code.visualstudio.com/docs/editor/settings-sync)，注意配置不同步 `UI状态`

### Powershell

```pwsh
winget install --id Microsoft.PowerShell -e --source winget
```

打开新安装 powershell

```pwsh
# 创建 profile
New-Item -Path $PROFILE -Type File -Force
```

<!-- more -->

### Windows Terminal

Windows Terminal的{% post_link windows-terminal-meihua '美化' %}


### Docker Desktop

- 下载并安装 [Docker Desktop](https://docs.docker.com/desktop/)
- 设置 proxy 和 proxy bypass
  - proxy: `http://127.0.0.1:7892`
  - proxy bypass: `mirrors.ustc.edu.cn,registry.npmmirror.com,*.aliyun.com,*.cn`

### Git

安装和配置:

```pwsh
# 安装
winget install --id Git.Git -e --source winget

# 配置
git config --global user.name "Michael Ding"
git config --global user.email "yandy.ding@gmail.com"
```

自动补全：

```pwsh
# 安装
Install-Module -Name posh-git -Repository PSGallery -Scope CurrentUser

# 配置 $PROFILE
Add-Content -Path $PROFILE -Value @'
# posh-git
Import-Module -Name posh-git

'@
```

### Custom Cmdline

```pwsh
mkdir "$HOME\AppData\Local\CmdTools"

Add-Content -Path $PROFILE -Value @'
# cmdline tools
$env:PATH = "$HOME\AppData\Local\CmdTools;$env:PATH"

'@
```

## Language

- {% post_link cpp-kaifa-huanjing 'C++' %}
- {% post_link javascript-kaifa-huanjing 'Javascript' %}
