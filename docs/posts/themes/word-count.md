---
author:
  - name: HowieHz
    link: https://github.com/HowieHz
    email: ""
references:
  - name: halo-theme-higan-hz v1.49.0 字数统计实现
    link: https://github.com/HowieHz/halo-theme-higan-hz/blob/005f040d4f5c8f1a0a9a64ad69de4260ade0c276/src/templates/components/list-post-summary/template.html#L121
  - name: Liks'Blog | Halo 的文章字数统计实现
    link: https://blog.liks.space/archives/halo-post-words-count/
---

# 实现字数统计

## 单篇文章统计

::: tip 提示

`post.content?.content` 中的 `post` 变量类型为 `PostVo`，可通过 [Finder API](https://docs.halo.run/developer-guide/theme/finder-apis/post) 获取。或通过模板渲染时提供的变量获取，如[文章模板](https://docs.halo.run/developer-guide/theme/template-variables/post#post)。

:::

### 纯 Thymeleaf 模板实现

```html
<span th:text="${#strings.length(post.content?.content)}"> 文章字数替换位 </span>
```

缺点：统计的是文章内容的总字符数，不够精确（可以修订为 `#strings.length(post.content?.content)/4` 作为估计值）。

### JavaScript 实现

如果这个页面需要显示文章，你可以这么实现：

::: details 计数规则

- 自动移除 HTML 标签（包括 `<script>` 和 `<style>` 标签）
- 中文、日文、韩文等 CJK 字符按每个字符计 1。
- ASCII 连续字母/数字按 1 个单词计数。
- 标点符号和空格不计入统计。

:::

```html
<span id="post-content" class="post-content" th:utext="${post.content?.content}">文章内容替换处</span>
<span class="post-word-count">文章字数替换位</span>
<span class="post-word-count">另一个字数替换位</span>

<script>
  document.addEventListener("DOMContentLoaded", function () {
    const contentEl = document.getElementById("post-content");
    if (!contentEl) return;

    const stripped = contentEl.innerHTML
      .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, "");
    const cjk = (stripped.match(/[\u2E80-\u9FFF]/g) || []).length;
    const words = (stripped.replace(/[\u2E80-\u9FFF]/g, " ").match(/[A-Za-z0-9]+/g) || []).length;
    const count = cjk + words;

    document.querySelectorAll(".post-word-count").forEach(function (counterEl) {
      counterEl.textContent = count;
    });
  });
</script>
```

如果这个页面不需要显示文章内容，只需要取字数内容，你可以这么实现：

```html
<span class="word-counter" data-content="${post.content?.content}"> 文章字数替换位 </span>

<script>
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".word-counter[data-content]").forEach(function (el) {
      const raw = el.dataset.content;
      if (!raw) return;
      const text = raw.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, "");
      const cjk = (text.match(/[\u2E80-\u9FFF]/g) || []).length;
      const words = (text.replace(/[\u2E80-\u9FFF]/g, " ").match(/[A-Za-z0-9]+/g) || []).length;
      el.textContent = cjk + words;
    });
  });
</script>
```

缺点：

- 渲染会有延迟。
- 仅需要字数，但依然需要给用户传输完整文章内容，导致 HTML 体积膨胀。

可改进点：

- 使用 LocalStorage 缓存计算结果。

### 使用插件提供的 Finder API 实现

可使用 [API 拓展包](https://www.halo.run/store/apps/app-di1jh8gd)插件的 [extraApiStatsFinder.getPostWordCount](https://github.com/HowieHz/halo-plugin-extra-api/tree/v3.0.0?tab=readme-ov-file#%E6%96%87%E7%AB%A0%E5%AD%97%E6%95%B0%E7%BB%9F%E8%AE%A1-api) 实现此功能。

::: details 计数规则

- 自动移除 HTML 标签（包括 `<script>` 和 `<style>` 标签）。
- 中文、日文、韩文等 CJK 字符按每个字符计 1。
- ASCII 连续字母/数字按 1 个单词计数。
- 标点符号和空格不计入统计。

:::

```html
<span
  th:if="${pluginFinder.available('extra-api', '3.*')}"
  th:text="${extraApiStatsFinder.getPostWordCount({name: post.metadata.name})}"
>
  文章字数替换位
</span>
```

### 结合使用

如果安装了 [API 拓展包](https://www.halo.run/store/apps/app-di1jh8gd)插件，就使用插件提供的 Finder API，否则回退 `#strings.length` 方法。

```html
<span
  th:text="${pluginFinder.available('extra-api', '3.*') ? 
        extraApiStatsFinder.getPostWordCount({name: post.metadata.name}) : 
        #strings.length(post.content?.content)}"
>
  文章字数替换位
</span>
```

## 全站文章统计

由于模板限制，此功能只能通过插件实现。

### 插件 Finder API 实现

可使用 [API 拓展包](https://www.halo.run/store/apps/app-di1jh8gd)插件的 [extraApiStatsFinder.getPostWordCount](https://github.com/HowieHz/halo-plugin-extra-api/tree/v3.0.0?tab=readme-ov-file#%E6%96%87%E7%AB%A0%E5%AD%97%E6%95%B0%E7%BB%9F%E8%AE%A1-api) 实现此功能。

统计全部文章已发布版本的总字数：

```html
<span th:if="${pluginFinder.available('extra-api', '3.*')}" th:text="${extraApiStatsFinder.getPostWordCount()}">
  文章字数替换位
</span>
```

## 任意 HTML 字符统计

::: tip 提示

`moment.spec.content?.html` 中的 `moment` 变量类型为 `MomentVo`，为[瞬间](https://www.halo.run/store/apps/app-SnwWD)插件的数据。获取到的 `moment.spec.content?.html` 为 HTML 文本。

:::

### 纯模板实现

```html
<span th:text="${#strings.length(moment.spec.content?.html)}"> 字数替换位 </span>
```

缺点：统计的是内容的总字符数，包括 HTML 标签，不够精确（可以修订为 `#strings.length(moment.spec.content?.html)/4` 作为估计值）。

### Finder API 实现

可使用 [API 拓展包](https://www.halo.run/store/apps/app-di1jh8gd)插件实现的 [extraApiStatsFinder.getContentWordCount](https://github.com/HowieHz/halo-plugin-extra-api/tree/v3.0.0?tab=readme-ov-file#html-%E5%86%85%E5%AE%B9%E5%AD%97%E6%95%B0%E7%BB%9F%E8%AE%A1-api) API。

::: details 计数规则

- 自动移除 HTML 标签（包括 `<script>` 和 `<style>` 标签）。
- 中文、日文、韩文等 CJK 字符按每个字符计 1。
- ASCII 连续字母/数字按 1 个单词计数。
- 标点符号和空格不计入统计。

:::

```html
<span
  th:if="${pluginFinder.available('extra-api', '3.*')}"
  th:text="${extraApiStatsFinder.getContentWordCount(moment.spec.content?.html)}"
>
  字数替换位
</span>
```

### 通过 JavaScript 实现

将内容放入 `data-html`，再用脚本在浏览器端清洗文本并计算字数。

::: details 计数规则

- 自动移除 HTML 标签（包括 `<script>` 和 `<style>` 标签）。
- 中文、日文、韩文等 CJK 字符按每个字符计 1。
- ASCII 连续字母/数字按 1 个单词计数。
- 标点符号和空格不计入统计。

:::

```html
<span class="word-counter" data-html="${moment.spec.content?.html}">字数替换位</span>

<script>
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".word-counter[data-html]").forEach((el) => {
      const raw = el.dataset.html;
      if (!raw) return;

      const text = raw.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, "");
      const cjk = (text.match(/[\u2E80-\u9FFF]/g) || []).length;
      const words = (text.replace(/[\u2E80-\u9FFF]/g, " ").match(/[A-Za-z0-9]+/g) || []).length;

      el.textContent = cjk + words;
    });
  });
</script>
```

缺点：

- 渲染会有延迟。
- 仅需要字数，但依然需要给用户传输完整文章内容，导致 HTML 体积膨胀。

可改进点：

- 使用 LocalStorage 缓存计算结果。

### 结合使用两种方案

如果安装了 [API 拓展包](https://www.halo.run/store/apps/app-di1jh8gd)插件，就使用插件提供的 Finder API，否则回退 `#strings.length` 方法。

```html
<span
  th:text="${pluginFinder.available('extra-api', '3.*') ? 
        extraApiStatsFinder.getContentWordCount(moment.spec.content?.html) : 
        #strings.length(moment.spec.content?.html)}"
>
  字数替换位
</span>
```
