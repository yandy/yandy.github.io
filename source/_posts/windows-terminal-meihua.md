---
title: Windows Terminal 美化
toc: true
date: 2024-11-02 23:13:52
categories: ['最佳实践']
tags:
  - windows
  - xops
---

## 1. oh-my-posh

[oh-my-posh](https://ohmyposh.dev/) 提供 Git 状态颜色编码和提示的完全自定义命令提示符体验提供主题功能。

![](ohmyposh.png)

<!-- more -->


### 1.1. 安装 oh-my-posh

#### windows(powershell)

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

#### wsl(bash)

```bash
# 安装
sudo apt-get install -y unzip
curl -s https://ohmyposh.dev/install.sh | bash -s

# 配置 ~/.bashrc
cat >> ~/.bashrc <<- 'EOM'

# oh-my-posh
eval "$(oh-my-posh init bash)"
EOM
```

### 1.2. 安装字体

```sh
oh-my-posh font install
# This will present a list of Nerd Font libraries, from which you can select Meslo, which includes the Meslo LGM NF font we recommend. Note that you can also install it directly via:
oh-my-posh font install meslo
```

**设置 Windows Terminal 字体**

`CTRL + SHIFT + ,`打开配置文件，加入字体设置：

```json
{
    "profiles":
    {
        "defaults":
        {
            "font":
            {
                "face": "MesloLGM Nerd Font"
            }
        }
    }
}
```

## 2. Terminal-Icons (for Powershell)

[Terminal-Icons](https://github.com/devblackops/Terminal-Icons) is a PowerShell module that adds file and folder icons when displaying items in the terminal

### 2.1. 安装

```pwsh
# 安装
Install-Module -Name Terminal-Icons -Repository PSGallery -Scope CurrentUser
# 配置 $PROFILE
Add-Content -Path $PROFILE -Value @'
# Terminal-Icons
Import-Module -Name Terminal-Icons

'@
```

### 2.2. 用法

```pwsh
Get-Item ./README.md

Get-ChildItem

Get-ChildItem | Format-List

Get-ChildItem | Format-Wide
```
