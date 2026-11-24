---
title: 从 OpenCode 到 Pi — 我的 AI 编码助手进化之路
toc: true
date: 2026-07-14 10:00:00
categories: ['按图索骥']
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
| [pi-todo](https://github.com/yandy/pi-packages/tree/main/pi-todo) | 极简 todo 工具，编辑器上方常驻进度小组件 |
| [pi-vision-tools](https://github.com/yandy/pi-packages/tree/main/pi-vision-tools) | `describe_image`——把图像分析委托给视觉模型（调用方模型自带视觉时自动隐藏） |
| [pi-web-tools](https://github.com/yandy/pi-packages/tree/main/pi-web-tools) | websearch + webfetch 工具 |
| [pi-memory](https://github.com/yandy/simple-memory) | 跨会话持久化记忆层（simple-memory 仓库里的 pi 适配器，不在上面的 monorepo 里） |

### 3.1 几个亮点包

#### pi-sandbox — 进程级沙箱

[pi-sandbox](https://github.com/yandy/pi-packages/tree/main/pi-sandbox) 直接给 agent 的进程设限，按平台挑后端（Linux 上是 bwrap / landlock，macOS 是 seatbelt，Windows 是 ACL）。默认策略是**工作目录与系统临时目录可写、其余宿主文件可读不可写**，判定失败时 fail-closed——宁可拒绝执行，也不放行。相比把 agent 关进容器，这条路少了一层路径映射、镜像维护和启动延迟。它只管模型发起的 `bash` / `write` / `edit`：你自己敲的 `!命令`、以及 pi 之外启动的进程都不在这层里；网络也不做隔离，始终放行。

```sh
pi install npm:@yandy0725/pi-sandbox
```

它要求 pi >= 1.5.0，而这个 peer 下限不会有人替你告警：低于这个版本的宿主上，扩展可能在加载期就失败（Windows 上受限 shell 还只剩 `powershell`），`bash` / `write` / `edit` 就由 pi 那套未受限的内建实现顶位上——所以装完先用 `/permission` 看一眼 runner 和模式，确认它真的生效了。

#### pi-notify — 别让我轮流盯终端

我经常同时开好几个 pi 实例。麻烦的是 agent 停下来等你，你却不知道是哪个终端在等。pi-notify 只在两种时刻发桌面通知：

- **显式请求**：任何扩展都能在共享事件总线 `pi.events` 上发 `notify:request`（pi-ask-user 等它等输入、pi-sandbox 等升级审批都这么做），合法请求立即投递；没有这个信号，普通弹窗保持安静
- **一轮跑完**：`agent_settled` 时通知，带回合耗时和最后一条回复的纯文本摘要

太短的回合（默认 10 秒以内）、被中断的回合、custom 回合都不发，避免刷屏；`/notify` 可以运行时开关。通知发不出去也不会阻塞 agent 循环。

#### pi-context-insight — 上下文到底被谁吃了

`/insight` 生成一份独立、离线的 HTML 报告，回答「这个 session 的上下文由什么组成、钱花在哪、agent 都干了什么」：系统提示词、工具定义、注入内容、推理与回答各占多少；token/成本/缓存命中率与实际用量时间线；工具调用、文件改动、命令退出码；每个子 Agent 单独一节。

```sh
pi install npm:@yandy0725/pi-context-insight
/insight            # 完整报告，写到当前目录
/insight --short    # 同样的结构，但一行原文都不含
```

打开后左边是章节导航（总览 / Token / 耗时 / 当前上下文 / 时间线 / 浏览器 / 事件 / 活动 / 说明），先给一份总账：六个 KPI 瓦片（token、成本、缓存命中、调用次数、活跃时长、子 Agent）、分模型账本，再往下是 16 类 token 构成环——系统提示词、工具定义、技能注入、思考、回复、工具调用与工具结果各吃多少，一眼看出钱花在哪；右边把墙钟时间拆成模型、工具执行、其他开销三段，并扣掉空闲：

[![pi-context-insight 总览：KPI 瓦片、分模型账本、Token 构成与耗时拆分](assets/pi-insight-overview.png)](/assets/pi-insight-overview.png)

再往下是「上下文到底被谁吃了」的正面回答。下图上半部分是**当前**窗口：占用了多少、窗口里各分类占多少、压缩预留和模型最大输出预留各切走多少；下半部分是**上下文时间线**，每次请求一根堆叠柱，可以在全量 / 增量、步骤 / 轮次之间切换，也能看耗时折线，点开任意一根就是那一步的明细（耗时、Δ token、那一步的单价、实际 prompt 与缓存命中）：

[![pi-context-insight 当前上下文构成与上下文时间线](assets/pi-insight-context.png)](/assets/pi-insight-context.png)

时间线只讲「长了多少」，想知道「具体是哪段文字」，就去「浏览器」按分类下钻到真实 prompt、工具 schema 和工具输出，或者按 DNA（读取顺序）重放一遍；「事件」「活动」两张表则记下每个工具调用的成败、退出码，以及文件改动的行数。界面里的 EN / 中文 切换会重译整页，包括客户端重绘的图和列表。

单文件、内联 CSS/JS/JSON、无外部资源、不联网，全部 session 文本在生成期转义。默认报告把原文一并内嵌；要发给别人就加 `--short`，结构完全一致但没有任何正文——正文根本没写进文件，所以拿源码也翻不出来。报告里的分类值都是估算（与 pi 界面的上下文环用同一套密度启发式），实际用量和成本来自 provider 上报，两者差过 2% 时 Token 构成里会单列一行残差；估算规则、聚合口径和这次实际触发的截断清单都写在「说明」里。

#### pi-subagents — 子代理系统

在同一个 Pi 运行时内启动子代理（进程内，不 spawn 子进程），工具名、调用约定和 UI 都跟主子代理一致。适合把「翻代码库」「核一批事实」「查一遍链接」这种脏活甩出去，主会话接着干别的。

```sh
pi install npm:@yandy0725/pi-subagents
```

```text
subagent({
  subagent_type: "Explore",
  prompt: "找到所有处理认证逻辑的文件",
  description: "查找认证文件",
  run_in_background: true,
})
```

前台代理阻塞到跑完，后台代理立刻返回 ID、完成后再回调。后台默认同时最多 4 个在跑，多出来的排队、空出槽位按序启动；前台调用不排队，直接起。编辑器上方那个常驻 widget 就是它们的仪表盘，每个代理一行：类型、一句话描述、模型、工具调用数、token、花销、耗时，跑着的时候带转圈和 `thinking…`——下面这张就是我写这篇稿子时同时派出去的四个人：

[![pi-subagents 的 Agents 面板：四个并行子代理各自的模型、工具调用数、token、花销与耗时](assets/pi-subagents-panel.png)](/assets/pi-subagents-panel.png)

几个不写在明面上、但反而最有用的行为：

- **类型就是一份 frontmatter**：`.pi/agents/<name>.md` 里写 `description`、`tools`、`model`、`thinking`、`max_turns`、`timeout`、`prompt_mode`、`inherit_context`、`run_in_background`、`enabled`。内置只有 `general-purpose`（全部工具）和只读的 `Explore`（`read`/`bash`/`grep`/`find`/`ls`），项目级 `.pi/agents/` 覆盖全局 `~/.pi/agent/agents/`，同名文件连内置类型都能盖掉。
- **`max_turns` 是软限，`timeout` 是硬杀**：轮次到点先给代理发一句「立即收尾」，再宽限 5 轮才真中止；`timeout` 没有收尾阶段，到点连正在跑的工具一起中断，结果前面标 `⏱ Timed out after Ns`。两者都是 frontmatter > 调用参数 > 全局默认。
- **子代理不能再套子代理**：绑定时就从活动工具集里剔掉 `subagent` / `get_subagent_result` / `steer_subagent`，它也固定跑父会话的工作目录，没有 `cwd` 参数——不担心它一激动把整棵树都派出去。
- **能边跑边掰**：`steer_subagent` 往运行中的代理插话，实际送达时机是「当前工具调用结束、下一次模型请求之前」，所以卡在一条长命令里的代理收不到，得等它回来；非 running 状态直接拒绝。
- **账记回父会话**：每个子代理的用量累加进父会话 footer / `/usage`，后台跑的也算；lifetime 口径是 `input + output + cacheWrite`，故意不含 `cacheRead`（否则同一段缓存前缀会被重复计 N 次）。这也是 `/insight` 能直接给出父子两级账本的原因。
- **transcript 独立落盘、事后可翻**：子代理会话放在父会话目录下的 `tasks/` 里；只要会话还在内存里，跑完的能 `resume` 接着聊，超过 10 分钟就 dispose 会话、只留一条可查看的记录。想回看就用 `/subagents:sessions` 挑一个，整段对话只读打开，头部标着它的模型与花销，`q` 退出：

[![通过 /subagents:sessions 只读回看某个子代理的完整 transcript](assets/pi-subagents-session.png)](/assets/pi-subagents-session.png)

生命周期事件也发在 `pi.events` 上（`subagents:created` / `started` / `completed` / `failed` / `steered` / `compacted`），其中 `completed` / `failed` 只对后台代理发；想改并发上限或宽限轮数，`/subagents:settings` 直接调。别的扩展可以挂上去做面板、告警或者自己的记账。

#### pi-memory — 跨会话记忆

[simple-memory](https://github.com/yandy/simple-memory) 里的 pi 适配器，装法是一个 `pi install` 外加一份最小配置——在 `~/.pi/agent/memory.json` 里指定一个模型：

```sh
pi install npm:@yandy0725/pi-memory
```

```json
{ "defaults": { "model": "provider/model-id" } }
```

这个模型没有随包默认值，也不回退到父会话模型；缺了它，会话启动时只会报一条配置错误，记忆层一个功能都不会初始化。

架构上分两层：`memory-core`（与 harness 无关的磁盘格式、锁定、注入策略）和适配器（`pi-memory`、`dsh-memory`）。每条记忆是一个 Markdown 文件，在 `MEMORY.md` 里占一行；记忆默认落在 `$XDG_DATA_HOME/simple-memory/`（未设置时是 `~/.local/share/simple-memory/`）下，按 git **remote** 分命名空间，所以同一仓库的 clone 和 worktree 共享同一份，非 git 或没有 remote 的项目按绝对路径单独落一份。`/dream` 负责去重合并重建，`memory search scope=sessions` 用来翻历史会话。

真正让这套东西好用起来的是**跨设备同步**（默认关，一行配置打开）：

```json
// ~/.pi/agent/memory.json
{ "sync": { "enabled": true, "remote": "git@github.com:you/project-memory.git" } }
```

远端就是一个你自己准备的普通 git 仓库（空的也行，pi-memory 不保存任何凭据）。配好之后，带这份配置的下一次 `session_start` 会自己 clone 到 `<memoryDir>/.sync/repo`、建好基线。这里刻意**没有** `/memory sync init`：首次克隆可能很慢，而「敲了却没生效」又多一个要排查的状态（URL 写错？连不上？），不如就改一行配置、让它幂等地重试。初始化失败也**不是致命的**：没有 git、断网、没有权限，会话就用本地记忆继续跑，只留一条能读懂的提醒；修好之后下次会话启动（或一次显式 pull / push）会把同一条幂等的初始化重走一遍。

同步本身有几个我很满意的设计：

- **一轮 push = 一次完整收敛**，不是「先 pull 再 push」。每轮走 fetch → 拿基线做三方差集（base / local / remote）→ 应用并重建索引 → 发布。因为进程内的脏标记只认得**本进程**写过的内容，拆成 pull/push 两步反而会漏掉别的会话改的东西。启动那一轮因此很划算：既把别的设备写的拉下来，也把上个会话没推出去的补推上去。
- **按写入去抖，不是按时间轮询**：默认 5 秒静默期（从一串写入的第一笔起算）才发布，一轮 `/dream` 改十几个文件只产生一轮 push；退出时不管去抖还没到点，再 flush 一次。自动路径有 5 秒总预算，超了就预告「下一轮再推」，绝不为了同步把会话卡住。
- **只同步 entry，不同步状态**：`MEMORY.md` 索引、`.lock`、`.backups/`、`sessions/` 都留在本机——索引本来就能重建，锁和备份是这台机器的事。
- **冲突不丢东西，而且能自己收敛**：两侧同时改了同一条记忆时两份都保留，另一份变成一条正常 entry、`name` 加上 `(冲突 <date> <sha6>)` 后缀。后缀只由内容派生，所以两台设备各自解同一次冲突会写出**同一个**文件，不会越同步越多；重复的部分之后再交给 `/dream` 合并。
- **启动时先收敛，再选索引值**：`pullOnStart` 默认开，而且跑在索引选定之前——否则新会话会用一份「上次的」记忆列表开工。
- **状态检查是严格 dry-run**：`/memory sync status` 算出与真跑一轮完全一样的三方差集（Configured / Initialized / Origin / Branch / Ahead / Behind / Conflicts / Rejected…），但**不** clone、不建基线、不碰任何记忆文件。排查时敢随便敲。
- **两把锁，且按段持有**：项目级的 `.lock` 管写入，根级的 `.sync/sync.lock` 管同步，传输段（fetch）与发布段（push）各持一次，绝不整轮壅着；真被遗弃时 `/memory sync unlock` 是唯一被认可的清除入口。

有一个诚实的取舍值得单独提：pi 在 `resume` / `fork` / `reload` 里沿用会话开始时录制的 `memory_index`（改它会破掉 prompt cache），所以启动收敛照常跑、磁盘照常更新，但**本会话的索引里看不到刚同步来的记忆**，要等下一次 compaction 或下一个会话。`/memory sync status` 的最后一行会把这个话说清楚，而不是让你对着一份「怎么没生效」的磁盘发愣。

手动收敛就三条：`/memory sync pull`（拉下来并重建索引，不发布）、`/memory sync push`（先收敛再发布）、`/memory sync remote <url>`（换远端并重置基线）。

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
- 9 个自研 Pi Packages 覆盖代码智能、沙箱、子代理、通知、洞察（另有一个 `simple-memory` 仓库里的记忆适配器）
- preset 按场景组合能力，`pi -ps coding` / `pi -ps office,design`，不改全局配置
- 进程级沙箱兜住风险，`simple-memory` 让记忆跨会话、跨 harness
- 子代理并行执行，`/insight` 告诉你上下文和钱都花在哪

所有代码都在 GitHub 上开源：
- [pi-packages](https://github.com/yandy/pi-packages) — 自研 Pi 扩展包
- [pi-presets](https://github.com/yandy/pi-presets) — preset 注册与 `pi -ps` 启动器
- [simple-memory](https://github.com/yandy/simple-memory) — 跨 harness 的磁盘记忆层

如果你也在用 AI 编码助手，不妨试试 Pi，自己动手搭建最适合你的工作流。
