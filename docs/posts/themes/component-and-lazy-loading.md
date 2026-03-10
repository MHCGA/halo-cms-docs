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


vite 中 `build.rollupOptions.input` 用 HTML 条目进行输入，可以将 Thymeleaf 模板融入现代前端技术，例如可以自动识别 html 文件中导入的 typescript 文件，可以在 typescript 中导入的 css 文件，达到仅需导入一个 ts，即可自动导入样式文件，自动创建 modulepreload 优化，自动分包，创建基于 hash 文件名。可以使用 [sonofmagic/tailwindcss-mangle](https://github.com/sonofmagic/tailwindcss-mangle/tree/main/packages/unplugin-tailwindcss-mangle) 插件，将模板中的 tailwindcss 类混淆缩写为 `tw-*` 的形式，优化页面和样式表体积。使用 [yoyo930021/vite-plugin-sri3](https://github.com/yoyo930021/vite-plugin-sri3/) 为资源创建 Integrity 校验，避免资源被篡改。进行[静态资源预压缩](https://howiehz.top/archives/static-resource-precompression)，将运行时压缩传输放到编译期完成，节约服务器宝贵的带宽，内存，cpu 资源。
 

页面结构
```html
<head th:remove="tag">
  <script src="/src/scripts/pages/archives.ts" type="module"></script>
</head>
<body th:remove="tag">
</body>
```

这样导入，然后在 archives.ts

```ts
import "../../styles/pages/author.css";
```


编译后的标签就会自动注入到页面的 head 标签内，类似
```html
  <head th:remove="tag">
    <meta
      name="description"
      th:attr="content=${#strings.isEmpty(theme.config?.archives_page_styles?.description) ? site?.seo?.description : theme.config?.archives_page_styles?.description}"
    />
    <th:block th:insert="~{components/list-post-simple/template :: head}"></th:block>
    <th:block th:insert="~{components/pagination/template :: head}"></th:block>
    <script type="module" crossorigin src="/themes/howiehz-higan/assets/dist/BHmhdQc.js" integrity="sha384-PwPTtDfxEYBuQdSCNhn1tZiFMQSRKJuxAFju1e7R6E19noHRQmLeM6n8jEtACXje"></script>
    <link rel="modulepreload" crossorigin href="/themes/howiehz-higan/assets/dist/ChjrFNR.js" integrity="sha384-bMWtZyBUsYF0Kuj4HeUjNMc6UkxB1YaN14SGkf1lC6i4dF5cnHV6iqvlB4e00j/h">
    <link rel="modulepreload" crossorigin href="/themes/howiehz-higan/assets/dist/B0bwbiH.js" integrity="sha384-T8y/jiyl1agXYKHGYawObiStzs56LPog4z7rHKfbRJQAq1C4AkbUHzXupqaYM8ex">
    <link rel="modulepreload" crossorigin href="/themes/howiehz-higan/assets/dist/Dt5VXXw.js" integrity="sha384-wD48Wp3oQVe0OmlsItMBQFy26LTlsWILLqvHplvzUfPVmMnoQDzJhwFEUZq1Ckvw">
    <link rel="stylesheet" crossorigin href="/themes/howiehz-higan/assets/dist/Dj6aXLG.css" integrity="sha384-KwRH8gUcOsQTRbhdWYxxqS9PbXSJT32UVLNZ+jQZq+Bmak9XB52+RuNy3MKrMgUk">
    <link rel="stylesheet" crossorigin href="/themes/howiehz-higan/assets/dist/BT7OlWZ.css" integrity="sha384-5cnXoinm1gcxq7dXPbLOLmk4FyldVH9H0425e1gJIs+9pl/NsZ3UX8MUUe/gY5fH">
    <link rel="stylesheet" crossorigin href="/themes/howiehz-higan/assets/dist/V1Vfzax.css" integrity="sha384-+PNVzMjj9tRKGQF6Db//cVCq5sX2D9olLnqidyZzgPgVTZy4Kj0oBqihwwO/xEiP">
    <link rel="stylesheet" crossorigin href="/themes/howiehz-higan/assets/dist/Ct3tGO8.css" integrity="sha384-uB//2Ny9InaMFgbYAnKwfIgUYnrH5g7dGPoQ5WzOoHSTB5WpnMH/n2OxbDYPEL24">
  </head>
```


`th:remove="tag"` 会移除 head 标签，避免 head 标签套 head 标签。

任何组件都可以有类似结构，这样 head 中导 head，就像下面

# Example Component

## Description

This is a template component that serves as a reference for creating new components in the Halo theme.
It demonstrates the standard structure and documentation format for theme components.

## Usage

Head Content (for including necessary scripts/styles)

```html
<th:block th:insert="~{components/example/template :: head}"></th:block>
```

Content Insertion

```html
<th:block th:insert="~{components/example/template :: body(parameter)}"></th:block>
```

## Parameters

- `parameter`: Description of the parameter that this component accepts.


注意

`<body th:remove="tag" th:fragment="body(categories)">` 是可行的，声明 categories 就至少要传入这个参数，你可以用 `${变量名}` 或者 `categories=${变量名}` 传入。声明这个只是表示至少要传入这些变量，在此基础上你可以传入额外变量（容易想到，不声明，`<body th:remove="tag">` 意思是你可以传入 0 或多个参数。）
