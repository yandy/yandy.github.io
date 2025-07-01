---
title: Windows 开发环境
toc: true
date: 2024-10-06 19:05:50
categories: ['最佳实践']
tags:
  - windows
  - xops
---


## 1. 基础工具

### 1.1. 网络工具

[Clash Verge](https://clashverge.net/)

### 1.2. IDE

- 下载并安装 [VSCode](https://code.visualstudio.com/) 或者通过 Microsoft Store
- 登录微软账号，开启[配置同步](https://code.visualstudio.com/docs/editor/settings-sync)，注意配置不同步 `UI状态`

### 1.3. Windows Powershell

```pwsh
# 创建 profile
New-Item -Path $PROFILE -Type File

# 配置执行策略, 参考 https:/go.microsoft.com/fwlink/?LinkID=135170
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

<!-- more -->

### 1.4. WSL(Windows Subsystem for Linux)

{% post_link wsl-kaifa-huanjing '安装 WSL' %}

### 1.5. Windows Terminal

Windows Terminal的{% post_link windows-terminal-meihua '美化' %}


### 1.6. Docker Desktop

下载并安装 [Docker Desktop](https://docs.docker.com/desktop/)

### 1.7. Git

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

### 1.8. 7-zip

安装 [7-zip](https://sparanoid.com/lab/7z/)

```pwsh
winget install --id 7zip.7zip -e --source winget
```

### 1.9. Custom Cmdline

```pwsh
mkdir "$HOME\AppData\Local\CmdTools"

Add-Content -Path $PROFILE -Value @'
# cmdline tools
$env:PATH = "$HOME\AppData\Local\CmdTools;$env:PATH"

'@
```

## 2. Language

- {% post_link cpp-kaifa-huanjing 'C++' %}
- {% post_link javascript-kaifa-huanjing 'Javascript' %}
- {% post_link python-kaifa-huanjing 'Python' %}
