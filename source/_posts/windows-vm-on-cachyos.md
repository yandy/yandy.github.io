---
title: Linux (CachyOS) 下 Windows 虚拟机安装与使用指南
toc: true
date: 2026-07-05 19:00:00
categories: ['最佳实践']
tags:
  - linux
  - windows
  - cachyos
---

虽然 Linux 下很多场景可以通过 Wine 来运行 Windows 软件，但总有一些特殊场景 Wine 无法完美覆盖——比如某些专业的 Windows-only 办公软件、网银 U 盾驱动、或是依赖特定 Windows API 的行业工具。

这时，一台 Windows 虚拟机就是最佳的补充方案。在 Linux 上使用 KVM/QEMU + virt-manager 搭建 Windows 虚拟机，性能损失极小（接近原生），而且与宿主机无缝集成。

本文基于 **CachyOS / KDE / Wayland** 环境，参考 [CachyOS Wiki - QEMU and VMM Setup](https://wiki.cachyos.org/virtualization/qemu_and_vmm_setup/) 整理。

> 💡 不熟悉 KVM、QEMU、libvirt、SPICE 等概念？建议先阅读 [虚拟化核心概念图解](./virtualization-concepts/)，了解这些组件的关系后再动手。

<!-- more -->

## 前提条件

### 检查 CPU 虚拟化支持

确保 CPU 支持硬件虚拟化，且已在 BIOS 中开启：

```bash
lscpu
```

应该能看到 `VT-x`（Intel）或 `AMD-V`（AMD）字样。如果没看到，需要重启进 BIOS 开启。

### 检查 KVM 可用性

```bash
ls /dev/kvm
```

如果存在 `/dev/kvm` 文件，说明 KVM 模块已加载。

## 1. 安装 QEMU/KVM 与 virt-manager

CachyOS 下安装很直接，一条命令搞定：

```bash
sudo pacman -S qemu-full virt-manager swtpm
```

几个包的作用：

| 包名 | 作用 |
|------|------|
| `qemu-full` | QEMU 完整版，包含系统模拟器、工具、固件等 |
| `virt-manager` | 图形化虚拟机管理工具（VMM） |
| `swtpm` | 软件 TPM，Windows 11 需要硬件 TPM 时可模拟 |

> **Windows 10 不需要 TPM**，所以如果只装 Win10 可以不用 `swtpm`。但装 Windows 11 则必须要有 TPM 模块。

## 2. 配置 libvirt 服务

### 2.1. 防火墙后端配置

CachyOS（以及现代的 Arch Linux）默认使用 **nftables** 作为防火墙子系统。libvirt 从 9.x 版本开始原生支持 `nftables` 后端，但如果你开启了 **ufw** 且默认策略为 `deny (incoming)`，nftables 后端的规则与 ufw 规则会分属不同的 nft 表，UFW 的 DROP 策略可能先于 libvirt 的 ACCEPT 命中，导致虚拟机 DHCP 请求被拦截。

**推荐显式指定为 iptables 后端**，让 libvirt 将规则直接写入 iptables filter 表，自动排在 ufw 策略之前：

```bash
# 指定 libvirt 使用 iptables 后端
echo 'firewall_backend = "iptables"' | sudo tee -a /etc/libvirt/network.conf
```

> **原理**：切换为 iptables 后端后，libvirt 将虚拟网络的 ACCEPT/DNAT 规则直接插入 `filter` 表和 `nat` 表的 INPUT / FORWARD / POSTROUTING 链顶部，在 ufw 的 DROP 之前命中。而原生 nftables 后端在独立的 `libvirt_network` 表中管理规则，与 ufw 的 `filter` 表存在优先级竞争。

### 2.2. 将当前用户加入 libvirt 组

```bash
sudo usermod -aG libvirt $USER
```

需要**注销并重新登录**才能生效，或者直接执行 `newgrp libvirt` 临时切换到新组。

### 2.3. 启动 libvirt 服务

```bash
# 启动并启用 libvirt 守护进程
systemctl enable --now libvirtd.service

# 设置默认网络自动启动
sudo virsh net-autostart default
```

### 2.4. 防火墙配置

```bash
# 放行 NAT 转发（VM 通过宿主机上网）
sudo ufw route allow from 192.168.122.0/24
```

如果你在 2.1 中已将 libvirt 切换为 iptables 后端，则**无需下述操作**。

```bash
# 放行 virbr0 入站流量（VM 获取 IP，DHCP/DNS）
sudo ufw allow in on virbr0
```

> 如果你使用 `firewalld`，libvirt 会自动添加相关规则，一般无需手动配置。

### 2.5. （可选）开启 QEMU User Session

如果你需要从外部直接访问虚拟机（如 SSH 连接）、或者需要 3D 加速，建议启用 User Session。

在 virt-manager 中：`File -> Add Connection...` → `Hypervisor` 下拉选择 `QEMU/KVM user session` 即可。

更多细节参考 [CachyOS Wiki - QEMU User Session](https://wiki.cachyos.org/virtualization/qemu_user_session/)。

## 3. 准备安装介质

### 3.1. 下载 Windows 10 ISO

可以从微软官网下载：

```bash
# 使用 wget 直接下载（注意替换为最新链接）
# 或者从浏览器访问微软官网下载页面
```

> 建议将 ISO 文件集中存放在一个目录，比如 `~/vm/isos/`，方便 virt-manager 管理。

### 3.2. 下载 VirtIO 驱动 ISO

VirtIO 驱动是 KVM 虚拟机获得优秀磁盘/网络性能的关键：

```bash
# 下载最新的 VirtIO 驱动 ISO
wget -O ~/vm/isos/virtio-win.iso https://fedorapeople.org/groups/virt/virtio-win/direct-downloads/stable-virtio/virtio-win.iso
```

也可以在浏览器中打开 [VirtIO 驱动下载页](https://fedorapeople.org/groups/virt/virtio-win/direct-downloads/stable-virtio/) 手动下载。

## 4. 创建虚拟机与安装 Windows

### 4.1. 启动 virt-manager 并创建虚拟机

```bash
virt-manager
```

点击 **"创建新虚拟机"**（带星号的屏幕图标），或 `File -> New Virtual Machine`，按向导逐步操作：

| 步骤 | 操作 |
|------|------|
| **1. 选择安装方式** | 选 "Local install media (ISO image or CDROM)"，下一步 |
| **2. 选择 ISO** | 点击 "Browse..." 找到 Windows 10 ISO。如果目录没添加，点左下角 `+` 新建 Pool（Name: `isos`，Type: `dir`，Target Path 填你的 ISO 目录）。OS 类型通常自动检测为 "Microsoft Windows 10" |
| **3. 内存和 CPU** | 内存建议 **4~8GB**，CPU 建议 **2~4 核**（后续可调） |
| **4. 创建磁盘** | 大小建议 **64GB+**，勾选 "Allocate entire disk now" 性能更好，不勾则按需增长 |
| **5. 最终配置** | 修改并确定虚拟机名称，然后 “完成” |

### 4.2. 正常安装

与普通 Windows 安装无异：选择磁盘 → 文件复制 → 自动重启 → 设置区域和账户。

### 4.3. 安装 VirtIO 驱动和 SPICE 工具

进桌面后，打开虚拟机的 CDROM（virtio-win ISO），运行 `virtio-win-guest-tools.exe`，勾选所有组件（Network、Storage、Video、Balloon 等）安装。

安装后即可获得：
- **鼠标无缝切换**：鼠标自由穿梭，无需按热键
- **动态分辨率**：virt-manager 窗口缩放时自动适配

安装完成后 **重启虚拟机**。

## 5. 配置虚拟机自动启动

如果这台 Windows 虚拟机是你日常高频使用的工具，可以设置为宿主机启动时自动启动：

```bash
sudo virsh autostart win10
```

其中 `win10` 是虚拟机的名称，可以用 `sudo virsh list --all` 查看。

## 6. KDE/Wayland 下的日常使用

### 6.1. 启动方式

从应用菜单启动 Virtual Machine Manager，双击虚拟机即可开机和管理。

创建一个桌面快捷方式 `~/Desktop/win10-vm.desktop`：

```ini
[Desktop Entry]
Name=Windows 10 VM
Comment=Windows 10 虚拟机
Exec=virt-manager -c qemu:///system
Icon=computer
Terminal=false
Type=Application
Categories=System;
```

## 7. Host 与 Guest 文件共享

Virtio-fs 是 KVM/QEMU 官方推荐的虚拟机文件共享方案，通过共享内存在 Guest 和 Host 之间直接传输文件，不经过网络栈。配置完毕后，Host 上的共享目录会以驱动器（默认 `Z:`）的形式出现在 Windows 资源管理器中。

> 注意：Virtio-fs 在 Windows Guest 下走用户态 WinFsp 实现，大文件拷贝速度约 ~105 MB/s。日常传文档、图片完全够用；如果你需要频繁读写 GB 级别的大文件，建议另行研究 Samba 方案。

### 7.1. Host 侧配置（virt-manager GUI）

1. 打开 virt-manager，选中虚拟机 → "Open" → 点击蓝色 `ⓘ` 图标进入详情
2. 选择 **"Memory"** 标签，勾选 **"Enable shared memory"**

   > 如果看不到这个选项，需要在 XML 中手动添加（见下方）

3. 点击 **"Add Hardware"** → 选择 **"Filesystem"**
   - **Driver**: 选择 `virtiofs`
   - **Source path**: Host 上要共享的目录，比如 `/home/你的用户名/vm-share/`
   - **Target path**: 填写一个 mount tag（名字随意），比如 `hostshare`
   - 按需勾选 "Export filesystem as readonly mount"

   > **注意**：Target path **不是** Windows 中的路径，它只是一个标识符（mount tag），稍后在 Guest 中通过它来挂载。

4. 点击 "Finish"，然后启动或重启虚拟机。

如果 virt-manager 中找不到 "Enable shared memory" 选项，可以手动编辑 XML：

```bash
sudo virsh edit win10
```

在 `<domain>` 内添加：

```xml
<memoryBacking>
  <source type='memfd'/>
  <access mode='shared'/>
</memoryBacking>
```

并在 `<devices>` 内添加：

```xml
<filesystem type='mount' accessmode='passthrough'>
  <driver type='virtiofs' queue='1024'/>
  <source dir='/home/你的用户名/vm-share'/>
  <target dir='hostshare'/>
</filesystem>
```

### 7.2. Guest 侧配置（Windows）

**Step 1**: 下载并安装 [WinFsp](https://github.com/billziss-gh/winfsp/releases/latest)（Windows 文件系统代理，virtiofs 的依赖）
- 运行安装程序，保留默认选项（"Core" 组件）即可

**Step 2**: 安装 virtiofs 驱动（二选一）

- **方式 A**（推荐）：运行之前下载好的 `virtio-win-guest-tools.exe`，确保 **"Viofs"** 组件被勾选（默认即勾选），然后一路 Next 完成安装。
- **方式 B**（手动最小安装）：挂载 virtio-win ISO → 打开设备管理器 → 找到 "Other devices" 下的 "Mass Storage Controller" → 右键 → "Update driver" → "Browse my computer" → 选择 virtio-win ISO 所在驱动器（勾选 "Include subfolders"）→ 自动安装。

安装成功后，设备管理器的 "System devices" 下会出现 **"VirtIO FS Device"**。

**Step 3**: 启动 VirtIO-FS 服务
- 在 Windows 搜索栏输入 `services`，以管理员身份运行"服务"App
- 找到 **"VirtIO-FS Service"** → 右键 → "属性"
- 将 "启动类型" 改为 **"自动"**，然后点击 "启动" → "确定"

**Step 4**: 打开文件资源管理器，应该能看到一个新的驱动器（默认 `Z:`），内容就是 Host 上的共享目录。

> 如果没看到，重启 Windows 再试。virtiofs 默认从 `Z:` 开始向下查找可用的盘符。

## 8. 常见问题

### Q: 虚拟机无法上网？

检查 libvirt 默认网络是否启动：

```bash
sudo virsh net-list --all
```

如果 default 网络未启动，执行：

```bash
sudo virsh net-start default
```

如果网络已启动但仍不通，最常见的原因是 **ufw + nftables 后端冲突**：libvirt 的 nftables 规则与 ufw 的 filter 表不在同一个表内，ufw 的 DROP 策略可能先于 libvirt 的 ACCEPT 命中，导致 DHCP 请求被拦截。

**解决方案**：在 `/etc/libvirt/network.conf` 中设置 `firewall_backend = "iptables"`（详见 [2.1 防火墙后端配置](#21-防火墙后端配置)），重启 libvirtd 即可。

```bash
sudo systemctl restart libvirtd
sudo virsh net-destroy default && sudo virsh net-start default
```

### Q: 虚拟机性能差，感觉卡顿？

- 确认使用了 VirtIO 磁盘和网络驱动
- 检查 CPU 是否开启 "Copy host CPU configuration"
- 确认内存分配充足（Windows 10 至少 4GB）
- 可尝试在虚拟机显示设置中将 Video 模型从 QXL 改为 **virtio**（需要 VirtIO 驱动支持）

### Q: 宿主机休眠/唤醒后虚拟机无法操作？

停止虚拟机后重新启动，或在 virt-manager 中点击 "Send Ctrl+Alt+Del" 尝试解锁。

### Q: 如何备份虚拟机？

虚拟机的核心数据是磁盘镜像文件（`.qcow2`），默认存放在 `/var/lib/libvirt/images/` 或 `~/vm/` 目录。可以直接复制备份：

```bash
# 先停止虚拟机
sudo virsh shutdown win10

# 备份磁盘镜像
cp /var/lib/libvirt/images/win10.qcow2 /backup/path/

# 备份虚拟机配置
sudo virsh dumpxml win10 > win10.xml
```

### Q: 如何卸载？

```bash
# 删除虚拟机（会同时删除磁盘镜像，请先备份数据）
sudo virsh undefine win10 --remove-all-storage

# 卸载软件包
sudo pacman -Rns qemu-full virt-manager swtpm
```

## 参考

- [CachyOS Wiki - QEMU and VMM Setup](https://wiki.cachyos.org/virtualization/qemu_and_vmm_setup/)
- [CachyOS Wiki - QEMU User Session](https://wiki.cachyos.org/virtualization/qemu_user_session/)
- [Arch Wiki - QEMU](https://wiki.archlinux.org/title/QEMU)
- [Arch Wiki - libvirt](https://wiki.archlinux.org/title/Libvirt)
- [libvirt - Sharing files with Virtiofs](https://libvirt.org/kbase/virtiofs.html)
- [virtio-win - Virtio-fs Quick Start](https://virtio-win.github.io/Knowledge-Base/Virtiofs-qs.html)
- [KVM - Windows Guest Drivers](https://www.linux-kvm.org/page/WindowsGuestDrivers/Download_Drivers)
