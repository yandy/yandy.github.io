---
title: 基于 "VSCode Remote Devlopment" 进行开发时，如何共享 Windows 下的Git认证信息给Remote
date: 2025-02-07 22:57:43
toc: true
categories: [ 按图索骥 ]
tags:
  - git
  - xops
---

在Windows下，使用 [VSCode](https://code.visualstudio.com/) 做Linux应用开发，可以使用 [VSCode Remote Devlopment](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.vscode-remote-extensionpack) 实现。

那么在 Remote 环境下进行 Git 同步时，我们希望直接使用 Windows下的 Git 认证信息，而不是在 Remote 端重复配置。这样就可以做到Git认证信息只存在于Windows上，而避免扩散到 Remote上。

那么如何共享 Windows下的Git认证信息给Remote呢？
<!-- more -->

我们分四种情况介绍：

| git protocol\Remote: | WSL | DevContainer |
|---|---|---|
| HTTP(s) | 场景1 | 场景2 |
| SSH | 场景3 | 场景4 |

### 1. HTTP(s) 认证信息的共享

对于 HTTP 认证信息，Remote Development 的支持是非常好的：

#### 1.1. Remote WSL(场景1)

在 WSL 下执行：

```bash
git config --global credential.helper "/mnt/c/Program\ Files/Git/mingw64/bin/git-credential-manager.exe"
```

#### 1.2. Remote DevContainer(场景2)

自动支持，无需手动配置

### 2. SSH 认证信息的共享

#### 2.1. Remote WSL(场景3)

有两种方案：

`1.` 在WSL中，使用 Windows 的SSH套件

```bash
# 仅替换 git 用到的 ssh
git config --global core.sshcommand "ssh.exe"
```
或
```bash
# 替换 wsl 用户的 ssh
cat >> ~/.bashrc <<- 'EOF'
alias ssh-add='ssh-add.exe'
alias ssh='ssh-add.exe -l > /dev/null || ssh-add.exe && echo -e "\e[92mssh-key(s) are now available in your ssh-agent until you lock your windows machine! \n \e[0m" && ssh.exe'
EOF
```

`2.` 在WSL中，利用 ssh-agent 机制，将wsl下的ssh认证工作代理给Windows下的ssh-agent。

但是需要注意的是，Linux 下的ssh-agent 和 Windows下的ssh-agent 通信协议**不兼容**。需要**替换**WSL自带的 `ssh-agent`为 适配过 WSL 的 版本，如 [wsl2-ssh-agent](https://github.com/mame/wsl2-ssh-agent)

同时在Windows端开启 `ssh-agent`:

```pwsh
# Make sure you're running as an Administrator, run in Powershell
Set-Service ssh-agent -StartupType Automatic
Start-Service ssh-agent # first time
Get-Service ssh-agent # check status
```

> 注：具体不兼容的原因如下：
> Windows的 openssh 中，ssh-agent的实现 和 Linux版本的有区别，linux版本用的是 unix socket，windows版本用的是 named pipe，所以linux自带的ssh-agent无法使用 windows 端的 ssh-agent service，需要将linux自带的ssh-agent 变更为支持 named pipeline 的版本

#### 2.2. Remote DevContainer(场景4)

只需在Windows端开启 `ssh-agent`:

```pwsh
# Make sure you're running as an Administrator, run in Powershell
Set-Service ssh-agent -StartupType Automatic
Start-Service ssh-agent # first time
Get-Service ssh-agent # check status
```

Remote DevContainer 扩展会自动将 Windows 下 `ssh-agent`的`named pipeline`映射为 Remote Container 中的 `Unix socket`
