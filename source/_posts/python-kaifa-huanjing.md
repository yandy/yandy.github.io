---
title: Python 开发环境
toc: true
date: 2024-11-09 22:14:14
categories: ['最佳实践']
tags:
  - python
  - xops
---

## 1. Overview

| Windows | Linux/WSL |
| --- | --- |
| ✓ | ✓ |

## 2. Windows

使用 [uv](https://github.com/astral-sh/uv) 管理python版本和虚拟环境

### 2.1. uv

```pwsh
# Install uv
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

# Upgrading uv
uv self update

# Add shell autocompletion
Add-Content -Path $PROFILE -Value @'
# uv
(& uv generate-shell-completion powershell) | Out-String | Invoke-Expression

'@
```

### 2.2. python

<!-- more -->

```pwsh
# list all available Python versions
uv python list

# install a Python version
uv python install 3.12

# set uv pip install mirror
Add-Content -Path $env:APPDATA\uv\uv.toml -Value @'
[[index]]
url = "https://mirrors.aliyun.com/pypi/simple"
default = true
'@
```


## 3. Linux/WSL

使用 [uv](https://github.com/astral-sh/uv) 管理python版本和虚拟环境

### 3.1. uv

```bash
# Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# Upgrading uv
uv self update
```

### 3.2. python

**set uv pip install mirror**

```sh
# if you're not in bash, switch to bash first
bash
```

```bash
cat > ~/.config/uv/uv.toml <<- 'EOM'
[[index]]
url = "https://mirrors.aliyun.com/pypi/simple"
default = true
EOM
```

**usage**
```sh
# list all available Python versions
uv python list

# install a Python version
uv python install 3.12
```
