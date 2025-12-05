---
author:
  - name: HowieHz
    link: https://github.com/HowieHz
    email: ""
references:
  - name: 皓子的小站 | 在 Halo CMS 中通过模板实现随机推荐多篇文章
    link: https://howiehz.top/archives/halo-cms-thymeleaf-random-posts-recommend
---

# 实现随机推荐多篇文章

## 前言

本文实现了两个完整示例：

1. 获取多篇随机文章。
2. 在第一个示例的基础上，按当前页面文章第一个分类过滤结果。

## 完整代码示例

模板代码使用了两个配置项：

- `theme.config?.post_styles?.is_post_recommended_articles_show` 控制是否启用推荐文章
- `theme.config?.post_styles?.post_recommended_articles_count` 控制推荐文章数。

示例配置文件如下：

::: code-group

```yaml [settings.yaml]
spec:
  forms:
 - group: post_styles
   label: 文章页样式
   formSchema:
  - $formkit: checkbox
    name: is_post_recommended_articles_show
    label: 文章底部的推荐文章
    value: false
    help: 开启后将在文章底部显示推荐文章列表
  - $formkit: number
    name: post_recommended_articles_count
    if: "$is_post_recommended_articles_show === true"
    label: 推荐文章数量
    value: 3
    min: 1
    max: 10
    help: 设置文章底部显示的推荐文章数量
```

:::

模板代码示例如下：
（这段代码是设计放置在文章页模板，即 `/templates/post.html`。如果这段模板代码不是放置在文章页模板，可以将 `th:if="${#lists.size(firstPagePostList) > 1}"` 中的 `> 1` 改为 `> 0`，并且要去除 `<div th:if="${post.metadata.name != iterPost.metadata.name}"> .. </div>` 的 `th:if` 属性。具体含义会在下文解释。）

```html
<th:block
  th:if="${theme.config?.post_styles?.is_post_recommended_articles_show}"
  th:with="n=${#conversions.convert(theme.config?.post_styles?.post_recommended_articles_count, 'java.lang.Integer')},
              postFinderResult=${postFinder.list({
                size: n,
                sort: {'spec.publishTime,desc', 'metadata.creationTimestamp,asc'}
              })},
              firstPagePostList=${postFinderResult.items}"
>
  <th:block
    th:if="${#lists.size(firstPagePostList) > 1}"
    th:with="randomPageNumber=${T(java.lang.Math).floor(T(java.lang.Math).random()*(postFinderResult.totalPages)+1)},
              targetPagePostFinderResult=${postFinder.list({
                page: randomPageNumber,
                size: n,
                sort: {'spec.publishTime,desc', 'metadata.creationTimestamp,asc'}
              })},
              targetPagePostList=${targetPagePostFinderResult.items}"
  >
    <th:block th:each="iterPost: ${targetPagePostList}">
      <div th:if="${post.metadata.name != iterPost.metadata.name}">
        <time th:text="${#temporals.format(iterPost.spec?.publishTime, 'yyyy-MM-dd')}">文章发布时间替换位</time>
        <a th:href="@{${iterPost.status?.permalink}}" th:text="${iterPost.spec?.title}"
          >文章超链接替换位（显示文字为标题/超链接为文章链接）</a
        >
      </div>
    </th:block>

    <th:block
      th:if="${targetPagePostFinderResult.last and not targetPagePostFinderResult.first}"
      th:with="itemsNeeded=${n-#lists.size(targetPagePostList)}"
    >
      <!--/* 缺项则补 */-->
      <th:block th:if="${itemsNeeded > 0}">
        <th:block th:each="index : ${#numbers.sequence(0,itemsNeeded-1)}">
          <th:block th:with="iterPost=${firstPagePostList[index]}">
            <div th:if="${post.metadata.name != iterPost.metadata.name}">
              <time th:text="${#temporals.format(iterPost.spec?.publishTime, 'yyyy-MM-dd')}">文章发布时间替换位</time>
              <a th:href="@{${iterPost.status?.permalink}}" th:text="${iterPost.spec?.title}"
                >文章超链接替换位（显示文字为标题/超链接为文章链接）</a
              >
            </div>
          </th:block>
        </th:block>
      </th:block>
    </th:block>
  </th:block>
</th:block>
```

## 代码示例讲解

### 第一层

