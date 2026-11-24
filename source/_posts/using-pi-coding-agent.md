---
title: Pi 最佳实践：从装上到搭出自己的一套
toc: true
date: 2026-11-24 11:30:00
categories: ['最佳实践']
tags:
  - ai
  - pi
---

[Pi](https://pi.dev) 是个极简、可扩展的终端 agent harness。装上它只要一条命令，但把它变成「我自己那一套」需要往里补东西——这一年我把常用的补丁都做成了独立的 Pi package，攒出一套自洽的工作流。

这篇文章按上手顺序写：先是最小可用的基本用法，再是四层定制能力，然后是我陆续加进来的十块补丁，最后是把它们按场景组合起来的做法（preset）。

<!-- more -->

## 一、先理解 Pi 的取舍

Pi 的定位一句话：**内核只负责编排，其余全交给你组装**。它不内置 sub-agent、不内置 plan mode、不内置沙箱，官方态度是「让 Pi 自己做一个，或者装一个按你想要的方式实现的 package」。

好处是启动轻、行为可解释、升级不打架；代价是刚装完的 Pi 相当「素」——只有一个能读文件、写文件、跑命令的循环。

所以第一件该想清楚的事不是「装什么」，而是**这件需求，最弱的那个机制够不够**：

| 需求 | 用什么 |
|---|---|
| 让 Pi 在这个目录里始终记住某些规矩 | `AGENTS.md` |
| 一句话反复用（比如固定的 review 模板） | prompt template |
| 一整套工作流，还带脚本和参考资料 | skill |
| 真的需要新工具、新命令、事件钩子 | extension |
| 把上面几样打包，给别人或给多台机器用 | Pi package |

这条阶梯几乎决定了我后面所有的选择：**能用 `AGENTS.md` 说清的事，绝不写 extension**。

## 二、装上并跑起来

```sh
# macOS / Linux（会顺带装 Node，并把依赖 pin 住，之后用 pi update 升级）
curl -fsSL https://pi.dev/install.sh | sh

# Windows
powershell -c "irm https://pi.dev/install.ps1 | iex"

# 或者走 npm（要求 Node 22.19+，不 pin 传递依赖）
npm install -g --ignore-scripts @earendil-works/pi-coding-agent
```

然后进到工作目录启动：

```sh
cd /path/to/project
pi
```

第一次进去先 `/login` 选 provider（订阅或 API key 都行），`/model` 换模型，`/thinking` 或者 `Shift+Tab` 调思考强度。Pi 支持订阅、API key、本地模型和自定义 endpoint，一个会话里随时能换。

界面就三块：上面是转录区（你的输入、模型的回答、每一次工具调用和结果），中间是编辑器，底部 footer 显示目录、会话、模型、上下文占用和累计花费。**footer 是我扫得最频繁的一行**——上下文快撞窗口上限时，它比任何报错都先提醒你。

几条最常用的输入习惯：

- `@` 搜文件加进 prompt，`Tab` 补全路径，图片可以直接粘贴或拖进来
- `!git status` 跑一条命令并把输出交给模型，`!!git status` 跑但不喂输出
- `Ctrl+O` 展开/折叠工具输出，`Ctrl+T` 显示/隐藏思考块，`Ctrl+G` 用外部编辑器写长 prompt
- `Ctrl+L`/`/model` 打开模型选择器，`/hotkeys` 看当前会话真实生效的快捷键

Pi 不会每次工具调用都问你，所以第一次在陌生仓库里跑，先给一个只读的活：「这个仓库怎么组织的、检查命令是什么」。

## 三、每天都会用到的四件事

### 3.1 中途改方向，而不是重开

Pi 不需要等它跑完才能说话：

| 想要 | 动作 |
|---|---|
| 调整正在做的事 | 直接输入 + `Enter`（当前回复和工具调用结束后生效） |
| 排一个后续任务 | `Alt+Enter` |
| 把排队中的消息收回编辑器 | `Alt+Up` |
| 中止当前任务 | `Escape` |

我几乎不用 `Escape`：中途插一句「只看 src 下的文件」比中止重启便宜得多，前者保住的上下文，后者要重新喂一遍。

### 3.2 会话是资产，不是临时窗口

Pi 自动保存会话。退出后 `pi --continue`/`pi -c` 接着同一目录最近那个；会话里还有一整套：

| 命令 | 用途 |
|---|---|
| `/new` `/resume` `/name` `/session` | 新开、挑一个、命名、看这个会话的文件/用量/花费 |
| `/tree` `/fork` `/clone` | 回到某个用户消息分叉、复制当前会话 |
| `/compact [说明]` | 压缩上下文，可以给压缩指令 |
| `/export` `/copy` `/share` | 导出 HTML/JSONL、复制最后一条回复、生成分享链接 |

最值钱的是 `/fork` 和 `/clone`：想试另一条技术路线又不想毁掉当前上下文时用，两边的账都记在同一个项目下。

### 3.3 上下文文件：AGENTS.md

Pi 从 working directory 和它的父目录逐层找 `AGENTS.md`（也认 `CLAUDE.md`），再加上 agent 目录里那份全局的 `~/.pi/agent/AGENTS.md`。**它的生效范围是「这个目录及其子目录」**，所以你可以只在某个子项目里加规矩。

我全局那份只放两类东西，加起来二十几行：

- **红线**：`~/.ssh`、`~/.aws`、任何 `.env` / `*credential*` / `*.key` 一律不读不搜，任务看上去必须碰到时先问我
- **环境约定**：Python 一律 `uv run` / `uv venv` / `uv pip`，不要 `python -m venv`

项目那份只写这个项目特有的约束（比如「这是静态站，不用考虑向前兼容」）。**别把 `AGENTS.md` 写成愿望清单**——它每一轮都在上下文里，写多了既费钱又稀释重点。

### 3.4 装扩展的命令族

```sh
pi install npm:@scope/package        # 从 npm 装
pi install git:github.com/u/r@v1     # 从 git 装
pi install ./local-package           # 本地路径
pi -e npm:@scope/package             # 只这一次生效，不写配置
pi list                              # 都装了什么
pi remove npm:@scope/package
pi update --extensions               # 按声明重新对齐
```

个人安装写进 `~/.pi/agent/settings.json`；加 `--local`（`-l`）写进项目 `.pi/settings.json`，后者要项目被信任后才读。`-e` 特别适合「先试一个包再决定装不装」。

顺带一个工程上的细节：包安装失败（比如 registry 连不上）不会让 Pi 起不来，它会警告、跳过这个包，下次启动或 `/reload` 时再试。

## 四、四层定制，从最弱的开始

### 4.1 prompt template —— 一个 Markdown 文件就是一个命令

`~/.pi/agent/prompts/review.md`（或项目的 `.pi/prompts/`）：

```markdown
---
description: 审一遍暂存区的改动
argument-hint: "[关注点]"
---
审一下暂存的改动，重点关注 ${1:-正确性、安全与错误处理}。
```

文件名就是命令名，于是有了 `/review`；参数按 shell 风格解析，`$1` `$@` `${1:-默认值}` 都支持。适合「我每次都要说一遍同样一段话」的场景，成本几乎为零。

### 4.2 skill —— 一整套工作流，按需加载

skill 是一个含 `SKILL.md` 的目录，frontmatter 里的 `description` 决定模型什么时候想起它：

```markdown
---
name: pdf-tools
description: 读取、抽取、合并、拆分 PDF，填表单，对扫描件做 OCR。遇到 .pdf 文件或要产出 PDF 时使用。
---
# PDF tools
转换前先读 references/formats.md，脚本都相对本技能目录执行。
```

关键机制是**渐进加载**：启动时只把 `name` + `description` + 路径塞进 system prompt，正文等你真的用上才读。所以 description 必须同时说清「做什么」和「什么时候用」，写「辅助处理 PDF」这种是没有路由信息的。

技能生态已经有一套通用管理方式（[vercel-labs/skills](https://github.com/vercel-labs/skills)），`-a pi` 表示装到 Pi 的目录：

```sh
npx skills add anthropics/skills --skill pdf docx -a pi -y
npx skills update -p -y
npx skills ls -p -y
```

我常驻的三个：**pdf**（读文档、抽表、合并、填表单、OCR）、**playwright-cli**（浏览器自动化，UI 回归和抓取）、**mediagen**（一句话生成或编辑图片、生成短视频）。模型未必每次都想起某个技能，`/skill:name 参数` 可以强制加载。

### 4.3 extension —— 真的需要新工具时才写

extension 是普通的 TypeScript 模块，能注册工具、注册命令、挂事件。这是唯一能**改变 Pi 行为**的一层，也是最贵的一层：要自己维护、要跟宿主 API 对齐、出错时可能让整个会话起不来。

所以我的判断标准是：**只有当「模型缺少一个动作」时才写 extension**。需要它记住一段规矩，那是 `AGENTS.md`；需要它按流程做一串事，那是 skill。

### 4.4 Pi package —— 把以上打包

一个 package 就是普通目录或 npm 包，按约定发现资源：

```text
my-pi-package/
├── package.json
├── extensions/
├── skills/
├── prompts/
└── themes/
```

资源不在约定位置时，用 `package.json` 的 `pi` 键显式声明（支持 glob）：

```json
{
  "name": "my-pi-package",
  "keywords": ["pi-package"],
  "pi": {
    "extensions": ["./src/extension.ts"],
    "skills": ["./resources/skills"],
    "prompts": ["./resources/prompts/*.md"],
    "themes": ["./resources/themes/*.json"]
  }
}
```

宿主提供的包（`@earendil-works/pi-ai`、`pi-tui`、`typebox` 等）写进 `peerDependencies` 且范围 `*`，**绝不要**放进 `dependencies`——打进 tarball 会复制出第二份实例，绕过模块映射，症状是很难查的重复注册。

## 五、我给自己补的十块

Pi 只提供编排能力，于是缺什么就补什么。下面十个里九个收在 [yandy/pi-packages](https://github.com/yandy/pi-packages) 这个 monorepo 里（npm 上是 `@yandy0725/*`），记忆层在 [yandy/simple-memory](https://github.com/yandy/simple-memory)；彼此不依赖，`pi install` 一个就是一块，全部要求 pi >= 1.5.0：

| 包 | 解决什么 | 额外前置 |
|---|---|---|
| [pi-sandbox](https://github.com/yandy/pi-packages/tree/main/pi-sandbox) | 模型发起的 `bash`/`write`/`edit` 只碰允许的范围 | 无（landlock runner 随包发） |
| [pi-context-insight](https://github.com/yandy/pi-packages/tree/main/pi-context-insight) | `/insight` 一份报告说清上下文和钱花在哪 | 无 |
| [pi-subagents](https://github.com/yandy/pi-packages/tree/main/pi-subagents) | 并行子代理，外加按成本分层选模型 | 无 |
| [pi-coding-tools](https://github.com/yandy/pi-packages/tree/main/pi-coding-tools) | 用 AST/LSP 读代码，少读文件少花 token | `ast-grep` CLI + 各语言 LSP |
| [pi-todo](https://github.com/yandy/pi-packages/tree/main/pi-todo) | 计划常驻在编辑器上方，而不是留在嘴上 | 无 |
| [pi-ask-user](https://github.com/yandy/pi-packages/tree/main/pi-ask-user) | 该停下来问的时候停下来问 | 无 |
| [pi-notify](https://github.com/yandy/pi-packages/tree/main/pi-notify) | 多开时知道哪个终端在等你 | Linux 要 `notify-send` |
| [pi-web-tools](https://github.com/yandy/pi-packages/tree/main/pi-web-tools) | 搜索和抓网页 | 零配置可用 |
| [pi-vision-tools](https://github.com/yandy/pi-packages/tree/main/pi-vision-tools) | 让看不到图的模型也能看图 | 可选 `sharp` |
| [pi-memory](https://github.com/yandy/simple-memory/tree/main/pi-memory) | 结论活过会话，跨会话、跨设备 | `memory.json` 里先配一个模型 |

下面按我建议的安装顺序讲——最先装的应该是那个**兜住风险**的。

### 5.1 pi-sandbox：先收边界，再谈别的

```sh
pi install npm:@yandy0725/pi-sandbox
```

它给模型发起的 `bash` / `write` / `edit` 加进程级限制，按平台挑后端：Linux 上优先 `bwrap`、回退随包发的 `landlock-run`（打不开就**拒绝执行**，绝不静默退回无限制的 shell），macOS 用内置 seatbelt，Windows 是受限 token + Low 完整性标签。路径是完全透明的：宿主路径怎么用就怎么用，没有容器那层路径映射、镜像维护和启动延迟。

三档模式，`/permission` 切换，**进程级生效**，父会话和每个子代理一起换：

| 模式 | 文件效果 |
|---|---|
| `read-only` | 只有 `/dev/null` 可写 |
| `workspace-write`（默认） | 工作目录 + `/tmp` + `os.tmpdir()` + `~/.pi/agent/sandbox-writable.json` 里额外的根可写，其余可读不可写 |
| `danger-full-access` | 绕过沙箱，显式逃生口 |

升级审批是 **denial-first** 的：模型如果想申请更大的权限，必须本次会话里**先真的被拒过一次**同类操作；否则那两个参数会被忽略，结果里带一条「参数未生效」的说明，让它知道没生效而不是反复换措辞重试。`Deny` 还能附一句理由回传给模型，于是它学到的是原因，不是猜谜。

有两个边界要记住，它们不是 bug：

- **只管模型发起的动作**。你自己敲的 `!命令` 跑在你自己的 shell 里，不受这三档约束；同样也不限制读（沙箱进程能读你所有能读的东西），网络永远放行。
- **这个 peer 下限没人替你告警**。宿主低于 1.5.0 时扩展可能在加载期就失败，`bash`/`write`/`edit` 会由 Pi 那套未受限的内建实现顶上去。所以装完先敲一次 `/permission` 看 runner 和模式，确认它真的生效了——这一步别省。

### 5.2 pi-context-insight：钱到底花在哪

```sh
pi install npm:@yandy0725/pi-context-insight
/insight            # 完整报告，写到当前目录
/insight --short    # 结构一样，但一行原文都不含，可以发给别人
```

`/insight` 生成一份单文件、内联 CSS/JS/JSON、不联网、严格 CSP 的 HTML，把「这个 session 的上下文由什么组成、钱花在哪、agent 都干了什么」一次说清：系统提示词、工具定义、注入内容、推理与回答各占多少；token / 成本 / 缓存命中率与实际用量的时间线；工具调用、文件改动、命令退出码；每个子 Agent 单独一节。

打开后左边是章节导航（总览 / Token / 耗时 / 当前上下文 / 时间线 / 浏览器 / 事件 / 活动 / 说明），先给一份总账：六个 KPI 瓦片（token、成本、缓存命中、调用次数、活跃时长、子 Agent）、分模型账本，再往下是 16 类 token 构成环——系统提示词、工具定义、技能注入、思考、回复、工具调用与工具结果各吃多少，一眼看出钱花在哪；右边把墙钟时间拆成模型、工具执行、其他开销三段，并扣掉空闲：

[![pi-context-insight 总览：KPI 瓦片、分模型账本、Token 构成与耗时拆分](assets/pi-insight-overview.png)](/assets/pi-insight-overview.png)

再往下是「上下文到底被谁吃了」的正面回答。下图上半部分是**当前**窗口：占用了多少、窗口里各分类占多少、压缩预留和模型最大输出预留各切走多少；下半部分是**上下文时间线**，每次请求一根堆叠柱，可以在全量 / 增量、步骤 / 轮次之间切换，也能看耗时折线，点开任意一根就是那一步的明细（耗时、Δ token、那一步的单价、实际 prompt 与缓存命中）：

[![pi-context-insight 当前上下文构成与上下文时间线](assets/pi-insight-context.png)](/assets/pi-insight-context.png)

时间线只讲「长了多少」，想知道「具体是哪段文字」，就去「浏览器」按分类下钻到真实 prompt、工具 schema 和工具输出，或者按 DNA（读取顺序）重放一遍。

我实际怎么用它：**一回合烧掉的钱超过预期时，先 `/insight --short` 看一眼**。多数时候答案是「工具定义 + 技能注入吃掉了三成」，那就不是模型笨，是我装的东西太多——这比凭感觉删 package 靠谱。

报告里的分类值都是估算（与 Pi 界面那个上下文环同一套密度启发式），实际用量和成本来自 provider 上报，两者差过 2% 时 Token 构成里会单列一行残差；估算规则和这次实际触发的截断清单都写在「说明」里。

### 5.3 pi-subagents：并行，以及按成本分层选模型

```sh
pi install npm:@yandy0725/pi-subagents
```

子代理跑在**同一个 Pi 运行时内**（进程内，不 spawn 子进程），所以工具名、调用约定、UI 都和主会话一致。适合把「翻一遍代码库」「核一批事实」「查一遍链接」这类脏活甩出去，主会话接着干别的：

```text
subagent({
  subagent_type: "Explore",
  prompt: "找到所有处理认证逻辑的文件",
  description: "查找认证文件",
  run_in_background: true,
})
```

前台代理阻塞到跑完；后台代理立刻返回 ID，完成后再回调。后台默认同时最多 4 个在跑，多出来的排队、空出槽位按序启动；前台的调用不排队，直接起。编辑器上方那个常驻 widget 是它们的仪表盘，每个代理一行：类型、一句话描述、模型、工具调用数、token、花销、耗时——下面这张就是四个并行子代理的样子：

[![pi-subagents 面板：四个并行子代理各自的模型、工具调用数、token、花销与耗时](assets/pi-subagents-panel.png)](/assets/pi-subagents-panel.png)

真正改变我日常用法的是**模型分层**。在 `subagents.json` 里把 `fast` / `standard` / `advanced` 映射到真实模型：

```json
{
  "modelTiers": {
    "fast": "deepseek-flash",
    "standard": "deepseek-flash",
    "advanced": "qwen3.8-max"
  }
}
```

映射会直接写进 `subagent` 工具 `model` 参数的描述里，于是**模型自己就会判断**「找文件」是 `fast` 的活、「审这个架构」该用 `advanced`。没有额外的 `model_tier` 参数，没配的档不会出现在描述和提示里，也不会被悄悄替换；agent frontmatter 里钉死的模型永远优先。全局 `~/.pi/agent/subagents.json` 和项目 `.pi/subagents.json` 是**按档合并**的，项目只想改一档就不用把另外两档再抄一遍。

几个不写在明面上、但最有用的行为：

- **类型就是一份 frontmatter**：`.pi/agents/<name>.md` 里写 `description`、`tools`、`model`、`thinking`、`max_turns`、`timeout`、`prompt_mode`、`inherit_context`、`run_in_background`、`enabled`。内置只有 `general-purpose`（继承父会话工具）和只读的 `Explore`，项目级同名文件连内置类型都能盖掉。
- **`tools` 是精确名单**：省略 = 继承父会话当前激活的工具（再剔掉派发工具）；`tools: read, grep` 就是只有这两个；`-edit, -write` 在继承集上做减法。`*` 会被拒绝，别指望它。
- **`max_turns` 是软限，`timeout` 是硬杀**：轮次到点先发一句「立即收尾」，再宽限 5 轮；`timeout` 到点连正在跑的工具一起中断。
- **子代理不能再套子代理**：派发工具在绑定时就被剔掉，它也固定跑父会话的工作目录。
- **能边跑边掰**：`steer_subagent` 往运行中的代理插话，实际送达时机是「当前工具调用结束、下一次模型请求之前」。
- **账记回父会话**：每个子代理的用量都累加进父会话 footer 和 `/usage`，后台跑的也算——这也是 `/insight` 能直接给出父子两级账本的原因。
- **transcript 独立落盘**：跑完的在释放前（10 分钟）还能 `resume` 接着聊；想回看就 `/subagents:sessions` 挑一个，只读打开、头部标着模型与花销：

[![通过 /subagents:sessions 只读回看某个子代理的完整 transcript](assets/pi-subagents-session.png)](/assets/pi-subagents-session.png)

生命周期事件也发在共享总线 `pi.events` 上（`subagents:created` / `started` / `completed` / `failed` / `steered` / `compacted`），想改并发上限或宽限轮数用 `/subagents:settings`。

### 5.4 pi-coding-tools：用结构读代码，而不是全文读

```sh
pi install npm:@yandy0725/pi-coding-tools
```

五个工具，共同的目的是**少读文件、少花 token**：

- `ast_grep_search` —— 按 AST 结构搜，注释和字符串里的同名文本不会误报，也能跨行匹配
- `ast_grep_replace` —— 按结构重写，默认 dry-run
- `lsp_symbols` —— 文件骨架，比整份 `read` 省约 95% 的 token
- `lsp_hover` —— 唯一能回答「这个表达式是什么类型」的那个
- `lsp_navigate` —— 语义级跳定义/找引用，不是同名文本匹配，重载、继承、typedef 都能解

覆盖 ts/tsx/js/python/java/kotlin/c/cpp；项目里 TypeScript >= 7 时直接用 TypeScript 自带的原生 LSP，不用另装语言服务器（其他语言仍需各装一个）。前置的 `ast-grep` CLI 是唯一必须手动装的东西。

这一块的价值在长会话里最明显：改一个跨十个文件的接口，用 `lsp_navigate references` 一轮就能定位，而不是「grep 一下 → 猜哪几个是真的 → 每个读一遍」。

### 5.5 pi-todo：别把记账留到最后

```sh
pi install npm:@yandy0725/pi-todo
```

`todo` 工具三个 action（列计划 / 改一条 / 看进度），配一个常驻编辑器上方的看板。任务可以用 `blockedBy` 声明依赖，状态从会话分支重建，所以 `/fork` / `/resume` 之后列表依然是对的。

它顺手治了一个很常见的失败姿势：**把记账全攒到最后**。看板上还有未完成任务、又有一阵子没更新时，会往下一轮请求里追加一句短提醒（第 5 轮开始，之后 10 / 20 / 40 轮）。这句提醒只存在于那一次请求里、从不落盘，所以长跑不会攒出一堆互相矛盾的「当前状态」。

### 5.6 pi-ask-user：该停下来问，而不是猜

```sh
pi install npm:@yandy0725/pi-ask-user
```

`ask_user` 提供可搜索的分栏选项、多选、自由文本，选完还能补一句备注。**超时和中断始终拥有最终裁决**：非交互宿主不响应也不会把整轮挂住，本地超时（RPC 下默认 5 分钟）到点按取消结算——**不是**批准，命令和写入都不会发生。附带一个技能，把「高风险或需求模糊时先问人」变成固定的决策握手流程。

### 5.7 pi-notify：多开时知道谁在等你

```sh
pi install npm:@yandy0725/pi-notify
```

我经常同时开好几个 Pi。麻烦的是 agent 停下来等你，你却不知道是哪个终端在等。它只在两种时刻发桌面通知：有对话框在等你（包括其他扩展弹的），或者一轮真的跑完了（带耗时和最后一条回复的纯文本摘要）。每条通知都带会话名和 pid；10 秒以内的短回合、被中断的回合、custom 回合和子代理都不发。`/notify` 运行时开关，投递是 fire-and-forget——通知发不出去也绝不阻塞 agent 循环。

### 5.8 pi-web-tools / 5.9 pi-vision-tools：让它看得到外面

```sh
pi install npm:@yandy0725/pi-web-tools
pi install npm:@yandy0725/pi-vision-tools
```

`websearch` 零配置可用——默认走 Exa 免费层（150 次/天），中文查询回退 DeepSeek 或阿里云，某个 provider 失败自动落到下一个；`webfetch` 把 URL 抓成可读 Markdown，本地抓到的内容太薄（或要 JS 渲染）时回退到服务端渲染。

`describe_image` 让非多模态模型也能看图：调用方把图像和提示词交给配置好的视觉模型，拿回文本答案。它按**调用方模型是否支持图像输入自动开关**——你在用多模态模型时这个工具根本不存在，换模型就换行为，不需要手动开关。视觉模型可以写精确的 `provider/id`，也可以写 `haiku`、`qwen vl` 这种模糊名。

### 5.10 pi-memory：让结论活过会话

同一类问题我三个月问了三遍，每次都得重新解释一遍项目约束——这就是我加记忆层的原因。[simple-memory](https://github.com/yandy/simple-memory) 是一条磁盘记忆、多个 harness 共用：记忆是一个 Markdown 文件，在 `MEMORY.md` 里占一行，两台 harness 指到同一台机器上读写的是同一批文件。

```sh
pi install npm:@yandy0725/pi-memory
```

```json
// ~/.pi/agent/memory.json
{ "defaults": { "model": "provider/model-id" } }
```

这个模型**没有随包默认值，也不回退到父会话模型**；缺了它，会话启动时只会报一条配置错误，记忆层一个功能都不初始化。先配模型，再谈别的。

#### 它是怎么工作的

- **一个 `memory` 工具**：`add` / `replace` / `remove` / `list` / `search`（`scope=sessions` 还能翻历史会话）。一条记忆一个文件，`name` 是定位键，同名 `add` 就是覆盖。
- **`MEMORY.md` 索引进 system prompt**：索引整个会话内冻结，Pi 对 sections 做 diff 时不会逐轮追加消息，provider 的前缀缓存一直命中。
- **自动浮现**：每轮用一次轻量侧查询挑出相关记忆，把正文注入 `<relevant_memories>`。
- **自动提取**（默认关）：每轮结束后由子会话挑出值得长期记住的内容。我关着——我更愿意自己决定记什么。
- **`/dream`**：headless 整理，合并重复、消解矛盾、重建索引。
- `/memory` 看目录、索引容量、条目数、模块状态、锁持有者；`/memory unlock` 清理崩溃遗留的 `.lock`。

记忆默认落在 `$XDG_DATA_HOME/simple-memory/`（未设置时 `~/.local/share/simple-memory/`），按 git **remote** 分命名空间——所以同一仓库的 clone 和 worktree 共享同一份，非 git 或没有 remote 的项目按绝对路径单独落一份。

#### 跨设备同步（默认关）

```json
// ~/.pi/agent/memory.json
{ "sync": { "enabled": true, "remote": "git@github.com:you/project-memory.git" } }
```

远端就是一个你自己准备的普通 git 仓库（空的也行），pi-memory 不保存任何凭据、也从不提示输入，只调用 `PATH` 上的 `git`。配好之后，带这份配置的下一次会话启动会自己 clone 到 `<memoryDir>/.sync/repo`、建好基线。

这里刻意**没有** `/memory sync init`：首次克隆可能很慢，而「敲了却没生效」又多一个要排查的状态（URL 写错？连不上？），不如就改一行配置、让它幂等地重试。初始化失败也**不是致命的**：没有 git、断网、没权限，会话就用本地记忆继续跑，只留一条能读懂的提醒。

几个我很满意的设计：

- **一轮 push = 一次完整收敛**，不是「先 pull 再 push」。进程内的脏标记只认得本进程写过的内容，拆成两步反而会漏掉别的会话改的东西。启动那一轮因此很划算：既把别的设备写的拉下来，也把上个会话没推出去的补上去。
- **按写入去抖，不是按时间轮询**：默认 5 秒静默期（从一串写入的第一笔起算），一轮 `/dream` 改十几个文件只产生一轮 push；退出时不管去抖到没到点，再 flush 一次。
- **只同步 entry，不同步状态**：`MEMORY.md` 索引、`.lock`、`.backups/`、`sessions/` 都留本机——索引能重建，锁和备份是这台机器的事。
- **冲突不丢东西、而且能自己收敛**：两侧同时改同一条记忆时两份都保留，另一份变成一条正常 entry、`name` 加 `(冲突 <date> <sha6>)` 后缀。后缀只由内容派生，所以两台设备各自解同一次冲突会写出**同一个**文件，不会越同步越多；重复的部分之后交给 `/dream` 合并。
- **状态检查是严格 dry-run**：`/memory sync status` 算出与真跑一轮完全一样的差集（Configured / Initialized / Origin / Branch / Ahead / Behind / Conflicts…），但**不** clone、不建基线、不碰任何记忆文件。

有一个诚实的取舍值得单独提：Pi 在 `resume` / `fork` / `reload` 里沿用会话开始时录制的 `memory_index`（改它会破掉 prompt cache），所以启动收敛照常跑、磁盘照常更新，但**本会话的索引里看不到刚同步来的记忆**，要等下一次 compaction 或下一个会话。`/memory sync status` 最后一行会把这个话说清楚，而不是让你对着一份「怎么没生效」的磁盘发愣。

#### 记什么，不记什么

这条规则比功能重要：**只记下次还有用的**——项目约束、用户偏好、流程规则、踩过的坑和踩坑原因。不要记已经完成的活、仓库状态变更（合了什么、修了什么、发了什么版本）、一条命令就能查回来的事实、一次性任务细节。**记不准就干脆不记**；一条过时的记忆每一轮都在花你的上下文，比没有记忆更贵。

## 六、pi-presets：一条命令切场景

Pi 有 `-e` 可以临时加载一个 package，但那串路径没人愿意每次手敲；`PI_CODING_AGENT_DIR` 也是选项，只是它意味着多套 `settings.json`、`models.json`、凭据和技能安装——而这些配置真正不同的部分，往往只是「这次加载哪些 package」。

[pi-presets](https://github.com/yandy/pi-presets) 的做法很薄：**一个 preset 就是一个普通的 Pi package 目录，preset 名只是它的别名**。`pi -ps coding` 被外壳函数展开成 `pi -e /path/to/pi-presets/coding`，剩下的全交给 Pi 按常规规则去发现 extensions / skills / prompts / themes。

关键是它**不改全局 package 配置**：不带 `-ps` 的普通 `pi` 调用行为完全不变，preset 只在那一次调用里生效。

### 6.1 安装

```sh
git clone https://github.com/yandy/pi-presets.git ~/.pi/presets
cd ~/.pi/presets
npm install          # 同时在每个 preset 目录里装它自己的依赖
npm run setup        # 按 $SHELL 写入 shell function（fish / bash / zsh；Windows 上是 PowerShell）
exec "$SHELL"
```

`npm run setup` 是幂等的，重复执行不会往配置里叠第二份；也可以 `--shell fish` 显式指定。想先试再落盘：

```sh
# bash / zsh
eval "$(npm run --silent setup -- --dry-run)"

# fish 3.1+
eval (npm run --silent setup -- --dry-run | string collect)
```

这样当前 shell 里就有 `pi`，关掉即消失，磁盘上不留东西。不想要了跑 `npm run teardown`——它只删 setup 写下的标记块和函数文件，标记块被手工改坏时整体中止，不会乱删。仓库目录搬家后重跑一次 setup 即可。

### 6.2 用法

```sh
pi -ps coding                                # 加载 coding preset，进交互 TUI
pi -ps coding,office                         # 一次加载多个
pi -ps coding -p "列出 src 下所有 .ts 文件"    # 非交互跑一条 prompt
```

`-ps`、`--preset coding,office`、`--preset=coding` 都行，preset 参数也可以重复给。除 preset 参数外的一切——其他参数、stdin/stdout、当前工作目录、退出码——原样透传。未知 preset 会在启动 Pi **之前**报错并列出可用名字，不会让你对着一个空会话猜。

常用的配个缩写，只是省几次按键：fish 用 `abbr --add picode 'pi -ps coding'`，bash/zsh 用 `alias picode='pi -ps coding'`。

### 6.3 现有的 preset

| preset | 内容 |
|---|---|
| `coding` | [superpowers](https://github.com/obra/superpowers)（15 个 skills + 1 个扩展）+ [context7](https://github.com/upstash/context7) 的 `find-docs` skill |
| `design` | 占位，等着往里放东西 |
| `office` | 占位，等着往里放东西 |

superpowers 以 git 依赖装进 preset 目录**自己的** `node_modules`，再由 manifest 里的 glob 发现；context7 的 skill 放在 `.agents/skills/find-docs`，来源和 hash 记在 `skills-lock.json` 里。`design` / `office` 就是空 package——留着它们，是为了让 `pi -ps office,design` 这类写法有东西可指，也为了给后面填内容留好位置。

### 6.4 加一个自己的 preset

一个目录加一份 `package.json` 就够：

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

在 `dependencies` 里声明要装哪些包（npm 或 git 源都行），回仓库根跑一次 `npm install`——`postinstall` 会在每个 preset 目录里各自装依赖。`pi -ps writing` 立刻可用。

两个踩过的坑：npm 12 默认 `allow-git=none`，git 依赖会直接报 `EALLOWGIT`，需要在**该 preset 目录**的 `.npmrc` 里写 `allow-git=root`；另外 glob 展开会丢掉含 `.` 开头的路径段，`node_modules/*/.pi/extensions` 是匹配不到的，得写显式路径。

## 七、把这一套串起来

工具列完了，说三个我每天真会遇到的场景。

**接手一个陌生仓库。** 先 `pi -ps coding`，扔一个只读的活：「这个仓库怎么组织的、检查命令是什么、有没有 CI 约定」。它会自己派一个 `Explore` 子代理去翻，同时 `pi-coding-tools` 让它用 `lsp_symbols` 看骨架而不是整份读文件。回到正题前我会先看一眼 `/insight --short`——第一次进陌生仓库的上下文增长往往很吓人，早看比晚看好。

**写一个小功能。** `todo` 先列三步（读相关代码 → 改 → 跑检查），沙箱保持 `workspace-write`，改完让它跑测试和 lint。中途发现方向错了就 `Enter` 插一句，别 `Escape`。收工前 `/insight` 复盘一遍：如果这一轮的钱大多花在工具结果上，下次就该让它先 `ast_grep_search` 而不是把文件整份读进来。

**同时开三个终端。** 一个改后端、一个改前端、一个在跑一批链接检查。`pi-notify` 负责在哪个窗口等你的时候把你叫回来；需要核一堆事实时用 `subagents` 后台并行，`fast` 档跑搜索、`advanced` 档跑判断，账都记回父会话。

几条已经变成条件反射的纪律：

1. **装完 pi-sandbox 先 `/permission`**，确认 runner 和模式真的生效了。
2. **能用 `AGENTS.md` 说清的，不写 extension**；能用一个 prompt template 说清的，不装 skill。
3. **长跑之前先 `/compact`**，别等它自动压——自动压的时机往往在你正需要上下文的时候。
4. **每次收工花十秒看 `/insight --short`**，比月底看账单有用。
5. **记忆和 `AGENTS.md` 都要定期收**：`/dream` 合并重复，`AGENTS.md` 删掉已经变成默认行为的条目。

## 八、一屏速查

| 我想要 | 用什么 |
|---|---|
| 改方向 / 排后续 / 收回消息 / 中止 | `Enter` / `Alt+Enter` / `Alt+Up` / `Escape` |
| 接着昨天的活 | `pi --continue`，或 `/resume` |
| 试另一条路但不毁上下文 | `/fork`、`/clone` |
| 让规矩一直生效 | `AGENTS.md`（全局 + 项目） |
| 反复用同一段话 | `~/.pi/agent/prompts/*.md` → `/名字` |
| 一整套工作流 | skill（`npx skills add ... -a pi`） |
| 兜住 agent 的手 | pi-sandbox + `/permission` |
| 知道钱花在哪 | `/insight --short` |
| 并行 + 按成本选模型 | pi-subagents + `modelTiers` |
| 少读文件读懂代码 | pi-coding-tools（AST/LSP） |
| 多开时被叫回去 | pi-notify |
| 按场景切能力 | pi-presets 的 `pi -ps coding` |
| 结论活过会话 | simple-memory（`/dream`、`/memory sync`） |

代码都在 GitHub 上：

- [pi-packages](https://github.com/yandy/pi-packages) —— 九个 Pi package，`pi install npm:@yandy0725/...`
- [pi-presets](https://github.com/yandy/pi-presets) —— preset 注册与 `pi -ps` 启动器
- [simple-memory](https://github.com/yandy/simple-memory) —— 跨会话、跨 harness 的磁盘记忆层

Pi 最舒服的地方在于它**不预设你的工作流**：一开始只有一个循环，你觉得缺什么就补什么，补到某一天它正好长成你手上这台机器。上面这十块不是标准答案，只是我这台机器的样子。
