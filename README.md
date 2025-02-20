# 神奇小龟的个人网站

## 参考资料

- [hexo](https://hexo.io/zh-cn/docs/)
- [icarus主题](https://ppoffice.github.io/hexo-theme-icarus/)


## 常用命令

#### 1. 创建新文章或页面

```
npx hexo new [layout] <title>
```

`layout` 包含 `post`、`page` 和 `draft`，默认为 `post`

#### 2. 发布草稿(draft)

对于 `draft`，完成编写以后，可以发布为 `post`

```
npx hexo publish <title>
```

#### 3. 本地预览服务

可以启动一个本地服务器，预览网站效果

```
npm run server
```

#### 4. 构建静态网站

```
npm run build
```
