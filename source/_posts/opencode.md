---
title: OpenCode
toc: true
date: 2026-04-30 10:07:50
categories: ['最佳实践']
tags:
  - xops
---

[OpenCode](https://opencode.ai/)

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

<!-- more -->

## 2. Skills Management

### 2.1 Add skill

```
bunx skills add <package> --skill <skills> -a opencode -y
# eg.
bunx skills add anthropics/skills --skill pdf docx -a opencode -y
```

### 2.2 Update skills

```
bunx skills update
```

### 2.3 Current skills

- `anthropics/skills --skill pdf docx xlsx pptx`
- `nextlevelbuilder/ui-ux-pro-max-skill --skill ui-ux-pro-max`
- `vercel-labs/agent-skills --skill vercel-react-best-practices`

## 3. [OMO(Oh My Openagent)](https://github.com/code-yeongyu/oh-my-openagent)

### 3.1 为单个项目开启 OMO
```bash
# Enable OMO, 在项目根目录下运行
mkdir -p .opencode
cat > .opencode/opencode.json <<- 'EOM'
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": [
    "oh-my-openagent@latest"
  ]
}
EOM
```

## 4. [superpowers](https://github.com/obra/superpowers)

### 4.1 为单个项目开启 superpowers
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

## 5. Common Tools

```sh
bun add -g agent-browser playwright
playwright install chromium firefox
uv tool install graphifyy[mcp]
```
