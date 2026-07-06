---
title: fcitx5-vinput 语音输入法安装与配置指南
toc: true
date: 2026-07-06 19:00:00
categories: ['最佳实践']
tags:
  - linux
  - 语音输入
  - fcitx5
  - 教程
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
