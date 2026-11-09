# AdLam 的个人网站

一个使用 **Hexo + Butterfly** 构建的个人博客与作品集网站，托管在 GitHub Pages 上。


## 功能

- 技术笔记、生活日记、游戏三类文章（分类 + 标签）
- 本地搜索
- 亮色 / 暗色主题切换（默认亮色）
- 作品集页面、游戏专区、关于页
- Giscus 评论（需要手动填入配置）
- 响应式布局，适配手机
- 个性化配色与卡片样式


## 本地运行

需要 Node.js 18+。

```bash
npm install
npm run start
```

打开 <http://localhost:4000> 预览。修改文件后刷新页面即可，无需重启。


## 写一篇新文章

```bash
npx hexo new "文章标题"
```

文件会生成在 `source/_posts/` 下。在文件开头填写分类和标签：

```yaml
---
title: 文章标题
date: 2026-11-09 20:00:00
categories:
  - 技术笔记       # 可选：技术笔记 / 生活日记 / 游戏
tags:
  - Hexo
  - 教程
description: 一句话摘要，会显示在首页卡片上
---
```

正文使用 Markdown 编写。`<!-- more -->` 之前的内容会作为首页摘要。

### 文章图片

本项目开启了 `post_asset_folder`，新建文章时会同时生成同名文件夹：

```
source/_posts/
├── 我的文章.md
└── 我的文章/
    └── screenshot.png
```

在文章中这样引用：

```markdown
![截图](screenshot.png)
```


## 需要改成你自己的内容

| 内容 | 位置 |
| --- | --- |
| 站点标题、副标题、描述、网址 | `_config.yml` |
| 头像 | `source/images/avatar.svg`（替换文件即可） |
| 首页大图 | `source/images/banner.svg` |
| 文章默认封面 | `source/images/cover-1/2/3.svg` |
| 社交链接、侧边栏文案、导航 | `_config.butterfly.yml` |
| 关于页 | `source/about/index.md` |
| 作品集 | `source/portfolio/index.md` |
| 游戏页 | `source/games/index.md` |
| 自定义样式 | `source/css/custom.css` |

> 建议先把 `_config.yml` 里的 `url` 改成你自己的地址，并把 `_config.butterfly.yml` 里的邮箱地址换成真实的。

### 换成自己的图片

直接把 `source/images/` 下的 SVG 替换成同名的 JPG / PNG 也可以，但需要同步修改配置中的路径，例如：

```yaml
avatar:
  img: /images/avatar.jpg
```


## 开启评论（Giscus）

评论基于 GitHub Discussions，免费且无需服务器。

1. 把仓库设为 **Public**。
2. 在仓库 **Settings → General → Features** 中勾选 **Discussions**。
3. 安装 [giscus App](https://github.com/apps/giscus) 并授权该仓库。
4. 打开 <https://giscus.app/zh-CN>，填入仓库名 `你的用户名/仓库名`，选择 Discussion 分类。
5. 页面会生成 `data-repo-id` 和 `data-category-id`，填入 `_config.butterfly.yml`：

```yaml
giscus:
  repo: 你的用户名/仓库名
  repo_id: 生成的 repo-id
  category_id: 生成的 category-id
```

未填写之前，评论区不会显示，其余功能不受影响。


## 部署到 GitHub Pages

### 方式一：GitHub Actions（推荐）

1. 在 GitHub 新建仓库，名字必须是 `你的用户名.github.io`（例如 `adlambxd.github.io`）。
2. 把本项目推送到 `main` 分支：

```bash
git init
git add .
git commit -m "init: personal website"
git branch -M main
git remote add origin https://github.com/你的用户名/你的用户名.github.io.git
git push -u origin main
```

3. 打开仓库 **Settings → Pages**，把 **Build and deployment → Source** 设为 **GitHub Actions**。
4. 推送后 Actions 会自动构建并发布，地址为 `https://你的用户名.github.io/`。

以后每次修改内容，只需要：

```bash
git add .
git commit -m "post: 新文章"
git push
```

### 方式二：本地生成后部署（可选）

```bash
npm run clean
npm run build
```

把 `public/` 目录发布到任意静态托管服务即可。

### 绑定自己的域名（可选）

在仓库 `Settings → Pages → Custom domain` 填写域名，并在域名服务商处添加一条 CNAME 记录指向 `你的用户名.github.io`。


## 目录结构

```
.
├── _config.yml               # Hexo 站点配置
├── _config.butterfly.yml     # Butterfly 主题配置
├── package.json
├── .github/workflows/pages.yml
├── source/
│   ├── _posts/               # 文章
│   ├── about/                # 关于页
│   ├── portfolio/            # 作品集
│   ├── games/                # 游戏专区
│   ├── categories/           # 分类页
│   ├── tags/                 # 标签页
│   ├── css/custom.css        # 自定义样式
│   └── images/               # 头像、横幅、封面
└── public/                   # 构建产物（不提交）
```


## 常用命令

| 命令 | 作用 |
| --- | --- |
| `npm run start` | 本地预览 |
| `npm run clean` | 清理缓存和产物 |
| `npm run build` | 生成静态文件到 `public/` |
| `npx hexo new "标题"` | 新建文章 |
| `npx hexo new page "页面名"` | 新建页面 |


## 常见问题

**中文搜索没有结果？**
确认 `_config.yml` 中存在 `search:` 配置，且 `_config.butterfly.yml` 中 `search.use` 为 `local_search`。修改后需要重新生成。

**修改主题配置不生效？**
主题读取的是根目录的 `_config.butterfly.yml`，不是 `node_modules` 里的文件。

**文章图片不显示？**
图片要放在与文章同名的资源文件夹中，并使用相对路径引用；路径区分大小写。

**评论不显示？**
参考上面的 Giscus 步骤，确认 `repo_id`、`category_id` 已填写，且仓库已开启 Discussions。


## 许可

网站内容版权归作者所有；主题与框架遵循各自的开源许可。
