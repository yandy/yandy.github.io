---
title: 基于 Comfy UI 构建本地媒体生成工具
---


## 安装

```sh
git clone --depth 1 --branch v0.43.0 https://github.com/Comfy-Org/ComfyUI.git
# for nvidia
uv pip install torch torchvision torchaudio --extra-index-url https://download.pytorch.org/whl/cu130
# for amd
# uv pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/rocm7.2
uv pip install -r requirements.txt
uv pip install -r manager_requirements.txt
```

写一个启动脚本且在 `PATH` 中, 例如 `~/.local/bin/comfy-ui`：

```bash
#!/bin/bash -e

cd "/path/to/ComfyUI"

exec uv run main.py "$@"
```


## 升级
```sh
git fetch --depth 1 origin tag <other-tag> && git checkout FETCH_HEAD
uv pip install -r requirements.txt
uv pip install -r manager_requirements.txt
```

## 使用
```sh
# 启动
comfy-ui --enable-manager

# 搭建 workflow
# 搜索模板，下载保存
# 搜索与下载 model 到： /path/to/ComfyUI/models
git clone https://www.modelscope.cn/Qwen/Qwen-Image-2.1-Turbo.git # huggingface 比较慢，常见模型可以去 modelscope 下载

```

## comfy-cli
```sh
uv tool install comfy-cli

comfy setup --where local --project-dir ~/workspace/comfy --skip-skills --skip-verify
cd ~/workspace/comfy
comfy skills install --target claude-code --scope project

```
