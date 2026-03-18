---
title: 开发环境配置(合集)
toc: true
date: 2026-03-17 18:24:49
categories: ['最佳实践']
tags:
  - xops
---

## 1. 各语言开发环境配置

- {% post_link cpp-kaifa-huanjing 'C++' %}
- {% post_link rust-kaifa-huanjing 'Rust' %}
- {% post_link javascript-kaifa-huanjing 'Javascript' %}
- {% post_link python-kaifa-huanjing 'Python' %}


## 2. 开发工具

#### opencode
```sh
# 配置 opencode-ai
git clone https://github.com/yandy/opencode-config.git ~/.config/opencode

# 安装 opencode-ai
bun add -g opencode-ai

# 用法
cat ~/.config/opencode/README.md
```

#### 其他工具

```sh
bun install -g agent-browser playwright
playwright install chromium firefox
```
