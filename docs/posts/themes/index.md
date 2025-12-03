---
publish: false
---

# 主题开发技巧

<script setup lang="ts">
import { data as posts } from "./posts.data.ts";
import { withBase } from "vitepress";
</script>

记录 Halo CMS 主题设计与实现过程中的经验，包括视觉规范、组件构建与性能优化。

## 文章标题一览

<ul class="category-post-list">
 <li v-for="post in posts" :key="post.url">
  <a :href="withBase(post.url)">{{ post.title }}</a>
    <span v-if="post.lastUpdated" class="category-post-date">（{{ post.lastUpdated }}）</span>
 </li>
</ul>
