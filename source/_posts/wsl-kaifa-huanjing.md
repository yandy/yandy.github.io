---
title: WSL开发环境
toc: true
date: 2024-10-06 22:28:33
categories: ['最佳实践']
tags:
  - linux
  - windows
  - devops
---

## 安装和配置 WSL

[WSL](https://learn.microsoft.com/en-us/windows/wsl/about) 全称 Windows Subsystem for Linux

Windows Powershell 中执行：

```pwsh
# install wsl, run as administrator
wsl --install

Add-Content -Path $HOME\.wslconfig -Value @'
[wsl2]
networkingMode=mirrored
'@

# set firewall, run as Administrator
# ref: https://learn.microsoft.com/en-us/windows/security/operating-system-security/network-security/windows-firewall/hyper-v-firewall
Set-NetFirewallHyperVVMSetting -Name '{40E0AC32-46A5-438A-A0B2-2B479E8F2E90}' -DefaultInboundAction Allow
```
<!-- more -->

WSL 中执行：

```bash
# backup ubuntu apt source
sudo cp /etc/apt/sources.list.d/ubuntu.sources{,.bak}
# config ubuntu apt source mirror
sudo sed -i 's@//.*archive.ubuntu.com@//mirrors.aliyun.com@g' /etc/apt/sources.list.d/ubuntu.sources
sudo sed -i 's@//.*security.ubuntu.com@//mirrors.aliyun.com@g' /etc/apt/sources.list.d/ubuntu.sources
# update apt and install aptitude
sudo apt update && sudo apt install aptitude

# config git
git config --global user.name "Michael Ding"
git config --global user.email "yandy.ding@gmail.com"
```


## WSL 管理

Windows Powershell 中

```pwsh
# reduce wsl virtual disk file
# run as administrator
cd $HOME\AppData\Local\Packages\<WSL Distro>\LocalState
Optimize-VHD -Path .\ext4.vhdx -Mode full
```

## Language

- {% post_link cpp-kaifa-huanjing 'C++' %}
- {% post_link python-kaifa-huanjing 'Python' %}
