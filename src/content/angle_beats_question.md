---
title: CCPC2019 秦皇岛站 A题 Angle Beats 题解
tags:
  - math
author: Parsifal
description: 一道有趣的计算几何
modDatetime: 2024-09-19T16:45:23Z
pubDatetime: 2024-09-19T01:56:21Z
---

## 目录

## 大意

> 给2维平面上的 $n$ 个点，然后进行 $q$ 次询问，每次询问时提供一个点，询问该平面上有多少个包含该点 (指询问时提供的点) 的直角三角形。

> 题链接：https://codeforces.com/gym/102361/problem/A

## 输入

$2 ≤ n ≤ 2000$， $1 ≤ q ≤ 2000$。

## 分析

从 $n$ 最大 2000，从而排除 $O(n^3)$ 的纯暴力做法，考虑 $O(n^2logn)$ 时间复杂度。

考虑极角排序:

```cpp
friend Point in(Point a) {
    auto [x, y] = a;
    if (x < 0 || (x == 0 && y < 0))
        return Point{-x, -y};
    else
        return Point{x, y};
}
friend bool operator<(Point a, Point b) {
    auto aa = in(a), bb = in(b);
    return aa.x * bb.y < aa.y * bb.x;
}
```

![problem A](./assets/images/problemA.png)
可以直接使用 `std::map` 维护，并将 $x < 0$ 的部分都映射到平行的另一半部分，从而方便直接判断平行，并且对共线的向量直接判断相等。

### 第一部分

先假设每次询问的点 $a$ 一定是对应直角顶点。从而预处理所有点 $a$ 到点集每个点的向量，全部加入 `std::map`，然后对于每个 `std::map` 中的向量，构造对应的垂直向量`tmp`，使用 `map.count` 计算数量，时间复杂度 $O(nqlogn)$。

### 第二部分

第二部分保证每次询问的点 $a$ 一定不是对应直角顶点。我们考虑离线做法。
对于给定的点集，其中的每个点 $q$ 作为直角顶点，和其他的点均连出一条向量，将这些向量加入 `std::map` 并进行极角排序。
然后再处理每次的询问，对于每次询问的点 $a$，都和 $q$ 构造对应垂直向量并技术，此处均与第一部分一致。时间复杂度 $O(n(n+q)log(n+q))$ 。

```cpp
 // 询问边不为直角顶点
for (auto x : p) {
    mp.clear();
    for (auto y : p) {
        if (x != y) {
            mp[x - y]++;
        }
    }
    for (int i = 0; i < q; i++) {
        auto st = x - a[i];
        auto temp = Point{-st.y, st.x};
        if (mp.count(temp)) ans[i] += mp[temp];
    }
}
```

### 完整代码

```cpp
#include <bits/stdc++.h>
using i64 = long long;
const double eps = 1e-9;
constexpr i64 INF = 1e18;
struct Point {
    i64 x, y;
    Point(i64 x = 0, i64 y = 0) : x(x), y(y) {}
    // Point(double x = 0, double y = 0) : x(x), y(y) {}
    friend Point operator+(Point A, Point B) { return Point(A.x + B.x, A.y + B.y); }
    friend Point operator-(Point A, Point B) { return Point(A.x - B.x, A.y - B.y); }
    friend Point operator*(Point A, double p) { return Point(A.x * p, A.y * p); }
    friend Point operator/(Point A, double p) { return Point(A.x / p, A.y / p); }
    friend Point in(Point a) {
        auto [x, y] = a;
        if (x < 0 || (x == 0 && y < 0))
            return Point{-x, -y};
        else
            return Point{x, y};
    }
    friend bool operator<(Point a, Point b) {
        auto aa = in(a), bb = in(b);
        return aa.x * bb.y < aa.y * bb.x;
    }
    friend i64 dot(const Point& x) { return x.x * x.x + x.y * x.y; }
    friend i64 dot(Point A, Point B) { return A.x * B.x + A.y * B.y; }
    friend double det(Point A, Point B) { return A.x * B.y - B.x * A.y; }
    friend bool operator==(const Point& a, const Point& b) {
        auto dcmp = [](double x) {
            if (fabs(x) < eps)
                return 0;
            else
                return x < 0 ? -1 : 1;
        };
        return !dcmp(a.x - b.x) && !dcmp(a.y - b.y);
    }
};

inline auto read() {
    std::cin.tie(nullptr)->sync_with_stdio(false);
    return [](auto x) { return std::cin >> x, x; }(0ll);
}

void solve() {
    int n = read(), q = read();
    std::vector<Point> p(n);
    std::map<Point, int> mp;
    std::vector<Point> a(q);
    std::vector<int> ans(q);
    for (int i = 0; i < n; i++) p[i] = {read(), read()};
    for (int i = 0; i < q; i++) {
        mp.clear();
        a[i] = {read(), read()};
        // 询问边为直角点
        for (auto x : p) mp[x - a[i]]++;

        for (auto [p, y] : mp) {
            auto temp = Point{-p.y, p.x};
            if (mp.count(temp)) ans[i] += y * mp[temp];
        }
        ans[i] /= 2;
    }
    // 询问边不为直角点
    for (auto x : p) {
        mp.clear();
        for (auto y : p) {
            if (x != y) {
                mp[x - y]++;
            }
        }
        for (int i = 0; i < q; i++) {
            auto st = x - a[i];
            auto temp = Point{-st.y, st.x};
            if (mp.count(temp)) ans[i] += mp[temp];
        }
    }
    for (auto x : ans) std::cout << x << '\n';
}
signed main() { solve(); }
```
