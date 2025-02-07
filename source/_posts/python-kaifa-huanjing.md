---
title: Python 开发环境
toc: true
date: 2024-11-09 22:14:14
categories: ['最佳实践']
tags:
  - python
  - xops
---

## Overview

| fnm/electron/nextjs | Windows | WSL | Container |
| --- | --- | --- | --- |
| 开发环境(VS Code with Extension) | ✕ | ✓ | ✓ |

<!-- more -->

## WSL

使用 [pyenv](https://github.com/pyenv/pyenv) 管理python版本和虚拟环境

### pyenv

```bash
# install pyenv
curl https://pyenv.run | bash

cat >> ~/.profile <<- 'EOF'

# pyenv
PATH="$HOME/.pyenv/bin:$PATH"
eval "$(pyenv init -)"
EOF
```

### python

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

## Container

参考 [项目模板](https://github.com/yandy/project-tmpl)： [Python](https://github.com/yandy/project-tmpl/tree/main/python)
