---
title: ASR、语音识别模型与输入法核心概念图解
toc: true
date: 2026-07-06 21:00:00
categories: ['刨根问底']
tags:
  - linux
  - asr
  - 语音输入
  - 概念
---

想给 Linux 搞语音输入，你会频繁遇到几个名词：ASR、VAD、FunASR、sherpa-onnx、Paraformer、Whisper、SenseVoice、SLM……它们分别是什么？之间什么关系？本文用最直白的方式讲清楚。

<!-- more -->

## 一次语音输入的全流程

按下快捷键说话，到屏幕上出现文字，整个流程可以切成 6 步：

```
你说"今天天气真好"
    │
    ▼
[1. 麦克风采集]     PipeWire/PulseAudio 捕捉音频
    │
    ▼
[2. VAD 语音检测]   判断"有人说话了"，精确切出语音片段
    │
    ▼
[3. ASR 引擎推理]   把音频波形转换成文字
    │
    ▼
[4. 标点恢复]       给文字加上标点符号
    │
    ▼
[5. 后处理/润色]    （可选）用语言模型纠错、润色
    │
    ▼
[6. 注入输入法]     通过 Fcitx5/IBus 把文字插入到当前窗口
    │
    ▼
  "今天天气真好。" ✅
```

---

## 分层架构总览

所有语音输入方案可以按**层级**来理解：

```
┌─────────────────────────────────────────┐
│  Vinput GUI / CLI                        │  ← 用户交互层
├─────────────────────────────────────────┤
│  Scene 系统 (LLM 纠错/翻译/格式化)        │  ← 后处理层（可选）
├─────────────────────────────────────────┤
│  ASR 模型 (Paraformer / Whisper / ...)   │  ← 识别层
├─────────────────────────────────────────┤
│  ASR 引擎 (FunASR / sherpa-onnx / ...)   │  ← 推理层
├─────────────────────────────────────────┤
│  VAD (silero-vad / FSMN-VAD / ...)       │  ← 语音检测层
├─────────────────────────────────────────┤
│  音频采集 (PipeWire / PulseAudio / ALSA)  │  ← 硬件接入层
└─────────────────────────────────────────┘
```

**引擎和模型是两层不同的东西**——这个区分是最重要的。用类比来记：

```
ASR 引擎 = DVD 播放器（基础设施，负责加载和运行）
ASR 模型 = 电影光盘（神经网络，真正做识别）
```

同一个引擎可以跑不同的模型，就像同一台播放器可以播不同的光盘。

---

## 核心概念：ASR 引擎

### FunASR（阿里巴巴达摩院）

FunASR 是阿里达摩院开源的**工业级语音识别工具包**，提供端到端的完整方案——从模型训练到推理，还自带 VAD（语音活动检测）、标点恢复、情绪识别等配套模型。

