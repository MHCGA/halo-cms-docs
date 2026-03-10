---
published: 2026-03-10T18:40:00Z
author:
  - name: HowieHz
    link: https://github.com/HowieHz
    email: howie_hzgo@outlook.com
---

# 实现组件化与资源按需加载

## 问题背景

在 Halo CMS 主题开发中，很多主题都面临着相同的问题：

1. 资源加载方式低效：所有页面共享一个庞大的 `main.js` 和 `main.css`，即使用户只访问了某一个页面，仍然要加载所有页面的所有代码和样式。
2. 版本控制困难：很多主题通过在资源 URL 后添加查询参数（如 `?v=1.0.0`）来控制版本，这存在安全隐患。恶意用户可以通过访问不存在的版本号（如 `?v=2.0.0`）来提前缓存和污染 CDN。
3. 组件复用困难：缺少统一的组件体系，开发者很难在不同页面间复用组件，容易导致代码冗余。

### 目标方案

本文将介绍如何通过现代前端技术栈，实现：

- 按页面分包：每个页面只加载自己需要的代码和样式
- 按组件分包：可复用组件拥有独立的代码包，自动去重
- 资源按需加载：页面初始化时只加载必要资源，其他资源按需加载
- Hash 命名方案：通过内容哈希命名资源文件，彻底解决缓存问题

附加收益：

- 可扩展的前端工程能力：可接入 Tailwind 类名压缩、SRI 生成、构建期预压缩等插件能力，持续优化产物质量
- 自动生成 `modulepreload`：让浏览器提前获取潜在依赖模块，减少后续模块执行前的等待时间

## 核心概念与技术栈

### Vite 和 Rollup/Rolldown

Vite 是现代化的前端构建工具，它使用 Rollup（v8 版本之前）/Rolldown（v8 版本开始）作为生产构建器。在 Vite 中，`build.rollupOptions.input`/`build.rolldownOptions.input` 允许配置多个 HTML 入口文件，而不是单一 JS 入口。

由于本文写作时 Vite v8 尚未发布正式版，使用 Vite v7 作为示例，配置文件中使用 `build.rollupOptions.input`。如果你在使用 Vite v8 及其以后的版本，你可以使用 `build.rolldownOptions.input` 而不影响所描述的功能实现。

::: tip 这意味着什么？

之前的构建流程：`index.html` → `main.js` → 一个大的 bundle

Vite 多入口方案：`archive.html`, `post.html`, `index.html` → 独立的 bundle → 自动去重共享代码

:::

### Thymeleaf 模板

Thymeleaf 是 Halo CMS 使用的服务端模板引擎。它支持片段的概念，可以在模板中定义可复用的片段，并在多个地方插入。

## 组件化的核心设计理念

在理解具体实现前，需要掌握一个核心理念：**组件是脚本、样式、HTML 的有机整体**。

传统的前端开发中，常常这样组织代码：

```plaintext
src/
  ├── scripts/
  │   └── pagination.js     ← 分页逻辑
  ├── styles/
  │   └── pagination.css    ← 分页样式
  └── templates/
      └── pagination.html   ← 分页 HTML
```

问题是：这三个文件虽然逻辑相关，但在物理上分散开来，使用时容易遗漏其中某个文件。

而在组件化架构中，我们将它们放在一起，并通过 Thymeleaf 片段的机制**一次性导入**：

```plaintext
src/components/pagination/
  ├── main.ts        ← 脚本 + 样式导入
  ├── styles.css     ← 样式定义
  └── index.html     ← Thymeleaf 模板（两个片段）
```

使用时：

```html
<!-- 在 head 中一行代码导入脚本和样式 -->
<th:block th:insert="~{components/pagination/index :: head}"></th:block>

<!-- 在 body 中一行代码导入 HTML 结构 -->
<th:block th:insert="~{components/pagination/index :: body(...)}"></th:block>
```

这种设计带来以下好处：

- 自包含：脚本、样式、HTML 在一个目录中，开发者一目了然
- 易复用：引入此组件，只需两行 `th:insert` 代码
- 自动分包：Vite 会自动为每个组件生成独立的代码包
- 精确加载：页面只加载实际使用的组件代码，无冗余

