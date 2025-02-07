---
title: .dockerignore 和 .gitignore 的差异点
date: 2025-02-07 00:06:32
categories: [ 刨根问底 ]
tags:
  - docker
  - git
  - xops
---

[.dockerignore](https://docs.docker.com/reference/dockerfile/#dockerignore-file) 和 [.gitignore](https://git-scm.com/docs/gitignore) 语法相似，但是有两个主要区别

## 相对路径

在 _.gitignore_ 中，相对路径（例如`filename`）可匹配任意目录下的该路径；
而在 _.dockerignore_ 中，相对路径（例如`filename`）与根路径（例如`/filename`）等效，且仅匹配根目录下的路径。若要匹配任意目录下的路径，应使用`**/filename` 。

<!-- more -->

> In _.gitignore_, a relative path (e.g. `filename`) matches the path under any directory;
> while in _.dockerignore_, a relative path (e.g. `filename`) is the same as a rooted one (e.g. `/filename`) and matches only ones under the root. To match the path under any directory, `**/filename` should be used.

简单来说可以理解为：.dockerignore 相当于给每一条默认加上了 `/` 前缀的 .gitignore

## ignore 目录下的文件处理

在 _.gitignore_ 中，如果某个路径被列为忽略项（例如 `/dir`），那么该路径下的任何文件或文件夹都会被忽略，并且无法通过取反（例如 `!/dir/file`）来重新包含它们，因为它们的父目录已被排除；
而在 _.dockerignore_ 中，即使父路径被忽略，其下的文件或文件夹仍可以通过取反操作重新包含进来。

> In _.gitignore_, if a path is listed as ignored (e.g. `/dir`), then any files or folders under that path is ignored and it is not possible to re-include them via negation (e.g. `!/dir/file`) as the parent directory of them is excluded;
> while in _.dockerignore_, even if a parent path is ignored, files or folders under it can still be re-included via negation.