- **语言**：Python
- **优势**：中文优化极好，VAD + ASR + 标点一站式搞定
- **代表项目**：[VocoType-linux](https://github.com/LeonardNJU/VocoType-linux)

### sherpa-onnx（K2-FSA 团队）

sherpa-onnx（13.4k ⭐）是一个**跨平台 ONNX 推理引擎**。名字拆开看：

- **sherpa**：夏尔巴人（登山向导），寓意"引导你的语音应用"
- **onnx**：ONNX（Open Neural Network Exchange，开放神经网络交换格式），一种跨框架的模型标准——不管模型是用 PyTorch 还是 TensorFlow 训练的，导出为 ONNX 后都能被 sherpa-onnx 高效运行

- **语言**：C++（支持 12 种编程语言调用）
- **优势**：高性能，跨平台覆盖面极广（x86/ARM/RISC-V/树莓派/手机/浏览器都能跑）
- **代表项目**：[fcitx5-vinput](https://github.com/xifan2333/fcitx5-vinput)

> **FunASR 与 sherpa-onnx 的关系**：FunASR 训练模型 → 导出为 ONNX 格式 → sherpa-onnx 运行该 ONNX 模型。两者不是对立的，而是互补的——sherpa-onnx 可以跑 FunASR 训练出来的所有模型。

### whisper.cpp

OpenAI Whisper 模型的高性能 C/C++ 移植版本，由社区维护。

- **语言**：C/C++
- **优势**：极致轻量，CPU 友好
- **限制**：只能跑 Whisper 系列模型，不支持中文优化的 Paraformer
- **代表项目**：[audiov](https://github.com/WhiteSmoogy/audiov)

---

## 核心概念：ASR 模型

模型是真正决定"识别得准不准"的核心。下面是 Linux 语音输入中最常见的四种模型：

### Paraformer（阿里达摩院）—— 中文王者

全称 **Parallel Transformer**。最关键的特性是 **"非自回归"架构**：

```
传统 ASR（自回归）：
  今 → 天 → 天 → 气 → 真 → 好
  一个字一个字串行生成，必须等前一个出来才能生成下一个
  → 慢

Paraformer（非自回归）：
  今 天 天 气 真 好
  所有字并行生成，一步到位
  → 快：号称 0.1 秒上屏
```

中文优化极好，中英混合也精准，是多个 Linux 语音输入方案的首选模型。

### Whisper（OpenAI）

OpenAI 开源的多语言模型，**通用性**是最大卖点——一个模型覆盖 97 种语言。

- **优势**：语言覆盖面广，生态成熟（whisper.cpp、faster-whisper 等优化版本多）
- **劣势**：中文识别不如 Paraformer（训练数据中中文比例低）；自回归架构，速度偏慢

### Zipformer（K2-FSA）

sherpa-onnx 团队自己开发并支持的模型。

- **架构**：Streaming Transducer（流式传感器）
- **特点**：**边说边出字**（streaming），不需要等说完；模型体积小，适合低配机器

### SenseVoice（阿里达摩院）

一个模型覆盖中文、粤语、英语、日语、韩语五种语言，支持多种中文方言，还能做情绪识别。属于"多面手"型。

---

## 引擎与模型的对应关系

```
┌──────────────────────────────────────────────────────────────┐
│  ASR 引擎                      支持的模型                      │
├──────────────────────────────────────────────────────────────┤
│  FunASR           →  Paraformer、SenseVoice                   │
│  sherpa-onnx      →  Paraformer、SenseVoice、Zipformer、       │
│                      Whisper（几乎所有）                       │
│  whisper.cpp      →  Whisper 系列                             │
└──────────────────────────────────────────────────────────────┘
```

sherpa-onnx 的模型范围最广：FunASR 训练的模型导出 ONNX 后它都能跑，还额外支持 Zipformer 等。

---

## 其他重要概念

### VAD（语音活动检测）

VAD = Voice Activity Detection。它判断"什么时候有人在说话"——没人说话时不做识别，省资源、避免噪音被误识别。

| VAD 模型 | 特点 |
|---|---|
| **silero-vad** | 通用型，sherpa-onnx 默认使用 |
| **FSMN-VAD** | FunASR 出品，中文语音优化，断句更精细 |

### 标点恢复（Punctuation）

语音里没有标点符号。你说"今天天气真好"和"今天天气真好！"听起来一样，但文字里需要区分。标点模型根据语义自动加标点。

### SLM / LLM 后处理

ASR 结果可能有错别字，后处理负责二次加工：

- **SLM（Small Language Model，小语言模型）**：轻量级模型，在本地运行，对识别结果做纠错。比如"今田天气真好" → "今天天气真好"
- **LLM（Large Language Model，大语言模型）**：像 GPT 这样的大模型，能做到更复杂的后处理——翻译、段落格式化、语气调整等

### Streaming vs Non-streaming

```
Streaming（流式）：     边说边出字 → 像直播字幕
Non-streaming（非流式）：说完再出结果 → 像录音转文字
```

Paraformer 默认是 non-streaming，但因为极快（0.1 秒），实际用起来感受和 streaming 差别不大。Zipformer 是原生的 streaming 模型。

---

## Linux 生态中的三个方案

目前在 Linux 上有三个活跃的开源语音输入方案，它们的技术选型对比如下：

```
┌─────────────────────────────────────────────────────────────┐
│  ASR 模型层                                                  │
│  Paraformer  │  SenseVoice  │  Zipformer  │  Whisper        │
├─────────────────────────────────────────────────────────────┤
│  ASR 引擎层                                                  │
│  FunASR(Python)  │  sherpa-onnx(C++)  │  whisper.cpp(C)     │
├─────────────────────────────────────────────────────────────┤
│  输入法集成层                                                │
│  VocoType-linux  │  fcitx5-vinput    │  audiov              │
│  (IBus+fcitx5)   │  (fcitx5 only)    │  (fcitx5+KDE only)  │
└─────────────────────────────────────────────────────────────┘
```

- **[VocoType-linux](https://github.com/LeonardNJU/VocoType-linux)**：基于 FunASR，100% 离线，中文优化到极致，支持 IBus + Fcitx5 双框架
- **[audiov](https://github.com/WhiteSmoogy/audiov)**：Rust 实现，whisper.cpp 引擎，轻量简洁，早期开发阶段
- **[fcitx5-vinput](https://github.com/xifan2333/fcitx5-vinput)**：C++ 实现，sherpa-onnx 引擎，模型覆盖最广，支持云端 ASR + LLM 后处理，社区最活跃

想动手配置的话，参考 [fcitx5-vinput 语音输入法安装与配置指南](./fcitx5-vinput-setup/)。