### 集中化架构（以 [halo-dev/theme-modern-starter](https://github.com/halo-dev/theme-modern-starter/tree/c44c56c7a30b3a65ba56988a8d083d42b62b64e5/) 为例）

```plaintext
templates/
  ├── modules
  │   └── layout.html       ← 公共布局模板（根级布局片段）
  ├── post.html             ← 文章详情页模板
  └── index.html            ← 首页模板

src/
  └── main.ts              ← 单一入口文件
```

构建结果：

```plaintext
dist/
  ├── main.iife.js         ← 所有页面共享的脚本文件
  └── style.css            ← 所有页面共享的样式文件
```

劣势：无论用户访问哪个页面，都要加载整个 `main.iife.js`。

### 组件化架构（以 [HowieHz/halo-theme-higan-hz](https://github.com/HowieHz/halo-theme-higan-hz/tree/95d7b8ee1d985667e7c375c04f19889c0ac6b3ec/src/) 为例）

```plaintext
src/
├── templates/
│   ├── fragments
│   │   └── layout.html     ← 公共布局模板（根级布局片段）
│   ├── post.html           ← 包含：<script src="/src/scripts/pages/post.ts" type="module"></script>，编译后会替换为对应的样式表和脚本链接。
│   └── index.html          ← 包含：<script src="/src/scripts/pages/index.ts" type="module"></script>
├── components/
│   ├── component-a/       ← 组件 A
│   │   ├── main.ts        ← 组件 A 的脚本（包含 import "./styles.css";）
│   │   ├── styles.css     ← 组件 A 样式
│   │   └── index.html     ← 组件 A 的 HTML 文件
│   └── component-b/       ← 组件 B
│       ├── main.ts
│       ├── styles.css
│       └── index.html
├── styles/
│   ├── main.css           ← 全局样式
│   └── pages/             ← 各自的样式文件，在各自的入口文件中被导入
│       ├── post.css
│       └── index.css
└── scripts/
    ├── main.ts            ← 公共资源文件（包含 import "../styles/main.css";）
    └── pages/             ← 各自的入口文件
        ├── post.ts        ← （包含 import "../../styles/pages/post.css";）
        └── index.ts
```

构建结果（由 Vite 自动处理）：

```plaintext
dist/
  ├── BHmhdQc.js          ← 首页代码（仅此页面需要）
  ├── A1h342c.css         ← 首页样式（仅此页面需要）
  ├── 0U3f2Kd.js          ← 文章详情页代码（仅此页面需要）
  ├── QbsQr12.css         ← 文章详情页样式（仅此页面需要）
  ├── ChjrFNR.js          ← 共享代码
  ├── B0bwbiH.js          ← 组件 A 的代码
  ├── U12VxHi.css         ← 组件 A 的样式
  └── Dt5VXXw.js          ← 组件 B 的代码
```

优势：每个页面只加载自己需要的代码，共享代码自动去重。

::: tip 提示

`src/components` 文件夹下的每一个子文件夹都是一个组件，包含完整的脚本、样式、HTML 文件。  
同理，在上面的结构中，`templates/index.html` 对应 `styles/pages/index.css` 和 `scripts/pages/index.ts` 本质也是一个组件，你可以依照自己的理解改变文件组织结构。

:::

## 实现细节

### 步骤 1：项目结构设计

首先，建立以下文件结构：

```plaintext
src/
  ├── styles/
  │   ├── main.css           ← 全局样式
  │   └── pages/
  │       ├── post.css       ← 文章页样式
  │       └── index.css      ← 首页样式
  ├── scripts/
  │   ├── main.ts            ← 全局脚本
  │   └── pages/
  │       ├── post.ts        ← 文章页脚本
  │       └── index.ts       ← 首页脚本
  ├── components/
  │   ├── pagination/        ← 分页组件
  │   │   ├── main.ts
  │   │   ├── styles.css
  │   │   └── index.html
  │   ├── post-list/         ← 文章列表组件
  │   │   ├── main.ts
  │   │   ├── styles.css
  │   │   └── index.html
  │   └── header/            ← 页面头部组件（如页面导航）
  │       ├── main.ts
  │       ├── styles.css
  │       └── index.html
  └── templates/
      ├── fragments
      │   └── layout.html     ← 公共布局模板（根级布局片段）
      ├── post.html           ← 文章详情页模板
      └── index.html          ← 首页模板
```

