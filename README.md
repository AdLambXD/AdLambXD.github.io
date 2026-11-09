# AdLamb 的个人网站

前端、Minecraft 插件和一些照片。使用 **Hexo + Butterfly** 构建，部署在 GitHub Pages。

## 本地运行

需要 Node.js 18+。

```bash
npm install
npm run start
```

打开 <http://localhost:4000>。

## 写文章

### 方式一：写作台（推荐）

```bash
npm run write
```

会自动打开 <http://127.0.0.1:4321/>，并在需要时启动 4000 端口的预览服务。

写作台可以：

- 新建、编辑 `source/_posts` 里的文章
- 填写标题、日期、分类、标签、摘要、封面
- 上传图片（自动存到 `source/images/posts/`，并插入 Markdown）
- 实时预览 Markdown
- `Ctrl + S` 保存

保存后 Hexo 会自动刷新预览。写作台只监听本机，不要把它暴露到公网。

### 方式二：命令行

```bash
npx hexo new "文章标题"
```

在生成的文件头填写：

```yaml
---
title: 文章标题
date: "2026-11-09 20:00:00"
categories:
  - 开发日志
tags:
  - Minecraft
  - Paper
description: 一句话摘要，会显示在首页
cover: /images/photos/landscape-07.jpg
---
```

日期建议加引号，避免时区转换。正文用 Markdown 写，`<!-- more -->` 之前的内容会作为摘要。

### 方式三：在浏览器里写

在 GitHub 仓库页面按 `.`，会打开 github.dev 的网页版 VS Code。新建 `source/_posts/文章名.md`，复制上面的模板，写完提交即可。GitHub Actions 会自动构建发布。

## 目录

```
.
├── _config.yml               # Hexo 站点配置
├── _config.butterfly.yml     # 主题配置
├── tools/
│   ├── write.mjs             # 本地写作台
│   └── writer/               # 写作台界面
├── source/
│   ├── _posts/               # 文章
│   ├── about/                # 关于
│   ├── projects/             # 项目
│   ├── photos/               # 照片墙
│   ├── games/                # Minecraft / 游戏
│   ├── categories/           # 分类页
│   ├── tags/                 # 标签页
│   ├── css/custom.css        # 自定义样式
│   ├── js/photo-lightbox.js  # 照片灯箱
│   └── images/               # 头像、照片、封面
└── .github/workflows/pages.yml
```

## 改成自己的内容

| 内容 | 位置 |
| --- | --- |
| 站点标题、描述、网址 | `_config.yml` |
| 头像 | `source/images/avatar.jpg` |
| 首页大图、各页横幅 | `_config.butterfly.yml` 的 `index_img` / `archive_img` 等 |
| 社交链接、侧边栏文案 | `_config.butterfly.yml` 的 `social`、`aside` |
| 关于页 | `source/about/index.md` |
| 项目页 | `source/projects/index.md` |
| 照片页 | `source/photos/index.md` + `source/images/photos/` |
| 游戏页 | `source/games/index.md` |
| 导航菜单 | `_config.butterfly.yml` 的 `menu` |
| 自定义样式 | `source/css/custom.css` |

照片页直接写 HTML：

```html
<a class="photo-item" href="/images/photos/landscape-02.jpg">
  <img src="/images/photos/thumb-02.jpg" alt="雪后" loading="lazy">
  <span>雪后</span>
</a>
```

灯箱脚本已经通过 `_config.butterfly.yml` 的 `inject.bottom` 全局引入。

## 开启评论

评论用 Giscus，基于 GitHub Discussions，不需要服务器。

1. 仓库设为 Public。
2. 在 **Settings → General → Features** 打开 **Discussions**。
3. 安装 [giscus App](https://github.com/apps/giscus) 并授权仓库。
4. 到 <https://giscus.app/zh-CN> 填仓库名，拿到 `repo_id` 和 `category_id`。
5. 填入 `_config.butterfly.yml` 的 `giscus`。

没配置之前评论区不会显示，其他功能不受影响。

## 部署

仓库是 [AdLambXD/AdLambXD.github.io](https://github.com/AdLambXD/AdLambXD.github.io)。

```bash
git add .
git commit -m "更新内容"
git push
```

然后在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。之后每次推送到 `main`，Actions 会自动构建并发布到 <https://adlambxd.github.io/>。

旧站完整保留在仓库的 `old` 分支。如果要临时回到旧站，把 Pages 的来源改回 `old` 分支即可。

### 自定义域名

旧站曾经用过 `www.adlamb.top`。如果还想用这个域名：

1. 在 `source/` 下新建 `CNAME` 文件，内容写 `www.adlamb.top`。
2. 在域名服务商处添加 CNAME 记录，指向 `adlambxd.github.io`。
3. 在 GitHub 仓库 **Settings → Pages → Custom domain** 填写域名。

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `npm run start` | 本地预览 |
| `npm run write` | 打开写作台 |
| `npm run clean` | 清理缓存和产物 |
| `npm run build` | 生成静态文件到 `public/` |
| `npx hexo new "标题"` | 新建文章 |

## 说明

- 旧站的照片已经下载、压缩并放进仓库，不再依赖外链图床。
- 文章日期建议写成带引号的字符串，例如 `"2026-11-09 20:00:00"`。
- 部署到 GitHub Actions 后，仓库根目录的旧站文件不会影响新站，构建只上传 `public/`。
