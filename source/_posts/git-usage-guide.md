---
title: git 新手指南
toc: true
date: 2025-03-09 22:33:57
categories: ['按图索骥']
tags:
  - git
  - xops
---

## 安装配置

### 安装

#### Linux

**debian 系**
```bash
sudo apt-get install git
```

**rpm 系**
```bash
sudo dnf install git-all
```

#### Windows

```pwsh
winget install Git.Git
```

<!-- more -->

### 配置
```bash
git config --global user.name "Your Name"
git config --global user.email "your@example.com"
```

## 基本操作

### 基本概念

你的本地仓库由 git 维护的三棵“树”组成。第一个是你的 `工作目录`，它持有实际文件；第二个是 `暂存区（Index）`，它像个缓存区域，临时保存你的改动；最后是 `HEAD`，它指向你最后一次**提交**的结果。

![](2.1-1.png)

#### 提交(commit)

提交是git的核心概念，提交既是一个动词也是一个名词。

作为**名词**，表示暂存区的一个“快照”。一个提交，包含一个全局唯一的id，提交人相关信息，快照内容（本质上通过文件目录树记录快照），“上一/两个（parent）”提交的id（用来记录提交的演进历史，方便做回溯）

作为**动词**，表示根据暂存区生成提交的动作。

> git作为版本控制工具，其核心原理就是“提交”的管理。文末有阐述。

### 创建仓库

#### 将一个普通目录，转变为git仓库：`git init`

![](2.2-1.png)

![](2.2-2.png)

### 总览

#### 总览工作区、暂存区与HEAD的状态：`git status`

![](2.3-1.png)

![](2.3-2.png)

Changes to be committed 是暂存区里相对HEAD的变化

Changes not staged for commit 是工作区里相对暂存区的变化

Untracked files 是HEAD和暂存区中不存在，但是工作区中存在的文件

### 工作区到暂存区

#### 比较工作区和暂存区的差异：`git diff`

![](2.4-1.png)

#### 将工作区的变更保存到暂存区：`git add <dir_or_files>`

git add 命令接受的参数，可以是目录，也可以是文件

![](2.4-2.png)

当传入目录时，该目录下所有的文件都会被保存到暂存区

当传入文件时，仅将该文件保存到暂存区

### 暂存区到HEAD

#### 比较暂存区和HEAD的差异：`git diff --cached`

![](2.5-1.png)

#### 提交暂存区的变更: `git commit -m '<commit message>'`

![](2.5-2.png)

## 分支操作

### 提交树(commit tree)

前文提到，“提交”是项目某一时刻的快照，记录了文件的变化和相关说明。提交和提交形成“提交树”，提交树是一个有向无环图结构，展示了“提交”之间的演进关系。

### 查看提交树: `git log`

如果你想了解本地仓库的历史记录，最简单的命令就是使用:

`git log`

你可以添加一些参数来修改他的输出，从而得到自己想要的结果。 只看某一个人的提交记录:

`git log --author=bob`

一个压缩后的每一条提交记录只占一行的输出:

`git log --pretty=oneline`

或者你想通过 ASCII 艺术的树形结构来展示所有的分支, 每个分支都标示了他的名字和标签:

`git log --graph --oneline --decorate --all`

看看哪些文件改变了:

`git log --name-status`

这些只是你可以使用的参数中很小的一部分。更多的信息，参考：

`git log --help`

下图是一个git log示例

![](3.2-1.png)

### 分支(branch)

每一个分支是提交树上的一个可变指针，指向一个提交

一个工作空间一个时刻只能有一个活动的分支

HEAD是这个活动分支的指针，意味着前文提到的git commit命令实际的作用是：

1.  创建一个以当前活动分支指向的提交为“上一个”提交的新提交

2.  将活动分支指向新创建的提交


#### 罗列可用分支: `git branch`

![](3.3-1.png)

#### 创建分支并激活: `git checkout -b <branch_name>`

![](3.3-2.png)

#### 切换活动分支: `git checkout <branch_name>`

![](3.3-3.png)

注意，切换活动分支后，会将活动分支对应的快照“检出”到工作目录

#### 删除分支: `git branch -d <branch_name>`

![](3.3-4.png)

#### 合并分支内容: `git merge <source_branch_name>`

这个命令是基于分支的协作的核心功能，假设当前分支为 <current\_branch\_name>,执行合并命令后，将 <source\_branch\_name>指向的（提交对应的）快照与<current\_branch\_name>指向的快照合并，形成一个新的提交，这个新提交的“上一个提交”为两个分支分别指向的两个提交，最后将<current\_branch\_name>指向这个新提交。

![](3.3-5.png)

### 标签(Tag)

每一个分支是提交树上的一个不可变指针，指向一个提交

#### 给某个提交打上标签 `git tag <tag_name> <commit_id>`

![](3.4-1.png)

#### 删除标签 `git tag -d <tag_name>`

![](3.4-2.png)

## 远程操作

git是一个分布式的版本控制系统，意味着没有绝对的服务端和本地的概念。对于同一个git仓库无论是服务端还是本地都拥有完整的提交树。但是一般实践中，会挑选一个机器集中存放git仓库，本地git仓库都与这个机器上的git仓库交互，这个机器就是概念上的服务端。

#### 克隆一个git仓库：`git clone </path/to/repository>`

将一个git仓库"复制"到本地，本质上是2步：

1.  以默认分支(通常是main或者master)为起点复制提交树

2.  将默认分支对应的快照检出到工作目录

3.  将被克隆仓库地址 </path/to/repository> 设置为一个名为  `origin` 的 远程仓库(remote)


#### 将远程仓库的提交树同步到本地:  `git fetch <remote> <branch>`

其中 <remote> 和 <branch>都可以省略，默认值是 origin 和 所有远程分支

#### 将远程仓库的提交树同步到本地，并更新本地工作目录: `git pull <remote> <branch>`

git pull = git fetch + git merge

<remote>和<branch>可省略，但是一般不推荐省略

#### 将本地提交树同步到远程仓库: git push <remote> <branch>

将本地以 <branch> 为起点的提交树同步到远程仓库，其中 <remote> 和 <branch>都可以省略，默认值是 origin 和 所有远程分支。

## 结语

git的本质其实就是"提交(commit)"的管理，不停的根据工作空间的变动生成新的提交，给特定的提交加标签(tag)从而形成版本，根据提交树回溯/追溯过往，与远端同步提交树等等。

一个完整的协作流程如下：

```shell
git clone https://git.example.com/user/repo.git

cd repo


# 开始开发新特性 feature
git checkout -b new-feature

# 进行若干修改....

git add .
git commit -m"完成了 feature 的开发"
git push origin new-feature

# 提交合并请求
# 根据review意见，本地修改
git add .
git commit --amend
git push -f origin new-feature

# review结束，合并请求被接受
git checkout main
git pull origin main
git branch -d new-feature
# 结束 feature 特性开发

# 开始开发其他特性 feature2 ....
```
