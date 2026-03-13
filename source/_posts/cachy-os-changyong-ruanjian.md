---
title: cachy os 下常用桌面软件安装与配置
toc: true
date: 2026-03-12 11:17:56
categories: ['最佳实践']
tags:
  - linux
  - xops
---

## 1. 常用桌面软件安装策略

有以下几种 安装策略

1. 从官方仓库安装 (`pacman`)
2. 从 AUR 安装 (`paru`)
3. `bun`/`cargo` 等程序包管理器安装 (`bun`/`cargo`)
4. 使用 `android` 版 (`waydroid`)
5. `wine`/`proton`

以下是针对一些常用软件， 我的安装策略

## 2. 从官方仓库安装

**Steam 在内的游戏相关程序和优化项**

```sh
sudo pacman -Syu cachyos-gaming-meta cachyos-gaming-applications
```

**vlc media player**

```sh
sudo pacman -S vlc
```

**blender**

```sh
sudo pacman -S blender
```

**kicad**

```sh
sudo pacman -S kicad
```

**freecad**

```sh
sudo pacman -S freecad
```

<!-- more -->

## 3. AUR 安装

**visual studio code**
```sh
paru -S visual-studio-code-bin
```

**microsoft edge**
```sh
paru -S microsoft-edge-stable-bin
```

**微信**
```sh
paru -S wechat-appimage
```

**wps office**

```sh
paru -S wps-office-cn wps-office-mime-cn wps-office-mui-zh-cn ttf-wps-fonts
```
> 应用程序起动器 -> 右键 {WPS 相关软件} -> 编辑应用程序-> 环境变量:
> `QT_IM_MODULE=fcitx`
>
> 打开能启动的 WPS 文字，点击右上角的 设置（齿轮图标）-> 其他 -> 切换窗口管理模式。将模式从“整合模式”改为 “多组件模式”，然后重启 WPS

**飞书**
```sh
paru -S "feishu-bin"
echo '--ozone-platform=wayland --enable-wayland-ime --wayland-text-input-version=3' > ~/.config/feishu-flags.conf
```

**钉钉**
```sh
paru -S "dingtalk-bin"
```
> 应用程序起动器 -> 右键“钉钉”-> 编辑应用程序-> 环境变量:
> `GTK_USE_PORTAL=1 QT_IM_MODULE=fcitx`

**腾讯会议**

```sh
paru -S wemeet-bin
```
> 应用程序起动器 -> 右键“腾讯会议”-> 编辑应用程序-> 环境变量:
> `QT_IM_MODULE=fcitx`

**向日葵**
```sh
# 安装
paru -S sunloginclient

# 启动服务
sudo systemctl start runsunloginclient
```


## 4. 程序包管理器安装

```sh
# opencode
bun add -g opencode-ai
```


## 5. 使用 android 版 (`waydroid`)

```sh
# 安装
sudo pacman -S waydroid waydroid-image
sudo waydroid init
sudo systemctl start waydroid-container
```