随后在 ts 文件中导入对应 css 文件：

```ts
// src/scripts/main.ts
import "../styles/main.css";
```

```ts
// src/scripts/pages/post.ts
import "../../styles/pages/post.css";
```

```ts
// src/scripts/pages/index.ts
import "../../styles/pages/index.css";
```

```ts
// src/components/pagination/main.ts
// src/components/post-list/main.ts
// src/components/header/main.ts
import "./styles.css";
```

### 步骤 2：Vite 配置

配置 Vite 使用 HTML 入口：

```ts
// vite.config.ts
import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  // 关键配置：必须与 theme.yaml 中 metadata.name 对应
  // 如果 theme.yaml 中配置为 name: howiehz-higan
  // 这里就应该是 "/themes/howiehz-higan/"
  base: "/themes/howiehz-higan/",

  build: {
    rollupOptions: {
      // 必要配置：指定多个 HTML 文件作为入口
      input: {
        // 页面模板
        post: resolve(__dirname, "src/templates/post.html"),
        index: resolve(__dirname, "src/templates/index.html"),
        // 公共布局模板（根级布局片段）
        layout: resolve(__dirname, "src/templates/fragments/layout.html"),
        // 组件
        pagination: resolve(__dirname, "src/components/pagination/index.html"),
        "post-list": resolve(__dirname, "src/components/post-list/index.html"),
        header: resolve(__dirname, "src/components/header/index.html"),
      },
      // Vite 默认会为产物生成带内容哈希的文件名；如有命名规范需求，可按需自定义
    },
  },
});
```

### 步骤 3：创建根级布局片段

在所有页面编写之前，需要先创建一个根级的布局片段。这个片段定义了整个 HTML 的基础结构（`<html>`、`<head>`、`<body>` 等），所有具体页面都会基于这个布局：

```html
<!-- templates/fragments/layout.html -->
<html
  xmlns:th="http://www.thymeleaf.org"
  th:lang="${language ?: 'en'}"
  th:fragment="html(title, head, content, header)"
>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light dark" />
    <title th:text="${title ?: 'Halo'}"></title>
    <!-- 所有页面共享的全局脚本和全局样式 -->
    <script src="/src/scripts/main.ts" type="module"></script>

    <!-- 页面特定的 head 内容会被插入这里 -->
    <th:block th:insert="${head}"></th:block>
  </head>

  <body>
    <!-- 页面头部（导航等） -->
    <th:block th:insert="${header}"></th:block>

    <!-- 页面主体内容 -->
    <!-- 每个页面的具体内容会被插入这里 -->
    <main>
      <th:block th:insert="${content}"></th:block>
    </main>

    <!-- 页面底部 -->
    <footer>
      <!-- 底部内容 -->
    </footer>
  </body>
</html>
```

这样每个页面都复用同一个 HTML 结构，避免重复：

- `th:fragment="html(title, head, content, header)"`：定义了一个根级片段，接收**至少** 4 个参数；调用时也可额外传入具名参数（如 `language`），以控制 `lang` 等属性。
- `th:insert="${head}"`：将页面传入的 head 片段内容插入
- `th:insert="${content}"`：将页面传入的 body 片段内容插入

### 步骤 4：在页面模板文件中引入脚本

在每个 Thymeleaf 模板中，在 `<head>` 标签内引入该页面对应的脚本。Vite 会自动识别这个脚本作为该页面的构建入口：

```html
<!-- templates/index.html -->
<!DOCTYPE html>
<!-- 此处 html 标签为临时占位符，在步骤 6 会替换为根级布局片段 -->
<html>
  <head th:remove="tag">
    <!-- 关键：这行告诉 Vite 这个页面的脚本入口 -->
    <!-- Vite 会为 index.ts 及其所有依赖创建独立的代码包 -->
    <script src="/src/scripts/pages/index.ts" type="module"></script>
  </head>
  <body th:remove="tag">
    <!-- 页面内容 -->
  </body>
</html>
```

