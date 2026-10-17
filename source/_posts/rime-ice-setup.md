---
title: 雾凇拼音（rime-ice）安装与使用指南
toc: true
date: 2026-10-18 10:00:00
categories: ['按图索骥']
tags:
  - linux
  - rime
  - cachyos
---

Rime 自带的「朙月拼音·简化字」虽然能用，但词库偏旧，长词和网络词汇的命中率一般，开箱体验并不算好。[雾凇拼音](https://dvel.me/posts/rime-ice/)（[iDvel/rime-ice](https://github.com/iDvel/rime-ice)）是目前中文社区维护最活跃的 Rime 配置之一，提供了一套开箱即用的简体拼音方案和长期维护的词库，基本可以做到装完即用。

本文记录我在 CachyOS + Fcitx5 + fcitx5-rime 环境下的实际安装步骤和日常使用技巧。系统安装以及 Fcitx5、fcitx5-rime 的基础配置已经在 [Cachy OS(ArchLinux) 入坑记录](./cachy-os-archlinux-setup-recording.md) 中完成，本文默认你已经具备这个前提。

<!-- more -->

## 为什么选择雾凇拼音

- **开箱即用**：方案、词库、Lua 功能、Emoji 映射都在一个包里配好，不需要自己拼配置。
- **词库长期维护**：在通用规范汉字表、现代汉语常用词表、华宇野风、清华词库、腾讯词向量等来源上做了大量校对和调频，「的」「了」这类高频字的排序明显更顺手。
- **功能齐全**：中英混输、拆字反查、以词定字、日期/农历/金额大写/计算器/Unicode 等功能默认就带，且配置里都有中文注释。
- **更新活跃**：上游几乎每周都有提交，词库问题提 issue 后修得很快。
- **配置可持续**：采用补丁（patch）方式覆盖默认配置，升级包时自己的定制不会被冲掉。

代价是它比默认方案「重」一些：首次部署要编译较大的词库，会等几十秒；另外 rime-ice 系列包与 `rime-emoji` 等包存在文件冲突，双拼变体还可能和系统的 `rime-double-pinyin` 冲突，安装前需要清理同类包。

## 安装

### 安装方案包

在 Arch/CachyOS 下直接用 AUR helper 安装全拼方案：

```bash
paru -S rime-ice-pinyin-git
```

这个包只包含**雾凇拼音的全拼方案**。如果你用双拼，需要安装对应的变体包：

| 包名 | 方案 |
| --- | --- |
| `rime-ice-pinyin-git` | 雾凇拼音（全拼） |
| `rime-ice-double-pinyin-flypy-git` | 小鹤双拼 |
| `rime-ice-double-pinyin-git` | 自然码双拼 |
| `rime-ice-double-pinyin-mspy-git` | 微软双拼 |
| `rime-ice-git` | 包含全部方案 |

几个注意点：

- 这些包**互相冲突**，也与 `rime-emoji` 等包冲突；双拼变体还可能和系统的 `rime-double-pinyin` 冲突。安装前先用 `pacman -Qs rime` 看一下，把同类包卸掉。
- 如果启用了 [archlinuxcn 源](https://www.archlinuxcn.org/archlinux-cn-repo-and-mirror/)，`paru` 会优先安装仓库里的预编译包，比从 AUR 现场编译快得多。AUR 的 PKGBUILD 会用 `rime_deployer` 预先编译方案依赖的词库，耗时较长。
- 包只会把方案和词库安装到 `/usr/share/rime-data`，不会改动用户目录。个人配置仍然放在 `~/.local/share/fcitx5/rime`。

### 清理旧配置

安装完成后，先备份或清空原来的 Rime 用户目录：

```bash
# 推荐先备份，之后想回退随时可以改回来
mv ~/.local/share/fcitx5/rime ~/.local/share/fcitx5/rime.bak.$(date +%Y%m%d)

# 如果确定不需要旧配置，也可以直接删除
# rm -r ~/.local/share/fcitx5/rime

mkdir -p ~/.local/share/fcitx5/rime
```

这一步不要省。旧的 `build/` 缓存、`default.custom.yaml` 里的方案列表、以及朙月拼音的 `*.userdb` 用户词典都还留在里面，直接覆盖容易继续加载旧方案，或者出现候选词异常。雾凇拼音官方文档在手动安装时也建议「备份原先配置，清空配置目录」。

### 创建 default.custom.yaml

新建用户补丁文件：

```bash
touch ~/.local/share/fcitx5/rime/default.custom.yaml
```

编辑 `~/.local/share/fcitx5/rime/default.custom.yaml`，写入：

```yaml
patch:
  # 这里的 rime_ice_suggestion 为雾凇方案的默认预设
  __include: rime_ice_suggestion:/
```

这短短两行的作用是：`rime_ice_suggestion.yaml` 由包安装在共享目录中，里面是雾凇拼音完整的默认配置（方案列表、候选词数量、快捷键等）。用 `patch` + `__include` 把它包含进来，而不是整份复制到用户目录，既能直接使用上游默认值，后续升级包时也能自动获得新的默认配置，自己额外的定制再写在同一个 `patch` 下面即可。

### 部署并切换方案

保存配置后需要让 Rime 重新部署：

1. 先切换到 Rime 输入法，点击 Fcitx5 托盘里的输入法图标（显示「中」或「A」）。
2. 在弹出的菜单底部选择「部署」（英文界面为 Deploy）。
3. 等待部署完成。首次部署需要编译词库，通常要几十秒，期间输入法可能暂时不可用。

也可以用命令行触发重新部署：

```bash
dbus-send --session --print-reply --dest=org.fcitx.Fcitx5 /controller org.fcitx.Fcitx.Controller1.SetConfig string:"fcitx://config/addon/rime/deploy" variant:string:""
```

如果系统里装了 `qdbus`，对应的写法是：

```bash
qdbus org.fcitx.Fcitx5 /controller org.fcitx.Fcitx.Controller1.SetConfig "fcitx://config/addon/rime/deploy" ""
```

部署完成后可以验证一下生成物：

```bash
ls ~/.local/share/fcitx5/rime/build/rime_ice.schema.yaml
```

正常情况下至少会生成 `rime_ice.schema.yaml`。如果是通过 AUR/archlinuxcn 包安装，`table.bin`、`reverse.bin` 这类体积较大的编译产物可能直接复用 `/usr/share/rime-data/build` 里的预编译版本，不一定出现在用户目录，这是正常的。

然后在托盘菜单中选择「雾凇拼音」。也可以按 `F4` 或 `` Ctrl+` `` 呼出方案选单。选择一次之后，`~/.local/share/fcitx5/rime/user.yaml` 里会出现 `previously_selected_schema: rime_ice`，下次启动会自动使用雾凇拼音。

## 日常使用

### 快捷键速查

| 操作 | 快捷键 |
| --- | --- |
| 呼出方案选单 | `F4`、`` Ctrl+` `` |
| 中英文切换 | `Shift`（上屏已输入的编码后切英文）；`Caps Lock`（清空编码并切换大写） |
| 简繁切换 | `Ctrl+Shift+4` |
| 中英标点切换 | `Ctrl+Shift+3` |
| 上下翻页 | `-` / `=` |
| 选择候选词 | `1` ~ `5`（默认每页 5 个） |
| 以词定字 | `[` 取当前词第一个字，`]` 取最后一个字 |
| 在拼音间移动光标 | `Tab` / `Shift+Tab`，或 `Alt+←/→` |
| 删除单个音节 | `Shift+BackSpace` |
| 原样上屏编码 | `Enter`（上屏字母）；`Ctrl/Shift+Enter`（上屏带空格的拼音） |

> 雾凇拼音目前默认用 `-` / `=` 翻页，`[` `]` 留给了「以词定字」。这和很多老 Rime 教程里「中括号翻页」的习惯不同，不要被旧文章带偏。

### 内置输入技巧

除了普通拼音，雾凇拼音还内置了一批触发词，熟练之后能省不少事：

| 输入 | 效果 |
| --- | --- |
| `rq` / `sj` / `xq` | 当前日期 / 时间 / 星期 |
| `dt` / `ts` | ISO 8601 时间 / Unix 时间戳 |
| `nl` | 当前农历 |
| `R1234` | 数字金额大写：一千二百三十四、壹仟贰佰叁拾肆元整 |
| `cC1+2*3` | 简易计算器 |
| `U62fc` | Unicode 码位转字符，得到「拼」 |
| `uuid` | 生成一个 UUID |
| `vhelp` | 符号索引，`vxh` 星号、`vjt` 箭头、`vsx` 数学符号等 |
| `uUnvzi` | 拆字反查，由「女」「子」查到「好」 |
| 拼音 + `` ` `` + 部件 | 拆字辅码，用于在候选中筛选同音字 |

Emoji 默认开启，部分词语的候选里会直接带出对应的表情。中英文混输也是默认支持的，输入英文单词即可得到英文候选，不需要切换到单独的英文输入法。

## 常用自定义

### 调整候选词数量

默认每页 5 个候选，觉得少可以在 `default.custom.yaml` 中追加一行：

```yaml
patch:
  __include: rime_ice_suggestion:/
  menu/page_size: 8
```

### 改用逗号、句号翻页

习惯 `,` / `.` 翻页的话，用 `/+` 在默认快捷键列表后追加：

```yaml
patch:
  __include: rime_ice_suggestion:/
  key_binder/bindings/+:
    - { when: paging, accept: comma, send: Page_Up }
    - { when: has_menu, accept: period, send: Page_Down }
```

注意句号翻页会和网址、小数点的输入习惯冲突；如果经常输入 `github.com` 或 `3.14`，建议保留默认的 `-` / `=`。

### 区分全局配置和方案配置

- 方案列表、候选词数量、通用快捷键这类**全局设置**，写在 `default.custom.yaml`。
- 只针对雾凇拼音的改动，写在 `rime_ice.custom.yaml`，例如给用户词典里已有的候选加一个 `*` 标记：

```yaml
patch:
  engine/filters/+:
    - lua_filter@*is_in_user_dict
  is_in_user_dict: true
```

两个文件的语法都是以 `patch:` 开头，改完都要重新部署。不要把同一个配置项同时写在两个文件里，否则容易互相覆盖，排查起来很麻烦。

## 更新

启用 archlinuxcn 源时，跟着系统更新即可：

```bash
paru -Syu
```

如果装的是 AUR 的 `-git` 包，`paru` 会在上游有新提交时自动重新构建；词库编译耗时较长，属于正常现象。更新完成后建议手动「部署」一次，让新词库生效。

## 常见问题

### 部署后还是朙月拼音，找不到雾凇拼音

按顺序检查：

1. `~/.local/share/fcitx5/rime/default.custom.yaml` 是否存在，内容是否正确（缩进必须是空格，不能用 Tab）。
2. 旧的用户目录是否确实清理或备份走了，尤其是 `build/` 和旧的 `default.custom.yaml`。
3. 是否执行过「部署」，以及部署是否成功完成。
4. `~/.local/share/fcitx5/rime/build/rime_ice.schema.yaml` 是否生成。

### 部署很慢或看起来卡住了

首次部署需要生成或编译词库，几十秒到几分钟都正常，期间不要反复点部署。如果确实失败，可以查看 `/tmp/rime.*` 日志（不同前端日志名可能不同），或者在终端里运行 `fcitx5 -r` 观察输出。

### 报 librime 的 symbol lookup error

典型报错是：

```text
symbol lookup error: /usr/lib/librime.so.1: undefined symbol: _ZTIN6marisa9ExceptionE
```

这是 `librime` 与 `yaml-cpp` 等依赖的版本不匹配导致的，和雾凇配置本身无关。可以重新安装/重编译 `librime`，或者改用 archlinuxcn 的 `librime-luajit`。这类问题在滚动更新的 Arch 系上偶尔会遇到，换用匹配版本的 `librime` 后重新部署通常就能恢复。

### 安装时提示文件冲突

rime-ice 系列包与 `rime-ice-git`、其他双拼变体、`rime-emoji` 等包存在同名文件；部分双拼包还会和系统的 `rime-double-pinyin` 冲突。先卸载冲突的包再安装，不要用 `--overwrite` 硬覆盖。

### 中括号不能翻页

雾凇拼音把 `[` `]` 用作「以词定字」，默认翻页是 `-` / `=`。如果一定要用中括号翻页，需要同时修改以词定字快捷键，否则两个功能会抢按键。

### 修改配置后没有生效

Rime 不会自动监听配置文件变化，改完必须重新部署。另外确认改的是正确的文件：全局配置放 `default.custom.yaml`，方案配置放 `rime_ice.custom.yaml`。

## 总结

在 CachyOS + Fcitx5 环境下，雾凇拼音的安装可以浓缩成四步：

```bash
paru -S rime-ice-pinyin-git
mv ~/.local/share/fcitx5/rime ~/.local/share/fcitx5/rime.bak
mkdir -p ~/.local/share/fcitx5/rime
# 写入 default.custom.yaml 后，在托盘菜单点「部署」
```

装好之后，词库、长词、英文混输和各类触发词的体验都比默认的朙月拼音好上一截，而且所有定制都能用补丁文件管理，升级时不用担心被覆盖。如果你也在 Linux 上长期用 Rime，值得花这十分钟换一次。
