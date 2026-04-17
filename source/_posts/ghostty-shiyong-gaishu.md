---
title: ghostty 使用概述
toc: true
date: 2026-04-17 10:00:00
categories:
  - 按图索骥
tags:
  - linux
  - xops
---

[Ghostty](https://ghostty.org/) 是一个快速、功能丰富、原生平台的终端模拟器。

<!-- more -->

## 一、安装配置

### 克隆配置仓库

```bash
git clone https://github.com/yandy/term-config.git ~/.config/ghostty
```

### Arch Linux 安装

```bash
sudo pacman -S ghostty
```

## 二、特性

Ghostty 官方提供的完整功能列表请参考 [Features 文档](https://ghostty.org/docs/features)。

### 补充特性

- **智能 `Ctrl+C`**：当有内容选中的时候为"复制到剪切板"，否则为 "中断信号"

## 三、快捷键

### 列出所有快捷键

```bash
ghostty +list-keybinds
```

### 主要快捷键

| 快捷键 | 作用 |
|--------|------|
| `Ctrl + ,` | 打开配置文件 |
| `Ctrl + Shift + ,` | 重新加载配置 |
| `Ctrl + Shift + P` | 切换命令面板 |
| `Ctrl + Shift + N` | 新建窗口 |
| `Ctrl + Enter` | 切换全屏 |
| `Ctrl + Shift + T` | 新建标签页 |
| `Ctrl + Tab` | 下一个标签页 |
| `Ctrl + Shift + Tab` | 上一个标签页 |
| `Ctrl + Shift + W` | 关闭当前标签页 |
| `Ctrl + Shift + O` | 向右分屏 |
| `Ctrl + Shift + E` | 向下分屏 |
| `Ctrl + Alt + ↓` | 切换到下方分屏 |
| `Ctrl + Alt + ←` | 切换到左方分屏 |
| `Ctrl + Alt + →` | 切换到右方分屏 |
| `Ctrl + Alt + ↑` | 切换到上方分屏 |
| `Ctrl + Shift + F` | 开始搜索 |
| `Esc` | 结束搜索 |
| `Ctrl + C` | 智能复制（选中时复制，否则发送中断信号） |
| `Ctrl + V` | 从剪贴板粘贴 |
| `Ctrl + Alt + V` | 从选择缓冲区粘贴 |
| `Shift + PageDown ` | 向下翻页 |
| `Shift + PageUp` | 向上翻页 |


## 四、配置文件

Ghostty 的配置文件位于 `~/.config/ghostty/config`，详细配置选项请参考 [官方文档](https://ghostty.org/docs/config)。
