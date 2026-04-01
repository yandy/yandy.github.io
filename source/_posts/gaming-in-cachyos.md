---
title: Cachy OS 下游戏相关配置优化
toc: true
date: 2026-03-31 09:38:44
categories:
  - 按图索骥
tags:
  - game
  - linux
  - xops
---

Cachy OS 是一个基于 Arch Linux 的为性能专门优化的发行版，尤其是针对游戏性能的优化。它通过优化游戏性能和提供游戏专用的硬件加速，为玩家提供更流畅的游戏体验。

充分利用发行版本身的优化配置，玩家可以在 Cachy OS 下获得更好的游戏性能。

## 前提条件

默认情况下，Cachy OS 已经为你安装好了显卡驱动。此外 Cachy OS还准备了2个游戏专用的元包，用于安装游戏相关的软件包。

```
sudo pacman -S cachyos-gaming-meta cachyos-gaming-applications
```
<!-- more -->

## 游戏兼容层

Proton 是一个基于 Wine 的游戏兼容层，用于在 Linux 上运行 Windows游戏。CachyOS 默认提供了 2 个兼容层： Proton-CachyOS 和 Wine-CachyOS。

#### Proton-CachyOS
Proton-CachyOS 基于 Proton 的`bleeding-edge`分支，并在其基础上进行了多项修改:

- Wine-staging 补丁
- Wine 全屏 FSR
- 包含游戏过场动画的视频和音频编解码器
- 支持 umu-launcher，包括 UMU-Protonfixes
- 为游戏添加早期热修复/临时解决方案

`cachyos-gaming-meta` 包含了 Proton-CachyOS，且默认安装的是 slr 版本： `proton-cachyos-slr`

#### Wine-CachyOS

这与作为 wine 核心的 proton-cachyos 是同一款，但它是一个独立的软件包。可在 Lutris、Heroic、Bottles 等平台中使用。

在 CachyOS 软件源中，Wine-CachyOS 由两个不同的软件包提供。`wine-cachyos` 将其作为系统默认的 Wine 安装，并替换 `wine` 或 `wine-staging`。`wine-cachyos-opt` 将其安装在不同目录，这能让系统中同时存在多个 Wine 版本。`cachyos-gaming-meta` 默认安装的是 `wine-cachyos-opt`，这也是推荐的做法，即: Wine-CachyOS 不作为默认 Wine。

## Steam 配置优化

#### 如何选择兼容层

有很多兼容层可以选择，这里列举2个关键的

- `proton-cachyos-slr` 是由 CachyOS 维护者构建和维护的版本。由于其具备多种实用功能、修复补丁和优化项，强烈推荐使用该版本。对于使用反作弊系统（如 BattlEye 或 Easy Anti-Cheat）或自定义启动器的游戏，优先选择 `proton-cachyos-slr`。
- `Proton Experimental` 是 Valve 推出的前沿版本。如果你想玩的游戏比较新、无法在当前稳定版 Proton 上正常运行，或者有人在ProtonDB上推荐使用它，就可以选择这个版本。

#### 如何正确设置多个启动选项

Steam 中的启动选项是按照以下**模式**构建的:

```
<env variables> <wrappers> %command% <application arguments>
```

- `<env variables>`：这些是`VARIABLE=value`形式的选项，例如：

```
PROTON_DXVK_D3D8=1 DXVK_HUD="fps,memory,version,api"
```

- `<wrappers>`：这些是用于修改真实应用程序运行方式的应用程序prime-run和脚本。包装器的参数通常跟在包装器的可执行文件之后，例如：

```
gamescope -W 1680 -H 1050 -w 1280 -h 720 -S fit -F nis --mangoapp --
```

- `%command%`：这是实际的应用程序。应完全按原样指定它，Steam 会在运行应用程序时将其替换为正确的命令。

- `<application arguments>`：这些是传递给实际应用程序的各类参数，具体内容取决于应用程序本身，例如：

```
%command% -dx11
```

包含所有元素的**完整**启动选项示例：

```sh
# 示例1
PROTON_DLSS_UPGRADE=1 PROTON_ENABLE_WAYLAND=1 PROTON_NO_WM_DECORATION=1 PROTON_ENABLE_HDR=1 game-performance %command% -dx11
# 示例2
PROTON_DLSS_UPGRADE=1 PROTON_NO_WM_DECORATION=1 PROTON_ENABLE_HDR=1 gamescope -W 1920 -H 1080 -w 1280 -h 720 -S fit -F nis --hdr-enabled --mangoapp -- %command% -dx11
```

[一些重要的环境变量](https://wiki.cachyos.org/configuration/gaming/#environment-variables)


#### 着色器配置

**关闭着色器预缓存功能**

在使用 Proton-CachyOS、Proton-GE 或 Proton-EM 时，建议关闭 Steam 的着色器预缓存功能。这些工具本身已包含在游戏内播放视频所需的所有编解码器，而如今，一套相对较新的显卡和处理器组合完全能够胜任在游戏中编译着色器的工作。关闭着色器预缓存功能方法如下：

在 Steam 中，点击Steam→Settings，进入Downloads选项卡，然后**取消勾选**以下设置：
- Enable Shader Pre-caching(启用着色器预缓存)
- Allow background processing of Vulkan shaders(允许 Vulkan 着色器进行后台处理)

**增加着色器缓存最大容量**

着色器缓存的文件大小存在最大限制，一旦超出默认大小，旧的着色器就会被清除。这可能会成为一个问题，因为大型游戏的着色器大小可能超过1GB，这会导致游戏每次启动时都需要重新编译着色器。

```sh
mkdir -p ~/.config/environment.d
touch ~/.config/environment.d/gaming.conf
vim ~/.config/environment.d/gaming.conf
```

```
# Increase Nvidia's shader cache size to 12GB
__GL_SHADER_DISK_CACHE_SIZE=12000000000
```
