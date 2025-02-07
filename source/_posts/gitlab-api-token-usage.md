---
title: gitlab api token 如何用于 git 认证
date: 2024-11-07 13:14:41
categories: ['按图索骥']
tags:
  - git
  - xops
---

基于http协议进行git同步(例如 `git clone`, `git push`等)，有时候需要进行http认证。

对于用 gitlab 托管的项目，在 http 认证方案中，可以用用户名密码作为认证方案，也可以用 gitlab api token作为认证方案。而 gitlab 官方更加推荐 api token的认证方案。

<!-- more -->

与用户名密码方案一样，api token 认证方案也是基于 [http basic auth](https://en.wikipedia.org/wiki/Basic_access_authentication)，可以通过构建如下url实现认证：

```
https://oauth2:<token>@<your gitlab host>/<your repo path>
```

其中 `<token>` 为 api token 值，例如 `yh148y8j4i5by716`。
`<your gitlab host>`为 gitlab 地址，`<your repo path>`为 repo 路径。
一个完整的例子如下:

```
https://oauth2:yh148y8j4i5by716@gitlab.example.com/foo/bar.git
```

值得注意的是：如果不想为每个repo都构建复杂的 url，还可以通过 git config 实现**统一配置**：

```
git config --global url.https://oauth2:<token>@gitlab.com.insteadof=https://gitlab.example.com
```

这样，操作(例如git clone/git push 等)所有 gitlab.example.com 下的repo，都可以直接使用不带 token 的原始url，例如:
```
git clone https://gitlab.example.com/foo/bar.git
```
