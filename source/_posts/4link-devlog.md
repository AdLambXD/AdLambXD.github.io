---
title: 4link：把四子棋做成一个能联机的小游戏
date: "2026-11-08 21:00:00"
categories:
  - 开发日志
tags:
  - 4link
  - TypeScript
  - 游戏
description: 从 6×6 棋盘到旋转模式、AI 和 WebRTC 联机，记录一下 4link 是怎么长成现在这样的。
cover: /images/4link.jpg
---

4link 一开始只是一个很简单的想法：把四子棋的棋盘立起来，棋子受重力往下掉，选一列落子。

后来功能越加越多，现在有 6×6 到 16×16 四种棋盘、2–6 人本地对战、三档 AI、联机、残局谜题、无尽模式和旋转模式。这篇文章记一下其中比较有意思的部分。

<!-- more -->

## 规则其实很小

棋盘是正方形的，列标从 A 到 Q（跳过 I），行号从下往上。玩家轮流选一列，棋子落到该列最底下的空位。横、竖、两条斜线，任意方向连成 4 子（6×6 / 8×8）或 5 子（12×12 / 16×16）就赢。

规则简单，但 6×6 已经被求解过了：后手必胜，完美对局会下满 36 手。所以游戏里的“困难”不是完美 AI，而是一个限深的启发式搜索。8×8 以上没有做求解，搜索按棋盘尺寸自动限深。

## AI 放在 Web Worker 里

AI 搜索会卡住主线程，尤其是 16×16。我的做法是把搜索整个扔进 Web Worker：

```ts
const worker = new Worker(new URL('./ai.worker.ts', import.meta.url), {
  type: 'module',
});

worker.postMessage({ board, player, depth });
worker.onmessage = (event) => {
  const move = event.data.move;
  // 落子
};
```

不同棋盘尺寸给不同的搜索深度，AI 不会把浏览器卡死，也不会想太久。残局模式用的是另一套精确求解器，因为残局的步数有限，可以算得更深。

## 联机：房主说了算

联机只做 1v1，有两种连接方式：

- **直连**：WebRTC，通过 Trystero 的 nostr 公共信令交换 SDP / ICE，同一 Wi-Fi 或普通 NAT 下延迟最低。
- **中继**：WebSocket 转发，适合对称 NAT、CGNAT 和公司网络。

同步模型是房主权威：访客只上报“我要下哪一列”，房主用同一套规则校验，然后广播完整局面。这样两端不会各自算出不同的结果。访客掉线后房间会保留，用同一个房间码回来就能续局。

```ts
// 访客只发列号
send({ type: 'move', column });

// 房主校验后广播完整棋盘
if (rules.isLegal(board, column, currentPlayer)) {
  const next = rules.apply(board, column, currentPlayer);
  broadcast({ type: 'state', board: next, turn: nextPlayer });
}
```

## 旋转模式

旋转模式是后来加的：每落一子，棋盘顺时针转 90°，棋子重新落到新的底部。旋转或塌落之后形成的四连，任何一方都算赢。

这个模式最麻烦的是 AI。普通棋盘上“这一步会不会成四”是静态判断，旋转模式下每一步都要完整模拟“落子 → 判胜 → 旋转 → 塌落 → 全场判胜”。所以 AI 的每一层都要跑完整流程，速度比普通模式慢不少。

## 界面和主题

界面参考了围棋棋盘的交叉点和木框，做了四套整站主题：和纸、榧木、青瓷、蓝染。主题会一起换纸张、墨色、控件和棋盘颜色，不只是换个背景。

还做了 10 种界面语言，默认跟随浏览器，手动切换后会记住。棋盘格线可以在“规整”和“手绘”之间切换，手绘版用确定性抖动绘制，不会改变交叉点位置。

## 现在的状态

4link 还在更新，最近在调联机和旋转模式的细节。源码和在线版都在这里：

- 在线玩：<https://adlambxd.github.io/4link/>
- 源码：<https://github.com/AdLambXD/4link>

如果玩的时候遇到 bug，欢迎在 GitHub 提 issue。
