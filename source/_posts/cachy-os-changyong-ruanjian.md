---
title: cachy os 下常用桌面软件安装与配置
toc: true
date: 2026-03-12 11:17:56
categories: ['最佳实践']
tags:
  - linux
  - xops
---

## 1. 游戏相关程序和优化项

cachy os 对游戏的优化十分到位，并准备了相关的程序包。

```sh
sudo pacman -Syu cachyos-gaming-meta cachyos-gaming-applications
```

## 2. 建模绘图软件

```sh
sudo pacman -S blender kicad freecad
```

<!-- more -->

## 3. 常用国内软件

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
paru -S feishu-bin
```
> 应用程序起动器 -> 右键“飞书”-> 编辑应用程序-> 命令行参数:
> `--ozone-platform=wayland --enable-wayland-ime --wayland-text-input-version=3 %u`


**钉钉**
```sh
paru -S dingtalk-bin
```
> 应用程序起动器 -> 右键“钉钉”-> 编辑应用程序-> 环境变量:
> `GTK_USE_PORTAL=1 QT_IM_MODULE=fcitx`

**腾讯会议**

```sh
paru -S wemeet-bin
```
> 应用程序起动器 -> 右键“腾讯会议”-> 编辑应用程序-> 环境变量:
> `QT_IM_MODULE=fcitx __EGL_VENDOR_LIBRARY_FILENAMES=/usr/share/glvnd/egl_vendor.d/50_mesa.json`


## 4. 使用 wine 安装 windows 软件

```sh
# 安装
## 在安装 cachyos-gaming 相关包的时候已经安装了wine，所以这里只补充安装 wine-mono, wine-gecko
sudo pacman -S wine-mono wine-gecko

# 使用
## 打开 Winetricks，选择/创建容器(wineprefix)，执行相关操作：运行程序，卸载程序，安装dll/字体，运行wine配置程序等等
```
