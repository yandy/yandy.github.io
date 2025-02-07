---
title: Powershell 下的 git 自动补全
toc: true
date: 2024-11-10 23:37:49
categories: ['按图索骥']
tags:
  - git
  - xops
  - pwsh
---

Powershell(Windows) 下实现 git 自动补全，可以通过 [Posh-Git](https://github.com/dahlbyk/posh-git)

<!-- more -->

```pwsh
# 安装
Install-Module -Name posh-git -Repository PSGallery -Scope CurrentUser

# 配置 $PROFILE
Add-Content -Path $PROFILE -Value @'
# posh-git
Import-Module -Name posh-git

'@
```
