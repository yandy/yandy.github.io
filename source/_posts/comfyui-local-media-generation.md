---
title: 基于 ComfyUI 搭建本地出图/出视频流水线
toc: true
date: 2026-11-05 16:00:00
categories: ['最佳实践']
tags:
  - ai
  - comfyui
  - linux
---

手里有张 RTX 5060（8G 显存），云上出图出视频按积分/订阅计费，跑几张图就心疼。于是把 ComfyUI 装到本地，模型全部落盘，出图走本机接口，一分钱不花。这篇记录从安装到能稳定出活的完整过程。

<!-- more -->

## 1. 为什么是 ComfyUI

- **节点式工作流**：一个 workflow 就是完整的数据流，模型、采样器、后处理、提示词改写都能拆开替换，比"输入框 + 一堆下拉菜单"的 WebUI 透明得多。
- **官方模板成套**：新模型（Qwen-Image-2.1、MiniMax-H3 之类）发布时基本都附带官方模板，模型清单和下载链接直接写在图里的 `MarkdownNote` 节点上，不用到处翻 README。
- **能脱离界面**：后端就是个 HTTP 服务，`/prompt` 提交任务，配合 `comfy-cli` 可以把"出图"变成脚本里的一行命令。
- **离线**：模型在本地，服务在内网，断网也能跑。

代价是上手肯定不如 WebUI 直接：节点图第一次看像天书，得花点时间搞清楚数据流。

## 2. 安装

前置：

