---
title: Windows Terminal 美化
toc: true
date: 2024-11-02 23:13:52
categories: ['最佳实践']
tags:
  - windows
  - xops
---

## oh-my-posh

[oh-my-posh](https://ohmyposh.dev/) 提供 Git 状态颜色编码和提示的完全自定义命令提示符体验提供主题功能。

![](ohmyposh.png)

<!-- more -->

#### 安装字体

安装 [Nerd Font](https://www.nerdfonts.com/font-downloads)，选择 [Cascadia Code NF](https://github.com/microsoft/cascadia-code/releases) 字体。
安装方式：下载字体 `.zip`，解压后，双击对应的 `.ttf` 文件


#### 设置 Windows Terminal 字体

`ctrl+,`打开配置界面，选择 "配置文件" -> "其他设置" -> "外观" -> "字体" ，设置为 `Cascadia Code NF`

#### 安装 oh-my-posh

###### windows(powershell)

```pwsh
# 安装
winget install JanDeDobbeleer.OhMyPosh -s winget

# [如果]powershell执行策略不对，设置执行策略为只有远程脚本需要签名，也就是本地脚本不需要签名
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 配置$PROFILE
Add-Content -Path $PROFILE -Value @'
# oh-my-posh
oh-my-posh init pwsh | Invoke-Expression

'@
```

###### wsl(bash)

```bash
# 安装
curl -s https://ohmyposh.dev/install.sh | bash -s

# 配置 ~/.profile
cat >> ~/.profile <<- 'EOM'

# oh-my-posh
eval "$(oh-my-posh init bash)"
EOM
```

## Terminal-Icons (for Powershell)

[Terminal-Icons](https://github.com/devblackops/Terminal-Icons) is a PowerShell module that adds file and folder icons when displaying items in the terminal

#### 安装

```pwsh
# 安装
Install-Module -Name Terminal-Icons -Repository PSGallery -Scope CurrentUser
# 配置 $PROFILE
Add-Content -Path $PROFILE -Value @'
# Terminal-Icons
Import-Module -Name Terminal-Icons

'@
```

#### 用法

```pwsh
Get-Item ./README.md

Get-ChildItem

Get-ChildItem | Format-List

Get-ChildItem | Format-Wide
```
