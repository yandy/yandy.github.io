---
title: tmux 使用概述
toc: true
date: 2026-04-03 14:24:23
categories:
  - 按图索骥
tags:
  - linux
  - xops
---

## 一、核心概念
### 简述
tmux 是**分层的终端工作空间**，三者是**包含关系**，从大到小：
✅ **Session（会话）** = 「整个项目/工作区」（比如：写代码一个Session、办公一个Session）
✅ **Window（窗口）** = 「Session里的标签页(Tab)」（你要的Tab功能就是它！）
✅ **Pane（窗格）** = 「Window里的分屏」（一个Tab切多个小终端）

<!-- more -->

### 层级结构图（一眼看懂）
```
📦 Session 1 (项目A：后端开发)  # 顶级容器，关闭终端也后台保留
├─ 🪟 Window 1 (Tab1：代码)    # 标签页1
│  ├─ 📌 Pane 1 (vim编辑)      # 分屏1
│  └─ 📌 Pane 2 (运行服务)     # 分屏2
├─ 🪟 Window 2 (Tab2：日志)    # 标签页2
└─ 🪟 Window 3 (Tab3：数据库)  # 标签页3

📦 Session 2 (项目B：前端开发)  # 独立工作区，互不干扰
└─ 🪟 Window 1 (Tab1：启动项目)
```

### 关键特性
1. **Session**：关闭Alacritty窗口，Session会**后台挂起**，下次能重新连接（tmux 核心功能）
2. **Window**：就是你要的**标签页(Tab)**，一个Session可以开无数个Tab
3. **Pane**：分屏用，不影响Tab逻辑

---

## 二、前置知识（必看）

#### 前缀键
tmux 所有快捷键都需要先按 **前缀键**：
`Ctrl + b`（按下松开）→ 再按 命令键

#### 推荐tmux配置

`~/.tmux.conf`

```
# 开启鼠标支持（点Tab、分屏、滚轮都能用）
set -g mouse on
# 开启256色
set -g default-terminal "xterm-256color"
# 状态栏显示Tab名称
set -g status on
# 开启vi模式
set -g mode-keys vi
set -g status-keys vi
```  
---

## 三、常用操作（按功能分类，直接背）
### 1. Session 操作（管理整个工作区）
| 操作 | 命令/快捷键 | 作用 |
|------|------------|------|
| 新建会话 | `tmux new -s my_project` | 新建名为`my_project`的会话 |
| 挂起会话（后台保留） | `前缀 + d` | **退出不关闭**，终端后台运行 |
| 列出所有会话 | `tmux ls` / `前缀 + s` | 查看所有后台工作区 |
| 重新连接会话 | `tmux a -t my_project` | 回到之前的工作区 |
| 关闭会话 | `tmux kill-session -t my_project` | 彻底删除整个工作区 |
| 切换会话 | `前缀 + s` | 菜单选择切换 |

---

### 2. Window 操作（🔥 就是你要的 Tab 标签页！）
这是你在Alacritty里用tmux开Tab的**核心操作**，必记：
| 操作 | 快捷键 | 作用 |
|------|--------|------|
| 新建Tab | `前缀 + c` | 新建一个标签页 |
| 下一个Tab | `前缀 + n` | 切换到右边标签 |
| 上一个Tab | `前缀 + p` | 切换到左边标签 |
| 跳转到指定Tab | `前缀 + 数字` | 直接切到第N个标签 |
| 重命名Tab | `前缀 + ,` | 修改标签名字（方便识别） |
| 关闭Tab | `前缀 + &` / 输入`exit` | 关闭当前标签 |
| 查看所有Tab | `前缀 + w` | 菜单选择标签 |

---

### 3. Pane 操作（分屏，补充常用）
| 操作 | 快捷键 | 作用 |
|------|--------|------|
| 左右分屏 | `前缀 + %` | 把当前Tab切成左右两部分 |
| 上下分屏 | `前缀 + "` | 把当前Tab切成上下两部分 |
| 切换分屏 | `前缀 + 方向键` | 在分屏间切换 |
| 关闭分屏 | `前缀 + x` | 关闭当前分屏 |
| 分屏菜单 | `前缀 + >` | 分屏操作菜单 |


### 4. Copy Mode（复制模式）
| Command | 快捷键 | 作用 |
|------|--------|------|
| copy-mode | `前缀 + [` | 进入复制模式 |
| cancel | `q` | 退出复制模式 |
| begin-selection | `Space` | 开始选择文本 |
| clear-selection | `Esc` | 取消选择文本 |
| copy-selection-and-cancel | `Enter` | 复制选中的文本并退出复制模式 |

### 5. Vi 光标操作(复制模式)

| 快捷键 | 作用 |
|------|--------|
| j | Move the cursor down |
| h | Move the cursot left |
| l | Move the cursor right |
| k | Move the cursor up |
| ^ | Move the cursor to the start of the line |
| $ | Move the cursor to the end of the line |
| g | Move the cursor to the top of the history |
| M | Move the cursor to the middle line |
| G | Move the cursor to the bottom of the history |
| C-f | Page down |
| C-b | Page up |
| b | Move the cursor to the previous word |
| e | Move the cursor to the end of the next word |
| / | Search forwards, the first argument is the search term |
| n | Repeat the last search |
| N | Repeat the last search but reverse the direction |
