---
title: Markdown 写作速查手册
date: 2026-11-06 15:00:00
categories:
  - 技术笔记
tags:
  - Markdown
  - 写作
description: 写博客最常用的 Markdown 语法，收藏这一篇就够了。
---

Markdown 的语法不多，但常用的那些值得记牢。这篇当作自己的速查表。

<!-- more -->

## 标题

```markdown
# 一级标题
## 二级标题
### 三级标题
```

## 强调

```markdown
**加粗**
*斜体*
~~删除线~~
`行内代码`
```

## 列表

```markdown
- 无序列表
  - 嵌套项

1. 有序列表
2. 第二项
```

## 链接与图片

```markdown
[链接文字](https://example.com)
![图片描述](/images/example.png)
```

## 引用

```markdown
> 这是一段引用。
```

## 代码块

````markdown
```javascript
const hello = (name) => `你好，${name}`;
console.log(hello('世界'));
```
````

## 表格

```markdown
| 左对齐 | 居中 | 右对齐 |
| :--- | :---: | ---: |
| A | B | C |
```

## 分隔线

```markdown
---
```

## 小结

掌握这些，日常写博客基本够用了。更复杂的排版需求，可以直接在 Markdown 里写 HTML。
