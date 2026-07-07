---
title: fcitx5-vinput 语音输入法安装与配置指南
toc: true
date: 2026-07-06 19:00:00
categories: ['最佳实践']
tags:
  - linux
  - 语音输入
---

本文介绍如何在 Linux 下安装和配置 fcitx5-vinput，获得可用甚至好用级别的语音输入体验。

> 💡 不熟悉 ASR、Paraformer、sherpa-onnx、VAD、Whisper 等概念？建议先阅读 [ASR、语音识别模型与输入法核心概念图解](./asr-voice-input-concepts/)，了解这些组件的关系后再动手。

<!-- more -->

## 为什么选 fcitx5-vinput

目前 Linux 生态中有三个活跃的开源语音输入方案，fcitx5-vinput 在以下维度综合最优：

- **安装最省心**：Arch/Fedora/Ubuntu/Debian/Flatpak/Nix —— 都是官方包或官方维护的源
- **模型选择最广**：基于 sherpa-onnx，可以跑 Paraformer、SenseVoice、Zipformer 等几乎所有主流模型
- **混合方案**：既能纯本地离线跑，也能接云端 ASR（豆包、阿里百炼、ElevenLabs、OpenAI 等），按 `F8` 一键切换
- **LLM 后处理**：内建 Scene 系统，可以对接 LLM 做纠错、润色、翻译
- **C++ 实现**：管线延迟低，资源占用少

## 前置条件

- Fcitx5 输入法框架已安装并正常运行
- 麦克风可用
- 如果还停留在 IBus，需要先切换到 Fcitx5

验证 Fcitx5 是否正常：

```bash
fcitx5 --version
```

## 第一步：安装

### Arch Linux（推荐 archlinuxcn 源）

```bash
sudo pacman -S fcitx5-vinput
```

也可以用 AUR：

```bash
yay -S fcitx5-vinput-bin
```

### Fedora（COPR）

```bash
sudo dnf copr enable xifan/fcitx5-vinput-bin
sudo dnf install fcitx5-vinput
```

### Ubuntu 24.04（PPA）

```bash
sudo add-apt-repository ppa:xifan233/ppa
sudo apt update
sudo apt install fcitx5-vinput
```

### Ubuntu / Debian（手动 .deb）

