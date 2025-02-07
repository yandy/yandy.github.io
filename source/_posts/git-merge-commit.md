---
title: git 合并多个commit为一个
date: 2025-02-06 23:57:53
categories: [ 按图索骥 ]
tags:
  - git
  - xops
---

有时候为了使 git log 看起来更简洁，需要合并多个commit为一个(例如：在一个分支做开发时，创建了很多commit，提交Pull Request，需要作为一个commit 提交)

<!-- more -->

## 方案1，使用 reset

```bash
# 假设需要将commit id 为abcd 之后的所有commits(不包括 abcd)合并为一个
git reset --soft abcd
git commit

# 假设需要将最新的3个commit合并为1个
git reset --soft HEAD~3
git commit
```

## 方案2，使用 rebase

```bash
# 假设需要将commit id 为abcd 之后的所有commits(不包括 abcd)合并为一个
git rebase -i abcd
# follow the instruction, change "pick" to "squash" of the commits you don't want to keep

# 假设需要将最新的3个commit合并为1个
git rebase -i HEAD~3
# follow the instruction
# follow the instruction, change "pick" to "squash" of the commits you don't want to keep
```
