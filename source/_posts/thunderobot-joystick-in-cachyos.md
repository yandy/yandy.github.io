---
title: Cachy OS下的雷神手柄连接问题
toc: false
date: 2026-03-30 16:28:39
categories:
  - 刨根问底
tags:
  - game
  - linux
---

记录一个在 Cachy OS 下连接雷神手柄时遇到的问题，以及解决方法

## 现象描述

雷神有线手柄，在 Cachy OS 下连接后，无论是KDE桌面还是Steam都无法识别手柄

## 原因分析

运行`lsusb`，看到被识别成了 `Nintendo Co., Ltd Switch Pro Controller`

<!-- more -->

运行`sudo dmesg | tail -n 20 `，看到

```
[ 3272.029374] usb 1-11.2: New USB device found, idVendor=057e, idProduct=2009, bcdDevice= 1.19
[ 3272.029385] usb 1-11.2: New USB device strings: Mfr=0, Product=2, SerialNumber=0
[ 3272.029388] usb 1-11.2: Product: THUNDEROBOT G30
[ 3272.036785] nintendo 0003:057E:2009.0007: hidraw5: USB HID v81.11 Joystick [THUNDEROBOT G30] on usb-0000:00:14.0-11.2/input0
[ 3272.562033] nintendo 0003:057E:2009.0007: controller MAC = FF:FF:FF:5E:00:30
[ 3272.633099] [UFW BLOCK] IN=Meta OUT= MAC= SRC=198.18.0.104 DST=198.18.0.1 LEN=52 TOS=0x00 PREC=0x00 TTL=64 ID=0 DF PROTO=TCP SPT=443 DPT=53946 WINDOW=65535 RES=0x00 ACK URGP=0
[ 3274.630949] nintendo 0003:057E:2009.0007: failed reading SPI flash; ret=-110
[ 3274.630962] nintendo 0003:057E:2009.0007: using factory cal for left stick
[ 3276.679007] nintendo 0003:057E:2009.0007: failed reading SPI flash; ret=-110
[ 3276.679021] nintendo 0003:057E:2009.0007: using factory cal for right stick
[ 3278.727061] nintendo 0003:057E:2009.0007: failed reading SPI flash; ret=-110
[ 3278.727075] nintendo 0003:057E:2009.0007: Failed to read left stick cal, using defaults; e=-110
[ 3280.775112] nintendo 0003:057E:2009.0007: failed reading SPI flash; ret=-110
[ 3280.775124] nintendo 0003:057E:2009.0007: Failed to read right stick cal, using defaults; e=-110
[ 3282.823161] nintendo 0003:057E:2009.0007: failed reading SPI flash; ret=-110
[ 3282.823172] nintendo 0003:057E:2009.0007: using factory cal for IMU
[ 3282.914034] nintendo 0003:057E:2009.0007: assigned player 1 led pattern
[ 3283.456183] nintendo 0003:057E:2009.0007: Failed to set home LED, skipping registration; ret=-110
[ 3283.456439] input: THUNDEROBOT G30 as /devices/pci0000:00/0000:00:14.0/usb1/1-11/1-11.2/1-11.2:1.0/0003:057E:2009.0007/input/input22
[ 3283.456666] input: THUNDEROBOT G30 (IMU) as /devices/pci0000:00/0000:00:14.0/usb1/1-11/1-11.2/1-11.2:1.0/0003:057E:2009.0007/input/input23
```

这表明当前的 雷神手柄处于 Switch 模式。虽然内核驱动 hid-nintendo 已经加载，但由于非原装手柄对 Switch 特殊协议（如 SPI flash 读取）支持不佳，导致了大量的 ret=-110 报错，这会造成手柄延迟、无响应或映射混乱。

在 Linux 下，Xbox 模式 (XInput) 的兼容性远好于 Switch 模式。所以，为了正常连接手柄，我们需要将手柄切换到 Xbox 模式。

## 解决方法

- 断开手柄与电脑的 USB 连接。
- 按住手柄上的 X 键（或 A 键，视型号而定）不松手，同时重新插入 USB 线。
- 再次执行 lsusb，显示设备名变为 `Microsoft Corp. Xbox360 Controller`，说明手柄已成功切换到 Xbox 模式。

最终验证：切换为Xbox模式后，手柄在KDE桌面和Steam中都能正常识别。