```html
<th:block
  th:if="${theme.config?.post_styles?.is_post_recommended_articles_show}"
  th:with="n=${#conversions.convert(theme.config?.post_styles?.post_recommended_articles_count, 'java.lang.Integer')},
              postFinderResult=${postFinder.list({
                size: n,
                sort: {'spec.publishTime,desc', 'metadata.creationTimestamp,asc'}
              })},
              firstPagePostList=${postFinderResult.items}"
>
  <!-- ... -->
</th:block>
```

- `th:if="${theme.config?.post_styles?.is_post_recommended_articles_show}"`：
  - 读取 `theme.config?.post_styles?.is_post_recommended_articles_show` 控制是否启用推荐文章。
- `th:with` 初始化了多个变量：
  - `n` 读取 `theme.config?.post_styles?.post_recommended_articles_count` 用于控制推荐文章数。
  - `postFinderResult` 使用 Halo CMS 提供的 Finder API 中的 [list({...})](https://docs.halo.run/developer-guide/theme/finder-apis/post/#list) 获取文章列表数据（查询参数设置了分页条数和排序字段。排序字段无要求；分页条数必须为 `n`，保证随机出的文章数接近要求数。参数含义详情请参考[官方文档](https://docs.halo.run/developer-guide/theme/finder-apis/post/#%E5%8F%82%E6%95%B0-4)），变量类型为 [ListResult\<ListedPostVo>](https://docs.halo.run/developer-guide/theme/finder-apis/post/#listresultlistedpostvo)。
  - `firstPagePostList` 保存 `postFinderResult` 的文章列表数据，变量类型为 List\<[ListedPostVo](https://docs.halo.run/developer-guide/theme/finder-apis/post/#listedpostvo)\>。

### 第二层

```html
<th:block
  th:if="${#lists.size(firstPagePostList) > 1}"
  th:with="randomPageNumber=${T(java.lang.Math).floor(T(java.lang.Math).random()*(postFinderResult.totalPages)+1)},
              targetPagePostFinderResult=${postFinder.list({
                page: randomPageNumber,
                size: n,
                sort: {'spec.publishTime,desc', 'metadata.creationTimestamp,asc'}
              })},
              targetPagePostList=${targetPagePostFinderResult.items}"
>
  <!-- ... -->
</th:block>
```

使用 `#lists.size` 检查 `firstPagePostList` 变量保存的文章数据是否大于 1，如果大于 1 则进入下一层，否则不进行文章推荐。（这段代码原本是设计放置在文章页模板，即 `/templates/post.html`。如果等于 1，说明当前站点仅有一篇文章，无需进行重复推荐。如果这段模板代码不是放置在文章页模板，可以将 `> 1` 改为 `> 0`。）

- `th:with` 初始化了多个变量：
  - `randomPageNumber`：根据一开始查询结果的总页码数，来随机生成一个数，范围是 `[1, 总页码]`。正好对应有效页码。
  - `targetPagePostFinderResult`：使用 Halo CMS 提供的 Finder API 中的 [list({...})](https://docs.halo.run/developer-guide/theme/finder-apis/post/#list) 获取文章列表数据（查询参数设置了目标页码、分页条数和排序字段。目标页码为随机出的页码 `randomPageNumber`；排序字段无要求；分页条数必须为 `n`，保证随机出的文章数接近要求数。参数含义详情请参考[官方文档](https://docs.halo.run/developer-guide/theme/finder-apis/post/#%E5%8F%82%E6%95%B0-4)），变量类型为 [ListResult\<ListedPostVo>](https://docs.halo.run/developer-guide/theme/finder-apis/post/#listresultlistedpostvo)。
  - `targetPagePostList`：保存 `targetPagePostFinderResult` 的文章列表数据，变量类型为 List\<[ListedPostVo](https://docs.halo.run/developer-guide/theme/finder-apis/post/#listedpostvo)\>。

### 第三层

#### 第三层第一部分

```html
<th:block th:each="iterPost: ${targetPagePostList}">
  <div th:if="${post.metadata.name != iterPost.metadata.name}">
    <time th:text="${#temporals.format(iterPost.spec?.publishTime, 'yyyy-MM-dd')}">文章发布时间替换位</time>
    <a th:href="@{${iterPost.status?.permalink}}" th:text="${iterPost.spec?.title}"
      >文章超链接替换位（显示文字为标题/超链接为文章链接）</a
    >
  </div>
</th:block>
```

使用 `th:each` 遍历 `targetPagePostList`。
使用 `th:if="${post.metadata.name != iterPost.metadata.name}"` 避免推荐列表中出现当前文章（这段代码原本是设计放置在文章页模板，即 `/templates/post.html`。如果这段模板代码不是放置在文章页模板，请去除这个 `th:if` 属性）。
最内层使用一个 `<time>` 标签和一个 `<a>` 标签展示文章信息。

#### 第三层第二部分

```html
<th:block
  th:if="${targetPagePostFinderResult.last and not targetPagePostFinderResult.first}"
  th:with="itemsNeeded=${n-#lists.size(targetPagePostList)}"
>
  <!-- ... -->
</th:block>
```

使用 `th:if` 检查 `targetPagePostFinderResult` 属性：如果是最后一页，而且不是第一页，就进行补偿检查。

- 为何需要进行补偿检查：如果总文章数不能被 `n` 整除导致最后一页查询结果会小于 `n`。
- 为何是 `targetPagePostFinderResult.last and not targetPagePostFinderResult.first` 为才进行补偿检查：
  - 如果查询结果不是最后一页，不进入补偿检查。
    - 不会出现不能整除导致缺少的情况。
    - 最多因为查询结果中有当前文章，然后被 `th:if="${post.metadata.name != iterPost.metadata.name}"` 过滤，导致最后展示数为 `n-1`。
    - 由于内层变量无法传递到外层，所以解决 `n-1` 会使得代码比较复杂：判断如果 `post.metadata.name == iterPost.metadata.name` 成立，就多补偿一篇。补偿的时候也要进行检查，防止多补偿的一篇文章依然为当前文章。
    - 如果这段模板代码不是放置在文章页模板，去除了 `th:if="${post.metadata.name != iterPost.metadata.name}"` 则不会出现展示数为 `n-1` 的问题。
  - 如果查询结果是最后一页，也是第一页，不进入补偿检查。
    - 说明查询结果只有一页，总文章数小于 `n`，无需进行补偿
  - 如果是最后一页，而且不是第一页，就进行补偿检查。
    `th:with` 初始化一个变量：
  - `itemsNeeded`：保存需要补偿的文章数，通过计算 `n` 减去实际查询结果。

##### 第三层第二部分内层 - 补偿显示部分

```html
<th:block th:if="${itemsNeeded > 0}">
  <th:block th:each="index : ${#numbers.sequence(0,itemsNeeded-1)}">
    <th:block th:with="iterPost=${firstPagePostList[index]}">
      <div th:if="${post.metadata.name != iterPost.metadata.name}">
        <time th:text="${#temporals.format(iterPost.spec?.publishTime, 'yyyy-MM-dd')}">文章发布时间替换位</time>
        <a th:href="@{${iterPost.status?.permalink}}" th:text="${iterPost.spec?.title}"
          >文章超链接替换位（显示文字为标题/超链接为文章链接）</a
        >
      </div>
    </th:block>
  </th:block>
</th:block>
```

如果 `itemsNeeded` 大于 0，才进行之后的补偿。
使用 `#numbers.sequence` 创建索引序列，遍历从 0 到 `itemsNeeded-1`。
复用 `firstPagePostList` 节约查询次数（这就是为什么笔者将两次查询填写了相同的 `sort` 参数）。展示 `firstPagePostList` 中索引数从 0 到 `itemsNeeded-1` 的文章数据。
使用 `th:if="${post.metadata.name != iterPost.metadata.name}"` 避免推荐列表中出现当前文章（这段代码原本是设计放置在文章页模板，即 `/templates/post.html`。如果这段模板代码不是放置在文章页模板，请去除这个 `th:if` 属性）。
最内层展示方法同第三层第一部分，使用一个 `<time>` 标签和一个 `<a>` 标签展示文章信息。

## 完整代码示例（按当前文章第一个分类过滤结果）

此处对上述代码进行了增强，仅选取当前文章第一个分类的文章。
需放置于模板 `/templates/post.html`。
后文详细讲解仅讲解新增代码。

```html
<!--/* 根据文章的第一个类别，找相同类别的文章 */-->
<!--/* 文章无分类则不进行推荐 */-->
<th:block
  th:if="${theme.config?.post_styles?.is_post_recommended_articles_show
          and not #lists.isEmpty(post.categories)}"
  th:with="firstCategoryName=${post.categories[0].metadata.name},
            n=${#conversions.convert(theme.config?.post_styles?.post_recommended_articles_count, 'java.lang.Integer')},
            postFinderResult=${postFinder.list({
              size: n,
              categoryName: firstCategoryName,
              sort: {'spec.publishTime,desc', 'metadata.creationTimestamp,asc'}
            })},
            firstPagePostList=${postFinderResult.items}"
>
  <th:block
    th:if="${#lists.size(firstPagePostList) > 1}"
    th:with="randomPageNumber=${T(java.lang.Math).floor(T(java.lang.Math).random()*(postFinderResult.totalPages)+1)},
              targetPagePostFinderResult=${postFinder.list({
                page: randomPageNumber,
                size: n,
                categoryName: firstCategoryName,
                sort: {'spec.publishTime,desc', 'metadata.creationTimestamp,asc'}
              })},
              targetPagePostList=${targetPagePostFinderResult.items}"
  >
    <th:block th:each="iterPost: ${targetPagePostList}">
      <div th:if="${post.metadata.name != iterPost.metadata.name}">
        <time th:text="${#temporals.format(iterPost.spec?.publishTime, 'yyyy-MM-dd')}">文章发布时间替换位</time>
        <a th:href="@{${iterPost.status?.permalink}}" th:text="${iterPost.spec?.title}"
          >文章超链接替换位（显示文字为标题/超链接为文章链接）</a
        >
      </div>
    </th:block>

    <th:block
      th:if="${targetPagePostFinderResult.last and not targetPagePostFinderResult.first}"
      th:with="itemsNeeded=${n-#lists.size(targetPagePostList)}"
    >
      <!--/* 缺项则补 */-->
      <th:block th:if="${itemsNeeded > 0}">
        <th:block th:each="index : ${#numbers.sequence(0,itemsNeeded-1)}">
          <th:block th:with="iterPost=${firstPagePostList[index]}">
            <div th:if="${post.metadata.name != iterPost.metadata.name}">
              <time th:text="${#temporals.format(iterPost.spec?.publishTime, 'yyyy-MM-dd')}">文章发布时间替换位</time>
              <a th:href="@{${iterPost.status?.permalink}}" th:text="${iterPost.spec?.title}"
                >文章超链接替换位（显示文字为标题/超链接为文章链接）</a
              >
            </div>
          </th:block>
        </th:block>
      </th:block>
    </th:block>
  </th:block>
</th:block>
```

## 代码示例讲解（按当前文章第一个分类过滤结果）

### 第一层（按当前文章第一个分类过滤结果）

```html
<th:block
  th:if="${theme.config?.post_styles?.is_post_recommended_articles_show
          and not #lists.isEmpty(post.categories)}"
  th:with="firstCategoryName=${post.categories[0].metadata.name},
            n=${#conversions.convert(theme.config?.post_styles?.post_recommended_articles_count, 'java.lang.Integer')},
            postFinderResult=${postFinder.list({
              size: n,
              categoryName: firstCategoryName,
              sort: {'spec.publishTime,desc', 'metadata.creationTimestamp,asc'}
            })},
            firstPagePostList=${postFinderResult.items}"
>
  <!-- ... -->
</th:block>
```

`th:if` 中添加了一个判断项：`not #lists.isEmpty(post.categories)`

- 解释：现在是按当前文章第一个分类过滤结果，因此文章无分类则不进行推荐。
- `th:with` 初始化了一个变量：
  - `firstCategoryName`：保存当前文章第一个分类的唯一标识。

### 第二层（按当前文章第一个分类过滤结果）

```html
<th:block
  th:if="${#lists.size(firstPagePostList) > 1}"
  th:with="randomPageNumber=${T(java.lang.Math).floor(T(java.lang.Math).random()*(postFinderResult.totalPages)+1)},
              targetPagePostFinderResult=${postFinder.list({
                page: randomPageNumber,
                size: n,
                categoryName: firstCategoryName,
                sort: {'spec.publishTime,desc', 'metadata.creationTimestamp,asc'}
              })},
              targetPagePostList=${targetPagePostFinderResult.items}"
>
  <!-- ... -->
</th:block>
```

- `th:with` 初始化了一个变量：
  - `targetPagePostFinderResult`：在原有的基础上新设置了分类标识，为当前文章第一个分类的唯一标识。参数含义详情请参考[官方文档](https://docs.halo.run/developer-guide/theme/finder-apis/post/#%E5%8F%82%E6%95%B0-4)。

### 第三层（按当前文章第一个分类过滤结果）

此层无变化。

## 拓展

更好的解决方案可能是实现一个 Halo CMS 插件，提供 Finder API 来显示随机文章，仅需要在原有的 [list({...})](https://docs.halo.run/developer-guide/theme/finder-apis/post/#list) 上进行拓展。
