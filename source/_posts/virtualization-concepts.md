---
title: KVM、QEMU、libvirt 等虚拟化核心概念图解
toc: true
date: 2026-07-05 21:00:00
categories: ['刨根问底']
tags:
  - linux
  - virtualization
  - kvm
  - qemu
---

在 Linux 上搞虚拟化，你会频繁遇到几个名字：KVM、QEMU、libvirt、virt-manager、VirtIO、SPICE、VNC、RDP……它们分别是什么？之间什么关系？本文用最直白的方式讲清楚。

<!-- more -->

## 分层架构总览

所有虚拟化软件可以按**层级**来理解：

```
┌─────────────────────────────────────┐
│   virt-manager (图形界面)            │
│   virsh (命令行)                     │  ← 管理工具
├─────────────────────────────────────┤
│              libvirt                 │  ← 统一管理 API/守护进程
├─────────────────────────────────────┤
│           QEMU (用户态进程)           │  ← 模拟 CPU/内存/外设
├─────────────────────────────────────┤
│      KVM 内核模块 (kvm.ko)           │  ← 硬件虚拟化加速
├─────────────────────────────────────┤
│     CPU 硬件 (Intel VT-x / AMD-V)    │  ← 硬件支持
└─────────────────────────────────────┘
```

与虚拟机的交互又分两层：

```
┌──────────────────────────────────────┐
│  显示/交互层                         │
│  SPICE / VNC / RDP                   │  ← 你看虚拟机桌面的方式
├──────────────────────────────────────┤
│  驱动加速层                          │
│  VirtIO (磁盘/网络/显卡/气球)         │  ← 虚拟机内部性能优化的驱动
└──────────────────────────────────────┘
```

下面逐个说明。

---

## 1. KVM — 内核虚拟化模块

**全称**：Kernel-based Virtual Machine

`/dev/kvm` 就是它暴露的接口。

- 是 Linux 内核的一个**可加载模块**（`kvm.ko` + `kvm-intel.ko` / `kvm-amd.ko`）
- 作用：把 CPU 的硬件虚拟化扩展（Intel VT-x / AMD-V）暴露给用户空间
- KVM **只负责 CPU 和内存的虚拟化**，不模拟任何硬件设备
- 有了 KVM，虚拟机指令直接在 CPU 上运行，不需要二进制翻译，性能接近原生

> 判断你的 CPU 是否支持：`lscpu | grep -i virtualization`，看到 `VT-x` 或 `AMD-V` 即可。

---

## 2. QEMU — 硬件模拟器

**全称**：Quick EMUlator

- 用户态程序，负责模拟虚拟机所需的**全部硬件**：CPU、内存、主板芯片组、磁盘控制器、网卡、显卡、USB 控制器……
- 有两种运行模式：
  - **纯模拟（TCG）**：不依赖 KVM，全部用软件模拟 CPU 指令——极其慢，只适合测试
  - **加速模式（KVM）**：CPU 指令交给 KVM 处理，QEMU 只模拟外设——性能接近原生
- 我们平常说的"KVM 虚拟机"，实际是 **KVM + QEMU 配合工作**

**QEMU 包含的组件（`qemu-full` 包）：**

| 组件 | 作用 |
|------|------|
| `qemu-system-x86_64` | x86_64 架构的系统模拟器 |
| `qemu-img` | 磁盘镜像管理工具 |
| `qemu-ga` | QEMU Guest Agent，宿主机与虚拟机通信的代理 |
| BIOS/UEFI 固件 | SeaBIOS、OVMF（UEFI） |

---

## 3. libvirt — 虚拟化管理层

- 一个**守护进程（libvirtd）** + **统一 API**
- 解决的核心问题：没有 libvirt 时，启动一个虚拟机要写几十行 QEMU 命令
- libvirt 用 **XML 配置文件**描述虚拟机，清晰易懂
- 支持多种 Hypervisor：除了 KVM/QEMU，还能管理 Xen、LXC、VMware ESXi 等

**一份 libvirt XML 示例（简化）：**

```xml
<domain type='kvm'>
  <name>win10</name>
  <memory unit='GiB'>8</memory>
  <vcpu>4</vcpu>
  <devices>
    <disk type='file' device='disk'>
      <source file='/var/lib/libvirt/images/win10.qcow2'/>
      <target dev='vda' bus='virtio'/>
    </disk>
  </devices>
</domain>
```

上层工具通过 libvirt API 操作：

