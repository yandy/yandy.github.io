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

|  | Windows | WSL |
| --- | --- | --- |
| 开发环境(VS Code with Extension) | ✓ | ✓ |

<!-- more -->

## 2. Windows

### 2.1. build tools

安装 [Microsoft C++ 生成工具](https://visualstudio.microsoft.com/zh-hans/visual-cpp-build-tools/)

## 3. WSL

### 3.1. build tools

```bash
sudo apt-get install -y --no-install-recommends build-essential cmake ninja-build
```

### 3.2. vcpkg

```bash
export VCPKG_ROOT="${HOME}/.vcpkg"

# clone vcpkg
git clone https://github.com/microsoft/vcpkg "${VCPKG_ROOT}"

# bootstrap vcpkg
"${VCPKG_ROOT}/bootstrap-vcpkg.sh" -disableMetrics

# update ~/.profile
cat >> ~/.profile <<- 'EOM'

# vcpkg
export VCPKG_ROOT="$HOME/.vcpkg"
export VCPKG_FORCE_SYSTEM_BINARIES=1
PATH="$VCPKG_ROOT:$PATH"
EOM
```
