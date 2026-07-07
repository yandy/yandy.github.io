---
title: 基于 llama.cpp 搭建本地 LLM API 服务
toc: true
date: 2026-07-07 20:00:00
categories: ['最佳实践']
tags:
  - llm
---

本文介绍如何用 llama.cpp 在自己的机器上搭建一个 OpenAI 兼容的 LLM API 服务——安装、下载模型、启动，三步搞定。

> 💡 不熟悉 GGUF、量化、推理引擎、tok/s 等概念？建议先阅读 [LLM 本地部署核心概念图解](./local-llm-concepts/)，了解这些组件的关系后再动手。

<!-- more -->

## 为什么选 llama.cpp

在不需要聊天界面、只需要 API 的场景下，llama.cpp 的优势：

- **零依赖**：单个二进制文件，不需要 Python、Docker、Node.js
- **跨平台**：NVIDIA / AMD / Apple Silicon / 纯 CPU 都能跑
- **最轻量**：启动快（秒级），占用少，嵌入式设备都能跑
- **OpenAI 兼容 API**：`llama-server` 直接暴露 `/v1/chat/completions` 等端点，现有代码改一行 URL 就能用
- **离线运行**：不需要网络连接，模型文件拷到 U 盘就能在气隙环境跑

对比 vLLM：vLLM 需要 NVIDIA GPU + Python + Docker，但单用户场景下速度和 llama.cpp 几乎一样。如果你只有 CPU、Mac 或者 AMD 显卡，llama.cpp 是唯一选择；如果你有 NVIDIA GPU 且需要 Anthropic API 格式或完整 OpenAI 字段，才考虑 vLLM。

## 前置条件

- 至少 **8 GB 可用内存**（跑 7B 模型）或 **16 GB**（跑 13B 模型）
- 如果要用 GPU 加速：NVIDIA 显卡需要 CUDA 驱动，AMD 需要 ROCm，Mac 自动使用 Metal
- 从源码编译需要：编译器（gcc/clang）、CMake
- 有足够的硬盘空间（模型文件通常 4-20 GB）

## 第一步：安装 llama.cpp

两种方式：包管理器最快，从源码编译最灵活（支持自定义 GPU 架构、新显卡等）。

### 方式一：包管理器（推荐）

```bash
# macOS
brew install llama.cpp

# Linux (Nix)
nix profile install nixpkgs#llama.cpp

# Windows
winget install llama.cpp

# conda
conda install -c conda-forge llama.cpp
```

安装后验证：

```bash
llama-server --version
```

> 包管理器安装的版本通常已包含主流 GPU 后端，一般直接可用。如果遇到 GPU 识别不到（比如很新的显卡），跳到方式二从源码编译。

### 方式二：从源码编译

如果你的显卡很新（RTX 50 系列等 Blackwell 架构），或者包管理器版本不包含你需要的 GPU 后端，从源码编译最可靠。

```bash
git clone https://github.com/ggml-org/llama.cpp
cd llama.cpp
cmake -B build -DBUILD_SHARED_LIBS=OFF
cmake --build build --config Release -j 12 # <= 你的 cpu cores
```

编译完成后，可执行文件在 `build/bin/` 下。可以拷到 PATH 中方便使用：

```bash
cp build/bin/llama-server build/bin/llama-cli ~/.local/bin/
```

**GPU 后端编译选项**

默认 `cmake -B build` 会自动检测系统上的 GPU 并启用对应后端。如果需要手动指定：

```bash
# NVIDIA CUDA（默认自动检测架构，新显卡如 RTX 5060 可显式指定）
cmake -B build -DGGML_CUDA=ON -DBUILD_SHARED_LIBS=OFF

# AMD ROCm
cmake -B build -DGGML_HIP=ON -DBUILD_SHARED_LIBS=OFF

# Vulkan（跨平台通用 GPU）
cmake -B build -DGGML_VULKAN=ON -DBUILD_SHARED_LIBS=OFF

# Apple Metal（macOS 自动启用）
cmake -B build -DBUILD_SHARED_LIBS=OFF
```

## 第二步：准备模型文件

llama.cpp 只认 GGUF 格式。去 HuggingFace 搜索 `<模型名>-GGUF` 就能找到。

### 2.1 自动下载（推荐）

`llama-server` 内置了 HuggingFace 下载功能，用 `-hf` 参数指定模型仓库，首次启动时自动下载并缓存——不需要手动 `wget`，一条命令搞定：

```bash
# 格式：-hf user/model[:量化]
llama-server -hf Qwen/Qwen3-8B-GGUF:q4_k_m --port 8080
```

`-hf` 会自动选择仓库中匹配量化级别的 GGUF 文件，下载到 HuggingFace 缓存目录（`~/.cache/huggingface/hub/`），后续启动直接使用缓存，不再重复下载。

如果 HuggingFace 下载慢，换镜像站：

