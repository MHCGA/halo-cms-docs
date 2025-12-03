---
publish: false
---

# 插件与主题协同

<script setup lang="ts">
import { data as posts } from "./posts.data.ts";
import { withBase } from "vitepress";
</script>

关注插件与主题之间的集成与协同案例，帮助站点获得更完整的体验。

## 文章标题一览

<ul class="category-post-list">
 <li v-for="post in posts" :key="post.url">
  <a :href="withBase(post.url)">{{ post.title }}</a>
    <span v-if="post.lastUpdated" class="category-post-date">（{{ post.lastUpdated }}）</span>
 </li>
</ul>
