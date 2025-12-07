---
published: 2025-12-04T05:29:55Z
author:
  - name: HowieHz
    link: https://github.com/HowieHz
    email: ""
references:
  - name: 皓子的小站 | 在 Halo CMS 中通过模板实现随机文章跳转功能
    link: https://howiehz.top/archives/halo-cms-thymeleaf-random-post-redirect
  - name: 皓子的小站 | Thymeleaf 随机数生成与格式化详解
    link: https://howiehz.top/archives/thymeleaf-generate-format-random-number
---

# 实现随机文章跳转功能

## 纯 Thymeleaf 模板实现

将以下代码插入模板，会创建一个指向随机文章的超链接。

```html
<th:block th:with="allPostList=${postFinder.listAll()}">
  <a
    th:if="${not #lists.isEmpty(allPostList)}"
    th:with="randomIndex=${T(java.lang.Math).floor(T(java.lang.Math).random()*#lists.size(allPostList))},
      postPermalink=${allPostList[randomIndex].status.permalink}"
    th:href="${postPermalink}"
    >随机文章</a
  >
</th:block>
```

### 原理讲解

::: tip 提示

当没有文章时（`allPostList` 为空），`randomIndex` 会是 0，访问 `allPostList[0]` 会导致错误。因此需要先使用 `th:if="${not #lists.isEmpty(allPostList)}"` 在 `allPostList` 为空时移除元素，避免产生错误。

:::

- `allPostList = ${postFinder.listAll()}`：
  - 使用 Finder API [postFinder.listAll()](https://docs.halo.run/developer-guide/theme/finder-apis/post#listall) 获取所有文章。赋值给 `allPostList`。
- `randomIndex = ${T(java.lang.Math).floor(T(java.lang.Math).random()*#lists.size(allPostList))}`：
  - 生成范围在 `[0, #lists.size(allPostList)-1]` 的整数，正好对应数组的有效索引。即这行的意思是，生成一个随机索引，赋值给 `randomIndex`。
- `postPermalink = ${allPostList[randomIndex].status.permalink}`：
  - 从 `allPostList` 数组中取出对应索引的文章数据，类型为 [ListedPostVo](https://docs.halo.run/developer-guide/theme/finder-apis/post#listedpostvo)。然后使用 `.status.permalink` 取出其超链接，赋值给 `postPermalink`。
- `th:href="${postPermalink}"`：
  - 将这个标签的 `href` 属性设置为 `postPermalink`，即刚才取出的超链接。

## 结合 JavaScript 使用

插入以下代码到模板中，之后调用 `toRandomPost()` 即可跳转到随机文章。

::: code-group

```html [window.location.href]
<th:block th:with="allPostList=${postFinder.listAll()}">
  <script
    th:if="${not #lists.isEmpty(allPostList)}"
    th:inline="javascript"
    th:with="randomIndex=${T(java.lang.Math).floor(T(java.lang.Math).random()*#lists.size(allPostList))},
      postPermalink=${allPostList[randomIndex].status.permalink}"
  >
    function toRandomPost() {
      // 将地址保存到变量中
      let permalink = /*[[${postPermalink}]]*/ "/";

      // 跳转到目标链接
      window.location.href = permalink;

      // 省略 permalink 变量，直接作为参数传入的写法：
      // window.location.href = /*[[${postPermalink}]]*/ "/";
    }
  </script>
</th:block>
```

```html [window.open]
<th:block th:with="allPostList=${postFinder.listAll()}">
  <script
    th:if="${not #lists.isEmpty(allPostList)}"
    th:inline="javascript"
    th:with="randomIndex=${T(java.lang.Math).floor(T(java.lang.Math).random()*#lists.size(allPostList))},
      postPermalink=${allPostList[randomIndex].status.permalink}"
  >
    function toRandomPost() {
      // 将地址保存到变量中
      let permalink = /*[[${postPermalink}]]*/ "/";

      // 跳转到目标链接
      window.open(permalink);

      // 省略 permalink 变量，直接作为参数传入的写法：
      // window.open(/*[[${postPermalink}]]*/ "/");
    }
  </script>
</th:block>
```

```html [pjax.loadUrl]
<th:block th:with="allPostList=${postFinder.listAll()}">
  <script
    th:if="${not #lists.isEmpty(allPostList)}"
    th:inline="javascript"
    th:with="randomIndex=${T(java.lang.Math).floor(T(java.lang.Math).random()*#lists.size(allPostList))},
      postPermalink=${allPostList[randomIndex].status.permalink}"
  >
    function toRandomPost() {
      // 将地址保存到变量中
      let permalink = /*[[${postPermalink}]]*/ "/";

      // 跳转到目标链接
      pjax.loadUrl(permalink);

      // 省略 permalink 变量，直接作为参数传入的写法：
      // pjax.loadUrl(/*[[${postPermalink}]]*/ "/");
    }
  </script>
</th:block>
```

:::

## 拓展

在上面模板代码中 `allPostList[randomIndex]` 返回的是 [ListedPostVo](https://docs.halo.run/developer-guide/theme/finder-apis/post#listedpostvo) 类型的变量。  
因此你可以拿到文章更多相关信息，如：标题，创建时间，发布时间，是否置顶，摘要内容等。

将超链接的文字替换为目标文章标题：

```html
<th:block th:with="allPostList=${postFinder.listAll()}">
  <a
    th:if="${not #lists.isEmpty(allPostList)}"
    th:with="randomIndex=${T(java.lang.Math).floor(T(java.lang.Math).random()*#lists.size(allPostList))},
      postPermalink=${allPostList[randomIndex].status.permalink},
      postTitle=${allPostList[randomIndex].spec.title}"
    th:href="${postPermalink}"
    th:text="${postTitle}"
  ></a>
</th:block>
```

弹出一个带有消息和确认按钮的警告框，显示目标文章标题：

```html
<th:block th:with="allPostList=${postFinder.listAll()}">
  <script
    th:if="${not #lists.isEmpty(allPostList)}"
    th:inline="javascript"
    th:with="randomIndex=${T(java.lang.Math).floor(T(java.lang.Math).random()*#lists.size(allPostList))},
      postPermalink=${allPostList[randomIndex].status.permalink},
      postTitle=${allPostList[randomIndex].spec.title}"
  >
    function toRandomPost() {
      alert(/*[[${postTitle}]]*/ "");

      window.location.href = /*[[${postPermalink}]]*/ "/";
    }
  </script>
</th:block>
```