| 工具 | 说明 |
|------|------|
| `virsh` | 命令行管理，`virsh start/stop/list/dumpxml` |
| `virt-manager` | 图形化管理器（GTK 界面） |
| `virt-viewer` | 轻量级 SPICE/VNC 客户端 |
| `virt-install` | 命令行创建虚拟机 |

---

## 5. 显示协议：SPICE vs VNC vs RDP

这是你连接虚拟机桌面时用的协议。三者对比如下：

| 特性 | SPICE | VNC | RDP |
|------|-------|-----|-----|
| **设计目标** | KVM/QEMU 虚拟机专用 | 通用远程显示 | Windows 远程桌面 |
| **剪贴板（X11）** | ✅ 双向 | ❌ 无 | ✅ 双向 |
| **剪贴板（Wayland）** | ❌ guest→host 坏了 | ❌ 无 | ✅ 双向 |
| **拖拽传文件** | ✅ | ❌ | ✅ |
| **音频** | ✅ | ❌ | ✅ |
| **USB 重定向** | ✅ 有限 | ❌ | ✅ 完整 |
| **多显示器** | ✅ 最多 4 个 | ❌ 有限 | ✅ 原生 |
| **性能（本地）** | 好 | 一般 | 好 |
| **性能（远程）** | 一般 | 差 | 好（H.264 编码）|
| **客机端软件** | Windows/Linux 需装驱动 | 无需额外软件 | Windows 自带，Linux 需装 xrdp |
| **适用场景** | Linux 虚拟机、快速配置 | 应急/兼容场景 | **Windows 虚拟机首选** |

### 为什么 RDP 在 Wayland 下剪贴板正常？

SPICE 的客户端（spice-gtk）在处理剪贴板时只实现了 X11 路径。在 Wayland 下，这部分代码就走不通了。而 RDP 的主流客户端（FreeRDP）专门实现了 Wayland 剪贴板支持（源码中有 `client/Wayland/wlf_cliprdr.c`），通过 Wayland 的 `wlr-data-control` 协议实现双向同步。

这不是 Wayland 本身限制了 SPICE，而是 **spice-gtk 的开发者没有实现，FreeRDP 的开发者做了。**

所以如果你的宿主机跑 Wayland、Windows 虚拟机需要双向剪贴板，RDP 是目前最稳妥的方案。

---

## 6. UEFI/OVMF — 虚拟机固件

- **SeaBIOS**：传统 BIOS，兼容性好，但不支持 GPT 启动、安全启动等新特性
- **OVMF（UEFI）**：基于 edk2 的 UEFI 固件实现，推荐用于所有现代操作系统（Windows 8+、Linux）

**Windows 10 应该选哪个？** UEFI。虽然 Win10 也支持 BIOS 模式，但 UEFI 更现代，且 Windows 11 强制要求 UEFI + TPM 2.0。

---

## 7. 全套流程串联

从零开始跑一个 Windows 虚拟机，完整链路如下：

```
你打开 virt-manager
  ↓
virt-manager 通过 libvirt API 告诉 libvirtd："我要创建 Windows 10 虚拟机"
  ↓
libvirtd 解析 XML 配置，调用 QEMU：
  "启动 qemu-system-x86_64，参数如下……"
  ↓
QEMU 进程启动，通过 /dev/kvm 请求 KVM 加速：
  "KVM 模块，CPU 指令你来处理"
  ↓
KVM 接管 CPU 指令执行（硬件加速）
  QEMU 继续模拟外设（磁盘、网卡、显卡、USB……）
  ↓
Windows 安装程序运行，virt-viewer/virt-manager 显示画面
  (通过 SPICE 协议通信)
  ↓
安装 VirtIO 驱动 → 磁盘/网络性能大幅提升
  ↓
日常使用：RDP 连接（KRDC/Remmina）
  双向剪贴板、音频、文件传输都正常工作
```

---

## 参考

- [Arch Wiki - QEMU](https://wiki.archlinux.org/title/QEMU)
- [Arch Wiki - libvirt](https://wiki.archlinux.org/title/Libvirt)
- [Arch Wiki - SPICE](https://wiki.archlinux.org/title/Spice)
- [KVM 官方文档](https://www.linux-kvm.org/page/Documents)
- [FreeRDP 源码 - Wayland 剪贴板实现](https://github.com/FreeRDP/FreeRDP/blob/master/client/Wayland/wlf_cliprdr.c)