从 [GitHub Releases](https://github.com/xifan2333/fcitx5-vinput/releases/latest) 下载对应的 `.deb` 包：

```bash
sudo dpkg -i fcitx5-vinput_*.deb
sudo apt-get install -f
```

### Flatpak

```bash
flatpak remote-add --if-not-exists xifan https://xifan2333.github.io/flatpak-auto/xifan.flatpakrepo
flatpak install https://xifan2333.github.io/flatpak-auto/refs/org.fcitx.Fcitx5.Addon.Vinput.flatpakref

# 安装后额外授权
flatpak override --user --filesystem=xdg-run/pipewire-0 org.fcitx.Fcitx5
flatpak override --user --filesystem=xdg-config/systemd:create org.fcitx.Fcitx5
flatpak override --user --filesystem=xdg-cache org.fcitx.Fcitx5
flatpak kill org.fcitx.Fcitx5
```

### Nix（flake）

```nix
# flake.nix
inputs.fcitx5-vinput.url = "github:xifan2333/fcitx5-vinput";

nixConfig = {
  extra-substituters = [ "https://fcitx5-vinput.cachix.org" ];
  extra-trusted-public-keys = [
    "fcitx5-vinput.cachix.org-1:XpX3AA6+dDIX4qJhb1QM7sbTwX6/qSlGvW8Z5NK6XdU="
  ];
};
```

详细 Home Manager 配置方法见[官方安装文档](https://xifan2333.github.io/fcitx5-vinput/install/)。

## 第二步：启动服务

```bash
# 启动后台守护进程
systemctl --user enable --now vinput-daemon.service

# 重新加载 Fcitx5
fcitx5 -r
```

> **验证**：如果你能看到 Fcitx5 托盘图标上多了一个麦克风指示，说明加载成功。

## 第三步：下载并激活模型

这是最关键的一步。打开 **Vinput GUI**（应用菜单搜索 `Vinput` 或终端运行 `vinput-gui`）。

进入 **Resources → Models**，浏览可用模型。下载前先看选型建议：

| 模型 | 底层引擎 | 特点 | 适合场景 |
|---|---|---|---|
| SenseVoice Small | sense-voice | 多语言（中/粤/英/日/韩），体积小 | 日常使用，多语言混用 |
| Paraformer Chinese | paraformer | 中文准确率最高 | 纯中文为主，追求准确率 |
| Zipformer CTC Chinese | zipformer | 流式识别（边说边出字），模型小 | 低配机器，追求响应速度 |

> **建议**：多数中文用户选 **Paraformer Chinese** 或 **SenseVoice Small** 就足够了。模型几百 MB，首次下载时耐心等待。

下载完成后点击 **Use** 激活。你也可以用命令行完成同样的操作：

```bash
vinput model list -a          # 查看所有可用模型
vinput model add <模型名称>    # 下载
vinput model use <模型名称>    # 激活
vinput model info <模型名称>   # 查看详情
```

模型会存放在 `~/.local/share/vinput/models/` 下（Flatpak 用户在 `~/.var/app/org.fcitx.Fcitx5/data/vinput/models/`）。

## 第四步：开始使用

模型激活后，在任何输入框里：

- **单击 `Alt_R`**：开始录音，再单击停止并识别（切换模式）
- **按住 `Alt_R`**：按住说话，松开识别（PTT 模式，像对讲机）

两种模式都能用，选一个你顺手的即可。所有快捷键都可以在 Fcitx5 配置里自定义。

## 进阶：快捷键一览

| 按键 | 默认值 | 功能 |
|---|---|---|
| 触发键 | `Alt_R` | 单击切换录音 / 按住说话 |
| 命令键 | `Control_R` | 选中文本后，用语音指令修改内容 |
| ASR 菜单 | `F8` | 在本地模型和云端 ASR 之间瞬时切换 |
| 场景菜单 | `Shift_R` | 切换不同的 LLM 后处理场景 |

## 进阶：配置云端 ASR（可选）

本地模型的准确率已经很不错，但如果在嘈杂环境或需要识别专业术语，云端 ASR 会更强。fcitx5-vinput 支持多个云端提供商：

| 提供商 | 模式 | 说明 |
|---|---|---|
| Aliyun Bailian | 流式/非流式 | Qwen3-ASR，中文优化好 |
| Doubao | 流式/非流式 | 字节跳动语音识别 |
| ElevenLabs | 流式/非流式 | 英文强项 |
| OpenAI-compatible | 流式/非流式 | 任何兼容 `/v1/audio/transcriptions` 的接口 |

配置方法：

1. 打开 Vinput GUI → **Resources → ASR Providers**
2. 选择一个提供商，点击 **Install**
3. 在 Control 页面编辑该提供商的环境变量（API Key、Endpoint 等）
4. 使用时按 `F8` 即可在本地模型和云端 ASR 之间切换

命令行方式：

```bash
vinput provider list -a        # 查看所有可用云端提供商
vinput provider add <id>       # 安装
vinput provider edit <id>      # 配置 API Key 等
vinput provider use <id>       # 切换到此提供商
```

## 进阶：LLM 后处理（Scenes）

Scene 是 fcitx5-vinput 对识别结果的二次加工流水线。在 Vinput GUI 的 **Scenes** 页面可以配置不同"场景"：

- **默认场景**：不做额外处理，原样输出
- **纠错场景**：用 LLM 修正识别错别字
- **翻译场景**：识别中文 → 输出英文（反之亦然）
- **自定义场景**：自己写 prompt，做任意后处理

每个场景可以指定使用的 LLM（本地或远程，OpenAI 兼容即可），以及 system prompt。切换场景按 `Shift_R`。

### 集成本地 llama.cpp 部署的 LLM 模型

如果你已经按[基于 llama.cpp 搭建本地 LLM API 服务](./llama-cpp-local-api/)在本地启动了 `llama-server`（OpenAI 兼容 API），可以直接接入 vinput 做语音识别的后处理——纠错、润色、翻译等。

> **前提**：确认 `curl http://localhost:8080/v1/models` 能正常返回模型列表。

#### 1. 在 vinput 中添加 LLM Provider

打开 Vinput GUI → **LLM** 标签页 → **Providers** → 点击 **Add**，填写：

| 字段 | 值 | 说明 |
|---|---|---|
| Name | `llama.cpp (local)` | 任意名称 |
| Base URL | `http://127.0.0.1:8080/v1` | llama.cpp 的 OpenAI 兼容端点 |
| API Key | （留空） | 本地部署无需 key |

也可以直接编辑配置文件 `~/.config/vinput/config.json`：

```json
{
  "llm": {
    "providers": [
      {
        "id": "llama.cpp",
        "base_url": "http://127.0.0.1:8080/v1",
        "api_key": ""
      }
    ]
  }
}
```

保存后在 GUI 中点击 **Test** 按钮，确认能成功拉取模型列表（`/v1/models` 返回正常）。

#### 2. 创建后处理 Scene（关键：务必调大 timeout！）

vinput 的 Scene 默认超时时间是 **4000ms（4 秒）**，这对本地 LLM 推理来说太短了。如果不调整，你会看到 Provider 测试能通过但实际使用时总会 Timeout——这正是因为 `/v1/models`（测试按钮）的请求很快，但 `/v1/chat/completions`（实际推理）需要几秒到几十秒。

在 **LLM → Scenes** 页面创建新场景，或直接编辑 `config.json`：

```json
{
  "scenes": {
    "activeSceneId": "llama-correct",
    "scenes": [
      {
        "id": "llama-correct",
        "label": "LLM 纠错",
        "provider_id": "llama.cpp",
        "model": "gpt-3.5-turbo",
        "prompt": "请修正以下语音识别结果中的错别字，只返回正确的文本，不要添加任何解释。",
        "candidate_count": 1,
        "timeout_ms": 60000,
        "context_lines": 0
      }
    ]
  }
}
```

**几个关键字段说明：**

| 字段 | 建议值 | 说明 |
|---|---|---|
| `model` | `gpt-3.5-turbo` | llama.cpp server 约定的名称（不是你的 .gguf 文件名） |
| `timeout_ms` | `60000` ~ `120000` | **这是最重要的配置！** 默认 4000ms 对本地推理完全不够。60s 适合小模型，14B+ 建议 120s |
| `candidate_count` | `1` ~ `3` | 让 LLM 生成几个候选结果供选择 |
| `prompt` | 自定义 | 指令越具体效果越好。vinput 要求 LLM 返回 JSON 格式 `{"candidates": ["..."]]}` |


#### 3. 验证效果

重启 vinput daemon 让配置生效：

```bash
systemctl --user restart vinput-daemon.service
```

现在按 `Alt_R` 说一段话后，vinput 会把 ASR 识别结果发送给本地 llama.cpp，由 LLM 纠错后再上屏。按 `Shift_R` 可以切换不同的 Scene。

#### 调试

如果遇到问题，可以通过 debug 日志排查：

```bash
# 启用 debug 日志（会输出完整的 LLM 请求/响应）
VINPUT_DEBUG=1 systemctl --user restart vinput-daemon.service

# 查看日志
journalctl --user -u vinput-daemon.service -f
```

常见错误码：

| 错误 | 原因 | 解决 |
|---|---|---|
| `CURLE_OPERATION_TIMEDOUT` | 超时 | 增大 `timeout_ms` |
| `CURLE_COULDNT_CONNECT` | 连接不上 | 确认 llama.cpp server 在运行，端口正确 |
| `HTTP 400` | 请求格式不对 | 检查 `--chat-template` 是否正确 |
| `no valid candidates` | LLM 返回格式不符合预期 | 检查 prompt 是否包含了输出格式要求，确认 `response_format` 配置为 `json_object` |

## 配置文件位置

了解配置文件位置有助于排查问题：

| 文件 | 路径 |
|---|---|
| 插件配置（快捷键等） | `~/.config/fcitx5/conf/vinput.conf` |
| 核心配置（模型、Scene） | `~/.config/vinput/config.json` |
| 模型目录 | `~/.local/share/vinput/models/` |
| ASR 提供商脚本 | `~/.local/share/vinput/providers/` |
| LLM 适配器脚本 | `~/.local/share/vinput/adapters/` |

Flatpak 用户路径不同，详见[官方文档](https://xifan2333.github.io/fcitx5-vinput/guide/)。

## 常见问题

### 按快捷键没反应？

1. 确认 `systemctl --user status vinput-daemon.service` 显示 running
2. 在 Fcitx5 配置中确认 Vinput 插件已启用
3. 确认快捷键没有和其他程序冲突

### 识别准确率低？

1. 检查麦克风输入——在系统设置里确认录音音量正常
2. 尝试切换模型——不同模型在不同场景下表现不同。Paraformer 中文最强，SenseVoice 多语言更灵活
3. 试试云端 ASR——准确率通常比本地模型更高

### 识别延迟高？

1. Paraformer 模型延迟最低，SenseVoice 次之，Whisper 最慢
2. 模型首次加载时会比较慢，加载一次后常驻内存，后续使用就快了

### 想卸载？

```bash
# 停用并禁用服务
systemctl --user disable --now vinput-daemon.service

# 卸载包（根据你的安装方式）
sudo pacman -R fcitx5-vinput          # Arch
sudo dnf remove fcitx5-vinput         # Fedora
sudo apt remove fcitx5-vinput         # Ubuntu/Debian
flatpak uninstall org.fcitx.Fcitx5.Addon.Vinput  # Flatpak

# 清理数据（可选）
rm -rf ~/.local/share/vinput ~/.config/vinput
```
