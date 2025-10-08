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

| fnm/electron/nextjs | Windows | WSL |
| --- | --- | --- |
| 开发环境(VS Code with Extension) | ✓ | ✓ |

## 2. Windows

使用 [pyenv-win](https://github.com/pyenv-win/pyenv-win) 管理python版本

### 2.1. pyenv-win

```pwsh
# install pyenv-win
# Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-WebRequest -UseBasicParsing -Uri "https://raw.githubusercontent.com/pyenv-win/pyenv-win/master/pyenv-win/install-pyenv-win.ps1" -OutFile "./install-pyenv-win.ps1"; &"./install-pyenv-win.ps1"
```

### 2.2. python

<!-- more -->

```pwsh
# list all available Python versions
pyenv install -l

# install a Python version
pyenv install 3.12.6

# set a Python version to use globally
pyenv global 3.12.6

# set pip mirror
pip config --user set global.index-url "https://mirrors.aliyun.com/pypi/simple/"
```


## 3. WSL

使用 [pyenv](https://github.com/pyenv/pyenv) 管理python版本和虚拟环境

### 3.1. pyenv

```bash
# install pyenv
curl https://pyenv.run | bash

cat >> ~/.profile <<- 'EOF'

# pyenv
PATH="$HOME/.pyenv/bin:$PATH"
eval "$(pyenv init -)"
EOF
```

### 3.2. python

```bash
# install python build dependencies
sudo apt update; sudo apt install -y build-essential libssl-dev zlib1g-dev \
libbz2-dev libreadline-dev libsqlite3-dev curl git \
libncursesw5-dev xz-utils tk-dev libxml2-dev libxmlsec1-dev libffi-dev liblzma-dev

# list all available Python versions
pyenv install -l

# install a Python version
pyenv install 3.12.6

# set a Python version to use globally
pyenv global 3.12.6

# set pip mirror
pip config --user set global.index-url https://mirrors.aliyun.com/pypi/simple/
```
