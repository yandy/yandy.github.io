---
title: Cachy OS(ArchLinux) 入坑记录
toc: true
date: 2026-03-10 19:55:11
categories: ['最佳实践']
tags:
  - linux
  - xops
---

最近决定把自己的桌面操作系统换成 Linux，做个入坑记录。我之前有十几年Linux server和几年Mac OS的使用经验，所以这次入坑也算有些基础。

我选择的Linux发行版是 [Cachy OS](https://cachyos.org/)，它是一个基于ArchLinux的发行版。之所以选择它，一方面是想体验下 ArchLinux 的滚动更新策略，我喜欢保持系统最新；一方面是听说它对于显卡驱动和性能优化做的比较好，最后是它默认使用了 plasma 桌面环境。

<!-- more -->

## 1. 安装Cachy OS

### 1.1. 制作启动盘。

我下载了 Cachy OS 的 ISO 镜像文件，然后使用 [balena etcher](https://www.balena.io/etcher/) 工具将其写入 USB 启动盘。

> 注: 如果官方镜像下载速度较慢，也可以从 [中科大镜像站](https://mirrors.ustc.edu.cn/) 下载。


### 1.2. 安装Cachy OS

插入 USB 启动盘，重启电脑，进入 BIOS 设置，将启动顺序设置为 USB 启动盘优先。需要注意一点，必须**关闭 Secure Boot**。
关于 BIOS 设置，各品牌的电脑可能有不同的设置方法，这里就不展开了。

然后按照 Cachy OS 的安装向导进行安装即可。


## 2. 包管理器

### 2.1. pacman 包管理器

```
# 核心更新 / 安装 / 卸载：
## 更新
sudo pacman -Syu
## 安装
sudo pacman -S 包名
## 卸载
sudo pacman -Rns 包名

# 查询关键命令：
## 搜仓库
pacman -Ss 关键词
## 查已装包信息
pacman -Qi 包名
## 查文件归属
pacman -Qo 文件名

# 清理维护：
## 清缓存
sudo pacman -Sc
## 查孤立包
pacman -Qdt
## 删孤立包
sudo pacman -Rns $(pacman -Qdtq)
```

### 2.2. paru (AUR 助手)

Cachy OS 默认安装了 paru 作为 AUR 助手

```
# 安装软件
paru -S 包名
# 搜索软件
paru -Ss 关键词
# 更新系统（官方 + AUR）
paru -Syu
# 仅更新 AUR 包
paru -Sua
# 卸载软件
paru -Rns 包名
```

## 3. 配置中文输入法

Cachy OS 默认使用了 plasma 桌面环境，所以我需要配置输入法。我选择了 [fcitx5](https://fcitx-im.org/wiki/Fcitx5) 作为输入法框架，[fcitx5-rime](https://github.com/fcitx/fcitx5-rime) 作为 Rime 输入法。

> 参考 [fcitx5 中文输入法配置](https://wiki.archlinuxcn.org/wiki/Fcitx_5)

### 3.1. 安装 fcitx5-rime 和 fcitx5-configtool

```sh
sudo pacman -S fcitx5-rime fcitx5-configtool
```
### 3.2. 配置fcitx5

用 Wayland 输入法协议，首先退出正在运行的 Fcitx 5 进程，前往"系统设置 > 输入与输出 > 键盘 > 虚拟键盘"，选择 "Fcitx 5 Wayland 启动器"。

前往 "系统配置 > 输入法 > 配置全局选项" 配置相关快捷键，例如 `Super(Win) + Space` 切换输入法。


## 4. 上网代理

```sh
# install clash verge rev

paru -S clash-verge-rev-bin
```

## 5. 常用工具

```sh
# 1. git
git config --global user.name "Your Full Name"
git config --global user.email "you@email.com"

# 2. vscode
paru -S "visual-studio-code-bin"

# 3. edge/chrome
```

## 6. 美化

### 6.1. konsole
