---
title: Hexo + Butterfly + GitHub Pages 建站记录
date: 2026-11-08 20:30:00
categories:
  - 技术笔记
tags:
  - Hexo
  - Butterfly
  - GitHub Pages
description: 从零搭建这个博客的完整过程，以及中间踩过的一些小坑。
---

把这次建站的过程记录下来，万一以后换电脑或者重装，也算有份备忘录。

<!-- more -->

## 技术选型

最终选择了这套组合：

| 组件 | 选择 | 原因 |
| --- | --- | --- |
| 静态网站生成器 | Hexo | 生态成熟，中文资料多 |
| 主题 | Butterfly | 功能齐全，方便定制 |
| 托管 | GitHub Pages | 免费，和 Git 工作流契合 |
| 评论 | Giscus | 基于 GitHub Discussions，无后端 |

## 初始化项目

```bash
mkdir blog && cd blog
npm init -y
npm install hexo hexo-server hexo-renderer-marked \
  hexo-renderer-pug hexo-renderer-stylus \
  hexo-generator-index hexo-generator-archive \
  hexo-generator-category hexo-generator-tag \
  hexo-generator-searchdb hexo-theme-butterfly
```

然后在 `_config.yml` 里设置 `theme: butterfly` 就可以使用主题了。

## 目录结构

```
.
├── _config.yml            # 站点配置
├── _config.butterfly.yml  # 主题配置
├── source/
│   ├── _posts/            # 文章
│   ├── about/             # 关于页
│   ├── portfolio/         # 作品集
│   └── games/             # 游戏专区
└── package.json
```

## 新建一篇文章

```bash
npx hexo new "文章标题"
```

生成的 Markdown 文件里，头部可以写 `categories` 和 `tags`：

```yaml
---
title: 文章标题
date: 2026-11-08 20:30:00
categories:
  - 技术笔记
tags:
  - Hexo
  - 教程
---
```

## 本地预览

```bash
npx hexo server
```

打开 `http://localhost:4000` 就能看到效果。改完文件刷新一下即可，不需要重启。

## 部署

最省心的方式是用 GitHub Actions：把源码推到 `main` 分支，Actions 自动构建并发布到 GitHub Pages。具体配置见仓库里的 `.github/workflows/pages.yml`。

## 踩过的坑

1. **主题配置不生效**：确认根目录有 `_config.butterfly.yml`，而不是只改了 `themes/` 里的文件。
2. **中文搜索失效**：`hexo-generator-searchdb` 需要在 `_config.yml` 里正确配置 `search` 字段，并在主题里开启 `local_search`。
3. **图片不显示**：开启 `post_asset_folder` 后，文章图片要放在同名的资源文件夹里，并用相对路径引用。

## 小结

整个流程其实不复杂，难的是开始动手。接下来就是慢慢写内容了。
