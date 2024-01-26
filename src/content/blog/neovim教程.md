---
title: 'Neovim浅谈与安利'
pubDatetime: 2023-12-21T08:00:00Z
description: '你应该使用这个世界上最快的编辑器（确信'
author: 'Parsifal'
tags: ['computer']
---

# Neovim的前世今生

![head](../../assets/images/nvim_totual/nvim01.jpg)

想要谈谈 Neovm，那就不得不谈谈它的发源---大名鼎鼎的Vim编辑器。

> Vim 于 1991 年由 Bram 发布，最初 Vim 模仿了 Vi 编辑器的特性，后面加以扩展，逐步添加了很多新功能。今年距离 Vim 首次发布已经快 30 年了，Vim 这个强大的编辑器仍然在不断更新，并且被许多人所使用和讨论，这也从侧面说明了 Vim 的魅力 (Vim 被网友们尊称为「编辑器之神」)。刚开始，Vim 完全由 Bram 独立开发维护，后来不断有开发者加入 Vim 的开发，并把 Vim 移植到了不同的系统平台上。有一段时间，Bram 甚至辞去了工作，全力投入到 Vim 的开发，靠着网友的捐助维持基本生活。

正因为是由 Bram 独立维护，Vim 虽然是开源软件，但是开发范式并非像现代的开源社区一样，随意进行PR就能对项目代码做修改，而是需要给Bram本人提交补丁，并决定是否把你的补丁加入核心之中。但是只有 Bram 才有权力决定什么代码可以合并入 Vim，什么样的代码不行 (Bram 就是 Vim 项目的 [BDFL](https://en.wikipedia.org/wiki/Benevolent_dictator_for_life))。Bram 对于添加新功能非常谨慎，导致之前有很多开发者提交的 patch 都没有被合并，引起了一些开发者对 Vim 开发模式的不满。这也引发了很多人对 Vim 项目未来能否可持续发展的担忧，当 Bram 去世以后，Vim 的未来会怎样？

> Neovim 项目的发起人 tarruda3 曾经给 Vim 提了一个 patch，为 Vim 增加了 job 功能，可以帮助 Vim 异步执行操作。不过遗憾的是，该 patch 不知为什么没有被 Bram 接受。因此 Tarruda 在 2014 年 fork 了 Vim，发起了 Neovim 项目，开始改变 Vim 的开发模式，遵循现代开源项目的开发流程，同时对 Vim 杂乱的代码进行了大的清理和重构，去掉了对老旧系统的支持，同时添加了新的特性。

这就是Neovim 诞生的契机。从此 Neovim 就和 Vim 走上了两条截然不同的道路。Neovim 天然就更受开源社区欢迎，只因 Neovim 就是为开源而生的。Neovim 实现了很多新特性，例如内置 terminal 和异步功能都是 Neovim 率先实现，然后 Vim 才跟进实现的，可能是 Bram 也感受到了来自 Neovim 竞争的压力，不希望自己的项目失去开发者的青睐，加快了开发的步伐。遗憾的是，Vim 重新实现的异步功能，方法命名上选择了与 Neovim 不兼容，在 Neovim 中，发起和停止 job 的方法是 jobstart() 和 jobstop()，但是 Vim 使用的是 job_start() 和 job_stop()，这也给开发者和用户造成了不必要的麻烦。

如今的 Neovim，已经原生内建了 LSP 支持，即 [Language Server Protocol](https://microsoft.github.io/language-server-protocol/), 这个协议能够帮助任何一个文本编辑器，拥有贴近 IDE 的静态检查，格式化支持。同时还支持一种很快的语法解析库 [Tree-sitter](https://tree-sitter.github.io/), 能够提供轻量，快速的基于语义的代码高亮。

在这些的基础上，Neovim 拥有一个极其活跃和庞大社区，产出了数量丰富的优秀插件，其中很多都广受好评。不夸张的说，如今 Neovim 已经不亚于一个普通的IDE了。

![Neovim效果](../../assets/images/nvim_totual/nvim02.png) 

# Neovim的简单配置

> 当你考虑要试试 Neovim 的时候，可以再来看看这个部分。

Neovim的原生语言支持是 lua，这门语言简单易学，你并不需要单独去学它，在学习配置的过程中，自然而然就会学会这门语言。

我的Neovim配置在[这里](https://github.com/Parsifa1/nvim), 配置的时候可以用作参考。

## 选择插件管理器

> 未完待续...
