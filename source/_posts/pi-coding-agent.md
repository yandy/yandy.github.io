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

既然 Pi 推崇扩展驱动，我干脆把自己需要的功能都做成了独立的 Pi Package，大部分收在 [github.com/yandy/pi-packages](https://github.com/yandy/pi-packages) 这个 Monorepo 里（npm 发布为 `@yandy0725/*`）：

| 包名 | 功能描述 |
|------|---------|
| [pi-ask-user](https://github.com/yandy/pi-packages/tree/main/pi-ask-user) | 交互式 ask_user 工具，支持可搜索分栏 UI、多选、自由文本 |
| [pi-coding-tools](https://github.com/yandy/pi-packages/tree/main/pi-coding-tools) | AST/LSP 代码智能工具（ast_grep_search/ast_grep_replace/lsp_symbols/lsp_hover/lsp_navigate） |
| [pi-context-insight](https://github.com/yandy/pi-packages/tree/main/pi-context-insight) | `/insight` 生成离线 HTML session 洞察报告 |
| [pi-notify](https://github.com/yandy/pi-packages/tree/main/pi-notify) | 并行实例的桌面通知（阻塞弹窗 / 回合完成） |
| [pi-sandbox](https://github.com/yandy/pi-packages/tree/main/pi-sandbox) | 进程级沙箱（bwrap/landlock/seatbelt/windows-acl） |
| [pi-subagents](https://github.com/yandy/pi-packages/tree/main/pi-subagents) | 进程内子代理（后台并行执行 + 生命周期事件） |
| [pi-todo](https://github.com/yandy/pi-packages/tree/main/pi-todo) | 极简 todo 工具，编辑器内嵌小组件 |
| [pi-vision-tools](https://github.com/yandy/pi-packages/tree/main/pi-vision-tools) | `describe_image`——把图像分析委托给视觉模型 |
| [pi-web-tools](https://github.com/yandy/pi-packages/tree/main/pi-web-tools) | websearch + webfetch 工具 |
| [pi-memory](https://github.com/yandy/simple-memory) | 跨会话持久化记忆层（simple-memory 里的 pi 适配器） |

### 3.1 几个亮点包

#### pi-sandbox — 进程级沙箱

[pi-sandbox](https://github.com/yandy/pi-packages/tree/main/pi-sandbox) 直接给 agent 的进程设限，按平台挑后端（Linux 上是 bwrap / landlock，macOS 是 seatbelt，Windows 是 ACL）。默认策略是**工作目录可写、其余宿主文件可读不可写**，判定失败时 fail-closed——宁可拒绝执行，也不放行。相比把 agent 关进容器，这条路少了一层路径映射、镜像维护和启动延迟。

```sh
pi install npm:@yandy0725/pi-sandbox
```

它要求 pi >= 1.5.0。低于这个版本的宿主上，扩展可能在加载阶段就失败，`bash` / `write` / `edit` 会**静默回落到未受限的内建实现**——所以装完先用 `/permission` 确认它真的生效了。

#### pi-notify — 别让我轮流盯终端

我经常同时开好几个 pi 实例。麻烦的是 agent 停下来等你，你却不知道是哪个终端在等。pi-notify 只在两种时刻发桌面通知：

- **显式请求**：任何扩展都能在共享事件总线 `pi.events` 上发 `notify:request`（pi-ask-user 等它等输入、pi-sandbox 等升级审批都这么做），合法请求立即投递；没有这个信号，普通弹窗保持安静
- **一轮跑完**：`agent_settled` 时通知，带回合耗时和最后一条回复的纯文本摘要

太短的回合（默认 10 秒以内）、被中断的回合、custom 回合都不发，避免刷屏；`/notify` 可以运行时开关。通知发不出去也不会阻塞 agent 循环。

#### pi-context-insight — 上下文到底被谁吃了

`/insight` 生成一份独立、离线的 HTML 报告，回答「这个 session 的上下文由什么组成、钱花在哪、agent 都干了什么」：系统提示词、工具定义、注入内容、推理与回答各占多少；token/成本/缓存命中率与实际用量时间线；工具调用、文件改动、命令退出码；每个子 Agent 单独一节。

单文件、内联 CSS/JS/JSON、无外部资源、不联网。默认报告把原文一并内嵌（可逐条展开到真实 prompt、工具输出）；要发给别人就加 `--short`，结构完全一致但没有任何正文。

#### pi-memory — 跨会话记忆

[simple-memory](https://github.com/yandy/simple-memory) 里的 pi 适配器，装法就是一个 `pi install`：

```sh
pi install npm:@yandy0725/pi-memory
```

架构上分两层：`memory-core`（与 harness 无关的磁盘格式、锁定、注入策略）和适配器（`pi-memory`、`dsh-memory`）。每条记忆是一个 Markdown 文件，在 `MEMORY.md` 里占一行；记忆落在 `~/.local/share/simple-memory/` 下，按 git 仓库分配命名空间，克隆和 worktree 共享同一份。`/dream` 负责去重合并重建，`memory search scope=sessions` 用来翻历史会话。

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

## 4. Preset：一套二进制，按需组合能力

Pi 本身已经有 `-e` 可以临时加载一个 package，但那串路径没人愿意每次手敲。`PI_CODING_AGENT_DIR` 也是个选项，只是它意味着多套 settings.json、models.json、凭据和 skills 安装——而这些配置真正不同的部分，往往只是「这次加载哪些 package」。

所以我用 [pi-presets](https://github.com/yandy/pi-presets)：一个 preset 就是一个普通的 Pi package 目录，preset 名只是它的别名。`pi -ps coding` 被外壳函数展开成 `pi -e /path/to/pi-presets/coding`，剩下的全交给 Pi——它仍按 package 的常规规则去发现 extensions、skills、prompts、themes。

关键是它**不改 Pi 的全局 package 配置**：不带 `-ps` 的普通 `pi` 调用行为完全不变，preset 只在那一次调用里生效。

### 4.1 安装

```sh
git clone https://github.com/yandy/pi-presets.git ~/.pi/presets
cd ~/.pi/presets
npm install          # 同时在每个 preset 目录里装它自己的依赖
npm run setup        # 按 $SHELL 写入 shell function（fish / bash / zsh）
exec "$SHELL"
```

`npm run setup` 是幂等的，重复执行不会往配置里叠第二份；也可以用 `npm run setup -- --shell fish` 显式指定 shell。想先试一下再决定要不要落盘：

```sh
# bash / zsh
eval "$(npm run --silent setup -- --dry-run)"
```

```fish
# fish 3.1+
eval (npm run --silent setup -- --dry-run | string collect)
```

这样当前 shell 里就有 `pi` 了，关掉即消失，磁盘上不留东西。不想要了跑 `npm run teardown`——它只删 setup 写下的标记块和函数文件，标记块被手工改坏时会整体中止，不会乱删。仓库目录搬家之后重跑一次 setup 即可。

### 4.2 用法

```sh
pi -ps coding                          # 加载 coding preset，进交互 TUI
pi -ps office,design                   # 一次加载多个 preset
pi -ps coding -p "列出 src 下所有 .ts 文件"   # 非交互跑一条 prompt
```

`-ps`、`--preset coding,office`、`--preset=coding` 都行，preset 参数也可以重复给。除 preset 参数外的一切——其他参数、stdin/stdout、当前工作目录、退出码——都原样透传。未知 preset 会在启动 Pi **之前**报错，并列出可用的名字，不会让你对着一个空会话猜。

常用的可以配缩写，只是省几次按键：

```fish
# fish：abbr（输入时展开，`abbr -e picode` 可删）
abbr --add picode 'pi -ps coding'
abbr --add piwork 'pi -ps office,design'
```

```sh
# bash / zsh：alias
alias picode='pi -ps coding'
alias piwork='pi -ps office,design'
```

### 4.3 现有的 preset

| preset | 内容 |
|--------|------|
| `coding` | [superpowers](https://github.com/obra/superpowers)（15 个 skills + 1 个扩展）+ [context7](https://github.com/upstash/context7) 的 `find-docs` skill |
| `design` | 占位，等着往里放东西 |
| `office` | 占位，等着往里放东西 |

`coding` 是目前唯一有内容的。superpowers 以 git 依赖装进 preset 目录自己的 `node_modules`，再由 manifest 里的 glob 发现；context7 的 skill 放在 `.agents/skills/find-docs`，来源和 hash 记在 `skills-lock.json` 里。`design` / `office` 就是空 package——留着它们，是为了让 `pi -ps office,design` 这类写法有东西可指，也为了给后面填内容留好位置。

### 4.4 加一个自己的 preset

一个 preset 只需要一个目录和一份 `package.json`。最小可用版本：

```json
{
  "name": "@yandy/pi-preset-writing",
  "private": true,
  "pi": {
    "extensions": ["node_modules/*/extensions", "node_modules/@*/*/extensions"],
    "skills": ["./skills", "./.agents/skills", "node_modules/*/skills", "node_modules/@*/*/skills"],
    "prompts": ["./prompts"],
    "themes": ["./themes"]
  }
}
```

然后在 `dependencies` 里声明要装哪些 package（npm 或 git 源都行），回仓库根跑一次 `npm install`——`postinstall` 会在每个 preset 目录里各自装依赖。`pi -ps writing` 立刻可用。

两个踩过的坑：npm 12 默认 `allow-git=none`，git 依赖会直接报 `EALLOWGIT`，需要在**该 preset 目录**的 `.npmrc` 里写 `allow-git=root`；另外 glob 展开会丢掉含 `.` 开头的路径段，`node_modules/*/.pi/extensions` 是匹配不到的，得写显式路径。

## 5. Skills 管理

Pi 的 Skills 生态非常丰富，[vercel-labs/skills](https://github.com/vercel-labs/skills) 提供了统一的 `npx skills` 命令来管理（`-a pi` 指装到 Pi 的技能目录）：

```sh
# 安装 Skills
npx skills add anthropics/skills --skill pdf docx -a pi -y

# 更新
npx skills update -p -y

# 列出
npx skills ls -p -y
```

目前我常用的 Skills：
- **pdf**：文档读取、抽取、合并、表单处理
- **playwright-cli**：浏览器自动化（UI 测试、网页抓取）
- **mediagen**：一句话生成/编辑图片、生成短视频

## 6. 对比：OpenCode → Pi

| 特性 | OpenCode | Pi |
|------|----------|-----|
| 安装 | `bun add -g opencode-ai` | `npm install -g @earendil-works/pi-coding-agent` |
| 扩展机制 | Plugin + Skill | Extension + Skill + Pi Package |
| 多场景切换 | 手动切换 config 目录 | pi-presets 命名 preset，`pi -ps coding` |
| 配置格式 | JSON（opencode.json） | JSON + Markdown（可读性更好） |
| 自定义工具 | 通过 Plugin | 通过 Extension（TypeScript，更灵活） |
| Sub-agents | 第三方 Plugin | 第一方支持（pi-subagents） |
| 沙箱 | 无 | pi-sandbox（进程级，fail-closed） |
| 跨会话记忆 | 无 | simple-memory（pi / dsh 共用一份） |
| 并行实例提醒 | 无 | pi-notify |
| 生态成熟度 | 较小 | 快速增长，Skill 市场丰富 |

## 7. 总结

从 OpenCode 换到 Pi，不只是换了个工具，而是换了一种思维方式：

**OpenCode 给你一个成品，Pi 给你一套积木。**

我用 Pi 的扩展机制构建了自己的一整套 AI 编码助手生态：
- 9 个自研 Pi Packages 覆盖代码智能、沙箱、子代理、通知、洞察
- preset 按场景组合能力，`pi -ps coding` / `pi -ps office,design`，不改全局配置
- 进程级沙箱兜住风险，`simple-memory` 让记忆跨会话、跨 harness
- 子代理并行执行，`/insight` 告诉你上下文和钱都花在哪

所有代码都在 GitHub 上开源：
- [pi-packages](https://github.com/yandy/pi-packages) — 自研 Pi 扩展包
- [pi-presets](https://github.com/yandy/pi-presets) — preset 注册与 `pi -ps` 启动器
- [simple-memory](https://github.com/yandy/simple-memory) — 跨 harness 的磁盘记忆层

如果你也在用 AI 编码助手，不妨试试 Pi，自己动手搭建最适合你的工作流。
