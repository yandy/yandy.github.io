---
title: OpenCode
toc: true
date: 2026-04-30 10:07:50
categories: ['最佳实践']
tags:
  - ai
---

[OpenCode](https://opencode.ai/) 是一个 AI 驱动的命令行编码助手，能够在终端中直接理解上下文、执行命令、编辑代码和管理 Git 操作，帮助开发者更高效地完成日常开发任务。

## 1. Setup

**还没有装opencode**

```sh
git clone https://github.com/yandy/agent-config.git ~/.config/opencode
bun add -g opencode-ai
```

**已经装了opencode**

```sh
cd ~/.config/opencode

git init
git branch -M main
git remote add origin https://github.com/yandy/agent-config.git
git fetch -p origin
git reset --hard origin/main
```

**add a fish abbr**

`~/.config/fish/conf.d/opencode.fish`

```fish
function opencode_ext
  echo "env OPENCODE_ENABLE_EXA=1 OPENCODE_EXPERIMENTAL_LSP_TOOL=1 opencode --port"
end

abbr -a opencode -f opencode_ext
```

## 2. Plugins

### 2.1 [superpowers](https://github.com/obra/superpowers)

**为项目开启**

```bash
# Enable superpowers, 在项目根目录下运行
mkdir -p .opencode
cat > .opencode/opencode.json <<- 'EOM'
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": [
    "superpowers@git+https://github.com/obra/superpowers.git"
  ]
}
EOM
```

### 2.2 [graphify](https://github.com/safishamsi/graphify)

**前置条件**

```sh
uv tool install graphifyy
# graphify install --platform opencode
```

**为项目开启**

```sh
graphify opencode install
```

## 3. Skills Management

### 3.1 Add skill

```
bunx skills add <package> --skill <skills> -a opencode -y
# eg.
bunx skills add anthropics/skills --skill pdf docx -a opencode -y
```

### 3.2 Update skills

```
bunx skills update
```

### 3.3 Current skills

- office

```sh
# bunx skills add anthropics/skills --skill pdf docx xlsx pptx -a opencode -y
```

- ui/ux

```sh
# bunx skills add nextlevelbuilder/ui-ux-pro-max-skill --skill ui-ux-pro-max -a opencode -y
# bunx skills add alchaincyf/huashu-design --skill huashu-design -a opencode -y
```

- browser automation

```sh
bun add -g playwright @playwright/cli
playwright install chromium firefox
# bunx skills add microsoft/playwright-cli --skill playwright-cli -a opencode -y
```

- frontend dev

```sh
# bunx skills add vercel-labs/agent-skills --skill vercel-react-best-practices -a opencode -y
```