构建时流程：

1. Vite 扫描 HTML 中的 `<script type="module">` 标签
2. 发现 `src="/src/scripts/pages/index.ts"` 后，将其作为一个独立的构建入口
3. 分析 index.ts 中的所有 import（包括 CSS、其他脚本等）
4. 为该页面生成独立的代码包

::: warning 注意

除根级布局片段外，其他模板中的 `head` 与 `body` 标签都应添加 `th:remove="tag"`，以避免标签嵌套导致解析异常。

:::

::: details 用一个小例子解释 `th:remove="tag"`

在上面的例子中，我们看到 `th:remove="tag"` 的使用。

`th:remove="tag"` 是 `th:include` 弃用后的[官方解决方案](https://www.thymeleaf.org/doc/articles/thymeleaf31whatsnew.html#deprecation-of-thinclude)。

将 `th:include` 语法替换为 `th:insert` 和 `th:remove="tag"` 配合使用。

以下是一个示例：

```html
<!-- 错误做法，不带 th:remove="tag" -->
<!-- templates/index.html -->
<head>
  <th:block th:insert="~{components/pagination/index :: head}"></th:block>
</head>

<!-- 渲染后：会导致 <head><head>... 嵌套 -->
<!-- 根级布局片段的 head 标签 -->
<head>
  <!-- 页面模板片段的 head 标签 -->
  <head>
    <script type="module" crossorigin src="/themes/my-theme/assets/dist/Abc123.js"></script>
    <link rel="stylesheet" crossorigin href="/themes/my-theme/assets/dist/Def456.css" />
  </head>
  <!-- 由于出现了 </head>，剩下的内容会被浏览器移到 head 标签外，出现 head 标签提前结束的情况 -->
</head>

<!-- 正确做法：用 th:remove="tag" 移除此层 head 标签 -->
<!-- templates/index.html -->
<head th:remove="tag">
  <th:block th:insert="~{components/pagination/index :: head}"></th:block>
</head>

<!-- 渲染后：不会出现嵌套 -->
<!-- 仅保留根级布局片段的 head 标签 -->
<head>
  <script type="module" crossorigin src="/themes/my-theme/assets/dist/Abc123.js"></script>
  <link rel="stylesheet" crossorigin href="/themes/my-theme/assets/dist/Def456.css" />
</head>
```

:::

::: tip 提示

在 Thymeleaf 模板文件中添加注释，可使用[解析级注释块](https://www.thymeleaf.org/doc/tutorials/3.1/usingthymeleaf.html#thymeleaf-parser-level-comment-blocks)语法。

即 `<!--/* 注释内容 */-->` 替代 `<!-- ... -->`。这样注释内容不会出现在最终渲染结果中，可节省传输带宽。

:::

### 步骤 5：脚本中导入需要的样式和模块

在页面脚本中导入样式。这样 Vite 会自动识别和处理这些样式依赖：

```ts
// src/scripts/pages/index.ts
import "../../styles/pages/index.css";

// 导入当前页面需要的模块
// 以 Alpine 为示例
import Alpine from "alpinejs";
window.Alpine = Alpine;
Alpine.start();
```

Vite 会递归分析所有 import 依赖，自动创建代码块。如果多个页面都引入了同一个模块，Vite 会自动提取成共享的代码块。

### 步骤 6：在页面模板文件中使用根级布局片段

每个具体页面使用 `th:replace` 来应用这个布局：

```html
<!-- templates/index.html -->
<!DOCTYPE html>
<!-- th:block 替换掉原本的 html 标签 -->
<th:block
  xmlns:th="http://www.thymeleaf.org"
  th:replace="~{fragments/layout :: html(
    title = '首页 | 我的博客',
    head = ~{:: head},
    content = ~{:: body},
    header = ~{components/header/index :: body}
  )}"
>
  <!-- 该页面在布局中的 head 部分。根据上文根级布局片段定义，会注入到最终渲染的 head 标签中 -->
  <head th:remove="tag">
    <!-- 页面特定的 meta 信息 -->
    <meta name="description" content="博客首页" />

    <!-- 该页面的脚本 -->
    <script src="/src/scripts/pages/index.ts" type="module"></script>
  </head>

  <!-- 该页面在布局中的 content 部分 -->
  <body th:remove="tag">
    <div class="index-content">
      <!-- 首页内容 -->
      <!-- 省略若干内容 -->
    </div>
  </body>
</th:block>
```

构建时步骤：

1. Vite 读取 `index.html`
2. 看到 `<script src="/src/scripts/pages/index.ts" type="module"></script>`
3. 分析该脚本的依赖（导入的 CSS、其他模块等）
4. 插入对应资源的引用标签

运行时步骤：

1. Thymeleaf 渲染时，`th:replace` 会用 `layout.html` 的结构替换 `th:block` 标签
2. 传入的 `head` 和 `content` 参数会被插入到布局中对应的占位符处

### 步骤 7：创建组件和使用组件

#### 创建组件

在组件化架构中，**组件是一个整体**，包含三个部分：

1. **脚本** (`main.ts`)：组件的交互逻辑
2. **样式** (`styles.css`)：组件的外观
3. **HTML 结构** (`index.html`)：组件的标签

这三个部分紧密相关，经常需要一起被引入。通过 Thymeleaf 的片段机制，我们可以在一个模板文件中定义两个片段，分别对应 "需要在 `<head>` 引入脚本和样式" 和 "需要在 `<body>` 显示 HTML"：

```html
<!-- src/components/pagination/index.html -->
<!-- 
  片段 1：head 片段
  作用：在页面的 <head> 中引用这个片段时，会自动导入该组件的脚本/样式
  Vite 会自动识别脚本中的 import 语句，并将关联的 CSS 也一起提取
-->
<head th:remove="tag">
  <script src="main.ts" type="module"></script>
</head>
<!-- 
  片段 2：body 片段
  作用：在页面的 <body> 中引用这个片段时，会插入组件的 HTML 结构
-->
<body th:fragment="body(posts)" th:remove="tag">
  <!-- 组件 HTML 内容 -->
  <div class="pagination">
    <a th:href="@{${posts.prevUrl}}" th:if="${posts.hasPrevious()}">
      <span>上一页</span>
    </a>
    <span th:with="totalPage = ${posts.totalPages}" th:if="${posts.totalPages > 1}">[[${totalPage}]]</span>
    <a th:href="@{${posts.nextUrl}}" th:if="${posts.hasNext()}">
      <span>下一页</span>
    </a>
  </div>
</body>
```

::: tip 提示

别忘了在脚本文件中导入样式文件：

```ts
// src/components/pagination/main.ts
import "./styles.css";
```

:::

#### 组件如何运作

假设你有一个 `pagination` 组件：

```plaintext
src/components/pagination/
  ├── main.ts       ← 脚本：处理分页交互（比如动态加载）
  ├── styles.css    ← 样式：定义分页器的外观
  └── index.html    ← Thymeleaf 模板：定义两个片段（head 和 body）
```

构建时过程：

1. Vite 会识别组件 HTML 文件中的脚本，分析它的 import 语句
2. 如果脚本中有 import CSS 文件，Vite 会自动提取 CSS 并创建对应的 `<link>` 标签
3. 以上这些都在构建时自动完成，无需手工干预

构建后的组件 HTML 会变成形如：

```html
<head th:remove="tag">
  <script type="module" crossorigin src="/themes/my-theme/assets/dist/Abc123.js"></script>
  <link rel="stylesheet" crossorigin href="/themes/my-theme/assets/dist/Def456.css" />
  <!-- ↑ 自动生成，脚本和样式都有了 -->
</head>

<body th:fragment="body(posts)" th:remove="tag">
  <!-- 组件 HTML 内容 -->
  <div class="pagination">
    <!-- ... -->
  </div>
</body>
```

当在页面中使用这个组件时：

```html
<!-- 在 <head> 中引入组件 -->
<th:block th:insert="~{components/pagination/index :: head}"></th:block>
<!-- ↑ 这样做时，Thymeleaf 会在这里插入编译后的标签，自动引入组件的资源 -->

<!-- 在 <body> 中使用组件 -->
<th:block th:insert="~{components/pagination/index :: body(posts = ${posts})}"></th:block>
<!-- ↑ 这样做时，会在此处插入组件的 HTML 结构 -->
```

#### 使用组件

下面给出一个完整示例：在已使用根级布局片段的首页模板中引入组件。

```html
<!-- templates/index.html -->
<!DOCTYPE html>
<!-- th:block 替换掉原本的 html 标签 -->
<th:block
  xmlns:th="http://www.thymeleaf.org"
  th:replace="~{fragments/layout :: html(
    title = '首页 | 我的博客',
    head = ~{:: head},
    content = ~{:: body},
    header = ~{components/header/index :: body}
  )}"
>
  <!-- 该页面在布局中的 head 部分。根据上文根级布局片段定义，会注入到最终渲染的 head 标签中 -->
  <head th:remove="tag">
    <!-- 页面特定的 meta 信息 -->
    <meta name="description" content="博客首页" />

    <!-- 该页面的脚本 -->
    <script src="/src/scripts/pages/index.ts" type="module"></script>

    <!-- 该页面使用的组件的 head 片段 -->
    <!-- 你可以结合主题配置，使用 th:if，用主题配置项控制是否使用对应组件 -->
    <th:block th:insert="~{components/post-list/index :: head}"></th:block>
    <th:block th:insert="~{components/pagination/index :: head}"></th:block>
  </head>

  <!-- 该页面在布局中的 content 部分 -->
  <body th:remove="tag">
    <div class="index-content">
      <!-- 首页内容 -->
      <!-- 省略若干内容 -->

      <!-- 该页面使用的组件的 body 片段 -->
      <th:block th:insert="~{components/post-list/index :: body(posts = ${posts})}"></th:block>
      <th:block th:insert="~{components/pagination/index :: body(posts = ${posts})}"></th:block>
    </div>
  </body>
</th:block>
```

## 常见问题

### 模板文件生成位置错误

**问题**：构建后的模板文件没有生成在项目的 `templates` 文件夹内。

**原因**：Vite 的构建限制导致。

例子：如果你把 HTML 文件放置在 `src/templates/index.html`，用以下配置进行编译

```ts
// vite.config.ts
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/themes/ABC/", // ABC 替换为主题的 metadata.name
  build: {
    outDir: fileURLToPath(new URL("./templates/", import.meta.url)),
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, "src/templates/index.html"),
      },
    },
  },
});
```

最终会编译到 `templates/src/templates/index.html`

**解决方案**：使用以下自定义插件，移除多余嵌套结构

```ts
// plugins/vite-plugin-move-html.ts
import { promises as fs } from "node:fs";
import { dirname, isAbsolute, join, normalize, resolve, sep } from "node:path";

import { type Plugin } from "vite";

interface MoveHtmlOptions {
  /** Target directory, relative to project root, cannot contain `..` */
  dest: string;
  /** Flatten level, defaults to 0 (no flattening) */
  flatten?: number;
  /** Whether to delete original empty directories, defaults to true */
  removeEmptyDirs?: boolean;
}

/** Ensure path does not contain '..', and is a relative path within the project */
function assertSafeRelative(p: string) {
  if (isAbsolute(p) || normalize(p).split(sep).includes("..")) {
    throw new Error(`Disallowed path: ${p}`);
  }
  return p.replace(/^[\\/]+|[\\/]+$/g, "");
}

/** Safe join, can only be within rootDir */
/* c8 ignore next 3 */
/* istanbul ignore next */
/* codacy ignore next */
function safeJoin(rootDir: string, ...segments: string[]) {
  const target = normalize(join(rootDir, ...segments));
  // Path traversal validation has been done
  if (!target.startsWith(rootDir + sep)) {
    throw new Error(`Path traversal: ${target}`);
  }
  return target;
}

export default function moveHtmlPlugin(opts: MoveHtmlOptions): Plugin {
  // Validate and normalize dest
  const safeDest = assertSafeRelative(opts.dest);
  const flattenCount = opts.flatten ?? 0;
  const removeEmptyDirs = opts.removeEmptyDirs ?? true;

  return {
    name: "vite-plugin-move-html",
    apply: "build",
    enforce: "post",

    async writeBundle(bundleOptions, bundle) {
      // Normalize output directory, path validation has been done, safe to use resolve
      const outDir = bundleOptions.dir
        ? resolve(bundleOptions.dir)
        : bundleOptions.file
          ? dirname(resolve(bundleOptions.file))
          : (() => {
              throw new Error("Neither dir nor file specified in bundleOptions");
            })();

      // Project root absolute path
      const projectRoot = resolve(process.cwd());

      // Target directory absolute path
      const destDir = safeJoin(projectRoot, safeDest);

      const movedDirs = new Set<string>();

      for (const rawName of Object.keys(bundle)) {
        // Only care about .html, .html.gz, .html.br, .html.zst files
        if (!/(\.html)(\.gz|\.br|\.zst)?$/.test(rawName)) continue;

        // Normalize filename, '../' not allowed
        const name = normalize(rawName);
        if (name.split(sep).includes("..")) continue;

        // Source path
        const srcPath = safeJoin(outDir, name);

        // Flatten processing
        const segments = name.split(/[/\\]/);
        const drop = Math.min(flattenCount, segments.length - 1);
        const newSegments = segments.slice(drop);
        const targetPath = safeJoin(destDir, ...newSegments);

        // Ensure directory exists and move
        await fs.mkdir(dirname(targetPath), { recursive: true });
        await fs.rename(srcPath, targetPath);
        movedDirs.add(dirname(srcPath));
      }

      if (removeEmptyDirs) {
        // Delete empty directories from deep to shallow
        const sorted = Array.from(movedDirs).sort((a, b) => b.length - a.length);
        for (const dir of sorted) {
          let cur = dir;
          while (cur.startsWith(outDir + sep)) {
            try {
              await fs.rmdir(cur);
              cur = dirname(cur);
            } catch {
              break;
            }
          }
        }
      }
    },
  };
}
```

编译配置中添加插件：

```ts
// vite.config.ts
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import moveHtmlPlugin from "./plugins/vite-plugin-move-html";

export default defineConfig({
  base: "/themes/ABC/", // ABC 替换为主题的 metadata.name
  plugins: [
    moveHtmlPlugin({ dest: "templates", flatten: 2 }), // 移除两层嵌套
  ],
  build: {
    outDir: fileURLToPath(new URL("./templates/", import.meta.url)),
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, "src/templates/index.html"),
      },
    },
  },
});
```

即可解决此问题。

### 模块预加载代码重复加载

**问题**：一段 modulepreload polyfill 代码在多个页面中被重复加载。

**原因**：Vite 认为组件和页面都是单独的入口，故重复导入了此 polyfill。

**解决方案**：

首先在构建配置中禁用此 polyfill：

```ts
// vite.config.ts
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    modulePreload: {
      // https://vite.dev/config/build-options#build-modulepreload
      polyfill: false,
    },
  },
});
```

随后在公共布局模板的 `head` 标签内手动引入此 polyfill：

```html
<!--/* browser polyfill for modulepreload start */-->
<!--/* https://github.com/vitejs/vite/blob/2436afef044d90f710fdfd714488a71efdd29092/packages/vite/src/node/plugins/modulePreloadPolyfill.ts#L39 */-->
<script type="module">
  (function () {
    let e = document.createElement(`link`).relList;
    if (e && e.supports && e.supports(`modulepreload`)) return;
    for (let e of document.querySelectorAll(`link[rel="modulepreload"]`)) n(e);
    new MutationObserver((e) => {
      for (let t of e)
        if (t.type === `childList`)
          for (let e of t.addedNodes) e.tagName === `LINK` && e.rel === `modulepreload` && n(e);
    }).observe(document, {
      childList: !0,
      subtree: !0,
    });
    function t(e) {
      let t = {};
      return (
        e.integrity && (t.integrity = e.integrity),
        e.referrerPolicy && (t.referrerPolicy = e.referrerPolicy),
        e.crossOrigin === `use-credentials`
          ? (t.credentials = `include`)
          : e.crossOrigin === `anonymous`
            ? (t.credentials = `omit`)
            : (t.credentials = `same-origin`),
        t
      );
    }
    function n(e) {
      if (e.ep) return;
      e.ep = !0;
      let n = t(e);
      fetch(e.href, n);
    }
  })();
</script>
<!--/* browser polyfill for modulepreload end */-->
```

### 脚本链接或插件注入内容出现在了 HTML 文件末尾

**问题**：构建产物中，脚本引入链接或插件注入内容出现在了 HTML 文件末尾，而非 `<head>` 内。

**原因**：页面模板缺少 `<head>` 或 `<body>` 标签，Vite 找不到合适的注入点，只能将内容追加到文件末尾。

**解决方案**：确保页面模板包含完整的 `<head>` 和 `<body>` 标签，参考本文步骤 4 和步骤 6 中的示例结构。

此问题可能出现在使用 [@vitejs/plugin-legacy](https://www.npmjs.com/package/@vitejs/plugin-legacy) 插件时。

### 片段参数声明与传参方式

**片段参数声明**：`th:fragment` 的参数列表决定了该片段接受的参数数量。

- 不声明参数（如 `<body th:fragment="body">`、`<body>`）：调用时可传入任意数量的参数（包括 0 个），但片段内部无法通过名称引用它们
- 声明 N 个参数（如 `<body th:fragment="body(a, b)">`）：调用时**至少**提供对应数量的实参

**传参方式**：调用片段时，支持具名传参与位置传参两种写法，效果等价：

```html
<!-- 具名传参 -->
<th:block th:insert="~{components/xxx/index :: body(param1 = ${var1}, param2 = ${var2})}"></th:block>

<!-- 位置传参 -->
<th:block th:insert="~{components/xxx/index :: body(${var1}, ${var2})}"></th:block>
```

## 相关优化技巧

基于上述方案，以下优化手段均可低成本引入，进一步提升构建产物的质量与安全性。

### Tailwind CSS 类名混淆

使用 [unplugin-tailwindcss-mangle](https://github.com/sonofmagic/tailwindcss-mangle) 将冗长的 Tailwind 类名压缩为短的名称：

```ts
// vite.config.ts
import utwm from "unplugin-tailwindcss-mangle/vite";

export default defineConfig({
  plugins: [
    utwm(),
    // ... 其他插件
  ],
});
```

构建前：

```html
<div class="flex items-center justify-between px-4 py-2 bg-white rounded-lg shadow-md">
  <!-- 页面内容 -->
</div>
```

构建后：

```html
<div class="tw-a tw-b tw-c tw-d tw-e tw-f tw-g tw-h tw-i">
  <!-- 页面内容 -->
</div>
```

这样可以显著减小 HTML 和 CSS 文件的体积。

### 子资源完整性校验（SRI）

使用 [vite-plugin-sri3](https://github.com/yoyo930021/vite-plugin-sri3) 自动为所有资源添加 `integrity` 属性：

```ts
// vite.config.ts
import { sri } from "vite-plugin-sri3";

export default defineConfig({
  plugins: [sri()],
});
```

构建后的 HTML 会自动包含完整性属性：

```html
<script
  type="module"
  crossorigin
  src="/themes/halo-theme/assets/dist/BHmhdQc.js"
  integrity="sha384-PwPTtDfxEYBuQdSCNhn1tZiFMQSRKJuxAFju1e7R6E19noHRQmLeM6n8jEtACXje"
></script>
```

这保证了即使 CDN 被污染，浏览器也会拒绝加载被篡改的资源。

### 模块预加载

在主 JS 文件加载后，让浏览器预加载可能需要的其他模块。Vite 会自动生成 `<link rel="modulepreload">` 标签：

```html
<link
  rel="modulepreload"
  crossorigin
  href="/themes/halo-theme/assets/dist/ChjrFNR.js"
  integrity="sha384-bMWtZyBUsYF0Kuj4HeUjNMc6UkxB1YaN14SGkf1lC6i4dF5cnHV6iqvlB4e00j/h"
/>
```

这告诉浏览器提前下载这个模块，但不执行。对于多入口应用，这能有效减少主模块加载后的等待时间。Vite 构建时会自动生成这些预加载链接

### 静态资源预压缩

参考 [《实现静态资源预压缩》](./static-resource-precompression) 一文，在构建时生成 gzip、brotli 等多种压缩格式，让服务器直接提供预压缩文件，节省运行时的 CPU 和带宽。
