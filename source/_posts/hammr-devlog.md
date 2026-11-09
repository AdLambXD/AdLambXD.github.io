---
title: HammrEnhance：铁砧、强化和一点赌性
date: "2026-08-27 20:00:00"
categories:
  - 开发日志
tags:
  - Minecraft
  - Paper
  - Java
description: 给下界合金装备做一套铁砧强化系统，顺便聊聊数值、失败惩罚和数据持久化。
cover: /images/minecraft-cathedral.jpg
---

HammrEnhance 是给 CubeX 写的一个 Paper 插件：玩家把下界合金装备放进铁砧，消耗材料和金币，把主附魔等级一点点强化上去。

做这个插件的原因很简单——服务器里的装备到后期就没有成长空间了。附魔满了就是满了，下界合金也只是终点。想给玩家一个还能继续折腾的东西。

<!-- more -->

## 强化流程

默认配置下，主等级最高 +10。流程大概是：

1. 把装备放进铁砧左侧。
2. 右侧放钻石（主等级低于 6 时）或下界合金锭（6 级以后）。
3. 输出栏出现预览，显示强化类型、材料和金币消耗。
4. 点击取出，扣费并执行强化。
5. 成功后装备的 Lore 会显示 `[+5(3)]` 和一条经验进度条。

`[+5(3)]` 里的 5 是当前主等级，3 是分支强化总等级。主等级到 +8 后，继续强化会进入分支强化，从当前装备类型的池子里随机抽一个附魔，比如火焰附加、亡灵杀手、节肢杀手。

## 成功率与失败

强化不是必成的。等级越高，成功率越低。失败有两个额外判定：

- 掉级：按 `level-down-chance` 概率掉一级。
- 炸铁砧：按 `explosion-chance` 概率直接把铁砧炸掉，装备掉到地上。

这两个概率都在 `config.yml` 里，服主可以自己调。默认值不算太狠，但强化到高等级的时候还是会紧张一下。

## 数据放在 PDC 里

强化数据不能只存在内存里。玩家把装备放进箱子、换世界、服务器重启，数据都得跟着走。

Paper 的 PDC（Persistent Data Container）很适合做这个。把主等级、分支等级、经验等写进物品的 PDC，装备本身走到哪，数据就跟到哪：

```java
NamespacedKey levelKey = new NamespacedKey(plugin, "enhance_level");
ItemMeta meta = item.getItemMeta();
meta.getPersistentDataContainer().set(levelKey, PersistentDataType.INTEGER, level);
item.setItemMeta(meta);
```

读取的时候做一层封装，统一处理默认值和旧版本数据迁移。这样以后加字段也不会把老装备弄坏。

## 配置和消息

数值、材料、分支池、主附魔映射、经验公式、进度条样式，全部放在 `config.yml`。所有提示、ActionBar、物品名和附魔名放在 `messages.yml`，方便改文案和颜色。

经济部分是可选的：装了 Vault 就按等级扣金币，没装就自动跳过。服务器不希望有金币系统也能用。

## 现在的状态

插件在 Paper 1.21.4+ 上跑，Java 21。源码和 Release 都在 GitHub：

<https://github.com/AdLambXD/Hammr>

后面可能会再加一些强化类型，但暂时先把现有的数值调稳。
