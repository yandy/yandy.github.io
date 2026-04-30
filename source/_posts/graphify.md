---
title: graphify
toc: true
date: 2026-04-30 12:44:29
categories: ['最佳实践']
tags:
  - xops
---

[graphify](https://github.com/safishamsi/graphify) 是一个 AI 技能，能将任意文件夹转换为可查询的知识图谱，支持代码、文档、论文、图片等多种格式。

## 安装

如果遵循 {% post_link opencode 'OpenCode' %} 的说明，已经包含了 `graphify` 的安装

否则可以手动安装

```bash
uv tool install graphifyy[mcp] && graphify install --platform opencode
```

<!-- more -->

## 设置

- 切换到需要使用 `graphify` 的项目中;

- 激活 `graphify` 插件:

```sh
# 运行一次
graphify opencode install
```

- 在 `.gitignore` 文件中增加 `graphify` 相关内容:

```gitignore
# keep graph outputs, skip heavy/local-only files
# optional: commit for shared extraction speed, skip to keep repo small
graphify-out/cache/
# mtime-based, invalid after git clone - always gitignore this
graphify-out/manifest.json
# local token tracking, not useful to share
graphify-out/cost.json
# local graphify cmd
graphify-out/.graphify_python
```

- 创建 `.graphifyignore` 文件，增加不需要 graphify 分析的内容，例如  `node_modules/`, `.venv` 等

```
# .graphifyignore example
graphify-out/
AGENTS.md
.opencode/
vendor/
node_modules/
dist/
*.generated.py
venv/
.venv/
tests/
build/
```

## 工作流程

1. 一人运行 `/graphify .` 构建初始图谱，并将 `graphify-out/` 提交至版本管理
2. 其他人拉取后，其 AI 助手即可直接读取 `GRAPH_REPORT.md`，无需额外步骤
3. 安装 post-commit hook（`graphify hook install`），代码变更后图谱自动重建——纯代码更新无需 LLM 调用
4. 文档/论文变更时，编辑者运行 `graphify --update` 刷新语义节点