```bash
HF_ENDPOINT=https://hf-mirror.com llama-server -hf Qwen/Qwen3-8B-GGUF:q4_k_m --port 8080
# or use MODEL_ENDPOINT env
MODEL_ENDPOINT=https://hf-mirror.com llama-server -hf Qwen/Qwen3-8B-GGUF:q4_k_m --port 8080
```

### 2.2 手动下载

如果你想精确控制版本和量化级别，也可以手动下载：

```bash
mkdir -p ~/.local/share/llama.cpp/models
wget -P ~/.local/share/llama.cpp/models \
  https://huggingface.co/Qwen/Qwen3-14B-GGUF/resolve/main/qwen3-14b-q4_k_m.gguf
```

如果 HuggingFace 下载慢，换镜像站：

```bash
wget -P ~/.local/share/llama.cpp/models \
  https://hf-mirror.com/Qwen/Qwen3-14B-GGUF/resolve/main/qwen3-14b-q4_k_m.gguf
```

### 2.3 模型选择建议

| 模型 | 量化 | 体积 | 需要内存 | 适用 |
|------|------|------|---------|------|
| Qwen3-8B | Q4_K_M | ~5 GB | 8 GB | 普通笔记本、8GB 显卡 |
| Qwen3-14B | Q4_K_M | ~9 GB | 16 GB | 游戏本、16GB Mac |
| Qwen3-32B | Q4_K_M | ~19 GB | 24 GB | RTX 3090/4090 |
| Llama 3.1-8B | Q4_K_M | ~5 GB | 8 GB | 通用英文场景 |
| DeepSeek-R1-7B | Q4_K_M | ~4.5 GB | 8 GB | 推理能力强的轻量选择 |

> **中文场景首推 Qwen3 系列**（阿里出品，中文能力突出），英文为主选 Llama 3.1。

## 第三步：启动 API 服务

### 基础启动

用 `-hf` 自动下载并启动（推荐）：

```bash
llama-server -hf Qwen/Qwen3-8B-GGUF:q4_k_m --port 8080
```

或者手动下载后用 `-m` 指定本地文件：

```bash
llama-server -m ~/.local/share/llama.cpp/models/qwen3-14b-q4_k_m.gguf --port 8080
```

启动后会看到：

```
main: server is listening on http://127.0.0.1:8080
```

### GPU 加速

```bash
# GPU 加速：-ngl 99 表示尽可能多的层放到 GPU
# 纯 CPU 也能跑，不需要 -ngl 参数
llama-server -hf Qwen/Qwen3-8B-GGUF:q4_k_m --port 8080 -ngl 99
```

如果显存不够装下全部层，减少 `-ngl` 的值（比如 `-ngl 20`）。

### 常用启动参数

| 参数 | 说明 | 示例 |
|------|------|------|
| `-hf` | HuggingFace 仓库名[:量化] | `-hf Qwen/Qwen3-8B-GGUF:q4_k_m` |
| `-m` | 模型文件路径 | `-m model.gguf` |
| `--port` | API 监听端口 | `--port 8080` |
| `-ngl` | GPU 加速层数 | `-ngl 99`（尽可能用 GPU） |
| `-c` | 上下文窗口大小 | `-c 8192` |
| `--host` | 监听地址 | `--host 0.0.0.0`（允许局域网访问） |
| `--threads` | CPU 推理线程数 | `--threads 8` |
| `--api-key` | 设置 API Key | `--api-key my-key`（默认不需要） |

> **让局域网其他设备也能访问**：`llama-server -hf Qwen/Qwen3-8B-GGUF:q4_k_m --host 0.0.0.0 --port 8080`

---

## 第四步：测试 API

### curl 测试

```bash
# 基础对话
curl http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "你好，用一句话介绍你自己"}]
  }'
```

> 注意：`model` 字段填什么都可以（llama-server 不校验），填 `"gpt-3.5-turbo"` 是为了兼容现有代码。

### Python 调用（OpenAI SDK）

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8080/v1",  # 改这一行
    api_key="not-needed"
)

response = client.chat.completions.create(
    model="qwen3",
    messages=[{"role": "user", "content": "你好"}]
)

print(response.choices[0].message.content)
```

### JavaScript 调用

```javascript
const response = await fetch("http://localhost:8080/v1/chat/completions", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "qwen3",
    messages: [{ role: "user", content: "你好" }]
  })
});

const data = await response.json();
console.log(data.choices[0].message.content);
```

---

## 第五步：后台运行

### 所有平台通用

```bash
# 用 -hf 自动下载（推荐）
nohup llama-server -hf Qwen/Qwen3-8B-GGUF:q4_k_m --port 8080 > llama.log 2>&1 &

# 或指定本地文件
nohup llama-server -m ~/.local/share/llama.cpp/models/qwen3-14b-q4_k_m.gguf --port 8080 > llama.log 2>&1 &

# 停止
pkill llama-server
```

### Linux / macOS（systemd）

创建 service 文件 `~/.config/systemd/user/llama-server.service`：

```ini
[Unit]
Description=llama.cpp API Server
After=network.target