- [uv](https://docs.astral.sh/uv/)（Python 环境管理，用法见 [Python 开发环境](./python-kaifa-huanjing/)）
- Python 3.10+，我用 3.12
- 显卡驱动：NVIDIA 装好 CUDA 驱动，AMD 装好 ROCm

拉代码、装 PyTorch（按自己的卡选一行）、装依赖，三步（命令都在 `ComfyUI` 目录里执行）：

```sh
git clone --depth 1 --branch v0.43.0 https://github.com/Comfy-Org/ComfyUI.git
cd ComfyUI
# for nvidia
uv pip install torch torchvision torchaudio --extra-index-url https://download.pytorch.org/whl/cu130
# for amd
# uv pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/rocm7.2
uv pip install -r requirements.txt
uv pip install -r manager_requirements.txt
```

> `manager_requirements.txt` 里只有一个包（`comfyui_manager`），它不在主 requirements 里。不装这一步，界面里就没有 Manager —— 节点安装、模型搜索、缺模型一键下载全都没有，第一次用会很痛苦。

## 3. 写个启动脚本

每次 `cd` 进去再 `uv run main.py` 太啰嗦，写个壳丢进 `PATH`，例如 `~/.local/bin/comfy-ui`：

```bash
#!/bin/bash -e

cd "/path/to/ComfyUI"

exec uv run main.py "$@"
```

```sh
chmod +x ~/.local/bin/comfy-ui
```

之后在哪儿都能 `comfy-ui --enable-manager`。`exec` 是为了让 Ctrl+C 的信号直接打到 python 进程上（不然会卡一层 bash），`"$@"` 保证参数原样透传。

## 4. 升级

ComfyUI 迭代很快，`main` 分支经常是半成品，所以固定 tag 稳一点。升级就是把工作区切到新 tag 再补依赖：

```sh
git fetch --depth 1 origin tag v0.43.2 && git checkout FETCH_HEAD
uv pip install -r requirements.txt
uv pip install -r manager_requirements.txt
```

> `--depth 1` 克隆的仓库只有一条 commit，普通的 `git checkout v0.43.2` 会找不到这个 tag，得用 `git fetch --depth 1 origin tag <tag>` 把 tag 单独抓下来，再 `checkout FETCH_HEAD`。

## 5. 第一次跑：模板 + 模型

```sh
comfy-ui --enable-manager
```

浏览器打开 <http://127.0.0.1:8188>。左侧「工作流 → 浏览模板」，搜模型名（`qwen`、`minimax`），打开对应模板，顺手存成自己的 json。模板里通常会有一个 `Guide` 注释节点，写着这个工作流需要的全部模型文件名、大小和下载链接 —— **先看那个节点，比搜教程快**。

模型按类型丢进 `models/` 下对应目录，界面加载节点的下拉框才能选到：

| 目录 | 放什么 |
| --- | --- |
| `models/diffusion_models` | 主模型（DiT/UNet），如 `qwen_image_2.1_turbo_int8_convrot.safetensors` |
| `models/text_encoders` | 文本编码器，如 `qwen3vl_8b_int8_convrot.safetensors` |
| `models/vae` | VAE（视频模型还有单独的 audio vae） |
| `models/loras` | LoRA，视频 turbo 加速 LoRA 就在这儿 |
| `models/checkpoints` | 老式"一个文件全打包"的模型 |
| `models/controlnet`、`models/upscale_models` … | 按需 |

模型加起来能有一百多 G，别留在家目录的小分区上。

**去哪儿下：git clone，目录名和 `models/` 对得上**

Comfy-Org 把官方权重按 ComfyUI 的目录重新打包，仓库顶层的 `diffusion_models/`、`text_encoders/`、`vae/`、`loras/` 就是 ComfyUI `models/` 下的子目录名，clone 下来 `cp` 进去就完事，不用猜哪个文件放哪儿。模板的 `MarkdownNote` 节点直接给仓库地址（HF / ModelScope 各一份），国内直连 HF 慢，换成 ModelScope 域名就快很多。

```sh
mkdir -p ~/models && cd ~/models
git lfs install          # 只需一次
git clone --depth 1 https://www.modelscope.cn/Comfy-Org/Qwen-Image-2.1.git

# 同一份权重只留一档：把 int8_convrot 换成你要的那档（bf16 / fp8_scaled / w4a8 …）
cd Qwen-Image-2.1
find . -name '*.safetensors' ! -name '*int8_convrot*' -delete

# 顶层目录名和 models/ 一致，一条 cp 按结构铺过去
cp -r diffusion_models text_encoders vae /path/to/ComfyUI/models/
```

`cp -r` 目标是已存在的同名目录时会合并内容，所以这一条就把三棵子树各自归位了；源仓库留着当备份，或者直接删。

**怎么挑：同一份权重的多个精度档**

一个仓库里同一份权重往往有好几档，文件名后缀就是压缩方式，越往后越省显存：

| 后缀 | 含义 | 体积（相对 bf16） |
| --- | --- | --- |
| `bf16` | 原版，不量化 | 100% |
| `fp8_scaled` / `int8_convrot` | 8 bit 量化，基本无损 | 约 50% |
| `w6a8` / `w4a8` | 权重 6 / 4 bit + 激活 8 bit | 约 35% |
| `nvfp4_awq` | 4 bit 浮点 + AWQ，更激进，需要较新的 NVIDIA 卡 | 约 30% |
| `pruned` | 剪枝版，砍掉部分分支，体积更小、功能更少 | 看剪了多少 |

拿真实文件对一下比例：`qwen3vl_8b` 文本编码器 bf16 17.5 GB → int8 9.4 GB → w4a8 6.3 GB；MiniMax 那个 32B 编码器 bf16 51.5 GB → int8 27.1 GB → nvfp4 15.7 GB。主模型和文本编码器可以分开挑档（比如主模型 int8 + 编码器 w4a8），模板里那个下拉框能直接改选，不必和模板默认的文件名一致。

原则就一条：**显存够就用 bf16，不够按一档一档往下换，不要全下**。一套权重里真正用到的往往只有主模型 + 编码器 + VAE 三个文件。

以 Qwen-Image-2.1 turbo 文生图模板为例，实际要用的是这四件（这里取 int8 一档，换其他档文件名里后缀跟着换）：

| 文件 | 目录 | 大小 |
| --- | --- | --- |
| `qwen_image_2.1_turbo_int8_convrot.safetensors` | `diffusion_models` | 7.3 GB |
| `qwen3vl_8b_int8_convrot.safetensors` | `text_encoders` | 9.4 GB |
| `qwen3.5_9b_qwen_image_2.1_pe_t2i.int8_convrot.safetensors` | `text_encoders` | 9.5 GB |
| `qwen_image_2.1_vae_bf16.safetensors` | `vae` | 0.7 GB |

视频模板（MiniMax-H3）则是另一种量级：

| 文件 | 目录 | 大小 |
| --- | --- | --- |
| `minimax_h3_video_vae_int8_convrot.safetensors` | `vae` | 2.8 GB |
| `minimax_h3_audio_vae_fp32.safetensors` | `vae` | 0.6 GB |
| `minimax_h3_fl2va_pruned_int8_convrot.safetensors` | `diffusion_models` | 21.0 GB |
| `qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors` | `text_encoders` | 15.7 GB |

视频模板还带两档 turbo 加速 LoRA（4 步 / 8 步，各 2.0 GB），放在 `models/loras`，显存/时间紧的时候挂上。

## 6. 出图什么感觉

下面是我这台机器（RTX 5060，8G 显存，`int8` 量化权重）上的实测数字，仅供参考：

| 操作 | 耗时 |
| --- | --- |
| 文生图（turbo，8 步） | 1.5–2 分钟一张 |
| 改图（图生图） | 1–1.5 分钟一张 |
| 5 秒视频 | 几分钟级 |

视频慢得多：单主模型就 20 GB 上下，显存装不下时会分块 offload 到内存，比图片整整差一个量级——显存大的卡会好很多。

出图 2 分钟里只有二十来秒在真正采样，剩下 **70–100 秒是提示词改写** —— 模板里挂了一个 `TextGenerate` 节点（Qwen3.5-9B），你写的短描述会被扩写成一大段专业提示词再喂给图像模型。这是官方模板的设计，好处是裸 prompt 也出得来好图，代价是每张多等一分多钟。

顺带记几个和出图质量有关的参数：

- turbo 模板固定 **8 步**，因为 schedule 写死在 `ManualSigmas` 节点里（`1.0, 0.978…, 0`）；想改步数必须连 schedule 一起改，只改步数只会更糊。完整版权重则是 40–50 步
- Qwen-Image-2.1 原生支持 2K 输出，但默认是 1 百万像素（1024×1024）。要 2K 就把 `ResolutionSelector` 设成 1:1 + 4 百万像素，尺寸尽量取 32 的倍数
- 出透明底 PNG：prompt 写成 `This is an RGBA format image with transparency. <描述>`，保存时用支持 alpha 的格式

## 7. 给 agent 用：comfy-cli

界面是给人调图的，节点图却没法自动化。真正好用的是 [comfy-cli](https://github.com/Comfy-Org/comfy-cli) —— 它设计的重点不是取代界面，而是给 agent（Claude Code、Copilot、或任何能跑命令的助手）一个稳定的机器接口：结构化输出、可枚举的参数槽位、自带的技能文档。人用界面调一张，agent 用 CLI 批量跑，分工清楚。

```sh
uv tool install comfy-cli

# 初始化一个项目目录（workflows/ inputs/ outputs/ + comfy.yaml）
comfy setup --where local --project-dir ~/workspace/comfy --skip-skills --skip-verify

# 把 comfy 的技能文档装进 AI 编码助手，它就知道该怎么调
cd ~/workspace/comfy
comfy skills install --target claude-code --scope project
```

项目目录是按项目组织的，workflow 和输入产物各归各位：

```
comfy.yaml            # schema: project/1，记录默认执行位置（local / cloud）
workflows/            # 原始模板 json
inputs/               # 输入图
outputs/              # 产物
assets/ blueprints/ fragments/   # comfy 项目约定目录
```

为什么它适合交给 agent：

- **`comfy --json`**：所有命令输出统一信封 `{"ok": true, "data": {...}, "error": null}`，成功失败都是可解析的 JSON，不用抓日志猜
- **`comfy workflow slots`**：把工作流能改的参数连同地址、类型、当前值、枚举候选一起吐出来，agent 不用读那个几千行的 json 图就知道能调什么
- **`comfy workflow set-slot`**：按地址改参数，一次传多个，不碰原文件
- **`run` / `jobs watch` / `upload` / `download`**：提交、盯进度、传图、取产物，全部非交互
- **`comfy skills install`**：把上面这些写进项目的技能文档，agent 打开项目就知道怎么用

平时用得上的就是这几条：

| 命令 | 作用 |
| --- | --- |
| `comfy workflow slots wf.json` | 列出工作流所有**可改的槽位**（地址 + 类型 + 当前值） |
| `comfy workflow set-slot wf.json 459.prompt="..."` | 按地址改槽位，一次可以传多个 |
| `comfy run --workflow wf.json --where local` | 提交任务，返回 `prompt_id` |
| `comfy --json jobs watch <id>` | 盯进度，直到出结果 |
| `comfy upload img.png` | 把本地图传到服务端，返回服务器文件名 |
| `comfy download <id> --out-dir outputs` | 把产物取回本地 |

槽位地址就是模板 json 里的节点 id（`459.prompt`、`13.aspect_ratio` 这种），换模板后地址会变，但 agent 每次先跑一遍 `workflow slots` 就行，不用你记。

一个批量出图的脚本，交给 agent 写，基本就是这个形状：

```python
import json, subprocess

def comfy(*args):
    out = subprocess.run(["comfy", "--json", *args], capture_output=True, text=True).stdout
    env = json.loads(out)          # {"ok": ..., "data": ..., "error": ...}
    if not env.get("ok"):
        raise RuntimeError(env["error"])
    return env

prompt_id = comfy("run", "--workflow", "workflows/t2i.json", "--where", "local")["data"]["prompt_id"]
comfy("jobs", "watch", prompt_id)
comfy("download", prompt_id, "--out-dir", "outputs", "--where", "local")
```

配合 `set-slot` 改 prompt / 种子 / 画幅，就是 shell 里一个 for 循环的事。

## 8. 小结

- 装：`git clone` 固定 tag → 按卡装 torch → 两个 requirements
- 跑：`comfy-ui --enable-manager`，模板 + Manager 找模型，模型按类型进 `models/`
- 下模型：`git clone` `Comfy-Org/*` 仓库，`cp -r` 进 `models/`（两边目录名一模一样）
- 自动化：交给 agent，用 `comfy-cli` 的 `--json` + `workflow slots` / `set-slot` + `run` / `jobs watch`
- 权重：一个仓库里同一份权重有多档精度（`bf16` / `fp8_scaled` / `int8_convrot` / `w4a8` …），按显存挑一档就够，别全下
- 速度：turbo 图片分钟级；视频因为体积大、要 offload，慢一个量级

