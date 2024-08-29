#show heading: it => box(width: 100%)[
  #set text(
    font: "Noto Serif CJK SC",
    size: 14pt,
  )
  #if it.level != 1 {
    counter(heading).display()
  }
  #h(0.35em)
  #it.body
]
#show heading.where(level: 1): it => box(width: 100%)[]

#set text(font: "Noto Serif CJK SC", size: 13pt, lang: "zh", region: "cn")

#set page(width: 34em, height: auto, margin: (top: -2em, rest: 0em))
#set par(first-line-indent: 2em)
#set heading(numbering: "1.1")

= 张量笔记

== 协变矢量与逆变矢量

对于向量 $bold(r)$, 在基 $bold(g_i)$ 下，有：$bold(r) = x^1g_1 + x^2g_2 + x^3g_3$, $g_i$ 满足线性无关。

我们引入逆变基向量 $g^j$, 并定义 $g_i dot g^j = delta^j_i$。

// 我的理解：
//
// 逆变基向量，就好像是一般基向量的转置：
//
// $
// vec(y_1, y_2, y_3, delim: "[")
//   [x_1, x_2, x_3] = mat(1, 0, 0; 0, 1, 0; 0, 0, 1; delim: "[")
// $
//
// $x_1, x_2, x_3 ...$ 均是模长为 1 的向量。

从而有：

$ bold(r) = x_i g^i $
$ bold(r) = g_i x^i $
$ x_i = bold(r) dot g_i $
$ x^i = bold(r) dot g^i $

我们称 $x_i$ 为协变分量，$x^i$ 为逆变分量，$g_i$ 为协变基矢量，$g^i$ 为逆变基矢量。

== 对偶矢量

在三维空间中取一定点 O。从定点 O 出发，指向 $M$ 点的矢量ｒ，称为 $M$ 点的矢径。考虑点 $M(x^1，x^2，x^3)$ 附近的矢径微段 $d r$，显然有:

$ dif bold(r) = (diff bold(r)) / (diff x^i) dif x^i $

当令 $bold(g)_i = (diff bold(r)) / (diff x^i)$ 时：

$ dif bold(r) = bold(g)_i dif x^i $

当令 $bold(g)^i = dif x^i$ 时：

$ dif bold(r) = (diff bold(r)) / (diff x^i) bold(g)^i $

从而说明，在曲线坐标系中，$(diff bold(r)) / (diff x^i)$ 是协变基矢量, $dif x^i$ 是逆变基矢量，两者互为对偶矢量。
