---
publish: false
---

# 插件开发技巧

<script setup lang="ts">
import { data as posts } from "./posts.data.ts";
import { withBase } from "vitepress";
</script>

收录 Halo CMS 插件生态中的开发笔记、调试技巧、发布流程与性能优化等内容。

## 文章标题一览

<ul class="category-post-list">
 <li v-for="post in posts" :key="post.url">
  <a :href="withBase(post.url)">{{ post.title }}</a>
    <span v-if="post.lastUpdated" class="category-post-date">（{{ post.lastUpdated }}）</span>
 </li>
</ul>
