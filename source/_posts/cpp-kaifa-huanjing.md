---
title: C++ 开发环境
toc: true
date: 2024-10-15 19:16:55
categories: ['最佳实践']
tags:
  - cpp
  - xops
---

## Overview

|  | Windows | WSL | Container |
| --- | --- | --- | --- |
| 开发环境(VS Code with Extension) | ✓ | ✓ | ✓ |

<!-- more -->

## Windows

### build tools

安装 [Microsoft C++ 生成工具](https://visualstudio.microsoft.com/zh-hans/visual-cpp-build-tools/)

```pwsh
Add-Content -Path $PROFILE -Value @'
# vs build tools
& "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\Common7\Tools\Launch-VsDevShell.ps1"

'@
```

## WSL

### build tools

```bash
sudo apt-get install -y --no-install-recommends build-essential cmake ninja-build
```

### vcpkg

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

## Container

参考 [项目模板](https://github.com/yandy/project-tmpl)： [C++](https://github.com/yandy/project-tmpl/tree/main/cpp)
