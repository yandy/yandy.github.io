---
title: KDE(wayland) 下远程桌面方案
toc: true
date: 2026-05-01 21:53:45
categories: ['按图索骥']
tags:
  - xops
  - linux
---

记录在 KDE/Wayland 环境下搭建和使用远程桌面的完整方案。

## 背景

作者有多个设备：1 台 PC 和 2 台笔记本。PC 和其中一台笔记本运行 Cachy OS / KDE / Wayland，另一台笔记本运行 Windows。偶尔需要用笔记本远程连接 PC 进行操作。

<!-- more -->

目前 KDE 社区提供了官方方案：[KRDP](https://github.com/KDE/krdp) 作为服务端，[KRDC](https://github.com/KDE/krdc) 作为客户端，两者均通过 RDP 协议通信。

## 技术选型

| 角色 | 系统 | 方案 |
|------|------|------|
| 服务端 | KDE/Wayland | [KRDP](https://github.com/KDE/krdp) |
| 客户端 | KDE/Wayland | [KRDC](https://github.com/KDE/krdc) |
| 客户端 | Windows | 原生远程桌面（mstsc） |

### 为什么选 RDP

- **KRDP 是 KDE 官方项目**，与 KDE Plasma 深度集成，天然支持 Wayland 下的屏幕捕获和输入转发。
- **RDP 协议性能好**，支持全动态视频编码（H.264），画面流畅度明显优于 VNC。
- **跨平台客户端丰富**：Windows 自带、Linux 有 KRDC/Remmina、macOS/iOS/Android 均有 RDP 客户端。
- 注意：**KRDP 不是 xrdp**。xrdp 是独立的 RDP 服务端实现，在 Wayland 下兼容性有限；KRDP 是与 KDE compositor 深度绑定的原生实现。

## 1. 服务端：安装与配置 KRDP

### 1.1. 安装

Cachy OS（Arch 系）用户通过 AUR 安装：

```bash
sudo pacman -S krdp
```

安装后，KRDP 会作为 KDE Plasma 的系统服务运行。

### 1.2. 启用并配置

打开 **系统设置** → **网络** → **远程桌面**：

![](/assets/2026-05-01-22-52-36.png)

1. 开启"远程桌面"开关
2. 设置用户名和密码（这是 RDP 登录时的认证凭据）
3. 记下显示的端口号（默认 `3389`）

也可以通过命令行查看状态：

```bash
systemctl --user status krdp
```

### 1.3. 防火墙

如果启用了防火墙，需要放行 RDP 端口：

```bash
sudo ufw allow 3389
```

或使用 firewalld：

```bash
sudo firewall-cmd --add-port=3389/tcp --permanent
sudo firewall-cmd --reload
```

> 注意：如果使用 `ufw`（Uncomplicated Firewall），请确保它已启用：`sudo ufw enable`。

### 1.4. 验证服务端

在 PC 上确认 KRDP 正在监听：

```bash
ss -tlnp | grep 3389
```

## 2. 客户端：KDE/Wayland 环境

### 2.1. KRDC 安装

```bash
sudo pacman -S krdc
```

### 2.2. 连接

1. 启动 KRDC
2. 在地址栏输入 `rdp://<PC的IP>:3389`
3. 输入在服务端设置的用户名和密码
4. 点击连接

KRDC 会列出会话历史，下次可直接从历史记录中连接。
![](/assets/2026-05-01-22-47-46.png)

## 3. 客户端：Windows 环境

Windows 使用自带的"远程桌面连接"（mstsc.exe）：

1. 按 `Win + R`，输入 `mstsc`，回车
2. 在"计算机"一栏输入 PC 的 IP 地址，如 `192.168.1.100:3389`
3. 点击"连接"
4. 输入在 KRDP 服务端设置的用户名和密码

Windows 原生 RDP 客户端对 KRDP 的兼容性良好，日常使用没有问题。

## 4. 常见问题

### Q: KRDC 连接后黑屏？

确认 PC 端的 KRDP 已启用且未进入锁屏/休眠状态。在 Wayland 下，锁屏时 compositor 可能不会提供屏幕帧。

### Q: 连接后只显示一个窗口而不是整个桌面？

KRDP 目前在某些版本下默认以"应用模式"共享，尝试在 KRDC 中配置连接参数或更新 KRDP/KRDC 到最新版。

### Q: 画面卡顿？

- 确保两端在同一局域网或有足够带宽
- 可在 KRDC 设置中调整色彩深度和分辨率

### Q: 如何卸载 KRDP？

```bash
sudo pacman -Rns krdp
```

不会影响系统稳定性，因为 KRDP 只是 KDE 的远程桌面组件。
