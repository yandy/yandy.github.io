---
title: Rust 开发环境
toc: true
date: 2025-02-06 17:11:36
categories: ['最佳实践']
tags:
  - rust
  - xops
---

## 1. Overview

|  | Windows | WSL |
| --- | --- | --- |
| 开发环境(VS Code with Extension) | ✓ | ✓ |

<!-- more -->

## 2. Windows

### 2.1. 安装

下载 [rustup-init.exe](https://www.rust-lang.org/tools/install)

```pwsh
$env:RUSTUP_DIST_SERVER="https://rsproxy.cn"
$env:RUSTUP_UPDATE_ROOT="https://rsproxy.cn/rustup"

/path/to/rustup-init.exe
```

### 2.2. 设置

使用 [RsProxy](https://rsproxy.cn/) 镜像源，编辑配置文件

```pwsh
Add-Content -Path $HOME\.cargo\config.toml -Value @'
[source.crates-io]
replace-with = 'rsproxy-sparse'
[source.rsproxy]
registry = "https://rsproxy.cn/crates.io-index"
[source.rsproxy-sparse]
registry = "sparse+https://rsproxy.cn/index/"
[registries.rsproxy]
index = "https://rsproxy.cn/crates.io-index"
[net]
git-fetch-with-cli = true
'@
```


## 3. WSL

```bash
# install
export RUSTUP_DIST_SERVER="https://rsproxy.cn"
export RUSTUP_UPDATE_ROOT="https://rsproxy.cn/rustup"
curl --proto '=https' --tlsv1.2 -sSf https://rsproxy.cn/rustup-init.sh | sh

# config
cat > ~/.cargo/config.toml <<- 'EOM'
[source.crates-io]
replace-with = 'rsproxy-sparse'
[source.rsproxy]
registry = "https://rsproxy.cn/crates.io-index"
[source.rsproxy-sparse]
registry = "sparse+https://rsproxy.cn/index/"
[registries.rsproxy]
index = "https://rsproxy.cn/crates.io-index"
[net]
git-fetch-with-cli = true
EOM
```