[Service]
ExecStart=%h/.local/bin/llama-server --port 8080
Restart=always
RestartSec=10

[Install]
WantedBy=default.target
```

```bash
systemctl --user enable --now llama-server.service
systemctl --user status llama-server.service
```

---

## 进阶：API 端点一览

llama-server 提供的完整端点列表：

| 端点 | 方法 | 说明 |
|------|------|------|
| `/v1/chat/completions` | POST | Chat 对话（最常用） |
| `/v1/completions` | POST | 文本续写 |
| `/v1/embeddings` | POST | 获取文本向量 |
| `/v1/models` | GET | 列出可用模型 |
| `/health` | GET | 健康检查 |
| `/slots` | GET | 当前推理槽位状态 |

---

## 常见问题

### Q: 启动后提示 "model not found"？

如果用的 `-m`：确认模型文件路径正确，要写完整路径或相对路径。

如果用的 `-hf`：确认仓库名正确（区分大小写，必须有 `-GGUF` 后缀），量化参数格式为 `:q4_k_m`（注意是冒号分隔）。

### Q: `-hf` 下载的模型存放在哪？

默认存放在 HuggingFace 缓存目录 `~/.cache/huggingface/hub/`。如果配置了镜像，检查镜像站是否正确响应。

### Q: 换不同量化版本怎么操作？

用 `-hf` 的话直接改量化参数即可，已下载过的不会被重复下载：

```bash
# 从 q4_k_m 切换到 q8_0
llama-server -hf Qwen/Qwen3-8B-GGUF:q8_0 --port 8080
```

### Q: 新显卡（RTX 50 系列）CUDA 不识别？

从源码编译，启用 `CMAKE_CUDA_ARCHITECTURES="native"`，让 cmake 自动检测 Blackwell 架构：

```bash
cmake -B build -DGGML_CUDA=ON -DCMAKE_CUDA_ARCHITECTURES="native"
cmake --build build --config Release
```

### Q: 显存不够怎么办？

1. 换更小的量化版本（Q4_K_M → Q3_K_M → Q2_K）
2. 换更小的模型（14B → 8B → 3B）
3. 减少 GPU 层数：`-ngl 10`（只把 10 层放到 GPU，其余用 CPU + 内存跑）

### Q: 速度太慢？

1. 如果有 GPU，加上 `-ngl 99` 参数
2. CPU 推理时加 `--threads` 参数，设为 CPU 物理核心数
3. 换更小的量化级别（注意 Q8_0 比 Q4_K_M 加载更大，反而更慢）
4. 换更小的模型

### Q: 如何查看当前推理速度？

启动后在日志中找 `eval time`：

```
llama_perf_context_print: eval time =  1234.56 ms / 45 runs (27.43 ms per token, 36.45 tokens per second)
```

### Q: 怎么更新模型？

如果用的 `-hf`，直接重启即可——llama.cpp 会自动拉取仓库中最新的 GGUF 文件。如果想强制重新下载，删除缓存后重启：

```bash
rm -rf ~/.cache/huggingface/hub/models--Qwen--Qwen3-8B-GGUF/
pkill llama-server
llama-server -hf Qwen/Qwen3-8B-GGUF:q4_k_m --port 8080 &
```

如果手动下载的模型：

```bash
# 删除旧文件
rm ~/.local/share/llama.cpp/models/qwen3-14b-q4_k_m.gguf

# 下载新版
wget -P ~/.local/share/llama.cpp/models \
  https://huggingface.co/Qwen/Qwen3-14B-GGUF/resolve/main/qwen3-14b-q4_k_m.gguf

# 重启服务
pkill llama-server
llama-server -m ~/.local/share/llama.cpp/models/qwen3-14b-q4_k_m.gguf --port 8080 &
```

### Q: 如何从源码更新 llama.cpp？

```bash
cd llama.cpp
git pull
cmake -B build
cmake --build build --config Release

# 更新 PATH 中的二进制
cp build/bin/llama-server build/bin/llama-cli ~/.local/bin/

# 重启服务
pkill llama-server
```

### Q: 如何卸载？

```bash
# 停止服务
pkill llama-server

# 删除二进制
rm ~/.local/bin/llama-server ~/.local/bin/llama-cli

# 删除模型文件
rm -rf ~/.local/share/llama.cpp/models/

# 删除源码和编译产物
rm -rf /path/to/llama.cpp

# 如果用的包管理器
brew uninstall llama.cpp               # macOS
nix profile remove nixpkgs#llama.cpp   # Nix
```

## 参考

- [llama.cpp GitHub](https://github.com/ggml-org/llama.cpp)
- [llama.cpp 官方文档](https://github.com/ggml-org/llama.cpp/tree/master/docs)
- [HuggingFace GGUF 模型列表](https://huggingface.co/models?library=gguf&sort=trending)
- [llama.cpp API 参考](https://github.com/ggml-org/llama.cpp/tree/master/tools/server)
- [LLM 本地部署核心概念图解](./local-llm-concepts/)
