---
title: QWotDay：让 GitHub Actions 每天替我发一句「每日一言」
date: "2026-11-11 23:30:00"
categories:
  - 开发日志
tags:
  - QWotDay
  - GitHub Actions
  - Node.js
  - QQ空间
description: 把一个停更两年的 QQ 空间机器人重写了一遍。抓一言、算 g_tk、发说说、回读校验，顺便记几个踩到的坑。
cover: /images/qwotday.jpg
---

QWotDay 是 2024 年 9 月建的仓库，刚建完就放那儿了。README 一共两行：

```text
在QQ空间发送每日一言的机器人QQ Word of the Day

呜呜呜不会写，停更
```

11 月 11 日晚上把它捡了回来。现在它做的事很简单：每天早上 7:17，GitHub Actions 抓一条 [hitokoto](https://hitokoto.cn/) 的每日一言，按模板拼好文案，用 Cookie 发到我的 QQ 空间，45 秒后再回读一遍，确认真的发出去了。

<!-- more -->

## 为什么不用现成的

写一个能发出说说的脚本不难，难的是让它每天都有人在跑。要一台常开的机器，或者一个定时任务。

GitHub Actions 正好合适：公共仓库的额度不限，私有仓库每月也有 2000 分钟，而这个项目一个月只跑 45 分钟左右。剩下的就只是 Node 脚本的事，Node 20 自带 `fetch`，Actions 里连 `npm install` 都不用装。

## 说说到底是怎么发出去的

QQ 空间网页端没有公开 API，只能用页面在用的那几个接口。整个流程是这样：

- **g_tk**：从 Cookie 里的 `p_skey` 算出来。算法十几年没变过，就是一个 5381 的移位哈希：

```js
export function hash33(secret) {
  let hash = 5381;
  for (let i = 0; i < secret.length; i += 1) {
    hash += (hash << 5) + secret.charCodeAt(i);
  }
  return hash & 0x7fffffff;
}
```

- **qzonetoken**：先访问一次 `user.qzone.qq.com/<uin>`，从返回的 HTML 里正则抠出来。
- **发布**：POST `emotion_cgi_publish_v6`，成功会返回一个 `tid`。
- **回读**：等 45 秒，GET `emotion_cgi_msglist_v6` 取最近 5 条，把 HTML 实体、零宽字符、空白都去掉之后，再比对正文里有没有刚发的那句。

最后一步是特意加的。这类接口最大的特点是「返回成功」和「真的发出来」不是一回事——可能进了审核，也可能被风控拦下了。多等几十秒自己确认一遍，比第二天才发现没发出去要划算。

还有个一开始就绕不过去的坑：`p_skey` 是 HttpOnly，在控制台敲 `document.cookie` 是拿不到的。只能 F12 → 网络 → 随便点一个 `user.qzone.qq.com` 请求 → 请求标头里的 `cookie` 整行复制。

## 踩到的坑

### 1. 资料卡接口改版，把有效的 Cookie 判成了失效

Cookie 校验的原始逻辑是：主页里抠不到 qzonetoken 时，就去请求一次资料卡，只要返回里有 `code === 0` 或者 `data` 字段，就算登录有效。

实际跑起来却一直报「Cookie 已失效」，但手动打开空间主页明明好好的。查下来是资料卡接口改版了：老版本会把结果包一层 `code` / `data`，新版本直接返回 `uin` 和 `nickname`，两个判断全落空，于是有效的登录态被判成了过期。

修法是几种形态都认一遍，最后再退一步：看看主页 HTML 里有没有 `g_qzonetoken`、`qzreferrer`、`hostuin` 这些只有登录态才会出现的标记。

```js
const cardOk =
  card?.code === 0 ||
  Boolean(card?.data) ||
  Boolean(card?.nickname) ||
  (cardUin !== '' && cardUin === String(uin));
```

写这种非官方接口最怕的就是这种问题：不是你的代码错了，是对面悄悄改了结构。

### 2. 状态要落盘，而且不能只在成功的时候落盘

`data/state.json` 记录每天发过的 uuid 和 tid，有两个作用：一是 30 天内不重复同一句话；二是每天产生一次提交，避免公共仓库 60 天没有活动之后，定时任务被 GitHub 自动禁用。

一开始 workflow 里的「记录发布状态」这一步写的是 `if: success()`。问题在于回读校验失败、任务以非零状态退出时，这一步就不会执行——可说说其实已经发出去了。第二天抓一言时看不到这条记录，就有可能把同一句再发一次。改成 `if: always()`，只要文件有变化就一定提交。

### 3. 定时和风控

- cron 用的是 UTC，`23:17 UTC` 就是北京时间次日 07:17。整点最拥堵，容易被延迟，所以专门挑了个奇数分钟。
- 定时触发的任务会先随机睡 0–10 分钟再发，减少规律性。
- GitHub 的 runner 在海外机房，QQ 的接口对陌生 IP 本来就有风控。所以建议用小号、一天一条、只发纯文字，也不要短时间反复重试。

## 关于 Cookie 的安全

`QZONE_COOKIE` 只放在仓库的 Actions Secrets 里，不会进入 Git 内容，`git clone` 和 Fork 都拿不到。

但公共仓库的 Actions 日志是公开的，所以代码里绝不打印 Cookie，只输出 QQ 号和 `g_tk`。这一点以后改代码也得保持。想更进一步的话，可以把仓库转成 Private，或者用「公共代码仓 + 私有运行仓」的方式。

## 第一次真的跑通

11 月 11 日晚上手动触发了一次，1 分 08 秒跑完，说说也确实发出去了：

```text
2026年11月11日 星期三

生老病死，八苦之四，众生必经，江澄亦是。

—— 魔道祖师

#每日一言
```

`tid` 已经写进 `state.json`，从明天起就是 7:17 自动发了。任务失败时 GitHub 会发邮件提醒，提醒我该重新扫码登一次——Cookie 没法自动续期，这也是目前唯一的长期问题。

仓库在这里，MIT 协议，想改成自己的模板、换分类或者换时间都可以：

<https://github.com/AdLambXD/QWotDay>

以及自动发送每日一言的QQ空间账户huh

<https://user.qzone.qq.com/2707908134/main>
