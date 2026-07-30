---
title: 从 OpenCode 到 Pi — 我的 AI 编码助手进化之路
toc: true
date: 2026-07-14 10:00:00
categories: ['最佳实践']
tags:
  - ai
  - pi
---

几个月前我还在用 [OpenCode](https://opencode.ai/)，并专门写了篇博文记录它的用法。如今已经全面切换到 [Pi](https://pi.dev)，一个更加极简、可扩展的终端编码助手。这不仅是工具的替换，更是我对 AI 编码助手理念的一次重构——从"使用别人的配置"，变成了"构建自己的平台"。

这篇文章记录我从 OpenCode 迁移到 Pi 的完整历程，以及我围绕 Pi 构建的整套生态体系。

<!-- more -->

## 1. 为什么从 OpenCode 换到 Pi？

OpenCode 是个不错的工具，Plugin/Skills 生态也挺丰富。但用久了有几个痛点：

- **扩展不够灵活**：Plugin 体系绑定了特定实现，想加点自定义工具要绕路
- **配置管理繁琐**：opencode.json 里各种 plugin/skill 声明，切换场景不方便
- **不够极简**：内置了不少我不需要的功能，启动偏重

Pi 走了完全相反的路线——**极简内核 + 扩展驱动**。Pi 本身只提供核心编排能力，一切功能通过 [Extensions](https://pi.dev/docs/latest/extensions)、[Skills](https://pi.dev/docs/latest/skills)、[Pi Packages](https://pi.dev/docs/latest/packages) 按需组装。这种哲学完美契合我的需求：**适配我的工作流，而不是我去适配工具**。

## 2. 安装 Pi

```sh
npm install -g @earendil-works/pi-coding-agent
```

就是这么简单。没有复杂的前置依赖，装完即用。

## 3. 我的 Pi Packages 生态

既然 Pi 推崇扩展驱动，我干脆把自己需要的功能都做成了独立的 Pi Package，放在 [github.com/yandy/pi-packages](https://github.com/yandy/pi-packages) 这个 Monorepo 里（npm 发布为 `@yandy0725/*`）。目前已发布 12 个包：

| 包名 | 功能描述 |
|------|---------|
| [pi-ask-user](https://github.com/yandy/pi-packages/tree/main/pi-ask-user) | 交互式 ask_user 工具，支持可搜索分栏 UI、多选、自由文本 |
| [pi-coding-tools](https://github.com/yandy/pi-packages/tree/main/pi-coding-tools) | AST/LSP 代码智能工具 + ls/find/grep |
| [pi-container-sandbox](https://github.com/yandy/pi-packages/tree/main/pi-container-sandbox) | Docker 沙箱——在隔离容器中执行 bash/read/write/edit |
| [pi-dingtalk](https://github.com/yandy/pi-packages/tree/main/pi-dingtalk) | 钉钉集成（AI 表格、日历、审批、文档等） |
| [pi-lark](https://github.com/yandy/pi-packages/tree/main/pi-lark) | 飞书/Lark 集成 |
| [pi-memory](https://github.com/yandy/pi-packages/tree/main/pi-memory) | 跨会话持久化记忆层 |
| [pi-permission-system](https://github.com/yandy/pi-packages/tree/main/pi-permission-system) | 工具访问控制的权限系统 |
| [pi-subagents](https://github.com/yandy/pi-packages/tree/main/pi-subagents) | 进程内子代理（后台并行执行 + 生命周期事件） |
| [pi-superpowers](https://github.com/yandy/pi-packages/tree/main/pi-superpowers) | Superpowers 结构化开发工作流 |
| [pi-todo](https://github.com/yandy/pi-packages/tree/main/pi-todo) | 极简 todo 工具，编辑器内嵌小组件 |
| [pi-vision-tools](https://github.com/yandy/pi-packages/tree/main/pi-vision-tools) | 图像分析委托给视觉模型 |
| [pi-web-tools](https://github.com/yandy/pi-packages/tree/main/pi-web-tools) | 网页搜索 + 内容抓取 |

### 3.1 几个亮点包

#### pi-container-sandbox — Docker 沙箱

把 agent 的 bash/read/write/edit 操作放到每个会话独立的 Docker 容器里执行，项目目录只读挂载为 `/workspace`。再也不怕 agent 乱改系统文件了。还支持资源分级（small/medium/large），网络隔离等。

```sh
# 在项目里启动 pi，所有操作都在容器里执行
pi
# /sandbox status   # 查看容器信息
# !pwd              # 输出 /workspace
```

#### pi-memory — 跨会话记忆

基于文件系统的持久化记忆层，让 agent 记住你的偏好、项目约定、调试历史。每次启动会话时注入 MEMORY.md 索引，每次用户消息时自动拉取相关话题文件。还支持 `memory search scope=sessions` 搜索历史会话。

```sh
pi install npm:@yandy0725/pi-memory
```

关键特性：
- 自动记忆提取：每次对话结束后分析并写入学到的东西
- `/dream` 命令：自动去重、合并、重建所有记忆文件
- 分支安全：基于 git root 分配记忆命名空间
- 按类型分类：user / feedback / project / reference

#### pi-subagents — 子代理系统

在同一个 Pi 运行时内启动子代理，支持后台并行执行，有生命周期事件、自定义 agent 类型、运行时注入消息、会话恢复等能力。可以用来做代码探索、安全检查、文档生成等后台任务。

```text
subagent({
  subagent_type: "Explore",
  prompt: "找到所有处理认证逻辑的文件",
  description: "查找认证文件",
  run_in_background: true,
})
```

## 4. 两套配置，两种场景

这是我觉得最有意思的部分。Pi 通过 `PI_CODING_AGENT_DIR` 环境变量可以指向不同的配置目录，也就是说——**一套 Pi 二进制，多套配置**。

### 4.1 picode — 编程场景

[picode](https://github.com/yandy/picode) 是我为日常编码准备的配置集，克隆到 `~/.pi/agent-code`：

```sh
git clone https://github.com/yandy/picode.git ~/.pi/agent-code
```

配置了 fish alias 来启动：

```fish
function picode
  env PI_CODING_AGENT_DIR=$HOME/.pi/agent-code pi $argv
end
```

**picode 的配置亮点：**
- 集成了我的 pi-coding-tools（AST/LSP 代码智能）
- 安装了 skill-creator（创建自定义 skill）
- [context7](https://github.com/upstash/context7) 集成（自动拉取相关文档上下文）
- 浏览器自动化（Playwright）支持前端开发和 E2E 测试
- UI/UX Skills（huashu-design、ui-ux-pro-max）
- 权限系统（pi-permission-system）精细控制工具访问
- 丰富的 Keybindings 和 Subagents 配置

### 4.2 pimate — 办公/助手场景

[pimate](https://github.com/yandy/pimate) 是我为办公场景准备的配置，克隆到 `~/.pi/agent-mate`：

```sh
git clone https://github.com/yandy/pimate.git ~/.pi/agent-mate
```

```fish
function pimate
  env PI_CODING_AGENT_DIR=$HOME/.pi/agent-mate pi $argv
end
```

**pimate 的配置亮点：**
- Docker 沙箱开箱即用（自带 pimate.Dockerfile + sandbox.json）
- Office 全套技能：PDF、DOCX、PPTX、XLSX
- 钉钉集成（pi-dingtalk）处理办公事务
- 飞书集成（pi-lark）处理协作
- 子代理系统用于后台任务
- glab（GitLab CLI）支持 GitLab 工作流
- 网页搜索 + 抓取能力（pi-web-tools）

### 4.3 两套配置的对比

| 维度 | picode（编程） | pimate（办公） |
|------|---------------|---------------|
| 核心工具 | AST/LSP 代码分析 | 办公文档处理 |
| 沙箱 | 无（直接操作文件系统） | Docker 容器隔离 |
| 办公技能 | 基础（PDF） | 全套（PDF/DOCX/PPTX/XLSX） |
| 协作集成 | 无 | 钉钉 + 飞书 + GitLab |
| 网页工具 | 可选 | 默认开启 |
| 记忆系统 | 代码约定、调试历史 | 办事流程、联系人、偏好 |
| 典型用法 | `picode "重构这个模块"` | `pimate "帮我处理这份合同 docx"` |

两套配置共享同一份 Pi 二进制，切换只是换个 alias 的事。这就是 Pi 扩展性哲学的完美体现。

## 5. Skills 管理

Pi 的 Skills 生态非常丰富，可以通过 `npx skills` 命令管理：

```sh
# 安装 Skills
npx skills add anthropics/skills --skill pdf docx -a pi -y

# 更新
npx skills update -a pi

# 列出
npx skills ls -a pi
```

目前我常用的 Skills：
- **skill-creator**：编写和测试自定义 Skill
- **pdf / docx / pptx**：文档处理全家桶
- **playwright-cli**：浏览器自动化（UI 测试、网页抓取）
- **superpowers**： 一组编程工程化方法论

## 6. 对比：OpenCode → Pi

| 特性 | OpenCode | Pi |
|------|----------|-----|
| 安装 | `bun add -g opencode-ai` | `npm install -g @earendil-works/pi-coding-agent` |
| 扩展机制 | Plugin + Skill | Extension + Skill + Pi Package |
| 多配置管理 | 手动切换 config 目录 | `PI_CODING_AGENT_DIR` 开箱支持 |
| 配置格式 | JSON（opencode.json） | JSON + Markdown（可读性更好） |
| 自定义工具 | 通过 Plugin | 通过 Extension（TypeScript，更灵活） |
| Sub-agents | 第三方 Plugin | 第一方支持（pi-subagents） |
| Docker 沙箱 | 无 | pi-container-sandbox |
| 跨会话记忆 | 无 | pi-memory（自动记忆提取） |
| 权限控制 | 无 | pi-permission-system |
| 生态成熟度 | 较小 | 快速增长，Skill 市场丰富 |

## 7. 总结

从 OpenCode 换到 Pi，不只是换了个工具，而是换了一种思维方式：

**OpenCode 给你一个成品，Pi 给你一套积木。**

我用 Pi 的扩展机制构建了自己的一整套 AI 编码助手生态：
- 12 个自研 Pi Packages 覆盖编码、办公、协作全场景
- 两套配置分别面向编程和办公，切换只需一个 alias
- Docker 沙箱隔离风险，记忆系统跨越会话
- 子代理并行执行，权限系统精细控制

所有代码都在 GitHub 上开源：
- [pi-packages](https://github.com/yandy/pi-packages) — 自研 Pi 扩展包
- [picode](https://github.com/yandy/picode) — 编程场景配置
- [pimate](https://github.com/yandy/pimate) — 办公场景配置

如果你也在用 AI 编码助手，不妨试试 Pi，自己动手搭建最适合你的工作流。
