---
published: 206-03-01T10:30:00Z
author:
  - name: HowieHz
    link: https://github.com/HowieHz
    email: ""
references:
  - name: 皓子的小站 | Thymeleaf 实现组件化与资源按需加载
    link: https://howiehz.top/archives/component-and-lazy-loading
---

# 实现组件化与资源按需加载

本文说明如何实现组件与资源按需加载。

现状：许多 Halo CMS 主题并未根据页面分包，也没根据组件分包。导致页面需要加载一个较大的 JS 和一个较大的 CSS 文件。并且需要通过查询参数控制版本，有 CDN 被恶意缓存的风险（例：通过请求不存在的版本号，提前覆盖对应版本资源文件）。

## 本文将实现什么

1. 按页面，可复用组件分包，并且实现按需加载。
2. 资源文件预加载，并且按 hash 命名。

## 经本文修改后的示例

参见 [HowieHz/halo-theme-modern-starter](https://github.com/HowieHz/halo-theme-modern-starter)，
由官方示例 [halo-dev/theme-modern-starter](https://github.com/halo-dev/theme-modern-starter) 修改而来。
