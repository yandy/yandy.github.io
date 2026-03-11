---
title: C++ 开发环境
toc: true
date: 2024-10-15 19:16:55
categories: ['最佳实践']
tags:
  - cpp
  - xops
---

## 1. Overview

| Windows | Linux/WSL |
| --- | --- |
| ✓ | ✓ |

## 2. Windows

### 2.1. build tools

安装 [Microsoft C++ 生成工具](https://visualstudio.microsoft.com/zh-hans/visual-cpp-build-tools/)

<!-- more -->

## 3. Linux/WSL

### 3.1. build tools

**debian-like**

```bash
sudo apt-get install -y --no-install-recommends build-essential cmake ninja-build
```

**arch-like**

```sh
sudo pacman -Syyu --noconfirm base-devel cmake ninja
```

### 3.2. vcpkg

#### prerequisites

**debian-like**

```sh
sudo apt install -y curl zip unzip tar
```

**arch-like**

```sh
sudo pacman -Syyu --noconfirm curl zip unzip tar
```


#### installation

**for bash**

```bash
export VCPKG_ROOT="${HOME}/.vcpkg"

# clone vcpkg
git clone https://github.com/microsoft/vcpkg "${VCPKG_ROOT}"

# bootstrap vcpkg

"${VCPKG_ROOT}/bootstrap-vcpkg.sh" -disableMetrics

# update ~/.bashrc
cat >> ~/.bashrc <<- 'EOM'

# vcpkg
export VCPKG_ROOT="$HOME/.vcpkg"
export VCPKG_FORCE_SYSTEM_BINARIES=1
export PATH="$VCPKG_ROOT:$PATH"
EOM
```

**for fish**

```sh
# 定义 vcpkg 根目录（fish 中变量不需要 $ 前缀）
set VCPKG_ROOT "$HOME/.vcpkg"

# 克隆 vcpkg 仓库
git clone https://github.com/microsoft/vcpkg "$VCPKG_ROOT"

# 初始化 vcpkg（禁用指标收集）
"$VCPKG_ROOT/bootstrap-vcpkg.sh" -disableMetrics

# update fish config
echo '
# vcpkg
set -x VCPKG_ROOT "$HOME/.vcpkg"
set -x VCPKG_FORCE_SYSTEM_BINARIES 1
set -x fish_user_paths "$VCPKG_ROOT" $fish_user_paths
' > ~/.config/fish/conf.d/vcpkg.fish
```
